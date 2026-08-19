# EduSphere AI — Production Build Prompt Pack

## How to Use This File

Use **one prompt at a time**.

Never paste the next prompt until the current prompt has completed its acceptance criteria and updated the state files.

Every prompt assumes the AI has access to the repository.

Every prompt begins with the mandatory state-file protocol and ends with a mandatory state-file update.

---

# PROMPT 000 — Configure the AI for Production Development

You are now the lead software engineer responsible for building EduSphere AI as a production-grade web application.

Before writing code:

1. Read:
   - `01_AI_BUILD_RULES.md`
   - `PROJECT_MEMORY.md`
   - `PROGRESS.md`
   - `ERROR_LOG.md`
   - `PROJECT_CONTEXT.md`
2. Inspect the entire repository structure.
3. Inspect package manifests, lockfiles, source directories, environment examples, database migrations, configuration, tests, CI/CD configuration and documentation.
4. Treat the repository and PRD as the source of truth.
5. Do not invent completed work.
6. Do not rewrite functioning code unnecessarily.

Your implementation priorities are:

1. correctness
2. security
3. maintainability
4. testability
5. accessibility
6. performance
7. developer experience

Technology target:
- Supabase for backend services
- Vercel for deployment
- TypeScript-first implementation
- strict validation
- database migrations
- Row Level Security
- server-side authorization
- automated tests

Do not expose secrets.

Do not implement authentication or authorization only in the client.

Do not let AI-generated workflow suggestions bypass policy validation.

At the end, update:
- `PROJECT_MEMORY.md`
- `PROGRESS.md`
- `PROJECT_CONTEXT.md`
- `ERROR_LOG.md` if necessary

Do not start feature development until the repository audit is complete.

Acceptance:
- repository state understood
- existing technology identified
- missing infrastructure identified
- risks documented
- next task identified

---

# PROMPT 001 — Repository Audit

Task ID: EDU-002.

Read all state files first.

Perform a complete engineering audit:
- framework
- dependencies
- folder structure
- current routes
- current components
- database code
- Supabase configuration
- authentication
- authorization
- tests
- lint/typecheck/build
- deployment configuration
- environment variables
- security-sensitive code

Do not modify production code unless required to fix an obvious blocking issue.

Produce an implementation gap analysis mapped to `PROGRESS.md`.

Update all relevant state files.

Acceptance:
- no major repository area remains uninspected
- current implementation is documented
- next implementation task is explicit

---

# PROMPT 002 — Production Application Foundation

Task ID: EDU-003.

Read state files and inspect the repository.

Create or normalize the application foundation for production development.

Requirements:
- TypeScript strict mode
- consistent formatting/linting
- clear source structure
- environment variable validation
- reusable UI architecture
- error boundary strategy
- loading/empty/error states
- accessible navigation
- responsive layout
- production-safe logging

Do not add unnecessary libraries.

Run:
- typecheck
- lint
- tests
- production build

Update state files.

Acceptance:
- clean local build
- deterministic configuration
- no secret leakage
- foundation ready for Supabase work

---

# PROMPT 003 — Supabase Configuration

Task ID: EDU-004.

Configure Supabase integration.

Implement:
- browser-safe public configuration
- server-only configuration where required
- typed Supabase clients
- environment validation
- development/staging/production separation strategy
- migration workflow
- seed strategy for non-production development

Never expose the Supabase service-role key to client code.

Document required environment variables without writing secret values into Git.

Verify connectivity.

Update state files.

---

# PROMPT 004 — Database Schema and Migrations

Task ID: EDU-005.

Design and implement the initial normalized database schema from the PRD.

Model the concepts required for:
- institutions/organizations
- profiles/users
- departments
- documents
- document context
- policies
- workflow definitions
- workflow instances
- workflow steps
- approvals
- signatures
- notifications
- audit events

Do not blindly create every conceptual entity if the actual repository/product design proves a simpler model is better.

Requirements:
- UUIDs where appropriate
- foreign keys
- timestamps
- sensible indexes
- constraints
- explicit status enums or constrained values
- tenant boundaries
- migration files
- no destructive migration without explicit approval

Create a data-model document if needed.

Run migration validation.

Update state files.

---

# PROMPT 005 — Authentication

Task ID: EDU-006.

Implement production authentication using Supabase Auth.

Support the authentication flows required by the current product scope.

Requirements:
- secure session handling
- protected routes
- authenticated server operations
- logout
- session expiration handling
- unauthorized handling
- no authorization decisions based only on UI state

Create tests for authenticated and unauthenticated behavior.

Update state files.

---

# PROMPT 006 — Roles, Tenancy and RLS

Task ID: EDU-007.

Implement the authorization model.

Start from PRD roles:
- Faculty
- HOD
- COE
- Principal
- Admin Staff

Define explicit permissions rather than relying on role-name checks scattered throughout the application.

Implement:
- database RLS
- server-side authorization helpers
- role checks
- institution/department boundaries where applicable
- denial-by-default policies

Test:
- user can access permitted records
- user cannot access another institution
- user cannot escalate role
- user cannot bypass approval rules
- anonymous user cannot access protected data

Update state files.

---

# PROMPT 007 — Application Shell and Dashboard

Task ID: EDU-008.

Build the production application shell.

Include:
- authenticated layout
- navigation
- dashboard
- user profile area
- institution/department context
- role-aware navigation
- responsive behavior
- accessible components
- empty/loading/error states

Do not build fake functionality behind buttons.

Every visible action must either work or be clearly marked unavailable.

Update state files.

---

# PROMPT 008 — Document Upload and Metadata

Task ID: EDU-009.

Implement document ingestion.

Support the PRD's workflow around:
- document upload
- document type
- creator
- department
- scope
- purpose
- academic importance
- applicable rules
- workflow state

Use Supabase Storage only through secure access controls.

Validate file type and size.

Prevent unauthorized file access.

Store metadata separately from file objects.

Add tests for access control.

Update state files.

---

# PROMPT 009 — Context Engine Foundation

Task ID: EDU-010.

Implement the context-engine foundation.

Extract or collect:
- document type
- creator role
- department
- document scope/impact
- purpose
- academic importance
- current authority
- applicable institutional rules

Separate deterministic metadata extraction from probabilistic AI interpretation.

AI output must be structured and validated.

Never treat unvalidated model output as an authorization decision.

Add confidence/uncertainty handling where appropriate.

Update state files.

---

# PROMPT 010 — Policy Model and Validation Engine

Task ID: EDU-011.

Implement the policy representation and validation engine.

The policy engine is authoritative.

Requirements:
- mandatory approvers
- approval ordering
- role requirements
- department constraints
- scope constraints
- policy conditions
- conflict detection
- explainable validation results

A candidate workflow is invalid if it violates mandatory policy.

Create deterministic tests for representative workflows:
- Department Notice → HOD
- Timetable Change → HOD
- Examination Schedule → HOD → COE → Principal
- Institutional Notice → Principal

Treat these examples as PRD-derived baseline examples, not the complete institutional policy set.

Update state files.

---

# PROMPT 011 — Candidate Workflow Generator

Task ID: EDU-012.

Implement candidate workflow generation.

Architecture:

Document
→ Context
→ Candidate workflows
→ Policy validation
→ Ranked valid candidates

The generator may use:
- deterministic rules
- graph routing
- AI assistance

But it must never directly authorize execution.

Return structured candidate workflows with:
- steps
- roles
- rationale
- estimated complexity
- policy validation result

Reject invalid candidates.

Add tests.

Update state files.

---

# PROMPT 012 — Workflow Review and Execution

Task ID: EDU-013.

Build the workflow lifecycle.

States should be explicit and transition-controlled.

Implement:
- draft
- proposed
- validated
- active
- awaiting approval
- approved
- rejected
- completed
- cancelled

Prevent invalid transitions.

Ensure the executing workflow is the policy-approved workflow.

Use transactions/idempotency where appropriate.

Update state files.

---

# PROMPT 013 — Approval and Signature Abstraction

Task ID: EDU-014.

Implement approval actions and a provider-agnostic signature abstraction.

Requirements:
- approve
- reject
- request changes
- comments/reason
- timestamp
- actor
- signature state
- verification metadata

Do not claim legal e-signature compliance unless a real compliant provider/process is implemented and verified.

Keep the provider behind an interface so it can be replaced.

Update state files.

---

# PROMPT 014 — Notifications

Task ID: EDU-015.

Implement notification infrastructure.

Support the minimum channels required by the current scope.

Create:
- notification records
- templates
- delivery status
- retry strategy
- failure logging

Do not make notifications a critical single point of failure for workflow state unless explicitly required.

Update state files.

---

# PROMPT 015 — Audit Trail

Task ID: EDU-016.

Implement a tamper-resistant application audit trail.

Record:
- actor
- action
- entity
- timestamp
- previous state where useful
- new state
- request/context metadata where appropriate

Audit events must not be editable through ordinary user workflows.

Design for later compliance review.

If blockchain is not actually necessary, do not add it merely because the PRD lists it as optional.

Update state files.

---

# PROMPT 016 — Analytics Dashboard

Task ID: EDU-017.

Implement analytics for:
- processing time
- approval steps
- workflow completion
- rejection rates
- policy violations prevented
- department-level performance
- workflow type distribution

Do not fabricate research results.

Clearly distinguish:
- operational metrics
- experimental metrics
- target metrics from the PRD

Update state files.

---

# PROMPT 017 — Test and Security Hardening

Task ID: EDU-018.

Perform a production hardening pass.

Test:
- authentication
- authorization
- RLS
- tenant isolation
- workflow transitions
- policy validation
- file access
- input validation
- error handling
- race conditions
- duplicate approvals
- replay/idempotency
- secret exposure
- dependency vulnerabilities
- accessibility
- responsive UI
- build

Fix issues one by one.

Every meaningful error must receive an `ERR-###` entry.

Update all state files.

Do not declare production readiness yet.

---

# PROMPT 018 — Vercel Deployment

Task ID: EDU-019.

Prepare and deploy the application to Vercel.

Verify:
- production build
- environment variables
- Supabase connectivity
- authentication
- redirects
- server/client boundaries
- database migrations
- storage access
- error reporting
- production domain configuration

Do not expose secrets in logs or browser bundles.

Document deployment and rollback procedure.

Update state files.

---

# PROMPT 019 — Production Readiness Review

Task ID: EDU-020.

Perform a final production-readiness audit.

Review:
- PRD coverage
- functional correctness
- security
- authorization
- database integrity
- RLS
- migrations
- storage
- AI/policy separation
- observability
- performance
- accessibility
- error handling
- deployment
- backup/recovery considerations
- documentation

Create a checklist of:
- READY
- NOT READY
- DEFERRED
- BLOCKED

Do not call the system production-ready if critical issues remain.

Update all state files.

---

# PROMPT 020 — Continuous Maintenance Mode

From this point onward, operate as a maintenance engineer.

Before every change:
1. read state files
2. inspect relevant code
3. identify dependencies
4. create/update task ID
5. implement smallest safe change
6. test
7. record errors
8. update memory/progress/context
9. report next task

Never let project memory drift away from the actual repository.

If a previous AI made an undocumented change, reconstruct it from Git/code where possible and then repair the Markdown state.

