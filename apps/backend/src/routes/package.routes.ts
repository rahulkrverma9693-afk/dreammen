import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../utils/prisma';
import { sendSuccess } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// ── GET /api/packages/combos ──────────────────────────────────
router.get('/combos', async (req: any, res: any, next: any) => {
  try {
    const combos = await prisma.comboPack.findMany({
      where: { branchId: req.user.branchId, isActive: true },
      include: {
        services: {
          include: { service: { select: { id: true, name: true, price: true, duration: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, combos);
  } catch (error) { next(error); }
});

// ── GET /api/packages/spa-packs ───────────────────────────────
router.get('/spa-packs', async (req: any, res: any, next: any) => {
  try {
    const spaPacks = await prisma.spaPack.findMany({
      where: { branchId: req.user.branchId, isActive: true },
      include: {
        services: {
          include: { service: { select: { id: true, name: true, price: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, spaPacks);
  } catch (error) { next(error); }
});

// ── GET /api/packages/prepaid ─────────────────────────────────
router.get('/prepaid', async (req: any, res: any, next: any) => {
  try {
    const packs = await prisma.prepaidPack.findMany({
      where: { branchId: req.user.branchId, isActive: true },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, packs);
  } catch (error) { next(error); }
});

// ── GET /api/packages/memberships ──────────────────────────────
router.get('/memberships', async (req: any, res: any, next: any) => {
  try {
    const plans = await prisma.membershipPlan.findMany({
      where: { branchId: req.user.branchId, isActive: true },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, plans);
  } catch (error) { next(error); }
});

// ── POST /api/packages/assign-spa ─────────────────────────────
router.post('/assign-spa', async (req: any, res: any, next: any) => {
  try {
    const { customerId, spaPackId } = req.body;
    if (!customerId || !spaPackId) throw new AppError('customerId and spaPackId required', 400);

    const spaPack = await prisma.spaPack.findFirst({
      where: { id: spaPackId, branchId: req.user.branchId },
    });
    if (!spaPack) throw new AppError('Spa pack not found', 404);

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (spaPack.validityDays || 180));

    const assigned = await prisma.customerSpaPack.create({
      data: {
        customerId,
        spaPackId,
        sessionsTotal: spaPack.sessions,
        sessionsRemaining: spaPack.sessions,
        expiresAt: expiryDate,
        status: 'ACTIVE',
      },
      include: { spaPack: true },
    });

    return sendSuccess(res, assigned, 'Spa pack assigned to customer', 201);
  } catch (error) { next(error); }
});

// ── POST /api/packages/redeem-spa ─────────────────────────────
router.post('/redeem-spa', async (req: any, res: any, next: any) => {
  try {
    const { customerSpaPackId, serviceId, employeeId } = req.body;
    const pack = await prisma.customerSpaPack.findUnique({
      where: { id: customerSpaPackId },
    });

    if (!pack || pack.sessionsRemaining <= 0 || pack.status !== 'ACTIVE') {
      throw new AppError('No sessions remaining or pack expired', 400);
    }

    const redemption = await prisma.spaPackRedemption.create({
      data: {
        customerSpaPackId,
        serviceId,
        employeeId: employeeId || null,
      },
    });

    const newSessions = pack.sessionsRemaining - 1;
    await prisma.customerSpaPack.update({
      where: { id: customerSpaPackId },
      data: {
        sessionsRemaining: newSessions,
        sessionsUsed: pack.sessionsUsed + 1,
        status: newSessions === 0 ? 'EXHAUSTED' : 'ACTIVE',
      },
    });

    return sendSuccess(res, redemption, 'Spa session redeemed');
  } catch (error) { next(error); }
});

// ── POST /api/packages/topup-wallet ───────────────────────────
router.post('/topup-wallet', async (req: any, res: any, next: any) => {
  try {
    const { customerId, amount, reason } = req.body;
    const topupAmt = parseFloat(amount);
    if (!customerId || !topupAmt || topupAmt <= 0) {
      throw new AppError('Valid customerId and positive amount required', 400);
    }

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, branchId: req.user.branchId },
    });
    if (!customer) throw new AppError('Customer not found', 404);

    const newBal = Number(customer.walletBalance) + topupAmt;

    await prisma.customer.update({
      where: { id: customerId },
      data: { walletBalance: newBal },
    });

    const txn = await prisma.walletTransaction.create({
      data: {
        customerId,
        type: 'CREDIT',
        amount: topupAmt,
        balance: newBal,
        reason: reason || 'Manual wallet top-up',
      },
    });

    return sendSuccess(res, txn, `₹${topupAmt} added to customer wallet`);
  } catch (error) { next(error); }
});

export default router;
