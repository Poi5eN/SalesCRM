import { error } from '../utils/response.js';
const tenantResolver = async (req, res, next) => {
    // Usually tenantId is in the JWT, which authGuard already attached to req.user
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
        return error(res, 'Tenant identification failed', 400, 'TENANT_ID_MISSING');
    }
    // Optional: Validate tenant exists in DB
    // For now, we just attach it. In production, you might want to cache this.
    req.tenant = {
        id: tenantId,
        name: 'Unknown', // You can fetch this from DB if needed
    };
    next();
};
export default tenantResolver;
