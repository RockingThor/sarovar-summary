import express, { Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { createFirebaseUser, deleteFirebaseUser } from "../lib/firebase.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { authenticate, requireAdmin, AuthenticatedRequest } from "../middleware/auth.js";
import { TaskStatus, UserRole } from "@prisma/client";
import { canUserTransition } from "@sarovar/shared";

const router: express.Router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticate);
router.use(requireAdmin);

// Schemas
const createHotelSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(20),
  address: z.string().min(1),
  partnerEmail: z.string().email(),
  partnerName: z.string().min(1),
  // Optional hotel facility details
  allDayDining: z.string().optional(),
  restoBar: z.string().optional(),
  banquetingIndoor: z.string().optional(),
  banquetingOutdoor: z.string().optional(),
  fitnessCentre: z.string().optional(),
  kidsArea: z.string().optional(),
  spa: z.string().optional(),
});

const updateTaskSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "NOT_APPLICABLE"]),
  estimatedDate: z.string().datetime().optional().nullable(),
  completedDate: z.string().datetime().optional().nullable(),
  remark: z.string().optional().nullable(),
});

// Get all hotels with progress summary
router.get(
  "/hotels",
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const hotels = await prisma.hotel.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            taskProgress: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get all questions with their scores
    const allQuestions = await prisma.question.findMany({
      select: { id: true, scoring: true },
    });
    const totalQuestions = allQuestions.length;
    const totalScore = allQuestions.reduce((sum, q) => sum + q.scoring, 0);

    // Get progress for each hotel
    const hotelsWithProgress = await Promise.all(
      hotels.map(async (hotel) => {
        const allProgress = await prisma.taskProgress.findMany({
          where: { hotelId: hotel.id },
          include: { question: { select: { scoring: true } } },
        });

        const progressByQuestion = new Map(allProgress.map((p) => [p.questionId, p]));

        const counts = {
          PENDING: 0,
          IN_PROGRESS: 0,
          DONE: 0,
          NOT_APPLICABLE: 0,
        };
        let completedScore = 0;
        let naScore = 0;

        allQuestions.forEach((q) => {
          const progress = progressByQuestion.get(q.id);
          const status = progress?.status || "PENDING";
          counts[status]++;
          if (status === "DONE") {
            // Full score for completed tasks
            completedScore += q.scoring;
          } else if (status === "IN_PROGRESS") {
            // Half score for in-progress tasks
            completedScore += q.scoring / 2;
          } else if (status === "NOT_APPLICABLE") {
            naScore += q.scoring;
          }
        });

        // Calculate progress based on scoring (excluding N/A items)
        const applicableScore = totalScore - naScore;
        const progressPercentage = applicableScore > 0 ? Math.round((completedScore / applicableScore) * 100) : 0;

        return {
          id: hotel.id,
          name: hotel.name,
          code: hotel.code,
          address: hotel.address,
          createdAt: hotel.createdAt,
          user: hotel.user,
          totalTasks: totalQuestions,
          pendingTasks: counts.PENDING,
          inProgressTasks: counts.IN_PROGRESS,
          completedTasks: counts.DONE,
          notApplicableTasks: counts.NOT_APPLICABLE,
          totalScore,
          completedScore,
          progressPercentage,
        };
      })
    );

    res.json({
      success: true,
      data: hotelsWithProgress,
    });
  })
);

// Create new hotel with partner user
router.post(
  "/hotels",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = createHotelSchema.parse(req.body);

    // Check if hotel code already exists
    const existingHotel = await prisma.hotel.findUnique({
      where: { code: data.code },
    });

    if (existingHotel) {
      throw new AppError("Hotel with this code already exists", 400);
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.partnerEmail },
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    // Create Firebase user
    let firebaseUser;
    try {
      firebaseUser = await createFirebaseUser(data.partnerEmail);
    } catch (error) {
      console.error("Firebase user creation failed:", error);
      throw new AppError("Failed to create user account", 500);
    }

    try {
      // Create hotel and user in a transaction
      const result = await prisma.$transaction(async (tx) => {
        const hotel = await tx.hotel.create({
          data: {
            name: data.name,
            code: data.code,
            address: data.address,
            allDayDining: data.allDayDining,
            restoBar: data.restoBar,
            banquetingIndoor: data.banquetingIndoor,
            banquetingOutdoor: data.banquetingOutdoor,
            fitnessCentre: data.fitnessCentre,
            kidsArea: data.kidsArea,
            spa: data.spa,
          },
        });

        const user = await tx.user.create({
          data: {
            email: data.partnerEmail,
            name: data.partnerName,
            role: UserRole.USER,
            firebaseUid: firebaseUser.uid,
            hotelId: hotel.id,
          },
        });

        return { hotel, user };
      });

      res.status(201).json({
        success: true,
        data: {
          hotel: result.hotel,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
          },
        },
        message: "Hotel and user created successfully. Password reset email will be sent.",
      });
    } catch (error) {
      // Rollback Firebase user if database transaction fails
      await deleteFirebaseUser(firebaseUser.uid);
      throw error;
    }
  })
);

// Get hotel details with all tasks
router.get(
  "/hotels/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!hotel) {
      throw new AppError("Hotel not found", 404);
    }

    // Get all questions with their progress for this hotel
    const questions = await prisma.question.findMany({
      include: {
        category: true,
        department: true,
        taskProgress: {
          where: { hotelId: id },
        },
      },
      orderBy: {
        serialNo: "asc",
      },
    });

    const tasks = questions.map((q) => ({
      questionId: q.id,
      serialNo: q.serialNo,
      checklistItem: q.checklistItem,
      category: q.category,
      department: q.department,
      keyWords: q.keyWords,
      importance: q.importance,
      scoring: q.scoring,
      taskProgressId: q.taskProgress[0]?.id || null,
      status: q.taskProgress[0]?.status || "PENDING",
      estimatedDate: q.taskProgress[0]?.estimatedDate || null,
      completedDate: q.taskProgress[0]?.completedDate || null,
      remark: q.taskProgress[0]?.remark || null,
      updatedAt: q.taskProgress[0]?.updatedAt || null,
    }));

    res.json({
      success: true,
      data: {
        hotel,
        tasks,
      },
    });
  })
);

// Update task status (admin can move in any direction)
router.patch(
  "/tasks/:id",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const data = updateTaskSchema.parse(req.body);

    // Find existing task progress
    const existingTask = await prisma.taskProgress.findUnique({
      where: { id },
      include: {
        question: true,
      },
    });

    if (!existingTask) {
      throw new AppError("Task not found", 404);
    }

    const previousStatus = existingTask.status;

    // Update task and create audit log
    const [updatedTask] = await prisma.$transaction([
      prisma.taskProgress.update({
        where: { id },
        data: {
          status: data.status as TaskStatus,
          estimatedDate: data.estimatedDate ? new Date(data.estimatedDate) : null,
          completedDate: data.completedDate ? new Date(data.completedDate) : null,
          remark: data.remark !== undefined ? data.remark : undefined,
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
          hotelId: existingTask.hotelId,
          questionId: existingTask.questionId,
          previousStatus,
          newStatus: data.status as TaskStatus,
          changedById: req.user!.id,
          isAdminOverride: !canUserTransition(previousStatus, data.status, false),
        },
      }),
    ]);

    res.json({
      success: true,
      data: updatedTask,
    });
  })
);

// Get audit logs for a hotel
router.get(
  "/audit-logs/:hotelId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { hotelId } = req.params;

    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
    });

    if (!hotel) {
      throw new AppError("Hotel not found", 404);
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: { hotelId },
      include: {
        question: {
          select: {
            id: true,
            serialNo: true,
            checklistItem: true,
          },
        },
        changedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    res.json({
      success: true,
      data: auditLogs,
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

// Get department-wise progress (optionally filtered by hotel)
router.get(
  "/department-stats",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { hotelId } = req.query;

    const departments = await prisma.department.findMany();
    const allQuestions = await prisma.question.findMany({
      select: { id: true, scoring: true, departmentId: true },
    });

    // Filter progress by hotel if hotelId is provided
    const progressWhere = hotelId ? { hotelId: hotelId as string } : {};
    const allProgress = await prisma.taskProgress.findMany({
      where: progressWhere,
      include: { question: { select: { scoring: true, departmentId: true } } },
    });

    const progressByQuestion = new Map(allProgress.map((p) => [p.questionId, p]));

    const departmentStats = departments.map((dept) => {
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
        } else if (status === "IN_PROGRESS") {
          deptCompletedScore += q.scoring / 2;
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
    });

    res.json({
      success: true,
      data: departmentStats,
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

