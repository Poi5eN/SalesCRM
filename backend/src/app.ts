import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import requestLogger from '@/middleware/requestLogger.ts';
import errorHandler from '@/middleware/errorHandler.ts';
import notFound from '@/middleware/notFound.ts';
import { env } from '@/config/env.ts';
import { success } from '@/utils/response.ts';
import authRoutes from '@/modules/auth/auth.routes.ts';
import rbacRoutes from '@/modules/rbac/rbac.routes.ts';
import tenantRoutes from '@/modules/tenants/tenant.routes.ts';
import stageRoutes from '@/modules/pipeline-stages/stage.routes.ts';
import companyRoutes from '@/modules/companies/company.routes.ts';
import contactRoutes from '@/modules/contacts/contact.routes.ts';

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
app.use('/api/auth', authRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/pipeline-stages', stageRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/contacts', contactRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
