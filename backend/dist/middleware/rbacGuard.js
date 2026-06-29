import { error } from '../utils/response.js';
import prisma from '../config/database.js';
const rbacGuard = (resource, action) => {
    return async (req, res, next) => {
        const user = req.user;
        if (!user) {
            return error(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        }
        // Platform level superAdmin has access to everything
        if (user.role === 'superAdmin') {
            return next();
        }
        // Fetch permissions if not already attached (or use a cache)
        if (!req.permissions) {
            // Debug: Log the user object to see what we have
            console.log('RBAC Guard - User object:', JSON.stringify(user, null, 2));
            if (!user.id) {
                return error(res, 'Invalid token - missing user ID', 401, 'INVALID_TOKEN');
            }
            const userWithRoles = await prisma.user.findUnique({
                where: { id: user.id },
                include: {
                    userRoles: {
                        include: {
                            role: {
                                include: {
                                    permissions: {
                                        include: { permission: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            if (!userWithRoles) {
                return error(res, 'User not found', 404, 'USER_NOT_FOUND');
            }
            req.permissions = userWithRoles.userRoles.flatMap(ur => ur.role.permissions.map(rp => `${rp.permission.resource}:${rp.permission.action}`));
        }
        const requiredPermission = `${resource}:${action}`;
        const hasPermission = user.role === 'admin' || req.permissions?.includes(requiredPermission);
        if (!hasPermission) {
            return error(res, 'Forbidden - Insufficient permissions', 403, 'FORBIDDEN');
        }
        next();
    };
};
export default rbacGuard;
