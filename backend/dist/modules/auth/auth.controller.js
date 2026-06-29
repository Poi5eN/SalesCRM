import { AuthService } from './auth.service.js';
import { success } from '../../utils/response.js';
import { env } from '../../config/env.js';
export class AuthController {
    static registerTenant = async (req, res) => {
        const result = await AuthService.registerTenant(req.body);
        if (result.refreshToken)
            this.setRefreshCookie(res, result.refreshToken);
        return success(res, result, 'Tenant registered successfully', 201);
    };
    static login = async (req, res) => {
        const result = await AuthService.login(req.body);
        if (result.refreshToken)
            this.setRefreshCookie(res, result.refreshToken);
        return success(res, result, 'Logged in successfully');
    };
    static refresh = async (req, res) => {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            throw { status: 401, message: 'Refresh token missing', code: 'REFRESH_TOKEN_MISSING' };
        }
        const tokens = await AuthService.refresh(refreshToken);
        this.setRefreshCookie(res, tokens.refreshToken);
        return success(res, { accessToken: tokens.accessToken }, 'Token refreshed successfully');
    };
    static logout = async (req, res) => {
        if (req.user?.id) {
            await AuthService.logout(req.user.id);
        }
        res.clearCookie('refreshToken');
        return success(res, null, 'Logged out successfully');
    };
    static invite = async (req, res) => {
        const result = await AuthService.inviteUser(req.body, req.user);
        return success(res, result, 'User invited successfully');
    };
    static acceptInvite = async (req, res) => {
        const result = await AuthService.acceptInvite(req.body);
        return success(res, result, 'Invite accepted successfully');
    };
    static me = async (req, res) => {
        if (!req.user?.id) {
            throw { status: 401, message: 'Unauthorized', code: 'UNAUTHORIZED' };
        }
        const result = await AuthService.me(req.user.id);
        return success(res, result, 'User profile fetched successfully');
    };
    static setRefreshCookie(res, token) {
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }
}
