import prisma from '@/config/database.js';
import { subDays, addDays } from 'date-fns';
import { 
  UserRole, 
  LeadSource, 
  LeadPriority, 
  DealStatus, 
  TaskStatus, 
  TaskPriority, 
  TaskType, 
  CommunicationType, 
  CommunicationDirection, 
  CommunicationSourceType,
  ProductType,
  ProductStatus,
  ProposalStatus,
  ActivityEntityType
} from '@prisma/client';
import { RBACService } from '@/modules/rbac/rbac.service.js';
import bcrypt from 'bcryptjs';

export async function seedDemoData() {
  console.log('🌱 Starting database seed for Demo Tenant...');

  // 1. Fetch Demo Tenant
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'demo' }
  });

  if (tenant) {
    console.log('🌱 Demo tenant found. Cleaning existing demo tenant data to ensure a fresh, seamless seed...');
    
    // Deleting in dependency order to avoid foreign key violations
    await prisma.activityLog.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.stageMigration.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.dealProduct.deleteMany({ where: { deal: { tenantId: tenant.id } } });
    await prisma.proposalItem.deleteMany({ where: { proposal: { tenantId: tenant.id } } });
    await prisma.proposal.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.task.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.communication.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.lead.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.campaign.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.deal.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.contact.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.company.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.product.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.emailTemplate.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.pipelineStage.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.userTenantRole.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.rolePermission.deleteMany({ where: { role: { tenantId: tenant.id } } });
    await prisma.role.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.permission.deleteMany({ where: { tenantId: tenant.id } });
    
    await prisma.user.updateMany({
      where: { tenantId: tenant.id },
      data: { invitedById: null }
    });
    await prisma.user.deleteMany({ where: { tenantId: tenant.id } });
    
    await prisma.tenant.delete({ where: { id: tenant.id } });
  }

  // 2. Create default demo tenant
  console.log('🌱 Creating default demo tenant...');
  tenant = await prisma.tenant.create({
    data: {
      name: 'PSG Demo',
      slug: 'demo',
      timezone: 'UTC',
      currency: 'USD',
      status: 'active',
    }
  });

  const passwordHash = await bcrypt.hash('password123', 12);

  // 3. Create Demo Users
  console.log('🌱 Seeding demo users...');
  
  // Admin user 1: demo@PSG.com (The primary login user)
  const demoAdmin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'demo@PSG.com',
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.admin,
      status: 'active',
      passwordHash,
    }
  });

  // Admin user 2: admin@demo.com
  const platformAdmin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.admin,
      status: 'active',
      passwordHash,
    }
  });

  // Manager user: manager@demo.com
  const manager = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'manager@demo.com',
      firstName: 'Sarah',
      lastName: 'Manager',
      role: UserRole.salesManager,
      status: 'active',
      passwordHash,
    }
  });

  // Sales Rep users
  const reps = [];
  const repNames = [
    { first: 'John', last: 'Rep' },
    { first: 'Alice', last: 'Rep' },
    { first: 'David', last: 'Rep' },
    { first: 'Emily', last: 'Rep' },
    { first: 'Michael', last: 'Rep' }
  ];

  for (let i = 0; i < repNames.length; i++) {
    const repEmail = `rep${i + 1}@demo.com`;
    const rep = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: repEmail,
        firstName: repNames[i].first,
        lastName: repNames[i].last,
        role: UserRole.salesRep,
        status: 'active',
        passwordHash,
      }
    });
    reps.push(rep);
  }

  // 4. Seed default RBAC roles and permissions
  console.log('🌱 Seeding RBAC roles and permissions...');
  const seeded = await RBACService.seedDefaults(tenant.id, prisma as any);
  
  const rolesSeeded = await prisma.role.findMany({ where: { tenantId: tenant.id } });
  const adminRole = rolesSeeded.find(r => r.name === 'admin')!;
  const managerRole = rolesSeeded.find(r => r.name === 'salesManager')!;
  const repRole = rolesSeeded.find(r => r.name === 'salesRep')!;

  // Assign RBAC roles to users
  await prisma.userTenantRole.create({
    data: { userId: demoAdmin.id, tenantId: tenant.id, roleId: adminRole.id }
  });
  await prisma.userTenantRole.create({
    data: { userId: platformAdmin.id, tenantId: tenant.id, roleId: adminRole.id }
  });
  await prisma.userTenantRole.create({
    data: { userId: manager.id, tenantId: tenant.id, roleId: managerRole.id }
  });
  for (const rep of reps) {
    await prisma.userTenantRole.create({
      data: { userId: rep.id, tenantId: tenant.id, roleId: repRole.id }
    });
  }

  // 5. Create Pipeline Stages
  console.log('🌱 Seeding pipeline stages...');
  const leadStages = [
    { name: 'New', position: 1, type: 'lead', color: '#6366f1' },
    { name: 'Contacted', position: 2, type: 'lead', color: '#8b5cf6' },
    { name: 'Qualified', position: 3, type: 'lead', color: '#ec4899' },
    { name: 'Nurturing', position: 4, type: 'lead', color: '#f43f5e' },
  ];

  const dealStages = [
    { name: 'Discovery', position: 1, type: 'deal', color: '#6366f1' },
    { name: 'Proposal', position: 2, type: 'deal', color: '#8b5cf6' },
    { name: 'Negotiation', position: 3, type: 'deal', color: '#ec4899' },
    { name: 'Closing', position: 4, type: 'deal', color: '#f43f5e' },
    { name: 'Won', position: 5, type: 'deal', color: '#10b981', isFinal: true },
    { name: 'Lost', position: 6, type: 'deal', color: '#ef4444', isFinal: true },
  ];

  const dbStages = [];
  for (const s of [...leadStages, ...dealStages]) {
    const stage = await prisma.pipelineStage.create({
      data: {
        tenantId: tenant.id,
        name: s.name,
        type: s.type,
        position: s.position,
        color: s.color,
        isFinal: 'isFinal' in s ? (s as any).isFinal : false
      }
    });
    dbStages.push(stage);
  }

  const dbLeadStages = dbStages.filter(s => s.type === 'lead');
  const dbDealStages = dbStages.filter(s => s.type === 'deal');

  // 6. Create Products
  console.log('🌱 Seeding products catalog...');
  const productData = [
    { name: 'Dedicated Desk', category: 'Co-working', type: ProductType.recurring, billingCycle: 'monthly', price: 299, description: 'Single reserved desk in shared workspace' },
    { name: 'Hot Desk Monthly', category: 'Co-working', type: ProductType.recurring, billingCycle: 'monthly', price: 149, description: 'Access to any available desk in open seating area' },
    { name: 'Private Office (4 Seats)', category: 'Office Suite', type: ProductType.recurring, billingCycle: 'monthly', price: 1199, description: 'Fully enclosed lockable office for team of 4' },
    { name: 'Private Office (10 Seats)', category: 'Office Suite', type: ProductType.recurring, billingCycle: 'monthly', price: 2499, description: 'Premium lockable office suite for team of 10' },
    { name: 'Enterprise Consulting Suite', category: 'Consulting', type: ProductType.oneTime, price: 4999, description: 'Full space setup, branding, and dedicated IT infra consulting' },
    { name: 'Meeting Room Pass (10 Hrs)', category: 'Usage', type: ProductType.usage, price: 199, description: 'Pack of 10 meeting room hours usable monthly' },
    { name: 'IT Infrastructure Package', category: 'One-time Addon', type: ProductType.oneTime, price: 499, description: 'Dedicated static IP, custom firewall config, and high-speed port setup' }
  ];

  const products = [];
  for (const p of productData) {
    const prod = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        name: p.name,
        category: p.category,
        type: p.type,
        billingCycle: p.billingCycle || null,
        price: p.price,
        description: p.description,
        status: ProductStatus.active,
        sku: p.name.toUpperCase().replace(/[\s-()]/g, '_'),
        currency: 'USD',
        taxRate: 18.0
      }
    });
    products.push(prod);
  }

  // 6.5. Create Campaigns
  console.log('🌱 Seeding campaigns...');
  const campaignsData = [
    { name: 'Google Ads Search Q3', platform: 'Google Ads', budget: 5000, status: 'active', startDate: subDays(new Date(), 30), endDate: addDays(new Date(), 30) },
    { name: 'Meta Core Retargeting', platform: 'Meta Ads', budget: 3500, status: 'active', startDate: subDays(new Date(), 15), endDate: addDays(new Date(), 45) },
    { name: 'Summer Coworking Email Blast', platform: 'Email', budget: 800, status: 'completed', startDate: subDays(new Date(), 60), endDate: subDays(new Date(), 30) },
    { name: 'Direct Inbound Organic', platform: 'Landing Page', budget: 0, status: 'active', startDate: subDays(new Date(), 90) }
  ];

  const campaigns = [];
  for (const c of campaignsData) {
    const camp = await prisma.campaign.create({
      data: {
        tenantId: tenant.id,
        name: c.name,
        platform: c.platform,
        budget: c.budget,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
      }
    });
    campaigns.push(camp);
  }

  // 7. Create Companies
  console.log('🌱 Seeding companies...');
  const companiesData = [
    { name: 'Vortex AI Solutions', website: 'https://vortexai.io', industry: 'Technology', size: '11-50', revenue: 2500000, description: 'Building next-generation generative AI agents for B2B enterprises.' },
    { name: 'Summit Global Health', website: 'https://summithealth.com', industry: 'Healthcare', size: '201-500', revenue: 15000000, description: 'Global healthcare provider specializing in clinical systems integration.' },
    { name: 'Nexus Logistics Group', website: 'https://nexuslogistics.com', industry: 'Manufacturing', size: '51-200', revenue: 8500000, description: 'Multinational supply chain and freight forwarding services.' },
    { name: 'Starlight Creative Labs', website: 'https://starlightcreative.co', industry: 'Education', size: '1-10', revenue: 450000, description: 'Creative studio delivering interactive learning content and animation.' },
    { name: 'Apex Wealth Capital', website: 'https://apexwealth.com', industry: 'Finance', size: '11-50', revenue: 6200000, description: 'Boutique asset management and private equity firm.' },
    { name: 'Nova Foods Corp', website: 'https://novafoods.com', industry: 'Manufacturing', size: '500+', revenue: 42000000, description: 'Pioneers in high-protein plant-based meat alternatives.' },
    { name: 'Pulse Media Digital', website: 'https://pulsemedia.com', industry: 'Technology', size: '51-200', revenue: 3800000, description: 'Full stack digital marketing and programmatic advertising agency.' },
    { name: 'Core Infrastructure Inc', website: 'https://coreinfra.net', industry: 'Manufacturing', size: '201-500', revenue: 11000000, description: 'Leading structural engineering firm specializing in green buildings.' }
  ];

  const companies = [];
  for (const c of companiesData) {
    const comp = await prisma.company.create({
      data: {
        tenantId: tenant.id,
        name: c.name,
        website: c.website,
        industry: c.industry,
        size: c.size,
        annualRevenue: c.revenue,
        description: c.description,
        createdById: demoAdmin.id,
        tags: ['demo', c.industry.toLowerCase()]
      }
    });
    companies.push(comp);
  }

  // 8. Create Contacts
  console.log('🌱 Seeding contacts...');
  const contactsData = [
    { first: 'Sarah', last: 'Connor', email: 'sconnor@vortexai.io', phone: '+1-555-0199', company: 'Vortex AI Solutions', designation: 'Head of Operations' },
    { first: 'Marcus', last: 'Vance', email: 'mvance@vortexai.io', phone: '+1-555-0142', company: 'Vortex AI Solutions', designation: 'VP of Engineering' },
    { first: 'Elena', last: 'Rostova', email: 'erostova@summithealth.com', phone: '+1-555-0188', company: 'Summit Global Health', designation: 'Chief Facilities Officer' },
    { first: 'David', last: 'Kim', email: 'dkim@nexuslogistics.com', phone: '+1-555-0125', company: 'Nexus Logistics Group', designation: 'Procurement Director' },
    { first: 'Chloe', last: 'Bennett', email: 'chloe@starlightcreative.co', phone: '+1-555-0156', company: 'Starlight Creative Labs', designation: 'Founder & CD' },
    { first: 'Arthur', last: 'Pendleton', email: 'apendleton@apexwealth.com', phone: '+1-555-0177', company: 'Apex Wealth Capital', designation: 'Managing Partner' },
    { first: 'Rebecca', last: 'Nunez', email: 'rnunez@novafoods.com', phone: '+1-555-0111', company: 'Nova Foods Corp', designation: 'Director of HR' },
    { first: 'Julian', last: 'Asher', email: 'julian@pulsemedia.com', phone: '+1-555-0163', company: 'Pulse Media Digital', designation: 'CEO' },
    { first: 'Rachel', last: 'Green', email: 'rgreen@novafoods.com', phone: '+1-555-0100', company: 'Nova Foods Corp', designation: 'Office Manager' },
    { first: 'Liam', last: 'Neeson', email: 'lneeson@coreinfra.net', phone: '+1-555-0191', company: 'Core Infrastructure Inc', designation: 'Site Coordinator' }
  ];

  const contacts = [];
  for (const c of contactsData) {
    const comp = companies.find(comp => comp.name === c.company)!;
    const contact = await prisma.contact.create({
      data: {
        tenantId: tenant.id,
        companyId: comp.id,
        firstName: c.first,
        lastName: c.last,
        email: c.email,
        phone: c.phone,
        designation: c.designation,
        createdById: demoAdmin.id,
        tags: ['lead-contact', 'decision-maker']
      }
    });
    contacts.push(contact);
  }

  // 9. Create Leads
  console.log('🌱 Seeding leads...');
  const leadsData = [
    { title: 'Expansion Space Vortex AI', value: 12000, stage: 'Qualified', contact: 'Sarah Connor', source: LeadSource.webForm, priority: LeadPriority.high, campaign: 'Google Ads Search Q3' },
    { title: 'Summit Health Remote Offices', value: 25000, stage: 'Contacted', contact: 'Elena Rostova', source: LeadSource.referral, priority: LeadPriority.medium, campaign: 'Meta Core Retargeting' },
    { title: 'Nexus Logistics Hub Office', value: 8000, stage: 'New', contact: 'David Kim', source: LeadSource.coldOutreach, priority: LeadPriority.low, campaign: 'Google Ads Search Q3' },
    { title: 'Starlight Creative Co-working', value: 1500, stage: 'Nurturing', contact: 'Chloe Bennett', source: LeadSource.socialMedia, priority: LeadPriority.low, campaign: 'Summer Coworking Email Blast' },
    { title: 'Nova Foods Hybrid Setup', value: 30000, stage: 'New', contact: 'Rebecca Nunez', source: LeadSource.webForm, priority: LeadPriority.urgent, campaign: 'Google Ads Search Q3' },
    { title: 'Apex Wealth Corporate HQ', value: 18000, stage: 'Qualified', contact: 'Arthur Pendleton', source: LeadSource.referral, priority: LeadPriority.high, campaign: 'Meta Core Retargeting' },
    { title: 'Pulse Media Extra Desks', value: 3500, stage: 'Contacted', contact: 'Julian Asher', source: LeadSource.manual, priority: LeadPriority.medium, campaign: 'Direct Inbound Organic' },
    { title: 'Core Infra Project Office', value: 9500, stage: 'Nurturing', contact: 'Liam Neeson', source: LeadSource.manual, priority: LeadPriority.medium, campaign: 'Direct Inbound Organic' }
  ];

  const leads = [];
  for (let i = 0; i < leadsData.length; i++) {
    const l = leadsData[i];
    const contact = contacts.find(c => `${c.firstName} ${c.lastName}` === l.contact)!;
    const stage = dbLeadStages.find(s => s.name === l.stage)!;
    const rep = reps[i % reps.length];
    const leadCampaign = campaigns.find(c => c.name === l.campaign);

    const lead = await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        stageId: stage.id,
        contactId: contact.id,
        companyId: contact.companyId,
        assignedToId: rep.id,
        createdById: demoAdmin.id,
        title: l.title,
        source: l.source,
        priority: l.priority,
        estimatedValue: l.value,
        currency: 'USD',
        score: 60 + (i * 5),
        expectedCloseAt: addDays(new Date(), 30 + i * 2),
        campaignId: leadCampaign?.id || null,
      }
    });
    leads.push(lead);
  }

  // 10. Create Deals
  console.log('🌱 Seeding deals...');
  const dealsData = [
    { title: 'Vortex AI Office Lease', value: 45000, status: DealStatus.open, stage: 'Proposal', contact: 'Sarah Connor' },
    { title: 'Summit Global HQ Expansion', value: 120000, status: DealStatus.open, stage: 'Negotiation', contact: 'Elena Rostova' },
    { title: 'Nova Foods Premium Office Suite', value: 95000, status: DealStatus.won, stage: 'Won', contact: 'Rebecca Nunez' },
    { title: 'Apex Wealth HQ Relocation', value: 65000, status: DealStatus.lost, stage: 'Lost', contact: 'Arthur Pendleton', lostReason: 'Competitor offered lower pricing' },
    { title: 'Starlight Creative Private Desk Combo', value: 8500, status: DealStatus.open, stage: 'Discovery', contact: 'Chloe Bennett' },
    { title: 'Pulse Media Regional Office Suite', value: 38000, status: DealStatus.won, stage: 'Won', contact: 'Julian Asher' },
    { title: 'Core Infra On-Site Setup Office', value: 22000, status: DealStatus.open, stage: 'Closing', contact: 'Liam Neeson' }
  ];

  const deals = [];
  for (let i = 0; i < dealsData.length; i++) {
    const d = dealsData[i];
    const contact = contacts.find(c => `${c.firstName} ${c.lastName}` === d.contact)!;
    const stage = dbDealStages.find(s => s.name === d.stage)!;
    const rep = reps[i % reps.length];

    const deal = await prisma.deal.create({
      data: {
        tenantId: tenant.id,
        stageId: stage.id,
        contactId: contact.id,
        companyId: contact.companyId,
        assignedToId: rep.id,
        createdById: demoAdmin.id,
        title: d.title,
        value: d.value,
        status: d.status,
        probability: d.status === DealStatus.won ? 100 : (d.status === DealStatus.lost ? 0 : 30 + i * 10),
        expectedCloseAt: d.status === DealStatus.open ? addDays(new Date(), 15 + i * 3) : null,
        closedAt: d.status !== DealStatus.open ? subDays(new Date(), 2) : null,
        lostReason: d.lostReason || null,
        tags: ['demo', d.status.toLowerCase()]
      }
    });
    deals.push(deal);
  }

  // 11. Create DealProducts (Junction Table)
  console.log('🌱 Seeding deal products relationships...');
  const dealProductsMap = [
    // Vortex AI Office Lease (Open - Proposal)
    { deal: 'Vortex AI Office Lease', prod: 'Private Office (10 Seats)', qty: 1, discount: 5 },
    { deal: 'Vortex AI Office Lease', prod: 'IT Infrastructure Package', qty: 1, discount: 0 },
    { deal: 'Vortex AI Office Lease', prod: 'Meeting Room Pass (10 Hrs)', qty: 2, discount: 10 },
    
    // Summit Global HQ Expansion (Open - Negotiation)
    { deal: 'Summit Global HQ Expansion', prod: 'Private Office (10 Seats)', qty: 4, discount: 10 },
    { deal: 'Summit Global HQ Expansion', prod: 'Private Office (4 Seats)', qty: 2, discount: 5 },
    { deal: 'Summit Global HQ Expansion', prod: 'Enterprise Consulting Suite', qty: 1, discount: 0 },
    
    // Nova Foods Premium Office Suite (Won)
    { deal: 'Nova Foods Premium Office Suite', prod: 'Private Office (10 Seats)', qty: 3, discount: 8 },
    { deal: 'Nova Foods Premium Office Suite', prod: 'IT Infrastructure Package', qty: 3, discount: 15 },
    
    // Starlight Creative Private Desk Combo (Open - Discovery)
    { deal: 'Starlight Creative Private Desk Combo', prod: 'Dedicated Desk', qty: 3, discount: 0 },
    { deal: 'Starlight Creative Private Desk Combo', prod: 'Meeting Room Pass (10 Hrs)', qty: 1, discount: 0 }
  ];

  for (const dp of dealProductsMap) {
    const deal = deals.find(d => d.title === dp.deal)!;
    const prod = products.find(p => p.name === dp.prod)!;
    const unitPrice = prod.price;
    const rawTotal = Number(unitPrice) * dp.qty;
    const discountAmt = rawTotal * (dp.discount / 100);
    const totalPrice = rawTotal - discountAmt;

    await prisma.dealProduct.create({
      data: {
        dealId: deal.id,
        productId: prod.id,
        quantity: dp.qty,
        unitPrice,
        discount: dp.discount,
        totalPrice,
        notes: `Standard onboarding package with ${dp.discount}% volume discount.`
      }
    });
  }

  // 12. Create Proposals & ProposalItems
  console.log('🌱 Seeding proposals and proposal items...');
  const proposalSeedData = [
    { title: 'Nova Foods Office Lease Proposal', deal: 'Nova Foods Premium Office Suite', contact: 'Rebecca Nunez', status: ProposalStatus.accepted },
    { title: 'Vortex AI Co-working Workspace Proposal', deal: 'Vortex AI Office Lease', contact: 'Sarah Connor', status: ProposalStatus.sent },
    { title: 'Summit Global Expansion Proposal', deal: 'Summit Global HQ Expansion', contact: 'Elena Rostova', status: ProposalStatus.draft },
    { title: 'Apex Wealth Corporate HQ Offer', deal: 'Apex Wealth HQ Relocation', contact: 'Arthur Pendleton', status: ProposalStatus.rejected }
  ];

  for (const p of proposalSeedData) {
    const deal = deals.find(d => d.title === p.deal)!;
    const contact = contacts.find(c => `${c.firstName} ${c.lastName}` === p.contact)!;
    
    // Query deal products to dynamically construct proposal items
    const dealProds = await prisma.dealProduct.findMany({
      where: { dealId: deal.id },
      include: { product: true }
    });

    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    const itemsData = [];
    if (dealProds.length > 0) {
      for (let i = 0; i < dealProds.length; i++) {
        const dp = dealProds[i];
        const itemSubtotal = Number(dp.unitPrice) * dp.quantity;
        const itemDiscount = itemSubtotal * (Number(dp.discount) / 100);
        const itemPriceAfterDiscount = itemSubtotal - itemDiscount;
        const itemTax = itemPriceAfterDiscount * (Number(dp.product.taxRate || 0) / 100);
        
        subtotal += itemSubtotal;
        discountAmount += itemDiscount;
        taxAmount += itemTax;

        itemsData.push({
          productId: dp.productId,
          name: dp.product.name,
          description: dp.product.description,
          quantity: dp.quantity,
          unitPrice: dp.unitPrice,
          discount: dp.discount,
          taxRate: dp.product.taxRate || 0,
          totalPrice: itemPriceAfterDiscount + itemTax,
          position: i + 1
        });
      }
    } else {
      // Fallback custom items if deal has no products
      const itemSubtotal = Number(deal.value);
      const itemTax = itemSubtotal * 0.18;
      
      subtotal = itemSubtotal;
      discountAmount = 0;
      taxAmount = itemTax;

      itemsData.push({
        productId: null,
        name: 'Custom Corporate Space Design Package',
        description: 'Comprehensive office leasing contract & custom interiors design package',
        quantity: 1,
        unitPrice: itemSubtotal,
        discount: 0,
        taxRate: 18.0,
        totalPrice: itemSubtotal + itemTax,
        position: 1
      });
    }

    const totalAmount = subtotal - discountAmount + taxAmount;

    const proposal = await prisma.proposal.create({
      data: {
        tenantId: tenant.id,
        dealId: deal.id,
        contactId: contact.id,
        createdById: demoAdmin.id,
        title: p.title,
        status: p.status,
        version: 1,
        validUntil: addDays(new Date(), 15),
        sentAt: p.status !== ProposalStatus.draft ? subDays(new Date(), 3) : null,
        viewedAt: (([ProposalStatus.sent, ProposalStatus.accepted, ProposalStatus.rejected] as ProposalStatus[]).includes(p.status) ? subDays(new Date(), 2) : null),
        respondedAt: (([ProposalStatus.accepted, ProposalStatus.rejected] as ProposalStatus[]).includes(p.status) ? subDays(new Date(), 1) : null),
        notes: 'Thank you for choosing PSG. This proposal details your customizable workspace configuration.',
        terms: 'Payment is due within 15 days of invoice date. Auto-renewals are billed monthly.',
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        currency: 'USD',
        publicToken: `tok_${Math.random().toString(36).substring(2, 15)}`,
        pdfUrl: `https://storage.googleapis.com/PSG-proposals/${deal.id}-v1.pdf`
      }
    });

    for (const item of itemsData) {
      await prisma.proposalItem.create({
        data: {
          proposalId: proposal.id,
          productId: item.productId,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          totalPrice: item.totalPrice,
          position: item.position
        }
      });
    }
  }

  // 13. Create Tasks
  console.log('🌱 Seeding tasks...');
  const tasksData = [
    { title: 'Follow-up on Vortex AI Proposal', type: TaskType.call, status: TaskStatus.pending, priority: TaskPriority.high, lead: null, deal: 'Vortex AI Office Lease', daysDiff: 1 },
    { title: 'Schedule Discovery Call with Summit Health', type: TaskType.call, status: TaskStatus.completed, priority: TaskPriority.medium, lead: 'Summit Health Remote Offices', deal: null, daysDiff: -2 },
    { title: 'Send Contract Draft to Nova Foods', type: TaskType.proposal, status: TaskStatus.completed, priority: TaskPriority.high, lead: null, deal: 'Nova Foods Premium Office Suite', daysDiff: -1 },
    { title: 'Resolve pricing queries for Apex HQ Relocation', type: TaskType.meeting, status: TaskStatus.completed, priority: TaskPriority.high, lead: null, deal: 'Apex Wealth HQ Relocation', daysDiff: -5 },
    { title: 'Qualify requirements for Starlight Creative', type: TaskType.followUp, status: TaskStatus.pending, priority: TaskPriority.low, lead: 'Starlight Creative Co-working', deal: null, daysDiff: 3 },
    { title: 'Log new lead from Nexus Logistics website', type: TaskType.other, status: TaskStatus.completed, priority: TaskPriority.low, lead: 'Nexus Logistics Hub Office', deal: null, daysDiff: -3 },
    { title: 'Prepare presentation deck for Pulse Media', type: TaskType.demo, status: TaskStatus.completed, priority: TaskPriority.medium, lead: null, deal: 'Pulse Media Regional Office Suite', daysDiff: -6 },
    { title: 'Contract negotiation meeting with Core Infra', type: TaskType.meeting, status: TaskStatus.pending, priority: TaskPriority.high, lead: null, deal: 'Core Infra On-Site Setup Office', daysDiff: 2 },
    { title: 'Call Rebecca Nunez for feedback on onboarding', type: TaskType.call, status: TaskStatus.pending, priority: TaskPriority.medium, lead: null, deal: 'Nova Foods Premium Office Suite', daysDiff: 4 },
    { title: 'Send corporate brochure to David Kim', type: TaskType.email, status: TaskStatus.overdue, priority: TaskPriority.low, lead: 'Nexus Logistics Hub Office', deal: null, daysDiff: -2 }
  ];

  for (const t of tasksData) {
    const assignedRep = reps[Math.floor(Math.random() * reps.length)];
    const dbLead = t.lead ? leads.find(l => l.title === t.lead) : null;
    const dbDeal = t.deal ? deals.find(d => d.title === t.deal) : null;
    const contactId = dbLead ? dbLead.contactId : (dbDeal ? dbDeal.contactId : null);

    const dueAt = addDays(new Date(), t.daysDiff);

    await prisma.task.create({
      data: {
        tenantId: tenant.id,
        assignedToId: assignedRep.id,
        createdById: demoAdmin.id,
        leadId: dbLead ? dbLead.id : null,
        dealId: dbDeal ? dbDeal.id : null,
        contactId,
        title: t.title,
        type: t.type,
        status: t.status,
        priority: t.priority,
        dueAt,
        completedAt: t.status === TaskStatus.completed ? subDays(dueAt, 1) : null
      }
    });
  }

  // 14. Create Communications (Outreach History)
  console.log('🌱 Seeding communications history...');
  const communicationsData = [
    { deal: 'Vortex AI Office Lease', type: CommunicationType.email, subject: 'Space layout suggestions', body: 'Hi Sarah, following up on our call. Please see attached space layouts.' },
    { lead: 'Summit Health Remote Offices', type: CommunicationType.call, subject: 'Initial Discovery Call', body: 'Discussed remote space options. Elena requested 3 regional offices, looking for pricing.' },
    { deal: 'Nova Foods Premium Office Suite', type: CommunicationType.meeting, subject: 'Contract Walkthrough Meeting', body: 'Reviewed the terms. Nova Foods is happy with the 3 suites layout. Confirmed start date.' },
    { deal: 'Apex Wealth HQ Relocation', type: CommunicationType.email, subject: 'Revised Quote and Site Tour Invite', body: 'Sent revised quotation with lower setup fee. Invited Arthur for site tour.' },
    { lead: 'Starlight Creative Co-working', type: CommunicationType.whatsapp, subject: 'Tour booking confirmed', body: 'Sent WhatsApp text confirming tour at 4 PM tomorrow.' },
    { lead: 'Nexus Logistics Hub Office', type: CommunicationType.note, subject: 'CRM Import Note', body: 'Lead imported automatically from landing page form submissions.' },
    { deal: 'Pulse Media Regional Office Suite', type: CommunicationType.call, subject: 'Pricing Proposal review', body: 'Discussed pricing discount. Accepted the offer over the phone. Awaiting signature.' },
    { deal: 'Core Infra On-Site Setup Office', type: CommunicationType.email, subject: 'Draft contract package', body: 'Sent complete draft lease package for internal legal review.' }
  ];

  for (const c of communicationsData) {
    const dbLead = c.lead ? leads.find(l => l.title === c.lead) : null;
    const dbDeal = c.deal ? deals.find(d => d.title === c.deal) : null;
    const contactId = dbLead ? dbLead.contactId : (dbDeal ? dbDeal.contactId : null);
    const assignedUser = reps[Math.floor(Math.random() * reps.length)];

    await prisma.communication.create({
      data: {
        tenantId: tenant.id,
        userId: assignedUser.id,
        contactId,
        leadId: dbLead ? dbLead.id : null,
        dealId: dbDeal ? dbDeal.id : null,
        type: c.type,
        direction: CommunicationDirection.outbound,
        sourceType: CommunicationSourceType.human,
        subject: c.subject,
        body: c.body,
        occurredAt: subDays(new Date(), Math.floor(Math.random() * 10) + 1),
        outcome: 'Completed successfully'
      }
    });
  }

  // 15. Create EmailTemplates
  console.log('🌱 Seeding email templates...');
  const templatesData = [
    {
      name: 'Initial Lead Outreach',
      subject: 'Custom workspace solutions for {{companyName}}',
      type: 'lead_outreach',
      body: 'Hello {{contactFirstName}},\n\nI saw that {{companyName}} is growing, and wanted to reach out. We offer flexible premium workspace solutions tailored to scaling teams. Let me know if you would be open to a quick 10-minute call next week.\n\nBest regards,\n{{userFirstName}}'
    },
    {
      name: 'Post-Tour Follow Up',
      subject: 'Nice meeting you at our space!',
      type: 'follow_up',
      body: 'Hi {{contactFirstName}},\n\nThank you for taking the time to tour our facilities today. I hope the layouts matched your requirements. Attached is our brochure. I will follow up next Tuesday to check if you have any questions.\n\nBest,\n{{userFirstName}}'
    },
    {
      name: 'Proposal Shared Template',
      subject: 'Workspace Lease Proposal for {{companyName}} ready',
      type: 'proposal',
      body: 'Dear {{contactFirstName}},\n\nI have generated the formal lease proposal for {{companyName}} based on our negotiation. You can access the draft details and approve here: {{proposalLink}}\n\nShould you need any modifications, please feel free to comment directly.\n\nWarmly,\n{{userFirstName}}'
    }
  ];

  for (const t of templatesData) {
    await prisma.emailTemplate.create({
      data: {
        tenantId: tenant.id,
        name: t.name,
        subject: t.subject,
        body: t.body,
        type: t.type,
        isActive: true,
        createdById: demoAdmin.id
      }
    });
  }

  // 16. Create StageMigrations (Audit logs for stage progression)
  console.log('🌱 Seeding pipeline stage migrations...');
  const fromLeadStage = dbLeadStages.find(s => s.name === 'New')!;
  const toLeadStage = dbLeadStages.find(s => s.name === 'Contacted')!;
  await prisma.stageMigration.create({
    data: {
      tenantId: tenant.id,
      fromStageId: fromLeadStage.id,
      toStageId: toLeadStage.id,
      stageType: 'lead',
      migratedCount: 5,
      migratedById: demoAdmin.id,
      reason: 'Batch moved new active online signups'
    }
  });

  const fromDealStage = dbDealStages.find(s => s.name === 'Discovery')!;
  const toDealStage = dbDealStages.find(s => s.name === 'Proposal')!;
  await prisma.stageMigration.create({
    data: {
      tenantId: tenant.id,
      fromStageId: fromDealStage.id,
      toStageId: toDealStage.id,
      stageType: 'deal',
      migratedCount: 2,
      migratedById: demoAdmin.id,
      reason: 'Proposals drafted after customer requirement sign-off'
    }
  });

  // 17. Create Activity Logs
  console.log('🌱 Seeding activity audit logs...');
  const activities = [
    { entity: 'lead', name: 'Expansion Space Vortex AI', action: 'created' },
    { entity: 'lead', name: 'Summit Health Remote Offices', action: 'assigned' },
    { entity: 'deal', name: 'Nova Foods Premium Office Suite', action: 'stage_changed' },
    { entity: 'deal', name: 'Apex Wealth HQ Relocation', action: 'updated' },
    { entity: 'contact', name: 'Sarah Connor', action: 'created' },
    { entity: 'company', name: 'Vortex AI Solutions', action: 'created' }
  ];

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    let entityId = '';
    
    if (act.entity === 'lead') {
      entityId = leads.find(l => l.title === act.name)?.id || '';
    } else if (act.entity === 'deal') {
      entityId = deals.find(d => d.title === act.name)?.id || '';
    } else if (act.entity === 'contact') {
      entityId = contacts.find(c => `${c.firstName} ${c.lastName}` === act.name)?.id || '';
    } else if (act.entity === 'company') {
      entityId = companies.find(c => c.name === act.name)?.id || '';
    }

    if (entityId) {
      await prisma.activityLog.create({
        data: {
          tenantId: tenant.id,
          userId: reps[i % reps.length].id,
          entityType: act.entity as ActivityEntityType,
          entityId,
          leadId: act.entity === 'lead' ? entityId : null,
          dealId: act.entity === 'deal' ? entityId : null,
          action: act.action,
          oldValue: { status: 'old' },
          newValue: { status: 'updated' },
          metadata: { ip: '192.168.1.1', userAgent: 'Chrome/Mac' }
        }
      });
    }
  }

  console.log('🏁 Database seeding completed successfully! All 20 tables populated with structured relationships.');
}
