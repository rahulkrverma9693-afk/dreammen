import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';
import { sendSuccess, getPaginationParams, generateBillNumber } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/bills — List bills (with search & filters)
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const { search, billType, paymentStatus, date, isDraft } = req.query;

    const where: any = { branchId: req.user.branchId };
    if (isDraft !== undefined) where.isDraft = isDraft === 'true';
    if (billType) where.billType = billType;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where.OR = [
        { billNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
      ];
    }
    if (date) {
      const d = new Date(date);
      const start = new Date(d.setHours(0, 0, 0, 0));
      const end = new Date(d.setHours(23, 59, 59, 999));
      where.createdAt = { gte: start, lte: end };
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true, customerId: true } },
          createdBy: { select: { id: true, name: true } },
          payments: true,
          items: { select: { id: true, name: true, quantity: true, unitPrice: true, netAmount: true } },
        },
      }),
      prisma.bill.count({ where }),
    ]);

    return sendSuccess(res, { bills, total, page, limit });
  } catch (error) { next(error); }
});

// GET /api/bills/drafts — Draft bills only
router.get('/drafts', async (req: any, res: any, next: any) => {
  try {
    const drafts = await prisma.bill.findMany({
      where: { branchId: req.user.branchId, isDraft: true },
      orderBy: { updatedAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: true,
      },
    });
    return sendSuccess(res, drafts);
  } catch (error) { next(error); }
});

// GET /api/bills/:id — Bill detail for view/print
router.get('/:id', async (req: any, res: any, next: any) => {
  try {
    const bill = await prisma.bill.findFirst({
      where: { id: req.params.id, branchId: req.user.branchId },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true } },
        branch: true,
        items: {
          include: {
            employee: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
            product: { select: { id: true, name: true } },
          },
        },
        payments: true,
        cashback: true,
      },
    });

    if (!bill) throw new AppError('Bill not found', 404);
    return sendSuccess(res, bill);
  } catch (error) { next(error); }
});

// POST /api/bills — Create bill / Save Draft
router.post('/', async (req: any, res: any, next: any) => {
  try {
    const {
      customerId, billType, grossTotal, discount, discountType,
      taxAmount, tipAmount, netPayable, isDraft, isAdvance,
      billNote, privateNote, items, payments, customBillNumber,
    } = req.body;

    const branchId = req.user.branchId;
    const userId = req.user.id;

    // Generate or override bill number
    let billNumber = customBillNumber;
    if (!billNumber) {
      const count = await prisma.bill.count({ where: { branchId } });
      billNumber = generateBillNumber('DG-2026-', count + 1);
    }

    // Payment status
    let totalPaid = 0;
    if (payments && Array.isArray(payments)) {
      totalPaid = payments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    }
    const due = Math.max(0, netPayable - totalPaid);
    let paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' = 'DUE';
    if (totalPaid >= netPayable) paymentStatus = 'PAID';
    else if (totalPaid > 0) paymentStatus = 'PARTIAL';

    const bill = await prisma.bill.create({
      data: {
        billNumber,
        billType: billType || 'SERVICE',
        grossTotal: grossTotal || 0,
        discount: discount || 0,
        discountType: discountType || 'FLAT',
        taxAmount: taxAmount || 0,
        tipAmount: tipAmount || 0,
        netPayable: netPayable || 0,
        amountPaid: totalPaid,
        balanceDue: due,
        paymentStatus,
        isDraft: Boolean(isDraft),
        isAdvance: Boolean(isAdvance),
        billNote,
        privateNote,
        customerId: customerId || null,
        createdById: userId,
        branchId,
        items: {
          create: (items || []).map((item: any) => ({
            itemType: item.itemType || 'SERVICE',
            name: item.name,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            discount: item.discount || 0,
            taxRate: item.taxRate || 0,
            taxAmount: item.taxAmount || 0,
            netAmount: item.netAmount || 0,
            serviceId: item.serviceId || null,
            productId: item.productId || null,
            employeeId: item.employeeId || null,
            referredServiceId: item.referredServiceId || null,
          })),
        },
        payments: {
          create: (payments || []).map((p: any) => ({
            method: p.method,
            amount: p.amount,
            reference: p.reference || null,
            razorpayId: p.razorpayId || null,
            isVerified: true,
          })),
        },
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });

    // Stock deduction if products present
    if (!isDraft && items) {
      for (const item of items) {
        if (item.itemType === 'PRODUCT' && item.productId) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stockQty: { decrement: item.quantity || 1 } },
          }).catch(() => {});
        }
      }
    }

    return sendSuccess(res, bill, isDraft ? 'Draft saved' : 'Bill created successfully', 201);
  } catch (error) { next(error); }
});

// POST /api/bills/:id/pay — Add payment to existing bill
router.post('/:id/pay', async (req: any, res: any, next: any) => {
  try {
    const { payments } = req.body; // array of { method, amount, reference }
    const bill = await prisma.bill.findFirst({
      where: { id: req.params.id, branchId: req.user.branchId },
      include: { payments: true },
    });

    if (!bill) throw new AppError('Bill not found', 404);

    const newPayments = await Promise.all(
      payments.map((p: any) =>
        prisma.payment.create({
          data: {
            billId: bill.id,
            method: p.method,
            amount: p.amount,
            reference: p.reference || null,
            isVerified: true,
          },
        })
      )
    );

    const updatedPayments = [...bill.payments, ...newPayments];
    const totalPaid = updatedPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const net = Number(bill.netPayable);
    const due = Math.max(0, net - totalPaid);
    const paymentStatus = totalPaid >= net ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'DUE';

    const updatedBill = await prisma.bill.update({
      where: { id: bill.id },
      data: {
        amountPaid: totalPaid,
        balanceDue: due,
        paymentStatus,
        isDraft: false,
      },
      include: { payments: true, customer: true, items: true },
    });

    return sendSuccess(res, updatedBill, 'Payment recorded');
  } catch (error) { next(error); }
});

export default router;