import type { Request, Response } from 'express';
import { AuthService } from './auth.service.ts';
import { success } from '@/utils/response.ts';
import { env } from '@/config/env.ts';

export class AuthController {
  static registerTenant = async (req: Request, res: Response) => {
    const result = await AuthService.registerTenant(req.body);
    this.setRefreshCookie(res, result.tokens.refreshToken);
    return success(res, result, 'Tenant registered successfully', 201);
  };

  static login = async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);
    this.setRefreshCookie(res, result.tokens.refreshToken);
    return success(res, result, 'Logged in successfully');
  };

  static refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw { status: 401, message: 'Refresh token missing', code: 'REFRESH_TOKEN_MISSING' };
    }
    const tokens = await AuthService.refresh(refreshToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return success(res, { accessToken: tokens.accessToken }, 'Token refreshed successfully');
  };

  static logout = async (req: Request, res: Response) => {
    if (req.user?.id) {
      await AuthService.logout(req.user.id);
    }
    res.clearCookie('refreshToken');
    return success(res, null, 'Logged out successfully');
  };

  static invite = async (req: Request, res: Response) => {
    const result = await AuthService.inviteUser(req.body, req.user);
    return success(res, result, 'User invited successfully');
  };

  static acceptInvite = async (req: Request, res: Response) => {
    const result = await AuthService.acceptInvite(req.body);
    return success(res, result, 'Invite accepted successfully');
  };

  static me = async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw { status: 401, message: 'Unauthorized', code: 'UNAUTHORIZED' };
    }
    const result = await AuthService.me(req.user.id);
    return success(res, result, 'User profile fetched successfully');
  };

  private static setRefreshCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}
