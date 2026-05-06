import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import requestLogger from '@/middleware/requestLogger.ts';
import errorHandler from '@/middleware/errorHandler.ts';
import notFound from '@/middleware/notFound.ts';
import { env } from '@/config/env.ts';
import { success } from '@/utils/response.ts';

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(requestLogger);

// Health Check
app.get('/health', (req, res) => {
  return success(res, { status: 'ok', timestamp: new Date().toISOString() }, 'System is healthy');
});

// Routes
// app.use('/api/v1', routes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
