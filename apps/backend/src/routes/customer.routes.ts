import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import prisma from '../utils/prisma';
import { sendSuccess, getPaginationParams, getValidBranchId } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// GET /api/customers — List customers
router.get('/', async (req: any, res: any, next: any) => {
  try {
    const { skip, limit, page } = getPaginationParams(req.query);
    const { search, groupId, gender } = req.query;

    const branchId = await getValidBranchId(req.user?.branchId);
    const where: any = { branchId };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (groupId) where.groupId = groupId;
    if (gender) where.gender = gender;

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, customerId: true, name: true, phone: true,
          email: true, gender: true, walletBalance: true,
          loyaltyPoints: true, isActive: true, createdAt: true,
          group: { select: { id: true, name: true, color: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return sendSuccess(res, { customers, total, page, limit });
  } catch (error) { next(error); }
});

// GET /api/customers/:id — Customer profile
router.get('/:id', async (req: any, res: any, next: any) => {
  try {
    const branchId = await getValidBranchId(req.user?.branchId);
    const customer = await prisma.customer.findFirst({
      where: { id: req.params.id, branchId },
      include: {
        group: true,
        walletTransactions: { orderBy: { createdAt: 'desc' }, take: 20 },
        bills: {
          where: { isDraft: false },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true, billNumber: true, billType: true,
            netPayable: true, paymentStatus: true, createdAt: true,
          },
        },
        appointments: {
          orderBy: { startTime: 'desc' },
          take: 10,
          select: {
            id: true, status: true, startTime: true, endTime: true,
            services: { include: { service: true } },
          },
        },
        memberships: {
          where: { status: 'ACTIVE' },
          include: { membershipPlan: true },
        },
        activeSpaPacks: {
          where: { status: 'ACTIVE' },
          include: { spaPack: true },
        },
        activePrepaidPacks: {
          where: { status: 'ACTIVE' },
          include: { prepaidPack: true },
        },
      },
    });

    if (!customer) throw new AppError('Customer not found', 404);
    return sendSuccess(res, customer);
  } catch (error) { next(error); }
});

// POST /api/customers — Create customer
router.post('/', async (req: any, res: any, next: any) => {
  try {
    const { name, phone, email, gender, dob, anniversary, address, city, notes, groupId } = req.body;
    const branchId = await getValidBranchId(req.user?.branchId);

    const exists = await prisma.customer.findUnique({
      where: { phone_branchId: { phone, branchId } },
    });
    if (exists) throw new AppError('Customer with this phone already exists', 409);

    // Generate customer ID
    const count = await prisma.customer.count({ where: { branchId } });
    const customerId = `DG-CUST-${String(count + 1).padStart(4, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        customerId, name, phone, email, gender,
        dob: dob ? new Date(dob) : undefined,
        anniversary: anniversary ? new Date(anniversary) : undefined,
        address, city, notes,
        groupId: groupId || undefined,
        branchId,
      },
    });

    return sendSuccess(res, customer, 'Customer created', 201);
  } catch (error) { next(error); }
});

// PUT /api/customers/:id — Update customer
router.put('/:id', async (req: any, res: any, next: any) => {
  try {
    const { name, phone, email, gender, dob, anniversary, address, city, notes, groupId } = req.body;
    const branchId = await getValidBranchId(req.user?.branchId);

    const customer = await prisma.customer.updateMany({
      where: { id: req.params.id, branchId },
      data: {
        name, phone, email, gender,
        dob: dob ? new Date(dob) : undefined,
        anniversary: anniversary ? new Date(anniversary) : undefined,
        address, city, notes, groupId,
      },
    });

    if (!customer.count) throw new AppError('Customer not found', 404);
    return sendSuccess(res, null, 'Customer updated');
  } catch (error) { next(error); }
});

// DELETE /api/customers/:id — Owner/Manager only
router.delete('/:id', authorize('OWNER', 'MANAGER'), async (req: any, res: any, next: any) => {
  try {
    const branchId = await getValidBranchId(req.user?.branchId);
    await prisma.customer.updateMany({
      where: { id: req.params.id, branchId },
      data: { isActive: false },
    });
    return sendSuccess(res, null, 'Customer deactivated');
  } catch (error) { next(error); }
});

export default router;
