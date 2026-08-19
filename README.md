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

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

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

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Run Tests

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### 5. Type Checking

```bash
npm run typecheck
```

### 6. Linting

```bash
npm run lint
```

### 7. Production Build

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
│   │   └── logger.ts        # Logging utility
│   ├── config/              # Configuration
│   │   └── env.ts           # Environment config
│   ├── types/               # TypeScript types
│   └── __tests__/           # Test files
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
