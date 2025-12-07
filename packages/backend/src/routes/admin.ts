import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { createFirebaseUser, deleteFirebaseUser } from "../lib/firebase.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { authenticate, requireAdmin, AuthenticatedRequest } from "../middleware/auth.js";
import { TaskStatus, UserRole } from "@prisma/client";
import { canUserTransition } from "@sarovar/shared";

const router = Router();

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
});

const updateTaskSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]),
  estimatedDate: z.string().datetime().optional().nullable(),
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

    // Get total questions count
    const totalQuestions = await prisma.question.count();

    // Get progress for each hotel
    const hotelsWithProgress = await Promise.all(
      hotels.map(async (hotel) => {
        const statusCounts = await prisma.taskProgress.groupBy({
          by: ["status"],
          where: { hotelId: hotel.id },
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

        const completedPercentage =
          totalQuestions > 0 ? Math.round((counts.DONE / totalQuestions) * 100) : 0;

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
          progressPercentage: completedPercentage,
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
      taskProgressId: q.taskProgress[0]?.id || null,
      status: q.taskProgress[0]?.status || "PENDING",
      estimatedDate: q.taskProgress[0]?.estimatedDate || null,
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

