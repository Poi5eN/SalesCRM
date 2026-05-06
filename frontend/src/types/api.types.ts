export type UserStatus = 'active' | 'inactive' | 'invited' | 'suspended';
export type UserRoleType = 'superAdmin' | 'admin' | 'salesManager' | 'salesRep' | 'viewer';
export type TenantStatus = 'active' | 'suspended' | 'trialExpired' | 'cancelled';
export type TenantPlan = 'free' | 'starter' | 'growth' | 'enterprise';
export type LeadSource = 'manual' | 'webForm' | 'importCsv' | 'inboundEmail' | 'referral' | 'socialMedia' | 'coldOutreach' | 'event' | 'aiAgent' | 'other';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';
export type DealStatus = 'open' | 'won' | 'lost' | 'onHold';
export type TaskStatus = 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'overdue';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'call' | 'email' | 'meeting' | 'followUp' | 'demo' | 'proposal' | 'other';
export type CommunicationType = 'email' | 'call' | 'meeting' | 'note' | 'sms' | 'whatsapp' | 'other';
export type CommunicationDirection = 'inbound' | 'outbound' | 'internal';
export type CommunicationSourceType = 'human' | 'aiAgent' | 'callingAgent' | 'system';
export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'revised';
export type ProductStatus = 'active' | 'inactive' | 'archived';
export type ProductType = 'oneTime' | 'recurring' | 'usage' | 'bundle';
export type ActivityEntityType = 'lead' | 'contact' | 'company' | 'deal' | 'task' | 'proposal' | 'product' | 'user' | 'pipelineStage';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logoUrl?: string;
  plan: TenantPlan;
  status: TenantStatus;
  trialEndsAt?: string;
  billingEmail?: string;
  timezone: string;
  currency: string;
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phone?: string;
  status: UserStatus;
  role: UserRoleType;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  tenantId: string;
  resource: string;
  action: string;
  description?: string;
  createdAt: string;
}

export interface PipelineStage {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  position: number;
  color?: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  isArchived: boolean;
  isFinal: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  tenantId: string;
  name: string;
  website?: string;
  industry?: string;
  size?: string;
  annualRevenue?: number;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  pincode?: string;
  linkedinUrl?: string;
  description?: string;
  tags: string[];
  customFields?: any;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    contacts: number;
    leads: number;
    deals: number;
  };
}

export interface Contact {
  id: string;
  tenantId: string;
  companyId?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  designation?: string;
  department?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  country?: string;
  city?: string;
  timezone?: string;
  tags: string[];
  notes?: string;
  isActive: boolean;
  customFields?: any;
  createdById: string;
  company?: Company;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  tenantId: string;
  stageId: string;
  contactId?: string;
  companyId?: string;
  assignedToId?: string;
  createdById: string;
  title: string;
  description?: string;
  source: LeadSource;
  sourceDetail?: string;
  priority: LeadPriority;
  estimatedValue?: number;
  currency: string;
  expectedCloseAt?: string;
  tags: string[];
  customFields?: any;
  isConverted: boolean;
  convertedAt?: string;
  convertedToDealId?: string;
  score: number;
  lastActivityAt: string;
  stage?: PipelineStage;
  contact?: Contact;
  company?: Company;
  assignedTo?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Deal {
  id: string;
  tenantId: string;
  stageId: string;
  contactId?: string;
  companyId?: string;
  assignedToId?: string;
  createdById: string;
  sourceLeadId?: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  status: DealStatus;
  probability: number;
  expectedCloseAt?: string;
  closedAt?: string;
  lostReason?: string;
  tags: string[];
  customFields?: any;
  stage?: PipelineStage;
  contact?: Contact;
  company?: Company;
  assignedTo?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  tenantId: string;
  assignedToId?: string;
  createdById: string;
  leadId?: string;
  dealId?: string;
  contactId?: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string;
  completedAt?: string;
  reminderAt?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: User;
  lead?: Lead;
  deal?: Deal;
  contact?: Contact;
}

export interface Communication {
  id: string;
  tenantId: string;
  userId: string;
  contactId?: string;
  leadId?: string;
  dealId?: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  sourceType: CommunicationSourceType;
  subject?: string;
  body?: string;
  summary?: string;
  occurredAt: string;
  durationSeconds?: number;
  outcome?: string;
  attachments?: any;
  user?: User;
  contact?: Contact;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: ProductType;
  status: ProductStatus;
  sku?: string;
  price: number;
  currency: string;
  billingCycle?: string;
  taxRate?: number;
  category?: string;
  tags: string[];
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

export interface Proposal {
  id: string;
  tenantId: string;
  dealId?: string;
  contactId?: string;
  createdById: string;
  title: string;
  status: ProposalStatus;
  version: number;
  parentProposalId?: string;
  validUntil?: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  notes?: string;
  terms?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  publicToken?: string;
  items?: ProposalItem[];
  createdAt: string;
  updatedAt: string;
  revisions?: Proposal[];
  deal?: Deal;
  contact?: Contact;
}

export interface ProposalItem {
  id: string;
  proposalId: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  totalPrice: number;
  position: number;
}

export interface ActivityLog {
  id: string;
  tenantId: string;
  userId: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  user?: User;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
