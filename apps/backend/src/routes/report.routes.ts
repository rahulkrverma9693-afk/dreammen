import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../utils/prisma';
import { sendSuccess } from '../utils/helpers';

const router = Router();
router.use(authenticate);

// Helper: parse date range from query
function parseDateRange(req: any) {
  const { dateRange, startDate, endDate } = req.query;
  const now = new Date();
  let start = new Date();
  let end = new Date();

  if (startDate && endDate) {
    start = new Date(startDate as string);
    end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
  } else if (dateRange === 'today') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (dateRange === 'yesterday') {
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (dateRange === 'this_week') {
    const day = start.getDay();
    start.setDate(start.getDate() - ((day + 6) % 7));
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (dateRange === 'last_30_days') {
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    // Default: this month
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { start, end };
}

// ── GET /api/reports/finance ──────────────────────────────────
router.get('/finance', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { start, end } = parseDateRange(req);
    const branchId = req.user.branchId;

    const bills = await prisma.bill.findMany({
      where: {
        branchId,
        createdAt: { gte: start, lte: end },
        isDraft: false,
      },
      include: {
        payments: true,
        items: true,
      },
    });

    const expenses = await prisma.expense.findMany({
      where: {
        branchId,
        date: { gte: start, lte: end },
      },
      include: { category: true },
    });

    // Aggregate metrics
    const grossTotal = bills.reduce((sum: number, b: any) => sum + Number(b.grossTotal), 0);
    const totalDiscount = bills.reduce((sum: number, b: any) => sum + Number(b.discount), 0);
    const totalTax = bills.reduce((sum: number, b: any) => sum + Number(b.taxAmount), 0);
    const totalTips = bills.reduce((sum: number, b: any) => sum + Number(b.tipAmount), 0);
    const totalRevenue = bills.reduce((sum: number, b: any) => sum + Number(b.netPayable), 0);
    const totalAmountPaid = bills.reduce((sum: number, b: any) => sum + Number(b.amountPaid), 0);
    const totalBalanceDue = bills.reduce((sum: number, b: any) => sum + Number(b.balanceDue), 0);
    const totalExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Payment methods breakdown
    const paymentMethods: Record<string, number> = { CASH: 0, CARD: 0, UPI: 0, WALLET: 0 };
    bills.forEach((b: any) => {
      b.payments.forEach((p: any) => {
        const m = p.method as string;
        paymentMethods[m] = (paymentMethods[m] || 0) + Number(p.amount);
      });
    });

    // Revenue daily sparkline
    const dailyRevenueMap: Record<string, number> = {};
    bills.forEach((b: any) => {
      const day = b.createdAt.toISOString().split('T')[0];
      dailyRevenueMap[day] = (dailyRevenueMap[day] || 0) + Number(b.netPayable);
    });

    const dailyTrend = Object.keys(dailyRevenueMap).sort().map((day: any) => ({
      date: day,
      revenue: dailyRevenueMap[day],
    }));

    return sendSuccess(res, {
      period: { start: start.toISOString(), end: end.toISOString() },
      summary: {
        grossTotal,
        totalDiscount,
        totalTax,
        totalTips,
        totalRevenue,
        totalAmountPaid,
        totalBalanceDue,
        totalExpenses,
        netProfit,
        totalBills: bills.length,
      },
      paymentMethods,
      dailyTrend,
    });
  } catch (error) { next(error); }
});

// ── GET /api/reports/sales-by-service ─────────────────────────
router.get('/sales-by-service', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { start, end } = parseDateRange(req);
    const branchId = req.user.branchId;

    const items = await prisma.billItem.findMany({
      where: {
        itemType: 'SERVICE',
        bill: {
          branchId,
          createdAt: { gte: start, lte: end },
          isDraft: false,
        },
      },
      include: {
        service: { select: { id: true, name: true, category: { select: { name: true } } } },
      },
    });

    const map: Record<string, { id: string; name: string; category: string; quantity: number; revenue: number }> = {};

    items.forEach((i: any) => {
      const key = i.serviceId || i.name;
      if (!map[key]) {
        map[key] = {
          id: key,
          name: i.name,
          category: i.service?.category?.name || 'Uncategorized',
          quantity: 0,
          revenue: 0,
        };
      }
      map[key].quantity += i.quantity;
      map[key].revenue += Number(i.netAmount);
    });

    const report = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    return sendSuccess(res, report);
  } catch (error) { next(error); }
});

// ── GET /api/reports/sales-by-product ─────────────────────────
router.get('/sales-by-product', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { start, end } = parseDateRange(req);
    const branchId = req.user.branchId;

    const items = await prisma.billItem.findMany({
      where: {
        itemType: 'PRODUCT',
        bill: {
          branchId,
          createdAt: { gte: start, lte: end },
          isDraft: false,
        },
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    const map: Record<string, { id: string; name: string; sku?: string; quantity: number; revenue: number }> = {};

    items.forEach((i: any) => {
      const key = i.productId || i.name;
      if (!map[key]) {
        map[key] = {
          id: key,
          name: i.name,
          sku: i.product?.sku || '—',
          quantity: 0,
          revenue: 0,
        };
      }
      map[key].quantity += i.quantity;
      map[key].revenue += Number(i.netAmount);
    });

    const report = Object.values(map).sort((a, b) => b.revenue - a.revenue);
    return sendSuccess(res, report);
  } catch (error) { next(error); }
});

// ── GET /api/reports/customers ───────────────────────────────
router.get('/customers', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { start, end } = parseDateRange(req);
    const branchId = req.user.branchId;

    const customers = await prisma.customer.findMany({
      where: { branchId, isActive: true },
      include: {
        bills: {
          where: { isDraft: false },
          select: { id: true, netPayable: true, createdAt: true },
        },
        group: { select: { name: true } },
      },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const report = customers.map((c: any) => {
      const periodBills = c.bills.filter((b: any) => b.createdAt >= start && b.createdAt <= end);
      const totalSpend = c.bills.reduce((sum: number, b: any) => sum + Number(b.netPayable), 0);
      const periodSpend = periodBills.reduce((sum: number, b: any) => sum + Number(b.netPayable), 0);
      const lastVisit = c.bills.length > 0
        ? c.bills.map((b: any) => b.createdAt).sort((a: any, b: any) => b.getTime() - a.getTime())[0]
        : null;
      const isChurned = !lastVisit || lastVisit < thirtyDaysAgo;

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        group: c.group?.name || 'Regular',
        totalVisits: c.bills.length,
        periodVisits: periodBills.length,
        totalSpend,
        periodSpend,
        lastVisit,
        isChurned,
      };
    }).sort((a: any, b: any) => b.totalSpend - a.totalSpend);

    return sendSuccess(res, report);
  } catch (error) { next(error); }
});

// ── GET /api/reports/employees ───────────────────────────────
router.get('/employees', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { start, end } = parseDateRange(req);
    const branchId = req.user.branchId;

    const employees = await prisma.employee.findMany({
      where: { branchId, isActive: true },
      include: {
        billItems: {
          where: {
            bill: { branchId, createdAt: { gte: start, lte: end }, isDraft: false },
          },
        },
        attendanceLogs: {
          where: { date: { gte: start, lte: end } },
        },
      },
    });

    const report = employees.map((emp: any) => {
      const revenueGenerated = emp.billItems.reduce((sum: number, i: any) => sum + Number(i.netAmount), 0);
      const servicesDelivered = emp.billItems.filter((i: any) => i.itemType === 'SERVICE').length;
      const commissionEarned = emp.commissionType === 'PERCENT'
        ? (revenueGenerated * Number(emp.commissionRate)) / 100
        : emp.billItems.length * Number(emp.commissionRate);
      const totalHours = emp.attendanceLogs.reduce((sum: number, a: any) => sum + Number(a.hoursWorked || 0), 0);

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        revenueGenerated,
        servicesDelivered,
        commissionEarned,
        daysPresent: emp.attendanceLogs.length,
        totalHours: Math.round(totalHours * 10) / 10,
        monthlyTarget: Number(emp.monthlyTarget),
        targetAchievementPct: Number(emp.monthlyTarget) > 0
          ? Math.min(100, Math.round((revenueGenerated / Number(emp.monthlyTarget)) * 100))
          : null,
      };
    }).sort((a: any, b: any) => b.revenueGenerated - a.revenueGenerated);

    return sendSuccess(res, report);
  } catch (error) { next(error); }
});

export default router;