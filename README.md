# EduSphere AI

Context-aware workflow automation platform for higher education institutions.

## Project Status

🚧 **IN DEVELOPMENT** - Foundation initialized, core features in progress

**Current Phase:** EDU-002 Complete - Production foundation established

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

**Note:** Database schema will be implemented in EDU-004. For now, the migration system is configured but no migrations exist yet.

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
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Home page
│   │   ├── error.tsx         # Error boundary
│   │   ├── not-found.tsx     # 404 page
│   │   ├── loading.tsx       # Loading UI
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   └── ui/              # Reusable UI components
│   ├── lib/                 # Utility functions
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
│   └── __tests__/           # Test files
├── supabase/                # Supabase configuration
│   ├── config.toml          # Supabase project config
│   └── migrations/          # Database migrations (EDU-004)
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
- ✅ Row Level Security (RLS) - to be implemented in EDU-007
- ✅ Server-side authorization - to be implemented in EDU-007

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

**Next Tasks:**
- [ ] EDU-003: Supabase configuration
- [ ] EDU-004: Database schema and migrations
- [ ] EDU-005: Authentication
- [ ] EDU-006: Authorization and RLS
- [ ] EDU-007: Application shell and dashboard
- [ ] EDU-008: Document upload and metadata
- [ ] EDU-009: Context engine
- [ ] EDU-010: Policy validation engine
- [ ] EDU-011: Workflow generator
- [ ] EDU-012: Workflow execution
- [ ] EDU-013: Approvals and signatures
- [ ] EDU-014: Notifications
- [ ] EDU-015: Audit trail
- [ ] EDU-016: Analytics
- [ ] EDU-017: Security hardening
- [ ] EDU-018: Production deployment

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

**Last Updated**: 2026-08-19  
**Current Task**: EDU-002 Complete  
**Next Task**: EDU-003 (Supabase Configuration)
