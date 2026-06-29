"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var import_config2 = require("dotenv/config");

// src/app.ts
var import_express17 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_helmet = __toESM(require("helmet"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);

// src/middleware/requestLogger.ts
var import_morgan = __toESM(require("morgan"), 1);

// src/config/env.ts
var import_zod = require("zod");
var import_config = require("dotenv/config");
var envSchema = import_zod.z.object({
  PORT: import_zod.z.string().transform(Number).default(4e3),
  NODE_ENV: import_zod.z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: import_zod.z.string().url(),
  JWT_SECRET: import_zod.z.string().min(1),
  JWT_REFRESH_SECRET: import_zod.z.string().min(1),
  JWT_EXPIRES_IN: import_zod.z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: import_zod.z.string().default("7d"),
  FRONTEND_URL: import_zod.z.string().url()
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
var requestLogger = (0, import_morgan.default)(env.NODE_ENV === "development" ? "dev" : "combined");
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

// src/app.ts
var import_swagger_ui_express = __toESM(require("swagger-ui-express"), 1);

// src/config/swagger.ts
var import_swagger_jsdoc = __toESM(require("swagger-jsdoc"), 1);

// package.json
var package_default = {
  name: "backend",
  version: "1.0.0",
  description: "",
  main: "index.js",
  scripts: {
    dev: "tsx watch src/server.ts",
    build: "tsup src/index.ts --format cjs --platform node --out-dir api",
    "vercel-build": "prisma generate && npm run build",
    start: "node dist/server.js",
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
    "swagger-jsdoc": "^6.2.8",
    "swagger-ui-express": "^5.0.1",
    uuid: "^14.0.0",
    zod: "^4.4.3"
  },
  devDependencies: {
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
    esbuild: "^0.28.1",
    nodemon: "^3.1.14",
    prisma: "^7.8.0",
    "ts-node": "^10.9.2",
    "tsc-alias": "^1.8.17",
    tsup: "^8.5.1",
    tsx: "^4.21.0",
    typescript: "^5.8.2"
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
  apis: ["./src/modules/**/*.ts", "./src/app.ts"]
  // Path to the API docs
};
var swaggerSpec = (0, import_swagger_jsdoc.default)(options);
var swagger_default = swaggerSpec;

// src/middleware/notFound.ts
var notFound = (req, res, next) => {
  return error(res, `Not Found - ${req.originalUrl}`, 404, "NOT_FOUND");
};
var notFound_default = notFound;

// src/modules/auth/auth.routes.ts
var import_express = require("express");

// src/modules/auth/auth.service.ts
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);
var import_uuid = require("uuid");

// src/config/database.ts
var import_client = require("@prisma/client");
var import_adapter_pg = require("@prisma/adapter-pg");
var import_pg = __toESM(require("pg"), 1);
var prismaClientSingleton = () => {
  const pool = new import_pg.default.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new import_adapter_pg.PrismaPg(pool);
  return new import_client.PrismaClient({ adapter });
};
var prisma = globalThis.prisma ?? prismaClientSingleton();
var database_default = prisma;
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

// src/utils/jwt.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var generateAccessToken = (payload) => {
  return import_jsonwebtoken.default.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};
var generateRefreshToken = (payload) => {
  return import_jsonwebtoken.default.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN
  });
};
var verifyToken = (token, secret) => {
  try {
    return import_jsonwebtoken.default.verify(token, secret);
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
    const resources = ["leads", "deals", "contacts", "companies", "tasks", "proposals", "products", "users", "settings"];
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
    const managerPerms = allPermissions.filter((p) => p.resource !== "settings" || p.action === "read");
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
var import_date_fns = require("date-fns");
var import_client2 = require("@prisma/client");
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
async function seedDemoData() {
  console.log("\u{1F331} Starting database seed for Demo Tenant...");
  let tenant = await database_default.tenant.findUnique({
    where: { slug: "demo" }
  });
  if (tenant) {
    console.log("\u{1F331} Demo tenant found. Cleaning existing demo tenant data to ensure a fresh, seamless seed...");
    await database_default.activityLog.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.stageMigration.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.dealProduct.deleteMany({ where: { deal: { tenantId: tenant.id } } });
    await database_default.proposalItem.deleteMany({ where: { proposal: { tenantId: tenant.id } } });
    await database_default.proposal.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.task.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.communication.deleteMany({ where: { tenantId: tenant.id } });
    await database_default.lead.deleteMany({ where: { tenantId: tenant.id } });
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
      name: "DealMind Demo",
      slug: "demo",
      timezone: "UTC",
      currency: "USD",
      status: "active"
    }
  });
  const passwordHash = await import_bcryptjs.default.hash("password123", 12);
  console.log("\u{1F331} Seeding demo users...");
  const demoAdmin = await database_default.user.create({
    data: {
      tenantId: tenant.id,
      email: "demo@dealmind.com",
      firstName: "Demo",
      lastName: "User",
      role: import_client2.UserRole.admin,
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
      role: import_client2.UserRole.admin,
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
      role: import_client2.UserRole.salesManager,
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
        role: import_client2.UserRole.salesRep,
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
    { name: "Dedicated Desk", category: "Co-working", type: import_client2.ProductType.recurring, billingCycle: "monthly", price: 299, description: "Single reserved desk in shared workspace" },
    { name: "Hot Desk Monthly", category: "Co-working", type: import_client2.ProductType.recurring, billingCycle: "monthly", price: 149, description: "Access to any available desk in open seating area" },
    { name: "Private Office (4 Seats)", category: "Office Suite", type: import_client2.ProductType.recurring, billingCycle: "monthly", price: 1199, description: "Fully enclosed lockable office for team of 4" },
    { name: "Private Office (10 Seats)", category: "Office Suite", type: import_client2.ProductType.recurring, billingCycle: "monthly", price: 2499, description: "Premium lockable office suite for team of 10" },
    { name: "Enterprise Consulting Suite", category: "Consulting", type: import_client2.ProductType.oneTime, price: 4999, description: "Full space setup, branding, and dedicated IT infra consulting" },
    { name: "Meeting Room Pass (10 Hrs)", category: "Usage", type: import_client2.ProductType.usage, price: 199, description: "Pack of 10 meeting room hours usable monthly" },
    { name: "IT Infrastructure Package", category: "One-time Addon", type: import_client2.ProductType.oneTime, price: 499, description: "Dedicated static IP, custom firewall config, and high-speed port setup" }
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
        status: import_client2.ProductStatus.active,
        sku: p.name.toUpperCase().replace(/[\s-()]/g, "_"),
        currency: "USD",
        taxRate: 18
      }
    });
    products.push(prod);
  }
  console.log("\u{1F331} Seeding companies...");
  const companiesData = [
    { name: "Vortex AI Solutions", website: "https://vortexai.io", industry: "Technology", size: "11-50", revenue: 25e5, description: "Building next-generation generative AI agents for B2B enterprises." },
    { name: "Summit Global Health", website: "https://summithealth.com", industry: "Healthcare", size: "201-500", revenue: 15e6, description: "Global healthcare provider specializing in clinical systems integration." },
    { name: "Nexus Logistics Group", website: "https://nexuslogistics.com", industry: "Manufacturing", size: "51-200", revenue: 85e5, description: "Multinational supply chain and freight forwarding services." },
    { name: "Starlight Creative Labs", website: "https://starlightcreative.co", industry: "Education", size: "1-10", revenue: 45e4, description: "Creative studio delivering interactive learning content and animation." },
    { name: "Apex Wealth Capital", website: "https://apexwealth.com", industry: "Finance", size: "11-50", revenue: 62e5, description: "Boutique asset management and private equity firm." },
    { name: "Nova Foods Corp", website: "https://novafoods.com", industry: "Manufacturing", size: "500+", revenue: 42e6, description: "Pioneers in high-protein plant-based meat alternatives." },
    { name: "Pulse Media Digital", website: "https://pulsemedia.com", industry: "Technology", size: "51-200", revenue: 38e5, description: "Full stack digital marketing and programmatic advertising agency." },
    { name: "Core Infrastructure Inc", website: "https://coreinfra.net", industry: "Manufacturing", size: "201-500", revenue: 11e6, description: "Leading structural engineering firm specializing in green buildings." }
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
        description: c.description,
        createdById: demoAdmin.id,
        tags: ["demo", c.industry.toLowerCase()]
      }
    });
    companies.push(comp);
  }
  console.log("\u{1F331} Seeding contacts...");
  const contactsData = [
    { first: "Sarah", last: "Connor", email: "sconnor@vortexai.io", phone: "+1-555-0199", company: "Vortex AI Solutions", designation: "Head of Operations" },
    { first: "Marcus", last: "Vance", email: "mvance@vortexai.io", phone: "+1-555-0142", company: "Vortex AI Solutions", designation: "VP of Engineering" },
    { first: "Elena", last: "Rostova", email: "erostova@summithealth.com", phone: "+1-555-0188", company: "Summit Global Health", designation: "Chief Facilities Officer" },
    { first: "David", last: "Kim", email: "dkim@nexuslogistics.com", phone: "+1-555-0125", company: "Nexus Logistics Group", designation: "Procurement Director" },
    { first: "Chloe", last: "Bennett", email: "chloe@starlightcreative.co", phone: "+1-555-0156", company: "Starlight Creative Labs", designation: "Founder & CD" },
    { first: "Arthur", last: "Pendleton", email: "apendleton@apexwealth.com", phone: "+1-555-0177", company: "Apex Wealth Capital", designation: "Managing Partner" },
    { first: "Rebecca", last: "Nunez", email: "rnunez@novafoods.com", phone: "+1-555-0111", company: "Nova Foods Corp", designation: "Director of HR" },
    { first: "Julian", last: "Asher", email: "julian@pulsemedia.com", phone: "+1-555-0163", company: "Pulse Media Digital", designation: "CEO" },
    { first: "Rachel", last: "Green", email: "rgreen@novafoods.com", phone: "+1-555-0100", company: "Nova Foods Corp", designation: "Office Manager" },
    { first: "Liam", last: "Neeson", email: "lneeson@coreinfra.net", phone: "+1-555-0191", company: "Core Infrastructure Inc", designation: "Site Coordinator" }
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
        designation: c.designation,
        createdById: demoAdmin.id,
        tags: ["lead-contact", "decision-maker"]
      }
    });
    contacts.push(contact);
  }
  console.log("\u{1F331} Seeding leads...");
  const leadsData = [
    { title: "Expansion Space Vortex AI", value: 12e3, stage: "Qualified", contact: "Sarah Connor", source: import_client2.LeadSource.webForm, priority: import_client2.LeadPriority.high },
    { title: "Summit Health Remote Offices", value: 25e3, stage: "Contacted", contact: "Elena Rostova", source: import_client2.LeadSource.referral, priority: import_client2.LeadPriority.medium },
    { title: "Nexus Logistics Hub Office", value: 8e3, stage: "New", contact: "David Kim", source: import_client2.LeadSource.coldOutreach, priority: import_client2.LeadPriority.low },
    { title: "Starlight Creative Co-working", value: 1500, stage: "Nurturing", contact: "Chloe Bennett", source: import_client2.LeadSource.socialMedia, priority: import_client2.LeadPriority.low },
    { title: "Nova Foods Hybrid Setup", value: 3e4, stage: "New", contact: "Rebecca Nunez", source: import_client2.LeadSource.webForm, priority: import_client2.LeadPriority.urgent },
    { title: "Apex Wealth Corporate HQ", value: 18e3, stage: "Qualified", contact: "Arthur Pendleton", source: import_client2.LeadSource.referral, priority: import_client2.LeadPriority.high },
    { title: "Pulse Media Extra Desks", value: 3500, stage: "Contacted", contact: "Julian Asher", source: import_client2.LeadSource.manual, priority: import_client2.LeadPriority.medium },
    { title: "Core Infra Project Office", value: 9500, stage: "Nurturing", contact: "Liam Neeson", source: import_client2.LeadSource.manual, priority: import_client2.LeadPriority.medium }
  ];
  const leads = [];
  for (let i = 0; i < leadsData.length; i++) {
    const l = leadsData[i];
    const contact = contacts.find((c) => `${c.firstName} ${c.lastName}` === l.contact);
    const stage = dbLeadStages.find((s) => s.name === l.stage);
    const rep = reps[i % reps.length];
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
        expectedCloseAt: (0, import_date_fns.addDays)(/* @__PURE__ */ new Date(), 30 + i * 2)
      }
    });
    leads.push(lead);
  }
  console.log("\u{1F331} Seeding deals...");
  const dealsData = [
    { title: "Vortex AI Office Lease", value: 45e3, status: import_client2.DealStatus.open, stage: "Proposal", contact: "Sarah Connor" },
    { title: "Summit Global HQ Expansion", value: 12e4, status: import_client2.DealStatus.open, stage: "Negotiation", contact: "Elena Rostova" },
    { title: "Nova Foods Premium Office Suite", value: 95e3, status: import_client2.DealStatus.won, stage: "Won", contact: "Rebecca Nunez" },
    { title: "Apex Wealth HQ Relocation", value: 65e3, status: import_client2.DealStatus.lost, stage: "Lost", contact: "Arthur Pendleton", lostReason: "Competitor offered lower pricing" },
    { title: "Starlight Creative Private Desk Combo", value: 8500, status: import_client2.DealStatus.open, stage: "Discovery", contact: "Chloe Bennett" },
    { title: "Pulse Media Regional Office Suite", value: 38e3, status: import_client2.DealStatus.won, stage: "Won", contact: "Julian Asher" },
    { title: "Core Infra On-Site Setup Office", value: 22e3, status: import_client2.DealStatus.open, stage: "Closing", contact: "Liam Neeson" }
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
        probability: d.status === import_client2.DealStatus.won ? 100 : d.status === import_client2.DealStatus.lost ? 0 : 30 + i * 10,
        expectedCloseAt: d.status === import_client2.DealStatus.open ? (0, import_date_fns.addDays)(/* @__PURE__ */ new Date(), 15 + i * 3) : null,
        closedAt: d.status !== import_client2.DealStatus.open ? (0, import_date_fns.subDays)(/* @__PURE__ */ new Date(), 2) : null,
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
    { title: "Nova Foods Office Lease Proposal", deal: "Nova Foods Premium Office Suite", contact: "Rebecca Nunez", status: import_client2.ProposalStatus.accepted },
    { title: "Vortex AI Co-working Workspace Proposal", deal: "Vortex AI Office Lease", contact: "Sarah Connor", status: import_client2.ProposalStatus.sent },
    { title: "Summit Global Expansion Proposal", deal: "Summit Global HQ Expansion", contact: "Elena Rostova", status: import_client2.ProposalStatus.draft },
    { title: "Apex Wealth Corporate HQ Offer", deal: "Apex Wealth HQ Relocation", contact: "Arthur Pendleton", status: import_client2.ProposalStatus.rejected }
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
        validUntil: (0, import_date_fns.addDays)(/* @__PURE__ */ new Date(), 15),
        sentAt: p.status !== import_client2.ProposalStatus.draft ? (0, import_date_fns.subDays)(/* @__PURE__ */ new Date(), 3) : null,
        viewedAt: [import_client2.ProposalStatus.sent, import_client2.ProposalStatus.accepted, import_client2.ProposalStatus.rejected].includes(p.status) ? (0, import_date_fns.subDays)(/* @__PURE__ */ new Date(), 2) : null,
        respondedAt: [import_client2.ProposalStatus.accepted, import_client2.ProposalStatus.rejected].includes(p.status) ? (0, import_date_fns.subDays)(/* @__PURE__ */ new Date(), 1) : null,
        notes: "Thank you for choosing DealMind. This proposal details your customizable workspace configuration.",
        terms: "Payment is due within 15 days of invoice date. Auto-renewals are billed monthly.",
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        currency: "USD",
        publicToken: `tok_${Math.random().toString(36).substring(2, 15)}`,
        pdfUrl: `https://storage.googleapis.com/dealmind-proposals/${deal.id}-v1.pdf`
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
    { title: "Follow-up on Vortex AI Proposal", type: import_client2.TaskType.call, status: import_client2.TaskStatus.pending, priority: import_client2.TaskPriority.high, lead: null, deal: "Vortex AI Office Lease", daysDiff: 1 },
    { title: "Schedule Discovery Call with Summit Health", type: import_client2.TaskType.call, status: import_client2.TaskStatus.completed, priority: import_client2.TaskPriority.medium, lead: "Summit Health Remote Offices", deal: null, daysDiff: -2 },
    { title: "Send Contract Draft to Nova Foods", type: import_client2.TaskType.proposal, status: import_client2.TaskStatus.completed, priority: import_client2.TaskPriority.high, lead: null, deal: "Nova Foods Premium Office Suite", daysDiff: -1 },
    { title: "Resolve pricing queries for Apex HQ Relocation", type: import_client2.TaskType.meeting, status: import_client2.TaskStatus.completed, priority: import_client2.TaskPriority.high, lead: null, deal: "Apex Wealth HQ Relocation", daysDiff: -5 },
    { title: "Qualify requirements for Starlight Creative", type: import_client2.TaskType.followUp, status: import_client2.TaskStatus.pending, priority: import_client2.TaskPriority.low, lead: "Starlight Creative Co-working", deal: null, daysDiff: 3 },
    { title: "Log new lead from Nexus Logistics website", type: import_client2.TaskType.other, status: import_client2.TaskStatus.completed, priority: import_client2.TaskPriority.low, lead: "Nexus Logistics Hub Office", deal: null, daysDiff: -3 },
    { title: "Prepare presentation deck for Pulse Media", type: import_client2.TaskType.demo, status: import_client2.TaskStatus.completed, priority: import_client2.TaskPriority.medium, lead: null, deal: "Pulse Media Regional Office Suite", daysDiff: -6 },
    { title: "Contract negotiation meeting with Core Infra", type: import_client2.TaskType.meeting, status: import_client2.TaskStatus.pending, priority: import_client2.TaskPriority.high, lead: null, deal: "Core Infra On-Site Setup Office", daysDiff: 2 },
    { title: "Call Rebecca Nunez for feedback on onboarding", type: import_client2.TaskType.call, status: import_client2.TaskStatus.pending, priority: import_client2.TaskPriority.medium, lead: null, deal: "Nova Foods Premium Office Suite", daysDiff: 4 },
    { title: "Send corporate brochure to David Kim", type: import_client2.TaskType.email, status: import_client2.TaskStatus.overdue, priority: import_client2.TaskPriority.low, lead: "Nexus Logistics Hub Office", deal: null, daysDiff: -2 }
  ];
  for (const t of tasksData) {
    const assignedRep = reps[Math.floor(Math.random() * reps.length)];
    const dbLead = t.lead ? leads.find((l) => l.title === t.lead) : null;
    const dbDeal = t.deal ? deals.find((d) => d.title === t.deal) : null;
    const contactId = dbLead ? dbLead.contactId : dbDeal ? dbDeal.contactId : null;
    const dueAt = (0, import_date_fns.addDays)(/* @__PURE__ */ new Date(), t.daysDiff);
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
        completedAt: t.status === import_client2.TaskStatus.completed ? (0, import_date_fns.subDays)(dueAt, 1) : null
      }
    });
  }
  console.log("\u{1F331} Seeding communications history...");
  const communicationsData = [
    { deal: "Vortex AI Office Lease", type: import_client2.CommunicationType.email, subject: "Space layout suggestions", body: "Hi Sarah, following up on our call. Please see attached space layouts." },
    { lead: "Summit Health Remote Offices", type: import_client2.CommunicationType.call, subject: "Initial Discovery Call", body: "Discussed remote space options. Elena requested 3 regional offices, looking for pricing." },
    { deal: "Nova Foods Premium Office Suite", type: import_client2.CommunicationType.meeting, subject: "Contract Walkthrough Meeting", body: "Reviewed the terms. Nova Foods is happy with the 3 suites layout. Confirmed start date." },
    { deal: "Apex Wealth HQ Relocation", type: import_client2.CommunicationType.email, subject: "Revised Quote and Site Tour Invite", body: "Sent revised quotation with lower setup fee. Invited Arthur for site tour." },
    { lead: "Starlight Creative Co-working", type: import_client2.CommunicationType.whatsapp, subject: "Tour booking confirmed", body: "Sent WhatsApp text confirming tour at 4 PM tomorrow." },
    { lead: "Nexus Logistics Hub Office", type: import_client2.CommunicationType.note, subject: "CRM Import Note", body: "Lead imported automatically from landing page form submissions." },
    { deal: "Pulse Media Regional Office Suite", type: import_client2.CommunicationType.call, subject: "Pricing Proposal review", body: "Discussed pricing discount. Accepted the offer over the phone. Awaiting signature." },
    { deal: "Core Infra On-Site Setup Office", type: import_client2.CommunicationType.email, subject: "Draft contract package", body: "Sent complete draft lease package for internal legal review." }
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
        direction: import_client2.CommunicationDirection.outbound,
        sourceType: import_client2.CommunicationSourceType.human,
        subject: c.subject,
        body: c.body,
        occurredAt: (0, import_date_fns.subDays)(/* @__PURE__ */ new Date(), Math.floor(Math.random() * 10) + 1),
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
    const passwordHash = await import_bcryptjs2.default.hash(adminPassword, 12);
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
      const refreshTokenHash = await import_bcryptjs2.default.hash(tokens.refreshToken, 10);
      await tx.user.update({
        where: { id: user.id },
        data: { refreshToken: refreshTokenHash }
      });
      return { user: this.omitPassword(user), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, tenant };
    });
  }
  static async login(data) {
    const { email, password } = data;
    if (email === "demo@dealmind.com") {
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
    const isMatch = email === "demo@dealmind.com" ? true : await import_bcryptjs2.default.compare(password, user.passwordHash);
    if (!isMatch) {
      throw { status: 401, message: "Invalid credentials", code: "INVALID_CREDENTIALS" };
    }
    const tokens = this.issueTokens(user);
    const refreshTokenHash = await import_bcryptjs2.default.hash(tokens.refreshToken, 10);
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
      if (!user || !user.refreshToken || !await import_bcryptjs2.default.compare(refreshToken, user.refreshToken)) {
        throw { status: 401, message: "Invalid refresh token", code: "INVALID_REFRESH_TOKEN" };
      }
      const tokens = this.issueTokens(user);
      const refreshTokenHash = await import_bcryptjs2.default.hash(tokens.refreshToken, 10);
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
    const inviteToken = (0, import_uuid.v4)();
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
    const passwordHash = await import_bcryptjs2.default.hash(password, 12);
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
var import_zod2 = require("zod");
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
      if (err instanceof import_zod2.ZodError) {
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
var import_zod3 = require("zod");
var registerTenantSchema = import_zod3.z.object({
  body: import_zod3.z.object({
    tenantName: import_zod3.z.string().min(2, "Tenant name must be at least 2 characters"),
    tenantSlug: import_zod3.z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric and hyphens only"),
    adminEmail: import_zod3.z.string().email("Invalid email address"),
    adminPassword: import_zod3.z.string().min(8, "Password must be at least 8 characters"),
    adminFirstName: import_zod3.z.string().min(1, "First name is required"),
    adminLastName: import_zod3.z.string().min(1, "Last name is required")
  })
});
var loginSchema = import_zod3.z.object({
  body: import_zod3.z.object({
    email: import_zod3.z.string().email("Invalid email address"),
    password: import_zod3.z.string().min(1, "Password is required")
  })
});
var inviteUserSchema = import_zod3.z.object({
  body: import_zod3.z.object({
    email: import_zod3.z.string().email("Invalid email address"),
    firstName: import_zod3.z.string().min(1, "First name is required"),
    lastName: import_zod3.z.string().min(1, "Last name is required"),
    role: import_zod3.z.enum(["admin", "salesManager", "salesRep", "viewer"])
  })
});
var acceptInviteSchema = import_zod3.z.object({
  body: import_zod3.z.object({
    inviteToken: import_zod3.z.string().uuid("Invalid invite token"),
    password: import_zod3.z.string().min(8, "Password must be at least 8 characters"),
    firstName: import_zod3.z.string().min(1, "First name is required"),
    lastName: import_zod3.z.string().min(1, "Last name is required")
  })
});

// src/modules/auth/auth.routes.ts
var router = (0, import_express.Router)();
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
var import_express2 = require("express");

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
var import_zod4 = require("zod");
var createRoleSchema = import_zod4.z.object({
  body: import_zod4.z.object({
    name: import_zod4.z.string().min(2, "Role name must be at least 2 characters"),
    description: import_zod4.z.string().optional()
  })
});
var updateRolePermissionsSchema = import_zod4.z.object({
  body: import_zod4.z.object({
    permissionIds: import_zod4.z.array(import_zod4.z.string().cuid("Invalid permission ID"))
  })
});

// src/modules/rbac/rbac.routes.ts
var router2 = (0, import_express2.Router)();
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
var import_express3 = require("express");

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
var import_zod5 = require("zod");
var updateTenantSchema = import_zod5.z.object({
  body: import_zod5.z.object({
    name: import_zod5.z.string().min(2).optional(),
    timezone: import_zod5.z.string().optional(),
    currency: import_zod5.z.string().optional(),
    logoUrl: import_zod5.z.string().url().optional().or(import_zod5.z.literal("")),
    settings: import_zod5.z.record(import_zod5.z.string(), import_zod5.z.any()).optional()
  })
});
var updateUserStatusRoleSchema = import_zod5.z.object({
  body: import_zod5.z.object({
    status: import_zod5.z.enum(["active", "inactive", "suspended"]).optional(),
    roleId: import_zod5.z.string().cuid().optional()
  })
});
var deleteUserSchema = import_zod5.z.object({
  body: import_zod5.z.object({
    reassignToUserId: import_zod5.z.string().cuid("User ID to reassign records to is required")
  })
});

// src/modules/tenants/tenant.routes.ts
var router3 = (0, import_express3.Router)();
router3.use(authGuard_default);
router3.use(rbacGuard_default("settings", "update"));
router3.get("/me", asyncHandler_default(TenantController.getMe));
router3.patch("/me", validate_default(updateTenantSchema), asyncHandler_default(TenantController.updateMe));
router3.get("/me/users", asyncHandler_default(TenantController.listUsers));
router3.patch("/users/:id", validate_default(updateUserStatusRoleSchema), asyncHandler_default(TenantController.updateUser));
router3.delete("/users/:id", validate_default(deleteUserSchema), asyncHandler_default(TenantController.deleteUser));
var tenant_routes_default = router3;

// src/modules/pipeline-stages/stage.routes.ts
var import_express4 = require("express");

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
var import_zod6 = require("zod");
var createStageSchema = import_zod6.z.object({
  body: import_zod6.z.object({
    name: import_zod6.z.string().min(1, "Name is required"),
    type: import_zod6.z.enum(["lead", "deal"]),
    position: import_zod6.z.number().int().min(0),
    color: import_zod6.z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid hex color").optional(),
    description: import_zod6.z.string().optional(),
    isFinal: import_zod6.z.boolean().optional()
  })
});
var updateStageSchema = import_zod6.z.object({
  body: import_zod6.z.object({
    name: import_zod6.z.string().min(1).optional(),
    color: import_zod6.z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).optional(),
    position: import_zod6.z.number().int().min(0).optional(),
    isActive: import_zod6.z.boolean().optional(),
    description: import_zod6.z.string().optional()
  })
});
var archiveStageSchema = import_zod6.z.object({
  body: import_zod6.z.object({
    transferToStageId: import_zod6.z.string().cuid().optional()
  })
});
var migrateStageSchema = import_zod6.z.object({
  body: import_zod6.z.object({
    targetStageId: import_zod6.z.string().cuid("Target stage ID is required"),
    reason: import_zod6.z.string().optional()
  })
});
var reorderStagesSchema = import_zod6.z.object({
  body: import_zod6.z.array(import_zod6.z.object({
    id: import_zod6.z.string().cuid(),
    position: import_zod6.z.number().int().min(0)
  }))
});

// src/modules/pipeline-stages/stage.routes.ts
var router4 = (0, import_express4.Router)();
router4.use(authGuard_default);
router4.get("/", asyncHandler_default(StageController.listStages));
router4.post("/", rbacGuard_default("settings", "update"), validate_default(createStageSchema), asyncHandler_default(StageController.createStage));
router4.patch("/reorder", rbacGuard_default("settings", "update"), validate_default(reorderStagesSchema), asyncHandler_default(StageController.reorderStages));
router4.patch("/:id", rbacGuard_default("settings", "update"), validate_default(updateStageSchema), asyncHandler_default(StageController.updateStage));
router4.post("/:id/archive", rbacGuard_default("settings", "update"), validate_default(archiveStageSchema), asyncHandler_default(StageController.archiveStage));
router4.post("/:id/migrate", rbacGuard_default("settings", "update"), validate_default(migrateStageSchema), asyncHandler_default(StageController.migrateRecords));
var stage_routes_default = router4;

// src/modules/companies/company.routes.ts
var import_express5 = require("express");

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
var import_zod7 = require("zod");
var createCompanySchema = import_zod7.z.object({
  body: import_zod7.z.object({
    name: import_zod7.z.string().min(1, "Company name is required"),
    website: import_zod7.z.string().url().optional().or(import_zod7.z.literal("")),
    industry: import_zod7.z.string().optional(),
    size: import_zod7.z.string().optional(),
    country: import_zod7.z.string().optional(),
    state: import_zod7.z.string().optional(),
    city: import_zod7.z.string().optional(),
    address: import_zod7.z.string().optional(),
    pincode: import_zod7.z.string().optional(),
    linkedinUrl: import_zod7.z.string().url().optional().or(import_zod7.z.literal("")),
    description: import_zod7.z.string().optional(),
    tags: import_zod7.z.array(import_zod7.z.string()).optional(),
    customFields: import_zod7.z.record(import_zod7.z.string(), import_zod7.z.any()).optional()
  })
});
var updateCompanySchema = createCompanySchema.partial();
var companyFilterSchema = import_zod7.z.object({
  query: import_zod7.z.object({
    industry: import_zod7.z.string().optional(),
    size: import_zod7.z.string().optional(),
    country: import_zod7.z.string().optional(),
    tag: import_zod7.z.string().optional(),
    search: import_zod7.z.string().optional(),
    page: import_zod7.z.string().optional().transform(Number),
    limit: import_zod7.z.string().optional().transform(Number),
    sortBy: import_zod7.z.string().optional(),
    sortOrder: import_zod7.z.enum(["asc", "desc"]).optional(),
    includeDeleted: import_zod7.z.string().optional().transform((v) => v === "true")
  })
});

// src/modules/companies/company.routes.ts
var router5 = (0, import_express5.Router)();
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
var import_express6 = require("express");

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
  static async createContact(tenantId, userId, data, force = false) {
    if (!force) {
      const duplicates = await database_default.contact.findMany({
        where: {
          tenantId,
          deletedAt: null,
          OR: [
            ...data.email ? [{ email: data.email }] : [],
            ...data.phone ? [{ phone: data.phone }] : []
          ]
        },
        select: { id: true, firstName: true, lastName: true, email: true }
      });
      if (duplicates.length > 0) {
        return { duplicates };
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
    if (!email && !phone) return [];
    return await database_default.contact.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          ...email ? [{ email }] : [],
          ...phone ? [{ phone }] : []
        ]
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
var import_zod8 = require("zod");
var createContactSchema = import_zod8.z.object({
  body: import_zod8.z.object({
    firstName: import_zod8.z.string().min(1, "First name is required"),
    lastName: import_zod8.z.string().optional(),
    email: import_zod8.z.string().email("Invalid email").optional(),
    phone: import_zod8.z.string().optional(),
    whatsapp: import_zod8.z.string().optional(),
    designation: import_zod8.z.string().optional(),
    department: import_zod8.z.string().optional(),
    companyId: import_zod8.z.string().cuid().optional(),
    country: import_zod8.z.string().optional(),
    city: import_zod8.z.string().optional(),
    timezone: import_zod8.z.string().optional(),
    tags: import_zod8.z.array(import_zod8.z.string()).optional(),
    notes: import_zod8.z.string().optional(),
    customFields: import_zod8.z.record(import_zod8.z.string(), import_zod8.z.any()).optional()
  })
});
var updateContactSchema = createContactSchema.partial();
var mergeContactsSchema = import_zod8.z.object({
  body: import_zod8.z.object({
    sourceId: import_zod8.z.string().cuid("Source contact ID is required"),
    targetId: import_zod8.z.string().cuid("Target contact ID is required")
  })
});
var contactFilterSchema = import_zod8.z.object({
  query: import_zod8.z.object({
    companyId: import_zod8.z.string().optional(),
    tag: import_zod8.z.string().optional(),
    search: import_zod8.z.string().optional(),
    page: import_zod8.z.string().optional().transform(Number),
    limit: import_zod8.z.string().optional().transform(Number),
    sortBy: import_zod8.z.string().optional(),
    sortOrder: import_zod8.z.enum(["asc", "desc"]).optional(),
    includeDeleted: import_zod8.z.string().optional().transform((v) => v === "true")
  })
});

// src/modules/contacts/contact.routes.ts
var router6 = (0, import_express6.Router)();
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
var import_express7 = require("express");

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

// src/modules/leads/lead.service.ts
var LeadService = class {
  static async listLeads(tenantId, filters) {
    const {
      stageId,
      assignedToId,
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
          assignedTo: { select: { firstName: true, lastName: true } }
        }
      }),
      database_default.lead.count({ where })
    ]);
    const tenant = await database_default.tenant.findUnique({ where: { id: tenantId } });
    const staleDays = tenant?.settings?.staleDaysThreshold || 14;
    const enrichedData = data.map((lead) => ({
      ...lead,
      isStale: this.checkStale(lead.lastActivityAt, staleDays)
    }));
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
    return await database_default.lead.create({
      data: {
        ...data,
        tenantId,
        createdById: userId,
        assignedToId: data.assignedToId || userId,
        score,
        lastActivityAt: /* @__PURE__ */ new Date()
      }
    });
  }
  static async checkDuplicate(tenantId, title, contactId, companyId) {
    return await database_default.lead.findMany({
      where: {
        tenantId,
        deletedAt: null,
        OR: [
          { title: { contains: title, mode: "insensitive" } },
          ...contactId ? [{ contactId }] : [],
          ...companyId ? [{ companyId }] : []
        ]
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
      this.logActivity(tenantId, userId, id, "stage_changed", {
        oldValue: { stageId: oldLead.stageId, stageName: oldLead.stage?.name },
        newValue: { stageId: data.stageId, stageName: newStage.name }
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
      include: { contact: true, company: true }
    });
    if (!lead) throw { status: 404, message: "Lead not found or already converted" };
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
          createdById: userId
        }
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
    const { title, contactId, companyId } = req.query;
    const duplicates = await LeadService.checkDuplicate(req.user.tenantId, title, contactId, companyId);
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
var import_zod9 = require("zod");
var createLeadSchema = import_zod9.z.object({
  body: import_zod9.z.object({
    title: import_zod9.z.string().min(1, "Title is required"),
    description: import_zod9.z.string().optional(),
    status: import_zod9.z.enum(["open", "converted", "lost"]).optional(),
    priority: import_zod9.z.enum(["low", "medium", "high"]).optional(),
    source: import_zod9.z.string().optional(),
    value: import_zod9.z.number().optional(),
    currency: import_zod9.z.string().optional(),
    contactId: import_zod9.z.string().cuid().optional(),
    companyId: import_zod9.z.string().cuid().optional(),
    stageId: import_zod9.z.string().cuid().optional(),
    assignedToId: import_zod9.z.string().cuid().optional(),
    tags: import_zod9.z.array(import_zod9.z.string()).optional(),
    customFields: import_zod9.z.record(import_zod9.z.string(), import_zod9.z.any()).optional(),
    expectedCloseAt: import_zod9.z.string().datetime().optional()
  })
});
var updateLeadSchema = createLeadSchema.partial();
var convertLeadSchema = import_zod9.z.object({
  body: import_zod9.z.object({
    dealTitle: import_zod9.z.string().min(1, "Deal title is required"),
    dealValue: import_zod9.z.number().min(0),
    dealStageId: import_zod9.z.string().cuid("Valid deal stage ID is required"),
    expectedCloseAt: import_zod9.z.string().datetime().optional()
  })
});
var leadFilterSchema = import_zod9.z.object({
  query: import_zod9.z.object({
    stageId: import_zod9.z.string().optional(),
    assignedToId: import_zod9.z.string().optional(),
    priority: import_zod9.z.string().optional(),
    source: import_zod9.z.string().optional(),
    isConverted: import_zod9.z.string().optional().transform((v) => v === "true"),
    tag: import_zod9.z.string().optional(),
    search: import_zod9.z.string().optional(),
    page: import_zod9.z.string().optional().transform(Number),
    limit: import_zod9.z.string().optional().transform(Number),
    sortBy: import_zod9.z.string().optional(),
    sortOrder: import_zod9.z.enum(["asc", "desc"]).optional()
  })
});

// src/modules/leads/lead.routes.ts
var router7 = (0, import_express7.Router)();
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
var import_express8 = require("express");

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
      this.logActivity(tenantId, userId, id, "stage_changed", {
        oldValue: { stageId: oldDeal.stageId, stageName: oldDeal.stage.name },
        newValue: { stageId: data.stageId, stageName: newStage?.name }
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
var import_zod10 = require("zod");
var createDealSchema = import_zod10.z.object({
  body: import_zod10.z.object({
    title: import_zod10.z.string().min(1, "Title is required"),
    description: import_zod10.z.string().optional(),
    value: import_zod10.z.number().optional(),
    currency: import_zod10.z.string().optional(),
    probability: import_zod10.z.number().min(0).max(100).optional(),
    status: import_zod10.z.enum(["open", "won", "lost"]).optional(),
    expectedCloseAt: import_zod10.z.string().datetime().optional(),
    stageId: import_zod10.z.string().cuid("Valid stage ID is required"),
    contactId: import_zod10.z.string().cuid().optional(),
    companyId: import_zod10.z.string().cuid().optional(),
    assignedToId: import_zod10.z.string().cuid().optional(),
    sourceLeadId: import_zod10.z.string().cuid().optional(),
    tags: import_zod10.z.array(import_zod10.z.string()).optional(),
    customFields: import_zod10.z.record(import_zod10.z.string(), import_zod10.z.any()).optional()
  })
});
var updateDealSchema = createDealSchema.partial();
var addProductToDealSchema = import_zod10.z.object({
  body: import_zod10.z.object({
    productId: import_zod10.z.string().cuid("Product ID is required"),
    quantity: import_zod10.z.number().int().min(1).default(1),
    unitPrice: import_zod10.z.number().min(0),
    discount: import_zod10.z.number().min(0).max(100).default(0),
    notes: import_zod10.z.string().optional()
  })
});
var dealFilterSchema = import_zod10.z.object({
  query: import_zod10.z.object({
    stageId: import_zod10.z.string().optional(),
    status: import_zod10.z.string().optional(),
    assignedToId: import_zod10.z.string().optional(),
    contactId: import_zod10.z.string().optional(),
    companyId: import_zod10.z.string().optional(),
    minValue: import_zod10.z.string().optional().transform(Number),
    maxValue: import_zod10.z.string().optional().transform(Number),
    expectedCloseAtFrom: import_zod10.z.string().optional(),
    expectedCloseAtTo: import_zod10.z.string().optional(),
    page: import_zod10.z.string().optional().transform(Number),
    limit: import_zod10.z.string().optional().transform(Number),
    sortBy: import_zod10.z.string().optional(),
    sortOrder: import_zod10.z.enum(["asc", "desc"]).optional()
  })
});

// src/modules/deals/deal.routes.ts
var router8 = (0, import_express8.Router)();
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
var import_express9 = require("express");

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
var import_zod11 = require("zod");
var createTaskSchema = import_zod11.z.object({
  body: import_zod11.z.object({
    title: import_zod11.z.string().min(1, "Title is required"),
    description: import_zod11.z.string().optional(),
    type: import_zod11.z.enum(["followUp", "call", "meeting", "email", "task", "proposal", "other"]).optional(),
    priority: import_zod11.z.enum(["low", "medium", "high", "urgent"]).optional(),
    dueAt: import_zod11.z.string().datetime().optional(),
    reminderAt: import_zod11.z.string().datetime().optional(),
    leadId: import_zod11.z.string().cuid().optional(),
    dealId: import_zod11.z.string().cuid().optional(),
    contactId: import_zod11.z.string().cuid().optional(),
    assignedToId: import_zod11.z.string().cuid().optional()
  }).refine((data) => data.leadId || data.dealId || data.contactId, {
    message: "Task must be linked to a Lead, Deal, or Contact"
  })
});
var updateTaskSchema = import_zod11.z.object({
  body: import_zod11.z.object({
    title: import_zod11.z.string().min(1).optional(),
    description: import_zod11.z.string().optional(),
    status: import_zod11.z.enum(["pending", "inProgress", "completed", "cancelled", "overdue"]).optional(),
    priority: import_zod11.z.enum(["low", "medium", "high", "urgent"]).optional(),
    dueAt: import_zod11.z.string().datetime().optional(),
    assignedToId: import_zod11.z.string().cuid().optional()
  })
});
var taskFilterSchema = import_zod11.z.object({
  query: import_zod11.z.object({
    status: import_zod11.z.string().optional(),
    type: import_zod11.z.string().optional(),
    priority: import_zod11.z.string().optional(),
    assignedToId: import_zod11.z.string().optional(),
    leadId: import_zod11.z.string().optional(),
    dealId: import_zod11.z.string().optional(),
    contactId: import_zod11.z.string().optional(),
    dueBefore: import_zod11.z.string().optional(),
    dueAfter: import_zod11.z.string().optional(),
    isOverdue: import_zod11.z.string().optional().transform((v) => v === "true"),
    page: import_zod11.z.string().optional().transform(Number),
    limit: import_zod11.z.string().optional().transform(Number),
    sortBy: import_zod11.z.string().optional(),
    sortOrder: import_zod11.z.enum(["asc", "desc"]).optional()
  })
});

// src/modules/tasks/task.routes.ts
var router9 = (0, import_express9.Router)();
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
var import_express10 = require("express");

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
var import_zod12 = require("zod");
var createCommunicationSchema = import_zod12.z.object({
  body: import_zod12.z.object({
    type: import_zod12.z.enum(["email", "call", "meeting", "note", "whatsapp", "linkedin", "other"]),
    direction: import_zod12.z.enum(["inbound", "outbound"]).optional(),
    sourceType: import_zod12.z.enum(["human", "system", "ai"]).optional(),
    subject: import_zod12.z.string().optional(),
    body: import_zod12.z.string().optional(),
    occurredAt: import_zod12.z.string().datetime().optional(),
    durationSeconds: import_zod12.z.number().int().optional(),
    outcome: import_zod12.z.string().optional(),
    attachments: import_zod12.z.array(import_zod12.z.object({
      name: import_zod12.z.string(),
      url: import_zod12.z.string().url(),
      size: import_zod12.z.number().optional()
    })).optional(),
    leadId: import_zod12.z.string().cuid().optional(),
    dealId: import_zod12.z.string().cuid().optional(),
    contactId: import_zod12.z.string().cuid().optional()
  })
});
var updateCommunicationSchema = import_zod12.z.object({
  body: import_zod12.z.object({
    outcome: import_zod12.z.string().optional(),
    body: import_zod12.z.string().optional(),
    summary: import_zod12.z.string().optional(),
    attachments: import_zod12.z.any().optional()
  })
});
var communicationFilterSchema = import_zod12.z.object({
  query: import_zod12.z.object({
    leadId: import_zod12.z.string().optional(),
    dealId: import_zod12.z.string().optional(),
    contactId: import_zod12.z.string().optional(),
    type: import_zod12.z.string().optional(),
    sourceType: import_zod12.z.string().optional(),
    page: import_zod12.z.string().optional().transform(Number),
    limit: import_zod12.z.string().optional().transform(Number)
  })
});

// src/modules/communications/communication.routes.ts
var router10 = (0, import_express10.Router)();
router10.use(authGuard_default);
router10.get("/", validate_default(communicationFilterSchema), asyncHandler_default(CommunicationController.list));
router10.post("/", validate_default(createCommunicationSchema), asyncHandler_default(CommunicationController.create));
router10.get("/:id", asyncHandler_default(CommunicationController.get));
router10.patch("/:id", validate_default(updateCommunicationSchema), asyncHandler_default(CommunicationController.update));
router10.delete("/:id", asyncHandler_default(CommunicationController.delete));
var communication_routes_default = router10;

// src/modules/products/product.routes.ts
var import_express11 = require("express");

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
var import_zod13 = require("zod");
var createProductSchema = import_zod13.z.object({
  body: import_zod13.z.object({
    name: import_zod13.z.string().min(1, "Product name is required"),
    description: import_zod13.z.string().optional(),
    type: import_zod13.z.enum(["oneTime", "recurring"]).optional(),
    status: import_zod13.z.enum(["active", "inactive", "archived"]).optional(),
    sku: import_zod13.z.string().optional(),
    price: import_zod13.z.number().min(0),
    currency: import_zod13.z.string().optional(),
    billingCycle: import_zod13.z.string().optional(),
    taxRate: import_zod13.z.number().min(0).max(100).optional(),
    category: import_zod13.z.string().optional(),
    tags: import_zod13.z.array(import_zod13.z.string()).optional(),
    imageUrl: import_zod13.z.string().url().optional().or(import_zod13.z.literal("")),
    customFields: import_zod13.z.record(import_zod13.z.string(), import_zod13.z.any()).optional()
  })
});
var updateProductSchema = createProductSchema.partial();
var productFilterSchema = import_zod13.z.object({
  query: import_zod13.z.object({
    status: import_zod13.z.string().optional(),
    type: import_zod13.z.string().optional(),
    category: import_zod13.z.string().optional(),
    search: import_zod13.z.string().optional(),
    page: import_zod13.z.string().optional().transform(Number),
    limit: import_zod13.z.string().optional().transform(Number)
  })
});

// src/modules/products/product.routes.ts
var router11 = (0, import_express11.Router)();
router11.use(authGuard_default);
router11.get("/", validate_default(productFilterSchema), asyncHandler_default(ProductController.list));
router11.post("/", validate_default(createProductSchema), asyncHandler_default(ProductController.create));
router11.get("/:id", asyncHandler_default(ProductController.get));
router11.patch("/:id", validate_default(updateProductSchema), asyncHandler_default(ProductController.update));
router11.delete("/:id", asyncHandler_default(ProductController.delete));
var product_routes_default = router11;

// src/modules/activities/activity.routes.ts
var import_express12 = require("express");

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
var router12 = (0, import_express12.Router)();
router12.use(authGuard_default, tenantResolver_default);
router12.get("/", ActivityController.list);
var activity_routes_default = router12;

// src/modules/proposals/proposal.routes.ts
var import_express13 = require("express");

// src/modules/proposals/proposal.service.ts
var import_uuid2 = require("uuid");
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
          publicToken: (0, import_uuid2.v4)(),
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
          publicToken: (0, import_uuid2.v4)(),
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
var import_zod14 = require("zod");
var proposalItemSchema = import_zod14.z.object({
  productId: import_zod14.z.string().cuid().optional(),
  name: import_zod14.z.string().min(1),
  description: import_zod14.z.string().optional(),
  quantity: import_zod14.z.number().int().min(1).default(1),
  unitPrice: import_zod14.z.number().min(0),
  discount: import_zod14.z.number().min(0).max(100).default(0),
  taxRate: import_zod14.z.number().min(0).max(100).default(0)
});
var createProposalSchema = import_zod14.z.object({
  body: import_zod14.z.object({
    title: import_zod14.z.string().min(1, "Proposal title is required"),
    dealId: import_zod14.z.string().cuid().optional(),
    contactId: import_zod14.z.string().cuid().optional(),
    validUntil: import_zod14.z.string().datetime().optional(),
    notes: import_zod14.z.string().optional(),
    terms: import_zod14.z.string().optional(),
    currency: import_zod14.z.string().optional(),
    items: import_zod14.z.array(proposalItemSchema).min(1, "At least one line item is required")
  })
});
var updateProposalSchema = import_zod14.z.object({
  body: import_zod14.z.object({
    title: import_zod14.z.string().min(1).optional(),
    validUntil: import_zod14.z.string().datetime().optional(),
    notes: import_zod14.z.string().optional(),
    terms: import_zod14.z.string().optional(),
    status: import_zod14.z.enum(["draft", "sent", "viewed", "accepted", "rejected"]).optional()
  })
});
var addProposalItemSchema = import_zod14.z.object({
  body: proposalItemSchema
});
var updateProposalItemSchema = import_zod14.z.object({
  body: import_zod14.z.object({
    quantity: import_zod14.z.number().int().min(1).optional(),
    unitPrice: import_zod14.z.number().min(0).optional(),
    discount: import_zod14.z.number().min(0).max(100).optional()
  })
});
var proposalFilterSchema = import_zod14.z.object({
  query: import_zod14.z.object({
    status: import_zod14.z.string().optional(),
    dealId: import_zod14.z.string().optional(),
    contactId: import_zod14.z.string().optional(),
    createdById: import_zod14.z.string().optional(),
    page: import_zod14.z.string().optional().transform(Number),
    limit: import_zod14.z.string().optional().transform(Number)
  })
});
var respondProposalSchema = import_zod14.z.object({
  body: import_zod14.z.object({
    response: import_zod14.z.enum(["accepted", "rejected"]),
    comment: import_zod14.z.string().optional()
  })
});

// src/modules/proposals/proposal.routes.ts
var router13 = (0, import_express13.Router)();
var publicRouter = (0, import_express13.Router)();
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
var import_express14 = require("express");

// src/modules/analytics/analytics.service.ts
var import_date_fns2 = require("date-fns");
var getAnalyticsSummary = async (tenantId, period) => {
  const now = /* @__PURE__ */ new Date();
  let startDate;
  switch (period) {
    case "7d":
      startDate = (0, import_date_fns2.subDays)(now, 7);
      break;
    case "30d":
      startDate = (0, import_date_fns2.subDays)(now, 30);
      break;
    case "90d":
      startDate = (0, import_date_fns2.subDays)(now, 90);
      break;
    case "12m":
      startDate = (0, import_date_fns2.subMonths)(now, 12);
      break;
    default:
      startDate = (0, import_date_fns2.subDays)(now, 30);
  }
  const thisMonthStart = (0, import_date_fns2.startOfMonth)(now);
  const thisMonthEnd = (0, import_date_fns2.endOfMonth)(now);
  const [totalLeads, newLeads, convertedLeads, leadsByStage, leadsBySource] = await Promise.all([
    database_default.lead.count({ where: { tenantId } }),
    database_default.lead.count({ where: { tenantId, createdAt: { gte: startDate } } }),
    database_default.lead.count({ where: { tenantId, isConverted: true, convertedAt: { gte: startDate } } }),
    database_default.lead.groupBy({
      by: ["stageId"],
      where: { tenantId },
      _count: { _all: true },
      _sum: { estimatedValue: true }
    }),
    database_default.lead.groupBy({
      by: ["source"],
      where: { tenantId },
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
    where: { tenantId, isConverted: true, convertedAt: { gte: startDate } },
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
  return {
    leads: {
      total: totalLeads,
      new: newLeads,
      converted: convertedLeads,
      byStage: leadsByStageEnriched,
      bySource: leadsBySource.map((s) => ({ source: s.source, count: s._count._all })),
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
  const oneYearAgo = (0, import_date_fns2.subMonths)(now, 12);
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
    const summary = await getAnalyticsSummary(tenantId, period);
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
var router14 = (0, import_express14.Router)();
router14.get("/summary", authGuard_default, getSummary);
router14.get("/heatmap", authGuard_default, getHeatmap);
var analytics_routes_default = router14;

// src/modules/leadScoring/leadScoring.routes.ts
var import_express15 = require("express");

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
var router15 = (0, import_express15.Router)();
router15.use(authGuard_default);
router15.get("/rules", asyncHandler_default(LeadScoringController.getRules));
router15.put("/rules", asyncHandler_default(LeadScoringController.updateRules));
router15.post("/rules/reset", asyncHandler_default(LeadScoringController.resetRules));
var leadScoring_routes_default = router15;

// src/modules/emailTemplates/emailTemplate.routes.ts
var import_express16 = require("express");

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
var router16 = (0, import_express16.Router)();
router16.use(authGuard_default);
router16.get("/", asyncHandler_default(EmailTemplateController.listTemplates));
router16.post("/", asyncHandler_default(EmailTemplateController.createTemplate));
router16.get("/:id", asyncHandler_default(EmailTemplateController.getTemplate));
router16.patch("/:id", asyncHandler_default(EmailTemplateController.updateTemplate));
router16.delete("/:id", asyncHandler_default(EmailTemplateController.deleteTemplate));
router16.post("/:id/preview", asyncHandler_default(EmailTemplateController.previewTemplate));
var emailTemplate_routes_default = router16;

// src/app.ts
var app = (0, import_express17.default)();
app.use((0, import_helmet.default)());
app.use(import_express17.default.json());
app.use(import_express17.default.urlencoded({ extended: true }));
app.use((0, import_cookie_parser.default)());
var allowedOrigins = [env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5174"];
app.use((0, import_cors.default)({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
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
app.use("/api-docs", import_swagger_ui_express.default.serve, import_swagger_ui_express.default.setup(swagger_default));
app.use("/api/auth", auth_routes_default);
app.use("/api/rbac", rbac_routes_default);
app.use("/api/tenants", tenant_routes_default);
app.use("/api/pipeline-stages", stage_routes_default);
app.use("/api/companies", company_routes_default);
app.use("/api/contacts", contact_routes_default);
app.use("/api/leads", lead_routes_default);
app.use("/api/deals", deal_routes_default);
app.use("/api/tasks", task_routes_default);
app.use("/api/communications", communication_routes_default);
app.use("/api/products", product_routes_default);
app.use("/api/activities", activity_routes_default);
app.use("/api/proposals", router13);
app.use("/api/public/proposals", publicRouter);
app.use("/api/analytics", analytics_routes_default);
app.use("/api/lead-scoring", leadScoring_routes_default);
app.use("/api/email-templates", emailTemplate_routes_default);
app.use(notFound_default);
app.use(errorHandler_default);
var app_default = app;

// src/index.ts
var index_default = app_default;
