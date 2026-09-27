import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../utils/prisma';
import { sendSuccess } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/services/categories — List categories with services
router.get('/categories', async (req: any, res: any, next: any) => {
  try {
    const branchId = req.user.branchId;
    const categories = await prisma.serviceCategory.findMany({
      where: { branchId, isActive: true },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return sendSuccess(res, categories);
  } catch (error) { next(error); }
});

// GET /api/services — List all services (flat list with search/filter)
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const { categoryId, gender, search } = req.query;
    const where: any = { branchId: req.user.branchId, isActive: true };

    if (categoryId) where.categoryId = categoryId;
    if (gender) {
      where.OR = [
        { category: { genderApplicable: null } },
        { category: { genderApplicable: gender } },
      ];
    }
    if (search) {
      where.name = { contains: search };
    }

    const services = await prisma.service.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, services);
  } catch (error) { next(error); }
});

// GET /api/services/products — Retail products
router.get('/products', async (req: any, res: any, next: any) => {
  try {
    const { search } = req.query;
    const where: any = { branchId: req.user.branchId, isActive: true };
    if (search) where.name = { contains: search };

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, products);
  } catch (error) { next(error); }
});

// GET /api/services/packs — Combo, Spa, Prepaid packs & Memberships
router.get('/packs', async (req: any, res: any, next: any) => {
  try {
    const branchId = req.user.branchId;
    const [comboPacks, spaPacks, prepaidPacks, membershipPlans] = await Promise.all([
      prisma.comboPack.findMany({ where: { branchId, isActive: true }, include: { services: { include: { service: true } } } }),
      prisma.spaPack.findMany({ where: { branchId, isActive: true }, include: { services: { include: { service: true } } } }),
      prisma.prepaidPack.findMany({ where: { branchId, isActive: true } }),
      prisma.membershipPlan.findMany({ where: { branchId, isActive: true } }),
    ]);

    return sendSuccess(res, { comboPacks, spaPacks, prepaidPacks, membershipPlans });
  } catch (error) { next(error); }
});

export default router;