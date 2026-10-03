import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, Role } from '@prisma/client';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
    branchId: string;
    employeeId?: string;
  };
}

// JWT_SECRET is validated at startup (index.ts); safe to assert non-null here.
const JWT_SECRET = process.env.JWT_SECRET as string;

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Unauthorized - No token provided', 401);
    }

    const token = authHeader.split(' ')[1];

    let decoded: { userId: string; role: Role; branchId: string; employeeId?: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as typeof decoded;
    } catch {
      throw new AppError('Unauthorized - Invalid token', 401);
    }

    // SECURITY: Re-fetch the user from the database on every authenticated request.
    // This ensures that deactivated users, role changes, or branch re-assignments
    // take effect immediately without waiting for token expiry.
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        branchId: true,
        employeeId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('Unauthorized - Account is inactive or not found', 401);
    }

    req.user = {
      id: user.id,
      role: user.role,
      branchId: user.branchId,
      employeeId: user.employeeId ?? undefined,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Unauthorized - Invalid token', 401));
    } else {
      next(error);
    }
  }
};

// Role-based access control
export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('Forbidden - Insufficient permissions', 403));
    }
    next();
  };
};

// Permission matrix per PRD
export const PERMISSIONS = {
  // Owner: full access
  OWNER: [
    'billing', 'appointments', 'customers', 'marketing',
    'reports', 'inventory', 'settings', 'employees', 'delete',
  ],
  // Manager: all except billing setup, taxes, access control
  MANAGER: [
    'billing', 'appointments', 'customers', 'marketing',
    'reports', 'inventory', 'employees',
  ],
  // Receptionist: billing, appointments, customers (no delete), marketing
  RECEPTIONIST: [
    'billing', 'appointments', 'customers', 'marketing',
  ],
  // Stylist: own appointments and performance only
  STYLIST: ['own_appointments', 'own_performance'],
};
