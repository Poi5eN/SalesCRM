import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import requestLogger from '@/middleware/requestLogger.ts';
import errorHandler from '@/middleware/errorHandler.ts';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '@/config/swagger.ts';
import notFound from '@/middleware/notFound.ts';
import { env } from '@/config/env.ts';
import { success } from '@/utils/response.ts';
import authRoutes from '@/modules/auth/auth.routes.ts';
import rbacRoutes from '@/modules/rbac/rbac.routes.ts';
import tenantRoutes from '@/modules/tenants/tenant.routes.ts';
import stageRoutes from '@/modules/pipeline-stages/stage.routes.ts';
import companyRoutes from '@/modules/companies/company.routes.ts';
import contactRoutes from '@/modules/contacts/contact.routes.ts';
import leadRoutes from '@/modules/leads/lead.routes.ts';
import dealRoutes from '@/modules/deals/deal.routes.ts';
import taskRoutes from '@/modules/tasks/task.routes.ts';
import communicationRoutes from '@/modules/communications/communication.routes.ts';
import productRoutes from '@/modules/products/product.routes.ts';
import activityRoutes from '@/modules/activities/activity.routes.ts';
import { proposalRoutes, publicProposalRoutes } from '@/modules/proposals/proposal.routes.ts';
import analyticsRoutes from '@/modules/analytics/analytics.routes.ts';
import leadScoringRoutes from '@/modules/leadScoring/leadScoring.routes.ts';
import emailTemplateRoutes from '@/modules/emailTemplates/emailTemplate.routes.ts';

const app = express();

// Security Middleware
app.use(helmet());
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
