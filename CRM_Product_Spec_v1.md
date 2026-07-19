# Nexus CRM — Product Specification v1.0
**Purpose:** This document is the source of truth for the dev team to (a) audit what's currently built on staging against defined requirements, and (b) build remaining Phase 1 scope. Every item below should be marked ✅ Built / ⚠️ Partial / ❌ Missing during the audit pass.

**Status:** Draft for dev review
**Owner:** [Founder name]
**Last updated:** [date]

---

## 1. Product Positioning (context for devs — not a build item)

Multi-tenant B2B sales CRM, horizontal across industries via configurable pipeline stages and custom fields. Primary competitive target: SMB/mid-market segment currently served by Zoho CRM, Freshsales, Kylas, Salesmate, Groweon in India.

**Open strategic question, flagged for awareness:** whether this is truly domain-agnostic or has an initial vertical lean (current seed data is coworking/real-estate-flavored). This does not block dev work on Phase 1 core flow, but will affect default field naming and onboarding templates later — do not hardcode vertical-specific field names anywhere in the core schema.

---

## 2. Roles & Permissions (RBAC)

### 2.1 System roles (fixed, non-editable)
- `admin` — full access, all resources, all actions
- `salesManager` — elevated access, team-level visibility, stage-skip override capability (see §4.3)
- `salesRep` — standard access, own-record + assigned-record scope
- `viewer` — read-only across permitted resources

### 2.2 Permission matrix
For each role × each resource (Leads, Deals, Contacts, Companies, Tasks, Communications, Products, Proposals, Reports, Settings), define: Create / Read / Update / Delete / Export.

**Acceptance criteria:**
- [ ] Matrix is enforced server-side, not just hidden in UI (verify: attempt a disallowed action via direct API call as a lower-privilege role, confirm 403)
- [ ] `viewer` role cannot trigger Export on any resource unless explicitly granted
- [ ] Permission changes take effect without requiring re-login

**Open question for dev team:** confirm current implementation — is this enforced at the API layer or only conditionally rendered in the frontend? This must be API-layer enforced before any external users are onboarded.

---

## 3. Core Entities

- Lead
- Contact
- Company
- Deal
- Task
- Communication
- Product
- Proposal

All entities are tenant-scoped (multi-tenant isolation must be verified — no cross-tenant data leakage under any role).

---

## 4. Lead Management

### 4.1 Lead creation
Required fields: Title, Pipeline Stage, Urgency/Priority, Linked Contact, Estimated Value + Currency, Target Close Date, Acquisition Source, Owner Assignment, Marketing Campaign (optional), Tags.

**Copy fix required (flagged in UI review, see §9):** rename field labels and buttons to plain sales language before this ships to any real customer:
- "TITLE ENTRY" → "Lead Title"
- "URGENCY LEVEL" → "Priority"
- "ACQUISITION SOURCE" → "Source"
- "OWNER ASSIGNMENT" → "Assigned To"
- "INTELLIGENCE SUMMARY" → "Notes"
- "Initialize Lead" (submit button) → "Save Lead" or "Create Lead"
- "ABANDON" (cancel button) → "Cancel"

### 4.2 Lead editing
- [ ] Confirm: full edit capability exists for all fields set at creation (stage, source, owner, value, priority, contact link)
- [ ] Confirm: edit is accessible in ≤2 clicks from list/table/kanban view (not buried in a sub-menu)
- [ ] Edits write to the activity/audit trail (who changed what, when)

### 4.3 Pipeline stage configuration & stage-skip logic
- Lead stages and Deal stages are separately configurable per tenant (already confirmed built — verify still functions correctly)
- **New setting required:** Org-level toggle in Settings → Pipeline Stages: "Allow stage skipping" (boolean, admin-only, default: off)
  - When ON: `salesManager` and `admin` roles may move a lead non-sequentially between stages; `salesRep` cannot (RBAC-gated)
  - When OFF: all roles must move leads sequentially, one stage at a time
  - **Toggling OFF does not retroactively change leads already in a skipped state** — those leads remain as-is; the restriction applies only to future transitions
  - Setting key should be named to allow future extension to per-stage granularity without a schema-breaking change (e.g. `stageSkipPolicy: { mode: "global", ... }` rather than a flat boolean, to leave room for `mode: "perStage"` later)

**Data integrity requirement — critical, do not skip:**
- [ ] Create an immutable `stage_transitions` log, separate from the lead's current-stage field. Every transition writes: `lead_id, from_stage, to_stage, actor_id, timestamp, is_skip_override (bool), skipped_stages (array)`
- [ ] This log is the source of truth for both (a) the visible activity timeline on the lead, and (b) funnel/conversion reporting — never calculate reports directly off the current-stage field alone
- [ ] Any skip-override transition displays a visible badge on the lead in table/kanban view (e.g. "⚡ Fast-tracked") — not just buried in an activity log
- [ ] A skip-override transition counts as a "touch" for SLA/auto-reassignment purposes (see §4.5) — confirm this interaction is handled, it's an easy miss

### 4.4 Lead deduplication & merge
- Dedup key: normalized phone number (strip spaces, dashes, enforce consistent country code format before comparison — raw string matching will produce false negatives)
- **Do not auto-merge.** On a new inbound submission matching an existing lead's normalized phone number:
  - Owner remains unchanged (sticky)
  - Existing fields are NOT overwritten
  - New inbound data is appended as a new touchpoint/activity entry (e.g. "New inbound touchpoint via Web Form — [date]")
  - Lead's `last_updated` timestamp bumps, moving it to the top of default list sort
- [ ] Edge case: confirm behavior when the same phone number legitimately belongs to two different real leads (e.g. shared company reception line) — recommend flagging as "possible duplicate" for manual review rather than blind auto-append, or at minimum make this reviewable/reversible by an admin

### 4.5 Auto-reassignment on SLA breach
- Configurable threshold in Settings, admin-editable, default: 24 working hours
- **Define "untouched" precisely before building:** does opening/viewing the lead count as "touched," or does it require a logged interaction (call, email, WhatsApp, note, stage change)? Recommend: require a logged interaction, not just a view, or reps will game the metric
- On breach: lead auto-reassigns to [defined fallback logic — round robin? manager-defined next rep? — needs decision from product owner]
- [ ] Reassignment event writes to the lead's activity timeline visibly: "Auto-reassigned from [Rep A] to [Rep B] — 24hr SLA breach"
- [ ] A skip-override or any logged interaction resets the SLA clock (see §4.3 interaction note)

### 4.6 Source & campaign attribution
- Source enum (already built, confirm list matches business need): Manual, Web Form, Import CSV, Inbound Email, Referral, Social Media, Cold Outreach, Event, AI Agent, Other
- Source is linked to Campaign at creation
- **Reporting attribution rule: first-touch.** The lead's primary reported source = the source of its *original* creation touchpoint, not the most recent. Full touchpoint history remains visible on the lead detail view regardless of what the summary report attributes.
- [ ] Confirm source is not editable retroactively in a way that overwrites first-touch history — new touches append, they don't replace

---

## 5. Lead → Deal Conversion

This is flagged as the highest-risk gap in the current build — verify carefully.

### 5.1 Trigger
- [ ] Explicit "Convert to Deal" action exists on a lead (not a manual re-create-from-scratch workflow)
- [ ] Conversion is gated to specific stage(s) — recommend: only allowed from "Qualified" or later, not from "New." Define exact gating stage(s) with product owner.

### 5.2 Data carried over automatically
- [ ] Linked Contact
- [ ] Linked Company
- [ ] Estimated Value (pre-filled, editable post-conversion)
- [ ] Source + Campaign (critical — this must survive conversion for source-level ROI reporting to function end-to-end)
- [ ] Notes/Intelligence Summary
- [ ] Communications history (visible from the Deal record, not orphaned back on the dead lead)
- [ ] Owner (defaults to same rep, reassignable)

### 5.3 Data that should NOT carry over
- [ ] Deal stage starts at the first Deal-pipeline stage — does NOT inherit the lead's last stage
- [ ] Priority/urgency mapping — decide explicitly whether lead priority maps to a deal field or resets; do not leave this undefined in code

### 5.4 Post-conversion state
- [ ] Original lead is marked with a terminal status (e.g. "Converted" / "Won") — not left in an ambiguous active state
- [ ] **Required:** Deal record stores `converted_from_lead_id` as a foreign key — this is mandatory for audit traceability and for the Lead→Deal conversion rate metric in Reporting to be provable, not just inferred from separately filtered lists
- [ ] A filtered "Converted Leads" list view is a nice-to-have on top of the FK — not a substitute for it

---

## 6. Reporting / Intelligence Module

Current build already includes: revenue won, win rate, conversion rate, avg deal value, leads-by-source chart, lead funnel, revenue growth trend, deals-by-stage, revenue forecast (expected/weighted/won/gap-to-target), team leaderboard, activity heatmap. This is a strength — extend it, don't rebuild it.

### 6.1 New requirements
- [ ] **Funnel integrity split:** report two conversion numbers, not one — "Full Pipeline" (all leads regardless of stage-skip history) and "Verified Funnel" (only sequential, non-skipped transitions). Default view shows Full Pipeline; toggle to Verified Funnel for clean data.
- [ ] **Source-level ROI:** which acquisition source converts to actual won revenue, not just lead count — uses first-touch attribution per §4.6
- [ ] **Report levels:** confirm all of the following are (or will be) filterable — organization level, team level, individual rep level, source level, lead-stage level
- [ ] **Monthly lost-leads digest:** scheduled report/notification at start of each month listing all leads marked Lost in the prior month, for re-engagement outreach. Low complexity — this is a saved filter + scheduled digest, not a new module.

### 6.2 Data integrity dependency
Reporting accuracy depends entirely on §4.3's `stage_transitions` log and §5.4's `converted_from_lead_id` FK being correctly implemented. Do not build reporting features on top of incomplete data logging — verify the logging layer first.

---

## 7. Notifications

- [ ] SLA breach / auto-reassignment notifications (functional requirement, Phase 1)
- [ ] Task due-date reminders
- [ ] **Nice-to-have, not Phase 1:** motivational/gamified notification tone (Hinglish-style), must be toggleable per org and per user if built — never hardcode tone, this can read as unprofessional in some customer segments and well-received in others

---

## 8. Integrations

- [ ] **WhatsApp integration** — Phase 1, table-stakes feature, competitors already have this. Scope: at minimum, log WhatsApp conversations automatically into the Communications timeline rather than requiring manual entry.
- **AI Meeting Note-taker** — Phase 2, not Phase 1. When scoped: must include an explicit consent/disclosure step before joining and recording any call ("Recording and AI notes are on for this call"). This is a compliance requirement, not optional polish.
- **AI calling for lead qualification** — do not build in-house at this stage. Evaluate third-party API integration or defer to a later paid add-on.

---

## 9. UI / Design Fixes (from staging review — apply regardless of Phase 1 feature work)

- [ ] **Currency consistency bug:** Deals page summary cards render `$` while table rows render `₹` for the same records. This must resolve to a single consistent currency display logic tied to the org's Default Currency setting.
- [ ] **Companies table:** "Country" column renders blank (`—`) for all seeded records — confirm whether this is a data-seeding gap or a broken field mapping
- [ ] Form/button copy rewrite per §4.1 — apply the same plain-language standard across all modules (Deals, Contacts, Companies, Products, Proposals), not just Leads
- [ ] Brand naming consistency — login screen, workspace badge, and any other surface should display one consistent product name (currently inconsistent — out of scope for dev to decide the name, but flag any hardcoded instances found)

---

## 10. Out of Scope for This Phase

- AI-based lead qualification calling
- Deep AI note-taker beyond basic Phase 2 scoping
- Per-stage (as opposed to global) stage-skip permissions — reserve the setting schema for this, do not build it now
- Hinglish/gamified notifications beyond a togglable stub, if time allows

---

## 11. Open Questions for Product Owner (not dev-blocking, but needs decisions before final QA)

1. Final vertical/ICP positioning — affects default field naming conventions in future onboarding templates
2. Exact gating stage(s) for Lead→Deal conversion eligibility
3. Fallback assignment logic for auto-reassignment (round robin vs. manager-defined)
4. Final brand name to apply across all surfaces

---

## 12. QA Checklist Summary (for dev self-audit before handoff)

Mark each: ✅ Built and verified / ⚠️ Partial / ❌ Missing

- [ ] RBAC enforced server-side across all resources
- [ ] Lead create + edit fully functional, ≤2 clicks to edit
- [ ] Stage-skip toggle + RBAC gating + audit log + visual badge
- [ ] `stage_transitions` immutable log implemented
- [ ] Phone-number dedup with normalization, additive merge (no overwrite)
- [ ] SLA auto-reassignment with defined "touched" logic + audit trail
- [ ] First-touch source attribution surviving multi-touchpoint updates
- [ ] Lead→Deal conversion action exists, gated by stage
- [ ] All specified fields carry over on conversion; deal stage starts fresh
- [ ] `converted_from_lead_id` FK implemented
- [ ] Lead marked terminal/converted post-conversion, no dangling duplicate
- [ ] Full Pipeline vs Verified Funnel reporting toggle
- [ ] Monthly lost-leads digest
- [ ] Currency display consistency fixed
- [ ] Form copy rewritten across all modules
