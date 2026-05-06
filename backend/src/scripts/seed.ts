import 'dotenv/config';
import prisma from '../config/database.ts';
import { subDays, addDays } from 'date-fns';
import { UserRole, LeadSource, LeadPriority, DealStatus, TaskStatus, TaskPriority, TaskType, CommunicationType, CommunicationDirection, CommunicationSourceType } from '@prisma/client';

async function main() {
  console.log('🌱 Seeding demo data...');

  // 1. Create Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Corp',
      slug: 'demo',
      timezone: 'UTC',
      currency: 'USD',
      status: 'active',
    }
  });

  // 2. Create Admin
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.admin,
      status: 'active',
      passwordHash: '$2b$10$EpjXfT5q5.9fP3P6Hk5y2.f9P3P6Hk5y2.f9P3P6Hk5y2.f9P3P6Hk5y2.', // 'password'
    }
  });

  // 3. Create Sales Reps
  const reps = [];
  for (let i = 1; i <= 5; i++) {
    const rep = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: `rep${i}@demo.com` } },
      update: {},
      create: {
        tenantId: tenant.id,
        email: `rep${i}@demo.com`,
        firstName: `Sales`,
        lastName: `Rep ${i}`,
        role: UserRole.salesRep,
        status: 'active',
        passwordHash: '$2b$10$EpjXfT5q5.9fP3P6Hk5y2.f9P3P6Hk5y2.f9P3P6Hk5y2.f9P3P6Hk5y2.', // 'password'
      }
    });
    reps.push(rep);
  }

  // 4. Create Pipeline Stages
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

  for (const s of [...leadStages, ...dealStages]) {
    await prisma.pipelineStage.upsert({
      where: { tenantId_name_type: { tenantId: tenant.id, name: s.name, type: s.type } },
      update: {},
      create: { ...s, tenantId: tenant.id }
    });
  }

  const dbLeadStages = await prisma.pipelineStage.findMany({ where: { tenantId: tenant.id, type: 'lead' } });
  const dbDealStages = await prisma.pipelineStage.findMany({ where: { tenantId: tenant.id, type: 'deal' } });

  // 5. Create Companies
  const companies = [];
  const industries = ['Technology', 'Manufacturing', 'Finance', 'Healthcare', 'Education'];
  for (let i = 1; i <= 10; i++) {
    const company = await prisma.company.create({
      data: {
        tenantId: tenant.id,
        name: `Company ${i} Ltd`,
        website: `https://company${i}.com`,
        industry: industries[i % industries.length],
        size: '51-200',
        createdById: admin.id,
      }
    });
    companies.push(company);
  }

  // 6. Create Contacts
  const contacts = [];
  for (let i = 1; i <= 25; i++) {
    const contact = await prisma.contact.create({
      data: {
        tenantId: tenant.id,
        companyId: companies[i % companies.length].id,
        firstName: `Contact`,
        lastName: `${i}`,
        email: `contact${i}@example.com`,
        phone: `+123456789${i}`,
        createdById: admin.id,
      }
    });
    contacts.push(contact);
  }

  // 7. Create Leads
  const leads = [];
  const sources = [LeadSource.manual, LeadSource.webForm, LeadSource.referral, LeadSource.socialMedia];
  for (let i = 1; i <= 40; i++) {
    const lead = await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        stageId: dbLeadStages[i % dbLeadStages.length].id,
        contactId: contacts[i % contacts.length].id,
        companyId: contacts[i % contacts.length].companyId,
        assignedToId: reps[i % reps.length].id,
        createdById: admin.id,
        title: `Project ${i} for ${companies[i % companies.length].name}`,
        source: sources[i % sources.length],
        priority: LeadPriority.medium,
        estimatedValue: 5000 + (i * 100),
        score: Math.floor(Math.random() * 100),
      }
    });
    leads.push(lead);
  }

  // 8. Create Deals
  const deals = [];
  for (let i = 1; i <= 15; i++) {
    const isWon = i % 5 === 0;
    const isLost = i % 7 === 0;
    const status = isWon ? DealStatus.won : (isLost ? DealStatus.lost : DealStatus.open);
    const stage = isWon ? dbDealStages.find(s => s.name === 'Won')! : (isLost ? dbDealStages.find(s => s.name === 'Lost')! : dbDealStages[i % 4]);

    const deal = await prisma.deal.create({
      data: {
        tenantId: tenant.id,
        stageId: stage.id,
        contactId: contacts[i % contacts.length].id,
        companyId: contacts[i % contacts.length].companyId,
        assignedToId: reps[i % reps.length].id,
        createdById: admin.id,
        title: `Deal ${i}: ${companies[i % companies.length].name} Package`,
        value: 15000 + (i * 500),
        status,
        probability: isWon ? 100 : (isLost ? 0 : 40 + i),
        closedAt: (isWon || isLost) ? new Date() : null,
      }
    });
    deals.push(deal);
  }

  // 9. Create Tasks
  for (let i = 1; i <= 30; i++) {
    const isOverdue = i % 3 === 0;
    const isCompleted = i % 4 === 0;
    const dueAt = isOverdue ? subDays(new Date(), 2) : addDays(new Date(), i % 5);
    
    await prisma.task.create({
      data: {
        tenantId: tenant.id,
        assignedToId: reps[i % reps.length].id,
        createdById: admin.id,
        leadId: i % 2 === 0 ? leads[i % leads.length].id : null,
        dealId: i % 2 !== 0 ? deals[i % deals.length].id : null,
        title: `Follow up task ${i}`,
        type: TaskType.call,
        status: isCompleted ? TaskStatus.completed : (isOverdue ? TaskStatus.overdue : TaskStatus.pending),
        priority: TaskPriority.medium,
        dueAt,
        completedAt: isCompleted ? new Date() : null,
      }
    });
  }

  // 10. Create Communications
  for (let i = 1; i <= 20; i++) {
    await prisma.communication.create({
      data: {
        tenantId: tenant.id,
        userId: reps[i % reps.length].id,
        contactId: contacts[i % contacts.length].id,
        type: CommunicationType.email,
        direction: CommunicationDirection.outbound,
        sourceType: CommunicationSourceType.human,
        subject: `Re: Our discussion ${i}`,
        body: `Hello, just following up on our recent meeting regarding the proposal.`,
        occurredAt: subDays(new Date(), i % 10),
      }
    });
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
