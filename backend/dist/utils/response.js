export const success = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
export const error = (res, message = 'Error occurred', statusCode = 500, code, errors) => {
    return res.status(statusCode).json({
        success: false,
        message,
        code: code || 'INTERNAL_SERVER_ERROR',
        errors,
    });
};
