# EduSphere AI — Project Memory

> Long-term durable memory. Do not use this file as a chat transcript.
> Update only with information that a future implementation AI needs to know.

## Project Identity

- Project: EduSphere AI
- Product: Secure digital workflow automation for higher education
- Architecture target: SaaS + modular services
- Primary backend platform: Supabase
- Deployment target: Vercel
- PRD version: 1.0
- PRD date: 2026-08-19

## Product Principle

EduSphere AI investigates whether institutional approval workflows can be generated from document context while preserving mandatory authorization and institutional policy constraints.

The authoritative sequence is:

`Context → Candidate Workflow → Policy Validation → Execution`

AI recommendations must never override mandatory policy rules.

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

- Processing-time reduction: 30–50%
- Approval-step reduction: 20–40%
- Policy compliance: 100%
- Workflow validity: >95%

These are research targets, not claims of achieved performance.

## Architecture Decisions

| ID | Decision | Status |
|---|---|---|
| DEC-001 | Supabase is the primary managed backend platform | Planned |
| DEC-002 | Vercel is the web deployment target | Planned |
| DEC-003 | Authorization is enforced server-side and through database RLS | Mandatory |
| DEC-004 | AI-generated workflows are advisory until policy validation passes | Mandatory |
| DEC-005 | Database changes use versioned migrations | Mandatory |

## Technical Memory

### Identity and tenancy
To be finalized during implementation. Prefer institution/organization tenancy if required by the product model.

### Roles from PRD examples
- Faculty
- HOD
- COE
- Principal
- Admin Staff

Exact permission matrix must be explicitly designed and tested.

### Core workflow entities
Likely concepts:
- organization/institution
- user/profile
- department
- document
- document metadata/context
- policy
- workflow definition
- workflow instance
- workflow step
- approval/action
- signature
- notification
- audit event

These are conceptual until confirmed by implementation.

## Current Implementation State

No production implementation has been verified yet.

Current known state:
- PRD reviewed
- architecture direction identified
- implementation workflow/state-file protocol established
- codebase status: not yet verified

## Important Research Constraints

The PRD describes research/prototype development. Do not represent the system as scientifically validated until controlled experiments are actually completed.

The PRD identifies institutional workflow data collection, literature-gap analysis, prior-art search, prototype development, and experimental evaluation as different stages.

## State File Protocol

Related records:
- Task completion → `PROGRESS.md`
- Detailed activity/change → `PROJECT_CONTEXT.md`
- Errors and solutions → `ERROR_LOG.md`
- Durable architectural lessons → this file

## Open Decisions

- exact frontend framework/version
- exact Supabase schema
- tenancy model
- role/permission matrix
- document storage strategy
- signature implementation
- notification providers
- workflow graph representation
- AI provider/model
- policy rule representation
- audit immutability strategy
- analytics implementation
- CI/CD strategy
