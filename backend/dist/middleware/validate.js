import { ZodError } from 'zod';
import { error } from '../utils/response.js';
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        }
        catch (err) {
            if (err instanceof ZodError) {
                return error(res, 'Validation Error', 400, 'VALIDATION_ERROR', err.issues);
            }
            return next(err);
        }
    };
};
export default validate;
