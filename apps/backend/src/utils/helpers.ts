import { Response } from 'express';
import prisma from './prisma';

export const sendSuccess = (
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: unknown
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

// Format currency to Indian Rupees
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

// Generate a bill number: DG-2026-0001
export const generateBillNumber = (prefix: string, nextNumber: number): string => {
  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
};

// Generate customer ID: DG-CUST-0001
export const generateCustomerId = (nextNumber: number): string => {
  return `DG-CUST-${String(nextNumber).padStart(4, '0')}`;
};

// Paginate query helper
export const getPaginationParams = (query: Record<string, string>) => {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20')));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Validate and resolve active branchId
export const getValidBranchId = async (reqBranchId?: string): Promise<string> => {
  if (reqBranchId) {
    const branch = await prisma.branch.findUnique({ where: { id: reqBranchId } });
    if (branch) return branch.id;
  }
  const mainBranch = await prisma.branch.findFirst();
  if (!mainBranch) throw new Error('No active salon branch found in database');
  return mainBranch.id;
};
