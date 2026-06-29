import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export const generateAccessToken = (payload) => {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN,
    });
};
export const generateRefreshToken = (payload) => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    });
};
export const verifyToken = (token, secret) => {
    try {
        return jwt.verify(token, secret);
    }
    catch (error) {
        return null;
    }
};
