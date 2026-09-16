# EDU-010 Domain Model: Approvals + Signatures + Notifications + Audit

**Date:** 2026-09-04  
**Status:** Design Complete  
**Related:** EDU-009 (Workflow System), EDU-004 (Initial Schema)

## Overview

EDU-010 extends the existing approval/signature/notification foundation from EDU-004 with:
- Full approval request lifecycle (PENDING → APPROVED/REJECTED/CANCELLED/EXPIRED)
- Signature request management with exact document version binding
- Notification delivery tracking with email provider abstraction
- Workflow integration for waiting/resumption
- Tenant isolation and authorization enforcement

## Design Principles

1. **Extend, Don't Replace:** Reuse existing EDU-004 tables (approvals, signatures, notifications, audit_events)
2. **Separation of Concerns:** approval_requests (lifecycle) vs approvals (final decisions)
3. **Immutability:** Completed approvals/signatures cannot be modified
4. **Version Binding:** Signatures bind to exact document_version_id
5. **Tenant Isolation:** All tables must have institution_id for RLS
6. **Workflow Integration:** Reuse EDU-009 workflow engine, no second execution engine

## 1. Approval Domain

### Architecture Decision

**Existing `approvals` table** stores FINAL decisions (immutable history).  
**New `approval_requests` table** manages lifecycle (PENDING → terminal state).

### approval_requests Table

```sql
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tenant isolation (CRITICAL: missing from original approvals table)
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  
  -- Workflow context
  workflow_instance_id UUID REFERENCES workflow_instances(id) ON DELETE SET NULL,
  workflow_instance_step_id UUID REFERENCES workflow_instance_steps(id) ON DELETE SET NULL,
  
  -- Document context
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  document_version_id UUID REFERENCES document_versions(id) ON DELETE SET NULL,
  
  -- Request details
  request_type TEXT NOT NULL, -- APPROVAL, REVIEW, SIGN_OFF
  title TEXT NOT NULL,
  description TEXT,
  
  -- Requester (who initiated this approval request)
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Approver assignment
  approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- specific user
  approver_role TEXT, -- or role-based (ADMIN, HOD, COE, etc)
  
  -- Status (state machine)
  status approval_request_status NOT NULL DEFAULT 'PENDING',
  
  -- Decision (when status is terminal)
  decision approval_decision, -- NULL when PENDING
  decision_comments TEXT,
  decided_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT approval_requests_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT approval_requests_decision_consistency CHECK (
    (status IN ('APPROVED', 'REJECTED') AND decision IS NOT NULL AND decided_by IS NOT NULL AND decided_at IS NOT NULL)
    OR
    (status NOT IN ('APPROVED', 'REJECTED'))
  ),
  CONSTRAINT approval_requests_self_approval_check CHECK (requested_by != decided_by),
  CONSTRAINT approval_requests_approver_assignment CHECK (approver_id IS NOT NULL OR approver_role IS NOT NULL)
);
```

### Enum: approval_request_status

```sql
CREATE TYPE approval_request_status AS ENUM (
  'PENDING',      -- Awaiting decision
  'APPROVED',     -- Approved
  'REJECTED',     -- Rejected
  'CANCELLED',    -- Cancelled by requester/system
  'EXPIRED'       -- Expired without decision
);
```

### State Machine

```
PENDING → APPROVED    (authorized approver approves)
PENDING → REJECTED    (authorized approver rejects)
PENDING → CANCELLED   (requester/admin cancels)
PENDING → EXPIRED     (expiration time reached)

Terminal states: APPROVED, REJECTED, CANCELLED, EXPIRED
```

### Authorization Rules

**Who can approve:**
1. Specific approver_id (if assigned)
2. User with approver_role (if role-based)
3. Must be in same institution
4. Cannot be the requester (self-approval prevention)

**Separation of Duties:**
- `requested_by != decided_by` enforced at database level
- Server-side authorization validates user has required role/permission

### Approval Flow Integration

When approval_request reaches terminal state:
1. Create immutable record in `approvals` table (EDU-004 original)
2. Update workflow_instance_step status if linked
3. Create audit_event
4. Send notification to requester
5. Resume workflow if waiting

## 2. Signature Domain

### Enhance Existing signatures Table

Add missing columns to existing `signatures` table:

```sql
-- ADD to existing signatures table:
ALTER TABLE signatures
  ADD COLUMN institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT,
  ADD COLUMN document_version_id UUID REFERENCES document_versions(id) ON DELETE SET NULL,
  ADD COLUMN signature_request_id UUID REFERENCES signature_requests(id) ON DELETE SET NULL,
  ADD COLUMN requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN signature_type TEXT,
  ADD COLUMN signature_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN failed_reason TEXT,
  ADD COLUMN expires_at TIMESTAMPTZ;

-- Add constraints
ALTER TABLE signatures
  ADD CONSTRAINT signatures_version_binding CHECK (document_version_id IS NOT NULL),
  ADD CONSTRAINT signatures_institution_not_null CHECK (institution_id IS NOT NULL);
```

### signature_requests Table

```sql
CREATE TABLE signature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tenant isolation
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  
  -- Workflow context
  workflow_instance_id UUID REFERENCES workflow_instances(id) ON DELETE SET NULL,
  workflow_instance_step_id UUID REFERENCES workflow_instance_steps(id) ON DELETE SET NULL,
  approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL,
  
  -- Document context (EXACT VERSION BINDING)
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  document_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE RESTRICT,
  
  -- Request details
  signature_type TEXT NOT NULL, -- ACKNOWLEDGMENT, APPROVAL_SIGNATURE, AUTHORIZATION
  title TEXT NOT NULL,
  description TEXT,
  
  -- Requester
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Signer
  signer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Status
  status signature_request_status NOT NULL DEFAULT 'PENDING',
  
  -- Completion
  signed_at TIMESTAMPTZ,
  signature_id UUID REFERENCES signatures(id) ON DELETE SET NULL,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT signature_requests_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT signature_requests_completion_consistency CHECK (
    (status = 'COMPLETED' AND signed_at IS NOT NULL AND signature_id IS NOT NULL)
    OR
    (status != 'COMPLETED')
  )
);
```

### Enum: signature_request_status

```sql
CREATE TYPE signature_request_status AS ENUM (
  'PENDING',      -- Awaiting signature
  'COMPLETED',    -- Signed
  'REJECTED',     -- Signer rejected
  'CANCELLED',    -- Cancelled
  'EXPIRED'       -- Expired
);
```

### State Machine

```
PENDING → COMPLETED   (authorized signer completes)
PENDING → REJECTED    (signer rejects)
PENDING → CANCELLED   (requester/admin cancels)
PENDING → EXPIRED     (expiration time reached)
```

### Document Version Binding

**Critical Security Requirement:**
- Signature binds to EXACT document_version_id
- If document is updated, previous signatures remain valid for their version
- New version requires new signatures
- Signature record is IMMUTABLE after completion

### Signature Flow Integration

When signature_request is COMPLETED:
1. Create immutable `signatures` record with exact document_version_id
2. Update workflow_instance_step if linked
3. Create audit_event
4. Send notification to requester
5. Resume workflow if waiting

## 3. Notification Domain

### Enhance Existing notifications Table

Add delivery tracking to existing `notifications` table:

```sql
-- ADD to existing notifications table:
ALTER TABLE notifications
  ADD COLUMN institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT,
  ADD COLUMN delivery_status notification_delivery_status DEFAULT 'PENDING',
  ADD COLUMN delivery_channel TEXT DEFAULT 'IN_APP',
  ADD COLUMN sent_at TIMESTAMPTZ,
  ADD COLUMN failed_at TIMESTAMPTZ,
  ADD COLUMN failure_reason TEXT,
  ADD COLUMN retry_count INTEGER DEFAULT 0,
  ADD COLUMN email_provider TEXT,
  ADD COLUMN email_message_id TEXT;

-- Add constraint
ALTER TABLE notifications
  ADD CONSTRAINT notifications_institution_not_null CHECK (institution_id IS NOT NULL);
```

### Enum: notification_delivery_status

```sql
CREATE TYPE notification_delivery_status AS ENUM (
  'PENDING',      -- Not yet sent
  'SENT',         -- Successfully sent
  'FAILED',       -- Delivery failed
  'RETRYING'      -- Retry in progress
);
```

### Notification Types (Text Constants)

```typescript
export const NOTIFICATION_TYPES = {
  // Approval
  APPROVAL_REQUESTED: 'APPROVAL_REQUESTED',
  APPROVAL_APPROVED: 'APPROVAL_APPROVED',
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',
  APPROVAL_CANCELLED: 'APPROVAL_CANCELLED',
  APPROVAL_EXPIRED: 'APPROVAL_EXPIRED',
  
  // Signature
  SIGNATURE_REQUESTED: 'SIGNATURE_REQUESTED',
  SIGNATURE_COMPLETED: 'SIGNATURE_COMPLETED',
  SIGNATURE_REJECTED: 'SIGNATURE_REJECTED',
  SIGNATURE_CANCELLED: 'SIGNATURE_CANCELLED',
  SIGNATURE_EXPIRED: 'SIGNATURE_EXPIRED',
  
  // Workflow
  WORKFLOW_STARTED: 'WORKFLOW_STARTED',
  WORKFLOW_COMPLETED: 'WORKFLOW_COMPLETED',
  WORKFLOW_FAILED: 'WORKFLOW_FAILED',
  WORKFLOW_WAITING: 'WORKFLOW_WAITING',
  
  // Document
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  DOCUMENT_PROCESSED: 'DOCUMENT_PROCESSED',
  DOCUMENT_SHARED: 'DOCUMENT_SHARED',
} as const;
```

### Notification Delivery

**Channels:**
1. **IN_APP** (always): Store in database, show in notification center
2. **EMAIL** (optional): Send via email provider if configured

**Idempotency:**
- Use deterministic notification_id based on event
- Prevent duplicate notifications for same event
- Unique constraint on (related_entity_type, related_entity_id, notification_type, recipient_id)

**Retry Logic:**
- Max 3 retries for EMAIL delivery
- Exponential backoff: 1min, 5min, 15min
- Mark as FAILED after max retries
- IN_APP notifications always succeed (database insert)

### Email Provider Abstraction

```typescript
interface EmailProvider {
  sendEmail(params: EmailParams): Promise<EmailResult>;
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text: string;
  metadata?: Record<string, any>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Implementations:
// - MockEmailProvider (development)
// - ResendEmailProvider (production)
// - SendGridEmailProvider (alternative)
```

### Notification Security

- Verify recipient is authorized to see related entity
- Never send cross-tenant notifications
- Sanitize notification content before sending
- Email addresses come from verified user profiles only

## 4. Audit Integration

### Reuse Existing audit_events Table

No changes needed to `audit_events` table. Add new event types:

```typescript
export const AUDIT_EVENT_TYPES = {
  // Approval events
  APPROVAL_REQUESTED: 'APPROVAL_REQUESTED',
  APPROVAL_APPROVED: 'APPROVAL_APPROVED',
  APPROVAL_REJECTED: 'APPROVAL_REJECTED',
  APPROVAL_CANCELLED: 'APPROVAL_CANCELLED',
  APPROVAL_EXPIRED: 'APPROVAL_EXPIRED',
  
  // Signature events
  SIGNATURE_REQUESTED: 'SIGNATURE_REQUESTED',
  SIGNATURE_COMPLETED: 'SIGNATURE_COMPLETED',
  SIGNATURE_REJECTED: 'SIGNATURE_REJECTED',
  SIGNATURE_CANCELLED: 'SIGNATURE_CANCELLED',
  SIGNATURE_EXPIRED: 'SIGNATURE_EXPIRED',
  
  // Notification events
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
  NOTIFICATION_SENT: 'NOTIFICATION_SENT',
  NOTIFICATION_FAILED: 'NOTIFICATION_FAILED',
  NOTIFICATION_READ: 'NOTIFICATION_READ',
  
  // Workflow waiting/resumption
  WORKFLOW_WAITING_FOR_APPROVAL: 'WORKFLOW_WAITING_FOR_APPROVAL',
  WORKFLOW_WAITING_FOR_SIGNATURE: 'WORKFLOW_WAITING_FOR_SIGNATURE',
  WORKFLOW_RESUMED_AFTER_APPROVAL: 'WORKFLOW_RESUMED_AFTER_APPROVAL',
  WORKFLOW_RESUMED_AFTER_SIGNATURE: 'WORKFLOW_RESUMED_AFTER_SIGNATURE',
} as const;
```

### Audit Event Creation

Every approval/signature/notification state change creates an audit_event:

```typescript
{
  institution_id: string,
  actor_id: string | null, // null for system events
  event_type: string,
  entity_type: 'approval_request' | 'signature_request' | 'notification',
  entity_id: string,
  event_data: {
    previous_status?: string,
    new_status: string,
    decision?: string,
    comments?: string,
    // ... other relevant data
  }
}
```

## 5. Workflow Integration

### Workflow Waiting State

When workflow step requires approval/signature:

```typescript
// In workflow execution engine
async function executeApprovalAction(step, instance) {
  // 1. Create approval_request
  const approvalRequest = await createApprovalRequest({...});
  
  // 2. Update workflow step status to WAITING
  await updateWorkflowStepStatus(step.id, 'WAITING');
  
  // 3. Update workflow instance status to WAITING
  await updateWorkflowInstanceStatus(instance.id, 'WAITING');
  
  // 4. Return WAITING result (do not block)
  return { status: 'WAITING', waitingFor: 'APPROVAL', requestId: approvalRequest.id };
}
```

### Workflow Resumption

When approval/signature is completed:

```typescript
// In approval service
async function approveRequest(requestId, approverId, comments) {
  // 1. Update approval_request status
  // 2. Create approval record (immutable)
  // 3. Create audit event
  // 4. Send notification
  
  // 5. Resume workflow if linked
  if (approvalRequest.workflow_instance_id) {
    await resumeWorkflowAfterApproval(
      approvalRequest.workflow_instance_id,
      approvalRequest.workflow_instance_step_id
    );
  }
}

// In workflow execution engine
async function resumeWorkflowAfterApproval(instanceId, stepId) {
  // 1. Update step status to COMPLETED
  // 2. Update instance status to RUNNING
  // 3. Execute next step
  await executeNextStep(instanceId);
}
```

## 6. Concurrency & Idempotency

### Approval Concurrency

- Use database constraints and transactions
- Prevent duplicate approvals: check status before update
- Use optimistic locking: `WHERE status = 'PENDING'`
- First valid decision wins

### Signature Concurrency

- Similar to approval concurrency
- Prevent duplicate signatures for same request
- Row-level locks during signature creation

### Notification Idempotency

- Unique constraint: (related_entity_type, related_entity_id, notification_type, recipient_id)
- Prevents duplicate notifications for same event
- Email retry uses same notification record

## 7. Row Level Security (RLS)

### approval_requests RLS

```sql
-- Enable RLS
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;

-- Users can view approval requests in their institution
CREATE POLICY approval_requests_select ON approval_requests
  FOR SELECT
  USING (institution_id IN (
    SELECT institution_id FROM profiles WHERE id = auth.uid()
  ));

-- Users can create approval requests in their institution
CREATE POLICY approval_requests_insert ON approval_requests
  FOR INSERT
  WITH CHECK (
    institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND requested_by = auth.uid()
  );

-- Only assigned approver or admin can update
CREATE POLICY approval_requests_update ON approval_requests
  FOR UPDATE
  USING (
    institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND (
      approver_id = auth.uid()
      OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SYSTEM_ADMIN'))
    )
  );

-- No DELETE for immutability
-- (Allow CANCEL via status update instead)
```

### Similar RLS for signature_requests, notifications

## 8. Testing Strategy

### Unit Tests
- Approval state machine transitions
- Signature version binding
- Notification idempotency
- Authorization checks
- Self-approval prevention
- Expiration handling

### Integration Tests
- Workflow waiting and resumption
- End-to-end approval flow
- End-to-end signature flow
- Email delivery (with mock provider)
- Notification delivery across channels

### RLS Tests
- Cross-tenant isolation
- Role-based access
- Self-approval prevention at database level

## Summary

This design extends EDU-004 foundations with:
- ✅ New approval_requests table for lifecycle management
- ✅ Enhanced signatures table with version binding
- ✅ Enhanced notifications table with delivery tracking
- ✅ Reuse of existing audit_events table
- ✅ Workflow integration for waiting/resumption
- ✅ Tenant isolation via institution_id
- ✅ Authorization and separation of duties
- ✅ Immutability of completed approvals/signatures
- ✅ Email provider abstraction
- ✅ Comprehensive RLS policies
