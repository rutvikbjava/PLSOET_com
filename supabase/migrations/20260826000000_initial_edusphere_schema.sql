-- ============================================================================
-- EduSphere AI — Initial Database Schema
-- Migration: 20260826000000_initial_edusphere_schema.sql
-- Task: EDU-004
-- Created: 2026-08-26
-- 
-- This migration establishes the complete EduSphere AI database foundation:
-- - Multi-tenant institution model
-- - User profiles linked to Supabase Auth
-- - Document management with versioning
-- - Context storage for AI analysis
-- - Policy management with versioning
-- - Workflow definitions and instances
-- - Approval tracking
-- - Signature foundation
-- - Notification foundation
-- - Comprehensive audit trail
-- - Row Level Security (RLS) for tenant isolation
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements for query analysis
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Institution status
CREATE TYPE institution_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED'
);

-- User/profile status
CREATE TYPE profile_status AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'SUSPENDED',
  'PENDING_VERIFICATION'
);

-- Document status
CREATE TYPE document_status AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
  'ARCHIVED'
);

-- Workflow status
CREATE TYPE workflow_status AS ENUM (
  'DRAFT',
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED'
);

-- Workflow instance status
CREATE TYPE workflow_instance_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'CANCELLED'
);

-- Workflow step status
CREATE TYPE workflow_step_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED',
  'REJECTED'
);

-- Approval decision
CREATE TYPE approval_decision AS ENUM (
  'APPROVED',
  'REJECTED',
  'RETURNED_FOR_REVISION',
  'DELEGATED'
);

-- Signature status
CREATE TYPE signature_status AS ENUM (
  'PENDING',
  'SIGNED',
  'FAILED',
  'EXPIRED'
);

-- Notification status
CREATE TYPE notification_status AS ENUM (
  'UNREAD',
  'READ',
  'ARCHIVED'
);

-- Context processing status
CREATE TYPE processing_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

-- ============================================================================
-- TABLE: institutions
-- Purpose: Multi-tenant organization management
-- ============================================================================

CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Institution identity
  name TEXT NOT NULL,
  code TEXT NOT NULL, -- Stable identifier (e.g., "UNIV_ABC")
  slug TEXT NOT NULL, -- URL-friendly identifier
  
  -- Status and metadata
  status institution_status NOT NULL DEFAULT 'ACTIVE',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT institutions_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT institutions_code_not_empty CHECK (length(trim(code)) > 0),
  CONSTRAINT institutions_slug_not_empty CHECK (length(trim(slug)) > 0),
  CONSTRAINT institutions_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Unique constraints
CREATE UNIQUE INDEX institutions_code_unique ON institutions(code);
CREATE UNIQUE INDEX institutions_slug_unique ON institutions(slug);

-- Indexes
CREATE INDEX institutions_status_idx ON institutions(status);
CREATE INDEX institutions_created_at_idx ON institutions(created_at);

-- ============================================================================
-- TABLE: departments
-- Purpose: Department hierarchy within institutions
-- ============================================================================

CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Institution relationship
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  
  -- Department identity
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  
  -- Status
  status institution_status NOT NULL DEFAULT 'ACTIVE',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT departments_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT departments_code_not_empty CHECK (length(trim(code)) > 0)
);

-- Unique constraint: code unique within institution
CREATE UNIQUE INDEX departments_institution_code_unique 
  ON departments(institution_id, code);

-- Indexes
CREATE INDEX departments_institution_id_idx ON departments(institution_id);
CREATE INDEX departments_status_idx ON departments(status);

-- ============================================================================
-- TABLE: profiles
-- Purpose: Application user profiles linked to Supabase Auth
-- Security: References auth.users; do NOT store passwords
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Institution and department
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  
  -- User identity
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  
  -- Role (application-level, not auth-level)
  -- Do NOT allow arbitrary user role changes
  role TEXT NOT NULL DEFAULT 'FACULTY',
  
  -- Status
  status profile_status NOT NULL DEFAULT 'PENDING_VERIFICATION',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT profiles_display_name_not_empty CHECK (length(trim(display_name)) > 0),
  CONSTRAINT profiles_email_not_empty CHECK (length(trim(email)) > 0),
  CONSTRAINT profiles_email_format CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$'),
  CONSTRAINT profiles_role_not_empty CHECK (length(trim(role)) > 0)
);

-- Indexes
CREATE INDEX profiles_institution_id_idx ON profiles(institution_id);
CREATE INDEX profiles_department_id_idx ON profiles(department_id);
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX profiles_role_idx ON profiles(role);
CREATE INDEX profiles_status_idx ON profiles(status);

-- ============================================================================
-- TABLE: documents
-- Purpose: Document metadata and storage references
-- Security: Large files stored in Supabase Storage, not in database
-- ============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership and context
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Document metadata
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  description TEXT,
  
  -- Storage reference (Supabase Storage path)
  storage_path TEXT,
  
  -- Status
  status document_status NOT NULL DEFAULT 'DRAFT',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT documents_title_not_empty CHECK (length(trim(title)) > 0),
  CONSTRAINT documents_type_not_empty CHECK (length(trim(document_type)) > 0)
);

-- Indexes
CREATE INDEX documents_institution_id_idx ON documents(institution_id);
CREATE INDEX documents_department_id_idx ON documents(department_id);
CREATE INDEX documents_created_by_idx ON documents(created_by);
CREATE INDEX documents_status_idx ON documents(status);
CREATE INDEX documents_type_idx ON documents(document_type);
CREATE INDEX documents_created_at_idx ON documents(created_at);

-- ============================================================================
-- TABLE: document_versions
-- Purpose: Immutable document version history
-- Security: Prevent version number conflicts, preserve history
-- ============================================================================

CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Document relationship
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Version information
  version_number INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  checksum TEXT, -- SHA-256 or similar
  file_size_bytes BIGINT,
  
  -- Upload metadata
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT document_versions_version_positive CHECK (version_number > 0),
  CONSTRAINT document_versions_path_not_empty CHECK (length(trim(storage_path)) > 0)
);

-- Unique constraint: prevent duplicate version numbers
CREATE UNIQUE INDEX document_versions_document_version_unique 
  ON document_versions(document_id, version_number);

-- Indexes
CREATE INDEX document_versions_document_id_idx ON document_versions(document_id);
CREATE INDEX document_versions_uploaded_by_idx ON document_versions(uploaded_by);
CREATE INDEX document_versions_created_at_idx ON document_versions(created_at);

-- ============================================================================
-- TABLE: document_contexts
-- Purpose: AI-extracted context from documents
-- Security: Distinguish AI output from authoritative data
-- ============================================================================

CREATE TABLE document_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Document relationship
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Extracted context (queryable fields)
  document_type_detected TEXT,
  creator_role_detected TEXT,
  department_scope TEXT,
  purpose TEXT,
  impact_level TEXT,
  
  -- AI-generated attributes (variable schema)
  extracted_attributes JSONB DEFAULT '{}'::jsonb,
  
  -- Processing metadata
  processing_status processing_status NOT NULL DEFAULT 'PENDING',
  confidence_score NUMERIC(5,4), -- 0.0000 to 1.0000
  model_version TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT document_contexts_confidence_range 
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

-- Only one active context per document
CREATE UNIQUE INDEX document_contexts_document_unique 
  ON document_contexts(document_id);

-- Indexes
CREATE INDEX document_contexts_processing_status_idx 
  ON document_contexts(processing_status);
CREATE INDEX document_contexts_created_at_idx ON document_contexts(created_at);

-- ============================================================================
-- TABLE: policies
-- Purpose: Institutional policy definitions with versioning
-- Security: Historical versions must remain traceable
-- ============================================================================

CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Policy identity
  name TEXT NOT NULL,
  description TEXT,
  
  -- Version management
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Policy configuration
  policy_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Effective dates
  effective_from DATE,
  effective_until DATE,
  
  -- Status
  status workflow_status NOT NULL DEFAULT 'DRAFT',
  
  -- Audit
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT policies_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT policies_version_positive CHECK (version > 0),
  CONSTRAINT policies_effective_dates CHECK (
    effective_until IS NULL OR effective_from IS NULL OR effective_until >= effective_from
  )
);

-- Indexes
CREATE INDEX policies_institution_id_idx ON policies(institution_id);
CREATE INDEX policies_department_id_idx ON policies(department_id);
CREATE INDEX policies_status_idx ON policies(status);
CREATE INDEX policies_created_by_idx ON policies(created_by);
CREATE INDEX policies_effective_from_idx ON policies(effective_from);

-- ============================================================================
-- TABLE: workflow_definitions
-- Purpose: Reusable workflow templates
-- Security: Definitions evolve independently of instances
-- ============================================================================

CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  
  -- Workflow identity
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT NOT NULL,
  
  -- Version management
  version INTEGER NOT NULL DEFAULT 1,
  
  -- Status
  status workflow_status NOT NULL DEFAULT 'DRAFT',
  
  -- Audit
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT workflow_definitions_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT workflow_definitions_type_not_empty CHECK (length(trim(workflow_type)) > 0),
  CONSTRAINT workflow_definitions_version_positive CHECK (version > 0)
);

-- Indexes
CREATE INDEX workflow_definitions_institution_id_idx ON workflow_definitions(institution_id);
CREATE INDEX workflow_definitions_status_idx ON workflow_definitions(status);
CREATE INDEX workflow_definitions_type_idx ON workflow_definitions(workflow_type);
CREATE INDEX workflow_definitions_created_by_idx ON workflow_definitions(created_by);

-- ============================================================================
-- TABLE: workflow_steps
-- Purpose: Ordered steps within a workflow definition
-- ============================================================================

CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Workflow relationship
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  
  -- Step configuration
  step_name TEXT NOT NULL,
  step_type TEXT NOT NULL,
  sequence_order INTEGER NOT NULL,
  
  -- Approver specification
  approver_role TEXT,
  approver_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  
  -- Step behavior
  is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  timeout_hours INTEGER,
  
  -- Step configuration
  step_config JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT workflow_steps_name_not_empty CHECK (length(trim(step_name)) > 0),
  CONSTRAINT workflow_steps_type_not_empty CHECK (length(trim(step_type)) > 0),
  CONSTRAINT workflow_steps_sequence_positive CHECK (sequence_order > 0),
  CONSTRAINT workflow_steps_timeout_positive CHECK (timeout_hours IS NULL OR timeout_hours > 0)
);

-- Unique constraint: sequence order unique within workflow
CREATE UNIQUE INDEX workflow_steps_definition_sequence_unique 
  ON workflow_steps(workflow_definition_id, sequence_order);

-- Indexes
CREATE INDEX workflow_steps_workflow_definition_id_idx 
  ON workflow_steps(workflow_definition_id);
CREATE INDEX workflow_steps_approver_role_idx ON workflow_steps(approver_role);
CREATE INDEX workflow_steps_approver_user_id_idx ON workflow_steps(approver_user_id);

-- ============================================================================
-- TABLE: workflow_instances
-- Purpose: Actual workflow executions
-- Security: Preserve historical workflow configuration snapshot
-- ============================================================================

CREATE TABLE workflow_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Workflow definition reference
  workflow_definition_id UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE RESTRICT,
  
  -- Document context
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  
  -- Institution context
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  
  -- Instance metadata
  instance_name TEXT NOT NULL,
  
  -- Historical snapshot (preserve workflow config at execution time)
  workflow_snapshot JSONB NOT NULL,
  
  -- Status
  status workflow_instance_status NOT NULL DEFAULT 'PENDING',
  
  -- Initiator
  initiated_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT workflow_instances_name_not_empty CHECK (length(trim(instance_name)) > 0)
);

-- Indexes
CREATE INDEX workflow_instances_workflow_definition_id_idx 
  ON workflow_instances(workflow_definition_id);
CREATE INDEX workflow_instances_document_id_idx ON workflow_instances(document_id);
CREATE INDEX workflow_instances_institution_id_idx ON workflow_instances(institution_id);
CREATE INDEX workflow_instances_status_idx ON workflow_instances(status);
CREATE INDEX workflow_instances_initiated_by_idx ON workflow_instances(initiated_by);
CREATE INDEX workflow_instances_created_at_idx ON workflow_instances(created_at);

-- ============================================================================
-- TABLE: workflow_instance_steps
-- Purpose: Actual execution steps with historical preservation
-- Security: Do not mutate after completion
-- ============================================================================

CREATE TABLE workflow_instance_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Instance relationship
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  
  -- Step reference
  workflow_step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  
  -- Step metadata
  step_name TEXT NOT NULL,
  sequence_order INTEGER NOT NULL,
  
  -- Assigned approver
  assigned_approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Status
  status workflow_step_status NOT NULL DEFAULT 'PENDING',
  
  -- Decision
  decision approval_decision,
  comments TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT workflow_instance_steps_name_not_empty CHECK (length(trim(step_name)) > 0),
  CONSTRAINT workflow_instance_steps_sequence_positive CHECK (sequence_order > 0)
);

-- Unique constraint: sequence order unique within instance
CREATE UNIQUE INDEX workflow_instance_steps_instance_sequence_unique 
  ON workflow_instance_steps(workflow_instance_id, sequence_order);

-- Indexes
CREATE INDEX workflow_instance_steps_workflow_instance_id_idx 
  ON workflow_instance_steps(workflow_instance_id);
CREATE INDEX workflow_instance_steps_assigned_approver_id_idx 
  ON workflow_instance_steps(assigned_approver_id);
CREATE INDEX workflow_instance_steps_status_idx ON workflow_instance_steps(status);

-- ============================================================================
-- TABLE: approvals
-- Purpose: Immutable approval decision records
-- Security: Preserve audit trail, prevent silent overwrites
-- ============================================================================

CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Context
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE RESTRICT,
  workflow_instance_step_id UUID REFERENCES workflow_instance_steps(id) ON DELETE SET NULL,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  
  -- Approver
  approver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Decision
  decision approval_decision NOT NULL,
  comments TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp (immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT approvals_decision_not_null CHECK (decision IS NOT NULL)
);

-- Indexes
CREATE INDEX approvals_workflow_instance_id_idx ON approvals(workflow_instance_id);
CREATE INDEX approvals_workflow_instance_step_id_idx ON approvals(workflow_instance_step_id);
CREATE INDEX approvals_document_id_idx ON approvals(document_id);
CREATE INDEX approvals_approver_id_idx ON approvals(approver_id);
CREATE INDEX approvals_decision_idx ON approvals(decision);
CREATE INDEX approvals_created_at_idx ON approvals(created_at);

-- ============================================================================
-- TABLE: signatures
-- Purpose: Digital signature tracking foundation
-- Security: Do NOT store cryptographic material unsafely
-- ============================================================================

CREATE TABLE signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Context
  approval_id UUID REFERENCES approvals(id) ON DELETE SET NULL,
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE RESTRICT,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
  
  -- Signer
  signer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Signature metadata (provider-specific)
  signature_provider TEXT,
  signature_reference TEXT,
  
  -- Status
  status signature_status NOT NULL DEFAULT 'PENDING',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX signatures_approval_id_idx ON signatures(approval_id);
CREATE INDEX signatures_workflow_instance_id_idx ON signatures(workflow_instance_id);
CREATE INDEX signatures_document_id_idx ON signatures(document_id);
CREATE INDEX signatures_signer_id_idx ON signatures(signer_id);
CREATE INDEX signatures_status_idx ON signatures(status);
CREATE INDEX signatures_created_at_idx ON signatures(created_at);

-- ============================================================================
-- TABLE: notifications
-- Purpose: Notification delivery tracking
-- ============================================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Recipient
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Notification content
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  
  -- Related entity (optional)
  related_entity_type TEXT,
  related_entity_id UUID,
  
  -- Status
  status notification_status NOT NULL DEFAULT 'UNREAD',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT notifications_type_not_empty CHECK (length(trim(notification_type)) > 0),
  CONSTRAINT notifications_title_not_empty CHECK (length(trim(title)) > 0)
);

-- Indexes
CREATE INDEX notifications_recipient_id_idx ON notifications(recipient_id);
CREATE INDEX notifications_type_idx ON notifications(notification_type);
CREATE INDEX notifications_status_idx ON notifications(status);
CREATE INDEX notifications_created_at_idx ON notifications(created_at);

-- ============================================================================
-- TABLE: audit_events
-- Purpose: Immutable audit trail for compliance
-- Security: Append-only, protect from unauthorized modification
-- ============================================================================

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Institution context
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
  
  -- Actor
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Event details
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  
  -- Event metadata
  event_data JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp (immutable)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT audit_events_type_not_empty CHECK (length(trim(event_type)) > 0)
);

-- Indexes
CREATE INDEX audit_events_institution_id_idx ON audit_events(institution_id);
CREATE INDEX audit_events_actor_id_idx ON audit_events(actor_id);
CREATE INDEX audit_events_event_type_idx ON audit_events(event_type);
CREATE INDEX audit_events_entity_type_idx ON audit_events(entity_type);
CREATE INDEX audit_events_entity_id_idx ON audit_events(entity_id);
CREATE INDEX audit_events_created_at_idx ON audit_events(created_at);

-- ============================================================================
-- TABLE: ai_generation_records
-- Purpose: Track AI-generated workflow candidates
-- Security: AI output is NOT authoritative until validated
-- ============================================================================

CREATE TABLE ai_generation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Source
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  document_context_id UUID REFERENCES document_contexts(id) ON DELETE SET NULL,
  
  -- Generated workflow
  generated_workflow JSONB NOT NULL,
  
  -- AI metadata
  model_name TEXT,
  model_version TEXT,
  confidence_score NUMERIC(5,4),
  
  -- Validation status
  is_validated BOOLEAN NOT NULL DEFAULT FALSE,
  validation_status TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT ai_generation_confidence_range 
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

-- Indexes
CREATE INDEX ai_generation_records_document_id_idx ON ai_generation_records(document_id);
CREATE INDEX ai_generation_records_document_context_id_idx 
  ON ai_generation_records(document_context_id);
CREATE INDEX ai_generation_records_is_validated_idx ON ai_generation_records(is_validated);
CREATE INDEX ai_generation_records_created_at_idx ON ai_generation_records(created_at);

-- ============================================================================
-- TABLE: policy_validation_records
-- Purpose: Policy validation results for audit trail
-- ============================================================================

CREATE TABLE policy_validation_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Workflow candidate
  ai_generation_record_id UUID REFERENCES ai_generation_records(id) ON DELETE CASCADE,
  workflow_definition_id UUID REFERENCES workflow_definitions(id) ON DELETE SET NULL,
  
  -- Policy evaluated
  policy_id UUID REFERENCES policies(id) ON DELETE SET NULL,
  policy_version INTEGER,
  
  -- Validation result
  validation_result TEXT NOT NULL,
  is_compliant BOOLEAN NOT NULL,
  violations JSONB DEFAULT '[]'::jsonb,
  
  -- Validator metadata
  validator_version TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT policy_validation_result_not_empty CHECK (length(trim(validation_result)) > 0)
);

-- Indexes
CREATE INDEX policy_validation_records_ai_generation_record_id_idx 
  ON policy_validation_records(ai_generation_record_id);
CREATE INDEX policy_validation_records_workflow_definition_id_idx 
  ON policy_validation_records(workflow_definition_id);
CREATE INDEX policy_validation_records_policy_id_idx 
  ON policy_validation_records(policy_id);
CREATE INDEX policy_validation_records_is_compliant_idx 
  ON policy_validation_records(is_compliant);
CREATE INDEX policy_validation_records_created_at_idx 
  ON policy_validation_records(created_at);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- Purpose: Automatically update updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_institutions_updated_at BEFORE UPDATE ON institutions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_contexts_updated_at BEFORE UPDATE ON document_contexts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_definitions_updated_at BEFORE UPDATE ON workflow_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON workflow_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_instances_updated_at BEFORE UPDATE ON workflow_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ============================================================================

-- Enable RLS on all application tables
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instance_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_validation_records ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be defined in the next migration (20260826000001_rls_policies.sql)
-- This separation allows for schema creation first, then security layer second
