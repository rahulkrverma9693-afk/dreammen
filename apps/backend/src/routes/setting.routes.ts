import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../utils/prisma';
import { sendSuccess } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// ── GET /api/settings ─────────────────────────────────────────
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const branchId = req.user.branchId;

    const [branch, settingsList, taxSlabs] = await Promise.all([
      prisma.branch.findUnique({ where: { id: branchId } }),
      prisma.setting.findMany({ where: { branchId } }),
      prisma.taxSlab.findMany({ where: { branchId, isActive: true } }),
    ]);

    const settingsMap: Record<string, string> = {};
    settingsList.forEach(s => { settingsMap[s.key] = s.value; });

    // Set defaults if empty
    const defaults = {
      bill_prefix: 'DG-2026-',
      next_bill_number: '1001',
      currency: 'INR',
      phone_prefix: '+91',
      gstin: '07AAAAA0000A1Z5',
      gst_enabled: 'true',
      razorpay_key_id: 'rzp_live_x892aKls81',
      razorpay_mode: 'live',
      printer_paper_width: '80mm',
      printer_header: 'DREAMGIRL FAMILY SALON & SPA',
      printer_footer: 'Thank you for visiting! Follow us @dreamgirlsalon',
      booking_slot_duration: '30',
      booking_enabled: 'true',
      ...settingsMap,
    };

    return sendSuccess(res, {
      branch,
      settings: defaults,
      taxSlabs,
    });
  } catch (error) { next(error); }
});

// ── PUT /api/settings ─────────────────────────────────────────
router.put('/', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { settings } = req.body; // { key: value }
    const branchId = req.user.branchId;

    if (!settings || typeof settings !== 'object') {
      throw new AppError('Settings payload must be an object', 400);
    }

    const updates = Object.entries(settings).map(([key, value]) =>
      prisma.setting.upsert({
        where: { branchId_key: { branchId, key } },
        update: { value: String(value) },
        create: { branchId, key, value: String(value) },
      })
    );

    await prisma.$transaction(updates);

    return sendSuccess(res, null, 'Settings saved successfully');
  } catch (error) { next(error); }
});

// ── PATCH /api/settings/branch ────────────────────────────────
router.patch('/branch', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const branchId = req.user.branchId;
    const { name, phone, email, address, city, state, pincode, googleMapLink, bookingEnabled, slotDuration, businessHours } = req.body;

    const updated = await prisma.branch.update({
      where: { id: branchId },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(googleMapLink !== undefined && { googleMapLink }),
        ...(bookingEnabled !== undefined && { bookingEnabled }),
        ...(slotDuration !== undefined && { slotDuration }),
        ...(businessHours !== undefined && { businessHours }),
      },
    });

    return sendSuccess(res, updated, 'Salon branch profile updated');
  } catch (error) { next(error); }
});

// ── GET /api/settings/tax-slabs ───────────────────────────────
router.get('/tax-slabs', async (req: any, res: any, next: any) => {
  try {
    const slabs = await prisma.taxSlab.findMany({
      where: { branchId: req.user.branchId, isActive: true },
      orderBy: { rate: 'asc' },
    });
    return sendSuccess(res, slabs);
  } catch (error) { next(error); }
});

// ── POST /api/settings/tax-slabs ──────────────────────────────
router.post('/tax-slabs', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { name, rate } = req.body;
    if (!name || rate === undefined) throw new AppError('Name and rate are required', 400);

    const slab = await prisma.taxSlab.create({
      data: {
        name,
        rate: parseFloat(rate),
        branchId: req.user.branchId,
      },
    });
    return sendSuccess(res, slab, 'Tax slab created', 201);
  } catch (error) { next(error); }
});

export default router;