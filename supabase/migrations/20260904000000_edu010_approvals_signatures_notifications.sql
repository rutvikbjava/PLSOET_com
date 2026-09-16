-- ============================================================================
-- Migration: EDU-010 - Approvals, Signatures, Notifications Enhancement
-- Date: 2026-09-04
-- Description: Extends EDU-004 foundations with full approval/signature/notification lifecycle
-- ============================================================================

-- ============================================================================
-- SECTION 1: NEW ENUMS
-- ============================================================================

-- Approval request status (lifecycle management)
CREATE TYPE approval_request_status AS ENUM (
  'PENDING',      -- Awaiting decision
  'APPROVED',     -- Approved
  'REJECTED',     -- Rejected
  'CANCELLED',    -- Cancelled by requester/system
  'EXPIRED'       -- Expired without decision
);

-- Signature request status (lifecycle management)
CREATE TYPE signature_request_status AS ENUM (
  'PENDING',      -- Awaiting signature
  'COMPLETED',    -- Signed
  'REJECTED',     -- Signer rejected
  'CANCELLED',    -- Cancelled
  'EXPIRED'       -- Expired
);

-- Notification delivery status (tracking)
CREATE TYPE notification_delivery_status AS ENUM (
  'PENDING',      -- Not yet sent
  'SENT',         -- Successfully sent
  'FAILED',       -- Delivery failed
  'RETRYING'      -- Retry in progress
);

-- ============================================================================
-- SECTION 2: ENHANCE EXISTING TABLES
-- ============================================================================

-- Add institution_id to approvals table (CRITICAL for tenant isolation)
ALTER TABLE approvals
  ADD COLUMN institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT;

-- Backfill institution_id from workflow_instances
UPDATE approvals a
SET institution_id = wi.institution_id
FROM workflow_instances wi
WHERE a.workflow_instance_id = wi.id
  AND a.institution_id IS NULL;

-- Make institution_id NOT NULL after backfill
ALTER TABLE approvals
  ALTER COLUMN institution_id SET NOT NULL;

-- Add index
CREATE INDEX approvals_institution_id_idx ON approvals(institution_id);

-- Add institution_id to signatures table
ALTER TABLE signatures
  ADD COLUMN institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT;

-- Backfill from workflow_instances
UPDATE signatures s
SET institution_id = wi.institution_id
FROM workflow_instances wi
WHERE s.workflow_instance_id = wi.id
  AND s.institution_id IS NULL;

ALTER TABLE signatures
  ALTER COLUMN institution_id SET NOT NULL;

CREATE INDEX signatures_institution_id_idx ON signatures(institution_id);

-- Add document version binding and other fields to signatures
ALTER TABLE signatures
  ADD COLUMN document_version_id UUID REFERENCES document_versions(id) ON DELETE SET NULL,
  ADD COLUMN signature_request_id UUID,
  ADD COLUMN requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN signature_type TEXT,
  ADD COLUMN signature_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN failed_reason TEXT,
  ADD COLUMN expires_at TIMESTAMPTZ;

-- Add version binding constraint (new signatures must have version)
ALTER TABLE signatures
  ADD CONSTRAINT signatures_version_binding CHECK (
    created_at < '2026-09-04'::timestamptz OR document_version_id IS NOT NULL
  );

CREATE INDEX signatures_document_version_id_idx ON signatures(document_version_id);
CREATE INDEX signatures_signature_request_id_idx ON signatures(signature_request_id);

-- Add institution_id to notifications table
ALTER TABLE notifications
  ADD COLUMN institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT;

-- Backfill from recipient's institution
UPDATE notifications n
SET institution_id = p.institution_id
FROM profiles p
WHERE n.recipient_id = p.id
  AND n.institution_id IS NULL;

ALTER TABLE notifications
  ALTER COLUMN institution_id SET NOT NULL;

CREATE INDEX notifications_institution_id_idx ON notifications(institution_id);

-- Add delivery tracking to notifications
ALTER TABLE notifications
  ADD COLUMN delivery_status notification_delivery_status DEFAULT 'PENDING',
  ADD COLUMN delivery_channel TEXT DEFAULT 'IN_APP',
  ADD COLUMN sent_at TIMESTAMPTZ,
  ADD COLUMN failed_at TIMESTAMPTZ,
  ADD COLUMN failure_reason TEXT,
  ADD COLUMN retry_count INTEGER DEFAULT 0,
  ADD COLUMN email_provider TEXT,
  ADD COLUMN email_message_id TEXT;

CREATE INDEX notifications_delivery_status_idx ON notifications(delivery_status);
CREATE INDEX notifications_retry_count_idx ON notifications(retry_count);

-- Add unique constraint for notification idempotency
CREATE UNIQUE INDEX notifications_idempotency_idx ON notifications(
  institution_id,
  related_entity_type,
  related_entity_id,
  notification_type,
  recipient_id
) WHERE related_entity_type IS NOT NULL AND related_entity_id IS NOT NULL;

-- ============================================================================
-- SECTION 3: NEW TABLES
-- ============================================================================

-- approval_requests: Manages approval lifecycle (PENDING → terminal state)
CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Tenant isolation
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  
  -- Workflow context
  workflow_instance_id UUID REFERENCES workflow_instances(id) ON DELETE SET NULL,
  workflow_instance_step_id UUID REFERENCES workflow_instance_steps(id) ON DELETE SET NULL,
  
  -- Document context
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  document_version_id UUID REFERENCES document_versions(id) ON DELETE SET NULL,
  
  -- Request details
  request_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Requester (who initiated this approval request)
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Approver assignment
  approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approver_role TEXT,
  
  -- Status (state machine)
  status approval_request_status NOT NULL DEFAULT 'PENDING',
  
  -- Decision (when status is terminal)
  decision approval_decision,
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

-- Indexes for approval_requests
CREATE INDEX approval_requests_institution_id_idx ON approval_requests(institution_id);
CREATE INDEX approval_requests_workflow_instance_id_idx ON approval_requests(workflow_instance_id);
CREATE INDEX approval_requests_workflow_instance_step_id_idx ON approval_requests(workflow_instance_step_id);
CREATE INDEX approval_requests_document_id_idx ON approval_requests(document_id);
CREATE INDEX approval_requests_document_version_id_idx ON approval_requests(document_version_id);
CREATE INDEX approval_requests_requested_by_idx ON approval_requests(requested_by);
CREATE INDEX approval_requests_approver_id_idx ON approval_requests(approver_id);
CREATE INDEX approval_requests_decided_by_idx ON approval_requests(decided_by);
CREATE INDEX approval_requests_status_idx ON approval_requests(status);
CREATE INDEX approval_requests_expires_at_idx ON approval_requests(expires_at);
CREATE INDEX approval_requests_created_at_idx ON approval_requests(created_at);

-- signature_requests: Manages signature lifecycle
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
  signature_type TEXT NOT NULL,
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

-- Indexes for signature_requests
CREATE INDEX signature_requests_institution_id_idx ON signature_requests(institution_id);
CREATE INDEX signature_requests_workflow_instance_id_idx ON signature_requests(workflow_instance_id);
CREATE INDEX signature_requests_workflow_instance_step_id_idx ON signature_requests(workflow_instance_step_id);
CREATE INDEX signature_requests_approval_request_id_idx ON signature_requests(approval_request_id);
CREATE INDEX signature_requests_document_id_idx ON signature_requests(document_id);
CREATE INDEX signature_requests_document_version_id_idx ON signature_requests(document_version_id);
CREATE INDEX signature_requests_requested_by_idx ON signature_requests(requested_by);
CREATE INDEX signature_requests_signer_id_idx ON signature_requests(signer_id);
CREATE INDEX signature_requests_signature_id_idx ON signature_requests(signature_id);
CREATE INDEX signature_requests_status_idx ON signature_requests(status);
CREATE INDEX signature_requests_expires_at_idx ON signature_requests(expires_at);
CREATE INDEX signature_requests_created_at_idx ON signature_requests(created_at);

-- Add foreign key constraint for signature_request_id in signatures table
ALTER TABLE signatures
  ADD CONSTRAINT signatures_signature_request_id_fkey 
  FOREIGN KEY (signature_request_id) REFERENCES signature_requests(id) ON DELETE SET NULL;

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new and enhanced tables
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;

-- approval_requests RLS policies
CREATE POLICY approval_requests_select ON approval_requests
  FOR SELECT
  USING (institution_id IN (
    SELECT institution_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY approval_requests_insert ON approval_requests
  FOR INSERT
  WITH CHECK (
    institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND requested_by = auth.uid()
  );

CREATE POLICY approval_requests_update ON approval_requests
  FOR UPDATE
  USING (
    institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND (
      approver_id = auth.uid()
      OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SYSTEM_ADMIN'))
      OR
      (requested_by = auth.uid() AND status = 'PENDING')
    )
  );

-- No DELETE policy (use status CANCELLED instead)

-- signature_requests RLS policies
CREATE POLICY signature_requests_select ON signature_requests
  FOR SELECT
  USING (institution_id IN (
    SELECT institution_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY signature_requests_insert ON signature_requests
  FOR INSERT
  WITH CHECK (
    institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND requested_by = auth.uid()
  );

CREATE POLICY signature_requests_update ON signature_requests
  FOR UPDATE
  USING (
    institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND (
      signer_id = auth.uid()
      OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SYSTEM_ADMIN'))
      OR
      (requested_by = auth.uid() AND status = 'PENDING')
    )
  );

-- Update existing table RLS to include institution_id

-- approvals: Add institution_id to existing policies
DROP POLICY IF EXISTS approvals_select ON approvals;
CREATE POLICY approvals_select ON approvals
  FOR SELECT
  USING (institution_id IN (
    SELECT institution_id FROM profiles WHERE id = auth.uid()
  ));

-- signatures: Add institution_id to existing policies
DROP POLICY IF EXISTS signatures_select ON signatures;
CREATE POLICY signatures_select ON signatures
  FOR SELECT
  USING (institution_id IN (
    SELECT institution_id FROM profiles WHERE id = auth.uid()
  ));

-- notifications: Add institution_id to existing policies
DROP POLICY IF EXISTS notifications_select ON notifications;
CREATE POLICY notifications_select ON notifications
  FOR SELECT
  USING (
    institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND (recipient_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SYSTEM_ADMIN')))
  );

DROP POLICY IF EXISTS notifications_update ON notifications;
CREATE POLICY notifications_update ON notifications
  FOR UPDATE
  USING (
    institution_id IN (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND recipient_id = auth.uid()
  );

-- ============================================================================
-- SECTION 5: FUNCTIONS FOR STATE TRANSITIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for approval_requests
CREATE TRIGGER update_approval_requests_updated_at
  BEFORE UPDATE ON approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for signature_requests
CREATE TRIGGER update_signature_requests_updated_at
  BEFORE UPDATE ON signature_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 6: COMMENTS
-- ============================================================================

COMMENT ON TABLE approval_requests IS 'Manages approval request lifecycle (PENDING → APPROVED/REJECTED/CANCELLED/EXPIRED)';
COMMENT ON TABLE signature_requests IS 'Manages signature request lifecycle with exact document version binding';
COMMENT ON COLUMN signatures.document_version_id IS 'CRITICAL: Binds signature to exact document version for immutability';
COMMENT ON COLUMN notifications.delivery_status IS 'Tracks notification delivery across channels (IN_APP, EMAIL)';
COMMENT ON CONSTRAINT approval_requests_self_approval_check ON approval_requests IS 'Prevents self-approval: requester cannot be the approver';
COMMENT ON CONSTRAINT signature_requests_completion_consistency ON signature_requests IS 'Ensures completed signatures have all required fields';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
