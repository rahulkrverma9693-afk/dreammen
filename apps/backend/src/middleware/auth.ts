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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: Role;
      branchId: string;
      employeeId?: string;
    };

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      branchId: decoded.branchId,
      employeeId: decoded.employeeId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
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
