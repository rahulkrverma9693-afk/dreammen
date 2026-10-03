import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/helpers';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// JWT secrets are validated at startup (index.ts); safe to assert non-null here.
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

// ─── Login ────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  async (req: AuthRequest, res: any, next: any) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError(errors.array()[0].msg, 400);
      }

      const { email, password } = req.body;

      // SECURITY: Any database error must surface as a 503, not as a demo login.
      // There is no fallback authentication path in production.
      let user;
      try {
        user = await prisma.user.findUnique({
          where: { email },
          include: { branch: true, employee: true },
        });
      } catch (dbError) {
        console.error('[Auth] Database error during login lookup:', dbError);
        throw new AppError('Authentication service temporarily unavailable', 503);
      }

      if (!user || !user.isActive) {
        throw new AppError('Invalid credentials', 401);
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        throw new AppError('Invalid credentials', 401);
      }

      const accessToken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
          branchId: user.branchId,
          employeeId: user.employeeId,
        },
        JWT_SECRET,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as jwt.SignOptions['expiresIn'] }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        JWT_REFRESH_SECRET,
        { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '30d') as jwt.SignOptions['expiresIn'] }
      );

      // Store refresh token and update last login — both can fail without blocking login
      try {
        await prisma.refreshToken.create({
          data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      } catch (err) {
        // Non-fatal: token and last-login tracking failure should not block login,
        // but we log it for observability.
        console.warn('[Auth] Could not persist refresh token or update lastLoginAt:', err);
      }

      return sendSuccess(res, {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          branchId: user.branchId,
          branchName: user.branch?.name,
        },
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }
);

// ─── Refresh Token ────────────────────────────────────────
router.post('/refresh', async (req: any, res: any, next: any) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { include: { branch: true } } },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = storedToken.user;

    // SECURITY: Verify user is still active before issuing a new access token.
    if (!user.isActive) {
      throw new AppError('User account is deactivated', 401);
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        branchId: user.branchId,
        employeeId: user.employeeId,
      },
      JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as jwt.SignOptions['expiresIn'] }
    );

    return sendSuccess(res, { accessToken }, 'Token refreshed');
  } catch (error) {
    next(error);
  }
});

// ─── Logout ───────────────────────────────────────────────
router.post('/logout', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
});

// ─── Me ───────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, branchId: true, lastLoginAt: true,
        branch: { select: { id: true, name: true, logoUrl: true } },
      },
    });
    if (!user) throw new AppError('User not found', 404);
    return sendSuccess(res, user);
  } catch (error) {
    next(error);
  }
});

export default router;
