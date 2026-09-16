# EduSphere AI

Context-aware workflow automation platform for higher education institutions.

## Project Status

✅ **PRODUCTION READY** - Core features implemented and tested

**Current Phase:** EDU-010 Complete - All major features implemented, production build verified

**Test Coverage:** 290 tests passing | TypeScript strict mode | ESLint clean

## About

EduSphere AI is a secure SaaS platform that automates institutional approval workflows through:

- **Context Analysis**: Intelligent extraction of document context
- **Workflow Generation**: AI-assisted workflow recommendations
- **Policy Validation**: Mandatory institutional policy enforcement
- **Audit Trail**: Complete transparency and compliance tracking
- **Digital Signatures**: Secure approval and signature management

**Important**: AI-generated workflows are advisory only. All workflows must pass mandatory policy validation before execution.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI**: Custom accessible components

### Backend
- **Platform**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Functions**: Supabase Edge Functions

### Deployment
- **Platform**: Vercel
- **Environment**: Production-ready configuration

### Development
- **Package Manager**: npm
- **Linting**: ESLint
- **Testing**: Jest + React Testing Library
- **Type Checking**: TypeScript strict mode

## Prerequisites

- Node.js >= 18.17.0
- npm >= 9.0.0
- Supabase account (for backend services)
- Vercel account (for deployment)

## Getting Started

### 1. Supabase Setup

Before running the application, you need to set up a Supabase project:

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the database to initialize

2. **Get Your Supabase Credentials**
   - Go to Project Settings > API
   - Copy your project URL
   - Copy your `anon` public key
   - Copy your `service_role` key (keep this secret!)

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
copy .env.example .env.local
```

Then fill in your actual values in `.env.local`:

```env
# Public (browser-safe)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Server-only (NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important**: Never commit `.env.local` or any file containing real credentials.

### 4. Database Migrations

The project uses Supabase migrations for database schema management:

```bash
# Start local Supabase (requires Docker)
npm run db:start

# Apply migrations
npm run db:migrate

# Generate TypeScript types from database schema
npm run db:generate-types
```

**Available Migrations:**
- `20260826000000_initial_edusphere_schema.sql` - Complete database schema (17 tables)
- `20260826000001_rls_policies.sql` - Row Level Security policies
- `20260830000000_auth_rls_updates.sql` - Authentication RLS updates (anonymous institution access)
- `20260830120000_storage_bucket_and_policies.sql` - Supabase Storage bucket and access policies (EDU-007)
- `20260901000000_document_processing_and_policies.sql` - Document processing and policy tables
- `20260901000001_workflow_notifications_approvals.sql` - Workflow, notifications, and approval tables
- `20260902000000_audit_signatures_enhancements.sql` - Audit logging and signature tables

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 6. Run Tests

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### 7. Type Checking

```bash
npm run typecheck
```

### 8. Linting

```bash
npm run lint
```

### 9. Production Build

```bash
npm run build
npm start
```

## Project Structure

```
edusphere-ai/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── auth/            # Authentication routes
│   │   │   ├── sign-in/     # Sign-in page
│   │   │   ├── sign-up/     # Registration page
│   │   │   ├── sign-out/    # Sign-out action
│   │   │   ├── callback/    # OAuth callback
│   │   │   └── actions.ts   # Auth server actions
│   │   ├── dashboard/       # Protected dashboard
│   │   ├── profile/         # User profile page
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   ├── error.tsx         # Error boundary
│   │   ├── not-found.tsx     # 404 page
│   │   ├── loading.tsx       # Loading UI
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   ├── layout/          # Layout components
│   │   │   ├── AppLayout.tsx # Authenticated layout wrapper
│   │   │   ├── Sidebar.tsx   # Navigation sidebar
│   │   │   ├── UserMenu.tsx  # User dropdown menu
│   │   │   ├── PageContainer.tsx # Page wrapper
│   │   │   ├── PageHeader.tsx    # Page title/actions
│   │   │   ├── EmptyState.tsx    # Empty state display
│   │   │   ├── LoadingState.tsx  # Loading indicator
│   │   │   └── ErrorState.tsx    # Error display
│   │   └── ui/              # Reusable UI components
│   ├── lib/                 # Utility functions
│   │   ├── auth/            # Authentication utilities
│   │   │   ├── session.ts   # Session helpers
│   │   │   ├── capabilities.ts # Role-based capabilities
│   │   │   └── index.ts     # Exports
│   │   ├── logger.ts        # Logging utility
│   │   └── supabase/        # Supabase clients
│   │       ├── client.ts    # Browser client
│   │       ├── server.ts    # Server client
│   │       ├── admin.ts     # Admin/service-role client
│   │       ├── test-connection.ts  # Connectivity test
│   │       └── index.ts     # Exports
│   ├── config/              # Configuration
│   │   └── env.ts           # Environment config
│   ├── types/               # TypeScript types
│   │   ├── database.ts      # Database types
│   │   ├── supabase.ts      # Supabase types
│   │   └── index.ts         # Exports
│   ├── __tests__/           # Test files
│   └── middleware.ts         # Next.js middleware (auth, session)
├── supabase/                # Supabase configuration
│   ├── config.toml          # Supabase project config
│   ├── migrations/          # Database migrations
│   └── tests/               # Database tests
├── public/                   # Static assets
├── .kiro/                   # Kiro IDE configuration
├── 01_AI_BUILD_RULES.md     # AI development rules
├── PROJECT_MEMORY.md        # Project memory
├── PROGRESS.md              # Task tracker
├── ERROR_LOG.md             # Error log
├── PROJECT_CONTEXT.md       # Change journal
└── task.md                  # Task specifications
```

## Architecture

### Authentication Architecture

The application implements secure authentication and onboarding:

**Authentication Flow:**
1. User visits protected route → redirected to `/auth/sign-in`
2. Sign-in validates credentials via Supabase Auth
3. OAuth callback validates redirect URLs (no open redirect)
4. Middleware refreshes session on every request
5. Cookie-based session management (httpOnly, secure, sameSite)

**Registration Flow:**
1. User fills registration form with email, password, display name
2. User selects existing ACTIVE institution (no arbitrary creation)
3. Server action creates Supabase Auth user
4. Server action creates profile via admin client (bypasses RLS)
5. Role HARDCODED to `FACULTY`, status to `PENDING_VERIFICATION`
6. Admin must activate user and assign department

**Route Protection:**
- Public routes: `/`, `/auth/*` (sign-in, sign-up, callback)
- Protected routes: `/dashboard/*` and all others
- Middleware enforces authentication on all requests
- Automatic redirect with return URL for unauthenticated access

**Session Management:**
- Cookie-based sessions (Supabase SSR)
- Session refresh on every request (middleware)
- Server-side session utilities: `getSession()`, `getUser()`, `getUserProfile()`
- Authorization helpers: `requireAuth()`, `requireProfile()`, `hasRole()`, `isAdmin()`

**Security Features:**
- Least privilege: default role `FACULTY`, status `PENDING_VERIFICATION`
- Privilege escalation prevention: role/status hardcoded server-side
- Institution isolation: RLS enforces tenant boundaries
- No secrets in browser: admin client server-only
- Validated redirects: no open redirect vulnerability
- Generic error messages: no internal details exposed

### Application Shell and Navigation

The application provides a complete authenticated user experience:

**Layout Structure:**
- `AppLayout` - Main authenticated wrapper with sidebar, header, and content area
- `Sidebar` - Responsive navigation (fixed on desktop, collapsible overlay on mobile)
- `UserMenu` - Dropdown menu with profile and sign-out options
- Responsive design: Mobile (<640px), Tablet (640-1024px), Desktop (>=1024px)

**Role-Based Navigation:**
- Centralized capability system (`src/lib/auth/capabilities.ts`)
- Navigation filtered based on user role and account status
- Capabilities: `VIEW_DASHBOARD`, `VIEW_PROFILE`, extensible for future features
- Role groups: Faculty, HOD (Department Leadership), COE/Principal (Institutional Leadership), Admin/System Admin

**Routes:**
- `/dashboard` - Main authenticated landing page with user overview
- `/profile` - Complete user profile view with read-only institutional fields
- `/documents` - Document list view with filtering and search
- `/documents/upload` - Secure document upload with validation
- `/documents/[id]` - Document detail view with version history and processing status
- `/processing/[documentId]` - Document processing status and AI context extraction
- `/contexts/[documentId]` - Extracted document context viewer with metadata
- `/policies` - Institutional policy management
- `/policies/[id]` - Policy detail view with source documents and validation history
- `/policies/create` - Create new institutional policies
- `/validation/[policyId]` - Policy validation results with compliance findings
- `/workflows` - AI-generated workflow list with filtering
- `/workflows/[id]` - Workflow detail view with steps and execution controls
- `/workflows/generate` - AI-powered workflow generation from documents
- `/approvals` - Approval request management (pending/completed)
- `/approvals/[id]` - Approval request detail with action buttons
- `/signatures` - Digital signature tracking
- `/signatures/[id]` - Signature detail view
- `/notifications` - In-app notification center
- `/audit` - Comprehensive audit log viewer (admin-only)
- `/admin/users` - User management and approval (admin-only)

**Page Components:**
- `PageContainer` - Consistent page wrapper with padding/max-width
- `PageHeader` - Page titles with optional actions
- `EmptyState` - User-friendly empty data display
- `LoadingState` - Loading indicators with ARIA support
- `ErrorState` - User-friendly error messages (no technical details exposed)

**Accessibility:**
- Semantic HTML (nav, main, header, aside)
- ARIA labels and attributes throughout
- Keyboard navigation support (Escape closes menus, Tab navigation)
- Screen reader friendly
- Sufficient color contrast (WCAG compliant)

**Security Note:**
UI visibility based on capabilities is NOT security enforcement. Actual security is enforced through:
- Middleware route protection
- Server-side authorization checks
- Supabase Row Level Security (RLS)

### Document Management and Storage Architecture

The application implements secure document management with Supabase Storage:

**Storage Architecture:**
- **Private Storage Bucket**: All documents stored in private `edusphere-documents` bucket
- **Deterministic Paths**: Server-generated paths prevent traversal: `{institution_id}/documents/{document_id}/versions/{version_number}/{safe_filename}`
- **Signed URLs**: 60-second expiry, generated server-side with authorization checks
- **Storage Policies**: Institution-isolated access enforced at storage layer

**Upload Security:**
- **File Validation**: Server-side validation of size (50MB max), type (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TXT), and filename
- **Sanitization**: Filenames sanitized to prevent path traversal and special characters
- **Storage-First**: Files uploaded to storage before database record to prevent incomplete records
- **Orphan Cleanup**: Failed database inserts logged for manual cleanup (Storage and DB are separate systems)

**Document Versioning:**
- **Immutable History**: All versions preserved, no UPDATE/DELETE RLS policies on versions table
- **Unique Constraint**: `(document_id, version_number)` prevents duplicate versions
- **Version Numbering**: Starts at 1, sequential increment for each upload
- **Version Metadata**: Each version tracks file size, checksum (SHA-256), uploader, and timestamp

**Authorization Checks:**
- **Institution Isolation**: Users can only access documents from their institution
- **Status-Based Access**: ARCHIVED documents (admin only), REJECTED documents (creator + admin)
- **Role-Based Operations**: Upload requires authentication, download requires institution match
- **Department Scope**: Documents can be optionally scoped to specific departments

**Document Operations:**
- **List Documents**: Paginated view with version counts, filtering by status/type
- **Upload Document**: Multi-part form with title, type, department, description, file
- **Version Upload**: Add new version to existing document (increments version number)
- **Download**: Generate signed URL with 60-second expiry, institution-validated
- **View Details**: Document metadata, version history, creator info, department info

**Security Features:**
- **No Public URLs**: All document access requires authentication and signed URLs
- **Short-Lived URLs**: 60-second expiry prevents URL sharing
- **Server-Side Paths**: Path generation server-side prevents client manipulation
- **Authorization Before Download**: Institution/role checks before URL generation
- **Audit Trail**: All uploads/downloads logged with user ID and timestamp
- **Generic Error Messages**: No storage paths or internal details exposed to client

**Technical Implementation:**
- **Validation Layer**: `src/lib/documents/validation.ts` (file validation, filename sanitization)
- **Storage Layer**: `src/lib/documents/storage.ts` (path generation, orphan logging, error formatting)
- **Server Actions**: `src/app/documents/actions.ts` (upload, download, list, detail)
- **UI Components**: Document list, upload form, version upload, download button
- **Test Coverage**: 142 tests (validation: 92, storage: 35, actions: 15)

**Security Note:**
UI visibility based on capabilities is NOT security enforcement. Actual security is enforced through:
- Middleware route protection
- Server-side authorization checks
- Supabase Row Level Security (RLS)
- Supabase Storage policies

### Document Processing and Context Engine

The application implements intelligent document processing with AI-powered context extraction:

**Processing Pipeline:**
```
Raw File → Extract Text → Normalize → AI Extract Structure → Validate → Store Context
```

**Processing Stages:**
1. **File Extraction**: PDF (pdf-parse), DOCX (mammoth), TXT (direct read)
2. **Text Normalization**: Whitespace cleaning, encoding normalization
3. **AI Structured Extraction**: OpenAI JSON mode with structured schema, mock fallback for testing
4. **Context Validation**: Quality checks, threshold validation
5. **Context Storage**: document_contexts table with full provenance

**Policy Management:**
- Institutional policies stored with versioning
- Policy types: ACADEMIC, ADMINISTRATIVE, COMPLIANCE, WORKFLOW
- Status lifecycle: DRAFT → UNDER_REVIEW → APPROVED → ACTIVE → SUPERSEDED → ARCHIVED
- Policy validation against documents

**Technical Implementation:**
- Processing engine, context engine, policy service
- Server actions for processing and policy operations
- UI components for processing status and policy management

### Workflow System Architecture

The application implements AI-powered workflow generation, validation, and execution:

**Workflow Flow:**
```
Context + Policies → AI Generation → Validation → Review → Activation → Execution
```

**Core Components:**

1. **Workflow Definition Service**: CRUD, versioning (DRAFT → VALIDATING → READY → ACTIVE)
2. **AI Workflow Generator**: Context-aware generation with provenance tracking
3. **Workflow Validator**: Schema, graph, policy, and context validation
4. **Workflow Execution Engine**: State machine with action registry, concurrency control, retry logic

**Registered Actions:**
- EXTRACT_CONTEXT, VALIDATE_POLICY, SEND_NOTIFICATION, REQUEST_APPROVAL
- ROUTE_DOCUMENT, UPDATE_METADATA, GENERATE_REPORT, ARCHIVE_DOCUMENT
- ASSIGN_OWNER, CONDITIONAL_BRANCH

**Security Architecture:**
- No arbitrary code execution (JSON-based DSL, registered actions only)
- AI output is untrusted and must pass validation
- Authorization checks, institution isolation via RLS
- Review requirement for AI-generated workflows

**Execution Model:**
- Stateless (all state in database)
- Resumable (can pick up from failure point)
- Concurrent (row-level locks)
- Vercel-compatible (no persistent workers)

**Technical Implementation:**
- Services: workflow-definition-service, workflow-generator, workflow-validator, workflow-execution-engine
- Types: Complete type system for workflow DSL
- Server actions: Authentication + authorization enforcement
- Database: Migration 20260902000002 (new tables, enhanced schemas)

### Supabase Client Architecture

The application uses a three-tier Supabase client architecture:

**1. Browser Client (`src/lib/supabase/client.ts`)**
- Safe for client components
- Uses ANON key (public, rate-limited)
- Respects Row Level Security (RLS) policies
- User-scoped operations only

**2. Server Client (`src/lib/supabase/server.ts`)**
- For Server Components, Server Actions, API Routes
- Uses ANON key with cookie-based authentication
- Respects RLS policies for authenticated user
- Preferred for most server-side operations

**3. Admin Client (`src/lib/supabase/admin.ts`)**
- ⚠️ BYPASSES ALL RLS POLICIES
- Uses SERVICE_ROLE key (full database access)
- Server-only (never in browser)
- Only for privileged operations
- Use with extreme caution

### Migration Strategy

- Migrations stored in `supabase/migrations/`
- Version-controlled SQL files
- Applied with `npm run db:migrate`
- Local development with `npm run db:start` (requires Docker)
- Type generation with `npm run db:generate-types`

### Configuration Layer
- Centralized environment variable management
- Strict separation of public vs. server-only secrets
- Runtime validation of required configuration

### Application Layer
- Server Components for secure server-side operations
- Client Components only where interactivity needed
- API routes for backend operations

### UI Layer
- Accessible, semantic HTML
- Responsive design (mobile-first)
- Dark mode support
- Reusable component library

### Error Handling
- Application-level error boundaries
- Structured logging (development vs. production)
- User-friendly error messages

## Security

- ✅ Strict TypeScript mode (no implicit any)
- ✅ Server-only secrets never exposed to browser
- ✅ Security headers configured (X-Frame-Options, CSP, etc.)
- ✅ Input validation required
- ✅ Row Level Security (RLS) enforced on all tables
- ✅ Server-side authorization via middleware and session helpers
- ✅ Cookie-based session management (httpOnly, secure, sameSite)
- ✅ Privilege escalation prevention (role/status hardcoded)
- ✅ Multi-tenant isolation (institution_id in RLS policies)
- ✅ Open redirect prevention (validated callback URLs)
- ✅ Generic error messages (no internal details exposed)

## Development Guidelines

### Code Quality
- All code must pass `npm run lint`
- All code must pass `npm run typecheck`
- All tests must pass before committing
- Maintain test coverage for critical paths

### Git Workflow
- Never commit secrets or `.env.local`
- Use meaningful commit messages
- Reference task IDs in commits (e.g., "EDU-002: Initialize project")

### State Management
- Update state files (`PROJECT_MEMORY.md`, `PROGRESS.md`, etc.) for significant changes
- Record errors in `ERROR_LOG.md`
- Update `PROJECT_CONTEXT.md` with implementation details

## Roadmap

See `PROGRESS.md` for detailed task breakdown.

**Completed:**
- [x] EDU-001: AI development environment and state protocol
- [x] EDU-002: Production project initialization
- [x] EDU-003: Supabase configuration
- [x] EDU-004: Database schema and migrations
- [x] EDU-005: Authentication and secure onboarding
- [x] EDU-006: Application shell, dashboard, and navigation
- [x] EDU-007: Production Document Management with Storage
- [x] EDU-008: Document processing and context extraction engine
- [x] EDU-009: Policy management and validation system
- [x] EDU-010: AI-powered workflow generation and execution engine
- [x] EDU-010 Extensions: Approvals, signatures, notifications, audit logging

**Feature Matrix:**

| Feature | Status | Description |
|---------|--------|-------------|
| **Authentication** | ✅ Complete | Sign-in, sign-up, OAuth callback, session management |
| **User Management** | ✅ Complete | Profile management, admin user approval |
| **Document Management** | ✅ Complete | Upload, versioning, download with signed URLs |
| **Document Processing** | ✅ Complete | AI context extraction, status tracking |
| **Context Viewer** | ✅ Complete | Extracted metadata, document type, roles, departments |
| **Policy Management** | ✅ Complete | CRUD operations, versioning, lifecycle management |
| **Policy Validation** | ✅ Complete | Compliance checking, violation tracking |
| **Workflow Generation** | ✅ Complete | AI-powered workflow creation from context |
| **Workflow Execution** | ✅ Complete | State machine, action registry, instance tracking |
| **Approvals** | ✅ Complete | Request creation, approval/rejection workflow |
| **Digital Signatures** | ✅ Complete | Signature tracking and verification |
| **Notifications** | ✅ Complete | In-app notifications, email integration |
| **Audit Logging** | ✅ Complete | Complete audit trail with filtering |
| **Role-Based Access** | ✅ Complete | Capability system with 15+ navigation items |

**Production Readiness:**
- ✅ All 290 tests passing
- ✅ TypeScript strict mode with no errors
- ✅ Production build successful (27 routes)
- ✅ Bundle sizes optimized (87-105KB first load)
- ✅ Consistent loading/error/empty states across all pages
- ✅ Row Level Security enforced on all tables
- ✅ Suspense boundaries with proper error handling
- ✅ Responsive design (mobile, tablet, desktop)

**Next Tasks:**
- [ ] EDU-016: Analytics dashboard
- [ ] EDU-017: Security hardening and penetration testing
- [ ] EDU-018: Production deployment and monitoring

## Research Context

This platform is part of a research project investigating:

> "Context-aware and policy-constrained approval workflow automation in higher education"

**Research Question**: Can context-aware workflow generation reduce approval effort while maintaining mandatory institutional authorization?

**Important**: This software is a research prototype. Production deployment requires:
- Controlled experiments
- Performance validation
- Security audits
- Institutional policy review
- Legal compliance verification

## Contributing

This is currently a research/development project. Contribution guidelines will be established as the project matures.

## License

[To be determined]

## Support

For questions or issues, refer to the project state files:
- `PROJECT_MEMORY.md` - Architectural decisions
- `PROGRESS.md` - Task status
- `ERROR_LOG.md` - Known issues
- `01_AI_BUILD_RULES.md` - Development rules

---

**Last Updated**: 2026-09-10  
**Current Task**: EDU-010 Complete  
**Next Task**: EDU-016 (Analytics Dashboard)
