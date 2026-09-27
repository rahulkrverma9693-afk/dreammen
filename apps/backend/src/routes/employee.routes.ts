import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../utils/prisma';
import { sendSuccess } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// ── GET /api/employees ────────────────────────────────────────
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const { includeInactive } = req.query;
    const employees = await prisma.employee.findMany({
      where: {
        branchId: req.user.branchId,
        ...(includeInactive !== 'true' && { isActive: true }),
      },
      select: {
        id: true, name: true, phone: true, email: true,
        role: true, commissionType: true, commissionRate: true,
        monthlyTarget: true, joinDate: true, photoUrl: true, isActive: true,
      },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, employees);
  } catch (error) { next(error); }
});

// ── GET /api/employees/performance ───────────────────────────
// Query: month (YYYY-MM), employeeId
router.get('/performance', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { month } = req.query;
    const branchId = req.user.branchId;

    let startDate: Date, endDate: Date;
    if (month) {
      const [y, m] = (month as string).split('-').map(Number);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const employees = await prisma.employee.findMany({
      where: { branchId, isActive: true },
      select: {
        id: true, name: true, photoUrl: true, role: true,
        commissionType: true, commissionRate: true, monthlyTarget: true,
        billItems: {
          where: {
            bill: {
              branchId,
              createdAt: { gte: startDate, lte: endDate },
              isDraft: false,
            },
          },
          include: {
            bill: { select: { billNumber: true, paymentStatus: true } },
            service: { select: { name: true } },
          },
        },
        attendanceLogs: {
          where: { date: { gte: startDate, lte: endDate } },
          select: { clockIn: true, clockOut: true, hoursWorked: true, date: true },
        },
        appointments: {
          where: {
            branchId,
            startTime: { gte: startDate, lte: endDate },
          },
          select: { id: true, status: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Compute metrics per employee
    const performance = employees.map((emp: any) => {
      const totalRevenue = emp.billItems.reduce(
        (sum: number, item: any) => sum + Number(item.netAmount || 0), 0
      );
      const totalServices = emp.billItems.filter((i: any) => i.itemType === 'SERVICE').length;
      const commissionEarned = emp.commissionType === 'PERCENT'
        ? (totalRevenue * Number(emp.commissionRate)) / 100
        : emp.billItems.length * Number(emp.commissionRate);

      const totalHours = emp.attendanceLogs.reduce(
        (sum: number, log: any) => sum + Number(log.hoursWorked || 0), 0
      );
      const daysPresent = emp.attendanceLogs.filter((l: any) => l.clockIn).length;
      const apptCompleted = emp.appointments.filter((a: any) => a.status === 'COMPLETED').length;
      const apptTotal = emp.appointments.length;
      const targetAchieved = Number(emp.monthlyTarget) > 0
        ? (totalRevenue / Number(emp.monthlyTarget)) * 100
        : null;

      return {
        id: emp.id,
        name: emp.name,
        photoUrl: emp.photoUrl,
        role: emp.role,
        commissionType: emp.commissionType,
        commissionRate: Number(emp.commissionRate),
        monthlyTarget: Number(emp.monthlyTarget),
        totalRevenue,
        totalServices,
        commissionEarned,
        totalHours,
        daysPresent,
        apptCompleted,
        apptTotal,
        targetAchieved,
      };
    });

    return sendSuccess(res, performance);
  } catch (error) { next(error); }
});

// ── GET /api/employees/:id ────────────────────────────────────
router.get('/:id', async (req: any, res: any, next: any) => {
  try {
    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, branchId: req.user.branchId },
    });
    if (!employee) throw new AppError('Employee not found', 404);
    return sendSuccess(res, employee);
  } catch (error) { next(error); }
});

// ── POST /api/employees ───────────────────────────────────────
router.post('/', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { name, phone, email, role, commissionType, commissionRate, monthlyTarget, joinDate } = req.body;
    if (!name || !phone) throw new AppError('Name and phone are required', 400);

    const employee = await prisma.employee.create({
      data: {
        name, phone, email: email || null,
        role: role || 'STYLIST',
        commissionType: commissionType || 'PERCENT',
        commissionRate: commissionRate || 0,
        monthlyTarget: monthlyTarget || 0,
        joinDate: joinDate ? new Date(joinDate) : null,
        branchId: req.user.branchId,
      },
    });
    return sendSuccess(res, employee, 'Employee added', 201);
  } catch (error) { next(error); }
});

// ── PATCH /api/employees/:id ──────────────────────────────────
router.patch('/:id', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const existing = await prisma.employee.findFirst({
      where: { id: req.params.id, branchId: req.user.branchId },
    });
    if (!existing) throw new AppError('Employee not found', 404);

    const { name, phone, email, role, commissionType, commissionRate, monthlyTarget, joinDate, isActive } = req.body;
    const updated = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(role && { role }),
        ...(commissionType && { commissionType }),
        ...(commissionRate !== undefined && { commissionRate }),
        ...(monthlyTarget !== undefined && { monthlyTarget }),
        ...(joinDate && { joinDate: new Date(joinDate) }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return sendSuccess(res, updated, 'Employee updated');
  } catch (error) { next(error); }
});

// ── POST /api/employees/:id/clock-in ─────────────────────────
router.post('/:id/clock-in', async (req: any, res: any, next: any) => {
  try {
    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, branchId: req.user.branchId },
    });
    if (!employee) throw new AppError('Employee not found', 404);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existing = await prisma.attendanceLog.findFirst({
      where: { employeeId: req.params.id, date: today, clockOut: null },
    });
    if (existing) throw new AppError('Employee is already clocked in', 400);

    const log = await prisma.attendanceLog.create({
      data: {
        employeeId: req.params.id,
        clockIn: new Date(),
        date: today,
      },
    });
    return sendSuccess(res, log, 'Clocked in successfully', 201);
  } catch (error) { next(error); }
});

// ── POST /api/employees/:id/clock-out ────────────────────────
router.post('/:id/clock-out', async (req: any, res: any, next: any) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await prisma.attendanceLog.findFirst({
      where: { employeeId: req.params.id, date: today, clockOut: null },
    });
    if (!log) throw new AppError('No active clock-in found for today', 400);

    const clockOut = new Date();
    const hoursWorked = (clockOut.getTime() - log.clockIn.getTime()) / (1000 * 60 * 60);

    const updated = await prisma.attendanceLog.update({
      where: { id: log.id },
      data: {
        clockOut,
        hoursWorked: Math.round(hoursWorked * 100) / 100,
      },
    });
    return sendSuccess(res, updated, 'Clocked out successfully');
  } catch (error) { next(error); }
});

// ── GET /api/employees/:id/attendance ────────────────────────
router.get('/:id/attendance', async (req: any, res: any, next: any) => {
  try {
    const { month } = req.query;
    let startDate: Date, endDate: Date;
    if (month) {
      const [y, m] = (month as string).split('-').map(Number);
      startDate = new Date(y, m - 1, 1);
      endDate = new Date(y, m, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const logs = await prisma.attendanceLog.findMany({
      where: {
        employeeId: req.params.id,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'desc' },
    });
    return sendSuccess(res, logs);
  } catch (error) { next(error); }
});

export default router;