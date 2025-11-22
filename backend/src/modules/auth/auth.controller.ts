import { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import { config } from '../../config/index.js';
import { AuthUser } from '../../common/types.js';
import { nanoid } from 'nanoid';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication endpoints
 */
export class AuthController {
  /**
   * User signup
   */
  async signup(
    request: FastifyRequest<{
      Body: {
        loginId: string;
        email: string;
        password: string;
        name: string;
        role?: 'ADMIN' | 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF';
      };
    }>,
    reply: FastifyReply
  ) {
    const user = await authService.signup(request.body);

    // Generate access token
    const accessToken = request.server.jwt.sign(
      {
        id: user.id,
        loginId: user.loginId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      { expiresIn: config.jwt.accessExpiresIn }
    );

    // Generate refresh token
    const refreshToken = nanoid(64);
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(
      refreshExpiresAt.getDate() + 7 // 7 days
    );

    await authService.storeRefreshToken(user.id, refreshToken, refreshExpiresAt);

    // Set refresh token as HttpOnly cookie
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.server.env === 'production',
      sameSite: 'strict',
      path: '/',
      expires: refreshExpiresAt,
    });

    return reply.status(201).send({
      user,
      accessToken,
    });
  }

  /**
   * User login
   */
  async login(
    request: FastifyRequest<{
      Body: { loginIdOrEmail: string; password: string };
    }>,
    reply: FastifyReply
  ) {
    const { loginIdOrEmail, password } = request.body;

    const user = await authService.login(loginIdOrEmail, password);

    // Generate access token
    const accessToken = request.server.jwt.sign(
      {
        id: user.id,
        loginId: user.loginId,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      { expiresIn: config.jwt.accessExpiresIn }
    );

    // Generate refresh token
    const refreshToken = nanoid(64);
    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await authService.storeRefreshToken(user.id, refreshToken, refreshExpiresAt);

    // Set refresh token as HttpOnly cookie
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: config.server.env === 'production',
      sameSite: 'strict',
      path: '/',
      expires: refreshExpiresAt,
    });

    return reply.send({
      user,
      accessToken,
    });
  }

  /**
   * Refresh access token
   */
  async refresh(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      return reply.status(401).send({
        error: {
          message: 'Refresh token not found',
          code: 'AUTHENTICATION_ERROR',
        },
      });
    }

    try {
      // Decode to get userId (not verified yet)
      const decoded = request.server.jwt.decode(refreshToken) as { id?: string } | null;
      
      if (!decoded || !decoded.id) {
        // Try to extract from existing token
        const tempToken = request.headers.authorization?.replace('Bearer ', '');
        if (tempToken) {
          try {
            const tempDecoded = request.server.jwt.decode(tempToken) as AuthUser;
            const user = await authService.getUserFromRefreshToken(tempDecoded.id, refreshToken);
            
            // Generate new access token
            const accessToken = request.server.jwt.sign(
              {
                id: user.id,
                loginId: user.loginId,
                email: user.email,
                name: user.name,
                role: user.role,
              },
              { expiresIn: config.jwt.accessExpiresIn }
            );

            return reply.send({ accessToken });
          } catch {
            // Fall through to error
          }
        }
        
        return reply.status(401).send({
          error: {
            message: 'Invalid refresh token',
            code: 'AUTHENTICATION_ERROR',
          },
        });
      }

      const user = await authService.getUserFromRefreshToken(decoded.id, refreshToken);

      // Generate new access token
      const accessToken = request.server.jwt.sign(
        {
          id: user.id,
          loginId: user.loginId,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        { expiresIn: config.jwt.accessExpiresIn }
      );

      return reply.send({ accessToken });
    } catch (error) {
      return reply.status(401).send({
        error: {
          message: 'Invalid or expired refresh token',
          code: 'AUTHENTICATION_ERROR',
        },
      });
    }
  }

  /**
   * Request OTP for password reset
   */
  async requestOtp(
    request: FastifyRequest<{ Body: { email: string } }>,
    reply: FastifyReply
  ) {
    const { email } = request.body;
    const result = await authService.requestPasswordResetOtp(email);

    return reply.send(result);
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(
    request: FastifyRequest<{
      Body: { email: string; otp: string; newPassword: string };
    }>,
    reply: FastifyReply
  ) {
    const { email, otp, newPassword } = request.body;
    const result = await authService.resetPassword(email, otp, newPassword);

    return reply.send(result);
  }

  /**
   * Get current user
   */
  async me(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as AuthUser;
    const fullUser = await authService.getUserById(user.id);

    return reply.send({ user: fullUser });
  }

  /**
   * Change password
   */
  async changePassword(
    request: FastifyRequest<{
      Body: { currentPassword: string; newPassword: string };
    }>,
    reply: FastifyReply
  ) {
    const user = request.user as AuthUser;
    const { currentPassword, newPassword } = request.body;
    const result = await authService.changePassword(user.id, currentPassword, newPassword);

    // Clear refresh token cookie to force re-login
    reply.clearCookie('refreshToken');

    return reply.send(result);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    request: FastifyRequest<{
      Body: { name?: string; email?: string };
    }>,
    reply: FastifyReply
  ) {
    const user = request.user as AuthUser;
    const { name, email } = request.body;
    const updatedUser = await authService.updateProfile(user.id, { name, email });

    return reply.send({ user: updatedUser });
  }

  /**
   * Logout (revoke refresh token)
   */
  async logout(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = request.cookies.refreshToken;
    const user = request.user as AuthUser;

    if (refreshToken) {
      await authService.revokeRefreshToken(user.id, refreshToken);
    }

    reply.clearCookie('refreshToken');

    return reply.send({ message: 'Logged out successfully' });
  }
}

export const authController = new AuthController();

