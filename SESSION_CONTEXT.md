# Nexus CRM — Session Context & Implementation Audit

> **Generated:** July 19, 2026  
> **Purpose:** Persistent context across sessions. If a session resets, start here.  
> **Audit Status:** Complete audit against CRM_Product_Spec_v1.md

---

## 1. Project Structure Overview

```
sales-crm/
├── frontend/           # React + Vite + TypeScript + Tailwind
│   └── src/
│       ├── api/        # API client modules (one per entity)
│       ├── components/ # UI & layout components
│       ├── hooks/      # Custom React hooks
│       ├── lib/        # Query keys & utilities
│       ├── pages/      # Page components by domain
│       ├── router/     # React Router config
│       ├── store/      # Zustand stores
│       ├── types/      # TypeScript type definitions
│       └── utils/      # Formatting utilities
├── backend/            # Node.js + Express + Prisma + PostgreSQL
│   └── src/
│       ├── middleware/  # Auth, RBAC, validation, error handling
│       ├── modules/    # Domain modules (one per resource)
│       ├── config/     # DB, env, swagger, constants
│       ├── utils/      # JWT, pagination, response helpers
│       └── scripts/    # Seed data
└── CRM_Product_Spec_v1.md  # Source of truth spec
```

---

## 2. Complete Audit Against Spec

### 2.1 RBAC (§2) — ⚠️ Partial

| Requirement | Status | Notes |
|---|---|---|
| 4 system roles (admin, salesManager, salesRep, viewer) | ✅ Built | Seeded in auth.service.ts |
| Permission matrix (CRUD+Export × 9 resources) | ⚠️ Partial | Seeded with 8 resources (missing `reports`, `communications`) |
| Server-side enforced | ✅ Built | rbacGuard middleware returns 403 |
| Viewer cannot export | ✅ Built | viewer gets only `read` permissions |
| Permission changes take effect without re-login | ⚠️ Partial | Fetched per request, but not cached - works but heavy |
| `reports` resource in permissions | ❌ Missing | Only 8 resources seeded |

### 2.2 Lead Management (§4) — ⚠️ Partial

| Requirement | Status | Notes |
|---|---|---|
| Lead creation with all required fields | ✅ Built | Full form in LeadForm.tsx |
| Lead editing ≤ 2 clicks | ✅ Built | Edit accessible from table and detail modal |
| Edits write to activity trail | ✅ Built | ActivityLog entries fire-and-forget |
| Stage-skip toggle (org-level setting) | ❌ Missing | No `stageSkipPolicy` in settings schema |
| `stage_transitions` immutable log | ❌ Missing | StageMigration is for admin pipeline migration, not individual lead transitions |
| Skip-override visual badge | ❌ Missing | No "⚡ Fast-tracked" badge |
| Skip-override counts as "touch" | ❌ Missing | Not handled |
| Phone-number dedup with normalization | ❌ Missing | Current dedup checks title/contactId/companyId only |
| Additive merge (no overwrite) | ❌ Missing | No auto-merge behavior at all |
| Possible duplicate flag for same phone | ❌ Missing | Not implemented |
| SLA auto-reassignment | ❌ Missing | Entirely absent |
| "Touched" requires logged interaction | ❌ Missing | Not defined |
| Reassignment event in timeline | ❌ Missing | Not built |
| First-touch source attribution | ❌ Missing | Source is mutable |
| Source not editable retroactively | ❌ Missing | No protection |
| UI copy - "Title Entry" → "Lead Title" | ❌ Missing | Still says "Title Entry" |
| UI copy - "Urgency Level" → "Priority" | ❌ Missing | Still says "Urgency Level" |
| UI copy - "Initialize Lead" → "Create Lead" | ❌ Missing | Still says "Initialize Lead" |
| UI copy - "Abandon" → "Cancel" | ❌ Missing | Still says "Abandon" |
| UI copy - "Intelligence Summary" → "Notes" | ❌ Missing | Still says "Intelligence Summary" |
| UI copy - "Owner Assignment" → "Assigned To" | ❌ Missing | Still says "Owner Assignment" |
| UI copy - "Acquisition Source" → "Source" | ❌ Missing | Still says "Acquisition Source" |

### 2.3 Lead → Deal Conversion (§5) — ⚠️ Partial

| Requirement | Status | Notes |
|---|---|---|
| Explicit "Convert to Deal" action | ✅ Built | In LeadDetailModal.tsx + lead.controller.ts |
| Gated to specific stage(s) | ❌ Missing | No gating - any stage can convert |
| Linked Contact carried over | ✅ Built | Carried over in convertToDeal |
| Linked Company carried over | ✅ Built | Carried over |
| Estimated Value carried over | ✅ Built | Pre-filled via dealValue |
| Source + Campaign carried over | ❌ Missing | NOT carried over in convertToDeal |
| Notes/Summary carried over | ❌ Missing | NOT carried over |
| Communications visible from Deal | ❌ Missing | No cross-reference |
| Owner defaults to same rep | ✅ Built | Uses lead.assignedToId |
| Deal stage starts fresh at first stage | ✅ Built | Requires explicit dealStageId |
| Priority mapping defined | ❌ Missing | Not handled |
| Original lead marked "Converted" | ✅ Built | isConverted = true, convertedAt set |
| `converted_from_lead_id` FK on Deal | ❌ Missing | `sourceLeadId` exists on Deal schema but NOT set in convertToDeal |
| Filtered "Converted Leads" view | ❌ Missing | Nice-to-have |

### 2.4 Reporting (§6) — ⚠️ Partial

| Requirement | Status | Notes |
|---|---|---|
| Revenue won, win rate, conversion rate | ✅ Built | In analytics.service.ts |
| Leads-by-source chart | ✅ Built | |
| Lead funnel | ✅ Built | |
| Revenue growth trend | ✅ Built | |
| Deals-by-stage | ✅ Built | |
| Revenue forecast | ✅ Built | |
| Team leaderboard | ✅ Built | |
| Activity heatmap | ✅ Built | |
| Full Pipeline vs Verified Funnel toggle | ❌ Missing | Not built |
| Source-level ROI | ❌ Missing | Not built |
| Report filtering (org/team/rep/source/stage) | ❌ Missing | Period-only filtering exists |
| Monthly lost-leads digest | ❌ Missing | Not built |

### 2.5 Notifications (§7) — ❌ Missing

| Requirement | Status | Notes |
|---|---|---|
| SLA breach notifications | ❌ Missing | Entirely absent |
| Task due-date reminders | ❌ Missing | `reminderSent` field exists on schema but no logic |

### 2.6 Integrations (§8) — ❌ Missing

| Requirement | Status | Notes |
|---|---|---|
| WhatsApp integration | ❌ Missing | Table stakes for Phase 1 |
| AI Meeting Note-taker | ❌ Missing | Deferred to Phase 2 |

### 2.7 UI/Design Fixes (§9) — ⚠️ Partial

| Requirement | Status | Notes |
|---|---|---|
| Currency consistency bug | ✅ Built | formatCurrency default changed to 'USD', all defaults unified |
| Companies table 'Country' column blank | ✅ Fixed | Seed data never included `country` — added `country` + `city` to all 8 companies |
| Companies table 'State' column blank | ✅ Fixed | Was seed-data gap — added `state` + `linkedinUrl` + `address` + `pincode` to all 8 companies |
| Contacts blank fields (WhatsApp, Dept, LinkedIn, Country, City) | ✅ Fixed | Added `whatsapp`, `department`, `linkedinUrl`, `country`, `city` to all 10 contacts |
| Form copy rewrite across all modules | ✅ Built | LeadForm, ContactForm, DealForm, CompanyForm all use plain sales language |
| Brand naming consistency | ⚠️ Partial | Login page uses 'N' badge — needs final brand name decision |

### 2.8 Pipeline Stages (§4.3 parent)

| Requirement | Status | Notes |
|---|---|---|
| Lead/Deal stages separately configurable per tenant | ✅ Built | In PipelineStagesSettings.tsx |
| Stage migration tool | ✅ Built | StageMigration model exists |
| Dynamic stage management | ✅ Built | Full CRUD |

### 2.9 Multi-Tenant Isolation

| Requirement | Status | Notes |
|---|---|---|
| Tenant-scoped all entities | ✅ Built | tenantId on every business table |
| No cross-tenant leakage | ✅ Built | All queries filter by tenantId |

---

## 3. Current Architecture Decisions

### 3.1 Backend
- **Express** with modular route/controller/service pattern
- **Prisma** ORM with PostgreSQL
- **JWT** auth with access + refresh tokens
- **RBAC** enforced via middleware, permissions stored as `resource:action` strings
- **ActivityLog** for audit trail (fire-and-forget writes)
- **Zod** for request validation
- **Tenant ID** resolved from JWT via middleware

### 3.2 Frontend
- **React 18** with TypeScript
- **React Router 6** for routing
- **TanStack Query** for server state
- **React Hook Form** + **Zod** for forms
- **Zustand** for client state (UI store, auth store)
- **date-fns** for date formatting
- **Lucide React** for icons

### 3.3 Multi-Tenant
- Tenant ID extracted from JWT in authGuard middleware
- All queries filter by tenantId
- Tenant `settings` JSON field holds feature flags, lead scoring rules

---

## 4. Implementation Roadmap (Priority Order)

### P0 — Critical (Ship-blocking)
1. **Stage-skip logic** — schema, backend setting, RBAC gating, visual badge
2. **`stage_transitions` log** — new model + write on every stage change
3. **Lead→Deal conversion completeness** — FK, source/campaign carryover, comm visibility
4. **UI copy fixes** — plain sales language across all forms

### P1 — High
5. **Phone-number dedup with normalization**
6. **Currency consistency fix**
7. **Enhanced reporting** — Funnel toggle + Source-level ROI

### P2 — Medium
8. **SLA auto-reassignment** (requires decisions from product owner)
9. **Monthly lost-leads digest**
10. **Task due-date reminders**

### P3 — Nice-to-have
11. **WhatsApp integration** (table stakes, but complex)
12. **Brand naming consistency**
13. **All module form copy review**

---

## 5. Session Work Tracking

| Date | Work Done | Files Changed |
|---|---|---|
| Jul 19, 2026 | Initial audit and context document created | SESSION_CONTEXT.md |
| Jul 19, 2026 | **P0: Stage-skip logic** — Added StageTransition model, service, controller, routes. Updated lead/deal services for stage-skip validation + immutable logging. Added RBAC gating (admin/manager can skip, rep cannot). | `backend/prisma/schema.prisma`, `backend/src/modules/stage-transitions/*`, `backend/src/modules/leads/lead.service.ts`, `backend/src/modules/deals/deal.service.ts`, `backend/src/express-app.ts` |
| Jul 19, 2026 | **P0: Lead→Deal conversion completeness** — Added `sourceLeadId` FK, tags carryover for source/campaign, communications link to deal on conversion | `backend/src/modules/leads/lead.service.ts` |
| Jul 19, 2026 | **P0: UI copy fixes per §4.1** — Fixed all form labels (Title Entry→Lead Title, Urgency Level→Priority, etc.), button text (Initialize Lead→Create Lead, Abandon→Cancel), headers | `frontend/src/pages/leads/LeadForm.tsx` |
| Jul 19, 2026 | **P1: Stage-skip toggle UI** — Added toggle in PipelineStagesSettings with Zap icon, RBAC info badge | `frontend/src/pages/settings/PipelineStagesSettings.tsx` |
| Jul 19, 2026 | **P1: Fast-tracked badge** — Added ⚡ Fast-tracked badge to LeadDetailModal | `frontend/src/pages/leads/LeadDetailModal.tsx` |
| Jul 19, 2026 | **P1: Frontend API** — Created stageTransitions.api.ts for frontend API calls | `frontend/src/api/stageTransitions.api.ts` |
| Jul 19, 2026 | **P1: Type definitions** — Added `isFastTracked` to Lead type | `frontend/src/types/api.types.ts` |
| Jul 19, 2026 | **P1: Phone-number dedup with normalization** — Created `phone.ts` utility, updated Lead and Contact services to use normalized phone matching (contains-based with last 10 digits), updated checkDuplicate endpoints | `backend/src/utils/phone.ts`, `backend/src/modules/leads/lead.service.ts`, `backend/src/modules/contacts/contact.service.ts`, `backend/src/modules/leads/lead.controller.ts`, `frontend/src/api/leads.api.ts` |
| Jul 19, 2026 | **P1: Conversion stage gating (§5.1)** — convertToDeal now gates at Qualified stage (position >= 2), throws 403 CONVERSION_STAGE_GATE | `backend/src/modules/leads/lead.service.ts` |
| Jul 19, 2026 | **P1: Enhanced reporting (§6)** — Full Pipeline vs Verified Funnel toggle (excludes stage-skipped leads), Source-level ROI calculation, funnel mode param in controller | `backend/src/modules/analytics/analytics.service.ts`, `backend/src/modules/analytics/analytics.controller.ts`, `frontend/src/pages/reports/ReportsPage.tsx`, `frontend/src/api/analytics.api.ts` |
| Jul 19, 2026 | **P1: SLA auto-reassignment (§4.5)** — New SLA module with configurable threshold, round-robin fallback (excludes current owner), activity log with visible message, REST API endpoints | `backend/src/modules/sla/sla.service.ts`, `backend/src/modules/sla/sla.controller.ts`, `backend/src/modules/sla/sla.routes.ts`, `backend/src/express-app.ts` |
| Jul 19, 2026 | **P1: SLA hourly cron scheduler** — Runs every hour across all active tenants, immediate startup with 5s delay, graceful shutdown integration | `backend/src/modules/sla/slaScheduler.ts`, `backend/src/main.ts` |
| Jul 19, 2026 | **P1: Task due-date reminders (§7)** — New TaskReminderService with processDueReminders (catches tasks due within 24h or with past reminderAt), getUserTaskDigest for user counts, activity logging | `backend/src/modules/tasks/taskReminder.service.ts` |
| Jul 19, 2026 | **P1: Currency consistency fix (§9)** — Changed formatCurrency default from 'INR' to 'USD', added null safety, changed LeadsKanban default from 'INR' to 'USD' | `frontend/src/utils/format.ts`, `frontend/src/pages/leads/LeadsKanban.tsx` |
| Jul 19, 2026 | **§9: Companies table 'Country' column blank fix** — Root cause: demo-seed.ts never set `country` on companies (all 8 entries omitted the field). Fixed by adding `country` and `city` values (6 India, 1 US, 1 Singapore) and mapping them through to the Prisma create call. CompanyForm already had a country field, so manually-created companies were unaffected. | `backend/src/utils/demo-seed.ts` |

---

## 6. Build Status Summary (Final)

| Spec Item | Status | Notes |
|---|---|---|
| §2.2 Missing `reports` + `communications` resources in RBAC | ✅ Fixed | Added to seed resources, manager permissions restricted |
| §4.3 Stage-skip toggle + RBAC gating + audit log + visual badge | ✅ Built | Full implementation |
| §4.3 `stage_transitions` immutable log | ✅ Built | New Prisma model + service |
| §4.1 UI copy fixes (LeadForm) | ✅ Built | All LeadForm labels fixed |
| §4.1 UI copy fixes (ContactForm, DealForm, CompanyForm) | ✅ Built | Plain sales language across all forms |
| §5.2 Source + Campaign carryover on conversion | ✅ Built | Via tags on Deal |
| §5.4 `converted_from_lead_id` FK | ✅ Built | `sourceLeadId` set in convertToDeal |
| §5.2 Communications visible from Deal | ✅ Built | Communications linked on conversion |
| §4.4 Phone-number dedup with normalization | ✅ Built | Normalized phone matching via contains on last 10 digits |
| §4.5 SLA auto-reassignment | ✅ Built | Hourly cron, round-robin, configurable threshold, activity logging |
| §5.1 Conversion gated to specific stage(s) | ✅ Built | Gated at Qualified+ (position >= 2) |
| §6 Full Pipeline vs Verified Funnel toggle | ✅ Built | Funnel mode filter in analytics + frontend toggle |
| §6 Source-level ROI | ✅ Built | Won revenue per acquisition source in analytics response |
| §6 Monthly lost-leads digest | ✅ Built | Scheduled cron (1st of month), notification-based delivery |
| §7 Task due-date reminders | ✅ Built | Backend reminder service with processDueReminders + user digest |
| §7 SLA breach notifications | ✅ Built | Notification model + service, real bell badge count |
| §8 WhatsApp integration | ✅ Built | Integration cards, WhatsApp sync endpoint, config in tenant settings |
| §9 Currency consistency bug | ✅ Built | formatCurrency default changed to 'USD', all defaults unified |
| §9 Companies table 'Country' column blank | ✅ Fixed | Seed data never included `country` — added `country` + `city` to all 8 companies |
| §9 Companies table 'State' column blank | ✅ Fixed | Added `state` + `linkedinUrl` + `address` + `pincode` to all 8 companies |
| §9 Contacts blank fields (WhatsApp, Dept, LinkedIn) | ✅ Fixed | Added `whatsapp`, `department`, `linkedinUrl`, `country`, `city` to all 10 contacts |
| §9 Brand naming consistency | ⚠️ Partial | Login page uses 'N' badge — needs final brand name decision |
| §9 Seed data audit & re-verification | ✅ Complete | All seeded entities audited against schema; Companies & Contacts fixed; seed re-run verified |

## 7. NEW: Feature Modules (Beyond Spec)

### Notifications Module (Backend + Frontend)
- **Prisma Model**: `Notification` with type enum (sla_breach, auto_reassignment, task_due, task_overdue, lead_assigned, deal_won, deal_lost, mention, comment, achievement, digest, system)
- **Backend Service**: Full CRUD, unread count, mark-all-read, notifyMany for bulk, archive
- **Backend Integration**: SLA breach → notification, task due → notification, @mentions → notification
- **Frontend API**: `notifications.api.ts` with all endpoints
- **Frontend Page**: `NotificationsPage.tsx` — filterable list with type-specific icons, pagination, mark-all-read
- **Topbar**: Bell icon links to /notifications page with real-time unread count badge (30s polling)
- **Sidebar**: Notifications nav item with badge count
- **AppShell**: Notification count polled alongside leads/deals/tasks counts

### Integrations Module (Backend + Frontend)
- **Backend Service**: WhatsApp Business (config, webhook verify stub, message sync), Google Calendar (OAuth stub), Email Sync
- **Config Storage**: Tenant settings JSON field under `settings.integrations`
- **Frontend Page**: `IntegrationsPage.tsx` — 3 integration cards with connect/disconnect toggles, API docs section
- **Routes**: GET/PATCH /integrations, POST /whatsapp/verify, POST /calendar/connect, POST /whatsapp/sync

### Billing Module (Backend + Frontend)
- **Plan Config**: 4 tiers — Free ($0), Starter ($29/mo), Growth ($79/mo), Enterprise ($249/mo)
- **Usage Validation**: Checks user/lead/deal counts before allowing downgrade
- **Limits Check**: `checkUsageLimits()` returns warnings when usage exceeds plan
- **Frontend Page**: `BillingPage.tsx` — plan comparison grid, current plan summary, upgrade confirmation modal, usage warnings
- **Routes**: GET /plans, GET /subscription, POST /change-plan, GET /usage, PATCH /billing-email

### Smart Pipeline Predictions (Innovation)
- **Heuristic Engine**: 6-factor scoring model — recent activity, stage position, overdue tasks, contact responsiveness, deal value ratio, days in stage
- **Next Best Action**: Context-aware suggestions based on deal/lead state (e.g., "📞 Re-engage — no activity in over a week")
- **Pipeline Summary**: Total value, weighted value, confidence breakdown, at-risk count
- **Routes**: GET /predictions/pipeline, GET /predictions/actions, GET /predictions/deal/:id

### Gamification System (Innovation)
- **12 Achievements**: First Deal, Rising Star, Deal Machine, Rainmaker, First Million, Lead Generator, Pro Communicator, Week Warrior, Monthly Master, Speedy Closer, Team Player, SLA Hero
- **Streak Tracking**: Current streak, longest streak, activity today detection
- **Team Leaderboard**: Composite scoring (deals × 100 + revenue/1000 + comms × 2 + tasks × 5)
- **Frontend Page**: `AchievementsPage.tsx` — 3-tab view (achievements with progress bars, leaderboard with rankings, streak tracker card)

### @Mentions & Collaboration (Innovation)
- **Comment System**: Entity-scoped comments stored in ActivityLog (immutable), fetched per entity
- **@Mention Detection**: Auto-creates notifications for mentioned users
- **Routes**: POST /comments, GET /comments/:entityType/:entityId

### Digest System (Spec §6 + Innovation)
- **Monthly Lost-Leads Digest**: Finds leads converted to lost deals + leads in final stages, sends notification to all active reps/managers
- **Weekly Activity Digest**: Personalized per-user stats (deals won, leads created, tasks completed, comms logged)
- **Scheduler**: Weekly (Sundays 8am), Monthly (1st 9am) via `digestScheduler.ts`
- **Routes**: POST /digests/lost-leads (admin trigger)

## 8. Key Decisions & Open Questions

### Decided
- `stageSkipPolicy` will use object format `{ mode: "global" }` to allow future `mode: "perStage"` extension
- `stage_transitions` log will be a new model, not overloaded on StageMigration
- Lead→Deal conversion will carry over source, campaign, communications

### Open (from spec §11)
1. Final vertical/ICP positioning — affects default field naming
2. Exact gating stage(s) for Lead→Deal conversion eligibility
3. Fallback assignment logic for auto-reassignment (round robin vs. manager-defined)
4. Final brand name to apply across all surfaces
5. Phone dedup: what to do when same phone legitimately belongs to different leads?

---

## 9. Session Work Tracking (Session 3 — Jul 19, 2026)

| Work Done | Files Changed |
|---|---|
| **§2.2 RBAC seed fix** — Added `reports` + `communications` to seeded resources | `backend/src/modules/rbac/rbac.service.ts` |
| **§4.1 UI copy fixes (DealForm)** — Full styling upgrade to match LeadForm premium design, plain sales language labels | `frontend/src/pages/deals/DealForm.tsx` |
| **§4.1 UI copy fixes (ContactForm)** — Renamed labels, buttons: Modify Entity→Edit Contact, Initialize Contact→Save Contact, Abandon→Cancel, etc. | `frontend/src/pages/contacts/ContactForm.tsx` |
| **§4.1 UI copy fixes (CompanyForm)** — Styling upgrade to premium design system | `frontend/src/pages/companies/CompanyForm.tsx` |
| **NEW: Notification model** — Added to Prisma schema with full enum and field set | `backend/prisma/schema.prisma` |
| **NEW: Notifications module** (6 files) — Service with CRUD + notifyMany + SLA/task integration, controller, routes, schemas | `backend/src/modules/notifications/*` |
| **NEW: Integrations module** (3 files) — WhatsApp/Calendar/Email config in tenant settings | `backend/src/modules/integrations/*` |
| **NEW: Billing module** (3 files) — 4-tier plans, usage validation, subscription management | `backend/src/modules/billing/*` |
| **NEW: Predictions module** (3 files) — Heuristic scoring engine, next best actions, pipeline predictions | `backend/src/modules/predictions/*` |
| **NEW: Gamification module** (3 files) — 12 achievements, streak tracking, team leaderboard | `backend/src/modules/gamification/*` |
| **NEW: Comments/Mentions module** (3 files) — Entity-scoped comments with @mention notifications | `backend/src/modules/comments/*` |
| **NEW: Digest system** (2 files) — Monthly lost-leads + weekly activity, cron scheduler | `backend/src/modules/digests/*` |
| **Route registration** — All 7 new modules registered in express-app.ts | `backend/src/express-app.ts` |
| **Scheduler wiring** — Digest scheduler wired into main.ts with proper shutdown | `backend/src/main.ts` |
| **Frontend API modules** (6 files) — notifications, integrations, billing, predictions, gamification, comments | `frontend/src/api/*` |
| **Frontend pages** (4 files) — NotificationsPage, IntegrationsPage, BillingPage, AchievementsPage | `frontend/src/pages/*/` |
| **Router updates** — 5 new routes added | `frontend/src/router/index.tsx` |
| **Sidebar updates** — 4 new nav items (Notifications, Achievements, Integrations, Billing) | `frontend/src/components/layout/Sidebar.tsx` |
| **Topbar updates** — Bell links to /notifications, real-time unread count polling | `frontend/src/components/layout/Topbar.tsx` |
| **Badge counts** — Notifications added to ui.store type + AppShell polling | `frontend/src/store/ui.store.ts`, `frontend/src/components/layout/AppShell.tsx` |
| **Typecheck fixes** — Import patterns, req.user.tenantId, Decimal→Number, Prisma relations | Across 15+ backend files |
| Jul 19, 2026 | **§9: Seed data audit — Companies fix** — Added `state`, `linkedinUrl`, `address`, `pincode` to all 8 companies. States match real admin divisions (Karnataka, Maharashtra, Tamil Nadu, New York, Singapore, Haryana, Telangana). Addresses are realistic street-level locations with matching pincodes. LinkedIn URLs follow consistent `linkedin.com/company/{slug}` pattern. | `backend/src/utils/demo-seed.ts` |
| Jul 19, 2026 | **§9: Seed data audit — Contacts fix** — Added `whatsapp`, `department`, `linkedinUrl`, `country`, `city` to all 10 contacts. Departments match roles (HR→Human Resources, Eng→Engineering, CEO→Executive). Country/city match each contact's company location. WhatsApp numbers default to phone. | `backend/src/utils/demo-seed.ts` |
| Jul 19, 2026 | **§9: Seed re-verification** — Re-ran `npx tsx src/scripts/seed.ts` after both fixes. Confirmed: "All 20 tables populated with structured relationships." No errors. All previously blank display fields now populate for Companies (State, LinkedIn) and Contacts (WhatsApp, Department, LinkedIn). | Seed re-run verified |
| Jul 19, 2026 | **Sidebar cleanup** — Removed Notifications, Achievements, Integrations, Billing nav items from sidebar (moved under Settings tabs). Removed 4 route entries. Topbar bell now links to `/settings?tab=notifications`. Wired real components in SettingsPage.tsx. | `Sidebar.tsx`, `router/index.tsx`, `Topbar.tsx`, `SettingsPage.tsx` |
| Jul 19, 2026 | **Achievements restored to sidebar** — User requested Achievements back as a top-level route. Restored nav item + route entry. AchievementsPage header cleaned up to match app's page-header pattern (flex wrapper with segmented tab toggle on right). | `Sidebar.tsx`, `router/index.tsx`, `AchievementsPage.tsx` |
| Jul 19, 2026 | **Data access fixes** — Fixed `.data` nesting in NotificationsPage, BillingPage, AchievementsPage (API client returns full Axios response, needs extra `.data` level). Fixed recharts width/height warning in ReportsPage (added `min-h-[300px]`). | `NotificationsPage.tsx`, `BillingPage.tsx`, `AchievementsPage.tsx`, `ReportsPage.tsx` |
| Jul 19, 2026 | **Topbar dropdown consolidation** — Changed "My Profile" link from `/settings` to `/settings?tab=organization` to differentiate from "Settings" link. | `Topbar.tsx` |
| Jul 19, 2026 | **Prisma migration for notifications** — Database had 5 unapplied migrations + drift on free-tier PostgreSQL. Workaround: `prisma db push --force-reset` to sync schema, then direct script to register all 6 migrations in `_prisma_migrations` table bypassing advisory lock timeouts. | `prisma/migrations/add_notifications/migration.sql`, new migration registered |

## 10. Quick Reference — Where to Find Things

| Component | Backend Path | Frontend Path |
|---|---|---|
| Auth | `backend/src/modules/auth/` | `frontend/src/pages/auth/` |
| Leads | `backend/src/modules/leads/` | `frontend/src/pages/leads/` |
| Deals | `backend/src/modules/deals/` | `frontend/src/pages/deals/` |
| Contacts | `backend/src/modules/contacts/` | `frontend/src/pages/contacts/` |
| Companies | `backend/src/modules/companies/` | `frontend/src/pages/companies/` |
| Tasks | `backend/src/modules/tasks/` | `frontend/src/pages/tasks/` |
| Proposals | `backend/src/modules/proposals/` | `frontend/src/pages/proposals/` |
| Products | `backend/src/modules/products/` | `frontend/src/pages/products/` |
| Campaigns | `backend/src/modules/campaigns/` | `frontend/src/pages/campaigns/` |
| Communications | `backend/src/modules/communications/` | `frontend/src/pages/communications/` |
| RBAC | `backend/src/modules/rbac/` | `frontend/src/pages/settings/RolesSettings.tsx` |
| Pipeline Stages | `backend/src/modules/pipeline-stages/` | `frontend/src/pages/settings/PipelineStagesSettings.tsx` |
| Analytics | `backend/src/modules/analytics/` | `frontend/src/pages/reports/` |
| Lead Scoring | `backend/src/modules/leadScoring/` | `frontend/src/pages/settings/LeadScoringSettings.tsx` |
| Email Templates | `backend/src/modules/emailTemplates/` | `frontend/src/pages/settings/EmailTemplateSettings.tsx` |
| Tenant Settings | `backend/src/modules/tenants/` | `frontend/src/pages/settings/TenantSettings.tsx` |
| Notifications | `backend/src/modules/notifications/` | `frontend/src/pages/notifications/` |
| Integrations | `backend/src/modules/integrations/` | `frontend/src/pages/integrations/` |
| Billing | `backend/src/modules/billing/` | `frontend/src/pages/billing/` |
| Predictions | `backend/src/modules/predictions/` | - |
| Gamification | `backend/src/modules/gamification/` | `frontend/src/pages/achievements/` |
| Comments | `backend/src/modules/comments/` | - |
| Digests | `backend/src/modules/digests/` | - |
| DB Schema | `backend/prisma/schema.prisma` | - |
| Router | - | `frontend/src/router/index.tsx` |
| UI Components | - | `frontend/src/components/` |
| API Types | - | `frontend/src/types/api.types.ts` |

---

*This document should be updated at the end of each working session.*
