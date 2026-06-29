import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import requestLogger from '@/middleware/requestLogger.js';
import errorHandler from '@/middleware/errorHandler.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '@/config/swagger.js';
import notFound from '@/middleware/notFound.js';
import { env } from '@/config/env.js';
import { success } from '@/utils/response.js';
import authRoutes from '@/modules/auth/auth.routes.js';
import rbacRoutes from '@/modules/rbac/rbac.routes.js';
import tenantRoutes from '@/modules/tenants/tenant.routes.js';
import stageRoutes from '@/modules/pipeline-stages/stage.routes.js';
import companyRoutes from '@/modules/companies/company.routes.js';
import contactRoutes from '@/modules/contacts/contact.routes.js';
import leadRoutes from '@/modules/leads/lead.routes.js';
import dealRoutes from '@/modules/deals/deal.routes.js';
import taskRoutes from '@/modules/tasks/task.routes.js';
import communicationRoutes from '@/modules/communications/communication.routes.js';
import productRoutes from '@/modules/products/product.routes.js';
import activityRoutes from '@/modules/activities/activity.routes.js';
import { proposalRoutes, publicProposalRoutes } from '@/modules/proposals/proposal.routes.js';
import analyticsRoutes from '@/modules/analytics/analytics.routes.js';
import leadScoringRoutes from '@/modules/leadScoring/leadScoring.routes.js';
import emailTemplateRoutes from '@/modules/emailTemplates/emailTemplate.routes.js';

const app = express();

// Security Middleware
app.use((helmet as any)());
// Request Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = [env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5174'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Logging
app.use(requestLogger);

// Health Check
app.get('/health', (req, res) => {
  return success(res, { status: 'ok', timestamp: new Date().toISOString() }, 'System is healthy');
});

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rbac', rbacRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/pipeline-stages', stageRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/communications', communicationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/public/proposals', publicProposalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/lead-scoring', leadScoringRoutes);
app.use('/api/email-templates', emailTemplateRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
