import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../utils/prisma';
import { sendSuccess, getPaginationParams } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// ── Retail Products ───────────────────────────────────────────

// GET /api/inventory/products — List retail products with stock filters
router.get('/products', async (req: any, res: any, next: any) => {
  try {
    const { search, lowStock, isActive } = req.query;
    const branchId = req.user.branchId;

    const where: any = { branchId };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    let products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (search) {
      const q = (search as string).toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    if (lowStock === 'true') {
      products = products.filter(p => p.stockQty <= p.minStockLevel);
    }

    return sendSuccess(res, products);
  } catch (error) { next(error); }
});

// POST /api/inventory/products — Add retail product
router.post('/products', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { name, sku, description, price, stockQty, minStockLevel, unit, taxRate } = req.body;
    if (!name || price === undefined) throw new AppError('Name and price are required', 400);

    const product = await prisma.product.create({
      data: {
        name,
        sku: sku || null,
        description: description || null,
        price: price || 0,
        stockQty: stockQty || 0,
        minStockLevel: minStockLevel || 5,
        unit: unit || 'unit',
        taxRate: taxRate || 0,
        branchId: req.user.branchId,
      },
    });

    // Record initial stock movement if > 0
    if (stockQty && stockQty > 0) {
      await prisma.retailStockMovement.create({
        data: {
          productId: product.id,
          type: 'PURCHASE',
          quantity: stockQty,
          reason: 'Initial stock entry',
        },
      });
    }

    return sendSuccess(res, product, 'Product added to inventory', 201);
  } catch (error) { next(error); }
});

// PATCH /api/inventory/products/:id — Update product or adjust stock
router.patch('/products/:id', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findFirst({
      where: { id, branchId: req.user.branchId },
    });
    if (!existing) throw new AppError('Product not found', 404);

    const { name, sku, description, price, stockQty, minStockLevel, unit, taxRate, isActive, adjustmentQty, adjustmentReason, adjustmentType } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (minStockLevel !== undefined) updateData.minStockLevel = minStockLevel;
    if (unit) updateData.unit = unit;
    if (taxRate !== undefined) updateData.taxRate = taxRate;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Stock adjustment flow
    if (adjustmentQty !== undefined && adjustmentType) {
      const change = Math.abs(parseInt(adjustmentQty));
      const newStock = adjustmentType === 'ADD'
        ? existing.stockQty + change
        : Math.max(0, existing.stockQty - change);

      updateData.stockQty = newStock;

      await prisma.retailStockMovement.create({
        data: {
          productId: id,
          type: adjustmentType === 'ADD' ? 'PURCHASE' : 'ADJUSTMENT',
          quantity: adjustmentType === 'ADD' ? change : -change,
          reason: adjustmentReason || 'Manual stock adjustment',
        },
      });
    } else if (stockQty !== undefined) {
      updateData.stockQty = stockQty;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return sendSuccess(res, updated, 'Product updated');
  } catch (error) { next(error); }
});

// ── Inhouse Consumables (Pool & Station) ──────────────────────

// GET /api/inventory/inhouse — List inhouse items with Pool & Station stock
router.get('/inhouse', async (req: any, res: any, next: any) => {
  try {
    const branchId = req.user.branchId;

    const items = await prisma.inhouseItem.findMany({
      where: { branchId, isActive: true },
      include: {
        poolStock: true,
        stationStocks: {
          include: {
            employee: { select: { id: true, name: true, photoUrl: true, role: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return sendSuccess(res, items);
  } catch (error) { next(error); }
});

// POST /api/inventory/inhouse — Add inhouse consumable item
router.post('/inhouse', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { name, unit, description, initialPoolQty } = req.body;
    if (!name) throw new AppError('Name is required', 400);

    const branchId = req.user.branchId;

    const item = await prisma.inhouseItem.create({
      data: {
        name,
        unit: unit || 'ml',
        description: description || null,
        branchId,
        poolStock: {
          create: {
            quantity: initialPoolQty || 0,
            branchId,
          },
        },
      },
      include: { poolStock: true },
    });

    if (initialPoolQty && initialPoolQty > 0) {
      const pool = item.poolStock[0];
      if (pool) {
        await prisma.poolStockMovement.create({
          data: {
            poolStockId: pool.id,
            type: 'IN',
            quantity: initialPoolQty,
            reason: 'Initial pool entry',
          },
        });
      }
    }

    return sendSuccess(res, item, 'Inhouse item added', 201);
  } catch (error) { next(error); }
});

// POST /api/inventory/transfer — Transfer consumable from Pool → Station
router.post('/transfer', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { inhouseItemId, employeeId, quantity, reason } = req.body;
    const branchId = req.user.branchId;
    const transferQty = parseFloat(quantity);

    if (!inhouseItemId || !employeeId || !transferQty || transferQty <= 0) {
      throw new AppError('inhouseItemId, employeeId, and positive quantity are required', 400);
    }

    // Get or create pool stock
    let pool = await prisma.poolStock.findFirst({
      where: { inhouseItemId, branchId },
    });
    if (!pool) {
      pool = await prisma.poolStock.create({
        data: { inhouseItemId, quantity: 0, branchId },
      });
    }

    if (Number(pool.quantity) < transferQty) {
      throw new AppError(`Insufficient pool stock. Available: ${pool.quantity}`, 400);
    }

    // Deduct pool stock
    await prisma.poolStock.update({
      where: { id: pool.id },
      data: { quantity: { decrement: transferQty } },
    });

    await prisma.poolStockMovement.create({
      data: {
        poolStockId: pool.id,
        type: 'OUT',
        quantity: transferQty,
        reason: reason || `Transferred to station`,
      },
    });

    // Add to station stock
    let station = await prisma.stationStock.findFirst({
      where: { inhouseItemId, employeeId, branchId },
    });
    if (!station) {
      station = await prisma.stationStock.create({
        data: { inhouseItemId, employeeId, quantity: transferQty, branchId },
      });
    } else {
      station = await prisma.stationStock.update({
        where: { id: station.id },
        data: { quantity: { increment: transferQty } },
      });
    }

    await prisma.stationStockMovement.create({
      data: {
        stationStockId: station.id,
        type: 'IN',
        quantity: transferQty,
        reason: reason || 'Received from main pool',
      },
    });

    return sendSuccess(res, { pool, station }, 'Stock transferred to station successfully');
  } catch (error) { next(error); }
});

// ── Suppliers & Purchase Orders ───────────────────────────────

// GET /api/inventory/suppliers — List suppliers
router.get('/suppliers', async (req: any, res: any, next: any) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { branchId: req.user.branchId, isActive: true },
      include: {
        purchaseOrders: { select: { id: true, poNumber: true, status: true, totalAmount: true, orderedAt: true } },
      },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, suppliers);
  } catch (error) { next(error); }
});

// POST /api/inventory/suppliers — Add supplier
router.post('/suppliers', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { name, phone, email, address, gstin } = req.body;
    if (!name) throw new AppError('Supplier name is required', 400);

    const supplier = await prisma.supplier.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        gstin: gstin || null,
        branchId: req.user.branchId,
      },
    });
    return sendSuccess(res, supplier, 'Supplier added', 201);
  } catch (error) { next(error); }
});

// GET /api/inventory/purchase-orders — List Purchase Orders
router.get('/purchase-orders', async (req: any, res: any, next: any) => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      where: { branchId: req.user.branchId },
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        items: true,
      },
      orderBy: { orderedAt: 'desc' },
    });
    return sendSuccess(res, pos);
  } catch (error) { next(error); }
});

// POST /api/inventory/purchase-orders — Create Purchase Order
router.post('/purchase-orders', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { supplierId, notes, items } = req.body;
    if (!supplierId || !items?.length) throw new AppError('Supplier and items are required', 400);

    const totalAmount = items.reduce((sum: number, i: any) => sum + (i.quantity * i.unitPrice), 0);
    const count = await prisma.purchaseOrder.count({ where: { branchId: req.user.branchId } });
    const poNumber = `PO-2026-${String(count + 1).padStart(4, '0')}`;

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        totalAmount,
        notes: notes || null,
        status: 'PENDING',
        branchId: req.user.branchId,
        items: {
          create: items.map((i: any) => ({
            itemName: i.itemName,
            quantity: i.quantity,
            unit: i.unit || 'unit',
            unitPrice: i.unitPrice,
            totalPrice: i.quantity * i.unitPrice,
          })),
        },
      },
      include: { supplier: true, items: true },
    });

    return sendSuccess(res, po, 'Purchase Order created', 201);
  } catch (error) { next(error); }
});

// PATCH /api/inventory/purchase-orders/:id/receive — Mark PO received & auto-update stock
router.patch('/purchase-orders/:id/receive', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { id } = req.params;
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, branchId: req.user.branchId },
      include: { items: true },
    });
    if (!po) throw new AppError('Purchase order not found', 404);
    if (po.status === 'RECEIVED') throw new AppError('PO is already received', 400);

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'RECEIVED',
        receivedAt: new Date(),
      },
    });

    // Auto-update retail product stock if product name matches
    for (const item of po.items) {
      const matchedProduct = await prisma.product.findFirst({
        where: { name: { equals: item.itemName }, branchId: req.user.branchId },
      });
      if (matchedProduct) {
        await prisma.product.update({
          where: { id: matchedProduct.id },
          data: { stockQty: { increment: Math.round(Number(item.quantity)) } },
        });
        await prisma.retailStockMovement.create({
          data: {
            productId: matchedProduct.id,
            type: 'PURCHASE',
            quantity: Math.round(Number(item.quantity)),
            reason: `Received PO #${po.poNumber}`,
          },
        });
      }
    }

    return sendSuccess(res, updated, `Purchase Order #${po.poNumber} marked as received`);
  } catch (error) { next(error); }
});

// GET /api/inventory/movements — Audit trail stock movement log
router.get('/movements', async (req: any, res: any, next: any) => {
  try {
    const movements = await prisma.retailStockMovement.findMany({
      where: {
        product: { branchId: req.user.branchId },
      },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return sendSuccess(res, movements);
  } catch (error) { next(error); }
});

export default router;