import 'dotenv/config';
import app from './app.js';

// Vercel requires module.exports to be the handler directly (not exports.default)
export = app;
