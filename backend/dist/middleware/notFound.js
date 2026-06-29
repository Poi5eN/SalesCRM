import { error } from '../utils/response.js';
const notFound = (req, res, next) => {
    return error(res, `Not Found - ${req.originalUrl}`, 404, 'NOT_FOUND');
};
export default notFound;
