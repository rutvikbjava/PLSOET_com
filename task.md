Yes. Since **EDU-001 is done** and you have **no existing repository**, this is the corrected **Prompt 2**.

This prompt will make the AI create the project from zero, but it will **not start building EduSphere's business features yet**. It establishes a clean production foundation first.

## Prompt 2 — Initialize the Fresh Production Project

Copy the entire prompt below into your coding AI:

```text
You are continuing the EduSphere AI production build.

This project is being built FROM SCRATCH.

IMPORTANT:
There is currently NO existing application repository or existing implementation to preserve.

We are starting a brand-new production-grade web service based on the EduSphere AI PRD.

Before doing anything, read these files if they already exist:

1. 01_AI_BUILD_RULES.md
2. PROJECT_MEMORY.md
3. PROGRESS.md
4. ERROR_LOG.md
5. PROJECT_CONTEXT.md

If these files do not yet exist because the repository is completely empty, create them according to the project rules before continuing.

==================================================
TASK
==================================================

TASK ID: EDU-002

TASK NAME:

Initialize Fresh EduSphere AI Production Project

==================================================
PRIMARY OBJECTIVE
==================================================

Create the initial production-grade web application foundation for EduSphere AI.

We are NOT implementing the complete EduSphere product yet.

This task establishes:

- repository
- project structure
- frontend framework
- TypeScript
- package management
- linting
- formatting
- environment configuration
- application architecture
- basic UI foundation
- error handling foundation
- testing foundation
- Git configuration
- documentation
- persistent AI project memory

After this task, the project must be ready for the next stage:

EDU-003 — Supabase Configuration

==================================================
IMPORTANT PRD CONTEXT
==================================================

EduSphere AI is a SaaS platform for higher education workflow automation.

The PRD describes the product as:

- secure
- SaaS-based
- microservices-oriented
- context-aware
- policy-constrained

The core future workflow is:

Document Upload
        ↓
Context Analysis
        ↓
Candidate Workflow Generation
        ↓
Policy Validation
        ↓
Workflow Execution
        ↓
Approval & Signature
        ↓
Audit Trail

Do NOT implement these business systems during EDU-002.

Only create the technical foundation required to build them safely.

==================================================
1. FIRST: INSPECT THE CURRENT DIRECTORY
==================================================

Before creating files:

Inspect the current working directory.

Determine:

- Is it completely empty?
- Is Git initialized?
- Are there hidden files?
- Are there existing project files?
- Are there existing README files?
- Are there package managers already configured?

Do not assume the directory is empty.

If there are unexpected files:

inspect them before deleting anything.

NEVER delete existing user files without explicit permission.

==================================================
2. CHOOSE THE WEB FRAMEWORK
==================================================

If the project is completely empty, use:

Next.js
+
TypeScript
+
App Router

Use a currently stable version compatible with the project's environment.

The application must be suitable for:

- production deployment
- Vercel
- Supabase
- server-side operations
- authenticated applications
- API/server functionality
- scalable component architecture

Do NOT add unnecessary frameworks.

==================================================
3. PROJECT INITIALIZATION
==================================================

Initialize the project with:

- TypeScript
- strict mode
- ESLint
- appropriate formatting
- App Router
- sensible source directory structure
- production build configuration

Prefer a clean structure such as:

src/
  app/
  components/
  lib/
  hooks/
  services/
  types/
  config/

Use appropriate alternatives if the selected framework/version recommends a different structure.

Do not create hundreds of empty files.

Create only meaningful foundational directories/files.

==================================================
4. PACKAGE MANAGEMENT
==================================================

Choose one package manager.

Prefer the package manager already configured in the environment if one exists.

Otherwise use npm unless there is a strong technical reason to use another.

Create and commit the appropriate lockfile.

Do not mix package managers.

==================================================
5. TYPESCRIPT
==================================================

Configure TypeScript for production development.

Requirements:

- strict mode
- no implicit any
- sensible module resolution
- path aliases where useful
- clean type boundaries

Do not disable TypeScript strictness just to make code compile.

==================================================
6. ENVIRONMENT CONFIGURATION
==================================================

Create:

.env.example

Do NOT create a production secret file containing real credentials.

The initial environment file should establish the structure needed for future Supabase configuration.

Use placeholder names only.

For example, use variable names appropriate for the chosen Supabase architecture, but DO NOT invent real credentials.

Clearly distinguish:

PUBLIC/BROWSER-SAFE VARIABLES

from:

SERVER-ONLY SECRET VARIABLES

Document this distinction.

==================================================
7. APPLICATION CONFIGURATION
==================================================

Create a safe configuration approach.

Environment variables must be validated.

Avoid directly scattering:

process.env.X

throughout the application.

Create a configuration boundary where appropriate.

The configuration system must make it difficult to accidentally expose server-only secrets to browser code.

==================================================
8. APPLICATION ARCHITECTURE
==================================================

Create a clean initial architecture.

The architecture must be capable of growing into:

- authentication
- authorization
- institutions
- departments
- documents
- context engine
- policy engine
- workflow generator
- workflow execution
- approvals
- signatures
- notifications
- audit trail
- analytics

Do NOT implement these systems yet.

Create only the architectural boundaries necessary to support them later.

Prefer separation between:

UI
↓
Application logic
↓
Services
↓
Data access
↓
External services

Avoid putting business logic directly inside UI components.

==================================================
9. BASIC APPLICATION SHELL
==================================================

Create a minimal professional application shell.

It should include:

- root layout
- basic navigation structure
- application page
- responsive layout
- accessible HTML
- basic typography
- loading strategy
- error strategy
- not-found strategy

Do not build the full dashboard.

Do not build fake workflow data.

Do not build fake authentication.

Do not create fake AI functionality.

The application shell should communicate that EduSphere AI is being initialized.

==================================================
10. UI FOUNDATION
==================================================

Create a reusable UI foundation.

At minimum establish conventions for:

- buttons
- inputs
- cards
- labels
- headings
- page containers
- loading states
- empty states
- error states

Do not install a huge component library unless there is a clear reason.

If a component library is chosen, document why.

Accessibility requirements:

- semantic HTML
- keyboard accessibility
- visible focus states
- appropriate labels
- reasonable color contrast
- responsive layout

==================================================
11. ERROR HANDLING FOUNDATION
==================================================

Establish application-level error handling.

Include appropriate mechanisms for:

- application errors
- route errors
- not-found states
- server errors
- client errors

Do not expose internal stack traces to normal production users.

Developer diagnostics may be more detailed in development.

==================================================
12. LOGGING FOUNDATION
==================================================

Create a simple logging strategy.

Logs should support future debugging.

Avoid:

console.log("everything")

throughout the application.

Create a clear approach for:

- info
- warning
- error

Do not introduce an expensive observability platform yet.

That can be added later if required.

==================================================
13. TESTING FOUNDATION
==================================================

Set up an appropriate testing foundation.

At minimum establish the ability to write:

- unit tests
- integration tests where appropriate

Do not create meaningless tests simply to increase coverage.

Create at least one real foundational test proving the test system works.

The test must be deterministic.

==================================================
14. CODE QUALITY
==================================================

Configure:

- ESLint
- formatting
- TypeScript checking

The project should support commands similar to:

npm run lint
npm run typecheck
npm run test
npm run build

Use the actual package manager selected for the project.

If any command fails:

diagnose it.

Do not suppress the error without understanding it.

==================================================
15. GIT
==================================================

Initialize Git if it is not already initialized.

Create a proper .gitignore.

It MUST prevent accidental commits of:

- .env
- .env.local
- secrets
- build output
- node_modules
- temporary files
- local IDE files where appropriate

Do not commit secrets.

Create an initial commit if Git workflow permits and this repository is intended to be committed now.

Use a meaningful commit message.

==================================================
16. README
==================================================

Create a professional README.md.

It must explain:

- EduSphere AI
- project purpose
- technology stack
- how to install dependencies
- how to run development
- how to run tests
- how to run lint
- how to run typecheck
- how to build
- environment configuration
- project structure
- current development status

Do not claim unfinished features are implemented.

==================================================
17. PROJECT MEMORY FILES
==================================================

Create or update:

01_AI_BUILD_RULES.md
PROJECT_MEMORY.md
PROGRESS.md
ERROR_LOG.md
PROJECT_CONTEXT.md

These are part of the actual repository.

They MUST be committed to Git.

==================================================
18. PROJECT_MEMORY UPDATE
==================================================

Record:

- project has been initialized from scratch
- selected framework
- selected language
- package manager
- initial architecture
- environment strategy
- testing strategy
- Git strategy
- important technical decisions

Create decision IDs where appropriate.

For example:

DEC-001 — Initial web framework
DEC-002 — Package manager
DEC-003 — Initial application architecture

Only create decisions that actually occurred.

==================================================
19. PROGRESS UPDATE
==================================================

Update:

EDU-002

Status should be:

IN_PROGRESS

during implementation.

Only change it to:

COMPLETE

after all acceptance criteria pass.

Then define:

Next Task:

EDU-003 — Configure Supabase

==================================================
20. PROJECT_CONTEXT UPDATE
==================================================

Create a detailed entry for EDU-002.

Record:

- starting state
- project initialization
- framework selection
- dependencies
- directory structure
- configuration
- UI foundation
- testing foundation
- Git initialization
- README
- errors
- decisions
- verification
- next task

==================================================
21. ERROR PROTOCOL
==================================================

If anything goes wrong:

Create ERR-XXX.

Record:

- exact error
- command
- environment
- root cause
- solution
- files changed
- verification
- prevention

Link it to:

EDU-002

If the error produces a reusable lesson:

also update PROJECT_MEMORY.md.

Do not silently fix meaningful errors.

==================================================
22. DO NOT INSTALL SUPABASE YET
==================================================

Important:

DO NOT perform the actual Supabase integration during EDU-002.

Do not:

- create Supabase database tables
- create migrations
- configure authentication
- create RLS
- configure Supabase Storage
- create Edge Functions
- add service-role credentials

Those belong to:

EDU-003 — Configure Supabase

You may create clean architectural placeholders/interfaces if genuinely necessary, but do not implement Supabase functionality yet.

==================================================
23. DO NOT BUILD BUSINESS FEATURES
==================================================

Do NOT implement:

- workflow engine
- AI context engine
- policy engine
- document management
- approvals
- signatures
- notifications
- audit trail
- analytics
- institution management
- role management

Those will be built later in separate verified tasks.

==================================================
24. VERIFY EVERYTHING
==================================================

After implementation run:

1. dependency installation
2. lint
3. typecheck
4. tests
5. production build

Use the actual commands defined by the project.

Fix errors found during verification.

Run the checks again after fixes.

The final result must be verified, not assumed.

==================================================
25. ACCEPTANCE CRITERIA
==================================================

EDU-002 can be marked COMPLETE only if:

[ ] fresh project successfully initialized
[ ] framework configured
[ ] TypeScript strict mode configured
[ ] package manager established
[ ] project structure established
[ ] environment strategy established
[ ] .env.example created
[ ] secrets protected
[ ] application shell created
[ ] basic accessible UI foundation created
[ ] error handling foundation created
[ ] logging foundation created
[ ] testing foundation created
[ ] lint passes
[ ] typecheck passes
[ ] tests pass
[ ] production build passes
[ ] Git initialized/configured
[ ] .gitignore configured
[ ] README created
[ ] five AI memory/state files updated
[ ] all meaningful errors recorded
[ ] all important decisions recorded
[ ] next task identified

==================================================
26. FINAL RESPONSE
==================================================

After completing EDU-002, STOP.

Do NOT start EDU-003 automatically.

Return:

# EDU-002 — Fresh Project Initialization

## Status
COMPLETE / PARTIAL / BLOCKED

## Project Stack
- Framework:
- Version:
- Language:
- Package manager:
- Styling:
- Testing:
- Deployment target:

## Architecture
Briefly explain the initial architecture.

## Project Structure
Show the important directories.

## Dependencies
List important dependencies and why they were added.

## Environment
List environment variable NAMES only.
NEVER display secret values.

## UI Foundation
Explain what was created.

## Testing
Show exact commands and results.

## Build
Show exact command and result.

## Git
Explain Git initialization and initial commit if performed.

## Errors
List ERR IDs.

## Decisions
List DEC IDs.

## Files Created/Changed
List them.

## State Files
Confirm all five state files were updated.

## Next Task

EDU-003 — Configure Supabase

Explain why EDU-003 is the next dependency.

STOP HERE.

Wait for the next prompt.
```

### After this prompt

The AI should leave you with a **clean, runnable Next.js/TypeScript project**, but **without pretending that EduSphere's actual functionality exists yet**.

When it finishes, paste its **EDU-002 final report here**.

Then I'll give you **EDU-003 — Supabase configuration**, and we'll continue one prompt at a time.
