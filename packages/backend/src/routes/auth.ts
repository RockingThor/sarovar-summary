import { Router, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { verifyIdToken } from "../lib/firebase.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

const verifyTokenSchema = z.object({
  token: z.string().min(1),
});

// Verify Firebase token and get/sync user
router.post(
  "/verify",
  asyncHandler(async (req, res: Response) => {
    const { token } = verifyTokenSchema.parse(req.body);

    // Verify the Firebase token
    const decodedToken = await verifyIdToken(token);

    // Find user in database by Firebase UID
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not registered in the system", 404);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hotelId: user.hotelId,
        hotel: user.hotel,
      },
    });
  })
);

// Get current user profile
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hotelId: user.hotelId,
        hotel: user.hotel,
      },
    });
  })
);

export default router;

