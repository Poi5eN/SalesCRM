import { error } from '../utils/response.js';
import { env } from '../config/env.js';
const errorHandler = (err, req, res, next) => {
    console.error('🔥 Error:', err);
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    const code = err.code || 'INTERNAL_SERVER_ERROR';
    const responseData = {
        code,
    };
    if (env.NODE_ENV === 'development') {
        responseData.stack = err.stack;
    }
    if (err.errors) {
        responseData.errors = err.errors;
    }
    return error(res, message, statusCode, code, responseData.errors);
};
export default errorHandler;
