import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../utils/prisma';
import { sendSuccess } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// ── Rate Limiter for public endpoints ─────────────────────────────────────
// Prevents abuse of the unauthenticated booking endpoint (fake bookings, scraping).
const publicBookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 booking attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many booking requests. Please try again in 15 minutes.' },
});

const publicServicesLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 service list requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Public Endpoints (No Auth Needed for Customer Online Booking) ──
router.get('/public-services', publicServicesLimiter, async (req: any, res: any, next: any) => {
  try {
    const branch = await prisma.branch.findFirst({ where: { bookingEnabled: true } });
    if (!branch) return sendSuccess(res, []);
    const services = await prisma.service.findMany({
      where: { branchId: branch.id, isActive: true },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, services);
  } catch (error) { next(error); }
});

router.post('/public-booking', publicBookingLimiter, async (req: any, res: any, next: any) => {

  try {
    const { name, phone, email, serviceId, employeeId, startTime, notes } = req.body;

    // Basic validation
    if (!name || !phone || !serviceId || !startTime) {
      throw new AppError('Name, phone, service, and start time are required', 400);
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      throw new AppError('A valid 10-digit phone number is required', 400);
    }

    // SECURITY: Use a stable branch lookup — findFirst() is non-deterministic in multi-branch.
    // For a single-branch salon the first branch is acceptable; in multi-branch deployments
    // pass a branchSlug query param and look up by slug instead.
    const branch = await prisma.branch.findFirst({
      where: { bookingEnabled: true },
    });
    if (!branch) throw new AppError('Online booking is currently unavailable', 503);

    // Validate that the service exists and belongs to this branch
    const service = await prisma.service.findFirst({
      where: { id: serviceId, branchId: branch.id, isActive: true },
    });
    if (!service) throw new AppError('Selected service is not available', 400);

    const duration = service.duration || 45;
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60 * 1000);

    if (isNaN(start.getTime())) {
      throw new AppError('Invalid start time format', 400);
    }
    if (start < new Date()) {
      throw new AppError('Cannot book an appointment in the past', 400);
    }

    // SECURITY: Check for employee booking conflicts before creating anything.
    // Canonical overlap: existing.startTime < requestedEnd AND existing.endTime > requestedStart
    if (employeeId) {
      const employeeConflict = await prisma.appointment.findFirst({
        where: {
          branchId: branch.id,
          employeeId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });
      if (employeeConflict) {
        throw new AppError('This stylist is already booked for the selected time slot', 409);
      }
    }

    // Upsert customer (idempotent)
    let customer = await prisma.customer.findFirst({
      where: { phone: phoneDigits, branchId: branch.id },
    });
    if (!customer) {
      const count = await prisma.customer.count({ where: { branchId: branch.id } });
      const customerId = `DG-CUST-${String(count + 1).padStart(4, '0')}`;
      customer = await prisma.customer.create({
        data: {
          customerId,
          name,
          phone: phoneDigits,
          email: email || undefined,
          branchId: branch.id,
        },
      });
    }

    const appt = await prisma.appointment.create({
      data: {
        branchId: branch.id,
        customerId: customer.id,
        employeeId: employeeId || undefined,
        status: 'CONFIRMED',
        source: 'ONLINE',
        startTime: start,
        endTime: end,
        notes: notes ? `[Online Booking] ${notes}` : '[Online Booking]',
        services: {
          create: [{ serviceId: service.id, duration }],
        },
      },
      include: {
        customer: true,
        services: { include: { service: true } },
      },
    });

    return sendSuccess(res, appt, 'Appointment booked successfully!', 201);
  } catch (error) { next(error); }
});

router.use(authenticate);

// ── GET /api/appointments ─────────────────────────────────────
// Query: date (YYYY-MM-DD), employeeId, chairId, status, view (day|week|month)
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const { date, from, to, employeeId, chairId, status } = req.query;
    const branchId = req.user.branchId;

    // Build date range
    let startDate: Date, endDate: Date;
    if (from && to) {
      startDate = new Date(from as string);
      endDate = new Date(to as string);
      endDate.setHours(23, 59, 59, 999);
    } else if (date) {
      startDate = new Date(date as string);
      endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default: today
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    const where: any = {
      branchId,
      startTime: { gte: startDate, lte: endDate },
    };
    if (employeeId) where.employeeId = employeeId;
    if (chairId) where.chairId = chairId;
    if (status) where.status = status;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, phone: true, photoUrl: true } },
        employee: { select: { id: true, name: true, photoUrl: true, role: true } },
        chair: { select: { id: true, name: true, type: true } },
        services: {
          include: {
            service: { select: { id: true, name: true, duration: true, price: true } },
          },
        },
        bill: { select: { id: true, billNumber: true, paymentStatus: true, netPayable: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return sendSuccess(res, appointments);
  } catch (error) { next(error); }
});

// ── GET /api/appointments/today-stats ────────────────────────
router.get('/today-stats', async (req: any, res: any, next: any) => {
  try {
    const branchId = req.user.branchId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [total, confirmed, inProgress, completed, noShow, cancelled] = await Promise.all([
      prisma.appointment.count({ where: { branchId, startTime: { gte: todayStart, lte: todayEnd } } }),
      prisma.appointment.count({ where: { branchId, status: 'CONFIRMED', startTime: { gte: todayStart, lte: todayEnd } } }),
      prisma.appointment.count({ where: { branchId, status: 'IN_PROGRESS', startTime: { gte: todayStart, lte: todayEnd } } }),
      prisma.appointment.count({ where: { branchId, status: 'COMPLETED', startTime: { gte: todayStart, lte: todayEnd } } }),
      prisma.appointment.count({ where: { branchId, status: 'NO_SHOW', startTime: { gte: todayStart, lte: todayEnd } } }),
      prisma.appointment.count({ where: { branchId, status: 'CANCELLED', startTime: { gte: todayStart, lte: todayEnd } } }),
    ]);

    return sendSuccess(res, { total, confirmed, inProgress, completed, noShow, cancelled });
  } catch (error) { next(error); }
});

// ── GET /api/appointments/chairs ─────────────────────────────
router.get('/chairs', async (req: any, res: any, next: any) => {
  try {
    const chairs = await prisma.chair.findMany({
      where: { branchId: req.user.branchId, isActive: true },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, chairs);
  } catch (error) { next(error); }
});

// ── GET /api/appointments/:id ─────────────────────────────────
router.get('/:id', async (req: any, res: any, next: any) => {
  try {
    const appt = await prisma.appointment.findFirst({
      where: { id: req.params.id, branchId: req.user.branchId },
      include: {
        customer: true,
        employee: { select: { id: true, name: true, photoUrl: true, role: true } },
        chair: true,
        services: { include: { service: true } },
        bill: true,
      },
    });
    if (!appt) throw new AppError('Appointment not found', 404);
    return sendSuccess(res, appt);
  } catch (error) { next(error); }
});

// ── POST /api/appointments ────────────────────────────────────
router.post('/', async (req: any, res: any, next: any) => {
  try {
    const {
      customerId, employeeId, chairId,
      startTime, endTime, notes, source,
      serviceIds,
    } = req.body;

    if (!customerId || !startTime || !endTime) {
      throw new AppError('customerId, startTime, endTime are required', 400);
    }

    // Validate customer belongs to branch
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, branchId: req.user.branchId },
    });
    if (!customer) throw new AppError('Customer not found', 404);

    // ── SECURITY: Conflict checks must always scope to the same branch (tenant isolation) ──
    // Canonical overlap formula: existing.startTime < requestedEnd AND existing.endTime > requestedStart

    if (chairId) {
      // Validate chair belongs to this branch
      const chair = await prisma.chair.findFirst({
        where: { id: chairId, branchId: req.user.branchId, isActive: true },
      });
      if (!chair) throw new AppError('Chair not found in this branch', 404);

      const chairConflict = await prisma.appointment.findFirst({
        where: {
          branchId: req.user.branchId,
          chairId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          startTime: { lt: new Date(endTime) },
          endTime: { gt: new Date(startTime) },
        },
      });
      if (chairConflict) throw new AppError('Chair is already booked in this time slot', 409);
    }

    if (employeeId) {
      // Validate employee belongs to this branch
      const emp = await prisma.employee.findFirst({
        where: { id: employeeId, branchId: req.user.branchId, isActive: true },
      });
      if (!emp) throw new AppError('Employee not found in this branch', 404);

      const employeeConflict = await prisma.appointment.findFirst({
        where: {
          branchId: req.user.branchId,
          employeeId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          startTime: { lt: new Date(endTime) },
          endTime: { gt: new Date(startTime) },
        },
      });
      if (employeeConflict) throw new AppError('This employee is already booked in this time slot', 409);
    }

    // Fetch service durations for the appointment
    const services = serviceIds?.length
      ? await prisma.service.findMany({ where: { id: { in: serviceIds } } })
      : [];

    const appointment = await prisma.appointment.create({
      data: {
        customerId,
        employeeId: employeeId || null,
        chairId: chairId || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        notes: notes || null,
        source: source || 'WALK_IN',
        status: 'SCHEDULED',
        branchId: req.user.branchId,
        services: serviceIds?.length ? {
          create: services.map((s: any) => ({
            serviceId: s.id,
            duration: s.duration,
          })),
        } : undefined,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        employee: { select: { id: true, name: true } },
        chair: { select: { id: true, name: true, type: true } },
        services: { include: { service: { select: { id: true, name: true, duration: true, price: true } } } },
      },
    });

    return sendSuccess(res, appointment, 'Appointment created', 201);
  } catch (error) { next(error); }
});

// ── PATCH /api/appointments/:id ───────────────────────────────
router.patch('/:id', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const existing = await prisma.appointment.findFirst({
      where: { id, branchId: req.user.branchId },
    });
    if (!existing) throw new AppError('Appointment not found', 404);

    const {
      status, employeeId, chairId,
      startTime, endTime, notes, cancelReason,
      serviceIds,
    } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (employeeId !== undefined) updateData.employeeId = employeeId;
    if (chairId !== undefined) updateData.chairId = chairId;
    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (notes !== undefined) updateData.notes = notes;
    if (cancelReason) updateData.cancelReason = cancelReason;

    // Update services if provided
    if (serviceIds) {
      await prisma.appointmentService.deleteMany({ where: { appointmentId: id } });
      const services = await prisma.service.findMany({ where: { id: { in: serviceIds } } });
      updateData.services = {
        create: services.map((s: any) => ({ serviceId: s.id, duration: s.duration })),
      };
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        employee: { select: { id: true, name: true } },
        chair: { select: { id: true, name: true, type: true } },
        services: { include: { service: { select: { id: true, name: true, duration: true, price: true } } } },
      },
    });

    return sendSuccess(res, updated, 'Appointment updated');
  } catch (error) { next(error); }
});

// ── PATCH /api/appointments/:id/status ───────────────────────
router.patch('/:id/status', async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const { status, cancelReason } = req.body;

    const validStatuses = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    if (!validStatuses.includes(status)) throw new AppError('Invalid status', 400);

    const existing = await prisma.appointment.findFirst({
      where: { id, branchId: req.user.branchId },
    });
    if (!existing) throw new AppError('Appointment not found', 404);

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status, cancelReason: cancelReason || null },
      select: { id: true, status: true, cancelReason: true },
    });

    return sendSuccess(res, updated, `Appointment marked as ${status}`);
  } catch (error) { next(error); }
});

// ── DELETE /api/appointments/:id ──────────────────────────────
router.delete('/:id', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const existing = await prisma.appointment.findFirst({
      where: { id: req.params.id, branchId: req.user.branchId },
    });
    if (!existing) throw new AppError('Appointment not found', 404);
    await prisma.appointment.delete({ where: { id: req.params.id } });
    return sendSuccess(res, null, 'Appointment deleted');
  } catch (error) { next(error); }
});

export default router;