import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../utils/prisma';
import { sendSuccess } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// ── GET /api/marketing/campaigns ─────────────────────────────
router.get('/campaigns', async (req: any, res: any, next: any) => {
  try {
    const campaigns = await prisma.whatsAppCampaign.findMany({
      where: { branchId: req.user.branchId },
      include: {
        targetGroup: { select: { id: true, name: true, color: true } },
        deliveries: { select: { id: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const report = campaigns.map((c: any) => {
      const total = c.deliveries.length;
      const sent = c.deliveries.filter((d: any) => d.status === 'SENT' || d.status === 'DELIVERED' || d.status === 'READ').length;
      const delivered = c.deliveries.filter((d: any) => d.status === 'DELIVERED' || d.status === 'READ').length;
      const read = c.deliveries.filter((d: any) => d.status === 'READ').length;
      return {
        ...c,
        metrics: { total, sent, delivered, read },
      };
    });

    return sendSuccess(res, report);
  } catch (error) { next(error); }
});

// ── POST /api/marketing/campaigns ────────────────────────────
router.post('/campaigns', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { name, message, imageUrl, targetGroupId, targetGender, targetBirthdays, targetAnniversaries, sendNow } = req.body;
    if (!name || !message) throw new AppError('Campaign name and message are required', 400);

    const branchId = req.user.branchId;

    const campaign = await prisma.whatsAppCampaign.create({
      data: {
        name,
        message,
        imageUrl: imageUrl || null,
        targetGroupId: targetGroupId || null,
        targetGender: targetGender || null,
        targetBirthdays: !!targetBirthdays,
        targetAnniversaries: !!targetAnniversaries,
        status: sendNow ? 'SENT' : 'DRAFT',
        sentAt: sendNow ? new Date() : null,
        branchId,
      },
    });

    // If sendNow, create delivery records for targeted customers.
    // IMPORTANT: These records have status PENDING_SEND — a real WhatsApp provider
    // integration (e.g., Meta Cloud API, Twilio, or Gupshup) is required to
    // actually send messages and update statuses via webhooks.
    // Math.random() was previously used here to simulate delivery — that has been removed.
    if (sendNow) {
      const where: any = { branchId, isActive: true };
      if (targetGroupId) where.groupId = targetGroupId;
      if (targetGender) where.gender = targetGender;

      const customers = await prisma.customer.findMany({ where, select: { id: true, phone: true } });

      if (customers.length > 0) {
        await prisma.campaignDelivery.createMany({
          data: customers.map((c: any) => ({
            campaignId: campaign.id,
            customerId: c.id,
            phone: c.phone,
            status: 'PENDING_SEND', // Real status updated by WhatsApp provider webhook
            sentAt: new Date(),
          })),
        });
      }
    }

    return sendSuccess(res, campaign, sendNow ? 'Campaign sent successfully' : 'Campaign draft saved', 201);
  } catch (error) { next(error); }
});

// ── GET /api/marketing/groups ────────────────────────────────
router.get('/groups', async (req: any, res: any, next: any) => {
  try {
    const groups = await prisma.customerGroup.findMany({
      where: { branchId: req.user.branchId, isActive: true },
      include: {
        customers: { select: { id: true, name: true, phone: true } },
      },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, groups);
  } catch (error) { next(error); }
});

// ── POST /api/marketing/groups ───────────────────────────────
router.post('/groups', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { name, description, color, rules } = req.body;
    if (!name) throw new AppError('Group name is required', 400);

    const group = await prisma.customerGroup.create({
      data: {
        name,
        description: description || null,
        color: color || '#C2185B',
        rules: rules || null,
        branchId: req.user.branchId,
      },
    });
    return sendSuccess(res, group, 'Customer group created', 201);
  } catch (error) { next(error); }
});

// ── GET /api/marketing/upsell-rules ──────────────────────────
router.get('/upsell-rules', async (req: any, res: any, next: any) => {
  try {
    const rules = await prisma.upsellRule.findMany({
      where: { branchId: req.user.branchId, isActive: true },
      orderBy: { priority: 'asc' },
    });

    // Populate service names
    const serviceIds = new Set<string>();
    rules.forEach((r: any) => { serviceIds.add(r.triggerServiceId); serviceIds.add(r.suggestServiceId); });

    const services = await prisma.service.findMany({
      where: { id: { in: Array.from(serviceIds) } },
      select: { id: true, name: true, price: true },
    });

    const serviceMap = new Map(services.map((s: any) => [s.id, s]));

    const populated = rules.map((r: any) => ({
      ...r,
      triggerService: serviceMap.get(r.triggerServiceId) || { name: 'Service' },
      suggestService: serviceMap.get(r.suggestServiceId) || { name: 'Suggested Service' },
    }));

    return sendSuccess(res, populated);
  } catch (error) { next(error); }
});

// ── POST /api/marketing/upsell-rules ─────────────────────────
router.post('/upsell-rules', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const { triggerServiceId, suggestServiceId, priority } = req.body;
    if (!triggerServiceId || !suggestServiceId) throw new AppError('Trigger and suggest service IDs are required', 400);

    const rule = await prisma.upsellRule.create({
      data: {
        triggerServiceId,
        suggestServiceId,
        priority: priority || 1,
        branchId: req.user.branchId,
      },
    });
    return sendSuccess(res, rule, 'Smart Upsell rule created', 201);
  } catch (error) { next(error); }
});

export default router;