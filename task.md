We are now proceeding to EDU-010.

IMPORTANT:
This is an EXISTING production-oriented project.
EDU-001 through EDU-009 have already been implemented according to the project state files.

Do NOT rebuild previous work.
Do NOT start EDU-011 or any later task.
Do NOT reduce the scope.
Do NOT create task-specific completion-report Markdown files.
Do NOT ask me to choose implementation options.

Your job is to implement the COMPLETE EDU-010 scope, verify it honestly, and update the project's existing memory/state files.

==================================================

1. REQUIRED MEMORY READING
   ==================================================

Before making ANY change, read these files in this exact order:

1. 01_AI_BUILD_RULES.md
2. PROJECT_MEMORY.md
3. PROGRESS.md
4. ERROR_LOG.md
5. PROJECT_CONTEXT.md
6. task.md

Then inspect the actual repository.

The state files are project memory, NOT unquestionable truth.
Verify important claims against the actual implementation.

==================================================
2. PREREQUISITE VERIFICATION
============================

Verify that EDU-009 is actually complete.

Inspect the real implementation of:

* workflow definitions
* workflow versions
* workflow instances
* workflow steps
* workflow execution engine
* action registry
* workflow authorization
* workflow validation
* AI workflow generation
* policy/context dependencies
* authentication
* RLS
* audit infrastructure

If EDU-009 is PARTIAL or BLOCKED:

STOP and report the exact blocker.

Do not silently build EDU-010 on an incomplete foundation.

==================================================
3. EDU-010 OBJECTIVE
====================

Implement:

APPROVALS + SIGNATURES + NOTIFICATIONS + AUDIT

The architecture should extend the existing workflow system:

Workflow
↓
Workflow Step
↓
Approval / Signature Requirement
↓
Authorized Actor
↓
Decision / Signature
↓
Notification
↓
Audit Event

IMPORTANT:

Reuse the existing workflow engine.

Do NOT create a second workflow engine.

Reuse the existing audit architecture.

Do NOT create a second audit system.

==================================================
4. FIRST: INSPECT EXISTING SCHEMA
=================================

Before creating migrations, inspect existing tables for:

* approvals
* signatures
* notifications
* audit
* workflow steps
* workflow instances
* users
* roles
* institutions
* policies
* documents

EDU-004 may already contain approval/audit foundations.

EDU-009 may already contain workflow execution structures.

Reuse existing structures where appropriate.

Do NOT create duplicate tables.

If existing structures are insufficient:

create NEW migrations.

Never rewrite historical migrations that may already have been applied.

==================================================
5. APPROVAL DOMAIN
==================

Design a proper approval model.

An approval should be associated with:

* institution
* workflow instance where applicable
* workflow step where applicable
* approval request
* requested actor/role/capability
* status
* decision
* requester
* approver
* timestamps
* optional reason/comment
* expiration where required

Use controlled statuses.

At minimum evaluate:

PENDING
APPROVED
REJECTED
CANCELLED
EXPIRED

Use only states required by the PRD.

==================================================
6. APPROVAL STATE MACHINE
=========================

Implement explicit approval transitions.

For example:

PENDING → APPROVED
PENDING → REJECTED
PENDING → CANCELLED
PENDING → EXPIRED

Reject invalid transitions.

Do not allow arbitrary client-side status updates.

Authorization must be checked server-side.

==================================================
7. APPROVAL AUTHORIZATION
=========================

Approval authority must be deterministic.

Do NOT allow the AI or browser to decide who is authorized to approve.

The server must determine authorization from:

* authenticated user
* institution
* role
* capability/permission
* workflow requirement
* policy rules where applicable

A user must never be able to approve their own request if the product rules prohibit self-approval.

Implement separation-of-duties where the PRD requires it.

==================================================
8. APPROVAL REQUEST CREATION
============================

Approval requests may originate from workflow execution.

The workflow engine should be able to create an approval requirement.

The approval system should return a persisted state such as:

WAITING_FOR_APPROVAL

to the workflow engine where appropriate.

Do not block a serverless request while waiting for a human.

The workflow must persist its state and resume after approval.

==================================================
9. APPROVAL RESUMPTION
======================

When an approval is:

APPROVED

the workflow should resume from the appropriate waiting step.

When:

REJECTED

the workflow should follow its defined rejection path.

Do not hardcode every workflow's behavior into the approval service.

Use the workflow definition/state machine.

==================================================
10. MULTIPLE APPROVERS
======================

Inspect the PRD and workflow architecture for support for:

* single approver
* multiple approvers
* sequential approval
* parallel approval
* any/all approval requirements

Implement only the models actually required.

If multiple approval semantics are required, represent them explicitly and deterministically.

Never infer them dynamically from AI output at execution time.

==================================================
11. APPROVAL COMMENTS
=====================

Support an optional decision reason/comment where required.

Do not allow comments to overwrite historical decisions.

Approval decisions should be append-only or otherwise preserve a complete history.

==================================================
12. SIGNATURE DOMAIN
====================

Implement the signature foundation required by EDU-010.

A signature record should be able to identify:

* institution
* signer
* signing request
* related workflow/step
* document/version where applicable
* signature status
* requested timestamp
* signed timestamp
* signature metadata
* audit reference

Do NOT claim this is a legally compliant digital-signature system unless the PRD explicitly requires and the implementation actually provides that level of compliance.

==================================================
13. SIGNATURE SECURITY
======================

Never treat:

"clicking a button"

as sufficient proof of a legally binding signature unless the product requirements explicitly define that behavior.

Use clear terminology such as:

* electronic acknowledgment
* approval confirmation
* signature intent

where legally appropriate.

Protect signature records from unauthorized modification.

Historical signatures must remain explainable.

==================================================
14. SIGNATURE IMMUTABILITY
==========================

Once a signature is completed:

do not allow ordinary UPDATE/DELETE operations to rewrite the historical signing event.

If corrections are required:

create a new event/record according to the architecture.

Never silently mutate historical signatures.

==================================================
15. DOCUMENT VERSION BINDING
============================

If a signature relates to a document:

bind it to the exact document version.

Example:

Document
├── Version 1
├── Version 2
└── Version 3

Signature A must identify exactly which version was signed.

Do not allow a later document version to silently replace the signed content.

==================================================
16. SIGNATURE WORKFLOW
======================

Integrate signatures with the workflow engine.

Example:

Workflow
→ Prepare Document
→ Request Approval
→ Request Signature
→ Complete

A signature requirement should be represented as a controlled workflow action/step.

Do NOT create a separate execution mechanism.

==================================================
17. NOTIFICATION DOMAIN
=======================

Implement a notification foundation.

Notifications should support at least the channels required by the PRD.

Evaluate:

* in-app
* email

Do not implement SMS/push/etc. unless explicitly required.

==================================================
18. NOTIFICATION MODEL
======================

A notification should record:

* institution
* recipient
* notification type
* title
* message
* related entity
* related workflow/approval/signature
* delivery status
* read status where applicable
* created timestamp
* delivered timestamp
* failure information where appropriate

Do not put sensitive information into notification payloads unnecessarily.

==================================================
19. NOTIFICATION TEMPLATES
==========================

Create a clean notification-template abstraction where needed.

Do not hardcode dozens of message strings throughout server actions.

Notification types should be deterministic.

Examples:

APPROVAL_REQUESTED
APPROVAL_APPROVED
APPROVAL_REJECTED
SIGNATURE_REQUESTED
SIGNATURE_COMPLETED
WORKFLOW_FAILED

Use the actual PRD terminology where specified.

==================================================
20. NOTIFICATION SECURITY
=========================

Never send notification content to users who are not authorized to see the underlying event.

A notification must not become a cross-tenant information leak.

Verify recipient authorization server-side.

Do not trust browser-supplied recipient IDs.

==================================================
21. EMAIL PROVIDER
==================

Inspect the project's existing dependencies and architecture before selecting an email provider.

If the PRD specifies a provider, use it.

Otherwise create a provider abstraction rather than tightly coupling the application to one provider.

For example:

Notification Service
↓
Email Provider
↓
Provider Implementation

Do not expose provider API keys to the browser.

If no provider is configured:

implement a safe development/mock mode.

Do not pretend real email delivery was tested.

==================================================
22. NOTIFICATION DELIVERY
=========================

Notification delivery must be resilient.

Record:

* pending
* sent
* failed

where appropriate.

Implement bounded retry behavior for transient delivery failures.

Do not create infinite retry loops.

Do not mark an email as SENT before the provider confirms successful submission.

==================================================
23. IDEMPOTENCY
===============

Notification delivery must be idempotent.

If the same event is processed twice:

do not unintentionally send duplicate notifications.

Use deterministic event/notification IDs or appropriate unique constraints.

==================================================
24. AUDIT INTEGRATION
=====================

Reuse the existing audit system.

Audit important events including:

APPROVAL_REQUESTED
APPROVAL_APPROVED
APPROVAL_REJECTED
APPROVAL_CANCELLED
APPROVAL_EXPIRED
SIGNATURE_REQUESTED
SIGNATURE_COMPLETED
SIGNATURE_REJECTED/FAILED where applicable
NOTIFICATION_CREATED
NOTIFICATION_SENT
NOTIFICATION_FAILED
WORKFLOW_WAITING
WORKFLOW_RESUMED

Use the actual event vocabulary from the existing project where possible.

Do not create a parallel audit table merely for EDU-010.

==================================================
25. AUDIT IMMUTABILITY
======================

Audit records must be append-only.

Do not provide normal UPDATE/DELETE functionality for historical audit events.

Do not allow clients to fabricate audit events.

Audit actor identity must come from trusted server-side authentication/context.

==================================================
26. AUDIT DATA MINIMIZATION
===========================

Audit events should contain enough information to reconstruct what happened without storing unnecessary sensitive information.

Do NOT log:

* passwords
* API keys
* service-role keys
* full confidential documents
* raw secrets
* unnecessary AI prompts
* sensitive tokens

Use metadata/references instead of copying large payloads.

==================================================
27. WORKFLOW + APPROVAL INTEGRATION
===================================

Integrate approval waiting into EDU-009.

Expected conceptual flow:

Workflow Instance
↓
Approval Step
↓
Approval Request
↓
Workflow = WAITING
↓
Human Decision
↓
Approval Result
↓
Workflow resumes
↓
Next Step

Do not use polling loops inside serverless requests.

==================================================
28. WORKFLOW + SIGNATURE INTEGRATION
====================================

Expected conceptual flow:

Workflow Instance
↓
Signature Step
↓
Signature Request
↓
Workflow = WAITING
↓
Signer completes
↓
Signature recorded
↓
Workflow resumes
↓
Next Step

Persist all state.

==================================================
29. WORKFLOW + NOTIFICATION INTEGRATION
=======================================

Notifications should be triggered by domain events rather than random UI behavior.

For example:

Approval Requested
↓
Domain Event
↓
Notification Service
↓
In-App Notification
+
Email Notification

Do not make the browser responsible for critical notification creation.

==================================================
30. AUTHORIZATION
=================

Every server-side entry point must verify:

* authentication
* institution membership
* required role/capability
* target resource ownership
* action authorization

Do not rely on:

* hidden UI buttons
* client-side role checks
* browser-provided institution IDs
* browser-provided approver IDs

==================================================
31. TENANT ISOLATION
====================

Institution A must never be able to:

* read Institution B approvals
* approve Institution B requests
* read Institution B signatures
* read Institution B notifications
* read Institution B audit records
* trigger actions on Institution B workflows

Implement and verify RLS.

==================================================
32. RLS
=======

For every new institution-scoped table:

* enable RLS
* define appropriate SELECT policies
* define appropriate INSERT policies
* define appropriate UPDATE policies
* define appropriate DELETE policies

For immutable tables:

do not provide normal UPDATE/DELETE access.

Test cross-tenant isolation.

==================================================
33. SELF-APPROVAL / CONFLICT CHECKS
===================================

Where required by the PRD:

prevent:

Requester = Approver

or otherwise enforce separation-of-duties.

Do not implement this solely in the UI.

Enforce server-side.

==================================================
34. EXPIRATION
==============

If approvals/signatures expire:

define deterministic expiration behavior.

Do not rely on a user opening the page to detect expiration.

The system should evaluate expiration when relevant operations occur.

If background scheduling is required and unavailable:

document the Vercel-compatible strategy.

Do not pretend a persistent worker exists.

==================================================
35. CONCURRENCY
===============

Approval decisions must be concurrency-safe.

If two requests attempt:

APPROVE
and
REJECT

at approximately the same time:

only one valid terminal decision should win according to the defined state machine.

Use atomic/database-level protection.

Do not rely only on application-level "if status == PENDING" checks.

==================================================
36. SIGNATURE CONCURRENCY
=========================

Similarly, two simultaneous signing attempts must not create contradictory completed signatures.

Use appropriate database constraints/state transitions.

==================================================
37. NOTIFICATION CONCURRENCY
============================

Prevent duplicate notification delivery caused by:

* retries
* repeated workflow events
* duplicate HTTP requests
* concurrent workers

Use persistent idempotency controls.

==================================================
38. API / SERVER ACTIONS
========================

Implement secure server-side operations for:

* create approval request
* retrieve approval
* approve
* reject
* cancel
* create signature request
* complete signature
* reject/cancel signature where applicable
* retrieve notifications
* mark notification read
* notification delivery processing
* retrieve relevant audit history

Use the project's established server-action/API conventions.

==================================================
39. UI — APPROVALS
==================

Implement appropriate interfaces for:

* pending approvals
* approval detail
* approve
* reject
* decision reason/comment
* status
* requester
* relevant workflow/document information

Handle:

* loading
* empty
* error
* unauthorized
* expired
* already decided

Do not expose unauthorized approval actions.

==================================================
40. UI — SIGNATURES
===================

Implement appropriate interfaces for:

* pending signature requests
* signature detail
* document/version being signed
* signer identity
* signing action
* completed status
* failure/cancellation state

Clearly communicate what the user is confirming.

Do not use misleading legal language.

==================================================
41. UI — NOTIFICATIONS
======================

Implement an in-app notification interface where required.

Support:

* unread state
* read state
* notification detail/link
* empty state
* safe navigation to related resource

Do not leak sensitive content in notification previews.

==================================================
42. UI — AUDIT
==============

Expose audit history only to authorized users.

Provide useful information such as:

* event
* actor
* timestamp
* target
* status
* relevant metadata

Do not expose secrets or unnecessary sensitive payloads.

==================================================
43. ACCESSIBILITY
=================

Approval/signature/notification interfaces must support:

* keyboard navigation
* semantic labels
* focus states
* accessible dialogs
* accessible status indicators
* clear validation messages
* screen-reader-friendly controls

Do not use color alone to communicate status.

==================================================
44. RESPONSIVE DESIGN
=====================

Verify:

* mobile
* tablet
* desktop

especially for:

* approval actions
* signature confirmation
* notification center
* audit tables

==================================================
45. ERROR HANDLING
==================

Handle:

* approval not found
* unauthorized approval
* already decided
* expired approval
* invalid transition
* signature not found
* unauthorized signer
* duplicate signature
* notification failure
* email provider failure
* audit failure
* database failure
* concurrency conflict

User-facing errors must be safe.

Never expose internal stack traces or secrets.

==================================================
46. TRANSACTIONAL CONSISTENCY
=============================

Where an action changes multiple pieces of critical state, use appropriate database transactions/atomic operations.

Examples:

Approval decision
+
Workflow state transition
+
Audit event

Signature completion
+
Workflow state transition
+
Audit event

Do not leave the system in contradictory states.

If the existing architecture prevents a single transaction across services:

document the consistency strategy explicitly.

==================================================
47. VERCEL COMPATIBILITY
========================

The implementation must work with the project's target architecture.

Do not rely on:

* persistent in-memory workers
* local durable files
* long-running HTTP requests waiting for humans
* process-level queues

If asynchronous delivery requires an external service:

create a provider abstraction and document the integration requirement.

==================================================
48. DATABASE MIGRATIONS
=======================

Create only NEW migrations.

Every migration must be:

* ordered
* reproducible
* reversible where practical
* compatible with existing schema
* properly indexed
* constrained
* tenant-aware

Do not modify old migration history merely to make the current implementation easier.

==================================================
49. TESTING — APPROVALS
=======================

Test:

[ ] create approval
[ ] authorized approval
[ ] unauthorized approval rejected
[ ] approve
[ ] reject
[ ] cancel
[ ] invalid transition rejected
[ ] duplicate decision prevented
[ ] concurrent decision handled
[ ] self-approval prevented where required
[ ] expiration handled
[ ] audit generated

==================================================
50. TESTING — SIGNATURES
========================

Test:

[ ] create signature request
[ ] authorized signer
[ ] unauthorized signer rejected
[ ] signature completion
[ ] duplicate completion prevented
[ ] historical signature immutable
[ ] exact document version preserved
[ ] concurrency handled
[ ] audit generated

==================================================
51. TESTING — NOTIFICATIONS
===========================

Test:

[ ] notification created
[ ] correct recipient
[ ] unauthorized recipient prevented
[ ] unread/read behavior
[ ] duplicate delivery prevented
[ ] failed delivery recorded
[ ] retry behavior bounded
[ ] mock provider works
[ ] real provider tested only if configured

==================================================
52. TESTING — AUDIT
===================

Test:

[ ] important domain events audited
[ ] actor identity correct
[ ] tenant isolation
[ ] audit records immutable
[ ] clients cannot fabricate actor identity
[ ] secrets not recorded

==================================================
53. RLS SECURITY TESTING
========================

Verify:

Institution A → Institution A data = ALLOW

Institution A → Institution B data = DENY

Test:

* approvals
* signatures
* notifications
* audit
* workflow integration

If a connected Supabase environment is unavailable:

mark the tests:

NOT RUN / BLOCKED

Do not claim they passed.

==================================================
54. TEST HONESTY
================

Never claim a test passed unless it actually ran.

Use exactly:

PASS
FAIL
NOT RUN
BLOCKED

where applicable.

==================================================
55. BUILD VERIFICATION
======================

Run the project's actual commands.

At minimum:

npm run typecheck
npm run lint
npm test
npm run build

If a different test command exists, use the actual project command.

Fix genuine failures.

Rerun after fixes.

==================================================
56. ERROR MEMORY
================

Whenever a meaningful error occurs:

record it in ERROR_LOG.md.

Use the next available ERR-XXX ID.

Each error must contain:

* ID
* Task
* Error
* Root cause
* Solution
* Files affected
* Verification

Do not write:

"Errors: None"

if meaningful errors occurred and were fixed.

==================================================
57. DECISION MEMORY
===================

Use the next available DEC-XXX IDs.

Record only actual architectural decisions made during EDU-010.

Potential examples:

* approval state machine
* separation-of-duties strategy
* signature immutability
* document-version binding
* notification provider abstraction
* notification idempotency
* audit integration
* event-driven notification strategy
* concurrency strategy

Do not invent decisions.

==================================================
58. PROJECT MEMORY UPDATES
==========================

Update all four required state files:

PROJECT_MEMORY.md
PROGRESS.md
PROJECT_CONTEXT.md
ERROR_LOG.md

Keep them consistent.

Every major change should be traceable.

Use cross-references such as:

Task:
EDU-010

Decision:
DEC-XXX

Error:
ERR-XXX

Related implementation:
[path]

Next activity:
read [specific state/task section]

==================================================
59. NO EXTRA MEMORY FILES
=========================

Do NOT create:

EDU-010_COMPLETION_REPORT.md

Do NOT create:

EDU-010_STATUS.md

Do NOT create:

EDU-010_NOTES.md

Do NOT create any other task-specific Markdown report.

Use the existing state files.

==================================================
60. README
==========

Update README.md with the actual EDU-010 architecture.

Document:

* approval system
* signature system
* notification system
* audit integration
* state transitions
* security
* RLS
* provider configuration
* Vercel considerations
* testing

Do not document functionality that does not actually exist.

==================================================
61. GIT HYGIENE
===============

Run:

git status

Verify no:

* .env
* secrets
* node_modules
* .next
* temporary files
* debug files
* generated junk
* task-specific completion report

are added to the repository.

Keep the repository production-clean.

==================================================
62. FINAL ACCEPTANCE CRITERIA
=============================

EDU-010 can be marked COMPLETE only when the applicable requirements are actually implemented and verified:

[ ] EDU-009 verified complete
[ ] approval domain implemented
[ ] approval state machine implemented
[ ] approval authorization enforced
[ ] approval concurrency handled
[ ] approval audit integrated
[ ] signature domain implemented
[ ] signature authorization enforced
[ ] signature immutability implemented
[ ] exact document version binding implemented where applicable
[ ] signature workflow integration implemented
[ ] notification domain implemented
[ ] notification recipient security enforced
[ ] notification provider abstraction implemented
[ ] delivery state implemented
[ ] notification idempotency implemented
[ ] bounded retry implemented
[ ] audit integrated
[ ] audit immutability preserved
[ ] workflow waiting/resumption implemented
[ ] tenant isolation implemented
[ ] RLS implemented
[ ] server-side authorization enforced
[ ] approval UI implemented
[ ] signature UI implemented
[ ] notification UI implemented
[ ] authorized audit UI implemented where required
[ ] accessibility reviewed
[ ] responsive behavior reviewed
[ ] meaningful tests created
[ ] tests actually run where possible
[ ] typecheck passes
[ ] lint passes
[ ] test suite passes where available
[ ] production build passes
[ ] README updated
[ ] PROJECT_MEMORY.md updated
[ ] PROGRESS.md updated
[ ] PROJECT_CONTEXT.md updated
[ ] ERROR_LOG.md updated
[ ] no task-specific completion report created
[ ] no secrets committed

==================================================
63. SCOPE LIMIT
===============

Do NOT begin EDU-011.

Do NOT implement unrelated future features.

You may create interfaces/hooks/events that future tasks will consume, but do not fully implement future task functionality.

Do not redesign the entire existing architecture.

Reuse EDU-004 through EDU-009 wherever appropriate.

==================================================
64. FINAL RESPONSE
==================

When finished, return exactly this structure:

# EDU-010 Final Status

## Status

COMPLETE / PARTIAL / BLOCKED

## Prerequisite

Actual EDU-009 verification result.

## Approval System

Explain the actual implementation.

## Signature System

Explain the actual implementation.

## Notification System

Explain the actual implementation.

## Audit Integration

Explain how the existing audit system was reused.

## Workflow Integration

Explain approval/signature waiting and workflow resumption.

## Security

Explain:

* authentication
* authorization
* tenant isolation
* RLS
* self-approval/separation-of-duties
* immutability
* concurrency

## Database

List actual new migrations and schema changes.

## UI

List actual routes/components implemented.

## Testing

Report actual results using:

PASS
FAIL
NOT RUN
BLOCKED

## Build

Report:

* typecheck
* lint
* tests
* build

with actual results.

## Errors

List actual ERR-XXX IDs.

## Decisions

List actual DEC-XXX IDs.

## State Files

Confirm:

PROJECT_MEMORY.md
PROGRESS.md
PROJECT_CONTEXT.md
ERROR_LOG.md

were updated.

## Remaining Blockers

List only genuine blockers.

## Next Task

If EDU-010 is genuinely complete:

EDU-011

Otherwise explain exactly what must be completed first.

STOP.

Do not start EDU-011 automatically.
