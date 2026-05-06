-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'invited', 'suspended');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('superAdmin', 'admin', 'salesManager', 'salesRep', 'viewer');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('active', 'suspended', 'trialExpired', 'cancelled');

-- CreateEnum
CREATE TYPE "TenantPlan" AS ENUM ('free', 'starter', 'growth', 'enterprise');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('manual', 'webForm', 'importCsv', 'inboundEmail', 'referral', 'socialMedia', 'coldOutreach', 'event', 'aiAgent', 'other');

-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('open', 'won', 'lost', 'onHold');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'inProgress', 'completed', 'cancelled', 'overdue');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('call', 'email', 'meeting', 'followUp', 'demo', 'proposal', 'other');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('email', 'call', 'meeting', 'note', 'sms', 'whatsapp', 'other');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('inbound', 'outbound', 'internal');

-- CreateEnum
CREATE TYPE "CommunicationSourceType" AS ENUM ('human', 'aiAgent', 'callingAgent', 'system');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'revised');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('oneTime', 'recurring', 'usage', 'bundle');

-- CreateEnum
CREATE TYPE "ActivityEntityType" AS ENUM ('lead', 'contact', 'company', 'deal', 'task', 'proposal', 'product', 'user', 'pipelineStage');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT,
    "logoUrl" TEXT,
    "plan" "TenantPlan" NOT NULL DEFAULT 'free',
    "status" "TenantStatus" NOT NULL DEFAULT 'active',
    "trialEndsAt" TIMESTAMP(3),
    "billingEmail" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'invited',
    "role" "UserRole" NOT NULL DEFAULT 'salesRep',
    "lastLoginAt" TIMESTAMP(3),
    "invitedById" TEXT,
    "inviteToken" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "refreshToken" TEXT,
    "resetToken" TEXT,
    "resetExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "user_tenant_roles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedById" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tenant_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pipeline_stages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_migrations" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromStageId" TEXT NOT NULL,
    "toStageId" TEXT NOT NULL,
    "stageType" TEXT NOT NULL,
    "migratedCount" INTEGER NOT NULL,
    "migratedById" TEXT NOT NULL,
    "reason" TEXT,
    "migratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stage_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "annualRevenue" DECIMAL(15,2),
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "address" TEXT,
    "pincode" TEXT,
    "linkedinUrl" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "aiEnrichmentData" JSONB,
    "aiLastEnrichedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "designation" TEXT,
    "department" TEXT,
    "linkedinUrl" TEXT,
    "avatarUrl" TEXT,
    "country" TEXT,
    "city" TEXT,
    "timezone" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customFields" JSONB,
    "aiInterestScore" INTEGER,
    "aiGatheredNeeds" JSONB,
    "aiLastContactedAt" TIMESTAMP(3),
    "aiPreferredChannel" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "contactId" TEXT,
    "companyId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'manual',
    "sourceDetail" TEXT,
    "priority" "LeadPriority" NOT NULL DEFAULT 'medium',
    "estimatedValue" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "expectedCloseAt" TIMESTAMP(3),
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "isConverted" BOOLEAN NOT NULL DEFAULT false,
    "convertedAt" TIMESTAMP(3),
    "convertedToDealId" TEXT,
    "aiAgentId" TEXT,
    "aiLastAction" TEXT,
    "aiHandoffAt" TIMESTAMP(3),
    "aiHandoffReason" TEXT,
    "aiGatheredRequirements" JSONB,
    "aiProposalDraft" JSONB,
    "aiSentimentScore" INTEGER,
    "aiNextBestAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "contactId" TEXT,
    "companyId" TEXT,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "sourceLeadId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "DealStatus" NOT NULL DEFAULT 'open',
    "probability" INTEGER NOT NULL DEFAULT 0,
    "expectedCloseAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "lostReason" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customFields" JSONB,
    "aiAgentId" TEXT,
    "aiWinProbability" INTEGER,
    "aiNextBestAction" TEXT,
    "aiChurnRiskScore" INTEGER,
    "aiGatheredRequirements" JSONB,
    "aiProposalDraft" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdById" TEXT NOT NULL,
    "leadId" TEXT,
    "dealId" TEXT,
    "contactId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL DEFAULT 'followUp',
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "priority" "TaskPriority" NOT NULL DEFAULT 'medium',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reminderAt" TIMESTAMP(3),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "aiGeneratedById" TEXT,
    "aiContext" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadId" TEXT,
    "dealId" TEXT,
    "type" "CommunicationType" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL DEFAULT 'outbound',
    "sourceType" "CommunicationSourceType" NOT NULL DEFAULT 'human',
    "subject" TEXT,
    "body" TEXT,
    "summary" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" INTEGER,
    "outcome" TEXT,
    "attachments" JSONB,
    "aiAgentId" TEXT,
    "aiTranscriptUrl" TEXT,
    "aiSentimentScore" INTEGER,
    "aiExtractedData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ProductType" NOT NULL DEFAULT 'oneTime',
    "status" "ProductStatus" NOT NULL DEFAULT 'active',
    "sku" TEXT,
    "price" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "billingCycle" TEXT,
    "taxRate" DECIMAL(5,2),
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imageUrl" TEXT,
    "customFields" JSONB,
    "inventoryType" TEXT,
    "inventoryRefId" TEXT,
    "checkAvailability" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_products" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "deal_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dealId" TEXT,
    "contactId" TEXT,
    "createdById" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentProposalId" TEXT,
    "validUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "notes" TEXT,
    "terms" TEXT,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "pdfUrl" TEXT,
    "publicToken" TEXT,
    "aiGeneratedById" TEXT,
    "aiGenerationContext" JSONB,
    "aiVersion" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_items" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "discount" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "proposal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityType" "ActivityEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "aiAgentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE INDEX "tenants_slug_idx" ON "tenants"("slug");

-- CreateIndex
CREATE INDEX "tenants_status_idx" ON "tenants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_inviteToken_key" ON "users"("inviteToken");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_email_key" ON "users"("tenantId", "email");

-- CreateIndex
CREATE INDEX "roles_tenantId_idx" ON "roles"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_tenantId_name_key" ON "roles"("tenantId", "name");

-- CreateIndex
CREATE INDEX "permissions_tenantId_idx" ON "permissions"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_tenantId_resource_action_key" ON "permissions"("tenantId", "resource", "action");

-- CreateIndex
CREATE INDEX "user_tenant_roles_tenantId_idx" ON "user_tenant_roles"("tenantId");

-- CreateIndex
CREATE INDEX "user_tenant_roles_userId_idx" ON "user_tenant_roles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_tenant_roles_userId_tenantId_roleId_key" ON "user_tenant_roles"("userId", "tenantId", "roleId");

-- CreateIndex
CREATE INDEX "pipeline_stages_tenantId_type_isActive_idx" ON "pipeline_stages"("tenantId", "type", "isActive");

-- CreateIndex
CREATE INDEX "pipeline_stages_tenantId_position_idx" ON "pipeline_stages"("tenantId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_stages_tenantId_name_type_key" ON "pipeline_stages"("tenantId", "name", "type");

-- CreateIndex
CREATE INDEX "stage_migrations_tenantId_idx" ON "stage_migrations"("tenantId");

-- CreateIndex
CREATE INDEX "stage_migrations_fromStageId_idx" ON "stage_migrations"("fromStageId");

-- CreateIndex
CREATE INDEX "stage_migrations_toStageId_idx" ON "stage_migrations"("toStageId");

-- CreateIndex
CREATE INDEX "companies_tenantId_idx" ON "companies"("tenantId");

-- CreateIndex
CREATE INDEX "companies_tenantId_name_idx" ON "companies"("tenantId", "name");

-- CreateIndex
CREATE INDEX "contacts_tenantId_idx" ON "contacts"("tenantId");

-- CreateIndex
CREATE INDEX "contacts_tenantId_email_idx" ON "contacts"("tenantId", "email");

-- CreateIndex
CREATE INDEX "contacts_companyId_idx" ON "contacts"("companyId");

-- CreateIndex
CREATE INDEX "leads_tenantId_idx" ON "leads"("tenantId");

-- CreateIndex
CREATE INDEX "leads_tenantId_stageId_idx" ON "leads"("tenantId", "stageId");

-- CreateIndex
CREATE INDEX "leads_tenantId_assignedToId_idx" ON "leads"("tenantId", "assignedToId");

-- CreateIndex
CREATE INDEX "leads_tenantId_isConverted_idx" ON "leads"("tenantId", "isConverted");

-- CreateIndex
CREATE INDEX "leads_tenantId_createdAt_idx" ON "leads"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "deals_tenantId_idx" ON "deals"("tenantId");

-- CreateIndex
CREATE INDEX "deals_tenantId_stageId_idx" ON "deals"("tenantId", "stageId");

-- CreateIndex
CREATE INDEX "deals_tenantId_status_idx" ON "deals"("tenantId", "status");

-- CreateIndex
CREATE INDEX "deals_tenantId_assignedToId_idx" ON "deals"("tenantId", "assignedToId");

-- CreateIndex
CREATE INDEX "deals_tenantId_expectedCloseAt_idx" ON "deals"("tenantId", "expectedCloseAt");

-- CreateIndex
CREATE INDEX "tasks_tenantId_idx" ON "tasks"("tenantId");

-- CreateIndex
CREATE INDEX "tasks_tenantId_assignedToId_idx" ON "tasks"("tenantId", "assignedToId");

-- CreateIndex
CREATE INDEX "tasks_tenantId_status_idx" ON "tasks"("tenantId", "status");

-- CreateIndex
CREATE INDEX "tasks_tenantId_dueAt_idx" ON "tasks"("tenantId", "dueAt");

-- CreateIndex
CREATE INDEX "tasks_leadId_idx" ON "tasks"("leadId");

-- CreateIndex
CREATE INDEX "tasks_dealId_idx" ON "tasks"("dealId");

-- CreateIndex
CREATE INDEX "communications_tenantId_idx" ON "communications"("tenantId");

-- CreateIndex
CREATE INDEX "communications_tenantId_leadId_idx" ON "communications"("tenantId", "leadId");

-- CreateIndex
CREATE INDEX "communications_tenantId_dealId_idx" ON "communications"("tenantId", "dealId");

-- CreateIndex
CREATE INDEX "communications_tenantId_contactId_idx" ON "communications"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "communications_tenantId_occurredAt_idx" ON "communications"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");

-- CreateIndex
CREATE INDEX "products_tenantId_status_idx" ON "products"("tenantId", "status");

-- CreateIndex
CREATE INDEX "products_tenantId_category_idx" ON "products"("tenantId", "category");

-- CreateIndex
CREATE INDEX "deal_products_dealId_idx" ON "deal_products"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "deal_products_dealId_productId_key" ON "deal_products"("dealId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "proposals_publicToken_key" ON "proposals"("publicToken");

-- CreateIndex
CREATE INDEX "proposals_tenantId_idx" ON "proposals"("tenantId");

-- CreateIndex
CREATE INDEX "proposals_tenantId_dealId_idx" ON "proposals"("tenantId", "dealId");

-- CreateIndex
CREATE INDEX "proposals_tenantId_status_idx" ON "proposals"("tenantId", "status");

-- CreateIndex
CREATE INDEX "proposals_publicToken_idx" ON "proposals"("publicToken");

-- CreateIndex
CREATE INDEX "proposal_items_proposalId_idx" ON "proposal_items"("proposalId");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_entityType_entityId_idx" ON "activity_logs"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_userId_idx" ON "activity_logs"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "activity_logs_tenantId_createdAt_idx" ON "activity_logs"("tenantId", "createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tenant_roles" ADD CONSTRAINT "user_tenant_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tenant_roles" ADD CONSTRAINT "user_tenant_roles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tenant_roles" ADD CONSTRAINT "user_tenant_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_migrations" ADD CONSTRAINT "stage_migrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_migrations" ADD CONSTRAINT "stage_migrations_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_migrations" ADD CONSTRAINT "stage_migrations_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "pipeline_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_products" ADD CONSTRAINT "deal_products_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal_products" ADD CONSTRAINT "deal_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_parentProposalId_fkey" FOREIGN KEY ("parentProposalId") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_lead_fk" FOREIGN KEY ("entityId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_deal_fk" FOREIGN KEY ("entityId") REFERENCES "deals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
