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
import campaignRoutes from '@/modules/campaigns/campaign.routes.js';
import slaRoutes from '@/modules/sla/sla.routes.js';
import stageTransitionRoutes from '@/modules/stage-transitions/stageTransition.routes.js';
import notificationRoutes from '@/modules/notifications/notification.routes.js';
import integrationRoutes from '@/modules/integrations/integration.routes.js';
import billingRoutes from '@/modules/billing/billing.routes.js';
import predictionRoutes from '@/modules/predictions/prediction.routes.js';
import gamificationRoutes from '@/modules/gamification/gamification.routes.js';
import commentRoutes from '@/modules/comments/comment.routes.js';
import digestRoutes from '@/modules/digests/digest.routes.js';

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
    if (!origin) {
      callback(null, true);
      return;
    }
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') || 
                      origin.startsWith('http://localhost:');
    if (isAllowed) {
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
const swaggerOptions = {
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui.min.css',
  customJs: [
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-bundle.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.18.3/swagger-ui-standalone-preset.min.js'
  ]
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Routes
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/rbac', rbacRoutes);
app.use('/rbac', rbacRoutes);

app.use('/api/tenants', tenantRoutes);
app.use('/tenants', tenantRoutes);

app.use('/api/pipeline-stages', stageRoutes);
app.use('/pipeline-stages', stageRoutes);

app.use('/api/companies', companyRoutes);
app.use('/companies', companyRoutes);

app.use('/api/contacts', contactRoutes);
app.use('/contacts', contactRoutes);

app.use('/api/leads', leadRoutes);
app.use('/leads', leadRoutes);

app.use('/api/deals', dealRoutes);
app.use('/deals', dealRoutes);

app.use('/api/tasks', taskRoutes);
app.use('/tasks', taskRoutes);

app.use('/api/communications', communicationRoutes);
app.use('/communications', communicationRoutes);

app.use('/api/products', productRoutes);
app.use('/products', productRoutes);

app.use('/api/activities', activityRoutes);
app.use('/activities', activityRoutes);

app.use('/api/proposals', proposalRoutes);
app.use('/proposals', proposalRoutes);

app.use('/api/public/proposals', publicProposalRoutes);
app.use('/public/proposals', publicProposalRoutes);

app.use('/api/analytics', analyticsRoutes);
app.use('/analytics', analyticsRoutes);

app.use('/api/lead-scoring', leadScoringRoutes);
app.use('/lead-scoring', leadScoringRoutes);

app.use('/api/email-templates', emailTemplateRoutes);
app.use('/email-templates', emailTemplateRoutes);

app.use('/api/campaigns', campaignRoutes);
app.use('/campaigns', campaignRoutes);

app.use('/api/stage-transitions', stageTransitionRoutes);
app.use('/stage-transitions', stageTransitionRoutes);

app.use('/api/sla', slaRoutes);
app.use('/sla', slaRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/notifications', notificationRoutes);

app.use('/api/integrations', integrationRoutes);
app.use('/integrations', integrationRoutes);

app.use('/api/billing', billingRoutes);
app.use('/billing', billingRoutes);

app.use('/api/predictions', predictionRoutes);
app.use('/predictions', predictionRoutes);

app.use('/api/gamification', gamificationRoutes);
app.use('/gamification', gamificationRoutes);

app.use('/api/comments', commentRoutes);
app.use('/comments', commentRoutes);

app.use('/api/digests', digestRoutes);
app.use('/digests', digestRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
