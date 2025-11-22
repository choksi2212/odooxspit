import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import prisma from '../../db/client.js';
import { config } from '../../config/index.js';
import { generateOTP } from '../../common/utils.js';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../../common/errors.js';
import { UserRole } from '@prisma/client';

/**
 * Authentication Service
 * Handles user registration, login, OTP generation and password reset
 * Uses Argon2id for password hashing (memory-hard, resistant to GPU attacks)
 */
export class AuthService {
  /**
   * Register a new user
   * Time complexity: O(1) for DB operations, O(n) for Argon2 hashing where n = time cost
   */
  async signup(data: {
    loginId: string;
    email: string;
    password: string;
    name: string;
    role?: UserRole;
  }) {
    // Check if loginId or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ loginId: data.loginId }, { email: data.email }],
      },
    });

    if (existingUser) {
      if (existingUser.loginId === data.loginId) {
        throw new ConflictError('LoginId already exists');
      }
      throw new ConflictError('Email already exists');
    }

    // Hash password with Argon2id
    const passwordHash = await argon2.hash(data.password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MB
      timeCost: 3,
      parallelism: 4,
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        loginId: data.loginId,
        email: data.email,
        name: data.name,
        passwordHash,
        role: data.role || UserRole.WAREHOUSE_STAFF,
      },
      select: {
        id: true,
        loginId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Authenticate user with loginId/email and password
   * Time complexity: O(1) for DB lookup, O(n) for Argon2 verification
   */
  async login(loginIdOrEmail: string, password: string) {
    // Find user by loginId or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ loginId: loginIdOrEmail }, { email: loginIdOrEmail }],
        isActive: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isValid = await argon2.verify(user.passwordHash, password);

    if (!isValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    return {
      id: user.id,
      loginId: user.loginId,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }

  /**
   * Generate and store OTP for password reset
   * OTP is hashed before storage for security
   * Time complexity: O(1) for DB operations, O(n) for hashing
   */
  async requestPasswordResetOtp(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists - return success anyway
      return {
        message: 'If the email exists, an OTP has been sent',
        // In production, you would send OTP via email service
        // For hackathon/demo, we'll return it in the response
        otpForDemo: null,
      };
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Hash OTP before storing
    const otpHash = await argon2.hash(otp);

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + config.otp.expiryMinutes);

    // Delete any existing unused OTPs for this user
    await prisma.otpToken.deleteMany({
      where: {
        userId: user.id,
        type: 'PASSWORD_RESET',
        consumedAt: null,
      },
    });

    // Store new OTP
    await prisma.otpToken.create({
      data: {
        userId: user.id,
        otpHash,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    return {
      message: 'If the email exists, an OTP has been sent',
      // For demo purposes only - in production, send via email
      otpForDemo: otp,
    };
  }

  /**
   * Reset password using OTP
   * Time complexity: O(n) where n = number of OTPs for user (typically small)
   */
  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        otpTokens: {
          where: {
            type: 'PASSWORD_RESET',
            consumedAt: null,
            expiresAt: {
              gt: new Date(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!user || user.otpTokens.length === 0) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    const otpToken = user.otpTokens[0];

    // Verify OTP
    const isValid = await argon2.verify(otpToken.otpHash, otp);

    if (!isValid) {
      throw new BadRequestError('Invalid or expired OTP');
    }

    // Hash new password
    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Update password and mark OTP as consumed
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      prisma.otpToken.update({
        where: { id: otpToken.id },
        data: { consumedAt: new Date() },
      }),
      // Revoke all refresh tokens for security
      prisma.refreshToken.updateMany({
        where: { userId: user.id, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // Verify current password
    const isValid = await argon2.verify(user.passwordHash, currentPassword);

    if (!isValid) {
      throw new BadRequestError('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Store refresh token (hashed)
   */
  async storeRefreshToken(userId: string, token: string, expiresAt: Date) {
    const tokenHash = await argon2.hash(token);

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  /**
   * Verify and get user from refresh token
   */
  async getUserFromRefreshToken(userId: string, token: string) {
    const tokens = await prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            loginId: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    // Find matching token
    for (const dbToken of tokens) {
      try {
        const isValid = await argon2.verify(dbToken.tokenHash, token);
        if (isValid && dbToken.user.isActive) {
          return dbToken.user;
        }
      } catch {
        continue;
      }
    }

    throw new AuthenticationError('Invalid refresh token');
  }

  /**
   * Revoke refresh token
   */
  async revokeRefreshToken(userId: string, token: string) {
    const tokens = await prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
      },
    });

    // Find and revoke matching token
    for (const dbToken of tokens) {
      try {
        const isValid = await argon2.verify(dbToken.tokenHash, token);
        if (isValid) {
          await prisma.refreshToken.update({
            where: { id: dbToken.id },
            data: { isRevoked: true, revokedAt: new Date() },
          });
          return;
        }
      } catch {
        continue;
      }
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        loginId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: { name?: string; email?: string }) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    // If email is being changed, check if it's already in use
    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new ConflictError('Email already in use');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
      },
      select: {
        id: true,
        loginId: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}

export const authService = new AuthService();

