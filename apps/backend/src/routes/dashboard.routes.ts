import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';
import { sendSuccess } from '../utils/helpers';

const router = Router();
router.use(authenticate);

// GET /api/dashboard/summary
router.get('/summary', async (req: any, res: any, next: any) => {
  try {
    const branchId = req.user.branchId;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      todayBills, todayExpenses, lowStockProducts,
      upcomingOccasions, irregularCustomers,
    ] = await Promise.all([
      // Today's paid bills
      prisma.bill.findMany({
        where: {
          branchId,
          isDraft: false,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        include: { payments: true },
      }),

      // Today's expenses
      prisma.expense.findMany({
        where: { branchId, date: { gte: startOfDay, lte: endOfDay } },
        select: { amount: true },
      }),

      // Low stock products
      prisma.product.findMany({
        where: {
          branchId,
          isActive: true,
          stockQty: { lte: prisma.product.fields.minStockLevel },
        },
        select: { id: true, name: true, stockQty: true, minStockLevel: true },
      }).catch(() => []),

      // Birthdays & anniversaries in next 7 days
      prisma.customer.findMany({
        where: {
          branchId,
          isActive: true,
          OR: [
            { dob: { not: null } },
            { anniversary: { not: null } },
          ],
        },
        select: { id: true, name: true, phone: true, dob: true, anniversary: true },
        take: 50,
      }),

      // Irregular customers (no visit in 30+ days)
      prisma.customer.findMany({
        where: {
          branchId,
          isActive: true,
          bills: {
            none: {
              createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          },
        },
        select: { id: true, name: true, phone: true },
        take: 20,
      }),
    ]);

    // Calculate summary
    const income = todayBills.reduce((sum: number, b: any) => sum + Number(b.netPayable), 0);
    const expenses = todayExpenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);

    // Payment breakdown
    const allPayments = todayBills.flatMap((b: any) => b.payments);
    const paymentBreakdown = {
      CASH: 0, CARD: 0, UPI: 0, WALLET: 0, ADVANCE: 0, MEMBERSHIP_CREDITS: 0,
    };
    allPayments.forEach((p: any) => {
      paymentBreakdown[p.method as keyof typeof paymentBreakdown] += Number(p.amount);
    });

    // Income by type
    const incomeByType = {
      SERVICE: 0, PRODUCT: 0, COMBO_PACK: 0, SPA_PACK: 0,
      PREPAID_PACK: 0, MEMBERSHIP: 0,
    };
    todayBills.forEach((b: any) => {
      incomeByType[b.billType as keyof typeof incomeByType] += Number(b.netPayable);
    });

    const balanceDue = todayBills
      .filter((b: any) => b.paymentStatus !== 'PAID')
      .reduce((sum: number, b: any) => sum + Number(b.balanceDue), 0);

    return sendSuccess(res, {
      income,
      expenses,
      netProfit: income - expenses,
      paymentBreakdown,
      incomeByType,
      balanceDue,
      lowStockProducts,
      irregularCustomers,
      billCount: todayBills.length,
    });
  } catch (error) { next(error); }
});

export default router;
