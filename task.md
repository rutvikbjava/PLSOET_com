You are continuing the EduSphere AI production build.

IMPORTANT:
This project is now initialized and the required application code has been pushed to the Git repository.

The repository should contain ONLY files required to build, test, deploy, and maintain the application.

The AI project-memory Markdown files may be maintained locally outside Git according to the user's repository policy.

Before doing anything, read the locally available project-state files:

1. 01_AI_BUILD_RULES.md
2. PROJECT_MEMORY.md
3. PROGRESS.md
4. ERROR_LOG.md
5. PROJECT_CONTEXT.md

If these files are not available locally, STOP and tell me that the project-state files are missing. Do not invent project history.

==================================================
TASK
==================================================

TASK ID: EDU-003

TASK NAME:

Configure Supabase for Production Development

==================================================
OBJECTIVE
==================================================

Connect the freshly initialized EduSphere AI application to Supabase using a production-safe architecture.

This task is ONLY about establishing the Supabase foundation.

DO NOT implement the complete database schema yet.

DO NOT implement authentication yet.

DO NOT implement workflow functionality yet.

DO NOT implement the policy engine yet.

Those will be separate tasks.

==================================================
1. INSPECT THE CURRENT PROJECT FIRST
==================================================

Before changing anything, inspect:

- package.json
- lockfile
- src/
- app/
- lib/
- config/
- existing environment configuration
- .gitignore
- README.md
- existing Supabase-related files

Determine:

- framework
- package manager
- current environment strategy
- whether Supabase dependencies already exist
- whether any Supabase code already exists

Do not reinstall dependencies unnecessarily.

==================================================
2. SUPABASE ARCHITECTURE
==================================================

Establish a clean architecture for:

Browser
   ↓
Browser-safe Supabase client

Server
   ↓
Server Supabase client
   ↓
Authenticated user/session
   ↓
PostgreSQL

Privileged server operations, if required later:

Server-only code
   ↓
Service-role Supabase client

IMPORTANT:

The service-role key MUST NEVER reach browser/client code.

Do not expose it through:
- NEXT_PUBLIC_ variables
- client components
- browser bundles
- API responses
- logs

==================================================
3. INSTALL REQUIRED DEPENDENCIES
==================================================

Install only the dependencies actually required for the chosen Supabase architecture.

Prefer the official Supabase JavaScript ecosystem and framework-compatible packages.

Do not install:

- unrelated ORM libraries
- multiple database clients
- unnecessary state-management libraries
- unnecessary Supabase wrappers

Every dependency added must have a clear purpose.

Record important dependency decisions in PROJECT_MEMORY.md.

==================================================
4. ENVIRONMENT VARIABLES
==================================================

Establish the environment-variable structure.

At minimum distinguish between:

PUBLIC:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

SERVER ONLY:

SUPABASE_SERVICE_ROLE_KEY

Use the appropriate variable names for the project's implementation.

IMPORTANT:

Do not place real credentials into source code.

Do not place real credentials into:

- README.md
- PROJECT_MEMORY.md
- PROJECT_CONTEXT.md
- PROGRESS.md
- ERROR_LOG.md
- Git
- client-side source code

Only variable names and safe descriptions may be documented.

==================================================
5. UPDATE .GITIGNORE
==================================================

Verify that Git ignores sensitive/local files.

At minimum ensure appropriate patterns exist for:

.env
.env.local
.env.*.local
.env.production
node_modules
.next
coverage
logs
OS/editor temporary files

Do not blindly add patterns that would ignore required source files.

The repository must continue containing all files necessary to build the application.

==================================================
6. CREATE SUPABASE CLIENT ARCHITECTURE
==================================================

Create a clean Supabase integration.

Use separate boundaries where appropriate for:

### Browser client

Used by browser-safe client-side functionality.

### Server client

Used by server-side application functionality and authenticated operations.

### Admin/service-role client

Only create this abstraction if the project actually needs privileged operations.

If created:

- it must be server-only
- it must never be imported into client components
- it must never expose the service-role key
- it must not bypass authorization casually

Document the security implications.

==================================================
7. TYPE SAFETY
==================================================

Prepare the application for strongly typed Supabase database access.

If database types can be generated safely at this stage:

set up the generation workflow.

However:

DO NOT create the final EduSphere database schema yet.

Do not invent the complete database schema just to generate types.

The schema will be created in EDU-004.

If type generation must wait until migrations exist, document that clearly.

==================================================
8. SUPABASE CLI
==================================================

Determine whether the Supabase CLI should be used for this project.

For a production-grade project, establish a migration-based workflow.

If the CLI is appropriate:

- initialize Supabase project configuration
- establish local development configuration
- establish migrations directory
- document how migrations will be created/applied

Do not push arbitrary schema changes directly to production.

Do not create the full schema yet.

==================================================
9. LOCAL DEVELOPMENT STRATEGY
==================================================

Establish a reproducible development strategy.

Document:

- how developers connect to the Supabase project
- how environment variables are configured
- how migrations will be applied
- how local development differs from production
- how test data will eventually be handled

Do not create production data.

Do not insert fake production users.

==================================================
10. SUPABASE PROJECT CONNECTION
==================================================

If the user has already created a Supabase project and provided credentials through environment variables:

verify connectivity safely.

If credentials are NOT available:

DO NOT fabricate credentials.

Set up the integration and report exactly what the user must configure.

Never ask the user to paste secrets into chat if they can put them into their local environment.

The preferred approach is:

.env.local

with the required variables.

==================================================
11. DATABASE CONNECTION TEST
==================================================

Create a minimal safe connectivity verification.

The test should confirm that the application can communicate with Supabase.

Do NOT create application tables yet.

Do NOT create production data.

Do NOT bypass RLS.

If there is no database table available yet, use an appropriate minimal connectivity/configuration check rather than inventing application data.

==================================================
12. SECURITY VERIFICATION
==================================================

Perform a security review specifically for the Supabase integration.

Verify:

[ ] service-role key is server-only
[ ] public keys are the only keys exposed to browser code
[ ] .env files are ignored
[ ] secrets are not committed
[ ] secrets are not logged
[ ] browser client and server client are separated appropriately
[ ] privileged client cannot be imported into client-side code
[ ] no database authorization is being bypassed
[ ] no hardcoded Supabase credentials exist

If possible, inspect the resulting client bundle/build configuration to ensure secrets are not exposed.

==================================================
13. VERCEL COMPATIBILITY
==================================================

Ensure the Supabase integration is compatible with Vercel.

Do not deploy yet.

Verify that:

- environment variables can be configured through Vercel
- server-only variables remain server-only
- browser variables use the appropriate public prefix
- build does not depend on local-only files
- runtime configuration is documented

Do not add Vercel secrets to Git.

==================================================
14. README
==================================================

Update README.md with a concise Supabase setup section.

Include:

1. Create/configure Supabase project
2. Required environment variables
3. Local development configuration
4. Migration strategy
5. Important security warning

NEVER include actual credentials.

==================================================
15. STATE FILES
==================================================

Update:

PROJECT_MEMORY.md
PROGRESS.md
ERROR_LOG.md
PROJECT_CONTEXT.md

Remember:

These Markdown files are project-memory files.

The user has chosen not to push them to the Git repository.

Therefore:

- maintain them locally
- DO NOT force-add them to Git
- DO NOT commit them
- DO NOT modify .gitignore to force them into the repository

If they are already tracked in Git, report that before changing anything.

==================================================
16. TASK STATE
==================================================

Update:

EDU-003

During implementation:

IN_PROGRESS

After successful verification:

COMPLETE

If Supabase credentials are unavailable but the code foundation is complete:

PARTIAL

Do not mark COMPLETE if actual required verification cannot be performed.

==================================================
17. ERROR PROTOCOL
==================================================

If any error occurs:

Create:

ERR-XXX

Example:

ERR-001

Record:

- exact error
- task
- environment
- reproduction
- root cause
- attempted solution
- final solution
- files changed
- verification
- prevention

Link the error to EDU-003.

If the error reveals a reusable security or architecture lesson:

update PROJECT_MEMORY.md.

==================================================
18. DECISION PROTOCOL
==================================================

If an important Supabase architectural decision is made:

create:

DEC-XXX

Record:

- decision
- reason
- alternatives
- consequences
- related task

Examples:

DEC-004 — Supabase client architecture
DEC-005 — Supabase migration strategy

Only create IDs for decisions that actually occur.

==================================================
19. DO NOT BUILD THE DATABASE YET
==================================================

This is extremely important.

DO NOT create:

- institutions table
- profiles table
- departments table
- documents table
- policies table
- workflows table
- approvals table
- signatures table
- notifications table
- audit table

Those belong to:

EDU-004 — Design and Implement Database Schema

EDU-003 only establishes Supabase infrastructure and integration.

==================================================
20. DO NOT IMPLEMENT AUTHENTICATION YET
==================================================

Do not implement:

- login
- signup
- password reset
- OAuth
- role management
- protected dashboard routes

Those belong to later tasks.

You may prepare the architecture so authentication can be added cleanly.

==================================================
21. VERIFICATION
==================================================

Run all applicable checks:

1. dependency installation
2. lint
3. typecheck
4. tests
5. production build
6. Supabase connectivity/configuration verification
7. secret exposure review

Use the actual project commands.

If something fails:

fix it and run the check again.

Do not suppress errors without understanding them.

==================================================
22. ACCEPTANCE CRITERIA
==================================================

EDU-003 can be marked COMPLETE only if:

[ ] Supabase integration architecture established
[ ] required dependencies installed
[ ] browser client configured
[ ] server client configured
[ ] service-role abstraction secured if required
[ ] environment variables documented
[ ] .env files protected by .gitignore
[ ] no secrets committed
[ ] no secrets exposed to browser
[ ] Supabase configuration documented
[ ] migration strategy established
[ ] database schema intentionally NOT implemented yet
[ ] authentication intentionally NOT implemented yet
[ ] Vercel compatibility considered
[ ] README updated
[ ] lint passes
[ ] typecheck passes
[ ] tests pass
[ ] production build passes
[ ] state files updated
[ ] errors recorded
[ ] decisions recorded
[ ] next task identified

==================================================
23. GIT VERIFICATION
==================================================

Before finishing, inspect:

git status

and verify that:

- secrets are NOT staged
- .env files are NOT tracked
- node_modules is NOT tracked
- .next is NOT tracked
- local AI Markdown memory files are NOT tracked if that is the user's chosen repository policy
- required application files remain tracked

Do NOT use:

git add -f

to force excluded files into the repository.

Do not rewrite Git history unless explicitly requested.

==================================================
24. FINAL REPORT
==================================================

After completing the task, STOP.

Return exactly:

# EDU-003 — Supabase Configuration

## Status
COMPLETE / PARTIAL / BLOCKED

## Supabase Setup
- Supabase project configured: YES/NO
- Client configured: YES/NO
- Server client configured: YES/NO
- Service-role abstraction: YES/NO/NOT REQUIRED
- Migration system: YES/NO

## Environment
List variable NAMES only.

Never reveal secret values.

## Security
List verification results.

## Database
Explicitly state:

"Application database schema has NOT yet been implemented. It is scheduled for EDU-004."

## Authentication
Explicitly state:

"Authentication has NOT yet been implemented. It will be implemented in a later task."

## Tests
Show exact commands and results.

## Build
Show exact command and result.

## Git Status
Explain what is tracked and confirm secrets are excluded.

## Errors
List ERR IDs or state that none occurred.

## Decisions
List DEC IDs.

## Files Created/Changed
List every relevant source/configuration file.

Do NOT list secret values.

## State Files
Confirm local state files were updated.

## Next Task

EDU-004 — Design and Implement EduSphere AI Database Schema and Supabase Migrations

Explain why EDU-004 is next.

STOP.

Do not begin EDU-004 automatically.