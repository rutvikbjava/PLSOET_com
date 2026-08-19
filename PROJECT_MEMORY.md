# EduSphere AI — Project Memory

> Long-term durable memory. Do not use this file as a chat transcript.
> Update only with information that a future implementation AI needs to know.

## Project Identity

- **Project:** EduSphere AI
- **Product:** Secure digital workflow automation for higher education
- **Architecture target:** SaaS + modular services
- **Primary backend platform:** Supabase
- **Primary frontend framework:** Next.js (React-based, TypeScript)
- **Deployment target:** Vercel
- **PRD version:** 1.0
- **PRD date:** 2026-08-19
- **Repository initialized:** 2026-08-19

## Product Principle

EduSphere AI investigates whether institutional approval workflows can be generated from document context while preserving mandatory authorization and institutional policy constraints.

The authoritative sequence is:

`Context → Candidate Workflow → Policy Validation → Execution`

**AI recommendations must never override mandatory policy rules.**

## PRD Scope

### In scope
- context-aware workflow generation
- policy validation
- institutional approval processes
- document routing
- e-signatures
- audit trails
- notifications
- academic workflows
- administrative workflows
- dashboards and analytics

### Out of scope
- student personal-data management
- LMS
- grade management
- admissions
- financial transactions
- broad third-party integrations beyond basic authentication

## Target Research Metrics

These are **research targets**, not claims of achieved performance:

- Processing-time reduction: 30–50%
- Approval-step reduction: 20–40%
- Policy compliance: 100%
- Workflow validity: >95%

## Architecture Decisions

| ID | Decision | Status | Date |
|---|---|---|---|
| DEC-001 | Supabase is the primary managed backend platform | Confirmed | 2026-08-19 |
| DEC-002 | Vercel is the web deployment target | Confirmed | 2026-08-19 |
| DEC-003 | Authorization is enforced server-side and through database RLS | Mandatory | 2026-08-19 |
| DEC-004 | AI-generated workflows are advisory until policy validation passes | Mandatory | 2026-08-19 |
| DEC-005 | Database changes use versioned migrations | Mandatory | 2026-08-19 |
| DEC-006 | Next.js 14+ with App Router for production React framework | Confirmed | 2026-08-19 |
| DEC-007 | TypeScript strict mode for all code | Mandatory | 2026-08-19 |
| DEC-008 | Supabase MCP server integrated for database operations | Confirmed | 2026-08-19 |

## Technical Memory

### Framework Selection (DEC-006)
**Chosen:** Next.js 14+ with App Router

**Reasons:**
- Production-grade React framework optimized for Vercel
- Server Components for secure server-side operations
- Built-in API routes for backend logic
- Excellent TypeScript support
- Strong Supabase integration patterns
- Server Actions for secure mutations
- Streaming and progressive enhancement

### Identity and Tenancy Model
To be finalized during implementation (EDU-005, EDU-007).

Initial concept:
- Multi-tenant by institution/organization
- Department hierarchy within institutions
- User profiles with institutional context
- RLS-enforced tenant isolation

### Roles from PRD Examples
- Faculty
- HOD (Head of Department)
- COE (Controller of Examinations)
- Principal
- Admin Staff

**Note:** These are baseline examples from the PRD and must NOT automatically be treated as the complete institutional authorization model. Exact permission matrix must be explicitly designed and tested.

### Core Workflow Entities
Likely database concepts:
- institution/organization
- user/profile
- department
- document
- document metadata/context
- policy/rule
- workflow definition/template
- workflow instance
- workflow step/stage
- approval/action
- signature
- notification
- audit event

These are conceptual until confirmed by implementation in EDU-005.

### Supabase Integration
- HTTP MCP server configured: `https://mcp.supabase.com/mcp?project_ref=fnxjnfhdhlzbwkisuuzf`
- Features enabled: docs, account, database, debugging, development, functions, branching
- Configuration location: `.kiro/settings/mcp.json`
- Project ref: `fnxjnfhdhlzbwkisuuzf`

## Current Implementation State

**Repository status:** Initialized but no application code exists yet.

**Completed:**
- State file system established
- AI development protocol documented
- Supabase MCP integration configured
- Task.md specifications reviewed

**Not yet started:**
- Application bootstrap
- Database schema
- Authentication
- UI components
- All feature implementation

## Important Research Constraints

The PRD describes research/prototype development. Do not represent the system as scientifically validated until controlled experiments are actually completed.

The PRD identifies institutional workflow data collection, literature-gap analysis, prior-art search, prototype development, and experimental evaluation as different stages.

**Software implementation ≠ research validation.**

## State File Protocol

Related records:
- Task completion → `PROGRESS.md`
- Detailed activity/change → `PROJECT_CONTEXT.md`
- Errors and solutions → `ERROR_LOG.md`
- Durable architectural lessons → this file

## Open Decisions

Decisions requiring explicit resolution in future tasks:

- Exact Next.js version and dependencies (EDU-003)
- Exact Supabase schema design (EDU-005)
- Tenancy enforcement strategy (EDU-007)
- Detailed role/permission matrix (EDU-007)
- Document storage strategy (Supabase Storage vs. alternatives) (EDU-009)
- Signature implementation (provider selection, legal compliance) (EDU-014)
- Notification providers (email, in-app, push) (EDU-015)
- Workflow graph representation format (EDU-011, EDU-012)
- AI provider/model for context analysis (EDU-010)
- Policy rule representation (declarative DSL vs. code) (EDU-011)
- Audit immutability strategy (database-level vs. append-only design) (EDU-016)
- Analytics implementation approach (EDU-017)
- CI/CD pipeline strategy (EDU-018)

## Lessons Learned

None yet. This section will be updated as implementation progresses and errors are resolved.

## Dependencies

### Required Environment Variables
To be documented when implemented:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- Additional variables as needed

### External Services
- Supabase (database, auth, storage)
- Vercel (deployment)
- AI provider (TBD - EDU-010)
- Email provider (TBD - EDU-015)
- Signature provider (TBD - EDU-014)
