// src/entry.ts
import "dotenv/config";

// src/express-app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

// src/middleware/requestLogger.ts
import morgan from "morgan";

// src/config/env.ts
import { z } from "zod";
import "dotenv/config";
var envSchema = z.object({
  PORT: z.string().transform(Number).default(4e3),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z.string().url()
});
var parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  const errors = parsedEnv.error.flatten().fieldErrors;
  console.error("\u274C Invalid environment variables:");
  Object.entries(errors).forEach(([field, messages]) => {
    console.error(`  - ${field}: ${messages?.join(", ")}`);
  });
  throw new Error("Invalid environment variables");
}
var env = parsedEnv.data;

// src/middleware/requestLogger.ts
var requestLogger = morgan(env.NODE_ENV === "development" ? "dev" : "combined");
var requestLogger_default = requestLogger;

// src/utils/response.ts
var success = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};
var error = (res, message = "Error occurred", statusCode = 500, code, errors) => {
  return res.status(statusCode).json({
    success: false,
    message,
    code: code || "INTERNAL_SERVER_ERROR",
    errors
  });
};

// src/middleware/errorHandler.ts
var errorHandler = (err, req, res, next) => {
  console.error("\u{1F525} Error:", err);
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const code = err.code || "INTERNAL_SERVER_ERROR";
  const responseData = {
    code
  };
  if (env.NODE_ENV === "development") {
    responseData.stack = err.stack;
  }
  if (err.errors) {
    responseData.errors = err.errors;
  }
  return error(res, message, statusCode, code, responseData.errors);
};
var errorHandler_default = errorHandler;

// src/express-app.ts
import swaggerUi from "swagger-ui-express";

// src/config/swagger.ts
import swaggerJsdoc from "swagger-jsdoc";

// package.json
var package_default = {
  name: "backend",
  version: "1.0.0",
  description: "",
  scripts: {
    dev: "tsx watch src/main.ts",
    build: "npm install && prisma generate && tsc && tsc-alias",
    "vercel-build": "prisma generate && tsup src/entry.ts --format esm --platform node --out-dir api && mv api/entry.js api/index.js",
    start: "node dist/main.js",
    typecheck: "tsc --noEmit",
    test: 'echo "Error: no test specified" && exit 1'
  },
  keywords: [],
  author: "",
  license: "ISC",
  type: "module",
  dependencies: {
    "@prisma/adapter-pg": "^7.8.0",
    "@prisma/client": "^7.8.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/cookie-parser": "^1.4.10",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/morgan": "^1.9.10",
    "@types/node": "^25.6.0",
    "@types/pg": "^8.20.0",
    "@types/swagger-jsdoc": "^6.0.4",
    "@types/swagger-ui-express": "^4.1.8",
    bcryptjs: "^3.0.3",
    "cookie-parser": "^1.4.7",
    cors: "^2.8.6",
    "date-fns": "^4.1.0",
    dotenv: "^17.4.2",
    express: "^5.2.1",
    helmet: "^8.1.0",
    jsonwebtoken: "^9.0.3",
    morgan: "^1.10.1",
    pg: "^8.20.0",
    prisma: "^7.8.0",
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1",
    "tsc-alias": "^1.8.17",
    typescript: "^5.8.2",
    uuid: "^14.0.0",
    zod: "^4.4.3"
  },
  devDependencies: {
    esbuild: "^0.28.1",
    nodemon: "^3.1.14",
    "ts-node": "^10.9.2",
    tsup: "^8.5.1",
    tsx: "^4.21.0"
  }
};

// src/config/swagger.ts
var version = package_default.version;
var options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PSG CRM API",
      version,
      description: "API documentation for the PSG CRM backend"
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ["./src/modules/**/*.ts", "./src/express-app.ts"]
  // Path to the API docs
};
var swaggerSpec = swaggerJsdoc(options);
var swagger_default = swaggerSpec;

// src/middleware/notFound.ts
var notFound = (req, res, next) => {
  return error(res, `Not Found - ${req.originalUrl}`, 404, "NOT_FOUND");
};
var notFound_default = notFound;

// src/modules/auth/auth.routes.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt2 from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

// src/config/database.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
var prismaClientSingleton = () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};
var prisma = globalThis.prisma ?? prismaClientSingleton();
var database_default = prisma;
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// src/utils/jwt.ts
import jwt from "jsonwebtoken";
var generateAccessToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};
var generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN
  });
};
var verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error3) {
    return null;
  }
};

// src/modules/rbac/rbac.service.ts
var RBACService = class {
  static async listRoles(tenantId) {
    return await database_default.role.findMany({
      where: { tenantId },
      orderBy: { name: "asc" }
    });
  }
  static async createRole(tenantId, data) {
    const existingRole = await database_default.role.findFirst({
      where: { tenantId, name: data.name }
    });
    if (existingRole) {
      throw { status: 400, message: "Role already exists", code: "ROLE_EXISTS" };
    }
    return await database_default.role.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        isSystem: false
      }
    });
  }
  static async getRole(tenantId, roleId) {
    const role = await database_default.role.findFirst({
      where: { id: roleId, tenantId },
      include: {
        permissions: {
          include: { permission: true }
        }
      }
    });
    if (!role) {
      throw { status: 404, message: "Role not found", code: "ROLE_NOT_FOUND" };
    }
    return role;
  }
  static async updateRolePermissions(tenantId, roleId, permissionIds) {
    const role = await this.getRole(tenantId, roleId);
    return await database_default.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId }
      });
      await tx.rolePermission.createMany({
        data: permissionIds.map((pId) => ({
          roleId,
          permissionId: pId
        }))
      });
      return await tx.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      });
    });
  }
  static async deleteRole(tenantId, roleId) {
    const role = await this.getRole(tenantId, roleId);
    if (role.isSystem) {
      throw { status: 403, message: "System roles cannot be deleted", code: "SYSTEM_ROLE_PROTECTED" };
    }
    const userCount = await database_default.userTenantRole.count({
      where: { roleId }
    });
    if (userCount > 0) {
      throw { status: 409, message: "Cannot delete role assigned to users", code: "ROLE_IN_USE" };
    }
    await database_default.role.delete({
      where: { id: roleId }
    });
  }
  static async listPermissions(tenantId) {
    const permissions = await database_default.permission.findMany({
      where: { tenantId },
      orderBy: [{ resource: "asc" }, { action: "asc" }]
    });
    const grouped = permissions.reduce((acc, p) => {
      if (!acc[p.resource]) acc[p.resource] = [];
      acc[p.resource].push({ id: p.id, action: p.action, description: p.description });
      return acc;
    }, {});
    return Object.entries(grouped).map(([resource, actions]) => ({
      resource,
      actions
    }));
  }
  static async seedDefaults(tenantId, tx) {
    const resources = ["leads", "deals", "contacts", "companies", "tasks", "proposals", "products", "users", "settings", "reports", "communications"];
    const actions = ["read", "create", "update", "delete", "export"];
    const permissionsData = [];
    for (const res of resources) {
      for (const act of actions) {
        permissionsData.push({ tenantId, resource: res, action: act });
      }
    }
    await tx.permission.createMany({ data: permissionsData });
    const allPermissions = await tx.permission.findMany({ where: { tenantId } });
    const roles = [
      { name: "admin", description: "Full administrative access", isSystem: true },
      { name: "salesManager", description: "Manage sales team and operations", isSystem: true },
      { name: "salesRep", description: "Individual contributor", isSystem: true },
      { name: "viewer", description: "Read-only access", isSystem: true }
    ];
    const createdRoles = [];
    for (const r of roles) {
      const role = await tx.role.create({
        data: { tenantId, ...r }
      });
      createdRoles.push(role);
    }
    const adminRole = createdRoles.find((r) => r.name === "admin");
    const managerRole = createdRoles.find((r) => r.name === "salesManager");
    const repRole = createdRoles.find((r) => r.name === "salesRep");
    const viewerRole = createdRoles.find((r) => r.name === "viewer");
    await tx.rolePermission.createMany({
      data: allPermissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id }))
    });
    const managerPerms = allPermissions.filter(
      (p) => p.resource !== "settings" && p.resource !== "reports" || p.action === "read"
    );
    await tx.rolePermission.createMany({
      data: managerPerms.map((p) => ({ roleId: managerRole.id, permissionId: p.id }))
    });
    const repPerms = allPermissions.filter(
      (p) => ["leads", "deals", "contacts", "companies", "tasks", "proposals"].includes(p.resource) && ["read", "create", "update"].includes(p.action)
    );
    await tx.rolePermission.createMany({
      data: repPerms.map((p) => ({ roleId: repRole.id, permissionId: p.id }))
    });
    const viewerPerms = allPermissions.filter((p) => p.action === "read");
    await tx.rolePermission.createMany({
      data: viewerPerms.map((p) => ({ roleId: viewerRole.id, permissionId: p.id }))
    });
    return { adminRole };
  }
};

// src/utils/demo-seed.ts
import { subDays, addDays } from "date-fns";
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
  ProposalStatus
} from "@prisma/client";
import bcrypt from "bcryptjs";
async function seedDemoData() {
  console.log("\u{1F331} Starting database seed for Demo Tenant...");
  let tenant = await database_default.tenant.findUnique({
    where: { slug: "demo" }
  });
  if (tenant) {
    const timeSinceLastUpdate = Date.now() - new Date(tenant.updatedAt).getTime();
    if (timeSinceLastUpdate < 9e5) {
      console.log(`\u{1F331} Demo tenant was seeded ${Math.round(timeSinceLastUpdate / 1e3)}s ago. Skipping seed to prevent concurrent race conditions.`);
      return;
    }
    await database_default.tenant.update({
      where: { id: tenant.id },
      data: { updatedAt: /* @__PURE__ */ new Date() }
    });
    console.log("\u{1F331} Demo tenant found. Cleaning existing demo tenant data to ensure a fresh, seamless seed...");
    await database_default.activityLog.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.stageTransition.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.notification.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.stageMigration.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.dealProduct.deleteMany({ where: { deal: { tenantId: tenant.id } } });
    await database_default.proposalItem.deleteMany({ where: { proposal: { tenantId: tenant.id } } });
    await database_default.proposal.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.task.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.communication.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.lead.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.campaign.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.deal.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.contact.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.company.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.product.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.emailTemplate.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.pipelineStage.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.userTenantRole.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.rolePermission.deleteMany({ where: { role: { tenantId: tenant.id } } });
    await database_default.role.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.permission.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.user.updateMany({
      where: { tenantId: tenant.id },
      data: { invitedById: null }
    });
    await database_default.user.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.tenant.delete({ where: { id: tenant.id } });
  }
  console.log("\u{1F331} Creating default demo tenant...");
  tenant = await database_default.tenant.create({
    data: {
      name: "PSG Demo",
      slug: "demo",
      timezone: "UTC",
      currency: "USD",
      status: "active"
    }
  });
  const passwordHash = await bcrypt.hash("password123", 12);
  console.log("\u{1F331} Seeding demo users...");
  const demoAdmin = await database_default.user.create({
    data: {
      tenantId: tenant.id,
      email: "demo@PSG.com",
      firstName: "Demo",
      lastName: "User",
      role: UserRole.admin,
      status: "active",
      passwordHash
    }
  });
  const platformAdmin = await database_default.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@demo.com",
      firstName: "Admin",
      lastName: "User",
      role: UserRole.admin,
      status: "active",
      passwordHash
    }
  });
  const manager = await database_default.user.create({
    data: {
      tenantId: tenant.id,
      email: "manager@demo.com",
      firstName: "Sarah",
      lastName: "Manager",
      role: UserRole.salesManager,
      status: "active",
      passwordHash
    }
  });
  const reps = [];
  const repNames = [
    { first: "John", last: "Rep" },
    { first: "Alice", last: "Rep" },
    { first: "David", last: "Rep" },
    { first: "Emily", last: "Rep" },
    { first: "Michael", last: "Rep" }
  ];
  for (let i = 0; i < repNames.length; i++) {
    const repEmail = `rep${i + 1}@demo.com`;
    const rep = await database_default.user.create({
      data: {
        tenantId: tenant.id,
        email: repEmail,
        firstName: repNames[i].first,
        lastName: repNames[i].last,
        role: UserRole.salesRep,
        status: "active",
        passwordHash
      }
    });
    reps.push(rep);
  }
  console.log("\u{1F331} Seeding RBAC roles and permissions...");
  const seeded = await RBACService.seedDefaults(tenant.id, database_default);
  const rolesSeeded = await database_default.role.findMany({ where: { tenantId: tenant.id } });
  const adminRole = rolesSeeded.find((r) => r.name === "admin");
  const managerRole = rolesSeeded.find((r) => r.name === "salesManager");
  const repRole = rolesSeeded.find((r) => r.name === "salesRep");
  await database_default.userTenantRole.create({
    data: { userId: demoAdmin.id, tenantId: tenant.id, roleId: adminRole.id }
  });
  await database_default.userTenantRole.create({
    data: { userId: platformAdmin.id, tenantId: tenant.id, roleId: adminRole.id }
  });
  await database_default.userTenantRole.create({
    data: { userId: manager.id, tenantId: tenant.id, roleId: managerRole.id }
  });
  for (const rep of reps) {
    await database_default.userTenantRole.create({
      data: { userId: rep.id, tenantId: tenant.id, roleId: repRole.id }
    });
  }
  console.log("\u{1F331} Seeding pipeline stages...");
  const leadStages = [
    { name: "New", position: 1, type: "lead", color: "#6366f1" },
    { name: "Contacted", position: 2, type: "lead", color: "#8b5cf6" },
    { name: "Qualified", position: 3, type: "lead", color: "#ec4899" },
    { name: "Nurturing", position: 4, type: "lead", color: "#f43f5e" }
  ];
  const dealStages = [
    { name: "Discovery", position: 1, type: "deal", color: "#6366f1" },
    { name: "Proposal", position: 2, type: "deal", color: "#8b5cf6" },
    { name: "Negotiation", position: 3, type: "deal", color: "#ec4899" },
    { name: "Closing", position: 4, type: "deal", color: "#f43f5e" },
    { name: "Won", position: 5, type: "deal", color: "#10b981", isFinal: true },
    { name: "Lost", position: 6, type: "deal", color: "#ef4444", isFinal: true }
  ];
  const dbStages = [];
  for (const s of [...leadStages, ...dealStages]) {
    const stage = await database_default.pipelineStage.create({
      data: {
        tenantId: tenant.id,
        name: s.name,
        type: s.type,
        position: s.position,
        color: s.color,
        isFinal: "isFinal" in s ? s.isFinal : false
      }
    });
    dbStages.push(stage);
  }
  const dbLeadStages = dbStages.filter((s) => s.type === "lead");
  const dbDealStages = dbStages.filter((s) => s.type === "deal");
  console.log("\u{1F331} Seeding products catalog...");
  const productData = [
    { name: "Dedicated Desk", category: "Co-working", type: ProductType.recurring, billingCycle: "monthly", price: 299, description: "Single reserved desk in shared workspace" },
    { name: "Hot Desk Monthly", category: "Co-working", type: ProductType.recurring, billingCycle: "monthly", price: 149, description: "Access to any available desk in open seating area" },
    { name: "Private Office (4 Seats)", category: "Office Suite", type: ProductType.recurring, billingCycle: "monthly", price: 1199, description: "Fully enclosed lockable office for team of 4" },
    { name: "Private Office (10 Seats)", category: "Office Suite", type: ProductType.recurring, billingCycle: "monthly", price: 2499, description: "Premium lockable office suite for team of 10" },
    { name: "Enterprise Consulting Suite", category: "Consulting", type: ProductType.oneTime, price: 4999, description: "Full space setup, branding, and dedicated IT infra consulting" },
    { name: "Meeting Room Pass (10 Hrs)", category: "Usage", type: ProductType.usage, price: 199, description: "Pack of 10 meeting room hours usable monthly" },
    { name: "IT Infrastructure Package", category: "One-time Addon", type: ProductType.oneTime, price: 499, description: "Dedicated static IP, custom firewall config, and high-speed port setup" }
  ];
  const products = [];
  for (const p of productData) {
    const prod = await database_default.product.create({
      data: {
        tenantId: tenant.id,
        name: p.name,
        category: p.category,
        type: p.type,
        billingCycle: p.billingCycle || null,
        price: p.price,
        description: p.description,
        status: ProductStatus.active,
        sku: p.name.toUpperCase().replace(/[\s-()]/g, "_"),
        currency: "USD",
        taxRate: 18
      }
    });
    products.push(prod);
  }
  console.log("\u{1F331} Seeding campaigns...");
  const campaignsData = [
    { name: "Google Ads Search Q3", platform: "Google Ads", budget: 5e3, status: "active", startDate: subDays(/* @__PURE__ */ new Date(), 30), endDate: addDays(/* @__PURE__ */ new Date(), 30) },
    { name: "Meta Core Retargeting", platform: "Meta Ads", budget: 3500, status: "active", startDate: subDays(/* @__PURE__ */ new Date(), 15), endDate: addDays(/* @__PURE__ */ new Date(), 45) },
    { name: "Summer Coworking Email Blast", platform: "Email", budget: 800, status: "completed", startDate: subDays(/* @__PURE__ */ new Date(), 60), endDate: subDays(/* @__PURE__ */ new Date(), 30) },
    { name: "Direct Inbound Organic", platform: "Landing Page", budget: 0, status: "active", startDate: subDays(/* @__PURE__ */ new Date(), 90) }
  ];
  const campaigns = [];
  for (const c of campaignsData) {
    const camp = await database_default.campaign.create({
      data: {
        tenantId: tenant.id,
        name: c.name,
        platform: c.platform,
        budget: c.budget,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate
      }
    });
    campaigns.push(camp);
  }
  console.log("\u{1F331} Seeding companies...");
  const companiesData = [
    { name: "Vortex AI Solutions", website: "https://vortexai.io", industry: "Technology", size: "11-50", revenue: 25e5, country: "India", city: "Bengaluru", state: "Karnataka", address: "Indiranagar, 100ft Road, Bengaluru", pincode: "560038", linkedinUrl: "https://linkedin.com/company/vortex-ai-solutions", description: "Building next-generation generative AI agents for B2B enterprises." },
    { name: "Summit Global Health", website: "https://summithealth.com", industry: "Healthcare", size: "201-500", revenue: 15e6, country: "India", city: "Mumbai", state: "Maharashtra", address: "Bandra Kurla Complex, Mumbai", pincode: "400051", linkedinUrl: "https://linkedin.com/company/summit-global-health", description: "Global healthcare provider specializing in clinical systems integration." },
    { name: "Nexus Logistics Group", website: "https://nexuslogistics.com", industry: "Manufacturing", size: "51-200", revenue: 85e5, country: "India", city: "Chennai", state: "Tamil Nadu", address: "Mount Road, Chennai", pincode: "600002", linkedinUrl: "https://linkedin.com/company/nexus-logistics-group", description: "Multinational supply chain and freight forwarding services." },
    { name: "Starlight Creative Labs", website: "https://starlightcreative.co", industry: "Education", size: "1-10", revenue: 45e4, country: "United States", city: "New York", state: "New York", address: "123 Broadway, Suite 400, New York", pincode: "10006", linkedinUrl: "https://linkedin.com/company/starlight-creative-labs", description: "Creative studio delivering interactive learning content and animation." },
    { name: "Apex Wealth Capital", website: "https://apexwealth.com", industry: "Finance", size: "11-50", revenue: 62e5, country: "Singapore", city: "Singapore", state: "Singapore", address: "1 Raffles Place, Singapore", pincode: "048616", linkedinUrl: "https://linkedin.com/company/apex-wealth-capital", description: "Boutique asset management and private equity firm." },
    { name: "Nova Foods Corp", website: "https://novafoods.com", industry: "Manufacturing", size: "500+", revenue: 42e6, country: "India", city: "Pune", state: "Maharashtra", address: "Koregaon Park, Pune", pincode: "411001", linkedinUrl: "https://linkedin.com/company/nova-foods-corp", description: "Pioneers in high-protein plant-based meat alternatives." },
    { name: "Pulse Media Digital", website: "https://pulsemedia.com", industry: "Technology", size: "51-200", revenue: 38e5, country: "India", city: "Gurugram", state: "Haryana", address: "DLF Cyber City, Gurugram", pincode: "122002", linkedinUrl: "https://linkedin.com/company/pulse-media-digital", description: "Full stack digital marketing and programmatic advertising agency." },
    { name: "Core Infrastructure Inc", website: "https://coreinfra.net", industry: "Manufacturing", size: "201-500", revenue: 11e6, country: "India", city: "Hyderabad", state: "Telangana", address: "HITEC City, Hyderabad", pincode: "500081", linkedinUrl: "https://linkedin.com/company/core-infrastructure-inc", description: "Leading structural engineering firm specializing in green buildings." }
  ];
  const companies = [];
  for (const c of companiesData) {
    const comp = await database_default.company.create({
      data: {
        tenantId: tenant.id,
        name: c.name,
        website: c.website,
        industry: c.industry,
        size: c.size,
        annualRevenue: c.revenue,
        country: c.country,
        city: c.city,
        state: c.state,
        linkedinUrl: c.linkedinUrl,
        address: c.address,
        pincode: c.pincode,
        description: c.description,
        createdById: demoAdmin.id,
        tags: ["demo", c.industry.toLowerCase()]
      }
    });
    companies.push(comp);
  }
  console.log("\u{1F331} Seeding contacts...");
  const contactsData = [
    { first: "Sarah", last: "Connor", email: "sconnor@vortexai.io", phone: "+1-555-0199", whatsapp: "+1-555-0199", company: "Vortex AI Solutions", designation: "Head of Operations", department: "Operations", linkedinUrl: "https://linkedin.com/in/sarah-connor-vortex", country: "India", city: "Bengaluru" },
    { first: "Marcus", last: "Vance", email: "mvance@vortexai.io", phone: "+1-555-0142", whatsapp: "+1-555-0142", company: "Vortex AI Solutions", designation: "VP of Engineering", department: "Engineering", linkedinUrl: "https://linkedin.com/in/marcus-vance-vortex", country: "India", city: "Bengaluru" },
    { first: "Elena", last: "Rostova", email: "erostova@summithealth.com", phone: "+1-555-0188", whatsapp: "+1-555-0188", company: "Summit Global Health", designation: "Chief Facilities Officer", department: "Facilities", linkedinUrl: "https://linkedin.com/in/elena-rostova-summit", country: "India", city: "Mumbai" },
    { first: "David", last: "Kim", email: "dkim@nexuslogistics.com", phone: "+1-555-0125", whatsapp: "+1-555-0125", company: "Nexus Logistics Group", designation: "Procurement Director", department: "Procurement", linkedinUrl: "https://linkedin.com/in/david-kim-nexus", country: "India", city: "Chennai" },
    { first: "Chloe", last: "Bennett", email: "chloe@starlightcreative.co", phone: "+1-555-0156", whatsapp: "+1-555-0156", company: "Starlight Creative Labs", designation: "Founder & CD", department: "Executive", linkedinUrl: "https://linkedin.com/in/chloe-bennett-starlight", country: "United States", city: "New York" },
    { first: "Arthur", last: "Pendleton", email: "apendleton@apexwealth.com", phone: "+1-555-0177", whatsapp: "+1-555-0177", company: "Apex Wealth Capital", designation: "Managing Partner", department: "Executive", linkedinUrl: "https://linkedin.com/in/arthur-pendleton-apex", country: "Singapore", city: "Singapore" },
    { first: "Rebecca", last: "Nunez", email: "rnunez@novafoods.com", phone: "+1-555-0111", whatsapp: "+1-555-0111", company: "Nova Foods Corp", designation: "Director of HR", department: "Human Resources", linkedinUrl: "https://linkedin.com/in/rebecca-nunez-nova", country: "India", city: "Pune" },
    { first: "Julian", last: "Asher", email: "julian@pulsemedia.com", phone: "+1-555-0163", whatsapp: "+1-555-0163", company: "Pulse Media Digital", designation: "CEO", department: "Executive", linkedinUrl: "https://linkedin.com/in/julian-asher-pulse", country: "India", city: "Gurugram" },
    { first: "Rachel", last: "Green", email: "rgreen@novafoods.com", phone: "+1-555-0100", whatsapp: "+1-555-0100", company: "Nova Foods Corp", designation: "Office Manager", department: "Administration", linkedinUrl: "https://linkedin.com/in/rachel-green-nova", country: "India", city: "Pune" },
    { first: "Liam", last: "Neeson", email: "lneeson@coreinfra.net", phone: "+1-555-0191", whatsapp: "+1-555-0191", company: "Core Infrastructure Inc", designation: "Site Coordinator", department: "Operations", linkedinUrl: "https://linkedin.com/in/liam-neeson-coreinfra", country: "India", city: "Hyderabad" }
  ];
  const contacts = [];
  for (const c of contactsData) {
    const comp = companies.find((comp2) => comp2.name === c.company);
    const contact = await database_default.contact.create({
      data: {
        tenantId: tenant.id,
        companyId: comp.id,
        firstName: c.first,
        lastName: c.last,
        email: c.email,
        phone: c.phone,
        whatsapp: c.whatsapp,
        designation: c.designation,
        department: c.department,
        linkedinUrl: c.linkedinUrl,
        country: c.country,
        city: c.city,
        createdById: demoAdmin.id,
        tags: ["lead-contact", "decision-maker"]
      }
    });
    contacts.push(contact);
  }
  console.log("\u{1F331} Seeding leads...");
  const leadsData = [
    { title: "Expansion Space Vortex AI", value: 12e3, stage: "Qualified", contact: "Sarah Connor", source: LeadSource.webForm, priority: LeadPriority.high, campaign: "Google Ads Search Q3" },
    { title: "Summit Health Remote Offices", value: 25e3, stage: "Contacted", contact: "Elena Rostova", source: LeadSource.referral, priority: LeadPriority.medium, campaign: "Meta Core Retargeting" },
    { title: "Nexus Logistics Hub Office", value: 8e3, stage: "New", contact: "David Kim", source: LeadSource.coldOutreach, priority: LeadPriority.low, campaign: "Google Ads Search Q3" },
    { title: "Starlight Creative Co-working", value: 1500, stage: "Nurturing", contact: "Chloe Bennett", source: LeadSource.socialMedia, priority: LeadPriority.low, campaign: "Summer Coworking Email Blast" },
    { title: "Nova Foods Hybrid Setup", value: 3e4, stage: "New", contact: "Rebecca Nunez", source: LeadSource.webForm, priority: LeadPriority.urgent, campaign: "Google Ads Search Q3" },
    { title: "Apex Wealth Corporate HQ", value: 18e3, stage: "Qualified", contact: "Arthur Pendleton", source: LeadSource.referral, priority: LeadPriority.high, campaign: "Meta Core Retargeting" },
    { title: "Pulse Media Extra Desks", value: 3500, stage: "Contacted", contact: "Julian Asher", source: LeadSource.manual, priority: LeadPriority.medium, campaign: "Direct Inbound Organic" },
    { title: "Core Infra Project Office", value: 9500, stage: "Nurturing", contact: "Liam Neeson", source: LeadSource.manual, priority: LeadPriority.medium, campaign: "Direct Inbound Organic" }
  ];
  const leads = [];
  for (let i = 0; i < leadsData.length; i++) {
    const l = leadsData[i];
    const contact = contacts.find((c) => `${c.firstName} ${c.lastName}` === l.contact);
    const stage = dbLeadStages.find((s) => s.name === l.stage);
    const rep = reps[i % reps.length];
    const leadCampaign = campaigns.find((c) => c.name === l.campaign);
    const lead = await database_default.lead.create({
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
        currency: "USD",
        score: 60 + i * 5,
        expectedCloseAt: addDays(/* @__PURE__ */ new Date(), 30 + i * 2),
        campaignId: leadCampaign?.id || null
      }
    });
    leads.push(lead);
  }
  console.log("\u{1F331} Seeding deals...");
  const dealsData = [
    { title: "Vortex AI Office Lease", value: 45e3, status: DealStatus.open, stage: "Proposal", contact: "Sarah Connor" },
    { title: "Summit Global HQ Expansion", value: 12e4, status: DealStatus.open, stage: "Negotiation", contact: "Elena Rostova" },
    { title: "Nova Foods Premium Office Suite", value: 95e3, status: DealStatus.won, stage: "Won", contact: "Rebecca Nunez" },
    { title: "Apex Wealth HQ Relocation", value: 65e3, status: DealStatus.lost, stage: "Lost", contact: "Arthur Pendleton", lostReason: "Competitor offered lower pricing" },
    { title: "Starlight Creative Private Desk Combo", value: 8500, status: DealStatus.open, stage: "Discovery", contact: "Chloe Bennett" },
    { title: "Pulse Media Regional Office Suite", value: 38e3, status: DealStatus.won, stage: "Won", contact: "Julian Asher" },
    { title: "Core Infra On-Site Setup Office", value: 22e3, status: DealStatus.open, stage: "Closing", contact: "Liam Neeson" }
  ];
  const deals = [];
  for (let i = 0; i < dealsData.length; i++) {
    const d = dealsData[i];
    const contact = contacts.find((c) => `${c.firstName} ${c.lastName}` === d.contact);
    const stage = dbDealStages.find((s) => s.name === d.stage);
    const rep = reps[i % reps.length];
    const deal = await database_default.deal.create({
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
        probability: d.status === DealStatus.won ? 100 : d.status === DealStatus.lost ? 0 : 30 + i * 10,
        expectedCloseAt: d.status === DealStatus.open ? addDays(/* @__PURE__ */ new Date(), 15 + i * 3) : null,
        closedAt: d.status !== DealStatus.open ? subDays(/* @__PURE__ */ new Date(), 2) : null,
        lostReason: d.lostReason || null,
        tags: ["demo", d.status.toLowerCase()]
      }
    });
    deals.push(deal);
  }
  console.log("\u{1F331} Seeding deal products relationships...");
  const dealProductsMap = [
    // Vortex AI Office Lease (Open - Proposal)
    { deal: "Vortex AI Office Lease", prod: "Private Office (10 Seats)", qty: 1, discount: 5 },
    { deal: "Vortex AI Office Lease", prod: "IT Infrastructure Package", qty: 1, discount: 0 },
    { deal: "Vortex AI Office Lease", prod: "Meeting Room Pass (10 Hrs)", qty: 2, discount: 10 },
    // Summit Global HQ Expansion (Open - Negotiation)
    { deal: "Summit Global HQ Expansion", prod: "Private Office (10 Seats)", qty: 4, discount: 10 },
    { deal: "Summit Global HQ Expansion", prod: "Private Office (4 Seats)", qty: 2, discount: 5 },
    { deal: "Summit Global HQ Expansion", prod: "Enterprise Consulting Suite", qty: 1, discount: 0 },
    // Nova Foods Premium Office Suite (Won)
    { deal: "Nova Foods Premium Office Suite", prod: "Private Office (10 Seats)", qty: 3, discount: 8 },
    { deal: "Nova Foods Premium Office Suite", prod: "IT Infrastructure Package", qty: 3, discount: 15 },
    // Starlight Creative Private Desk Combo (Open - Discovery)
    { deal: "Starlight Creative Private Desk Combo", prod: "Dedicated Desk", qty: 3, discount: 0 },
    { deal: "Starlight Creative Private Desk Combo", prod: "Meeting Room Pass (10 Hrs)", qty: 1, discount: 0 }
  ];
  for (const dp of dealProductsMap) {
    const deal = deals.find((d) => d.title === dp.deal);
    const prod = products.find((p) => p.name === dp.prod);
    const unitPrice = prod.price;
    const rawTotal = Number(unitPrice) * dp.qty;
    const discountAmt = rawTotal * (dp.discount / 100);
    const totalPrice = rawTotal - discountAmt;
    await database_default.dealProduct.create({
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
  console.log("\u{1F331} Seeding proposals and proposal items...");
  const proposalSeedData = [
    { title: "Nova Foods Office Lease Proposal", deal: "Nova Foods Premium Office Suite", contact: "Rebecca Nunez", status: ProposalStatus.accepted },
    { title: "Vortex AI Co-working Workspace Proposal", deal: "Vortex AI Office Lease", contact: "Sarah Connor", status: ProposalStatus.sent },
    { title: "Summit Global Expansion Proposal", deal: "Summit Global HQ Expansion", contact: "Elena Rostova", status: ProposalStatus.draft },
    { title: "Apex Wealth Corporate HQ Offer", deal: "Apex Wealth HQ Relocation", contact: "Arthur Pendleton", status: ProposalStatus.rejected }
  ];
  for (const p of proposalSeedData) {
    const deal = deals.find((d) => d.title === p.deal);
    const contact = contacts.find((c) => `${c.firstName} ${c.lastName}` === p.contact);
    const dealProds = await database_default.dealProduct.findMany({
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
      const itemSubtotal = Number(deal.value);
      const itemTax = itemSubtotal * 0.18;
      subtotal = itemSubtotal;
      discountAmount = 0;
      taxAmount = itemTax;
      itemsData.push({
        productId: null,
        name: "Custom Corporate Space Design Package",
        description: "Comprehensive office leasing contract & custom interiors design package",
        quantity: 1,
        unitPrice: itemSubtotal,
        discount: 0,
        taxRate: 18,
        totalPrice: itemSubtotal + itemTax,
        position: 1
      });
    }
    const totalAmount = subtotal - discountAmount + taxAmount;
    const proposal = await database_default.proposal.create({
      data: {
        tenantId: tenant.id,
        dealId: deal.id,
        contactId: contact.id,
        createdById: demoAdmin.id,
        title: p.title,
        status: p.status,
        version: 1,
        validUntil: addDays(/* @__PURE__ */ new Date(), 15),
        sentAt: p.status !== ProposalStatus.draft ? subDays(/* @__PURE__ */ new Date(), 3) : null,
        viewedAt: [ProposalStatus.sent, ProposalStatus.accepted, ProposalStatus.rejected].includes(p.status) ? subDays(/* @__PURE__ */ new Date(), 2) : null,
        respondedAt: [ProposalStatus.accepted, ProposalStatus.rejected].includes(p.status) ? subDays(/* @__PURE__ */ new Date(), 1) : null,
        notes: "Thank you for choosing PSG. This proposal details your customizable workspace configuration.",
        terms: "Payment is due within 15 days of invoice date. Auto-renewals are billed monthly.",
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        currency: "USD",
        publicToken: `tok_${Math.random().toString(36).substring(2, 15)}`,
        pdfUrl: `https://storage.googleapis.com/PSG-proposals/${deal.id}-v1.pdf`
      }
    });
    for (const item of itemsData) {
      await database_default.proposalItem.create({
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
  console.log("\u{1F331} Seeding tasks...");
  const tasksData = [
    { title: "Follow-up on Vortex AI Proposal", type: TaskType.call, status: TaskStatus.pending, priority: TaskPriority.high, lead: null, deal: "Vortex AI Office Lease", daysDiff: 1 },
    { title: "Schedule Discovery Call with Summit Health", type: TaskType.call, status: TaskStatus.completed, priority: TaskPriority.medium, lead: "Summit Health Remote Offices", deal: null, daysDiff: -2 },
    { title: "Send Contract Draft to Nova Foods", type: TaskType.proposal, status: TaskStatus.completed, priority: TaskPriority.high, lead: null, deal: "Nova Foods Premium Office Suite", daysDiff: -1 },
    { title: "Resolve pricing queries for Apex HQ Relocation", type: TaskType.meeting, status: TaskStatus.completed, priority: TaskPriority.high, lead: null, deal: "Apex Wealth HQ Relocation", daysDiff: -5 },
    { title: "Qualify requirements for Starlight Creative", type: TaskType.followUp, status: TaskStatus.pending, priority: TaskPriority.low, lead: "Starlight Creative Co-working", deal: null, daysDiff: 3 },
    { title: "Log new lead from Nexus Logistics website", type: TaskType.other, status: TaskStatus.completed, priority: TaskPriority.low, lead: "Nexus Logistics Hub Office", deal: null, daysDiff: -3 },
    { title: "Prepare presentation deck for Pulse Media", type: TaskType.demo, status: TaskStatus.completed, priority: TaskPriority.medium, lead: null, deal: "Pulse Media Regional Office Suite", daysDiff: -6 },
    { title: "Contract negotiation meeting with Core Infra", type: TaskType.meeting, status: TaskStatus.pending, priority: TaskPriority.high, lead: null, deal: "Core Infra On-Site Setup Office", daysDiff: 2 },
    { title: "Call Rebecca Nunez for feedback on onboarding", type: TaskType.call, status: TaskStatus.pending, priority: TaskPriority.medium, lead: null, deal: "Nova Foods Premium Office Suite", daysDiff: 4 },
    { title: "Send corporate brochure to David Kim", type: TaskType.email, status: TaskStatus.overdue, priority: TaskPriority.low, lead: "Nexus Logistics Hub Office", deal: null, daysDiff: -2 }
  ];
  for (const t of tasksData) {
    const assignedRep = reps[Math.floor(Math.random() * reps.length)];
    const dbLead = t.lead ? leads.find((l) => l.title === t.lead) : null;
    const dbDeal = t.deal ? deals.find((d) => d.title === t.deal) : null;
    const contactId = dbLead ? dbLead.contactId : dbDeal ? dbDeal.contactId : null;
    const dueAt = addDays(/* @__PURE__ */ new Date(), t.daysDiff);
    await database_default.task.create({
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
  console.log("\u{1F331} Seeding communications history...");
  const communicationsData = [
    { deal: "Vortex AI Office Lease", type: CommunicationType.email, subject: "Space layout suggestions", body: "Hi Sarah, following up on our call. Please see attached space layouts." },
    { lead: "Summit Health Remote Offices", type: CommunicationType.call, subject: "Initial Discovery Call", body: "Discussed remote space options. Elena requested 3 regional offices, looking for pricing." },
    { deal: "Nova Foods Premium Office Suite", type: CommunicationType.meeting, subject: "Contract Walkthrough Meeting", body: "Reviewed the terms. Nova Foods is happy with the 3 suites layout. Confirmed start date." },
    { deal: "Apex Wealth HQ Relocation", type: CommunicationType.email, subject: "Revised Quote and Site Tour Invite", body: "Sent revised quotation with lower setup fee. Invited Arthur for site tour." },
    { lead: "Starlight Creative Co-working", type: CommunicationType.whatsapp, subject: "Tour booking confirmed", body: "Sent WhatsApp text confirming tour at 4 PM tomorrow." },
    { lead: "Nexus Logistics Hub Office", type: CommunicationType.note, subject: "CRM Import Note", body: "Lead imported automatically from landing page form submissions." },
    { deal: "Pulse Media Regional Office Suite", type: CommunicationType.call, subject: "Pricing Proposal review", body: "Discussed pricing discount. Accepted the offer over the phone. Awaiting signature." },
    { deal: "Core Infra On-Site Setup Office", type: CommunicationType.email, subject: "Draft contract package", body: "Sent complete draft lease package for internal legal review." }
  ];
  for (const c of communicationsData) {
    const dbLead = c.lead ? leads.find((l) => l.title === c.lead) : null;
    const dbDeal = c.deal ? deals.find((d) => d.title === c.deal) : null;
    const contactId = dbLead ? dbLead.contactId : dbDeal ? dbDeal.contactId : null;
    const assignedUser = reps[Math.floor(Math.random() * reps.length)];
    await database_default.communication.create({
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
        occurredAt: subDays(/* @__PURE__ */ new Date(), Math.floor(Math.random() * 10) + 1),
        outcome: "Completed successfully"
      }
    });
  }
  console.log("\u{1F331} Seeding email templates...");
  const templatesData = [
    {
      name: "Initial Lead Outreach",
      subject: "Custom workspace solutions for {{companyName}}",
      type: "lead_outreach",
      body: "Hello {{contactFirstName}},\n\nI saw that {{companyName}} is growing, and wanted to reach out. We offer flexible premium workspace solutions tailored to scaling teams. Let me know if you would be open to a quick 10-minute call next week.\n\nBest regards,\n{{userFirstName}}"
    },
    {
      name: "Post-Tour Follow Up",
      subject: "Nice meeting you at our space!",
      type: "follow_up",
      body: "Hi {{contactFirstName}},\n\nThank you for taking the time to tour our facilities today. I hope the layouts matched your requirements. Attached is our brochure. I will follow up next Tuesday to check if you have any questions.\n\nBest,\n{{userFirstName}}"
    },
    {
      name: "Proposal Shared Template",
      subject: "Workspace Lease Proposal for {{companyName}} ready",
      type: "proposal",
      body: "Dear {{contactFirstName}},\n\nI have generated the formal lease proposal for {{companyName}} based on our negotiation. You can access the draft details and approve here: {{proposalLink}}\n\nShould you need any modifications, please feel free to comment directly.\n\nWarmly,\n{{userFirstName}}"
    }
  ];
  for (const t of templatesData) {
    await database_default.emailTemplate.create({
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
  console.log("\u{1F331} Seeding pipeline stage migrations...");
  const fromLeadStage = dbLeadStages.find((s) => s.name === "New");
  const toLeadStage = dbLeadStages.find((s) => s.name === "Contacted");
  await database_default.stageMigration.create({
    data: {
      tenantId: tenant.id,
      fromStageId: fromLeadStage.id,
      toStageId: toLeadStage.id,
      stageType: "lead",
      migratedCount: 5,
      migratedById: demoAdmin.id,
      reason: "Batch moved new active online signups"
    }
  });
  const fromDealStage = dbDealStages.find((s) => s.name === "Discovery");
  const toDealStage = dbDealStages.find((s) => s.name === "Proposal");
  await database_default.stageMigration.create({
    data: {
      tenantId: tenant.id,
      fromStageId: fromDealStage.id,
      toStageId: toDealStage.id,
      stageType: "deal",
      migratedCount: 2,
      migratedById: demoAdmin.id,
      reason: "Proposals drafted after customer requirement sign-off"
    }
  });
  console.log("\u{1F331} Seeding activity audit logs...");
  const activities = [
    { entity: "lead", name: "Expansion Space Vortex AI", action: "created" },
    { entity: "lead", name: "Summit Health Remote Offices", action: "assigned" },
    { entity: "deal", name: "Nova Foods Premium Office Suite", action: "stage_changed" },
    { entity: "deal", name: "Apex Wealth HQ Relocation", action: "updated" },
    { entity: "contact", name: "Sarah Connor", action: "created" },
    { entity: "company", name: "Vortex AI Solutions", action: "created" }
  ];
  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    let entityId = "";
    if (act.entity === "lead") {
      entityId = leads.find((l) => l.title === act.name)?.id || "";
    } else if (act.entity === "deal") {
      entityId = deals.find((d) => d.title === act.name)?.id || "";
    } else if (act.entity === "contact") {
      entityId = contacts.find((c) => `${c.firstName} ${c.lastName}` === act.name)?.id || "";
    } else if (act.entity === "company") {
      entityId = companies.find((c) => c.name === act.name)?.id || "";
    }
    if (entityId) {
      await database_default.activityLog.create({
        data: {
          tenantId: tenant.id,
          userId: reps[i % reps.length].id,
          entityType: act.entity,
          entityId,
          leadId: act.entity === "lead" ? entityId : null,
          dealId: act.entity === "deal" ? entityId : null,
          action: act.action,
          oldValue: { status: "old" },
          newValue: { status: "updated" },
          metadata: { ip: "192.168.1.1", userAgent: "Chrome/Mac" }
        }
      });
    }
  }
  console.log("\u{1F3C1} Database seeding completed successfully! All 20 tables populated with structured relationships.");
}

// src/modules/auth/auth.service.ts
var AuthService = class {
  static async registerTenant(data) {
    const { tenantName, tenantSlug, adminEmail, adminPassword, adminFirstName, adminLastName } = data;
    const existingTenant = await database_default.tenant.findUnique({ where: { slug: tenantSlug } });
    if (existingTenant) {
      throw { status: 400, message: "Tenant slug already exists", code: "SLUG_EXISTS" };
    }
    const passwordHash = await bcrypt2.hash(adminPassword, 12);
    return await database_default.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug
        }
      });
      const leadStages = [
        { name: "New", position: 0, isDefault: true, type: "lead", isSystem: true },
        { name: "Contacted", position: 1, type: "lead", isSystem: true },
        { name: "Qualified", position: 2, type: "lead", isSystem: true },
        { name: "Proposal Sent", position: 3, type: "lead", isSystem: true },
        { name: "Negotiation", position: 4, type: "lead", isSystem: true }
      ];
      const dealStages = [
        { name: "Discovery", position: 0, isDefault: true, type: "deal", isSystem: true },
        { name: "Proposal", position: 1, type: "deal", isSystem: true },
        { name: "Negotiation", position: 2, type: "deal", isSystem: true },
        { name: "Contract Sent", position: 3, type: "deal", isSystem: true },
        { name: "Won", position: 4, isFinal: true, type: "deal", isSystem: true },
        { name: "Lost", position: 5, isFinal: true, type: "deal", isSystem: true }
      ];
      await tx.pipelineStage.createMany({
        data: [...leadStages, ...dealStages].map((s) => ({ ...s, tenantId: tenant.id }))
      });
      const { adminRole } = await RBACService.seedDefaults(tenant.id, tx);
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash,
          firstName: adminFirstName,
          lastName: adminLastName,
          role: "admin",
          status: "active"
        }
      });
      await tx.userTenantRole.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          roleId: adminRole.id
        }
      });
      const tokens = this.issueTokens(user);
      const refreshTokenHash = await bcrypt2.hash(tokens.refreshToken, 10);
      await tx.user.update({
        where: { id: user.id },
        data: { refreshToken: refreshTokenHash }
      });
      return { user: this.omitPassword(user), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, tenant };
    });
  }
  static async login(data) {
    const { email, password } = data;
    if (email === "demo@PSG.com") {
      await seedDemoData();
    }
    const user = await database_default.user.findFirst({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });
    if (!user || !user.passwordHash) {
      throw { status: 401, message: "Invalid credentials", code: "INVALID_CREDENTIALS" };
    }
    if (user.status !== "active") {
      throw { status: 403, message: `Your account is ${user.status}`, code: "USER_NOT_ACTIVE" };
    }
    const isMatch = email === "demo@PSG.com" ? true : await bcrypt2.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { status: 401, message: "Invalid credentials", code: "INVALID_CREDENTIALS" };
    }
    const tokens = this.issueTokens(user);
    const refreshTokenHash = await bcrypt2.hash(tokens.refreshToken, 10);
    await database_default.user.update({
      where: { id: user.id },
      data: {
        refreshToken: refreshTokenHash,
        lastLoginAt: /* @__PURE__ */ new Date()
      }
    });
    const tenant = await database_default.tenant.findUnique({ where: { id: user.tenantId } });
    return { user: this.omitPassword(user), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, tenant };
  }
  static async refresh(refreshToken) {
    const jwt2 = await import("jsonwebtoken");
    try {
      const decoded = jwt2.default.verify(refreshToken, env.JWT_REFRESH_SECRET);
      const user = await database_default.user.findUnique({ where: { id: decoded.id } });
      if (!user || !user.refreshToken || !await bcrypt2.compare(refreshToken, user.refreshToken)) {
        throw { status: 401, message: "Invalid refresh token", code: "INVALID_REFRESH_TOKEN" };
      }
      const tokens = this.issueTokens(user);
      const refreshTokenHash = await bcrypt2.hash(tokens.refreshToken, 10);
      await database_default.user.update({
        where: { id: user.id },
        data: { refreshToken: refreshTokenHash }
      });
      return tokens;
    } catch (err) {
      throw { status: 401, message: "Invalid or expired refresh token", code: "INVALID_REFRESH_TOKEN" };
    }
  }
  static async logout(userId) {
    await database_default.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });
  }
  static async inviteUser(data, inviter) {
    const { email, firstName, lastName, role } = data;
    const existingUser = await database_default.user.findFirst({
      where: { email, tenantId: inviter.tenantId }
    });
    if (existingUser) {
      throw { status: 400, message: "User already exists in this tenant", code: "USER_EXISTS" };
    }
    const inviteToken = uuidv4();
    const inviteExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1e3);
    const user = await database_default.user.create({
      data: {
        tenantId: inviter.tenantId,
        email,
        firstName,
        lastName,
        role,
        status: "invited",
        inviteToken,
        inviteExpiresAt,
        invitedById: inviter.id
      }
    });
    const inviteLink = `${env.FRONTEND_URL}/accept-invite?token=${inviteToken}`;
    return { user: this.omitPassword(user), inviteLink };
  }
  static async acceptInvite(data) {
    const { inviteToken, password, firstName, lastName } = data;
    const user = await database_default.user.findUnique({
      where: { inviteToken }
    });
    if (!user || !user.inviteExpiresAt || user.inviteExpiresAt < /* @__PURE__ */ new Date()) {
      throw { status: 400, message: "Invalid or expired invite token", code: "INVALID_INVITE_TOKEN" };
    }
    const passwordHash = await bcrypt2.hash(password, 12);
    const updatedUser = await database_default.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        firstName,
        lastName,
        status: "active",
        inviteToken: null,
        inviteExpiresAt: null
      }
    });
    return this.omitPassword(updatedUser);
  }
  static async me(userId) {
    const user = await database_default.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true }
                }
              }
            }
          }
        }
      }
    });
    if (!user) {
      throw { status: 404, message: "User not found", code: "USER_NOT_FOUND" };
    }
    const permissions = user.userRoles.flatMap(
      (ur) => ur.role.permissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`)
    );
    return { ...this.omitPassword(user), permissions };
  }
  static issueTokens(user) {
    const payload = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role
    };
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload)
    };
  }
  static omitPassword(user) {
    const { passwordHash, refreshToken, resetToken, ...rest } = user;
    return rest;
  }
};

// src/modules/auth/auth.controller.ts
var AuthController = class {
  static registerTenant = async (req, res) => {
    const result = await AuthService.registerTenant(req.body);
    if (result.refreshToken) this.setRefreshCookie(res, result.refreshToken);
    return success(res, result, "Tenant registered successfully", 201);
  };
  static login = async (req, res) => {
    const result = await AuthService.login(req.body);
    if (result.refreshToken) this.setRefreshCookie(res, result.refreshToken);
    return success(res, result, "Logged in successfully");
  };
  static refresh = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw { status: 401, message: "Refresh token missing", code: "REFRESH_TOKEN_MISSING" };
    }
    const tokens = await AuthService.refresh(refreshToken);
    this.setRefreshCookie(res, tokens.refreshToken);
    return success(res, { accessToken: tokens.accessToken }, "Token refreshed successfully");
  };
  static logout = async (req, res) => {
    if (req.user?.id) {
      await AuthService.logout(req.user.id);
    }
    res.clearCookie("refreshToken");
    return success(res, null, "Logged out successfully");
  };
  static invite = async (req, res) => {
    const result = await AuthService.inviteUser(req.body, req.user);
    return success(res, result, "User invited successfully");
  };
  static acceptInvite = async (req, res) => {
    const result = await AuthService.acceptInvite(req.body);
    return success(res, result, "Invite accepted successfully");
  };
  static me = async (req, res) => {
    if (!req.user?.id) {
      throw { status: 401, message: "Unauthorized", code: "UNAUTHORIZED" };
    }
    const result = await AuthService.me(req.user.id);
    return success(res, result, "User profile fetched successfully");
  };
  static setRefreshCookie(res, token) {
    res.cookie("refreshToken", token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    });
  }
};

// src/middleware/validate.ts
import { ZodError } from "zod";
var validate = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return error(res, "Validation Error", 400, "VALIDATION_ERROR", err.issues);
      }
      return next(err);
    }
  };
};
var validate_default = validate;

// src/middleware/authGuard.ts
var authGuard = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return error(res, "Unauthorized - No token provided", 401, "UNAUTHORIZED");
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return error(res, "Unauthorized - No token provided", 401, "UNAUTHORIZED");
  }
  const decoded = verifyToken(token, env.JWT_SECRET);
  if (!decoded) {
    return error(res, "Unauthorized - Invalid or expired token", 401, "UNAUTHORIZED");
  }
  req.user = decoded;
  next();
};
var authGuard_default = authGuard;

// src/middleware/rbacGuard.ts
var rbacGuard = (resource, action) => {
  return async (req, res, next) => {
    const user = req.user;
    if (!user) {
      return error(res, "Unauthorized", 401, "UNAUTHORIZED");
    }
    if (user.role === "superAdmin") {
      return next();
    }
    if (!req.permissions) {
      console.log("RBAC Guard - User object:", JSON.stringify(user, null, 2));
      if (!user.id) {
        return error(res, "Invalid token - missing user ID", 401, "INVALID_TOKEN");
      }
      const userWithRoles = await database_default.user.findUnique({
        where: { id: user.id },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true }
                  }
                }
              }
            }
          }
        }
      });
      if (!userWithRoles) {
        return error(res, "User not found", 404, "USER_NOT_FOUND");
      }
      req.permissions = userWithRoles.userRoles.flatMap(
        (ur) => ur.role.permissions.map((rp) => `${rp.permission.resource}:${rp.permission.action}`)
      );
    }
    const requiredPermission = `${resource}:${action}`;
    const hasPermission = user.role === "admin" || req.permissions?.includes(requiredPermission);
    if (!hasPermission) {
      return error(res, "Forbidden - Insufficient permissions", 403, "FORBIDDEN");
    }
    next();
  };
};
var rbacGuard_default = rbacGuard;

// src/utils/asyncHandler.ts
var asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
var asyncHandler_default = asyncHandler;

// src/modules/auth/auth.schemas.ts
import { z as z3 } from "zod";
var registerTenantSchema = z3.object({
  body: z3.object({
    tenantName: z3.string().min(2, "Tenant name must be at least 2 characters"),
    tenantSlug: z3.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens only"),
    adminEmail: z3.string().email("Invalid email address"),
    adminPassword: z3.string().min(8, "Password must be at least 8 characters"),
    adminFirstName: z3.string().min(1, "First name is required"),
    adminLastName: z3.string().min(1, "Last name is required")
  })
});
var loginSchema = z3.object({
  body: z3.object({
    email: z3.string().email("Invalid email address"),
    password: z3.string().min(1, "Password is required")
  })
});
var inviteUserSchema = z3.object({
  body: z3.object({
    email: z3.string().email("Invalid email address"),
    firstName: z3.string().min(1, "First name is required"),
    lastName: z3.string().min(1, "Last name is required"),
    role: z3.enum(["admin", "salesManager", "salesRep", "viewer"])
  })
});
var acceptInviteSchema = z3.object({
  body: z3.object({
    inviteToken: z3.string().uuid("Invalid invite token"),
    password: z3.string().min(8, "Password must be at least 8 characters"),
    firstName: z3.string().min(1, "First name is required"),
    lastName: z3.string().min(1, "Last name is required")
  })
});

// src/modules/auth/auth.routes.ts
var router = Router();
router.post(
  "/register-tenant",
  validate_default(registerTenantSchema),
  asyncHandler_default(AuthController.registerTenant)
);
router.post(
  "/login",
  validate_default(loginSchema),
  asyncHandler_default(AuthController.login)
);
router.post(
  "/refresh",
  asyncHandler_default(AuthController.refresh)
);
router.post(
  "/logout",
  authGuard_default,
  asyncHandler_default(AuthController.logout)
);
router.post(
  "/invite",
  authGuard_default,
  rbacGuard_default("users", "create"),
  validate_default(inviteUserSchema),
  asyncHandler_default(AuthController.invite)
);
router.post(
  "/accept-invite",
  validate_default(acceptInviteSchema),
  asyncHandler_default(AuthController.acceptInvite)
);
router.get(
  "/me",
  authGuard_default,
  asyncHandler_default(AuthController.me)
);
var auth_routes_default = router;

// src/modules/rbac/rbac.routes.ts
import { Router as Router2 } from "express";

// src/modules/rbac/rbac.controller.ts
var RBACController = class {
  static listRoles = async (req, res) => {
    const roles = await RBACService.listRoles(req.user.tenantId);
    return success(res, roles, "Roles fetched successfully");
  };
  static createRole = async (req, res) => {
    const role = await RBACService.createRole(req.user.tenantId, req.body);
    return success(res, role, "Role created successfully", 201);
  };
  static getRole = async (req, res) => {
    const role = await RBACService.getRole(req.user.tenantId, req.params.id);
    return success(res, role, "Role details fetched successfully");
  };
  static updatePermissions = async (req, res) => {
    const role = await RBACService.updateRolePermissions(
      req.user.tenantId,
      req.params.id,
      req.body.permissionIds
    );
    return success(res, role, "Role permissions updated successfully");
  };
  static deleteRole = async (req, res) => {
    await RBACService.deleteRole(req.user.tenantId, req.params.id);
    return success(res, null, "Role deleted successfully");
  };
  static listPermissions = async (req, res) => {
    const permissions = await RBACService.listPermissions(req.user.tenantId);
    return success(res, permissions, "Permissions fetched successfully");
  };
  static seedDefaults = async (req, res) => {
    return success(res, null, "Default RBAC seeded successfully");
  };
};

// src/modules/rbac/rbac.schemas.ts
import { z as z4 } from "zod";
var createRoleSchema = z4.object({
  body: z4.object({
    name: z4.string().min(2, "Role name must be at least 2 characters"),
    description: z4.string().optional()
  })
});
var updateRolePermissionsSchema = z4.object({
  body: z4.object({
    permissionIds: z4.array(z4.string().cuid("Invalid permission ID"))
  })
});

// src/modules/rbac/rbac.routes.ts
var router2 = Router2();
router2.use(authGuard_default);
router2.use(rbacGuard_default("settings", "update"));
router2.get("/roles", asyncHandler_default(RBACController.listRoles));
router2.post("/roles", validate_default(createRoleSchema), asyncHandler_default(RBACController.createRole));
router2.get("/roles/:id", asyncHandler_default(RBACController.getRole));
router2.put("/roles/:id/permissions", validate_default(updateRolePermissionsSchema), asyncHandler_default(RBACController.updatePermissions));
router2.delete("/roles/:id", asyncHandler_default(RBACController.deleteRole));
router2.get("/permissions", asyncHandler_default(RBACController.listPermissions));
router2.post("/seed-defaults", asyncHandler_default(RBACController.seedDefaults));
var rbac_routes_default = router2;

// src/modules/tenants/tenant.routes.ts
import { Router as Router3 } from "express";

// src/modules/tenants/tenant.service.ts
var TenantService = class {
  static async getTenant(tenantId) {
    const tenant = await database_default.tenant.findUnique({
      where: { id: tenantId }
    });
    if (!tenant) throw { status: 404, message: "Tenant not found" };
    return tenant;
  }
  static async updateTenant(tenantId, data) {
    return await database_default.tenant.update({
      where: { id: tenantId },
      data
    });
  }
  static async listUsers(tenantId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      database_default.user.findMany({
        where: { tenantId, deletedAt: null },
        include: {
          userRoles: {
            include: { role: true }
          }
        },
        skip,
        take: limit
      }),
      database_default.user.count({ where: { tenantId, deletedAt: null } })
    ]);
    return {
      data: users.map((u) => {
        const { passwordHash, refreshToken, ...rest } = u;
        return rest;
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  static async updateUser(tenantId, userId, data) {
    return await database_default.$transaction(async (tx) => {
      if (data.status) {
        await tx.user.update({
          where: { id: userId, tenantId },
          data: { status: data.status }
        });
      }
      if (data.roleId) {
        await tx.userTenantRole.deleteMany({
          where: { userId, tenantId }
        });
        await tx.userTenantRole.create({
          data: {
            userId,
            tenantId,
            roleId: data.roleId
          }
        });
      }
      return await tx.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            include: { role: true }
          }
        }
      });
    }, {
      maxWait: 1e4,
      timeout: 2e4
    });
  }
  static async softDeleteUser(tenantId, userId, reassignToUserId) {
    if (userId === reassignToUserId) {
      throw { status: 400, message: "Cannot reassign records to the same user being deleted" };
    }
    const reassignUser = await database_default.user.findFirst({
      where: { id: reassignToUserId, tenantId, deletedAt: null }
    });
    if (!reassignUser) {
      throw { status: 404, message: "Reassignment target user not found" };
    }
    return await database_default.$transaction(async (tx) => {
      await tx.lead.updateMany({
        where: { assignedToId: userId, tenantId },
        data: { assignedToId: reassignToUserId }
      });
      await tx.deal.updateMany({
        where: { assignedToId: userId, tenantId },
        data: { assignedToId: reassignToUserId }
      });
      await tx.task.updateMany({
        where: { assignedToId: userId, tenantId },
        data: { assignedToId: reassignToUserId }
      });
      await tx.user.update({
        where: { id: userId, tenantId },
        data: {
          deletedAt: /* @__PURE__ */ new Date(),
          status: "inactive",
          refreshToken: null
        }
      });
      return { success: true, message: "User soft-deleted and records reassigned" };
    }, {
      maxWait: 1e4,
      timeout: 2e4
    });
  }
};

// src/modules/tenants/tenant.controller.ts
var TenantController = class {
  static getMe = async (req, res) => {
    const tenant = await TenantService.getTenant(req.user.tenantId);
    return success(res, tenant, "Tenant details fetched successfully");
  };
  static updateMe = async (req, res) => {
    const tenant = await TenantService.updateTenant(req.user.tenantId, req.body);
    return success(res, tenant, "Tenant updated successfully");
  };
  static listUsers = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await TenantService.listUsers(req.user.tenantId, page, limit);
    return success(res, result, "Users fetched successfully");
  };
  static updateUser = async (req, res) => {
    const user = await TenantService.updateUser(req.user.tenantId, req.params.id, req.body);
    return success(res, user, "User updated successfully");
  };
  static deleteUser = async (req, res) => {
    const { reassignToUserId } = req.body;
    const result = await TenantService.softDeleteUser(req.user.tenantId, req.params.id, reassignToUserId);
    return success(res, result, "User deleted successfully");
  };
};

// src/modules/tenants/tenant.schemas.ts
import { z as z5 } from "zod";
var updateTenantSchema = z5.object({
  body: z5.object({
    name: z5.string().min(2).optional(),
    timezone: z5.string().optional(),
    currency: z5.string().optional(),
    logoUrl: z5.string().url().optional().or(z5.literal("")),
    settings: z5.record(z5.string(), z5.any()).optional()
  })
});
var updateUserStatusRoleSchema = z5.object({
  body: z5.object({
    status: z5.enum(["active", "inactive", "suspended"]).optional(),
    roleId: z5.string().cuid().optional()
  })
});
var deleteUserSchema = z5.object({
  body: z5.object({
    reassignToUserId: z5.string().cuid("User ID to reassign records to is required")
  })
});

// src/modules/tenants/tenant.routes.ts
var router3 = Router3();
router3.use(authGuard_default);
router3.get("/me", asyncHandler_default(TenantController.getMe));
router3.get("/me/users", asyncHandler_default(TenantController.listUsers));
router3.patch("/me", rbacGuard_default("settings", "update"), validate_default(updateTenantSchema), asyncHandler_default(TenantController.updateMe));
router3.patch("/users/:id", rbacGuard_default("settings", "update"), validate_default(updateUserStatusRoleSchema), asyncHandler_default(TenantController.updateUser));
router3.delete("/users/:id", rbacGuard_default("settings", "update"), validate_default(deleteUserSchema), asyncHandler_default(TenantController.deleteUser));
var tenant_routes_default = router3;

// src/modules/pipeline-stages/stage.routes.ts
import { Router as Router4 } from "express";

// src/modules/pipeline-stages/stage.service.ts
var StageService = class {
  static async listStages(tenantId, type) {
    return await database_default.pipelineStage.findMany({
      where: {
        tenantId,
        ...type ? { type } : {},
        isArchived: false
      },
      orderBy: { position: "asc" }
    });
  }
  static async createStage(tenantId, data) {
    return await database_default.pipelineStage.create({
      data: {
        ...data,
        tenantId
      }
    });
  }
  static async updateStage(tenantId, id, data) {
    return await database_default.pipelineStage.update({
      where: { id, tenantId },
      data
    });
  }
  static async archiveStage(tenantId, id, transferToStageId) {
    const stage = await database_default.pipelineStage.findUnique({
      where: { id, tenantId },
      include: {
        leads: { where: { deletedAt: null } },
        deals: { where: { deletedAt: null } }
      }
    });
    if (!stage) throw { status: 404, message: "Stage not found" };
    if (stage.isSystem) throw { status: 403, message: "System stages cannot be archived" };
    const recordCount = stage.leads.length + stage.deals.length;
    if (recordCount > 0 && !transferToStageId) {
      throw {
        status: 409,
        message: `Stage has ${recordCount} active records. Please specify a transferToStageId.`,
        code: "STAGE_HAS_RECORDS",
        count: recordCount
      };
    }
    return await database_default.$transaction(async (tx) => {
      if (transferToStageId) {
        await tx.lead.updateMany({
          where: { stageId: id, tenantId },
          data: { stageId: transferToStageId }
        });
        await tx.deal.updateMany({
          where: { stageId: id, tenantId },
          data: { stageId: transferToStageId }
        });
      }
      return await tx.pipelineStage.update({
        where: { id },
        data: { isArchived: true, isActive: false }
      });
    });
  }
  static async migrateBulk(tenantId, sourceId, targetId, userId, reason) {
    const sourceStage = await database_default.pipelineStage.findUnique({ where: { id: sourceId, tenantId } });
    const targetStage = await database_default.pipelineStage.findUnique({ where: { id: targetId, tenantId } });
    if (!sourceStage || !targetStage) throw { status: 404, message: "Stage not found" };
    if (sourceStage.type !== targetStage.type) throw { status: 400, message: "Stages must be of same type" };
    return await database_default.$transaction(async (tx) => {
      let migratedCount = 0;
      if (sourceStage.type === "lead") {
        const result = await tx.lead.updateMany({
          where: { stageId: sourceId, tenantId },
          data: { stageId: targetId }
        });
        migratedCount = result.count;
      } else {
        const result = await tx.deal.updateMany({
          where: { stageId: sourceId, tenantId },
          data: { stageId: targetId }
        });
        migratedCount = result.count;
      }
      await tx.stageMigration.create({
        data: {
          tenantId,
          fromStageId: sourceId,
          toStageId: targetId,
          stageType: sourceStage.type,
          migratedCount,
          migratedById: userId,
          reason
        }
      });
      return { migratedCount };
    });
  }
  static async reorderStages(tenantId, items) {
    return await database_default.$transaction(async (tx) => {
      const updates = items.map(
        (item) => tx.pipelineStage.update({
          where: { id: item.id, tenantId },
          data: { position: item.position }
        })
      );
      await Promise.all(updates);
      return { success: true };
    });
  }
};

// src/modules/pipeline-stages/stage.controller.ts
var StageController = class {
  static listStages = async (req, res) => {
    const { type } = req.query;
    const stages = await StageService.listStages(req.user.tenantId, type);
    return success(res, stages, "Stages fetched successfully");
  };
  static createStage = async (req, res) => {
    const stage = await StageService.createStage(req.user.tenantId, req.body);
    return success(res, stage, "Stage created successfully", 201);
  };
  static updateStage = async (req, res) => {
    const stage = await StageService.updateStage(req.user.tenantId, req.params.id, req.body);
    return success(res, stage, "Stage updated successfully");
  };
  static archiveStage = async (req, res) => {
    const { transferToStageId } = req.body;
    const result = await StageService.archiveStage(req.user.tenantId, req.params.id, transferToStageId);
    return success(res, result, "Stage archived successfully");
  };
  static migrateRecords = async (req, res) => {
    const { targetStageId, reason } = req.body;
    const result = await StageService.migrateBulk(
      req.user.tenantId,
      req.params.id,
      targetStageId,
      req.user.id,
      reason
    );
    return success(res, result, "Records migrated successfully");
  };
  static reorderStages = async (req, res) => {
    const result = await StageService.reorderStages(req.user.tenantId, req.body);
    return success(res, result, "Stages reordered successfully");
  };
};

// src/modules/pipeline-stages/stage.schemas.ts
import { z as z6 } from "zod";
var createStageSchema = z6.object({
  body: z6.object({
    name: z6.string().min(1, "Name is required"),
    type: z6.enum(["lead", "deal"]),
    position: z6.number().int().min(0),
    color: z6.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
    description: z6.string().optional(),
    isFinal: z6.boolean().optional()
  })
});
var updateStageSchema = z6.object({
  body: z6.object({
    name: z6.string().min(1).optional(),
    color: z6.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    position: z6.number().int().min(0).optional(),
    isActive: z6.boolean().optional(),
    description: z6.string().optional()
  })
});
var archiveStageSchema = z6.object({
  body: z6.object({
    transferToStageId: z6.string().cuid().optional()
  })
});
var migrateStageSchema = z6.object({
  body: z6.object({
    targetStageId: z6.string().cuid("Target stage ID is required"),
    reason: z6.string().optional()
  })
});
var reorderStagesSchema = z6.object({
  body: z6.array(z6.object({
    id: z6.string().cuid(),
    position: z6.number().int().min(0)
  }))
});

// src/modules/pipeline-stages/stage.routes.ts
var router4 = Router4();
router4.use(authGuard_default);
router4.get("/", asyncHandler_default(StageController.listStages));
router4.post("/", rbacGuard_default("settings", "update"), validate_default(createStageSchema), asyncHandler_default(StageController.createStage));
router4.patch("/reorder", rbacGuard_default("settings", "update"), validate_default(reorderStagesSchema), asyncHandler_default(StageController.reorderStages));
router4.patch("/:id", rbacGuard_default("settings", "update"), validate_default(updateStageSchema), asyncHandler_default(StageController.updateStage));
router4.post("/:id/archive", rbacGuard_default("settings", "update"), validate_default(archiveStageSchema), asyncHandler_default(StageController.archiveStage));
router4.post("/:id/migrate", rbacGuard_default("settings", "update"), validate_default(migrateStageSchema), asyncHandler_default(StageController.migrateRecords));
var stage_routes_default = router4;

// src/modules/companies/company.routes.ts
import { Router as Router5 } from "express";

// src/modules/companies/company.service.ts
var CompanyService = class {
  static async listCompanies(tenantId, filters) {
    const { industry, size, country, tag, search, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", includeDeleted = false } = filters;
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      ...includeDeleted ? {} : { deletedAt: null },
      ...industry ? { industry } : {},
      ...size ? { size } : {},
      ...country ? { country } : {},
      ...tag ? { tags: { has: tag } } : {},
      ...search ? { name: { contains: search, mode: "insensitive" } } : {}
    };
    const [data, total] = await Promise.all([
      database_default.company.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { contacts: true, deals: true }
          }
        }
      }),
      database_default.company.count({ where })
    ]);
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  static async createCompany(tenantId, userId, data) {
    return await database_default.company.create({
      data: {
        ...data,
        tenantId,
        createdById: userId
      }
    });
  }
  static async getCompany(tenantId, id) {
    const company = await database_default.company.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: {
          select: { contacts: true, deals: true }
        },
        deals: {
          where: { status: "open" },
          select: { value: true }
        }
      }
    });
    if (!company) throw { status: 404, message: "Company not found" };
    const openDealValue = company.deals.reduce((sum, d) => sum + Number(d.value), 0);
    return {
      ...company,
      openDealValue,
      dealCount: company._count.deals,
      contactCount: company._count.contacts
    };
  }
  static async updateCompany(tenantId, id, data) {
    return await database_default.company.update({
      where: { id, tenantId },
      data
    });
  }
  static async deleteCompany(tenantId, id) {
    const openDeals = await database_default.deal.count({
      where: { companyId: id, tenantId, status: "open" }
    });
    if (openDeals > 0) {
      throw { status: 400, message: `Cannot delete company with ${openDeals} open deals`, code: "HAS_OPEN_DEALS" };
    }
    return await database_default.company.update({
      where: { id, tenantId },
      data: { deletedAt: /* @__PURE__ */ new Date() }
    });
  }
  static async listContacts(tenantId, id) {
    return await database_default.contact.findMany({
      where: { companyId: id, tenantId, deletedAt: null },
      orderBy: { firstName: "asc" }
    });
  }
  static async listDeals(tenantId, id) {
    return await database_default.deal.findMany({
      where: { companyId: id, tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" }
    });
  }
};

// src/modules/companies/company.controller.ts
var CompanyController = class {
  static list = async (req, res) => {
    const result = await CompanyService.listCompanies(req.user.tenantId, req.query);
    return success(res, result, "Companies fetched successfully");
  };
  static create = async (req, res) => {
    const company = await CompanyService.createCompany(req.user.tenantId, req.user.id, req.body);
    return success(res, company, "Company created successfully", 201);
  };
  static get = async (req, res) => {
    const company = await CompanyService.getCompany(req.user.tenantId, req.params.id);
    return success(res, company, "Company details fetched successfully");
  };
  static update = async (req, res) => {
    const company = await CompanyService.updateCompany(req.user.tenantId, req.params.id, req.body);
    return success(res, company, "Company updated successfully");
  };
  static delete = async (req, res) => {
    await CompanyService.deleteCompany(req.user.tenantId, req.params.id);
    return success(res, null, "Company deleted successfully");
  };
  static getContacts = async (req, res) => {
    const contacts = await CompanyService.listContacts(req.user.tenantId, req.params.id);
    return success(res, contacts, "Company contacts fetched successfully");
  };
  static getDeals = async (req, res) => {
    const deals = await CompanyService.listDeals(req.user.tenantId, req.params.id);
    return success(res, deals, "Company deals fetched successfully");
  };
};

// src/modules/companies/company.schemas.ts
import { z as z7 } from "zod";
var createCompanySchema = z7.object({
  body: z7.object({
    name: z7.string().min(1, "Company name is required"),
    website: z7.string().url().optional().or(z7.literal("")),
    industry: z7.string().optional(),
    size: z7.string().optional(),
    country: z7.string().optional(),
    state: z7.string().optional(),
    city: z7.string().optional(),
    address: z7.string().optional(),
    pincode: z7.string().optional(),
    linkedinUrl: z7.string().url().optional().or(z7.literal("")),
    description: z7.string().optional(),
    tags: z7.array(z7.string()).optional(),
    customFields: z7.record(z7.string(), z7.any()).optional()
  })
});
var updateCompanySchema = createCompanySchema.partial();
var companyFilterSchema = z7.object({
  query: z7.object({
    industry: z7.string().optional(),
    size: z7.string().optional(),
    country: z7.string().optional(),
    tag: z7.string().optional(),
    search: z7.string().optional(),
    page: z7.string().optional().transform(Number),
    limit: z7.string().optional().transform(Number),
    sortBy: z7.string().optional(),
    sortOrder: z7.enum(["asc", "desc"]).optional(),
    includeDeleted: z7.string().optional().transform((v) => v === "true")
  })
});

// src/modules/companies/company.routes.ts
var router5 = Router5();
router5.use(authGuard_default);
router5.get("/", validate_default(companyFilterSchema), asyncHandler_default(CompanyController.list));
router5.post("/", validate_default(createCompanySchema), asyncHandler_default(CompanyController.create));
router5.get("/:id", asyncHandler_default(CompanyController.get));
router5.patch("/:id", validate_default(updateCompanySchema), asyncHandler_default(CompanyController.update));
router5.delete("/:id", asyncHandler_default(CompanyController.delete));
router5.get("/:id/contacts", asyncHandler_default(CompanyController.getContacts));
router5.get("/:id/deals", asyncHandler_default(CompanyController.getDeals));
var company_routes_default = router5;

// src/modules/contacts/contact.routes.ts
import { Router as Router6 } from "express";

// src/utils/phone.ts
var DEFAULT_COUNTRY_CODE = "91";
function normalizePhone(phone) {
  if (!phone || typeof phone !== "string") return null;
  let cleaned = phone.trim();
  if (cleaned.length === 0) return null;
  const hasPlus = cleaned.startsWith("+");
  const digitsOnly = cleaned.replace(/[^\d]/g, "");
  if (digitsOnly.length === 0) return null;
  let normalized;
  if (hasPlus) {
    normalized = "+" + digitsOnly;
  } else {
    normalized = "+" + DEFAULT_COUNTRY_CODE + digitsOnly;
  }
  return normalized;
}
function normalizePhoneForStorage(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return normalized.replace(/^\+/, "");
}

// src/modules/contacts/contact.service.ts
var ContactService = class {
  static async listContacts(tenantId, filters) {
    const { companyId, tag, search, page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", includeDeleted = false } = filters;
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      ...includeDeleted ? {} : { deletedAt: null },
      ...companyId ? { companyId } : {},
      ...tag ? { tags: { has: tag } } : {},
      ...search ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } }
        ]
      } : {}
    };
    const [data, total] = await Promise.all([
      database_default.contact.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: { select: { id: true, name: true } }
        }
      }),
      database_default.contact.count({ where })
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }
  /**
   * Normalized phone matching: strips formatting and compares trailing digits.
   * This catches "+91 98765 43210" matching "9876543210" or "+1 (555) 123-4567".
   */
  static buildPhoneCondition(phone) {
    const normalized = normalizePhoneForStorage(phone);
    if (!normalized) return null;
    const last10 = normalized.slice(-10);
    return { phone: { contains: last10 } };
  }
  static async createContact(tenantId, userId, data, force = false) {
    if (!force) {
      const conditions = [];
      if (data.email) {
        conditions.push({ email: data.email });
      }
      if (data.phone) {
        const phoneCondition = this.buildPhoneCondition(data.phone);
        if (phoneCondition) {
          conditions.push(phoneCondition);
        }
      }
      if (conditions.length > 0) {
        const duplicates = await database_default.contact.findMany({
          where: {
            tenantId,
            deletedAt: null,
            OR: conditions
          },
          select: { id: true, firstName: true, lastName: true, email: true, phone: true }
        });
        if (duplicates.length > 0) {
          return { duplicates };
        }
      }
    }
    return await database_default.contact.create({
      data: {
        ...data,
        tenantId,
        createdById: userId
      }
    });
  }
  static async checkDuplicate(tenantId, email, phone) {
    const conditions = [];
    if (email) {
      conditions.push({ email });
    }
    if (phone) {
      const phoneCondition = this.buildPhoneCondition(phone);
      if (phoneCondition) {
        conditions.push(phoneCondition);
      }
    }
    if (conditions.length === 0) return [];
    return await database_default.contact.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: conditions
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true }
    });
  }
  static async getContact(tenantId, id) {
    const contact = await database_default.contact.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        company: true,
        _count: {
          select: { leads: true, deals: true }
        },
        communications: {
          orderBy: { occurredAt: "desc" },
          take: 1,
          select: { occurredAt: true }
        }
      }
    });
    if (!contact) throw { status: 404, message: "Contact not found" };
    const lastCommunicationDate = contact.communications[0]?.occurredAt || null;
    return {
      ...contact,
      openLeadsCount: contact._count.leads,
      openDealsCount: contact._count.deals,
      lastCommunicationDate
    };
  }
  static async updateContact(tenantId, id, data) {
    return await database_default.contact.update({
      where: { id, tenantId },
      data
    });
  }
  static async deleteContact(tenantId, id) {
    const openDeals = await database_default.deal.count({
      where: { contactId: id, tenantId, status: "open" }
    });
    if (openDeals > 0) {
      throw { status: 400, message: `Cannot delete contact with ${openDeals} open deals`, code: "HAS_OPEN_DEALS" };
    }
    return await database_default.contact.update({
      where: { id, tenantId },
      data: { deletedAt: /* @__PURE__ */ new Date() }
    });
  }
  static async mergeContacts(tenantId, sourceId, targetId, userId) {
    if (sourceId === targetId) throw { status: 400, message: "Cannot merge a contact into itself" };
    return await database_default.$transaction(async (tx) => {
      await tx.lead.updateMany({
        where: { contactId: sourceId, tenantId },
        data: { contactId: targetId }
      });
      await tx.deal.updateMany({
        where: { contactId: sourceId, tenantId },
        data: { contactId: targetId }
      });
      await tx.task.updateMany({
        where: { contactId: sourceId, tenantId },
        data: { contactId: targetId }
      });
      await tx.communication.updateMany({
        where: { contactId: sourceId, tenantId },
        data: { contactId: targetId }
      });
      await tx.proposal.updateMany({
        where: { contactId: sourceId, tenantId },
        data: { contactId: targetId }
      });
      await tx.activityLog.create({
        data: {
          tenantId,
          userId,
          entityId: targetId,
          entityType: "contact",
          action: "merge",
          metadata: { mergedFromId: sourceId }
        }
      });
      await tx.contact.update({
        where: { id: sourceId, tenantId },
        data: { deletedAt: /* @__PURE__ */ new Date() }
      });
      return { success: true };
    });
  }
  static async getTimeline(tenantId, id) {
    const [tasks, comms, deals, activities] = await Promise.all([
      database_default.task.findMany({ where: { contactId: id, tenantId }, orderBy: { createdAt: "desc" } }),
      database_default.communication.findMany({ where: { contactId: id, tenantId }, orderBy: { occurredAt: "desc" } }),
      database_default.deal.findMany({ where: { contactId: id, tenantId }, orderBy: { createdAt: "desc" } }),
      database_default.activityLog.findMany({ where: { entityId: id, entityType: "contact", tenantId }, orderBy: { createdAt: "desc" } })
    ]);
    const timeline = [
      ...tasks.map((t) => ({ type: "task", date: t.createdAt, data: t })),
      ...comms.map((c) => ({ type: "communication", date: c.occurredAt, data: c })),
      ...deals.map((d) => ({ type: "deal", date: d.createdAt, data: d })),
      ...activities.map((a) => ({ type: "activity", date: a.createdAt, data: a }))
    ];
    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
};

// src/modules/contacts/contact.controller.ts
var ContactController = class {
  static list = async (req, res) => {
    const result = await ContactService.listContacts(req.user.tenantId, req.query);
    return success(res, result, "Contacts fetched successfully");
  };
  static checkDuplicate = async (req, res) => {
    const { email, phone } = req.query;
    const duplicates = await ContactService.checkDuplicate(req.user.tenantId, email, phone);
    return res.json({ duplicates });
  };
  static create = async (req, res) => {
    const force = req.query.force === "true";
    const result = await ContactService.createContact(req.user.tenantId, req.user.id, req.body, force);
    if ("duplicates" in result) {
      return res.status(409).json({
        success: false,
        message: "Potential duplicates found",
        code: "DUPLICATE_FOUND",
        duplicates: result.duplicates
      });
    }
    return success(res, result, "Contact created successfully", 201);
  };
  static get = async (req, res) => {
    const contact = await ContactService.getContact(req.user.tenantId, req.params.id);
    return success(res, contact, "Contact details fetched successfully");
  };
  static update = async (req, res) => {
    const contact = await ContactService.updateContact(req.user.tenantId, req.params.id, req.body);
    return success(res, contact, "Contact updated successfully");
  };
  static delete = async (req, res) => {
    await ContactService.deleteContact(req.user.tenantId, req.params.id);
    return success(res, null, "Contact deleted successfully");
  };
  static merge = async (req, res) => {
    const { sourceId, targetId } = req.body;
    const result = await ContactService.mergeContacts(req.user.tenantId, sourceId, targetId, req.user.id);
    return success(res, result, "Contacts merged successfully");
  };
  static getTimeline = async (req, res) => {
    const timeline = await ContactService.getTimeline(req.user.tenantId, req.params.id);
    return success(res, timeline, "Contact timeline fetched successfully");
  };
};

// src/modules/contacts/contact.schemas.ts
import { z as z8 } from "zod";
var createContactSchema = z8.object({
  body: z8.object({
    firstName: z8.string().min(1, "First name is required"),
    lastName: z8.string().optional(),
    email: z8.string().email("Invalid email").optional(),
    phone: z8.string().optional(),
    whatsapp: z8.string().optional(),
    designation: z8.string().optional(),
    department: z8.string().optional(),
    companyId: z8.string().cuid().optional(),
    country: z8.string().optional(),
    city: z8.string().optional(),
    timezone: z8.string().optional(),
    tags: z8.array(z8.string()).optional(),
    notes: z8.string().optional(),
    customFields: z8.record(z8.string(), z8.any()).optional()
  })
});
var updateContactSchema = createContactSchema.partial();
var mergeContactsSchema = z8.object({
  body: z8.object({
    sourceId: z8.string().cuid("Source contact ID is required"),
    targetId: z8.string().cuid("Target contact ID is required")
  })
});
var contactFilterSchema = z8.object({
  query: z8.object({
    companyId: z8.string().optional(),
    tag: z8.string().optional(),
    search: z8.string().optional(),
    page: z8.string().optional().transform(Number),
    limit: z8.string().optional().transform(Number),
    sortBy: z8.string().optional(),
    sortOrder: z8.enum(["asc", "desc"]).optional(),
    includeDeleted: z8.string().optional().transform((v) => v === "true")
  })
});

// src/modules/contacts/contact.routes.ts
var router6 = Router6();
router6.use(authGuard_default);
router6.get("/check-duplicate", asyncHandler_default(ContactController.checkDuplicate));
router6.get("/", validate_default(contactFilterSchema), asyncHandler_default(ContactController.list));
router6.post("/", validate_default(createContactSchema), asyncHandler_default(ContactController.create));
router6.post("/merge", validate_default(mergeContactsSchema), asyncHandler_default(ContactController.merge));
router6.get("/:id", asyncHandler_default(ContactController.get));
router6.patch("/:id", validate_default(updateContactSchema), asyncHandler_default(ContactController.update));
router6.delete("/:id", asyncHandler_default(ContactController.delete));
router6.get("/:id/timeline", asyncHandler_default(ContactController.getTimeline));
var contact_routes_default = router6;

// src/modules/leads/lead.routes.ts
import { Router as Router7 } from "express";

// src/modules/leadScoring/leadScoring.types.ts
var DEFAULT_RULES = [
  { id: "has_email", label: "Has email", points: 15, condition: "contact.email != null", isActive: true },
  { id: "has_phone", label: "Has phone", points: 10, condition: "contact.phone != null", isActive: true },
  { id: "has_company", label: "Has company", points: 10, condition: "company != null", isActive: true },
  { id: "priority_high", label: "High priority", points: 20, condition: "priority == 'high'", isActive: true },
  { id: "priority_medium", label: "Medium priority", points: 10, condition: "priority == 'medium'", isActive: true },
  { id: "source_referral", label: "Referral source", points: 15, condition: "source == 'referral'", isActive: true },
  { id: "has_close_date", label: "Has expected close date", points: 10, condition: "expectedCloseAt != null", isActive: true },
  { id: "had_communication", label: "Has logged communication", points: 10, condition: "communicationCount > 0", isActive: true },
  { id: "recent_activity", label: "Activity in last 7 days", points: 10, condition: "lastActivityAt > now-7d", isActive: true }
];

// src/modules/leadScoring/leadScoring.service.ts
var LeadScoringService = class {
  static async getRules(tenantId) {
    const tenant = await database_default.tenant.findUnique({ where: { id: tenantId } });
    const settings = tenant?.settings;
    return settings?.leadScoringRules || DEFAULT_RULES;
  }
  static async updateRules(tenantId, rules) {
    const tenant = await database_default.tenant.findUnique({ where: { id: tenantId } });
    const settings = tenant?.settings || {};
    return await database_default.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          leadScoringRules: rules
        }
      }
    });
  }
  static calculateScore(lead, rules) {
    let score = 0;
    const now = /* @__PURE__ */ new Date();
    for (const rule of rules) {
      if (!rule.isActive) continue;
      let match = false;
      try {
        switch (rule.id) {
          case "has_email":
            match = !!(lead.contact?.email || lead.email);
            break;
          case "has_phone":
            match = !!(lead.contact?.phone || lead.phone);
            break;
          case "has_company":
            match = !!(lead.companyId || lead.company);
            break;
          case "priority_high":
            match = lead.priority === "high" || lead.priority === "urgent";
            break;
          case "priority_medium":
            match = lead.priority === "medium";
            break;
          case "source_referral":
            match = lead.source === "referral";
            break;
          case "has_close_date":
            match = !!lead.expectedCloseAt;
            break;
          case "had_communication":
            match = (lead.communicationCount || (lead._count?.communications ?? 0)) > 0;
            break;
          case "recent_activity":
            const lastActivity = new Date(lead.lastActivityAt || lead.createdAt || now);
            const diffDays = (now.getTime() - lastActivity.getTime()) / (1e3 * 3600 * 24);
            match = diffDays <= 7;
            break;
        }
      } catch (e) {
        console.error(`Error calculating rule ${rule.id}:`, e);
      }
      if (match) score += rule.points;
    }
    return Math.min(Math.max(score, 0), 100);
  }
  /**
   * Recalculates and updates the score for a specific lead
   */
  static async syncLeadScore(tenantId, leadId) {
    const [lead, rules] = await Promise.all([
      database_default.lead.findFirst({
        where: { id: leadId, tenantId },
        include: {
          contact: true,
          company: true,
          _count: { select: { communications: true } }
        }
      }),
      this.getRules(tenantId)
    ]);
    if (!lead) return null;
    const score = this.calculateScore(lead, rules);
    if (score !== lead.score) {
      return await database_default.lead.update({
        where: { id: leadId },
        data: { score }
      });
    }
    return lead;
  }
};

// src/modules/stage-transitions/stageTransition.service.ts
var StageTransitionService = class {
  /**
   * Get the stage skip policy for a tenant
   */
  static async getStageSkipPolicy(tenantId) {
    const tenant = await database_default.tenant.findUnique({ where: { id: tenantId } });
    const settings = tenant?.settings || {};
    return settings.stageSkipPolicy || { mode: "global", enabled: false };
  }
  /**
   * Update stage skip policy for a tenant
   */
  static async updateStageSkipPolicy(tenantId, policy) {
    const tenant = await database_default.tenant.findUnique({ where: { id: tenantId } });
    const settings = tenant?.settings || {};
    return await database_default.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          stageSkipPolicy: policy
        }
      }
    });
  }
  /**
   * Validate whether a user is allowed to perform a stage transition
   * Rules:
   * - If stageSkipPolicy.enabled === false: all users must move sequentially (one stage at a time)
   * - If stageSkipPolicy.enabled === true: admin + salesManager can skip; salesRep cannot
   */
  static async validateTransition(tenantId, userId, userRole, entityType, fromStageId, toStageId) {
    const failure = (reason, message) => ({
      allowed: false,
      reason,
      message: message || "Stage transition not allowed",
      isSkipOverride: false,
      skippedStages: []
    });
    if (fromStageId === toStageId) {
      return failure("same_stage");
    }
    const [fromStage, toStage, policy] = await Promise.all([
      database_default.pipelineStage.findUnique({ where: { id: fromStageId } }),
      database_default.pipelineStage.findUnique({ where: { id: toStageId } }),
      this.getStageSkipPolicy(tenantId)
    ]);
    if (!fromStage || !toStage) {
      return failure("invalid_stage");
    }
    if (fromStage.type !== entityType || toStage.type !== entityType) {
      return failure("stage_type_mismatch");
    }
    const positionDiff = toStage.position - fromStage.position;
    const isSequential = positionDiff === 1;
    if (isSequential) {
      return { allowed: true, isSkipOverride: false, skippedStages: [], reason: void 0, message: void 0 };
    }
    const skipEnabled = policy.enabled;
    if (!skipEnabled) {
      return failure("stage_skip_disabled", "Stage skipping is disabled for this organization. Move leads one stage at a time.");
    }
    const canSkip = userRole === "admin" || userRole === "salesManager";
    if (!canSkip) {
      return failure("skip_not_permitted", "Only admins and sales managers can skip stages.");
    }
    const skippedStages = await database_default.pipelineStage.findMany({
      where: {
        tenantId,
        type: entityType,
        position: {
          gt: fromStage.position,
          lt: toStage.position
        },
        isArchived: false
      },
      orderBy: { position: "asc" },
      select: { name: true }
    });
    return {
      allowed: true,
      isSkipOverride: true,
      skippedStages: skippedStages.map((s) => s.name),
      reason: void 0,
      message: void 0
    };
  }
  /**
   * Log a stage transition (immutable)
   */
  static async logTransition(tenantId, data) {
    return await database_default.stageTransition.create({
      data: {
        tenantId,
        entityId: data.entityId,
        entityType: data.entityType,
        fromStageId: data.fromStageId,
        toStageId: data.toStageId,
        fromStageName: data.fromStageName,
        toStageName: data.toStageName,
        actorId: data.actorId,
        isSkipOverride: data.isSkipOverride,
        skippedStages: data.skippedStages,
        metadata: data.metadata || {}
      }
    });
  }
  /**
   * Get transitions for an entity (lead or deal)
   */
  static async getTransitions(tenantId, entityId) {
    return await database_default.stageTransition.findMany({
      where: { tenantId, entityId },
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { id: true, firstName: true, lastName: true } },
        toStage: { select: { id: true, name: true, color: true } }
      }
    });
  }
  /**
   * Check if an entity has been fast-tracked (had a skip-override transition)
   */
  static async hasBeenFastTracked(tenantId, entityId) {
    const count = await database_default.stageTransition.count({
      where: { tenantId, entityId, isSkipOverride: true }
    });
    return count > 0;
  }
  /**
   * Get the minimum position a user can move an entity to based on role + policy
   * Used for frontend validation
   */
  static async getAllowedTargetStages(tenantId, userId, userRole, entityType, currentStageId) {
    const [currentStage, policy] = await Promise.all([
      database_default.pipelineStage.findUnique({ where: { id: currentStageId } }),
      this.getStageSkipPolicy(tenantId)
    ]);
    if (!currentStage) return [];
    const allStages = await database_default.pipelineStage.findMany({
      where: { tenantId, type: entityType, isArchived: false, isActive: true },
      orderBy: { position: "asc" }
    });
    const skipEnabled = policy.enabled;
    const canSkip = userRole === "admin" || userRole === "salesManager";
    if (!skipEnabled || !canSkip) {
      return allStages.filter((s) => s.position === currentStage.position + 1 || s.position === currentStage.position);
    }
    return allStages;
  }
};

// src/modules/leads/lead.service.ts
var LeadService = class {
  static async listLeads(tenantId, filters) {
    const {
      stageId,
      assignedToId,
      campaignId,
      priority,
      source,
      isConverted,
      tag,
      search,
      createdAtFrom,
      createdAtTo,
      isStale,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = filters;
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      deletedAt: null,
      ...stageId ? { stageId } : {},
      ...assignedToId ? { assignedToId } : {},
      ...campaignId ? { campaignId } : {},
      ...priority ? { priority } : {},
      ...source ? { source } : {},
      ...isConverted !== void 0 ? { isConverted: isConverted === "true" } : {},
      ...tag ? { tags: { has: tag } } : {},
      ...search ? { title: { contains: search, mode: "insensitive" } } : {},
      ...createdAtFrom || createdAtTo ? {
        createdAt: {
          ...createdAtFrom ? { gte: new Date(createdAtFrom) } : {},
          ...createdAtTo ? { lte: new Date(createdAtTo) } : {}
        }
      } : {}
    };
    if (isStale === "true") {
      const tenant2 = await database_default.tenant.findUnique({ where: { id: tenantId } });
      const thresholdDays = tenant2?.settings?.staleDaysThreshold || 14;
      const threshold = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1e3);
      where.lastActivityAt = { lte: threshold };
    }
    const [data, total] = await Promise.all([
      database_default.lead.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { [sortBy]: sortOrder },
        include: {
          contact: { select: { firstName: true, lastName: true, email: true } },
          company: { select: { name: true } },
          stage: { select: { name: true } },
          assignedTo: { select: { firstName: true, lastName: true } },
          campaign: { select: { name: true } }
        }
      }),
      database_default.lead.count({ where })
    ]);
    const tenant = await database_default.tenant.findUnique({ where: { id: tenantId } });
    const staleDays = tenant?.settings?.staleDaysThreshold || 14;
    const enrichedData = await Promise.all(data.map(async (lead) => ({
      ...lead,
      isStale: this.checkStale(lead.lastActivityAt, staleDays),
      isFastTracked: await StageTransitionService.hasBeenFastTracked(tenantId, lead.id)
    })));
    return {
      data: enrichedData,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }
  static async getLeadBoard(tenantId) {
    const stages = await database_default.pipelineStage.findMany({
      where: { tenantId, type: "lead", isArchived: false },
      orderBy: { position: "asc" },
      include: {
        leads: {
          where: { deletedAt: null, isConverted: false },
          include: {
            contact: { select: { firstName: true, lastName: true } },
            assignedTo: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });
    return stages.map((stage) => {
      const leads = stage.leads || [];
      const totalValue = leads.reduce((sum, lead) => sum + Number(lead.estimatedValue || 0), 0);
      return {
        stage,
        leads,
        totalCount: leads.length,
        totalValue
      };
    });
  }
  static async createLead(tenantId, userId, data) {
    const rules = await LeadScoringService.getRules(tenantId);
    const score = LeadScoringService.calculateScore(data, rules);
    const lead = await database_default.lead.create({
      data: {
        ...data,
        tenantId,
        createdById: userId,
        assignedToId: data.assignedToId || userId,
        score,
        lastActivityAt: /* @__PURE__ */ new Date()
      }
    });
    if (data.contactId && data.source) {
      this.logActivity(tenantId, userId, lead.id, "created", {
        source: data.source,
        campaignId: data.campaignId,
        contactId: data.contactId
      });
    }
    return lead;
  }
  static async checkDuplicate(tenantId, title, contactId, companyId, phone) {
    const conditions = [];
    if (title) {
      conditions.push({ title: { contains: title, mode: "insensitive" } });
    }
    if (contactId) {
      conditions.push({ contactId });
    }
    if (companyId) {
      conditions.push({ companyId });
    }
    if (phone) {
      const normalizedPhone = normalizePhoneForStorage(phone);
      if (normalizedPhone) {
        const contactsWithPhone = await database_default.contact.findMany({
          where: {
            tenantId,
            deletedAt: null,
            phone: { contains: normalizedPhone.slice(-10) }
          },
          select: { id: true }
        });
        if (contactsWithPhone.length > 0) {
          conditions.push({
            contactId: { in: contactsWithPhone.map((c) => c.id) }
          });
        }
      }
    }
    if (conditions.length === 0) {
      return [];
    }
    return await database_default.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: conditions
      },
      take: 5,
      select: { id: true, title: true, isConverted: true }
    });
  }
  static async getLead(tenantId, id) {
    const lead = await database_default.lead.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        contact: true,
        company: true,
        stage: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        campaign: { select: { id: true, name: true } },
        _count: {
          select: { tasks: true, communications: true }
        }
      }
    });
    if (!lead) throw { status: 404, message: "Lead not found" };
    const tenant = await database_default.tenant.findUnique({ where: { id: tenantId } });
    const staleDays = tenant?.settings?.staleDaysThreshold || 14;
    return {
      ...lead,
      isStale: this.checkStale(lead.lastActivityAt, staleDays),
      isFastTracked: await StageTransitionService.hasBeenFastTracked(tenantId, id),
      taskCount: lead._count.tasks,
      communicationCount: lead._count.communications
    };
  }
  static async updateLead(tenantId, id, data, userId) {
    const oldLead = await database_default.lead.findUnique({
      where: { id, tenantId },
      include: { stage: true }
    });
    if (!oldLead) throw { status: 404, message: "Lead not found" };
    if (data.stageId && data.stageId !== oldLead.stageId) {
      const newStage = await database_default.pipelineStage.findFirst({
        where: { id: data.stageId, tenantId, type: "lead" }
      });
      if (!newStage) throw { status: 400, message: "Invalid lead stage" };
      const user = await database_default.user.findUnique({ where: { id: userId } });
      const userRole = user?.role || "salesRep";
      const validation = await StageTransitionService.validateTransition(
        tenantId,
        userId,
        userRole,
        "lead",
        oldLead.stageId,
        data.stageId
      );
      if (!validation.allowed) {
        throw {
          status: 403,
          message: validation.message || "Stage transition not allowed",
          code: validation.reason
        };
      }
      await StageTransitionService.logTransition(tenantId, {
        entityId: id,
        entityType: "lead",
        fromStageId: oldLead.stageId,
        toStageId: data.stageId,
        fromStageName: oldLead.stage?.name || null,
        toStageName: newStage.name,
        actorId: userId,
        isSkipOverride: validation.isSkipOverride,
        skippedStages: validation.skippedStages,
        metadata: { updatePayload: data }
      });
      this.logActivity(tenantId, userId, id, "stage_changed", {
        oldValue: { stageId: oldLead.stageId, stageName: oldLead.stage?.name },
        newValue: { stageId: data.stageId, stageName: newStage.name },
        isSkipOverride: validation.isSkipOverride,
        skippedStages: validation.skippedStages
      });
      data.lastActivityAt = /* @__PURE__ */ new Date();
    }
    const hasComm = await database_default.communication.count({ where: { leadId: id } }) > 0;
    const rules = await LeadScoringService.getRules(tenantId);
    const score = LeadScoringService.calculateScore({ ...oldLead, ...data, communicationCount: hasComm ? 1 : 0 }, rules);
    return await database_default.lead.update({
      where: { id },
      data: { ...data, score }
    });
  }
  static async assignLead(tenantId, id, assignedToId, userId) {
    const lead = await database_default.lead.findUnique({ where: { id, tenantId } });
    if (!lead) throw { status: 404, message: "Lead not found" };
    const result = await database_default.lead.update({
      where: { id },
      data: { assignedToId }
    });
    this.logActivity(tenantId, userId, id, "assigned", { assignedToId });
    return result;
  }
  static async convertToDeal(tenantId, id, data, userId) {
    const lead = await database_default.lead.findFirst({
      where: { id, tenantId, isConverted: false },
      include: { contact: true, company: true, campaign: true, stage: true }
    });
    if (!lead) throw { status: 404, message: "Lead not found or already converted" };
    if (!lead.stage || lead.stage.position < 2) {
      throw {
        status: 403,
        message: "Leads must be in Qualified stage or later before they can be converted to deals. Move the lead forward first.",
        code: "CONVERSION_STAGE_GATE"
      };
    }
    const dealStage = await database_default.pipelineStage.findFirst({
      where: { id: data.dealStageId, tenantId, type: "deal" }
    });
    if (!dealStage) throw { status: 400, message: "Invalid deal stage" };
    return await database_default.$transaction(async (tx) => {
      const deal = await tx.deal.create({
        data: {
          tenantId,
          title: data.dealTitle,
          value: data.dealValue,
          stageId: data.dealStageId,
          expectedCloseAt: data.expectedCloseAt,
          contactId: lead.contactId,
          companyId: lead.companyId,
          assignedToId: lead.assignedToId,
          createdById: userId,
          // §5.4: Store convertedFromLeadId FK for audit traceability
          sourceLeadId: lead.id,
          // §5.2: Carry over source + campaign for source-level ROI reporting
          // Store source in tags or description for reporting continuity
          tags: [...lead.tags || [], `converted_from_lead:${lead.id}`, `original_source:${lead.source}`]
        }
      });
      await tx.communication.updateMany({
        where: { leadId: lead.id, tenantId },
        data: { dealId: deal.id }
      });
      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          isConverted: true,
          convertedAt: /* @__PURE__ */ new Date(),
          convertedToDealId: deal.id
        }
      });
      return { lead: updatedLead, deal };
    });
  }
  static async getTimeline(tenantId, id) {
    const [tasks, comms, activities] = await Promise.all([
      database_default.task.findMany({ where: { leadId: id, tenantId }, orderBy: { createdAt: "desc" } }),
      database_default.communication.findMany({ where: { leadId: id, tenantId }, orderBy: { occurredAt: "desc" } }),
      database_default.activityLog.findMany({ where: { entityId: id, entityType: "lead", tenantId }, orderBy: { createdAt: "desc" } })
    ]);
    const timeline = [
      ...tasks.map((t) => ({ type: "task", date: t.createdAt, data: t })),
      ...comms.map((c) => ({ type: "communication", date: c.occurredAt, data: c })),
      ...activities.map((a) => ({ type: "activity", date: a.createdAt, data: a }))
    ];
    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  static checkStale(lastActivityAt, thresholdDays) {
    const diff = (Date.now() - new Date(lastActivityAt).getTime()) / (1e3 * 60 * 60 * 24);
    return diff > thresholdDays;
  }
  static logActivity(tenantId, userId, entityId, action, metadata) {
    database_default.activityLog.create({
      data: {
        tenantId,
        userId,
        entityId,
        entityType: "lead",
        leadId: entityId,
        action,
        metadata
      }
    }).catch((err) => console.error("Failed to log activity:", err));
  }
};

// src/modules/leads/lead.controller.ts
var LeadController = class {
  static list = async (req, res) => {
    const result = await LeadService.listLeads(req.user.tenantId, req.query);
    return success(res, result, "Leads fetched successfully");
  };
  static checkDuplicate = async (req, res) => {
    const { title, contactId, companyId, phone } = req.query;
    const duplicates = await LeadService.checkDuplicate(req.user.tenantId, title, contactId, companyId, phone);
    return res.json({ duplicates });
  };
  static getBoard = async (req, res) => {
    const result = await LeadService.getLeadBoard(req.user.tenantId);
    return success(res, result, "Lead board fetched successfully");
  };
  static create = async (req, res) => {
    const lead = await LeadService.createLead(req.user.tenantId, req.user.id, req.body);
    return success(res, lead, "Lead created successfully", 201);
  };
  static get = async (req, res) => {
    const lead = await LeadService.getLead(req.user.tenantId, req.params.id);
    return success(res, lead, "Lead details fetched successfully");
  };
  static update = async (req, res) => {
    const lead = await LeadService.updateLead(req.user.tenantId, req.params.id, req.body, req.user.id);
    return success(res, lead, "Lead updated successfully");
  };
  static delete = async (req, res) => {
    await LeadService.updateLead(req.user.tenantId, req.params.id, { deletedAt: /* @__PURE__ */ new Date() }, req.user.id);
    return success(res, null, "Lead deleted successfully");
  };
  static assign = async (req, res) => {
    const { assignedToId } = req.body;
    const lead = await LeadService.assignLead(req.user.tenantId, req.params.id, assignedToId, req.user.id);
    return success(res, lead, "Lead reassigned successfully");
  };
  static convert = async (req, res) => {
    const result = await LeadService.convertToDeal(req.user.tenantId, req.params.id, req.body, req.user.id);
    return success(res, result, "Lead converted to deal successfully");
  };
  static getTimeline = async (req, res) => {
    const timeline = await LeadService.getTimeline(req.user.tenantId, req.params.id);
    return success(res, timeline, "Lead timeline fetched successfully");
  };
};

// src/modules/leads/lead.schemas.ts
import { z as z9 } from "zod";
var createLeadSchema = z9.object({
  body: z9.object({
    title: z9.string().min(1, "Title is required"),
    description: z9.string().optional(),
    status: z9.enum(["open", "converted", "lost"]).optional(),
    priority: z9.enum(["low", "medium", "high"]).optional(),
    source: z9.string().optional(),
    value: z9.number().optional(),
    currency: z9.string().optional(),
    contactId: z9.string().cuid().optional(),
    companyId: z9.string().cuid().optional(),
    stageId: z9.string().cuid().optional(),
    assignedToId: z9.string().cuid().optional(),
    tags: z9.array(z9.string()).optional(),
    customFields: z9.record(z9.string(), z9.any()).optional(),
    expectedCloseAt: z9.string().datetime().optional(),
    campaignId: z9.string().cuid().or(z9.string().nullable()).optional()
  })
});
var updateLeadSchema = createLeadSchema.partial();
var convertLeadSchema = z9.object({
  body: z9.object({
    dealTitle: z9.string().min(1, "Deal title is required"),
    dealValue: z9.number().min(0),
    dealStageId: z9.string().cuid("Valid deal stage ID is required"),
    expectedCloseAt: z9.string().datetime().optional()
  })
});
var leadFilterSchema = z9.object({
  query: z9.object({
    stageId: z9.string().optional(),
    assignedToId: z9.string().optional(),
    campaignId: z9.string().optional(),
    priority: z9.string().optional(),
    source: z9.string().optional(),
    isConverted: z9.string().optional().transform((v) => v === "true"),
    tag: z9.string().optional(),
    search: z9.string().optional(),
    page: z9.string().optional().transform(Number),
    limit: z9.string().optional().transform(Number),
    sortBy: z9.string().optional(),
    sortOrder: z9.enum(["asc", "desc"]).optional()
  })
});

// src/modules/leads/lead.routes.ts
var router7 = Router7();
router7.use(authGuard_default);
router7.get("/", validate_default(leadFilterSchema), asyncHandler_default(LeadController.list));
router7.get("/check-duplicate", asyncHandler_default(LeadController.checkDuplicate));
router7.get("/board", asyncHandler_default(LeadController.getBoard));
router7.post("/", validate_default(createLeadSchema), asyncHandler_default(LeadController.create));
router7.get("/:id", asyncHandler_default(LeadController.get));
router7.patch("/:id", validate_default(updateLeadSchema), asyncHandler_default(LeadController.update));
router7.delete("/:id", asyncHandler_default(LeadController.delete));
router7.patch("/:id/assign", asyncHandler_default(LeadController.assign));
router7.post("/:id/convert", validate_default(convertLeadSchema), asyncHandler_default(LeadController.convert));
router7.get("/:id/timeline", asyncHandler_default(LeadController.getTimeline));
var lead_routes_default = router7;

// src/modules/deals/deal.routes.ts
import { Router as Router8 } from "express";

// src/modules/deals/deal.service.ts
var DealService = class {
  static async listDeals(tenantId, filters) {
    const {
      stageId,
      status,
      assignedToId,
      contactId,
      companyId,
      minValue,
      maxValue,
      expectedCloseAtFrom,
      expectedCloseAtTo,
      createdAtFrom,
      createdAtTo,
      isStale,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = filters;
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      deletedAt: null,
      ...stageId ? { stageId } : {},
      ...status ? { status } : {},
      ...assignedToId ? { assignedToId } : {},
      ...contactId ? { contactId } : {},
      ...companyId ? { companyId } : {},
      ...minValue || maxValue ? {
        value: {
          ...minValue ? { gte: minValue } : {},
          ...maxValue ? { lte: maxValue } : {}
        }
      } : {},
      ...expectedCloseAtFrom || expectedCloseAtTo ? {
        expectedCloseAt: {
          ...expectedCloseAtFrom ? { gte: new Date(expectedCloseAtFrom) } : {},
          ...expectedCloseAtTo ? { lte: new Date(expectedCloseAtTo) } : {}
        }
      } : {},
      ...createdAtFrom || createdAtTo ? {
        createdAt: {
          ...createdAtFrom ? { gte: new Date(createdAtFrom) } : {},
          ...createdAtTo ? { lte: new Date(createdAtTo) } : {}
        }
      } : {}
    };
    if (isStale === "true") {
      const tenant = await database_default.tenant.findUnique({ where: { id: tenantId } });
      const thresholdDays = tenant?.settings?.staleDaysThreshold || 14;
      const threshold = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1e3);
      where.lastActivityAt = { lte: threshold };
      where.status = "open";
    }
    const [data, total] = await Promise.all([
      database_default.deal.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { [sortBy]: sortOrder },
        include: {
          stage: { select: { name: true } },
          contact: { select: { firstName: true, lastName: true } },
          company: { select: { name: true } },
          assignedTo: { select: { firstName: true, lastName: true } }
        }
      }),
      database_default.deal.count({ where })
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }
  static async getDealBoard(tenantId) {
    const stages = await database_default.pipelineStage.findMany({
      where: { tenantId, type: "deal", isArchived: false },
      orderBy: { position: "asc" },
      include: {
        deals: {
          where: { deletedAt: null, status: "open" },
          include: {
            contact: { select: { firstName: true, lastName: true } },
            assignedTo: { select: { firstName: true, lastName: true } }
          }
        }
      }
    });
    return stages.map((stage) => {
      const totalValue = stage.deals.reduce((sum, deal) => sum + Number(deal.value || 0), 0);
      return {
        stage,
        deals: stage.deals,
        totalCount: stage.deals.length,
        totalValue
      };
    });
  }
  static async getForecast(tenantId) {
    const deals = await database_default.deal.findMany({
      where: {
        tenantId,
        status: "open",
        expectedCloseAt: { not: null },
        deletedAt: null
      }
    });
    const now = /* @__PURE__ */ new Date();
    const startOfMonth2 = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const calculateForPeriod = (start, end) => {
      const periodDeals = deals.filter((d) => {
        const date = new Date(d.expectedCloseAt);
        return date >= start && (end ? date < end : true);
      });
      const expected = periodDeals.reduce((sum, d) => sum + Number(d.value), 0);
      const weighted = periodDeals.reduce((sum, d) => sum + Number(d.value) * (d.probability / 100), 0);
      return { expected, weighted };
    };
    return {
      thisMonth: calculateForPeriod(startOfMonth2, startOfNextMonth),
      nextMonth: calculateForPeriod(startOfNextMonth, new Date(startOfNextMonth.getFullYear(), startOfNextMonth.getMonth() + 1, 1)),
      thisQuarter: calculateForPeriod(startOfQuarter, new Date(startOfQuarter.getFullYear(), startOfQuarter.getMonth() + 3, 1))
    };
  }
  static async createDeal(tenantId, userId, data) {
    return await database_default.deal.create({
      data: {
        ...data,
        tenantId,
        createdById: userId,
        assignedToId: data.assignedToId || userId,
        lastActivityAt: /* @__PURE__ */ new Date()
      }
    });
  }
  static async getDeal(tenantId, id) {
    const deal = await database_default.deal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        contact: true,
        company: true,
        stage: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        dealProducts: { include: { product: true } },
        _count: { select: { tasks: true, proposals: true } },
        communications: { orderBy: { occurredAt: "desc" }, take: 1 }
      }
    });
    if (!deal) throw { status: 404, message: "Deal not found" };
    return {
      ...deal,
      lastCommunication: deal.communications[0] || null,
      proposalsCount: deal._count.proposals,
      tasksCount: deal._count.tasks
    };
  }
  static async updateDeal(tenantId, id, data, userId) {
    const oldDeal = await database_default.deal.findUnique({ where: { id, tenantId }, include: { stage: true } });
    if (!oldDeal) throw { status: 404, message: "Deal not found" };
    if (data.stageId && data.stageId !== oldDeal.stageId) {
      const newStage = await database_default.pipelineStage.findUnique({ where: { id: data.stageId, tenantId } });
      if (!newStage) throw { status: 400, message: "Invalid deal stage" };
      const user = await database_default.user.findUnique({ where: { id: userId } });
      const userRole = user?.role || "salesRep";
      const validation = await StageTransitionService.validateTransition(
        tenantId,
        userId,
        userRole,
        "deal",
        oldDeal.stageId,
        data.stageId
      );
      if (!validation.allowed) {
        throw {
          status: 403,
          message: validation.message || "Stage transition not allowed",
          code: validation.reason
        };
      }
      await StageTransitionService.logTransition(tenantId, {
        entityId: id,
        entityType: "deal",
        fromStageId: oldDeal.stageId,
        toStageId: data.stageId,
        fromStageName: oldDeal.stage.name || null,
        toStageName: newStage.name,
        actorId: userId,
        isSkipOverride: validation.isSkipOverride,
        skippedStages: validation.skippedStages,
        metadata: { updatePayload: data }
      });
      this.logActivity(tenantId, userId, id, "stage_changed", {
        oldValue: { stageId: oldDeal.stageId, stageName: oldDeal.stage.name },
        newValue: { stageId: data.stageId, stageName: newStage?.name },
        isSkipOverride: validation.isSkipOverride,
        skippedStages: validation.skippedStages
      });
      data.lastActivityAt = /* @__PURE__ */ new Date();
    }
    if (data.status && data.status !== oldDeal.status) {
      if (["won", "lost"].includes(data.status)) {
        data.closedAt = /* @__PURE__ */ new Date();
      } else {
        data.closedAt = null;
      }
    }
    return await database_default.deal.update({
      where: { id },
      data
    });
  }
  static async addProduct(tenantId, dealId, productData) {
    const { productId, quantity, unitPrice, discount } = productData;
    const totalPrice = unitPrice * quantity * (1 - discount / 100);
    return await database_default.dealProduct.create({
      data: {
        dealId,
        productId,
        quantity,
        unitPrice,
        discount,
        totalPrice,
        notes: productData.notes
      }
    });
  }
  static async removeProduct(tenantId, dealId, productId) {
    return await database_default.dealProduct.delete({
      where: { dealId_productId: { dealId, productId } }
    });
  }
  static async getTimeline(tenantId, id) {
    const [tasks, comms, activities] = await Promise.all([
      database_default.task.findMany({ where: { dealId: id, tenantId }, orderBy: { createdAt: "desc" } }),
      database_default.communication.findMany({ where: { dealId: id, tenantId }, orderBy: { occurredAt: "desc" } }),
      database_default.activityLog.findMany({ where: { entityId: id, entityType: "deal", tenantId }, orderBy: { createdAt: "desc" } })
    ]);
    const timeline = [
      ...tasks.map((t) => ({ type: "task", date: t.createdAt, data: t })),
      ...comms.map((c) => ({ type: "communication", date: c.occurredAt, data: c })),
      ...activities.map((a) => ({ type: "activity", date: a.createdAt, data: a }))
    ];
    return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  static logActivity(tenantId, userId, entityId, action, metadata) {
    database_default.activityLog.create({
      data: { tenantId, userId, entityId, entityType: "deal", dealId: entityId, action, metadata }
    }).catch(console.error);
    database_default.deal.update({
      where: { id: entityId },
      data: { lastActivityAt: /* @__PURE__ */ new Date() }
    }).catch(console.error);
  }
};

// src/modules/deals/deal.controller.ts
var DealController = class {
  static list = async (req, res) => {
    const result = await DealService.listDeals(req.user.tenantId, req.query);
    return success(res, result, "Deals fetched successfully");
  };
  static getBoard = async (req, res) => {
    const result = await DealService.getDealBoard(req.user.tenantId);
    return success(res, result, "Deal board fetched successfully");
  };
  static getForecast = async (req, res) => {
    const result = await DealService.getForecast(req.user.tenantId);
    return success(res, result, "Sales forecast fetched successfully");
  };
  static create = async (req, res) => {
    const deal = await DealService.createDeal(req.user.tenantId, req.user.id, req.body);
    return success(res, deal, "Deal created successfully", 201);
  };
  static get = async (req, res) => {
    const deal = await DealService.getDeal(req.user.tenantId, req.params.id);
    return success(res, deal, "Deal details fetched successfully");
  };
  static update = async (req, res) => {
    const deal = await DealService.updateDeal(req.user.tenantId, req.params.id, req.body, req.user.id);
    return success(res, deal, "Deal updated successfully");
  };
  static delete = async (req, res) => {
    await DealService.updateDeal(req.user.tenantId, req.params.id, { deletedAt: /* @__PURE__ */ new Date() }, req.user.id);
    return success(res, null, "Deal deleted successfully");
  };
  static addProduct = async (req, res) => {
    const result = await DealService.addProduct(req.user.tenantId, req.params.id, req.body);
    return success(res, result, "Product added to deal successfully");
  };
  static removeProduct = async (req, res) => {
    await DealService.removeProduct(req.user.tenantId, req.params.id, req.params.productId);
    return success(res, null, "Product removed from deal successfully");
  };
  static getTimeline = async (req, res) => {
    const timeline = await DealService.getTimeline(req.user.tenantId, req.params.id);
    return success(res, timeline, "Deal timeline fetched successfully");
  };
};

// src/modules/deals/deal.schemas.ts
import { z as z10 } from "zod";
var createDealSchema = z10.object({
  body: z10.object({
    title: z10.string().min(1, "Title is required"),
    description: z10.string().optional(),
    value: z10.number().optional(),
    currency: z10.string().optional(),
    probability: z10.number().min(0).max(100).optional(),
    status: z10.enum(["open", "won", "lost"]).optional(),
    expectedCloseAt: z10.string().datetime().optional(),
    stageId: z10.string().cuid("Valid stage ID is required"),
    contactId: z10.string().cuid().optional(),
    companyId: z10.string().cuid().optional(),
    assignedToId: z10.string().cuid().optional(),
    sourceLeadId: z10.string().cuid().optional(),
    tags: z10.array(z10.string()).optional(),
    customFields: z10.record(z10.string(), z10.any()).optional()
  })
});
var updateDealSchema = createDealSchema.partial();
var addProductToDealSchema = z10.object({
  body: z10.object({
    productId: z10.string().cuid("Product ID is required"),
    quantity: z10.number().int().min(1).default(1),
    unitPrice: z10.number().min(0),
    discount: z10.number().min(0).max(100).default(0),
    notes: z10.string().optional()
  })
});
var dealFilterSchema = z10.object({
  query: z10.object({
    stageId: z10.string().optional(),
    status: z10.string().optional(),
    assignedToId: z10.string().optional(),
    contactId: z10.string().optional(),
    companyId: z10.string().optional(),
    minValue: z10.string().optional().transform(Number),
    maxValue: z10.string().optional().transform(Number),
    expectedCloseAtFrom: z10.string().optional(),
    expectedCloseAtTo: z10.string().optional(),
    page: z10.string().optional().transform(Number),
    limit: z10.string().optional().transform(Number),
    sortBy: z10.string().optional(),
    sortOrder: z10.enum(["asc", "desc"]).optional()
  })
});

// src/modules/deals/deal.routes.ts
var router8 = Router8();
router8.use(authGuard_default);
router8.get("/", validate_default(dealFilterSchema), asyncHandler_default(DealController.list));
router8.get("/board", asyncHandler_default(DealController.getBoard));
router8.get("/forecast", asyncHandler_default(DealController.getForecast));
router8.post("/", validate_default(createDealSchema), asyncHandler_default(DealController.create));
router8.get("/:id", asyncHandler_default(DealController.get));
router8.patch("/:id", validate_default(updateDealSchema), asyncHandler_default(DealController.update));
router8.delete("/:id", asyncHandler_default(DealController.delete));
router8.post("/:id/products", validate_default(addProductToDealSchema), asyncHandler_default(DealController.addProduct));
router8.delete("/:id/products/:productId", asyncHandler_default(DealController.removeProduct));
router8.get("/:id/timeline", asyncHandler_default(DealController.getTimeline));
var deal_routes_default = router8;

// src/modules/tasks/task.routes.ts
import { Router as Router9 } from "express";

// src/modules/tasks/task.service.ts
var TaskService = class {
  static async listTasks(tenantId, filters) {
    const {
      status,
      type,
      priority,
      assignedToId,
      leadId,
      dealId,
      contactId,
      dueBefore,
      dueAfter,
      isOverdue,
      page = 1,
      limit = 10,
      sortBy = "dueAt",
      sortOrder = "asc"
    } = filters;
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      deletedAt: null,
      ...status ? { status } : {},
      ...type ? { type } : {},
      ...priority ? { priority } : {},
      ...assignedToId ? { assignedToId } : {},
      ...leadId ? { leadId } : {},
      ...dealId ? { dealId } : {},
      ...contactId ? { contactId } : {},
      ...dueBefore || dueAfter ? {
        dueAt: {
          ...dueBefore ? { lte: new Date(dueBefore) } : {},
          ...dueAfter ? { gte: new Date(dueAfter) } : {}
        }
      } : {},
      ...isOverdue ? { status: "overdue" } : {}
    };
    const [data, total] = await Promise.all([
      database_default.task.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedTo: { select: { firstName: true, lastName: true } },
          lead: { select: { title: true } },
          deal: { select: { title: true } },
          contact: { select: { firstName: true, lastName: true } }
        }
      }),
      database_default.task.count({ where })
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }
  static async createTask(tenantId, userId, data) {
    const status = data.dueAt && new Date(data.dueAt) < /* @__PURE__ */ new Date() ? "overdue" : "pending";
    return await database_default.task.create({
      data: {
        ...data,
        tenantId,
        createdById: userId,
        assignedToId: data.assignedToId || userId,
        status
      }
    });
  }
  static async updateTask(tenantId, id, data) {
    if (data.status === "completed") {
      data.completedAt = /* @__PURE__ */ new Date();
    } else if (data.status && data.status !== "completed") {
      data.completedAt = null;
    }
    return await database_default.task.update({
      where: { id, tenantId },
      data
    });
  }
  static async getUpcoming(tenantId, userId) {
    const startOfToday = /* @__PURE__ */ new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOf7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1e3);
    const tasks = await database_default.task.findMany({
      where: {
        tenantId,
        assignedToId: userId,
        dueAt: { gte: startOfToday, lte: endOf7Days },
        status: { notIn: ["completed", "cancelled"] },
        deletedAt: null
      },
      include: {
        lead: { select: { title: true } },
        deal: { select: { title: true } }
      },
      orderBy: { dueAt: "asc" }
    });
    return tasks;
  }
  static async getOverdue(tenantId, userId) {
    return await database_default.task.findMany({
      where: {
        tenantId,
        assignedToId: userId,
        OR: [
          { status: "overdue" },
          { dueAt: { lt: /* @__PURE__ */ new Date() }, status: { notIn: ["completed", "cancelled"] } }
        ],
        deletedAt: null
      },
      orderBy: { dueAt: "asc" }
    });
  }
};

// src/modules/tasks/task.controller.ts
var TaskController = class {
  static list = async (req, res) => {
    const result = await TaskService.listTasks(req.user.tenantId, req.query);
    return success(res, result, "Tasks fetched successfully");
  };
  static create = async (req, res) => {
    const task = await TaskService.createTask(req.user.tenantId, req.user.id, req.body);
    return success(res, task, "Task created successfully", 201);
  };
  static get = async (req, res) => {
    const task = await database_default.task.findFirst({
      where: { id: req.params.id, tenantId: req.user.tenantId, deletedAt: null }
    });
    if (!task) throw { status: 404, message: "Task not found" };
    return success(res, task, "Task details fetched successfully");
  };
  static update = async (req, res) => {
    const task = await TaskService.updateTask(req.user.tenantId, req.params.id, req.body);
    return success(res, task, "Task updated successfully");
  };
  static delete = async (req, res) => {
    await TaskService.updateTask(req.user.tenantId, req.params.id, { deletedAt: /* @__PURE__ */ new Date() });
    return success(res, null, "Task deleted successfully");
  };
  static getUpcoming = async (req, res) => {
    const result = await TaskService.getUpcoming(req.user.tenantId, req.user.id);
    return success(res, result, "Upcoming tasks fetched successfully");
  };
  static getOverdue = async (req, res) => {
    const result = await TaskService.getOverdue(req.user.tenantId, req.user.id);
    return success(res, result, "Overdue tasks fetched successfully");
  };
};

// src/modules/tasks/task.schemas.ts
import { z as z11 } from "zod";
var createTaskSchema = z11.object({
  body: z11.object({
    title: z11.string().min(1, "Title is required"),
    description: z11.string().optional(),
    type: z11.enum(["followUp", "call", "meeting", "email", "task", "proposal", "other"]).optional(),
    priority: z11.enum(["low", "medium", "high", "urgent"]).optional(),
    dueAt: z11.string().datetime().optional(),
    reminderAt: z11.string().datetime().optional(),
    leadId: z11.string().cuid().optional(),
    dealId: z11.string().cuid().optional(),
    contactId: z11.string().cuid().optional(),
    assignedToId: z11.string().cuid().optional()
  }).refine((data) => data.leadId || data.dealId || data.contactId, {
    message: "Task must be linked to a Lead, Deal, or Contact"
  })
});
var updateTaskSchema = z11.object({
  body: z11.object({
    title: z11.string().min(1).optional(),
    description: z11.string().optional(),
    status: z11.enum(["pending", "inProgress", "completed", "cancelled", "overdue"]).optional(),
    priority: z11.enum(["low", "medium", "high", "urgent"]).optional(),
    dueAt: z11.string().datetime().optional(),
    assignedToId: z11.string().cuid().optional()
  })
});
var taskFilterSchema = z11.object({
  query: z11.object({
    status: z11.string().optional(),
    type: z11.string().optional(),
    priority: z11.string().optional(),
    assignedToId: z11.string().optional(),
    leadId: z11.string().optional(),
    dealId: z11.string().optional(),
    contactId: z11.string().optional(),
    dueBefore: z11.string().optional(),
    dueAfter: z11.string().optional(),
    isOverdue: z11.string().optional().transform((v) => v === "true"),
    page: z11.string().optional().transform(Number),
    limit: z11.string().optional().transform(Number),
    sortBy: z11.string().optional(),
    sortOrder: z11.enum(["asc", "desc"]).optional()
  })
});

// src/modules/tasks/task.routes.ts
var router9 = Router9();
router9.use(authGuard_default);
router9.get("/", validate_default(taskFilterSchema), asyncHandler_default(TaskController.list));
router9.post("/", validate_default(createTaskSchema), asyncHandler_default(TaskController.create));
router9.get("/upcoming", asyncHandler_default(TaskController.getUpcoming));
router9.get("/overdue", asyncHandler_default(TaskController.getOverdue));
router9.get("/:id", asyncHandler_default(TaskController.get));
router9.patch("/:id", validate_default(updateTaskSchema), asyncHandler_default(TaskController.update));
router9.delete("/:id", asyncHandler_default(TaskController.delete));
var task_routes_default = router9;

// src/modules/communications/communication.routes.ts
import { Router as Router10 } from "express";

// src/modules/communications/communication.service.ts
var CommunicationService = class {
  static async listCommunications(tenantId, filters) {
    const { leadId, dealId, contactId, type, sourceType, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      deletedAt: null,
      ...leadId ? { leadId } : {},
      ...dealId ? { dealId } : {},
      ...contactId ? { contactId } : {},
      ...type ? { type } : {},
      ...sourceType ? { sourceType } : {}
    };
    const [data, total] = await Promise.all([
      database_default.communication.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { occurredAt: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true } },
          contact: { select: { firstName: true, lastName: true } }
        }
      }),
      database_default.communication.count({ where })
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }
  static async createCommunication(tenantId, userId, data) {
    return await database_default.communication.create({
      data: {
        ...data,
        tenantId,
        userId,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : /* @__PURE__ */ new Date()
      }
    });
  }
  static async getCommunication(tenantId, id) {
    const comm = await database_default.communication.findFirst({
      where: { id, tenantId }
    });
    if (!comm) throw { status: 404, message: "Communication not found" };
    return comm;
  }
  static async updateCommunication(tenantId, id, data) {
    return await database_default.communication.update({
      where: { id, tenantId },
      data
    });
  }
  static async deleteCommunication(tenantId, id) {
    return await database_default.communication.update({
      where: { id, tenantId },
      data: { deletedAt: /* @__PURE__ */ new Date() }
    });
  }
};

// src/modules/communications/communication.controller.ts
var CommunicationController = class {
  static list = async (req, res) => {
    const result = await CommunicationService.listCommunications(req.user.tenantId, req.query);
    return success(res, result, "Communications fetched successfully");
  };
  static create = async (req, res) => {
    const comm = await CommunicationService.createCommunication(req.user.tenantId, req.user.id, req.body);
    return success(res, comm, "Communication logged successfully", 201);
  };
  static get = async (req, res) => {
    const comm = await CommunicationService.getCommunication(req.user.tenantId, req.params.id);
    return success(res, comm, "Communication details fetched successfully");
  };
  static update = async (req, res) => {
    const comm = await CommunicationService.updateCommunication(req.user.tenantId, req.params.id, req.body);
    return success(res, comm, "Communication updated successfully");
  };
  static delete = async (req, res) => {
    await CommunicationService.deleteCommunication(req.user.tenantId, req.params.id);
    return success(res, null, "Communication deleted successfully");
  };
};

// src/modules/communications/communication.schemas.ts
import { z as z12 } from "zod";
var createCommunicationSchema = z12.object({
  body: z12.object({
    type: z12.enum(["email", "call", "meeting", "note", "whatsapp", "linkedin", "other"]),
    direction: z12.enum(["inbound", "outbound"]).optional(),
    sourceType: z12.enum(["human", "system", "ai"]).optional(),
    subject: z12.string().optional(),
    body: z12.string().optional(),
    occurredAt: z12.string().datetime().optional(),
    durationSeconds: z12.number().int().optional(),
    outcome: z12.string().optional(),
    attachments: z12.array(z12.object({
      name: z12.string(),
      url: z12.string().url(),
      size: z12.number().optional()
    })).optional(),
    leadId: z12.string().cuid().optional(),
    dealId: z12.string().cuid().optional(),
    contactId: z12.string().cuid().optional()
  })
});
var updateCommunicationSchema = z12.object({
  body: z12.object({
    outcome: z12.string().optional(),
    body: z12.string().optional(),
    summary: z12.string().optional(),
    attachments: z12.any().optional()
  })
});
var communicationFilterSchema = z12.object({
  query: z12.object({
    leadId: z12.string().optional(),
    dealId: z12.string().optional(),
    contactId: z12.string().optional(),
    type: z12.string().optional(),
    sourceType: z12.string().optional(),
    page: z12.string().optional().transform(Number),
    limit: z12.string().optional().transform(Number)
  })
});

// src/modules/communications/communication.routes.ts
var router10 = Router10();
router10.use(authGuard_default);
router10.get("/", validate_default(communicationFilterSchema), asyncHandler_default(CommunicationController.list));
router10.post("/", validate_default(createCommunicationSchema), asyncHandler_default(CommunicationController.create));
router10.get("/:id", asyncHandler_default(CommunicationController.get));
router10.patch("/:id", validate_default(updateCommunicationSchema), asyncHandler_default(CommunicationController.update));
router10.delete("/:id", asyncHandler_default(CommunicationController.delete));
var communication_routes_default = router10;

// src/modules/products/product.routes.ts
import { Router as Router11 } from "express";

// src/modules/products/product.service.ts
var ProductService = class {
  static async listProducts(tenantId, filters) {
    const { status, type, category, search, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      deletedAt: null,
      ...status ? { status } : {},
      ...type ? { type } : {},
      ...category ? { category } : {},
      ...search ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } }
        ]
      } : {}
    };
    const [data, total] = await Promise.all([
      database_default.product.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { name: "asc" }
      }),
      database_default.product.count({ where })
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }
  static async createProduct(tenantId, data) {
    return await database_default.product.create({
      data: { ...data, tenantId }
    });
  }
  static async getProduct(tenantId, id) {
    const product = await database_default.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: {
          select: { dealProducts: true }
        }
      }
    });
    if (!product) throw { status: 404, message: "Product not found" };
    return {
      ...product,
      usageCount: product._count.dealProducts
    };
  }
  static async updateProduct(tenantId, id, data) {
    return await database_default.product.update({
      where: { id, tenantId },
      data
    });
  }
  static async deleteProduct(tenantId, id) {
    const openDealsCount = await database_default.deal.count({
      where: {
        tenantId,
        status: "open",
        dealProducts: { some: { productId: id } }
      }
    });
    if (openDealsCount > 0) {
      throw {
        status: 400,
        message: `Cannot delete product used in ${openDealsCount} open deals`,
        code: "PRODUCT_IN_USE"
      };
    }
    return await database_default.product.update({
      where: { id, tenantId },
      data: { deletedAt: /* @__PURE__ */ new Date() }
    });
  }
};

// src/modules/products/product.controller.ts
var ProductController = class {
  static list = async (req, res) => {
    const result = await ProductService.listProducts(req.user.tenantId, req.query);
    return success(res, result, "Products fetched successfully");
  };
  static create = async (req, res) => {
    const product = await ProductService.createProduct(req.user.tenantId, req.body);
    return success(res, product, "Product created successfully", 201);
  };
  static get = async (req, res) => {
    const product = await ProductService.getProduct(req.user.tenantId, req.params.id);
    return success(res, product, "Product details fetched successfully");
  };
  static update = async (req, res) => {
    const product = await ProductService.updateProduct(req.user.tenantId, req.params.id, req.body);
    return success(res, product, "Product updated successfully");
  };
  static delete = async (req, res) => {
    await ProductService.deleteProduct(req.user.tenantId, req.params.id);
    return success(res, null, "Product deleted successfully");
  };
};

// src/modules/products/product.schemas.ts
import { z as z13 } from "zod";
var createProductSchema = z13.object({
  body: z13.object({
    name: z13.string().min(1, "Product name is required"),
    description: z13.string().optional(),
    type: z13.enum(["oneTime", "recurring"]).optional(),
    status: z13.enum(["active", "inactive", "archived"]).optional(),
    sku: z13.string().optional(),
    price: z13.number().min(0),
    currency: z13.string().optional(),
    billingCycle: z13.string().optional(),
    taxRate: z13.number().min(0).max(100).optional(),
    category: z13.string().optional(),
    tags: z13.array(z13.string()).optional(),
    imageUrl: z13.string().url().optional().or(z13.literal("")),
    customFields: z13.record(z13.string(), z13.any()).optional()
  })
});
var updateProductSchema = createProductSchema.partial();
var productFilterSchema = z13.object({
  query: z13.object({
    status: z13.string().optional(),
    type: z13.string().optional(),
    category: z13.string().optional(),
    search: z13.string().optional(),
    page: z13.string().optional().transform(Number),
    limit: z13.string().optional().transform(Number)
  })
});

// src/modules/products/product.routes.ts
var router11 = Router11();
router11.use(authGuard_default);
router11.get("/", validate_default(productFilterSchema), asyncHandler_default(ProductController.list));
router11.post("/", validate_default(createProductSchema), asyncHandler_default(ProductController.create));
router11.get("/:id", asyncHandler_default(ProductController.get));
router11.patch("/:id", validate_default(updateProductSchema), asyncHandler_default(ProductController.update));
router11.delete("/:id", asyncHandler_default(ProductController.delete));
var product_routes_default = router11;

// src/modules/activities/activity.routes.ts
import { Router as Router12 } from "express";

// src/modules/activities/activity.service.ts
var ActivityService = class {
  static async listActivities(tenantId, limit = 10) {
    return await database_default.activityLog.findMany({
      where: { tenantId },
      take: Math.min(limit, 50),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } }
      }
    });
  }
};

// src/modules/activities/activity.controller.ts
var ActivityController = class {
  static async list(req, res) {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await ActivityService.listActivities(req.user.tenantId, limit);
    return success(res, activities);
  }
};

// src/middleware/tenantResolver.ts
var tenantResolver = async (req, res, next) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    return error(res, "Tenant identification failed", 400, "TENANT_ID_MISSING");
  }
  req.tenant = {
    id: tenantId,
    name: "Unknown"
    // You can fetch this from DB if needed
  };
  next();
};
var tenantResolver_default = tenantResolver;

// src/modules/activities/activity.routes.ts
var router12 = Router12();
router12.use(authGuard_default, tenantResolver_default);
router12.get("/", ActivityController.list);
var activity_routes_default = router12;

// src/modules/proposals/proposal.routes.ts
import { Router as Router13 } from "express";

// src/modules/proposals/proposal.service.ts
import { v4 as uuidv42 } from "uuid";
var ProposalService = class {
  static async listProposals(tenantId, filters) {
    const { status, dealId, contactId, createdById, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      deletedAt: null,
      ...status ? { status } : {},
      ...dealId ? { dealId } : {},
      ...contactId ? { contactId } : {},
      ...createdById ? { createdById } : {}
    };
    const [data, total] = await Promise.all([
      database_default.proposal.findMany({
        where,
        skip,
        take: Math.min(limit, 100),
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          status: true,
          version: true,
          totalAmount: true,
          currency: true,
          validUntil: true,
          createdAt: true,
          deal: { select: { title: true } },
          contact: { select: { firstName: true, lastName: true } },
          createdBy: { select: { firstName: true, lastName: true } }
        }
      }),
      database_default.proposal.count({ where })
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }
  static async createProposal(tenantId, userId, data) {
    const { items, ...header } = data;
    const totals = this.calculateTotals(items);
    return await database_default.$transaction(async (tx) => {
      const proposal = await tx.proposal.create({
        data: {
          ...header,
          ...totals,
          tenantId,
          createdById: userId,
          publicToken: uuidv42(),
          items: {
            create: items.map((item, idx) => ({
              ...item,
              position: idx,
              totalPrice: this.calculateItemTotal(item)
            }))
          }
        },
        include: { items: true }
      });
      return proposal;
    });
  }
  static async getProposal(tenantId, id) {
    const proposal = await database_default.proposal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        items: { orderBy: { position: "asc" } },
        deal: true,
        contact: true,
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        revisions: {
          select: { id: true, version: true, status: true, createdAt: true },
          orderBy: { version: "desc" }
        }
      }
    });
    if (!proposal) throw { status: 404, message: "Proposal not found" };
    return proposal;
  }
  static async updateProposal(tenantId, id, data) {
    const proposal = await database_default.proposal.findUnique({ where: { id, tenantId } });
    if (!proposal) throw { status: 404, message: "Proposal not found" };
    if (data.status) {
      this.validateStatusTransition(proposal.status, data.status);
    }
    return await database_default.proposal.update({
      where: { id },
      data
    });
  }
  static async addItem(tenantId, id, item) {
    const proposal = await this.ensureDraft(tenantId, id);
    return await database_default.$transaction(async (tx) => {
      await tx.proposalItem.create({
        data: {
          ...item,
          proposalId: id,
          totalPrice: this.calculateItemTotal(item)
        }
      });
      return await this.refreshProposalTotals(tx, id);
    });
  }
  static async updateItem(tenantId, proposalId, itemId, data) {
    await this.ensureDraft(tenantId, proposalId);
    return await database_default.$transaction(async (tx) => {
      const item = await tx.proposalItem.findUnique({ where: { id: itemId } });
      if (!item) throw { status: 404, message: "Item not found" };
      const updatedData = { ...item, ...data };
      await tx.proposalItem.update({
        where: { id: itemId },
        data: {
          ...data,
          totalPrice: this.calculateItemTotal(updatedData)
        }
      });
      return await this.refreshProposalTotals(tx, proposalId);
    });
  }
  static async removeItem(tenantId, proposalId, itemId) {
    await this.ensureDraft(tenantId, proposalId);
    return await database_default.$transaction(async (tx) => {
      await tx.proposalItem.delete({ where: { id: itemId } });
      return await this.refreshProposalTotals(tx, proposalId);
    });
  }
  static async reviseProposal(tenantId, id, userId) {
    const original = await database_default.proposal.findUnique({
      where: { id, tenantId },
      include: { items: true }
    });
    if (!original) throw { status: 404, message: "Proposal not found" };
    return await database_default.$transaction(async (tx) => {
      const newProposal = await tx.proposal.create({
        data: {
          tenantId,
          createdById: userId,
          dealId: original.dealId,
          contactId: original.contactId,
          title: original.title,
          currency: original.currency,
          notes: original.notes,
          terms: original.terms,
          subtotal: original.subtotal,
          taxAmount: original.taxAmount,
          totalAmount: original.totalAmount,
          discountAmount: original.discountAmount,
          version: original.version + 1,
          parentProposalId: original.id,
          publicToken: uuidv42(),
          status: "draft",
          items: {
            create: original.items.map((item) => ({
              productId: item.productId,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxRate: item.taxRate,
              totalPrice: item.totalPrice,
              position: item.position
            }))
          }
        },
        include: { items: true }
      });
      return newProposal;
    });
  }
  static async sendProposal(tenantId, id) {
    const proposal = await database_default.proposal.update({
      where: { id, tenantId },
      data: { status: "sent", sentAt: /* @__PURE__ */ new Date() }
    });
    return {
      proposal,
      shareableUrl: `https://app.yourcrm.com/p/${proposal.publicToken}`
    };
  }
  static async getPublicProposal(token) {
    const proposal = await database_default.proposal.findUnique({
      where: { publicToken: token },
      include: { items: { orderBy: { position: "asc" } } }
    });
    if (!proposal) throw { status: 404, message: "Proposal not found" };
    if (proposal.status === "sent") {
      await database_default.proposal.update({
        where: { id: proposal.id },
        data: { status: "viewed", viewedAt: /* @__PURE__ */ new Date() }
      });
    }
    return {
      title: proposal.title,
      items: proposal.items.map((i) => ({
        name: i.name,
        description: i.description,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        taxRate: i.taxRate,
        totalPrice: i.totalPrice
      })),
      subtotal: proposal.subtotal,
      taxAmount: proposal.taxAmount,
      totalAmount: proposal.totalAmount,
      currency: proposal.currency,
      validUntil: proposal.validUntil,
      status: proposal.status
    };
  }
  static async respondPublicly(token, response, comment) {
    const proposal = await database_default.proposal.findUnique({ where: { publicToken: token } });
    if (!proposal) throw { status: 404, message: "Proposal not found" };
    const status = response === "accepted" ? "accepted" : "rejected";
    const updated = await database_default.proposal.update({
      where: { id: proposal.id },
      data: { status, respondedAt: /* @__PURE__ */ new Date(), notes: comment ? `${proposal.notes}
Client Comment: ${comment}` : proposal.notes }
    });
    database_default.activityLog.create({
      data: {
        tenantId: proposal.tenantId,
        userId: proposal.createdById,
        // Mocking as the creator for now
        entityId: proposal.id,
        entityType: "proposal",
        action: `client_${response}`,
        metadata: { comment }
      }
    }).catch(console.error);
    return updated;
  }
  static calculateItemTotal(item) {
    const discountedPrice = Number(item.unitPrice) * (1 - Number(item.discount || 0) / 100);
    return discountedPrice * Number(item.quantity);
  }
  static calculateTotals(items) {
    let subtotal = 0;
    let taxAmount = 0;
    items.forEach((item) => {
      const itemTotal = this.calculateItemTotal(item);
      subtotal += itemTotal;
      taxAmount += itemTotal * (Number(item.taxRate || 0) / 100);
    });
    return {
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      discountAmount: 0
      // Could implement header-level discount later
    };
  }
  static async refreshProposalTotals(tx, id) {
    const items = await tx.proposalItem.findMany({ where: { proposalId: id } });
    const totals = this.calculateTotals(items);
    return await tx.proposal.update({
      where: { id },
      data: totals,
      include: { items: true }
    });
  }
  static async ensureDraft(tenantId, id) {
    const proposal = await database_default.proposal.findUnique({ where: { id, tenantId } });
    if (!proposal) throw { status: 404, message: "Proposal not found" };
    if (proposal.status !== "draft") throw { status: 400, message: "Only draft proposals can be modified" };
    return proposal;
  }
  static validateStatusTransition(current, next) {
    const order = ["draft", "sent", "viewed", "accepted", "rejected"];
    const currentIndex = order.indexOf(current);
    const nextIndex = order.indexOf(next);
    if (nextIndex <= currentIndex && next !== "rejected") {
      throw { status: 400, message: `Invalid status transition from ${current} to ${next}` };
    }
  }
};

// src/modules/proposals/proposal.controller.ts
var ProposalController = class {
  static list = async (req, res) => {
    const result = await ProposalService.listProposals(req.user.tenantId, req.query);
    return success(res, result, "Proposals fetched successfully");
  };
  static create = async (req, res) => {
    const proposal = await ProposalService.createProposal(req.user.tenantId, req.user.id, req.body);
    return success(res, proposal, "Proposal created successfully", 201);
  };
  static get = async (req, res) => {
    const proposal = await ProposalService.getProposal(req.user.tenantId, req.params.id);
    return success(res, proposal, "Proposal details fetched successfully");
  };
  static update = async (req, res) => {
    const proposal = await ProposalService.updateProposal(req.user.tenantId, req.params.id, req.body);
    return success(res, proposal, "Proposal updated successfully");
  };
  static addItem = async (req, res) => {
    const proposal = await ProposalService.addItem(req.user.tenantId, req.params.id, req.body);
    return success(res, proposal, "Item added to proposal successfully");
  };
  static updateItem = async (req, res) => {
    const proposal = await ProposalService.updateItem(req.user.tenantId, req.params.id, req.params.itemId, req.body);
    return success(res, proposal, "Item updated successfully");
  };
  static removeItem = async (req, res) => {
    const proposal = await ProposalService.removeItem(req.user.tenantId, req.params.id, req.params.itemId);
    return success(res, proposal, "Item removed successfully");
  };
  static revise = async (req, res) => {
    const proposal = await ProposalService.reviseProposal(req.user.tenantId, req.params.id, req.user.id);
    return success(res, proposal, "Proposal revision created successfully");
  };
  static send = async (req, res) => {
    const result = await ProposalService.sendProposal(req.user.tenantId, req.params.id);
    return success(res, result, "Proposal sent successfully");
  };
  // Public Endpoints
  static getPublic = async (req, res) => {
    const proposal = await ProposalService.getPublicProposal(req.params.publicToken);
    return success(res, proposal, "Proposal fetched successfully");
  };
  static respondPublic = async (req, res) => {
    const { response, comment } = req.body;
    const result = await ProposalService.respondPublicly(req.params.publicToken, response, comment);
    return success(res, result, `Proposal ${response} successfully`);
  };
};

// src/modules/proposals/proposal.schemas.ts
import { z as z14 } from "zod";
var proposalItemSchema = z14.object({
  productId: z14.string().cuid().optional(),
  name: z14.string().min(1),
  description: z14.string().optional(),
  quantity: z14.number().int().min(1).default(1),
  unitPrice: z14.number().min(0),
  discount: z14.number().min(0).max(100).default(0),
  taxRate: z14.number().min(0).max(100).default(0)
});
var createProposalSchema = z14.object({
  body: z14.object({
    title: z14.string().min(1, "Proposal title is required"),
    dealId: z14.string().cuid().optional(),
    contactId: z14.string().cuid().optional(),
    validUntil: z14.string().datetime().optional(),
    notes: z14.string().optional(),
    terms: z14.string().optional(),
    currency: z14.string().optional(),
    items: z14.array(proposalItemSchema).min(1, "At least one line item is required")
  })
});
var updateProposalSchema = z14.object({
  body: z14.object({
    title: z14.string().min(1).optional(),
    validUntil: z14.string().datetime().optional(),
    notes: z14.string().optional(),
    terms: z14.string().optional(),
    status: z14.enum(["draft", "sent", "viewed", "accepted", "rejected"]).optional()
  })
});
var addProposalItemSchema = z14.object({
  body: proposalItemSchema
});
var updateProposalItemSchema = z14.object({
  body: z14.object({
    quantity: z14.number().int().min(1).optional(),
    unitPrice: z14.number().min(0).optional(),
    discount: z14.number().min(0).max(100).optional()
  })
});
var proposalFilterSchema = z14.object({
  query: z14.object({
    status: z14.string().optional(),
    dealId: z14.string().optional(),
    contactId: z14.string().optional(),
    createdById: z14.string().optional(),
    page: z14.string().optional().transform(Number),
    limit: z14.string().optional().transform(Number)
  })
});
var respondProposalSchema = z14.object({
  body: z14.object({
    response: z14.enum(["accepted", "rejected"]),
    comment: z14.string().optional()
  })
});

// src/modules/proposals/proposal.routes.ts
var router13 = Router13();
var publicRouter = Router13();
router13.use(authGuard_default);
router13.get("/", validate_default(proposalFilterSchema), asyncHandler_default(ProposalController.list));
router13.post("/", validate_default(createProposalSchema), asyncHandler_default(ProposalController.create));
router13.get("/:id", asyncHandler_default(ProposalController.get));
router13.patch("/:id", validate_default(updateProposalSchema), asyncHandler_default(ProposalController.update));
router13.post("/:id/items", validate_default(addProposalItemSchema), asyncHandler_default(ProposalController.addItem));
router13.patch("/:id/items/:itemId", validate_default(updateProposalItemSchema), asyncHandler_default(ProposalController.updateItem));
router13.delete("/:id/items/:itemId", asyncHandler_default(ProposalController.removeItem));
router13.post("/:id/revise", asyncHandler_default(ProposalController.revise));
router13.post("/:id/send", asyncHandler_default(ProposalController.send));
publicRouter.get("/:publicToken", asyncHandler_default(ProposalController.getPublic));
publicRouter.post("/:publicToken/respond", validate_default(respondProposalSchema), asyncHandler_default(ProposalController.respondPublic));

// src/modules/analytics/analytics.routes.ts
import { Router as Router14 } from "express";

// src/modules/analytics/analytics.service.ts
import { subDays as subDays2, subMonths, startOfMonth, endOfMonth } from "date-fns";
var getAnalyticsSummary = async (tenantId, period, funnelMode) => {
  const verifiedOnly = funnelMode === "verified";
  const now = /* @__PURE__ */ new Date();
  let startDate;
  switch (period) {
    case "7d":
      startDate = subDays2(now, 7);
      break;
    case "30d":
      startDate = subDays2(now, 30);
      break;
    case "90d":
      startDate = subDays2(now, 90);
      break;
    case "12m":
      startDate = subMonths(now, 12);
      break;
    default:
      startDate = subDays2(now, 30);
  }
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const skipOverrideLeadIds = verifiedOnly ? (await database_default.stageTransition.findMany({
    where: { tenantId, entityType: "lead", isSkipOverride: true },
    select: { entityId: true },
    distinct: ["entityId"]
  })).map((t) => t.entityId) : [];
  const leadWhere = { tenantId };
  if (verifiedOnly && skipOverrideLeadIds.length > 0) {
    leadWhere.id = { notIn: skipOverrideLeadIds };
  }
  const [totalLeads, newLeads, convertedLeads, leadsByStage, leadsBySource] = await Promise.all([
    database_default.lead.count({ where: { ...leadWhere } }),
    database_default.lead.count({ where: { ...leadWhere, createdAt: { gte: startDate } } }),
    database_default.lead.count({ where: { ...leadWhere, isConverted: true, convertedAt: { gte: startDate } } }),
    database_default.lead.groupBy({
      by: ["stageId"],
      where: { ...leadWhere },
      _count: { _all: true },
      _sum: { estimatedValue: true }
    }),
    database_default.lead.groupBy({
      by: ["source"],
      where: { ...leadWhere },
      _count: { _all: true }
    })
  ]);
  const stages = await database_default.pipelineStage.findMany({
    where: { tenantId, type: "lead" },
    select: { id: true, name: true }
  });
  const leadsByStageEnriched = leadsByStage.map((item) => ({
    stageId: item.stageId,
    stageName: stages.find((s) => s.id === item.stageId)?.name || "Unknown",
    count: item._count._all,
    value: Number(item._sum.estimatedValue || 0)
  })).sort((a, b) => b.count - a.count);
  const convertedLeadsData = await database_default.lead.findMany({
    where: { ...leadWhere, isConverted: true, convertedAt: { gte: startDate } },
    select: { createdAt: true, convertedAt: true }
  });
  const totalDiff = convertedLeadsData.reduce((acc, lead) => {
    if (lead.convertedAt) {
      return acc + (lead.convertedAt.getTime() - lead.createdAt.getTime());
    }
    return acc;
  }, 0);
  const avgTimeToConvertHours = convertedLeadsData.length > 0 ? totalDiff / convertedLeadsData.length / (1e3 * 60 * 60) : 0;
  const [totalDeals, dealsByStatus, dealsByStage, allDealsValue] = await Promise.all([
    database_default.deal.count({ where: { tenantId } }),
    database_default.deal.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: { _all: true },
      _sum: { value: true }
    }),
    database_default.deal.groupBy({
      by: ["stageId"],
      where: { tenantId, status: "open" },
      _count: { _all: true }
    }),
    database_default.deal.aggregate({
      where: { tenantId },
      _avg: { value: true }
    })
  ]);
  const dealStatusMap = dealsByStatus.reduce((acc, curr) => {
    acc[curr.status] = { count: curr._count._all, value: Number(curr._sum.value || 0) };
    return acc;
  }, {});
  const openDealsCount = dealStatusMap["open"]?.count || 0;
  const wonDealsCount = dealStatusMap["won"]?.count || 0;
  const lostDealsCount = dealStatusMap["lost"]?.count || 0;
  const totalWonValue = dealStatusMap["won"]?.value || 0;
  const dealStages = await database_default.pipelineStage.findMany({
    where: { tenantId, type: "deal" },
    select: { id: true, name: true }
  });
  const dealsByStageEnriched = dealsByStage.map((item) => ({
    stageId: item.stageId,
    stageName: dealStages.find((s) => s.id === item.stageId)?.name || "Unknown",
    count: item._count._all
  }));
  const forecastData = await database_default.deal.findMany({
    where: {
      tenantId,
      status: "open",
      expectedCloseAt: { gte: thisMonthStart, lte: thisMonthEnd }
    },
    select: { value: true, probability: true }
  });
  const forecastThisMonth = forecastData.reduce((acc, d) => acc + Number(d.value), 0);
  const forecastWeighted = forecastData.reduce((acc, d) => acc + Number(d.value) * (d.probability / 100), 0);
  const [totalTasks, completedTasks, overdueTasks] = await Promise.all([
    database_default.task.count({ where: { tenantId } }),
    database_default.task.count({ where: { tenantId, status: "completed", completedAt: { gte: startDate } } }),
    database_default.task.count({ where: { tenantId, status: "pending", dueAt: { lt: now } } })
  ]);
  const [totalComms, commsByType] = await Promise.all([
    database_default.communication.count({ where: { tenantId, occurredAt: { gte: startDate } } }),
    database_default.communication.groupBy({
      by: ["type"],
      where: { tenantId, occurredAt: { gte: startDate } },
      _count: { _all: true }
    })
  ]);
  const topRepsRaw = await database_default.user.findMany({
    where: { tenantId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      _count: {
        select: {
          createdLeads: { where: { createdAt: { gte: startDate } } },
          assignedDeals: { where: { status: "won", closedAt: { gte: startDate } } }
        }
      },
      assignedDeals: {
        where: { status: "won", closedAt: { gte: startDate } },
        select: { value: true }
      }
    },
    take: 10
  });
  const topReps = topRepsRaw.map((rep) => ({
    userId: rep.id,
    name: `${rep.firstName} ${rep.lastName}`,
    leadsCreated: rep._count.createdLeads,
    dealsWon: rep._count.assignedDeals,
    wonValue: rep.assignedDeals.reduce((acc, d) => acc + Number(d.value), 0)
  })).sort((a, b) => b.wonValue - a.wonValue);
  const leadsWithDeals = await database_default.lead.findMany({
    where: { tenantId, isConverted: true, convertedToDealId: { not: null } },
    select: { source: true, convertedToDealId: true }
  });
  const leadDealIds = leadsWithDeals.filter((l) => l.convertedToDealId).map((l) => l.convertedToDealId);
  const sourceROIMap = {};
  for (const lead of leadsWithDeals) {
    if (!sourceROIMap[lead.source]) {
      sourceROIMap[lead.source] = { leadCount: 0, wonValue: 0 };
    }
    sourceROIMap[lead.source].leadCount++;
  }
  if (leadDealIds.length > 0) {
    const wonDeals = await database_default.deal.findMany({
      where: { id: { in: leadDealIds }, tenantId },
      select: { id: true, value: true, tags: true }
    });
    for (const lead of leadsWithDeals) {
      if (!lead.convertedToDealId) continue;
      const deal = wonDeals.find((d) => d.id === lead.convertedToDealId);
      if (deal && sourceROIMap[lead.source]) {
        sourceROIMap[lead.source].wonValue += Number(deal.value || 0);
      }
    }
  }
  return {
    leads: {
      total: totalLeads,
      new: newLeads,
      converted: convertedLeads,
      byStage: leadsByStageEnriched,
      bySource: leadsBySource.map((s) => ({ source: s.source, count: s._count._all })),
      sourceROI: Object.entries(sourceROIMap).map(([source, data]) => ({
        source,
        leadCount: data.leadCount,
        wonValue: data.wonValue,
        roiPerLead: data.leadCount > 0 ? data.wonValue / data.leadCount : 0
      })).sort((a, b) => b.wonValue - a.wonValue),
      funnelMode: funnelMode || "full",
      conversionRate: totalLeads > 0 ? convertedLeads / totalLeads * 100 : 0,
      avgTimeToConvert: avgTimeToConvertHours
    },
    deals: {
      total: totalDeals,
      open: openDealsCount,
      won: wonDealsCount,
      lost: lostDealsCount,
      totalWonValue,
      avgDealValue: Number(allDealsValue._avg.value || 0),
      winRate: wonDealsCount + lostDealsCount > 0 ? wonDealsCount / (wonDealsCount + lostDealsCount) * 100 : 0,
      byStage: dealsByStageEnriched,
      forecastThisMonth,
      forecastWeighted
    },
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? completedTasks / totalTasks * 100 : 0
    },
    communications: {
      total: totalComms,
      byType: commsByType.map((c) => ({ type: c.type, count: c._count._all })),
      avgPerLead: totalLeads > 0 ? totalComms / totalLeads : 0
    },
    topReps
  };
};
var getActivityHeatmap = async (tenantId) => {
  const now = /* @__PURE__ */ new Date();
  const oneYearAgo = subMonths(now, 12);
  const activities = await database_default.activityLog.findMany({
    where: {
      tenantId,
      createdAt: { gte: oneYearAgo }
    },
    select: { createdAt: true }
  });
  const heatmap = {};
  activities.forEach((a) => {
    const date = a.createdAt.toISOString().split("T")[0];
    heatmap[date] = (heatmap[date] || 0) + 1;
  });
  return Object.entries(heatmap).map(([date, count]) => ({ date, count }));
};

// src/modules/analytics/analytics.controller.ts
var getSummary = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const period = req.query.period || "30d";
    const funnelMode = req.query.funnel;
    const summary = await getAnalyticsSummary(tenantId, period, funnelMode);
    return success(res, summary, "Analytics summary retrieved successfully");
  } catch (err) {
    console.error("Analytics Error:", err);
    return error(res, "Failed to retrieve analytics summary", 500);
  }
};
var getHeatmap = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const heatmap = await getActivityHeatmap(tenantId);
    return success(res, heatmap, "Activity heatmap retrieved successfully");
  } catch (err) {
    return error(res, "Failed to retrieve activity heatmap", 500);
  }
};

// src/modules/analytics/analytics.routes.ts
var router14 = Router14();
router14.get("/summary", authGuard_default, getSummary);
router14.get("/heatmap", authGuard_default, getHeatmap);
var analytics_routes_default = router14;

// src/modules/leadScoring/leadScoring.routes.ts
import { Router as Router15 } from "express";

// src/modules/leadScoring/leadScoring.controller.ts
var LeadScoringController = class {
  static getRules = async (req, res) => {
    const rules = await LeadScoringService.getRules(req.user.tenantId);
    return success(res, rules, "Lead scoring rules fetched successfully");
  };
  static updateRules = async (req, res) => {
    const rules = req.body;
    await LeadScoringService.updateRules(req.user.tenantId, rules);
    return success(res, rules, "Lead scoring rules updated successfully");
  };
  static resetRules = async (req, res) => {
    await LeadScoringService.updateRules(req.user.tenantId, DEFAULT_RULES);
    return success(res, DEFAULT_RULES, "Lead scoring rules reset to defaults");
  };
};

// src/modules/leadScoring/leadScoring.routes.ts
var router15 = Router15();
router15.use(authGuard_default);
router15.get("/rules", asyncHandler_default(LeadScoringController.getRules));
router15.put("/rules", asyncHandler_default(LeadScoringController.updateRules));
router15.post("/rules/reset", asyncHandler_default(LeadScoringController.resetRules));
var leadScoring_routes_default = router15;

// src/modules/emailTemplates/emailTemplate.routes.ts
import { Router as Router16 } from "express";

// src/modules/emailTemplates/emailTemplate.service.ts
var EmailTemplateService = class {
  static async listTemplates(tenantId) {
    return await database_default.emailTemplate.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { usageCount: "desc" },
      include: { createdBy: { select: { firstName: true, lastName: true } } }
    });
  }
  static async createTemplate(tenantId, userId, data) {
    return await database_default.emailTemplate.create({
      data: {
        ...data,
        tenantId,
        createdById: userId
      }
    });
  }
  static async getTemplate(tenantId, id) {
    const template = await database_default.emailTemplate.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    if (!template) throw { status: 404, message: "Template not found" };
    return template;
  }
  static async updateTemplate(tenantId, id, data) {
    return await database_default.emailTemplate.update({
      where: { id, tenantId },
      data
    });
  }
  static async deleteTemplate(tenantId, id) {
    return await database_default.emailTemplate.update({
      where: { id, tenantId },
      data: { deletedAt: /* @__PURE__ */ new Date(), isActive: false }
    });
  }
  static async previewTemplate(tenantId, id, context, userId) {
    const template = await this.getTemplate(tenantId, id);
    const dataContext = {};
    const [user, tenant] = await Promise.all([
      database_default.user.findUnique({ where: { id: userId } }),
      database_default.tenant.findUnique({ where: { id: tenantId } })
    ]);
    dataContext.user = user;
    dataContext.tenant = tenant;
    if (context.leadId) {
      const lead = await database_default.lead.findUnique({
        where: { id: context.leadId },
        include: { contact: { include: { company: true } }, company: true }
      });
      if (lead) {
        dataContext.lead = lead;
        dataContext.contact = lead.contact || dataContext.contact;
        dataContext.company = lead.company || lead.contact?.company || dataContext.company;
      }
    }
    if (context.dealId) {
      const deal = await database_default.deal.findUnique({
        where: { id: context.dealId },
        include: { contact: { include: { company: true } }, company: true }
      });
      if (deal) {
        dataContext.deal = deal;
        dataContext.contact = deal.contact || dataContext.contact;
        dataContext.company = deal.company || deal.contact?.company || dataContext.company;
      }
    }
    if (context.contactId && !dataContext.contact) {
      const contact = await database_default.contact.findUnique({
        where: { id: context.contactId },
        include: { company: true }
      });
      if (contact) {
        dataContext.contact = contact;
        dataContext.company = contact.company || dataContext.company;
      }
    }
    return {
      subject: this.interpolate(template.subject, dataContext),
      body: this.interpolate(template.body, dataContext)
    };
  }
  static interpolate(text, context) {
    return text.replace(/\{\{(.*?)\}\}/g, (match, path) => {
      const parts = path.trim().split(".");
      let value = context;
      for (const part of parts) {
        if (value && typeof value === "object" && part in value) {
          value = value[part];
        } else {
          value = void 0;
          break;
        }
      }
      return value !== void 0 && value !== null ? String(value) : match;
    });
  }
  static async incrementUsage(id) {
    return await database_default.emailTemplate.update({
      where: { id },
      data: { usageCount: { increment: 1 } }
    });
  }
};

// src/modules/emailTemplates/emailTemplate.controller.ts
var EmailTemplateController = class {
  static listTemplates = async (req, res) => {
    const templates = await EmailTemplateService.listTemplates(req.user.tenantId);
    return success(res, templates, "Email templates fetched successfully");
  };
  static createTemplate = async (req, res) => {
    const template = await EmailTemplateService.createTemplate(req.user.tenantId, req.user.id, req.body);
    return success(res, template, "Email template created successfully");
  };
  static getTemplate = async (req, res) => {
    const template = await EmailTemplateService.getTemplate(req.user.tenantId, req.params.id);
    return success(res, template, "Email template fetched successfully");
  };
  static updateTemplate = async (req, res) => {
    const template = await EmailTemplateService.updateTemplate(req.user.tenantId, req.params.id, req.body);
    return success(res, template, "Email template updated successfully");
  };
  static deleteTemplate = async (req, res) => {
    await EmailTemplateService.deleteTemplate(req.user.tenantId, req.params.id);
    return success(res, null, "Email template deleted successfully");
  };
  static previewTemplate = async (req, res) => {
    const preview = await EmailTemplateService.previewTemplate(
      req.user.tenantId,
      req.params.id,
      req.body,
      req.user.id
    );
    return success(res, preview, "Template preview generated successfully");
  };
};

// src/modules/emailTemplates/emailTemplate.routes.ts
var router16 = Router16();
router16.use(authGuard_default);
router16.get("/", asyncHandler_default(EmailTemplateController.listTemplates));
router16.post("/", asyncHandler_default(EmailTemplateController.createTemplate));
router16.get("/:id", asyncHandler_default(EmailTemplateController.getTemplate));
router16.patch("/:id", asyncHandler_default(EmailTemplateController.updateTemplate));
router16.delete("/:id", asyncHandler_default(EmailTemplateController.deleteTemplate));
router16.post("/:id/preview", asyncHandler_default(EmailTemplateController.previewTemplate));
var emailTemplate_routes_default = router16;

// src/modules/campaigns/campaign.routes.ts
import { Router as Router17 } from "express";

// src/modules/campaigns/campaign.service.ts
var CampaignService = class {
  static async listCampaigns(tenantId, filters) {
    const { search, platform, status, page = 1, limit = 10 } = filters;
    const limitNum = Number(limit);
    const pageNum = Number(page);
    const skip = (pageNum - 1) * limitNum;
    const where = {
      tenantId,
      deletedAt: null,
      ...search ? { name: { contains: search, mode: "insensitive" } } : {},
      ...platform ? { platform } : {},
      ...status ? { status } : {}
    };
    const [rawCampaigns, total] = await Promise.all([
      database_default.campaign.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { leads: true }
          },
          leads: {
            where: { isConverted: true },
            select: { id: true }
          }
        }
      }),
      database_default.campaign.count({ where })
    ]);
    const campaigns = rawCampaigns.map((campaign) => {
      const leadsCount = campaign._count.leads;
      const convertedCount = campaign.leads.length;
      const budget = Number(campaign.budget);
      const costPerLead = leadsCount > 0 ? budget / leadsCount : 0;
      const conversionRate = leadsCount > 0 ? convertedCount / leadsCount * 100 : 0;
      const { leads, ...rest } = campaign;
      return {
        ...rest,
        leadsCount,
        costPerLead,
        conversionRate
      };
    });
    return {
      data: campaigns,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  static async getCampaign(tenantId, id) {
    const campaign = await database_default.campaign.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        _count: {
          select: { leads: true }
        },
        leads: {
          where: { isConverted: true },
          select: { id: true }
        }
      }
    });
    if (!campaign) {
      throw { status: 404, message: "Campaign not found" };
    }
    const leadsCount = campaign._count.leads;
    const convertedCount = campaign.leads.length;
    const budget = Number(campaign.budget);
    const costPerLead = leadsCount > 0 ? budget / leadsCount : 0;
    const conversionRate = leadsCount > 0 ? convertedCount / leadsCount * 100 : 0;
    const { leads, ...rest } = campaign;
    return {
      ...rest,
      leadsCount,
      costPerLead,
      conversionRate
    };
  }
  static async createCampaign(tenantId, data) {
    return await database_default.campaign.create({
      data: {
        ...data,
        tenantId
      }
    });
  }
  static async updateCampaign(tenantId, id, data) {
    const campaign = await database_default.campaign.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    if (!campaign) {
      throw { status: 404, message: "Campaign not found" };
    }
    return await database_default.campaign.update({
      where: { id },
      data
    });
  }
  static async deleteCampaign(tenantId, id) {
    const campaign = await database_default.campaign.findFirst({
      where: { id, tenantId, deletedAt: null }
    });
    if (!campaign) {
      throw { status: 404, message: "Campaign not found" };
    }
    return await database_default.campaign.update({
      where: { id },
      data: { deletedAt: /* @__PURE__ */ new Date() }
    });
  }
};

// src/modules/campaigns/campaign.controller.ts
var CampaignController = class {
  static list = async (req, res) => {
    const result = await CampaignService.listCampaigns(req.user.tenantId, req.query);
    return success(res, result, "Campaigns fetched successfully");
  };
  static get = async (req, res) => {
    const campaign = await CampaignService.getCampaign(req.user.tenantId, req.params.id);
    return success(res, campaign, "Campaign details fetched successfully");
  };
  static create = async (req, res) => {
    const campaign = await CampaignService.createCampaign(req.user.tenantId, req.body);
    return success(res, campaign, "Campaign created successfully", 201);
  };
  static update = async (req, res) => {
    const campaign = await CampaignService.updateCampaign(req.user.tenantId, req.params.id, req.body);
    return success(res, campaign, "Campaign updated successfully");
  };
  static delete = async (req, res) => {
    await CampaignService.deleteCampaign(req.user.tenantId, req.params.id);
    return success(res, null, "Campaign deleted successfully");
  };
};

// src/modules/campaigns/campaign.schemas.ts
import { z as z15 } from "zod";
var createCampaignSchema = z15.object({
  body: z15.object({
    name: z15.string().min(1, "Name is required"),
    platform: z15.string().min(1, "Platform is required"),
    budget: z15.number().min(0, "Budget must be positive or zero"),
    status: z15.enum(["draft", "active", "paused", "completed"]).optional(),
    startDate: z15.string().datetime().or(z15.string().nullable()).optional(),
    endDate: z15.string().datetime().or(z15.string().nullable()).optional()
  })
});
var updateCampaignSchema = createCampaignSchema.partial();
var campaignFilterSchema = z15.object({
  query: z15.object({
    search: z15.string().optional(),
    platform: z15.string().optional(),
    status: z15.string().optional(),
    page: z15.string().optional().transform((val) => val ? Number(val) : void 0),
    limit: z15.string().optional().transform((val) => val ? Number(val) : void 0)
  })
});

// src/modules/campaigns/campaign.routes.ts
var router17 = Router17();
router17.use(authGuard_default);
router17.get("/", validate_default(campaignFilterSchema), asyncHandler_default(CampaignController.list));
router17.post("/", validate_default(createCampaignSchema), asyncHandler_default(CampaignController.create));
router17.get("/:id", asyncHandler_default(CampaignController.get));
router17.patch("/:id", validate_default(updateCampaignSchema), asyncHandler_default(CampaignController.update));
router17.delete("/:id", asyncHandler_default(CampaignController.delete));
var campaign_routes_default = router17;

// src/modules/sla/sla.routes.ts
import { Router as Router18 } from "express";

// src/modules/sla/sla.service.ts
var SLAService = class {
  /**
   * Get SLA config for a tenant
   */
  static async getConfig(tenantId) {
    const tenant = await database_default.tenant.findUnique({ where: { id: tenantId } });
    const settings = tenant?.settings || {};
    return settings.slaConfig || { thresholdHours: 24, fallbackStrategy: "roundRobin" };
  }
  /**
   * Update SLA config for a tenant
   */
  static async updateConfig(tenantId, config) {
    const tenant = await database_default.tenant.findUnique({ where: { id: tenantId } });
    const settings = tenant?.settings || {};
    const current = settings.slaConfig || { thresholdHours: 24, fallbackStrategy: "roundRobin" };
    return await database_default.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          slaConfig: { ...current, ...config }
        }
      }
    });
  }
  /**
   * Check all leads for SLA breaches and auto-reassign if needed.
   * Definition of "untouched": no logged interaction (call, email, WhatsApp, note, stage change)
   * in the configured threshold period. Simply viewing a lead does NOT count as touched.
   *
   * This should be called by a cron/scheduled job.
   */
  static async checkAndReassign(tenantId) {
    const config = await this.getConfig(tenantId);
    const thresholdDate = new Date(Date.now() - config.thresholdHours * 60 * 60 * 1e3);
    const systemUser = await this.getSystemUser(tenantId);
    const staleLeads = await database_default.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isConverted: false,
        assignedToId: { not: null },
        lastActivityAt: { lt: thresholdDate }
      },
      select: {
        id: true,
        title: true,
        assignedToId: true,
        lastActivityAt: true,
        stageId: true
      },
      take: 50
    });
    if (staleLeads.length === 0) return { reassigned: 0, total: 0 };
    const activeReps = await database_default.user.findMany({
      where: {
        tenantId,
        status: "active",
        role: { in: ["salesRep", "salesManager"] }
      },
      select: { id: true, firstName: true, lastName: true }
    });
    if (activeReps.length === 0) return { reassigned: 0, total: staleLeads.length };
    let reassignedCount = 0;
    for (let i = 0; i < staleLeads.length; i++) {
      const lead = staleLeads[i];
      const recentActivity = await database_default.activityLog.count({
        where: {
          tenantId,
          leadId: lead.id,
          createdAt: { gte: thresholdDate }
        }
      });
      if (recentActivity > 0) continue;
      const candidatePool = activeReps.filter((r) => r.id !== lead.assignedToId);
      if (candidatePool.length === 0) continue;
      const newAssignee = candidatePool[i % candidatePool.length];
      await database_default.$transaction(async (tx) => {
        await tx.lead.update({
          where: { id: lead.id },
          data: {
            assignedToId: newAssignee.id,
            lastActivityAt: /* @__PURE__ */ new Date()
          }
        });
        await tx.activityLog.create({
          data: {
            tenantId,
            userId: systemUser?.id || newAssignee.id,
            entityId: lead.id,
            entityType: "lead",
            leadId: lead.id,
            action: "auto_reassigned",
            metadata: {
              fromUserId: lead.assignedToId,
              toUserId: newAssignee.id,
              reason: "SLA_breach",
              thresholdHours: config.thresholdHours,
              lastActivityAt: lead.lastActivityAt,
              message: `Auto-reassigned from previous owner \u2014 ${config.thresholdHours}h SLA breach`
            }
          }
        });
      });
      reassignedCount++;
    }
    return { reassigned: reassignedCount, total: staleLeads.length };
  }
  /**
   * Get the count of leads currently at risk of SLA breach
   */
  static async getAtRiskCount(tenantId) {
    const config = await this.getConfig(tenantId);
    const thresholdDate = new Date(Date.now() - config.thresholdHours * 60 * 60 * 1e3);
    return await database_default.lead.count({
      where: {
        tenantId,
        deletedAt: null,
        isConverted: false,
        assignedToId: { not: null },
        lastActivityAt: { lt: thresholdDate }
      }
    });
  }
  /**
   * Grace period config endpoint: returns the configured threshold for display
   */
  static async getThreshold(tenantId) {
    const config = await this.getConfig(tenantId);
    return { thresholdHours: config.thresholdHours, fallbackStrategy: config.fallbackStrategy };
  }
  static async getSystemUser(tenantId) {
    const system = await database_default.user.findFirst({
      where: { tenantId, role: "admin", status: "active" },
      select: { id: true, firstName: true, lastName: true }
    });
    return system;
  }
};

// src/modules/sla/sla.controller.ts
var SLAController = class {
  static getConfig = async (req, res) => {
    const config = await SLAService.getConfig(req.user.tenantId);
    return success(res, config, "SLA config fetched");
  };
  static updateConfig = async (req, res) => {
    const config = await SLAService.updateConfig(req.user.tenantId, req.body);
    return success(res, config, "SLA config updated");
  };
  static runCheck = async (req, res) => {
    const result = await SLAService.checkAndReassign(req.user.tenantId);
    return success(res, result, "SLA check complete");
  };
  static getAtRisk = async (req, res) => {
    const count = await SLAService.getAtRiskCount(req.user.tenantId);
    return success(res, { atRiskCount: count }, "At-risk count fetched");
  };
};

// src/modules/sla/sla.routes.ts
var router18 = Router18();
router18.use(authGuard_default);
router18.get("/config", asyncHandler_default(SLAController.getConfig));
router18.patch("/config", asyncHandler_default(SLAController.updateConfig));
router18.post("/check", asyncHandler_default(SLAController.runCheck));
router18.get("/at-risk", asyncHandler_default(SLAController.getAtRisk));
var sla_routes_default = router18;

// src/modules/stage-transitions/stageTransition.routes.ts
import { Router as Router19 } from "express";

// src/modules/stage-transitions/stageTransition.controller.ts
var StageTransitionController = class {
  static getPolicy = async (req, res) => {
    const policy = await StageTransitionService.getStageSkipPolicy(req.user.tenantId);
    return success(res, policy, "Stage skip policy fetched");
  };
  static updatePolicy = async (req, res) => {
    const { enabled, mode } = req.body;
    const policy = await StageTransitionService.updateStageSkipPolicy(req.user.tenantId, {
      mode: mode || "global",
      enabled: enabled ?? false
    });
    return success(res, policy, "Stage skip policy updated");
  };
  static getTransitions = async (req, res) => {
    const entityId = req.params.entityId;
    const transitions = await StageTransitionService.getTransitions(req.user.tenantId, entityId);
    return success(res, transitions, "Transitions fetched");
  };
  static validateTransition = async (req, res) => {
    const { fromStageId, toStageId } = req.body;
    const rawType = String(req.body.entityType || "lead");
    const entityType = rawType === "deal" ? "deal" : "lead";
    const result = await StageTransitionService.validateTransition(
      req.user.tenantId,
      req.user.id,
      req.user.role,
      entityType,
      fromStageId,
      toStageId
    );
    return success(res, result, "Transition validation complete");
  };
};

// src/modules/stage-transitions/stageTransition.routes.ts
var router19 = Router19();
router19.use(authGuard_default);
router19.get("/policy", asyncHandler_default(StageTransitionController.getPolicy));
router19.patch("/policy", asyncHandler_default(StageTransitionController.updatePolicy));
router19.post("/validate", asyncHandler_default(StageTransitionController.validateTransition));
router19.get("/:entityId", asyncHandler_default(StageTransitionController.getTransitions));
var stageTransition_routes_default = router19;

// src/modules/notifications/notification.routes.ts
import { Router as Router20 } from "express";

// src/modules/notifications/notification.service.ts
var NotificationService = class {
  /**
   * Create a notification for a user
   */
  static async notify(params) {
    return await database_default.notification.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        link: params.link,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        channel: params.channel || "in_app",
        metadata: params.metadata || void 0
      }
    });
  }
  /**
   * Notify multiple users at once
   */
  static async notifyMany(params, userIds) {
    const notifications = userIds.map((userId) => ({
      tenantId: params.tenantId,
      userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      channel: params.channel || "in_app",
      metadata: params.metadata || void 0
    }));
    if (notifications.length === 0) return [];
    return await database_default.notification.createMany({
      data: notifications
    });
  }
  /**
   * Get notifications for a user with pagination
   */
  static async list(tenantId, userId, filters) {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;
    const where = {
      tenantId,
      userId,
      isArchived: false
    };
    if (filters.isRead !== void 0) {
      where.isRead = filters.isRead;
    }
    if (filters.type) {
      where.type = filters.type;
    }
    const [data, total] = await Promise.all([
      database_default.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      database_default.notification.count({ where })
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  /**
   * Get unread notification count
   */
  static async getUnreadCount(tenantId, userId) {
    return await database_default.notification.count({
      where: {
        tenantId,
        userId,
        isRead: false,
        isArchived: false
      }
    });
  }
  /**
   * Mark notifications as read
   */
  static async markAsRead(tenantId, userId, ids) {
    return await database_default.notification.updateMany({
      where: {
        id: { in: ids },
        tenantId,
        userId
      },
      data: {
        isRead: true,
        readAt: /* @__PURE__ */ new Date()
      }
    });
  }
  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(tenantId, userId) {
    return await database_default.notification.updateMany({
      where: {
        tenantId,
        userId,
        isRead: false,
        isArchived: false
      },
      data: {
        isRead: true,
        readAt: /* @__PURE__ */ new Date()
      }
    });
  }
  /**
   * Archive a notification
   */
  static async archive(tenantId, userId, id) {
    return await database_default.notification.updateMany({
      where: {
        id,
        tenantId,
        userId
      },
      data: { isArchived: true }
    });
  }
  /**
   * Send SLA breach notifications
   */
  static async notifySLABreach(params) {
    const { tenantId, leadId, leadTitle, oldAssigneeId, newAssigneeId, slaThresholdHours } = params;
    await this.notify({
      tenantId,
      userId: oldAssigneeId,
      type: "auto_reassignment",
      title: "Lead reassigned due to SLA breach",
      body: `${leadTitle} was auto-reassigned after exceeding the ${slaThresholdHours}h SLA.`,
      link: `/leads?id=${leadId}`,
      entityType: "lead",
      entityId: leadId,
      channel: "both",
      metadata: { slaThresholdHours, reassignedTo: newAssigneeId }
    });
    await this.notify({
      tenantId,
      userId: newAssigneeId,
      type: "auto_reassignment",
      title: "New lead assigned to you (SLA)",
      body: `${leadTitle} has been assigned to you due to SLA auto-reassignment.`,
      link: `/leads?id=${leadId}`,
      entityType: "lead",
      entityId: leadId,
      channel: "both",
      metadata: { slaThresholdHours, reassignedFrom: oldAssigneeId }
    });
  }
  /**
   * Notify task due reminders
   */
  static async notifyTaskDue(params) {
    return await this.notify({
      tenantId: params.tenantId,
      userId: params.userId,
      type: "task_due",
      title: `Task due: ${params.taskTitle}`,
      body: `Your task "${params.taskTitle}" is due ${params.dueAt.toISOString()}.`,
      link: `/tasks?id=${params.taskId}`,
      entityType: "task",
      entityId: params.taskId,
      channel: "in_app",
      metadata: { dueAt: params.dueAt.toISOString() }
    });
  }
};

// src/modules/notifications/notification.schemas.ts
import { z as z16 } from "zod";
var notificationQuerySchema = z16.object({
  page: z16.coerce.number().optional().default(1),
  limit: z16.coerce.number().optional().default(20),
  isRead: z16.coerce.boolean().optional(),
  type: z16.string().optional()
});
var markReadSchema = z16.object({
  ids: z16.array(z16.string()).min(1, "At least one notification ID required")
});
var notificationSettingsSchema = z16.object({
  emailDigest: z16.enum(["none", "daily", "weekly"]).optional(),
  notifySlaBreach: z16.boolean().optional(),
  notifyTaskDue: z16.boolean().optional(),
  notifyDealWon: z16.boolean().optional(),
  notifyMentions: z16.boolean().optional()
});

// src/modules/notifications/notification.controller.ts
var listNotifications = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const filters = notificationQuerySchema.parse(req.query);
  const result = await NotificationService.list(tenantId, userId, filters);
  return success(res, result, "Notifications fetched");
});
var getUnreadCount = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const count = await NotificationService.getUnreadCount(tenantId, userId);
  return success(res, { count }, "Unread count fetched");
});
var markAsRead = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const { ids } = markReadSchema.parse(req.body);
  const result = await NotificationService.markAsRead(tenantId, userId, ids);
  return success(res, { count: result.count }, "Notifications marked as read");
});
var markAllAsRead = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const result = await NotificationService.markAllAsRead(tenantId, userId);
  return success(res, { count: result.count }, "All notifications marked as read");
});
var archiveNotification = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const id = req.params.id;
  await NotificationService.archive(tenantId, userId, id);
  return success(res, null, "Notification archived");
});

// src/modules/notifications/notification.routes.ts
var router20 = Router20();
router20.use(authGuard_default);
router20.use(tenantResolver_default);
router20.get("/", listNotifications);
router20.get("/unread-count", getUnreadCount);
router20.patch("/mark-read", markAsRead);
router20.patch("/mark-all-read", markAllAsRead);
router20.delete("/:id", archiveNotification);
var notification_routes_default = router20;

// src/modules/integrations/integration.routes.ts
import { Router as Router21 } from "express";

// src/modules/integrations/integration.service.ts
var IntegrationService = class {
  /**
   * Get integration config for a tenant
   */
  static async getConfig(tenantId) {
    const tenant = await database_default.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    });
    const settings = tenant?.settings || {};
    return {
      whatsapp: settings.integrations?.whatsapp || { enabled: false },
      googleCalendar: settings.integrations?.googleCalendar || { enabled: false },
      emailSync: settings.integrations?.emailSync || { enabled: false, provider: "none" }
    };
  }
  /**
   * Update integration config
   */
  static async updateConfig(tenantId, updates) {
    const tenant = await database_default.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true }
    });
    const settings = tenant?.settings || {};
    const integrations = settings.integrations || {};
    if (updates.whatsapp) {
      integrations.whatsapp = { ...integrations.whatsapp, ...updates.whatsapp };
    }
    if (updates.googleCalendar) {
      integrations.googleCalendar = { ...integrations.googleCalendar, ...updates.googleCalendar };
    }
    if (updates.emailSync) {
      integrations.emailSync = { ...integrations.emailSync, ...updates.emailSync };
    }
    await database_default.tenant.update({
      where: { id: tenantId },
      data: { settings: { ...settings, integrations } }
    });
    return integrations;
  }
  /**
   * Verify WhatsApp webhook (stub — real webhook verification would call Meta API)
   */
  static async verifyWhatsAppWebhook(tenantId, verificationToken) {
    if (verificationToken === process.env.WHATSAPP_VERIFY_TOKEN) {
      await this.updateConfig(tenantId, {
        whatsapp: { enabled: true, webhookVerified: true }
      });
      return true;
    }
    return false;
  }
  /**
   * Connect Google Calendar (stub — real flow uses OAuth2)
   */
  static async connectGoogleCalendar(tenantId, code) {
    await this.updateConfig(tenantId, {
      googleCalendar: {
        enabled: true,
        connectedEmail: "user@example.com",
        accessToken: "stub_token",
        refreshToken: "stub_refresh"
      }
    });
    return { connected: true };
  }
  /**
   * Sync WhatsApp messages for a contact
   */
  static async syncWhatsAppMessages(tenantId, contactPhone) {
    return {
      synced: true,
      messageCount: 0,
      message: "WhatsApp sync requires real Meta API credentials. Configure in Integrations settings."
    };
  }
  /**
   * Log an incoming WhatsApp message as a communication
   */
  static async logIncomingWhatsApp(params) {
    return await database_default.communication.create({
      data: {
        tenantId: params.tenantId,
        userId: params.contactId,
        // placeholder — system user in production
        contactId: params.contactId,
        leadId: params.leadId || null,
        dealId: params.dealId || null,
        type: "whatsapp",
        direction: "inbound",
        sourceType: "system",
        subject: `WhatsApp from ${params.from}`,
        body: params.body,
        summary: "Auto-logged via WhatsApp integration",
        occurredAt: /* @__PURE__ */ new Date()
      }
    });
  }
};

// src/modules/integrations/integration.controller.ts
var getIntegrations = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const config = await IntegrationService.getConfig(tenantId);
  return success(res, config, "Integration config fetched");
});
var updateIntegrations = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { whatsapp, googleCalendar, emailSync } = req.body;
  const result = await IntegrationService.updateConfig(tenantId, { whatsapp, googleCalendar, emailSync });
  return success(res, result, "Integration config updated");
});
var verifyWhatsApp = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { verificationToken } = req.body;
  const verified = await IntegrationService.verifyWhatsAppWebhook(tenantId, verificationToken);
  return success(res, { verified }, verified ? "WhatsApp webhook verified" : "Verification failed");
});
var connectCalendar = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { code } = req.body;
  const result = await IntegrationService.connectGoogleCalendar(tenantId, code);
  return success(res, result, "Calendar connected");
});
var syncWhatsApp = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { contactPhone } = req.body;
  const result = await IntegrationService.syncWhatsAppMessages(tenantId, contactPhone);
  return success(res, result, "WhatsApp sync completed");
});

// src/modules/integrations/integration.routes.ts
var router21 = Router21();
router21.use(authGuard_default);
router21.use(tenantResolver_default);
router21.get("/", getIntegrations);
router21.patch("/", updateIntegrations);
router21.post("/whatsapp/verify", verifyWhatsApp);
router21.post("/calendar/connect", connectCalendar);
router21.post("/whatsapp/sync", syncWhatsApp);
var integration_routes_default = router21;

// src/modules/billing/billing.routes.ts
import { Router as Router22 } from "express";

// src/modules/billing/billing.service.ts
var PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    interval: "monthly",
    features: {
      maxUsers: 2,
      maxLeads: 100,
      maxDeals: 50,
      maxStorage: "100 MB",
      aiFeatures: false,
      apiAccess: false,
      customFields: false,
      advancedReporting: false,
      integrations: false,
      slaManagement: false,
      prioritySupport: false
    }
  },
  {
    id: "starter",
    name: "Starter",
    price: 29,
    currency: "USD",
    interval: "monthly",
    features: {
      maxUsers: 5,
      maxLeads: 1e3,
      maxDeals: 500,
      maxStorage: "1 GB",
      aiFeatures: true,
      apiAccess: false,
      customFields: true,
      advancedReporting: false,
      integrations: true,
      slaManagement: true,
      prioritySupport: false
    }
  },
  {
    id: "growth",
    name: "Growth",
    price: 79,
    currency: "USD",
    interval: "monthly",
    features: {
      maxUsers: 25,
      maxLeads: 1e4,
      maxDeals: 5e3,
      maxStorage: "10 GB",
      aiFeatures: true,
      apiAccess: true,
      customFields: true,
      advancedReporting: true,
      integrations: true,
      slaManagement: true,
      prioritySupport: true
    }
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 249,
    currency: "USD",
    interval: "monthly",
    features: {
      maxUsers: 999,
      maxLeads: 999999,
      maxDeals: 999999,
      maxStorage: "Unlimited",
      aiFeatures: true,
      apiAccess: true,
      customFields: true,
      advancedReporting: true,
      integrations: true,
      slaManagement: true,
      prioritySupport: true
    }
  }
];
var BillingService = class {
  static getPlans() {
    return PLANS;
  }
  static getPlan(planId) {
    return PLANS.find((p) => p.id === planId);
  }
  static async getCurrentSubscription(tenantId) {
    const tenant = await database_default.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        plan: true,
        status: true,
        trialEndsAt: true,
        billingEmail: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            leads: true,
            deals: true
          }
        }
      }
    });
    if (!tenant) throw { status: 404, message: "Tenant not found" };
    const planConfig = this.getPlan(tenant.plan);
    return {
      tenantId: tenant.id,
      name: tenant.name,
      plan: tenant.plan,
      planName: planConfig?.name || "Unknown",
      status: tenant.status,
      trialEndsAt: tenant.trialEndsAt,
      billingEmail: tenant.billingEmail,
      usage: {
        users: tenant._count.users,
        leads: tenant._count.leads,
        deals: tenant._count.deals
      },
      limits: planConfig?.features || null,
      price: planConfig?.price || 0,
      currency: planConfig?.currency || "USD"
    };
  }
  static async changePlan(tenantId, newPlan) {
    const tenant = await database_default.tenant.findUnique({
      where: { id: tenantId }
    });
    if (!tenant) throw { status: 404, message: "Tenant not found" };
    const planConfig = this.getPlan(newPlan);
    if (!planConfig) throw { status: 400, message: "Invalid plan" };
    const usage = await database_default.tenant.findUnique({
      where: { id: tenantId },
      select: {
        _count: {
          select: { users: true, leads: true, deals: true }
        }
      }
    });
    if (usage) {
      if (usage._count.users > planConfig.features.maxUsers) {
        throw {
          status: 400,
          message: `Cannot downgrade: ${usage._count.users} active users exceeds ${planConfig.features.maxUsers} limit for ${planConfig.name} plan`,
          code: "USAGE_EXCEEDS_LIMIT"
        };
      }
    }
    await database_default.tenant.update({
      where: { id: tenantId },
      data: { plan: newPlan }
    });
    return { plan: newPlan, planName: planConfig.name };
  }
  static async updateBillingEmail(tenantId, billingEmail) {
    return await database_default.tenant.update({
      where: { id: tenantId },
      data: { billingEmail }
    });
  }
  static async checkUsageLimits(tenantId) {
    const tenant = await database_default.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: { select: { users: true, leads: true, deals: true } }
      }
    });
    if (!tenant) throw { status: 404, message: "Tenant not found" };
    const planConfig = this.getPlan(tenant.plan);
    if (!planConfig) return { withinLimits: true, warnings: [] };
    const warnings = [];
    if (tenant._count.users > planConfig.features.maxUsers) {
      warnings.push(`You have ${tenant._count.users} users (limit: ${planConfig.features.maxUsers})`);
    }
    if (tenant._count.leads > planConfig.features.maxLeads) {
      warnings.push(`You have ${tenant._count.leads} leads (limit: ${planConfig.features.maxLeads})`);
    }
    if (tenant._count.deals > planConfig.features.maxDeals) {
      warnings.push(`You have ${tenant._count.deals} deals (limit: ${planConfig.features.maxDeals})`);
    }
    return {
      withinLimits: warnings.length === 0,
      warnings
    };
  }
};

// src/modules/billing/billing.controller.ts
var getPlans = asyncHandler_default(async (req, res) => {
  const plans = BillingService.getPlans();
  return success(res, plans, "Plans fetched");
});
var getSubscription = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const subscription = await BillingService.getCurrentSubscription(tenantId);
  return success(res, subscription, "Subscription fetched");
});
var changePlan = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { plan } = req.body;
  if (!plan) {
    return res.status(400).json({ success: false, message: "Plan is required" });
  }
  const result = await BillingService.changePlan(tenantId, plan);
  return success(res, result, "Plan changed");
});
var updateBillingEmail = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const { email } = req.body;
  await BillingService.updateBillingEmail(tenantId, email);
  return success(res, { email }, "Billing email updated");
});
var checkUsage = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const limits = await BillingService.checkUsageLimits(tenantId);
  return success(res, limits, "Usage limits checked");
});

// src/modules/billing/billing.routes.ts
var router22 = Router22();
router22.use(authGuard_default);
router22.use(tenantResolver_default);
router22.get("/plans", getPlans);
router22.get("/subscription", getSubscription);
router22.post("/change-plan", rbacGuard_default("settings", "update"), changePlan);
router22.patch("/billing-email", updateBillingEmail);
router22.get("/usage", checkUsage);
var billing_routes_default = router22;

// src/modules/predictions/prediction.routes.ts
import { Router as Router23 } from "express";

// src/modules/predictions/prediction.service.ts
var PredictionService = class {
  /**
   * Get win probability for a specific deal using heuristic scoring
   * (In production, this would use a trained ML model)
   */
  static async predictDealWin(dealId) {
    const deal = await database_default.deal.findUnique({
      where: { id: dealId },
      include: {
        stage: true,
        tasks: { where: { deletedAt: null } },
        communications: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 10
        },
        contact: true,
        company: true
      }
    });
    if (!deal) throw { status: 404, message: "Deal not found" };
    let score = deal.probability;
    const riskFactors = [];
    const positiveIndicators = [];
    const recentComms = deal.communications.filter(
      (c) => c.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3)
    );
    if (recentComms.length >= 3) {
      score += 10;
      positiveIndicators.push("High recent engagement (3+ communications this week)");
    } else if (recentComms.length === 0) {
      score -= 15;
      riskFactors.push("No communication in the last 7 days");
    }
    if (deal.stage && deal.stage.position >= 3) {
      score += 10;
      positiveIndicators.push(`In advanced stage "${deal.stage.name}"`);
    } else if (deal.stage && deal.stage.position <= 1) {
      score -= 5;
    }
    const overdueTasks = deal.tasks.filter(
      (t) => t.status !== "completed" && t.status !== "cancelled" && t.dueAt && t.dueAt < /* @__PURE__ */ new Date()
    );
    if (overdueTasks.length > 0) {
      score -= 10;
      riskFactors.push(`${overdueTasks.length} overdue task(s) need attention`);
    }
    const outboundCount = deal.communications.filter((c) => c.direction === "outbound").length;
    const inboundCount = deal.communications.filter((c) => c.direction === "inbound").length;
    const totalComms = outboundCount + inboundCount;
    if (totalComms > 0) {
      const inboundRatio = inboundCount / totalComms;
      if (inboundRatio > 0.4) {
        score += 8;
        positiveIndicators.push("Contact is responsive (high inbound communication ratio)");
      } else if (inboundRatio < 0.1 && totalComms > 5) {
        score -= 8;
        riskFactors.push("Low contact responsiveness \u2014 mostly outbound communications");
      }
    }
    const avgDealValue = await database_default.deal.aggregate({
      where: { tenantId: deal.tenantId, status: "won" },
      _avg: { value: true }
    });
    const dealValue = Number(deal.value);
    const avgValue = avgDealValue._avg.value ? Number(avgDealValue._avg.value) : 0;
    if (avgValue > 0 && dealValue > avgValue * 1.5) {
      score -= 5;
      riskFactors.push("Deal value is significantly above average \u2014 may face budget scrutiny");
    }
    const daysInStage = Math.floor(
      (Date.now() - new Date(deal.updatedAt).getTime()) / (1e3 * 60 * 60 * 24)
    );
    if (daysInStage > 30 && deal.stage && deal.stage.position < 3) {
      score -= 10;
      riskFactors.push(`Stuck in "${deal.stage.name}" for ${daysInStage} days`);
    }
    score = Math.max(0, Math.min(100, score));
    let nextBestAction = "Continue nurturing the relationship.";
    if (recentComms.length === 0) {
      nextBestAction = "\u{1F4DE} Reach out to the contact \u2014 no communication detected this week.";
    } else if (overdueTasks.length > 0) {
      nextBestAction = `\u2705 Complete ${overdueTasks.length} overdue task(s) to keep the deal moving.`;
    } else if (deal.stage && deal.stage.position < 2) {
      nextBestAction = "\u{1F4CA} Schedule a demo or discovery call to advance the deal.";
    } else if (deal.stage && deal.stage.position >= 3) {
      nextBestAction = "\u270D\uFE0F Prepare and send a proposal to close the deal.";
    }
    let predictedCloseDate = null;
    if (deal.expectedCloseAt) {
      predictedCloseDate = deal.expectedCloseAt.toISOString();
    } else {
      const avgDaysInStage = await this.getAvgDaysInStage(deal.stageId);
      const predictedDate = /* @__PURE__ */ new Date();
      predictedDate.setDate(predictedDate.getDate() + avgDaysInStage);
      predictedCloseDate = predictedDate.toISOString();
    }
    return {
      dealId: deal.id,
      dealTitle: deal.title,
      currentStage: deal.stage?.name || "Unknown",
      winProbability: score,
      predictedCloseDate,
      nextBestAction,
      riskFactors,
      positiveIndicators
    };
  }
  /**
   * Get pipeline predictions for all open deals
   */
  static async predictPipeline(tenantId) {
    const deals = await database_default.deal.findMany({
      where: { tenantId, status: "open", deletedAt: null },
      include: { stage: true },
      orderBy: { value: "desc" }
    });
    const predictions = await Promise.all(
      deals.map((d) => this.predictDealWin(d.id))
    );
    const summary = {
      totalDeals: predictions.length,
      totalValue: deals.reduce((sum, d) => sum + Number(d.value), 0),
      weightedValue: predictions.reduce((sum, p) => {
        const deal = deals.find((d) => d.id === p.dealId);
        return sum + p.winProbability / 100 * Number(deal?.value || 0);
      }, 0),
      highConfidence: predictions.filter((p) => p.winProbability >= 70).length,
      mediumConfidence: predictions.filter((p) => p.winProbability >= 40 && p.winProbability < 70).length,
      lowConfidence: predictions.filter((p) => p.winProbability < 40).length,
      atRisk: predictions.filter((p) => p.riskFactors.length > 2).length
    };
    return { summary, predictions };
  }
  /**
   * Get next best actions for a user's deals and leads
   */
  static async getNextBestActions(tenantId, userId) {
    const userDeals = await database_default.deal.findMany({
      where: { tenantId, assignedToId: userId, status: "open", deletedAt: null },
      include: { stage: true },
      orderBy: { value: "desc" },
      take: 10
    });
    const userLeads = await database_default.lead.findMany({
      where: { tenantId, assignedToId: userId, isConverted: false, deletedAt: null },
      include: { stage: true },
      orderBy: { lastActivityAt: "asc" },
      take: 10
    });
    const dealActions = userDeals.map((d) => ({
      type: "deal",
      entityId: d.id,
      title: d.title,
      stage: d.stage?.name || "Unknown",
      action: this.getDealNextAction(d),
      priority: this.calculatePriority(Number(d.value), d.stage?.position || 0)
    }));
    const leadActions = userLeads.map((l) => ({
      type: "lead",
      entityId: l.id,
      title: l.title,
      stage: l.stage?.name || "Unknown",
      action: this.getLeadNextAction(l),
      priority: this.calculatePriority(Number(l.estimatedValue || 0), l.stage?.position || 0)
    }));
    return [...dealActions, ...leadActions].sort((a, b) => b.priority - a.priority).slice(0, 10);
  }
  static getDealNextAction(deal) {
    if (!deal.lastActivityAt || new Date(deal.lastActivityAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3)) {
      return "\u{1F4DE} Re-engage \u2014 no activity in over a week";
    }
    if (deal.stage?.position === 0) {
      return "\u{1F50D} Qualify the deal by scheduling a discovery call";
    }
    if (deal.stage?.position === 1) {
      return "\u{1F4CA} Present product demo and gather requirements";
    }
    if (deal.stage?.position === 2) {
      return "\u{1F4CB} Send a tailored proposal with pricing";
    }
    if (deal.stage?.position >= 3) {
      return "\u{1F91D} Follow up on proposal and negotiate terms";
    }
    return "\u{1F4C8} Continue nurturing the relationship";
  }
  static getLeadNextAction(lead) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(lead.lastActivityAt).getTime()) / (1e3 * 60 * 60 * 24)
    );
    if (daysSinceActivity > 7) {
      return "\u{1F4DE} Stale lead \u2014 reach out within 24 hours";
    }
    if (lead.stage?.position === 0) {
      return "\u{1F4DD} Gather contact details and qualify";
    }
    if (lead.stage?.position === 1) {
      return "\u{1F4CA} Schedule discovery call or demo";
    }
    if (lead.stage?.position >= 2) {
      return "\u{1F504} Ready for conversion to deal \u2014 start the process";
    }
    return "\u{1F4C8} Continue building relationship";
  }
  static calculatePriority(value, position) {
    const valueScore = Math.min(value / 1e4, 10);
    const stageScore = position * 2;
    return valueScore + stageScore;
  }
  static async getAvgDaysInStage(stageId) {
    const stage = await database_default.pipelineStage.findUnique({
      where: { id: stageId }
    });
    if (!stage) return 14;
    const transitions = await database_default.stageTransition.findMany({
      where: { toStageId: stageId },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    if (transitions.length === 0) return 14;
    return 14;
  }
};

// src/modules/predictions/prediction.controller.ts
var predictDeal = asyncHandler_default(async (req, res) => {
  const id = req.params.id;
  const prediction = await PredictionService.predictDealWin(id);
  return success(res, prediction, "Deal prediction generated");
});
var predictPipeline = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const prediction = await PredictionService.predictPipeline(tenantId);
  return success(res, prediction, "Pipeline prediction generated");
});
var getActions = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const actions = await PredictionService.getNextBestActions(tenantId, userId);
  return success(res, actions, "Next best actions fetched");
});

// src/modules/predictions/prediction.routes.ts
var router23 = Router23();
router23.use(authGuard_default);
router23.use(tenantResolver_default);
router23.get("/pipeline", predictPipeline);
router23.get("/actions", getActions);
router23.get("/deal/:id", predictDeal);
var prediction_routes_default = router23;

// src/modules/gamification/gamification.routes.ts
import { Router as Router24 } from "express";

// src/modules/gamification/gamification.service.ts
var ACHIEVEMENTS = [
  { id: "first_deal", key: "first_deal", name: "First Deal Closed", description: "Close your first deal", icon: "\u{1F3AF}", criteria: { type: "deals_won", threshold: 1 } },
  { id: "rising_star", key: "rising_star", name: "Rising Star", description: "Close 5 deals", icon: "\u{1F31F}", criteria: { type: "deals_won", threshold: 5 } },
  { id: "deal_machine", key: "deal_machine", name: "Deal Machine", description: "Close 25 deals", icon: "\u{1F3C6}", criteria: { type: "deals_won", threshold: 25 } },
  { id: "rainmaker", key: "rainmaker", name: "Rainmaker", description: "Close 100 deals", icon: "\u{1F451}", criteria: { type: "deals_won", threshold: 100 } },
  { id: "first_million", key: "first_million", name: "First Million", description: "Generate $1M in revenue", icon: "\u{1F48E}", criteria: { type: "revenue", threshold: 1e6 } },
  { id: "lead_generator", key: "lead_generator", name: "Lead Generator", description: "Create 50 leads", icon: "\u{1F4CB}", criteria: { type: "leads_created", threshold: 50 } },
  { id: "pro_communicator", key: "pro_communicator", name: "Pro Communicator", description: "Log 100 communications", icon: "\u{1F4AC}", criteria: { type: "communications", threshold: 100 } },
  { id: "streak_7", key: "streak_7", name: "Week Warrior", description: "Log activity 7 days in a row", icon: "\u{1F525}", criteria: { type: "streak", threshold: 7 } },
  { id: "streak_30", key: "streak_30", name: "Monthly Master", description: "Log activity 30 days in a row", icon: "\u26A1", criteria: { type: "streak", threshold: 30 } },
  { id: "speedy_closer", key: "speedy_closer", name: "Speedy Closer", description: "Close a deal within 7 days of creation", icon: "\u23F1\uFE0F", criteria: { type: "fast_close", threshold: 1 } },
  { id: "team_player", key: "team_player", name: "Team Player", description: "Complete 50 tasks", icon: "\u{1F91D}", criteria: { type: "tasks_completed", threshold: 50 } },
  { id: "sla_hero", key: "sla_hero", name: "SLA Hero", description: "Respond to all leads within 24 hours for 30 days", icon: "\u{1F9B8}", criteria: { type: "sla_responded", threshold: 30 } }
];
var GamificationService = class {
  static getAchievements() {
    return ACHIEVEMENTS;
  }
  /**
   * Get user's earned achievements with progress
   */
  static async getUserAchievements(tenantId, userId) {
    const user = await database_default.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            communications: true,
            assignedTasks: { where: { status: "completed" } },
            createdLeads: true
          }
        },
        assignedDeals: {
          where: { status: "won" },
          select: { value: true, createdAt: true, closedAt: true }
        }
      }
    });
    if (!user) return { earned: [], available: [] };
    const dealsWon = user.assignedDeals.length;
    const revenue = user.assignedDeals.reduce((sum, d) => sum + Number(d.value), 0);
    const leadsCreated = user._count.createdLeads;
    const comms = user._count.communications;
    const tasksCompleted = user._count.assignedTasks;
    const fastCloses = user.assignedDeals.filter((d) => {
      if (!d.closedAt) return false;
      const days = (d.closedAt.getTime() - d.createdAt.getTime()) / (1e3 * 60 * 60 * 24);
      return days <= 7;
    }).length;
    const last30Days = await database_default.activityLog.count({
      where: {
        userId,
        tenantId,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3) }
      }
    });
    const earnedAchievements = ACHIEVEMENTS.filter((a) => {
      switch (a.criteria.type) {
        case "deals_won":
          return dealsWon >= a.criteria.threshold;
        case "revenue":
          return revenue >= a.criteria.threshold;
        case "leads_created":
          return leadsCreated >= a.criteria.threshold;
        case "communications":
          return comms >= a.criteria.threshold;
        case "tasks_completed":
          return tasksCompleted >= a.criteria.threshold;
        case "fast_close":
          return fastCloses >= a.criteria.threshold;
        case "streak":
          return last30Days >= a.criteria.threshold;
        case "sla_responded":
          return last30Days >= a.criteria.threshold;
        // proxy
        default:
          return false;
      }
    });
    const availableAchievements = ACHIEVEMENTS.filter((a) => !earnedAchievements.find((e) => e.id === a.id));
    const progress = ACHIEVEMENTS.map((a) => {
      let current = 0;
      switch (a.criteria.type) {
        case "deals_won":
          current = dealsWon;
          break;
        case "revenue":
          current = revenue;
          break;
        case "leads_created":
          current = leadsCreated;
          break;
        case "communications":
          current = comms;
          break;
        case "tasks_completed":
          current = tasksCompleted;
          break;
        case "fast_close":
          current = fastCloses;
          break;
        case "streak":
          current = last30Days;
          break;
        case "sla_responded":
          current = last30Days;
          break;
      }
      return { ...a, current, target: a.criteria.threshold, earned: current >= a.criteria.threshold };
    });
    return { earned: earnedAchievements, available: availableAchievements, progress };
  }
  /**
   * Get team leaderboard
   */
  static async getLeaderboard(tenantId) {
    const users = await database_default.user.findMany({
      where: { tenantId, status: "active" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        _count: {
          select: {
            assignedDeals: { where: { status: "won" } },
            communications: true,
            assignedTasks: { where: { status: "completed" } }
          }
        },
        assignedDeals: {
          where: { status: "won" },
          select: { value: true }
        }
      }
    });
    const leaderboard = users.map((u) => {
      const revenue = u.assignedDeals.reduce((sum, d) => sum + Number(d.value), 0);
      const dealsWon = u._count.assignedDeals;
      const comms = u._count.communications;
      const tasksDone = u._count.assignedTasks;
      const score = dealsWon * 100 + revenue / 1e3 + comms * 2 + tasksDone * 5;
      return {
        userId: u.id,
        name: `${u.firstName} ${u.lastName}`,
        avatarUrl: u.avatarUrl,
        score: Math.round(score),
        dealsWon,
        revenue,
        communications: comms,
        tasksCompleted: tasksDone
      };
    }).sort((a, b) => b.score - a.score).map((u, i) => ({ ...u, rank: i + 1 }));
    return leaderboard;
  }
  /**
   * Check and award new achievements
   */
  static async checkAchievements(tenantId, userId) {
    const result = await this.getUserAchievements(tenantId, userId);
    return result.earned;
  }
  /**
   * Get streak info
   */
  static async getStreak(tenantId, userId) {
    const recentActivity = await database_default.activityLog.findMany({
      where: {
        userId,
        tenantId,
        createdAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1e3) }
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true }
    });
    let streak = 0;
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const hasActivity = recentActivity.some((a) => {
        const actDay = new Date(a.createdAt);
        actDay.setHours(0, 0, 0, 0);
        return actDay.getTime() === day.getTime();
      });
      if (hasActivity) {
        streak++;
      } else if (i === 0) {
        break;
      } else {
        break;
      }
    }
    let longestStreak = streak;
    let currentRun = 0;
    for (let i = 0; i < 60; i++) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const hasActivity = recentActivity.some((a) => {
        const actDay = new Date(a.createdAt);
        actDay.setHours(0, 0, 0, 0);
        return actDay.getTime() === day.getTime();
      });
      if (hasActivity) {
        currentRun++;
        longestStreak = Math.max(longestStreak, currentRun);
      } else {
        currentRun = 0;
      }
    }
    return { currentStreak: streak, longestStreak, hasActivityToday: streak > 0 };
  }
};

// src/modules/gamification/gamification.controller.ts
var getMyAchievements = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const achievements = await GamificationService.getUserAchievements(tenantId, userId);
  return success(res, achievements, "Achievements fetched");
});
var getLeaderboard = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const leaderboard = await GamificationService.getLeaderboard(tenantId);
  return success(res, leaderboard, "Leaderboard fetched");
});
var getStreak = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const streak = await GamificationService.getStreak(tenantId, userId);
  return success(res, streak, "Streak fetched");
});
var getAchievementDefs = asyncHandler_default(async (req, res) => {
  const achievements = GamificationService.getAchievements();
  return success(res, achievements, "Achievement definitions fetched");
});

// src/modules/gamification/gamification.routes.ts
var router24 = Router24();
router24.use(authGuard_default);
router24.use(tenantResolver_default);
router24.get("/achievements", getMyAchievements);
router24.get("/achievements/definitions", getAchievementDefs);
router24.get("/leaderboard", getLeaderboard);
router24.get("/streak", getStreak);
var gamification_routes_default = router24;

// src/modules/comments/comment.routes.ts
import { Router as Router25 } from "express";

// src/modules/comments/comment.service.ts
var CommentService = class {
  /**
   * Add a comment to an entity
   */
  static async addComment(params) {
    const comment = await database_default.activityLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
        action: "comment",
        newValue: { body: params.body, mentions: params.mentions || [] },
        metadata: { isComment: true, mentions: params.mentions || [] }
      }
    });
    if (params.mentions && params.mentions.length > 0) {
      const mentionedUsers = await database_default.user.findMany({
        where: {
          id: { in: params.mentions },
          tenantId: params.tenantId,
          status: "active"
        },
        select: { id: true }
      });
      const commentingUser = await database_default.user.findUnique({
        where: { id: params.userId },
        select: { firstName: true, lastName: true }
      });
      const notifications = mentionedUsers.map((u) => ({
        tenantId: params.tenantId,
        userId: u.id,
        type: "mention",
        title: `${commentingUser?.firstName || "Someone"} mentioned you`,
        body: params.body.length > 100 ? params.body.substring(0, 100) + "..." : params.body,
        link: `/${params.entityType}s?id=${params.entityId}`,
        entityType: params.entityType,
        entityId: params.entityId,
        channel: "in_app",
        metadata: { commentId: comment.id, mentionerId: params.userId }
      }));
      if (notifications.length > 0) {
        await database_default.notification.createMany({ data: notifications });
      }
    }
    return comment;
  }
  /**
   * Get comments for an entity
   */
  static async getComments(tenantId, entityType, entityId) {
    const comments = await database_default.activityLog.findMany({
      where: {
        tenantId,
        entityType,
        entityId,
        action: "comment"
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true }
        }
      }
    });
    return comments.map((c) => ({
      id: c.id,
      body: c.newValue?.body || "",
      mentions: c.newValue?.mentions || [],
      user: c.user,
      createdAt: c.createdAt
    }));
  }
};

// src/modules/comments/comment.controller.ts
var addComment = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const userId = req.user.id;
  const { entityType, entityId, body, mentions } = req.body;
  if (!entityType || !entityId || !body) {
    return res.status(400).json({ success: false, message: "entityType, entityId, and body are required" });
  }
  const comment = await CommentService.addComment({ tenantId, userId, entityType, entityId, body, mentions });
  return success(res, comment, "Comment added");
});
var getComments = asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const entityType = req.params.entityType;
  const entityId = req.params.entityId;
  const comments = await CommentService.getComments(tenantId, entityType, entityId);
  return success(res, comments, "Comments fetched");
});

// src/modules/comments/comment.routes.ts
var router25 = Router25();
router25.use(authGuard_default);
router25.use(tenantResolver_default);
router25.post("/", addComment);
router25.get("/:entityType/:entityId", getComments);
var comment_routes_default = router25;

// src/modules/digests/digest.routes.ts
import { Router as Router26 } from "express";

// src/modules/digests/digest.service.ts
var DigestService = class {
  /**
   * Generate monthly lost-leads digest for all active users
   */
  static async generateMonthlyLostLeadsDigest() {
    const now = /* @__PURE__ */ new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const tenants = await database_default.tenant.findMany({
      where: { status: "active" },
      select: { id: true }
    });
    for (const tenant of tenants) {
      try {
        await this.generateTenantLostLeadsDigest(tenant.id, firstOfLastMonth, firstOfMonth);
      } catch (err) {
        console.error(`[Digest] Failed for tenant ${tenant.id}:`, err);
      }
    }
  }
  /**
   * Generate lost-leads digest for a single tenant
   */
  static async generateTenantLostLeadsDigest(tenantId, startDate, endDate) {
    const lostDealIds = await database_default.deal.findMany({
      where: { tenantId, status: "lost" },
      select: { sourceLeadId: true }
    });
    const convertedLostLeadIds = lostDealIds.map((d) => d.sourceLeadId).filter((id) => id !== null);
    const finalStageIds = await database_default.pipelineStage.findMany({
      where: { tenantId, isFinal: true, type: "lead" },
      select: { id: true }
    });
    const finalStageIdSet = new Set(finalStageIds.map((s) => s.id));
    const allLeads = await database_default.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { id: { in: convertedLostLeadIds } },
          { stageId: { in: Array.from(finalStageIdSet) } }
        ]
      },
      include: {
        stage: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { firstName: true, lastName: true, email: true, phone: true } }
      }
    });
    if (allLeads.length === 0) return;
    const activeUsers = await database_default.user.findMany({
      where: {
        tenantId,
        status: "active",
        OR: [
          { role: "salesRep" },
          { role: "salesManager" },
          { role: "admin" }
        ]
      },
      select: { id: true }
    });
    if (activeUsers.length === 0) return;
    const summary = allLeads.map((l) => ({
      title: l.title,
      contact: l.contact ? `${l.contact.firstName} ${l.contact.lastName || ""}` : "Unknown",
      email: l.contact?.email || null,
      phone: l.contact?.phone || null,
      stage: l.stage?.name || "Unknown",
      assignedTo: l.assignedTo ? `${l.assignedTo.firstName} ${l.assignedTo.lastName}` : "Unassigned",
      lostDate: l.updatedAt.toISOString()
    }));
    const body = `Monthly Lost Leads Digest (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()})

${allLeads.length} lead(s) were marked as lost.

` + summary.map((s) => `\u2022 ${s.title} (${s.contact}) \u2014 ${s.stage} \u2014 ${s.assignedTo}`).join("\n") + "\n\nReview these for possible re-engagement.";
    for (const user of activeUsers) {
      await NotificationService.notify({
        tenantId,
        userId: user.id,
        type: "digest",
        title: `\u{1F4CA} Monthly Lost Leads Digest \u2014 ${allLeads.length} leads lost`,
        body,
        link: "/reports",
        entityType: "lead",
        metadata: { digestType: "monthly_lost_leads", count: allLeads.length, summary }
      });
    }
    console.log(`[Digest] Lost leads digest sent to ${activeUsers.length} users in tenant ${tenantId}: ${allLeads.length} leads`);
    return { tenantId, lostLeadsCount: allLeads.length, notifiedUsers: activeUsers.length };
  }
  /**
   * Generate weekly activity digest
   */
  static async generateWeeklyDigest() {
    const now = /* @__PURE__ */ new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
    const tenants = await database_default.tenant.findMany({
      where: { status: "active" },
      select: { id: true }
    });
    for (const tenant of tenants) {
      try {
        await this.generateTenantWeeklyDigest(tenant.id, sevenDaysAgo, now);
      } catch (err) {
        console.error(`[Digest] Weekly digest failed for tenant ${tenant.id}:`, err);
      }
    }
  }
  static async generateTenantWeeklyDigest(tenantId, startDate, endDate) {
    const activeUsers = await database_default.user.findMany({
      where: {
        tenantId,
        status: "active",
        role: { in: ["salesRep", "salesManager", "admin"] }
      },
      select: { id: true, firstName: true, lastName: true }
    });
    for (const user of activeUsers) {
      const [dealsWon, leadsCreated, tasksCompleted, commsLogged] = await Promise.all([
        database_default.deal.count({ where: { tenantId, assignedToId: user.id, status: "won", closedAt: { gte: startDate } } }),
        database_default.lead.count({ where: { tenantId, createdById: user.id, createdAt: { gte: startDate } } }),
        database_default.task.count({ where: { tenantId, assignedToId: user.id, status: "completed", completedAt: { gte: startDate } } }),
        database_default.communication.count({ where: { tenantId, userId: user.id, createdAt: { gte: startDate } } })
      ]);
      const body = `\u{1F4C8} Your Weekly Activity Digest

Period: ${startDate.toLocaleDateString()} \u2014 ${endDate.toLocaleDateString()}

\u2705 Deals Won: ${dealsWon}
\u{1F4CB} Leads Created: ${leadsCreated}
\u{1F4DD} Tasks Completed: ${tasksCompleted}
\u{1F4AC} Communications Logged: ${commsLogged}

Keep up the great work! \u{1F680}`;
      await NotificationService.notify({
        tenantId,
        userId: user.id,
        type: "digest",
        title: `\u{1F4C8} Your Weekly Activity Summary`,
        body,
        link: "/reports",
        metadata: {
          digestType: "weekly",
          stats: { dealsWon, leadsCreated, tasksCompleted, commsLogged }
        }
      });
    }
  }
};

// src/modules/digests/digest.routes.ts
var router26 = Router26();
router26.use(authGuard_default);
router26.use(tenantResolver_default);
router26.post("/lost-leads", rbacGuard_default("reports", "read"), asyncHandler_default(async (req, res) => {
  const tenantId = req.user.tenantId;
  const now = /* @__PURE__ */ new Date();
  const startOfMonth2 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfMonth2 = new Date(now.getFullYear(), now.getMonth(), 1);
  const result = await DigestService.generateTenantLostLeadsDigest(tenantId, startOfMonth2, endOfMonth2);
  return success(res, result || { notified: false, reason: "No lost leads found" }, "Lost leads digest generated");
}));
var digest_routes_default = router26;

// src/express-app.ts
var app = express();
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
var allowedOrigins = [env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174"];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    const isAllowed = allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.startsWith("http://localhost:");
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));
app.use(requestLogger_default);
app.get("/health", (req, res) => {
  return success(res, { status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() }, "System is healthy");
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swagger_default));
app.use("/api/auth", auth_routes_default);
app.use("/auth", auth_routes_default);
app.use("/api/rbac", rbac_routes_default);
app.use("/rbac", rbac_routes_default);
app.use("/api/tenants", tenant_routes_default);
app.use("/tenants", tenant_routes_default);
app.use("/api/pipeline-stages", stage_routes_default);
app.use("/pipeline-stages", stage_routes_default);
app.use("/api/companies", company_routes_default);
app.use("/companies", company_routes_default);
app.use("/api/contacts", contact_routes_default);
app.use("/contacts", contact_routes_default);
app.use("/api/leads", lead_routes_default);
app.use("/leads", lead_routes_default);
app.use("/api/deals", deal_routes_default);
app.use("/deals", deal_routes_default);
app.use("/api/tasks", task_routes_default);
app.use("/tasks", task_routes_default);
app.use("/api/communications", communication_routes_default);
app.use("/communications", communication_routes_default);
app.use("/api/products", product_routes_default);
app.use("/products", product_routes_default);
app.use("/api/activities", activity_routes_default);
app.use("/activities", activity_routes_default);
app.use("/api/proposals", router13);
app.use("/proposals", router13);
app.use("/api/public/proposals", publicRouter);
app.use("/public/proposals", publicRouter);
app.use("/api/analytics", analytics_routes_default);
app.use("/analytics", analytics_routes_default);
app.use("/api/lead-scoring", leadScoring_routes_default);
app.use("/lead-scoring", leadScoring_routes_default);
app.use("/api/email-templates", emailTemplate_routes_default);
app.use("/email-templates", emailTemplate_routes_default);
app.use("/api/campaigns", campaign_routes_default);
app.use("/campaigns", campaign_routes_default);
app.use("/api/stage-transitions", stageTransition_routes_default);
app.use("/stage-transitions", stageTransition_routes_default);
app.use("/api/sla", sla_routes_default);
app.use("/sla", sla_routes_default);
app.use("/api/notifications", notification_routes_default);
app.use("/notifications", notification_routes_default);
app.use("/api/integrations", integration_routes_default);
app.use("/integrations", integration_routes_default);
app.use("/api/billing", billing_routes_default);
app.use("/billing", billing_routes_default);
app.use("/api/predictions", prediction_routes_default);
app.use("/predictions", prediction_routes_default);
app.use("/api/gamification", gamification_routes_default);
app.use("/gamification", gamification_routes_default);
app.use("/api/comments", comment_routes_default);
app.use("/comments", comment_routes_default);
app.use("/api/digests", digest_routes_default);
app.use("/digests", digest_routes_default);
app.use(notFound_default);
app.use(errorHandler_default);
var express_app_default = app;

// src/entry.ts
var entry_default = express_app_default;
export {
  entry_default as default
};
