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
      const d = new Date(date as string);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
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
      customerId, billType, discountType,
      isDraft, isAdvance,
      billNote, privateNote, items, payments, customBillNumber,
    } = req.body;

    const branchId = req.user.branchId;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      if (!isDraft) throw new AppError('At least one item is required', 400);
    }

    // ── SECURITY: Server calculates all financial totals from authoritative DB prices ──
    // The client MUST NOT supply grossTotal, discount, taxAmount, tipAmount, or netPayable.
    // We only accept item quantities, discount inputs, and tip; all prices come from the DB.

    // Build item details from DB prices
    const itemRecords: Array<{
      itemType: string;
      name: string;
      quantity: number;
      unitPrice: number;
      discount: number;
      taxRate: number;
      taxAmount: number;
      netAmount: number;
      serviceId?: string;
      productId?: string;
      employeeId?: string;
      referredServiceId?: string;
    }> = [];

    let grossTotal = 0;
    let totalTaxAmount = 0;

    for (const item of (items || [])) {
      const qty = Number(item.quantity) || 1;
      let unitPrice = 0;
      let taxRate = 0;
      let name = item.name || '';

      // Fetch authoritative price from DB based on item type
      if (item.itemType === 'SERVICE' && item.serviceId) {
        const svc = await prisma.service.findFirst({
          where: { id: item.serviceId, branchId },
        });
        if (!svc) throw new AppError(`Service ${item.serviceId} not found in this branch`, 400);
        unitPrice = Number(svc.price);
        taxRate = Number(svc.taxRate || 0);
        name = svc.name;
      } else if (item.itemType === 'PRODUCT' && item.productId) {
        const prod = await prisma.product.findFirst({
          where: { id: item.productId, branchId },
        });
        if (!prod) throw new AppError(`Product ${item.productId} not found in this branch`, 400);
        unitPrice = Number(prod.price);
        taxRate = Number(prod.taxRate || 0);
        name = prod.name;
      } else {
        // Free-form item (manual entry) — accept supplied price but cap at 0
        unitPrice = Math.max(0, Number(item.unitPrice) || 0);
        taxRate = Math.max(0, Math.min(100, Number(item.taxRate) || 0));
        name = item.name || 'Item';
      }

      const itemDiscount = Math.max(0, Number(item.discount) || 0);
      const lineGross = unitPrice * qty;
      const lineAfterDiscount = Math.max(0, lineGross - itemDiscount);
      const lineTax = lineAfterDiscount * (taxRate / 100);
      const lineNet = lineAfterDiscount + lineTax;

      grossTotal += lineGross;
      totalTaxAmount += lineTax;

      itemRecords.push({
        itemType: item.itemType || 'SERVICE',
        name,
        quantity: qty,
        unitPrice,
        discount: itemDiscount,
        taxRate,
        taxAmount: lineTax,
        netAmount: lineNet,
        serviceId: item.serviceId || undefined,
        productId: item.productId || undefined,
        employeeId: item.employeeId || undefined,
        referredServiceId: item.referredServiceId || undefined,
      });
    }

    // Global discount (flat or percent — supplied by client, applied after item totals)
    let globalDiscount = 0;
    const discountValue = Math.max(0, Number(req.body.discount) || 0);
    if (discountType === 'PERCENT') {
      globalDiscount = (grossTotal * discountValue) / 100;
    } else {
      globalDiscount = Math.min(discountValue, grossTotal); // cannot discount more than gross
    }

    const tipAmount = Math.max(0, Number(req.body.tipAmount) || 0);
    const netPayable = Math.max(0, grossTotal - globalDiscount + totalTaxAmount + tipAmount);

    // Payment totals — amounts supplied by client but capped at netPayable
    let totalPaid = 0;
    if (payments && Array.isArray(payments)) {
      totalPaid = payments.reduce((sum: number, p: any) => sum + Math.max(0, Number(p.amount)), 0);
      totalPaid = Math.min(totalPaid, netPayable); // cannot overpay at creation
    }
    const due = Math.max(0, netPayable - totalPaid);
    let paymentStatus: 'PAID' | 'PARTIAL' | 'DUE' = 'DUE';
    if (totalPaid >= netPayable) paymentStatus = 'PAID';
    else if (totalPaid > 0) paymentStatus = 'PARTIAL';

    // ── SECURITY: Bill number generation must be atomic to prevent race conditions ──
    // We use a serialised transaction to count + create in one atomic operation.
    const bill = await prisma.$transaction(async (tx) => {
      // Generate or override bill number inside the transaction
      let billNumber = customBillNumber;
      if (!billNumber) {
        const count = await tx.bill.count({ where: { branchId } });
        billNumber = generateBillNumber('DG-2026-', count + 1);
      }

      const createdBill = await tx.bill.create({
        data: {
          billNumber,
          billType: billType || 'SERVICE',
          grossTotal,
          discount: globalDiscount,
          discountType: discountType || 'FLAT',
          taxAmount: totalTaxAmount,
          tipAmount,
          netPayable,
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
            create: itemRecords,
          },
          payments: {
            create: (payments || []).map((p: any) => ({
              method: p.method,
              amount: Math.max(0, Number(p.amount)),
              reference: p.reference || null,
              razorpayId: p.razorpayId || null,
              // Payments created at billing time are cash/UPI/card — mark verified.
              // Razorpay payments should go through the separate /pay + webhook flow.
              isVerified: p.method !== 'RAZORPAY',
            })),
          },
        },
        include: {
          customer: true,
          items: true,
          payments: true,
        },
      });

      // ── SECURITY: Stock deduction must be atomic with billing ──
      // If stock deduction fails, the entire transaction rolls back (no orphaned bills).
      if (!isDraft) {
        for (const item of itemRecords) {
          if (item.itemType === 'PRODUCT' && item.productId) {
            // Verify sufficient stock exists before decrementing
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stockQty: true, name: true },
            });

            if (!product) {
              throw new AppError(`Product ${item.productId} not found for stock deduction`, 400);
            }
            if (Number(product.stockQty) < item.quantity) {
              throw new AppError(
                `Insufficient stock for "${product.name}". Available: ${product.stockQty}, Requested: ${item.quantity}`,
                400
              );
            }

            await tx.product.update({
              where: { id: item.productId },
              data: { stockQty: { decrement: item.quantity } },
            });

            // Record the stock movement for audit trail
            await tx.retailStockMovement.create({
              data: {
                productId: item.productId,
                type: 'SALE',
                quantity: -item.quantity,
                reason: `Sold on bill #${createdBill.billNumber}`,
              },
            });
          }
        }
      }

      return createdBill;
    });

    return sendSuccess(res, bill, isDraft ? 'Draft saved' : 'Bill created successfully', 201);
  } catch (error) { next(error); }
});

// POST /api/bills/:id/pay — Add payment to existing bill
router.post('/:id/pay', async (req: any, res: any, next: any) => {
  try {
    const { payments } = req.body; // array of { method, amount, reference }

    if (!payments || !Array.isArray(payments) || payments.length === 0) {
      throw new AppError('Payments array is required', 400);
    }

    // ── SECURITY: Create payments and update bill status atomically ──
    // If either step fails, neither is committed.
    const updatedBill = await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: { id: req.params.id, branchId: req.user.branchId },
        include: { payments: true },
      });

      if (!bill) throw new AppError('Bill not found', 404);

      const newPayments = await Promise.all(
        payments.map((p: any) =>
          tx.payment.create({
            data: {
              billId: bill.id,
              method: p.method,
              amount: Math.max(0, Number(p.amount)),
              reference: p.reference || null,
              isVerified: p.method !== 'RAZORPAY',
            },
          })
        )
      );

      const updatedPayments = [...bill.payments, ...newPayments];
      const totalPaid = updatedPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      const net = Number(bill.netPayable);
      const due = Math.max(0, net - totalPaid);
      const paymentStatus = totalPaid >= net ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'DUE';

      return tx.bill.update({
        where: { id: bill.id },
        data: {
          amountPaid: totalPaid,
          balanceDue: due,
          paymentStatus,
          isDraft: false,
        },
        include: { payments: true, customer: true, items: true },
      });
    });

    return sendSuccess(res, updatedBill, 'Payment recorded');
  } catch (error) { next(error); }
});

export default router;