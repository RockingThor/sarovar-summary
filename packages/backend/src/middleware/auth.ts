import { Request, Response, NextFunction } from "express";
import { verifyIdToken } from "../lib/firebase.js";
import prisma from "../lib/prisma.js";
import { AppError } from "./errorHandler.js";
import { UserRole } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    hotelId: string | null;
    firebaseUid: string;
  };
}

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("No authentication token provided", 401);
    }

    const token = authHeader.split(" ")[1];

    // Verify Firebase token
    const decodedToken = await verifyIdToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!user) {
      throw new AppError("User not found in database", 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      hotelId: user.hotelId,
      firebaseUid: user.firebaseUid,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError("Authentication failed", 401));
    }
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new AppError("Not authenticated", 401));
  }

  if (req.user.role !== UserRole.ADMIN) {
    return next(new AppError("Admin access required", 403));
  }

  next();
}

export function requireUser(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new AppError("Not authenticated", 401));
  }

  if (req.user.role !== UserRole.USER) {
    return next(new AppError("User access required", 403));
  }

  if (!req.user.hotelId) {
    return next(new AppError("No hotel assigned to user", 403));
  }

  next();
}

