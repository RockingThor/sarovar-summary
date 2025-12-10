import express, { Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { authenticate, requireUser, AuthenticatedRequest } from "../middleware/auth.js";
import { TaskStatus } from "@prisma/client";
import { canUserTransition } from "@sarovar/shared";

const router: express.Router = express.Router();

// Apply authentication and user check to all routes
router.use(authenticate);
router.use(requireUser);

// Schemas
const updateTaskSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "NOT_APPLICABLE"]),
  estimatedDate: z.string().datetime().optional().nullable(),
});

const taskFiltersSchema = z.object({
  departmentId: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "NOT_APPLICABLE"]).optional(),
});

// Get dashboard stats
router.get(
  "/dashboard",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const hotelId = req.user!.hotelId!;

    // Get all questions with their scores
    const allQuestions = await prisma.question.findMany({
      select: { id: true, scoring: true, departmentId: true },
    });
    const totalQuestions = allQuestions.length;
    const totalScore = allQuestions.reduce((sum, q) => sum + q.scoring, 0);

    // Get all task progress for this hotel
    const allProgress = await prisma.taskProgress.findMany({
      where: { hotelId },
      include: { question: { select: { scoring: true, departmentId: true } } },
    });

    // Calculate status counts and scores
    const counts = {
      PENDING: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      NOT_APPLICABLE: 0,
    };
    let completedScore = 0;
    let naScore = 0;

    const progressByQuestion = new Map(allProgress.map((p) => [p.questionId, p]));

    allQuestions.forEach((q) => {
      const progress = progressByQuestion.get(q.id);
      const status = progress?.status || "PENDING";
      counts[status]++;
      if (status === "DONE") {
        completedScore += q.scoring;
      } else if (status === "NOT_APPLICABLE") {
        naScore += q.scoring;
      }
    });

    // Calculate progress based on scoring (excluding N/A items)
    const applicableScore = totalScore - naScore;
    const progressPercentage = applicableScore > 0 ? Math.round((completedScore / applicableScore) * 100) : 0;

    // Get department-wise progress
    const departments = await prisma.department.findMany();
    const departmentProgress = await Promise.all(
      departments.map(async (dept) => {
        const deptQuestions = allQuestions.filter((q) => q.departmentId === dept.id);
        const deptTotalScore = deptQuestions.reduce((sum, q) => sum + q.scoring, 0);

        const deptCounts = {
          PENDING: 0,
          IN_PROGRESS: 0,
          DONE: 0,
          NOT_APPLICABLE: 0,
        };
        let deptCompletedScore = 0;
        let deptNaScore = 0;

        deptQuestions.forEach((q) => {
          const progress = progressByQuestion.get(q.id);
          const status = progress?.status || "PENDING";
          deptCounts[status]++;
          if (status === "DONE") {
            deptCompletedScore += q.scoring;
          } else if (status === "NOT_APPLICABLE") {
            deptNaScore += q.scoring;
          }
        });

        const deptApplicableScore = deptTotalScore - deptNaScore;

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          total: deptQuestions.length,
          pending: deptCounts.PENDING,
          inProgress: deptCounts.IN_PROGRESS,
          completed: deptCounts.DONE,
          notApplicable: deptCounts.NOT_APPLICABLE,
          totalScore: deptTotalScore,
          completedScore: deptCompletedScore,
          percentage: deptApplicableScore > 0 ? Math.round((deptCompletedScore / deptApplicableScore) * 100) : 0,
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalTasks: totalQuestions,
        pendingTasks: counts.PENDING,
        inProgressTasks: counts.IN_PROGRESS,
        completedTasks: counts.DONE,
        notApplicableTasks: counts.NOT_APPLICABLE,
        totalScore,
        completedScore,
        progressPercentage,
        departmentProgress,
      },
    });
  })
);

// Get all tasks with filters
router.get(
  "/tasks",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const hotelId = req.user!.hotelId!;
    const filters = taskFiltersSchema.parse(req.query);

    // Build where clause for questions
    const questionWhere: Record<string, unknown> = {};
    if (filters.departmentId) {
      questionWhere.departmentId = filters.departmentId;
    }
    if (filters.categoryId) {
      questionWhere.categoryId = filters.categoryId;
    }

    // Get all questions with their progress
    const questions = await prisma.question.findMany({
      where: questionWhere,
      include: {
        category: true,
        department: true,
        taskProgress: {
          where: { hotelId },
        },
      },
      orderBy: {
        serialNo: "asc",
      },
    });

    // Map to task format
    let tasks = questions.map((q) => ({
      questionId: q.id,
      serialNo: q.serialNo,
      checklistItem: q.checklistItem,
      category: q.category,
      department: q.department,
      keyWords: q.keyWords,
      importance: q.importance,
      scoring: q.scoring,
      taskProgressId: q.taskProgress[0]?.id || null,
      status: (q.taskProgress[0]?.status || "PENDING") as TaskStatus,
      estimatedDate: q.taskProgress[0]?.estimatedDate || null,
      updatedAt: q.taskProgress[0]?.updatedAt || null,
    }));

    // Filter by status if provided
    if (filters.status) {
      tasks = tasks.filter((t) => t.status === filters.status);
    }

    res.json({
      success: true,
      data: tasks,
    });
  })
);

// Update task status (users can only move forward)
router.patch(
  "/tasks/:questionId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { questionId } = req.params;
    const hotelId = req.user!.hotelId!;
    const data = updateTaskSchema.parse(req.body);

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new AppError("Question not found", 404);
    }

    // Get current task progress
    const existingTask = await prisma.taskProgress.findUnique({
      where: {
        hotelId_questionId: {
          hotelId,
          questionId,
        },
      },
    });

    const currentStatus = existingTask?.status || "PENDING";

    // Validate status transition (users can only move forward)
    if (!canUserTransition(currentStatus, data.status, false)) {
      throw new AppError(
        "Invalid status transition. You can only move tasks forward (Pending → In Progress → Done)",
        400
      );
    }

    // Require estimated date when moving to IN_PROGRESS
    if (data.status === "IN_PROGRESS" && !data.estimatedDate && !existingTask?.estimatedDate) {
      throw new AppError("Estimated completion date is required when starting a task", 400);
    }

    // Upsert task progress and create audit log
    const [updatedTask] = await prisma.$transaction([
      prisma.taskProgress.upsert({
        where: {
          hotelId_questionId: {
            hotelId,
            questionId,
          },
        },
        create: {
          hotelId,
          questionId,
          status: data.status as TaskStatus,
          estimatedDate: data.estimatedDate ? new Date(data.estimatedDate) : null,
          updatedById: req.user!.id,
        },
        update: {
          status: data.status as TaskStatus,
          estimatedDate: data.estimatedDate ? new Date(data.estimatedDate) : undefined,
          updatedById: req.user!.id,
        },
        include: {
          question: {
            include: {
              category: true,
              department: true,
            },
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          hotelId,
          questionId,
          previousStatus: existingTask?.status || null,
          newStatus: data.status as TaskStatus,
          changedById: req.user!.id,
          isAdminOverride: false,
        },
      }),
    ]);

    // Get the full question with extra fields
    const fullQuestion = await prisma.question.findUnique({
      where: { id: questionId },
    });

    res.json({
      success: true,
      data: {
        questionId: updatedTask.questionId,
        serialNo: updatedTask.question.serialNo,
        checklistItem: updatedTask.question.checklistItem,
        category: updatedTask.question.category,
        department: updatedTask.question.department,
        keyWords: fullQuestion?.keyWords || [],
        importance: fullQuestion?.importance || "Med",
        scoring: fullQuestion?.scoring || 1.0,
        taskProgressId: updatedTask.id,
        status: updatedTask.status,
        estimatedDate: updatedTask.estimatedDate,
        updatedAt: updatedTask.updatedAt,
      },
    });
  })
);

// Get all departments
router.get(
  "/departments",
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const departments = await prisma.department.findMany({
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: departments,
    });
  })
);

// Get all categories
router.get(
  "/categories",
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: categories,
    });
  })
);

export default router;

