

# EduSphere AI Database Schema Documentation

**Task:** EDU-004  
**Created:** 2026-08-26  
**Status:** Complete

## Overview

The EduSphere AI database schema is designed to support a multi-tenant SaaS platform for context-aware, policy-constrained approval workflow automation in higher education.

### Key Design Principles

1. **Multi-tenancy**: Institution-based isolation with department hierarchy
2. **Security**: Row Level Security (RLS) enforcing tenant boundaries
3. **Auditability**: Immutable audit trail for compliance
4. **Versioning**: Historical preservation of documents, policies, and workflows
5. **AI-Awareness**: Distinguish AI-generated recommendations from validated workflows
6. **Extensibility**: Support future features without breaking changes

## Architecture Decisions

| ID | Decision | Rationale |
|---|---|---|
| **DEC-016** | Multi-tenant by institution | SaaS model requires strict tenant isolation |
| **DEC-017** | UUID primary keys | Global uniqueness, security, distributed systems |
| **DEC-018** | Separate workflow definitions from instances | Allow definition evolution without corrupting history |
| **DEC-019** | Immutable audit/approval records | Compliance and non-repudiation requirements |
| **DEC-020** | RLS for authorization | Defense in depth, prevent data leaks |
| **DEC-021** | JSONB for variable AI attributes | AI-extracted data has flexible schema |
| **DEC-022** | Document versioning | Preserve complete document history |

## Entity Relationship Diagram

```
institutions (1) ──┬─── (N) departments
                   ├─── (N) profiles
                   ├─── (N) documents
                   ├─── (N) policies
                   ├─── (N) workflow_definitions
                   ├─── (N) workflow_instances
                   └─── (N) audit_events

departments (1) ─── (N) profiles

auth.users (1) ───── (1) profiles

documents (1) ──┬─── (N) document_versions
                ├─── (1) document_contexts
                ├─── (N) workflow_instances
                └─── (N) approvals

workflow_definitions (1) ──┬─── (N) workflow_steps
                            └─── (N) workflow_instances

workflow_instances (1) ──┬─── (N) workflow_instance_steps
                         ├─── (N) approvals
                         └─── (N) signatures

approvals (1) ───── (N) signatures

ai_generation_records (1) ───── (N) policy_validation_records
```

## Core Tables

### 1. Institutions

**Purpose:** Multi-tenant organization management

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Institution name |
| code | TEXT | Stable identifier (e.g., "UNIV_ABC") |
| slug | TEXT | URL-friendly identifier |
| status | ENUM | ACTIVE, INACTIVE, SUSPENDED |
| metadata | JSONB | Flexible institutional metadata |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Unique Constraints:**
- `code` (unique across all institutions)
- `slug` (unique across all institutions)

**Indexes:**
- `status`
- `created_at`

---

### 2. Departments

**Purpose:** Department hierarchy within institutions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| institution_id | UUID | Foreign key → institutions |
| name | TEXT | Department name |
| code | TEXT | Department code |
| status | ENUM | ACTIVE, INACTIVE, SUSPENDED |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Unique Constraints:**
- `(institution_id, code)` (code unique within institution)

**Foreign Keys:**
- `institution_id` → institutions(id) ON DELETE RESTRICT

**Indexes:**
- `institution_id`
- `status`

---

### 3. Profiles

**Purpose:** Application user profiles linked to Supabase Auth

**SECURITY:** References auth.users; do NOT store passwords

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (references auth.users) |
| institution_id | UUID | Foreign key → institutions |
| department_id | UUID | Foreign key → departments (nullable) |
| display_name | TEXT | User display name |
| email | TEXT | User email |
| role | TEXT | Application role (FACULTY, HOD, COE, PRINCIPAL, ADMIN) |
| status | ENUM | ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Foreign Keys:**
- `id` → auth.users(id) ON DELETE CASCADE
- `institution_id` → institutions(id) ON DELETE RESTRICT
- `department_id` → departments(id) ON DELETE SET NULL

**Indexes:**
- `institution_id`
- `department_id`
- `email`
- `role`
- `status`

**RLS Protection:** Users cannot modify their own `role` field

---

### 4. Documents

**Purpose:** Document metadata and storage references

**SECURITY:** Large files stored in Supabase Storage, not in database

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| institution_id | UUID | Foreign key → institutions |
| department_id | UUID | Foreign key → departments (nullable) |
| created_by | UUID | Foreign key → profiles |
| title | TEXT | Document title |
| document_type | TEXT | Document type/category |
| description | TEXT | Document description (nullable) |
| storage_path | TEXT | Supabase Storage path (nullable) |
| status | ENUM | DRAFT, SUBMITTED, IN_REVIEW, APPROVED, REJECTED, ARCHIVED |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Foreign Keys:**
- `institution_id` → institutions(id) ON DELETE RESTRICT
- `department_id` → departments(id) ON DELETE SET NULL
- `created_by` → profiles(id) ON DELETE RESTRICT

**Indexes:**
- `institution_id`
- `department_id`
- `created_by`
- `status`
- `document_type`
- `created_at`

---

### 5. Document Versions

**Purpose:** Immutable document version history

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| document_id | UUID | Foreign key → documents |
| version_number | INTEGER | Version number (1, 2, 3...) |
| storage_path | TEXT | Supabase Storage path |
| checksum | TEXT | SHA-256 hash (nullable) |
| file_size_bytes | BIGINT | File size in bytes (nullable) |
| uploaded_by | UUID | Foreign key → profiles |
| created_at | TIMESTAMPTZ | Upload timestamp |

**Unique Constraints:**
- `(document_id, version_number)` (prevent duplicate versions)

**Foreign Keys:**
- `document_id` → documents(id) ON DELETE CASCADE
- `uploaded_by` → profiles(id) ON DELETE RESTRICT

**Indexes:**
- `document_id`
- `uploaded_by`
- `created_at`

**Immutability:** No UPDATE or DELETE RLS policies

---

### 6. Document Contexts

**Purpose:** AI-extracted context from documents

**SECURITY:** Distinguish AI output from authoritative data

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| document_id | UUID | Foreign key → documents (unique) |
| document_type_detected | TEXT | AI-detected type (nullable) |
| creator_role_detected | TEXT | AI-detected creator role (nullable) |
| department_scope | TEXT | Department scope (nullable) |
| purpose | TEXT | Document purpose (nullable) |
| impact_level | TEXT | Impact level (nullable) |
| extracted_attributes | JSONB | Variable AI-extracted attributes |
| processing_status | ENUM | PENDING, PROCESSING, COMPLETED, FAILED |
| confidence_score | NUMERIC | 0.0000 to 1.0000 (nullable) |
| model_version | TEXT | AI model version (nullable) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Unique Constraints:**
- `document_id` (one context per document)

**Foreign Keys:**
- `document_id` → documents(id) ON DELETE CASCADE

**Indexes:**
- `processing_status`
- `created_at`

**RLS:** Read-only for users; INSERT/UPDATE by service role only

---

### 7. Policies

**Purpose:** Institutional policy definitions with versioning

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| institution_id | UUID | Foreign key → institutions |
| department_id | UUID | Foreign key → departments (nullable) |
| name | TEXT | Policy name |
| description | TEXT | Policy description (nullable) |
| version | INTEGER | Version number (1, 2, 3...) |
| policy_rules | JSONB | Policy rules/configuration |
| effective_from | DATE | Effective start date (nullable) |
| effective_until | DATE | Effective end date (nullable) |
| status | ENUM | DRAFT, ACTIVE, INACTIVE, ARCHIVED |
| created_by | UUID | Foreign key → profiles |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Foreign Keys:**
- `institution_id` → institutions(id) ON DELETE RESTRICT
- `department_id` → departments(id) ON DELETE SET NULL
- `created_by` → profiles(id) ON DELETE RESTRICT

**Indexes:**
- `institution_id`
- `department_id`
- `status`
- `created_by`
- `effective_from`

---

### 8. Workflow Definitions

**Purpose:** Reusable workflow templates

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| institution_id | UUID | Foreign key → institutions |
| name | TEXT | Workflow name |
| description | TEXT | Workflow description (nullable) |
| workflow_type | TEXT | Workflow type/category |
| version | INTEGER | Version number (1, 2, 3...) |
| status | ENUM | DRAFT, ACTIVE, INACTIVE, ARCHIVED |
| created_by | UUID | Foreign key → profiles |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Foreign Keys:**
- `institution_id` → institutions(id) ON DELETE RESTRICT
- `created_by` → profiles(id) ON DELETE RESTRICT

**Indexes:**
- `institution_id`
- `status`
- `workflow_type`
- `created_by`

---

### 9. Workflow Steps

**Purpose:** Ordered steps within a workflow definition

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workflow_definition_id | UUID | Foreign key → workflow_definitions |
| step_name | TEXT | Step name |
| step_type | TEXT | Step type |
| sequence_order | INTEGER | Step sequence (1, 2, 3...) |
| approver_role | TEXT | Required approver role (nullable) |
| approver_user_id | UUID | Specific approver user (nullable) |
| department_id | UUID | Department requirement (nullable) |
| is_mandatory | BOOLEAN | Mandatory step flag |
| timeout_hours | INTEGER | Timeout in hours (nullable) |
| step_config | JSONB | Step configuration |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Unique Constraints:**
- `(workflow_definition_id, sequence_order)` (sequence unique within workflow)

**Foreign Keys:**
- `workflow_definition_id` → workflow_definitions(id) ON DELETE CASCADE
- `approver_user_id` → profiles(id) ON DELETE SET NULL
- `department_id` → departments(id) ON DELETE SET NULL

**Indexes:**
- `workflow_definition_id`
- `approver_role`
- `approver_user_id`

---

### 10. Workflow Instances

**Purpose:** Actual workflow executions

**SECURITY:** Preserve historical workflow configuration snapshot

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workflow_definition_id | UUID | Foreign key → workflow_definitions |
| document_id | UUID | Foreign key → documents |
| institution_id | UUID | Foreign key → institutions |
| instance_name | TEXT | Instance name |
| workflow_snapshot | JSONB | Historical workflow configuration |
| status | ENUM | PENDING, IN_PROGRESS, COMPLETED, REJECTED, CANCELLED |
| initiated_by | UUID | Foreign key → profiles |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| completed_at | TIMESTAMPTZ | Completion timestamp (nullable) |

**Foreign Keys:**
- `workflow_definition_id` → workflow_definitions(id) ON DELETE RESTRICT
- `document_id` → documents(id) ON DELETE RESTRICT
- `institution_id` → institutions(id) ON DELETE RESTRICT
- `initiated_by` → profiles(id) ON DELETE RESTRICT

**Indexes:**
- `workflow_definition_id`
- `document_id`
- `institution_id`
- `status`
- `initiated_by`
- `created_at`

---

### 11. Workflow Instance Steps

**Purpose:** Actual execution steps with historical preservation

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workflow_instance_id | UUID | Foreign key → workflow_instances |
| workflow_step_id | UUID | Foreign key → workflow_steps (nullable) |
| step_name | TEXT | Step name (preserved) |
| sequence_order | INTEGER | Step sequence |
| assigned_approver_id | UUID | Assigned approver (nullable) |
| status | ENUM | PENDING, IN_PROGRESS, COMPLETED, SKIPPED, REJECTED |
| decision | ENUM | APPROVED, REJECTED, RETURNED_FOR_REVISION, DELEGATED (nullable) |
| comments | TEXT | Step comments (nullable) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| started_at | TIMESTAMPTZ | Start timestamp (nullable) |
| completed_at | TIMESTAMPTZ | Completion timestamp (nullable) |

**Unique Constraints:**
- `(workflow_instance_id, sequence_order)` (sequence unique within instance)

**Foreign Keys:**
- `workflow_instance_id` → workflow_instances(id) ON DELETE CASCADE
- `workflow_step_id` → workflow_steps(id) ON DELETE SET NULL
- `assigned_approver_id` → profiles(id) ON DELETE SET NULL

**Indexes:**
- `workflow_instance_id`
- `assigned_approver_id`
- `status`

**RLS:** Read-only for users; INSERT/UPDATE by service role only

---

### 12. Approvals

**Purpose:** Immutable approval decision records

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| workflow_instance_id | UUID | Foreign key → workflow_instances |
| workflow_instance_step_id | UUID | Foreign key → workflow_instance_steps (nullable) |
| document_id | UUID | Foreign key → documents |
| approver_id | UUID | Foreign key → profiles |
| decision | ENUM | APPROVED, REJECTED, RETURNED_FOR_REVISION, DELEGATED |
| comments | TEXT | Approval comments (nullable) |
| metadata | JSONB | Additional metadata |
| created_at | TIMESTAMPTZ | Decision timestamp |

**Foreign Keys:**
- `workflow_instance_id` → workflow_instances(id) ON DELETE RESTRICT
- `workflow_instance_step_id` → workflow_instance_steps(id) ON DELETE SET NULL
- `document_id` → documents(id) ON DELETE RESTRICT
- `approver_id` → profiles(id) ON DELETE RESTRICT

**Indexes:**
- `workflow_instance_id`
- `workflow_instance_step_id`
- `document_id`
- `approver_id`
- `decision`
- `created_at`

**Immutability:** No UPDATE or DELETE RLS policies

---

### 13. Signatures

**Purpose:** Digital signature tracking foundation

**SECURITY:** Do NOT store cryptographic material unsafely

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| approval_id | UUID | Foreign key → approvals (nullable) |
| workflow_instance_id | UUID | Foreign key → workflow_instances |
| document_id | UUID | Foreign key → documents |
| signer_id | UUID | Foreign key → profiles |
| signature_provider | TEXT | Provider name (nullable) |
| signature_reference | TEXT | Provider reference (nullable) |
| status | ENUM | PENDING, SIGNED, FAILED, EXPIRED |
| created_at | TIMESTAMPTZ | Creation timestamp |
| signed_at | TIMESTAMPTZ | Signature timestamp (nullable) |

**Foreign Keys:**
- `approval_id` → approvals(id) ON DELETE SET NULL
- `workflow_instance_id` → workflow_instances(id) ON DELETE RESTRICT
- `document_id` → documents(id) ON DELETE RESTRICT
- `signer_id` → profiles(id) ON DELETE RESTRICT

**Indexes:**
- `approval_id`
- `workflow_instance_id`
- `document_id`
- `signer_id`
- `status`
- `created_at`

---

### 14. Notifications

**Purpose:** Notification delivery tracking

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| recipient_id | UUID | Foreign key → profiles |
| notification_type | TEXT | Notification type |
| title | TEXT | Notification title |
| message | TEXT | Notification message (nullable) |
| related_entity_type | TEXT | Related entity type (nullable) |
| related_entity_id | UUID | Related entity ID (nullable) |
| status | ENUM | UNREAD, READ, ARCHIVED |
| created_at | TIMESTAMPTZ | Creation timestamp |
| read_at | TIMESTAMPTZ | Read timestamp (nullable) |

**Foreign Keys:**
- `recipient_id` → profiles(id) ON DELETE CASCADE

**Indexes:**
- `recipient_id`
- `notification_type`
- `status`
- `created_at`

**RLS:** Users can only access their own notifications

---

### 15. Audit Events

**Purpose:** Immutable audit trail for compliance

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| institution_id | UUID | Foreign key → institutions |
| actor_id | UUID | Foreign key → profiles (nullable) |
| event_type | TEXT | Event type |
| entity_type | TEXT | Affected entity type (nullable) |
| entity_id | UUID | Affected entity ID (nullable) |
| event_data | JSONB | Event details |
| created_at | TIMESTAMPTZ | Event timestamp |

**Foreign Keys:**
- `institution_id` → institutions(id) ON DELETE RESTRICT
- `actor_id` → profiles(id) ON DELETE SET NULL

**Indexes:**
- `institution_id`
- `actor_id`
- `event_type`
- `entity_type`
- `entity_id`
- `created_at`

**Immutability:** No UPDATE or DELETE RLS policies

---

### 16. AI Generation Records

**Purpose:** Track AI-generated workflow candidates

**SECURITY:** AI output is NOT authoritative until validated

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| document_id | UUID | Foreign key → documents (nullable) |
| document_context_id | UUID | Foreign key → document_contexts (nullable) |
| generated_workflow | JSONB | Generated workflow JSON |
| model_name | TEXT | AI model name (nullable) |
| model_version | TEXT | AI model version (nullable) |
| confidence_score | NUMERIC | 0.0000 to 1.0000 (nullable) |
| is_validated | BOOLEAN | Validation flag |
| validation_status | TEXT | Validation status (nullable) |
| created_at | TIMESTAMPTZ | Generation timestamp |
| validated_at | TIMESTAMPTZ | Validation timestamp (nullable) |

**Foreign Keys:**
- `document_id` → documents(id) ON DELETE SET NULL
- `document_context_id` → document_contexts(id) ON DELETE SET NULL

**Indexes:**
- `document_id`
- `document_context_id`
- `is_validated`
- `created_at`

**RLS:** Read-only for users; INSERT/UPDATE by service role only

---

### 17. Policy Validation Records

**Purpose:** Policy validation results for audit trail

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| ai_generation_record_id | UUID | Foreign key → ai_generation_records (nullable) |
| workflow_definition_id | UUID | Foreign key → workflow_definitions (nullable) |
| policy_id | UUID | Foreign key → policies (nullable) |
| policy_version | INTEGER | Policy version evaluated (nullable) |
| validation_result | TEXT | Validation result description |
| is_compliant | BOOLEAN | Compliance flag |
| violations | JSONB | List of violations (array) |
| validator_version | TEXT | Validator version (nullable) |
| created_at | TIMESTAMPTZ | Validation timestamp |

**Foreign Keys:**
- `ai_generation_record_id` → ai_generation_records(id) ON DELETE CASCADE
- `workflow_definition_id` → workflow_definitions(id) ON DELETE SET NULL
- `policy_id` → policies(id) ON DELETE SET NULL

**Indexes:**
- `ai_generation_record_id`
- `workflow_definition_id`
- `policy_id`
- `is_compliant`
- `created_at`

**Immutability:** No UPDATE or DELETE RLS policies

---

## Row Level Security (RLS)

### Security Model

1. **Authenticated users** can only access data from their institution
2. **User profiles** determine institution membership
3. **Service role** bypasses RLS (admin operations only)
4. **Anonymous access** is denied
5. **Audit events** are append-only

### Helper Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `auth.user_institution_id()` | UUID | Get current user's institution |
| `auth.user_has_institution()` | BOOLEAN | Check if user has institution |
| `auth.user_role()` | TEXT | Get current user's role |
| `auth.user_is_admin()` | BOOLEAN | Check if user is admin |

### Key RLS Policies

#### Institutions
- Users can view their own institution
- Admins can view all institutions
- Only admins can update institutions

#### Profiles
- Users can view profiles in their institution
- Users can update their own basic info (NOT role)
- Admins can update profiles in their institution

#### Documents
- Users can view documents in their institution
- Users can create/update their own documents
- Admins can update any document in their institution

#### Approvals
- Users can view approvals in their institution
- Users can create approvals when assigned
- No UPDATE or DELETE (immutable)

#### Audit Events
- Users can view audit events in their institution
- No INSERT, UPDATE, or DELETE for users (service role only)

### RLS Test Scenarios

| Scenario | Expected Result | Status |
|----------|----------------|--------|
| User A reads Institution A document | ALLOW | ✅ Tested |
| User A reads Institution B document | DENY | ✅ Tested |
| User A modifies Institution B document | DENY | ✅ Tested |
| Normal user promotes self to admin | DENY | ✅ Tested |
| Unauthorized user modifies audit history | DENY | ✅ Tested |
| Anonymous user accesses protected data | DENY | ✅ Tested |

---

## Migrations

### Migration Files

1. **20260826000000_initial_edusphere_schema.sql**
   - All table definitions
   - Enums
   - Constraints and indexes
   - Triggers for updated_at
   - RLS enablement

2. **20260826000001_rls_policies.sql**
   - Helper functions
   - RLS policies for all tables
   - Security documentation

3. **20260826000002_rls_verification_tests.sql**
   - Test data creation
   - RLS verification functions
   - Verification views

### Applying Migrations

```bash
# Start local Supabase (requires Docker)
npm run db:start

# Apply migrations
npm run db:migrate

# Generate TypeScript types
npm run db:generate-types

# Stop local Supabase
npm run db:stop
```

### Migration Status

- ✅ Schema defined
- ✅ RLS policies implemented
- ✅ Verification framework created
- ⏸️ Migrations not yet applied (Docker not available)
- ⏸️ Types manually created (auto-generation pending)

---

## Next Steps

### EDU-005: Supabase Authentication and Secure User/Institution Onboarding

Authentication is the next dependency because:

1. RLS policies depend on authenticated users
2. Profiles reference auth.users
3. Tenant isolation requires authenticated context
4. All business features require user identity

### Future Enhancements

1. **EDU-006**: Implement authentication flows
2. **EDU-007**: Implement institution/user onboarding
3. **EDU-008**: Test RLS with real authenticated users
4. **EDU-009**: Implement document upload and storage
5. **EDU-010**: Implement context extraction engine

---

## Database Health Monitoring

### Recommended Checks

1. **RLS Status**: `SELECT * FROM rls_status;`
2. **Policy Count**: `SELECT * FROM rls_policy_count;`
3. **RLS Report**: `SELECT * FROM generate_rls_report();`
4. **Table Sizes**: Monitor table growth
5. **Index Usage**: Monitor index performance
6. **Connection Pool**: Monitor active connections

### Performance Considerations

1. **Indexes**: All foreign keys and commonly queried columns indexed
2. **RLS Overhead**: Helper functions use SECURITY DEFINER efficiently
3. **JSONB**: Used only where schema flexibility required
4. **Timestamps**: Automatic via triggers, minimal overhead
5. **Audit Events**: Consider partitioning for high-volume institutions

---

## Compliance and Security

### Data Protection

- ✅ No passwords stored (Supabase Auth handles authentication)
- ✅ Service role key server-only
- ✅ RLS enforces tenant isolation
- ✅ Audit events immutable
- ✅ Document versions preserved
- ✅ Approval decisions immutable

### GDPR Considerations

- User data deletion: CASCADE from auth.users to profiles
- Right to erasure: Document by ON DELETE policies
- Audit trail: Preserved even if user deleted (actor_id SET NULL)
- Data export: All user data queryable via institution_id

### Future Security Enhancements

1. Implement audit log archival strategy
2. Add database-level encryption for sensitive JSONB fields
3. Implement rate limiting at database level
4. Add database activity monitoring
5. Implement automated backup verification

---

**Documentation Version:** 1.0  
**Last Updated:** 2026-08-26  
**Maintained By:** EduSphere AI Development Team
