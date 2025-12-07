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
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]),
  estimatedDate: z.string().datetime().optional().nullable(),
});

const taskFiltersSchema = z.object({
  departmentId: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]).optional(),
});

// Get dashboard stats
router.get(
  "/dashboard",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const hotelId = req.user!.hotelId!;

    // Get total questions
    const totalQuestions = await prisma.question.count();

    // Get status counts
    const statusCounts = await prisma.taskProgress.groupBy({
      by: ["status"],
      where: { hotelId },
      _count: true,
    });

    const counts = {
      PENDING: 0,
      IN_PROGRESS: 0,
      DONE: 0,
    };

    statusCounts.forEach((item) => {
      counts[item.status] = item._count;
    });

    // Tasks not yet in TaskProgress are considered PENDING
    const trackedTasks = counts.PENDING + counts.IN_PROGRESS + counts.DONE;
    const untrackedTasks = totalQuestions - trackedTasks;
    counts.PENDING += untrackedTasks;

    // Get department-wise progress
    const departments = await prisma.department.findMany();
    const departmentProgress = await Promise.all(
      departments.map(async (dept) => {
        const deptQuestions = await prisma.question.count({
          where: { departmentId: dept.id },
        });

        const deptStatusCounts = await prisma.taskProgress.groupBy({
          by: ["status"],
          where: {
            hotelId,
            question: { departmentId: dept.id },
          },
          _count: true,
        });

        const deptCounts = {
          PENDING: 0,
          IN_PROGRESS: 0,
          DONE: 0,
        };

        deptStatusCounts.forEach((item) => {
          deptCounts[item.status] = item._count;
        });

        const trackedDeptTasks = deptCounts.PENDING + deptCounts.IN_PROGRESS + deptCounts.DONE;
        deptCounts.PENDING += deptQuestions - trackedDeptTasks;

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          total: deptQuestions,
          pending: deptCounts.PENDING,
          inProgress: deptCounts.IN_PROGRESS,
          completed: deptCounts.DONE,
          percentage: deptQuestions > 0 ? Math.round((deptCounts.DONE / deptQuestions) * 100) : 0,
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
        progressPercentage: totalQuestions > 0 ? Math.round((counts.DONE / totalQuestions) * 100) : 0,
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

    res.json({
      success: true,
      data: {
        questionId: updatedTask.questionId,
        serialNo: updatedTask.question.serialNo,
        checklistItem: updatedTask.question.checklistItem,
        category: updatedTask.question.category,
        department: updatedTask.question.department,
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

