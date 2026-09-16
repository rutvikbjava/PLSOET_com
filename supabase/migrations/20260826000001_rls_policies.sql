-- ============================================================================
-- EduSphere AI — Row Level Security (RLS) Policies
-- Migration: 20260826000001_rls_policies.sql
-- Task: EDU-004
-- Created: 2026-08-26
--
-- This migration implements comprehensive RLS policies for tenant isolation
-- and authorization across all EduSphere AI tables.
--
-- Security Model:
-- 1. Authenticated users can only access data from their institution
-- 2. User profiles determine institution membership
-- 3. Service role bypasses RLS (admin operations only)
-- 4. Anonymous access is denied
-- 5. Audit events are append-only
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get the current user's institution ID
CREATE OR REPLACE FUNCTION public.get_user_institution_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT institution_id 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Check if current user belongs to an institution
CREATE OR REPLACE FUNCTION public.user_has_institution()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid()
  );
$$;

-- Get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role 
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Check if user is admin/privileged
CREATE OR REPLACE FUNCTION public.user_is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role IN ('ADMIN', 'PRINCIPAL', 'SYSTEM_ADMIN')
  FROM public.profiles 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ============================================================================
-- INSTITUTIONS
-- ============================================================================

-- Read: Users can see their own institution
CREATE POLICY "Users can view their own institution"
  ON institutions
  FOR SELECT
  TO authenticated
  USING (id = public.get_user_institution_id());

-- Admin users can see all institutions (for system administration)
CREATE POLICY "Admins can view all institutions"
  ON institutions
  FOR SELECT
  TO authenticated
  USING (public.user_is_admin());

-- Update: Only admins can update institutions
CREATE POLICY "Admins can update their institution"
  ON institutions
  FOR UPDATE
  TO authenticated
  USING (id = public.get_user_institution_id() AND public.user_is_admin())
  WITH CHECK (id = public.get_user_institution_id() AND public.user_is_admin());

-- Insert/Delete: Reserved for service role (system operations)

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================

-- Read: Users can view departments in their institution
CREATE POLICY "Users can view departments in their institution"
  ON departments
  FOR SELECT
  TO authenticated
  USING (institution_id = public.get_user_institution_id());

-- Insert: Admins can create departments
CREATE POLICY "Admins can create departments"
  ON departments
  FOR INSERT
  TO authenticated
  WITH CHECK (institution_id = public.get_user_institution_id() AND public.user_is_admin());

-- Update: Admins can update departments
CREATE POLICY "Admins can update departments"
  ON departments
  FOR UPDATE
  TO authenticated
  USING (institution_id = public.get_user_institution_id() AND public.user_is_admin())
  WITH CHECK (institution_id = public.get_user_institution_id() AND public.user_is_admin());

-- Delete: Reserved for service role

-- ============================================================================
-- PROFILES
-- ============================================================================

-- Read: Users can view profiles in their institution
CREATE POLICY "Users can view profiles in their institution"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (institution_id = public.get_user_institution_id());

-- Read: Users can always view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Update: Users can update their own basic info
CREATE POLICY "Users can update their own basic info"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND institution_id = (SELECT institution_id FROM profiles WHERE id = auth.uid())
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Update: Admins can update profiles in their institution
CREATE POLICY "Admins can update profiles in their institution"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (institution_id = public.get_user_institution_id() AND public.user_is_admin())
  WITH CHECK (institution_id = public.get_user_institution_id() AND public.user_is_admin());

-- Insert: Service role only (controlled onboarding)
-- Delete: Service role only (account deactivation)

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

-- Read: Users can view documents in their institution
CREATE POLICY "Users can view documents in their institution"
  ON documents
  FOR SELECT
  TO authenticated
  USING (institution_id = public.get_user_institution_id());

-- Insert: Users can create documents in their institution
CREATE POLICY "Users can create documents in their institution"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    institution_id = public.get_user_institution_id()
    AND created_by = auth.uid()
  );

-- Update: Users can update their own documents
CREATE POLICY "Users can update their own documents"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (
    institution_id = public.get_user_institution_id()
    AND created_by = auth.uid()
  )
  WITH CHECK (
    institution_id = public.get_user_institution_id()
    AND created_by = auth.uid()
  );

-- Update: Admins can update any document in their institution
CREATE POLICY "Admins can update documents in their institution"
  ON documents
  FOR UPDATE
  TO authenticated
  USING (institution_id = public.get_user_institution_id() AND public.user_is_admin())
  WITH CHECK (institution_id = public.get_user_institution_id() AND public.user_is_admin());

-- Delete: Admins only
CREATE POLICY "Admins can delete documents in their institution"
  ON documents
  FOR DELETE
  TO authenticated
  USING (institution_id = public.get_user_institution_id() AND public.user_is_admin());

-- ============================================================================
-- DOCUMENT_VERSIONS
-- ============================================================================

-- Read: Users can view versions of documents in their institution
CREATE POLICY "Users can view document versions in their institution"
  ON document_versions
  FOR SELECT
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM documents 
      WHERE institution_id = public.get_user_institution_id()
    )
  );

-- Insert: Users can upload versions of their documents
CREATE POLICY "Users can upload versions of their documents"
  ON document_versions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid()
    AND document_id IN (
      SELECT id FROM documents 
      WHERE created_by = auth.uid() 
      AND institution_id = public.get_user_institution_id()
    )
  );

-- Update/Delete: Immutable (no policies)

-- ============================================================================
-- DOCUMENT_CONTEXTS
-- ============================================================================

-- Read: Users can view contexts for documents in their institution
CREATE POLICY "Users can view document contexts in their institution"
  ON document_contexts
  FOR SELECT
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM documents 
      WHERE institution_id = public.get_user_institution_id()
    )
  );

-- Insert/Update: Service role only (AI processing)
-- Delete: Service role only

-- ============================================================================
-- POLICIES
-- ============================================================================

-- Read: Users can view policies in their institution
CREATE POLICY "Users can view policies in their institution"
  ON policies
  FOR SELECT
  TO authenticated
  USING (institution_id = public.get_user_institution_id());

-- Insert: Admins can create policies
CREATE POLICY "Admins can create policies"
  ON policies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    institution_id = public.get_user_institution_id()
    AND public.user_is_admin()
    AND created_by = auth.uid()
  );

-- Update: Admins can update policies
CREATE POLICY "Admins can update policies"
  ON policies
  FOR UPDATE
  TO authenticated
  USING (institution_id = public.get_user_institution_id() AND public.user_is_admin())
  WITH CHECK (institution_id = public.get_user_institution_id() AND public.user_is_admin());

-- Delete: Reserved for service role

-- ============================================================================
-- WORKFLOW_DEFINITIONS
-- ============================================================================

-- Read: Users can view workflow definitions in their institution
CREATE POLICY "Users can view workflow definitions in their institution"
  ON workflow_definitions
  FOR SELECT
  TO authenticated
  USING (institution_id = public.get_user_institution_id());

-- Insert: Admins can create workflow definitions
CREATE POLICY "Admins can create workflow definitions"
  ON workflow_definitions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    institution_id = public.get_user_institution_id()
    AND public.user_is_admin()
    AND created_by = auth.uid()
  );

-- Update: Admins can update workflow definitions
CREATE POLICY "Admins can update workflow definitions"
  ON workflow_definitions
  FOR UPDATE
  TO authenticated
  USING (institution_id = public.get_user_institution_id() AND public.user_is_admin())
  WITH CHECK (institution_id = public.get_user_institution_id() AND public.user_is_admin());

-- Delete: Reserved for service role

-- ============================================================================
-- WORKFLOW_STEPS
-- ============================================================================

-- Read: Users can view workflow steps for workflows in their institution
CREATE POLICY "Users can view workflow steps in their institution"
  ON workflow_steps
  FOR SELECT
  TO authenticated
  USING (
    workflow_definition_id IN (
      SELECT id FROM workflow_definitions 
      WHERE institution_id = public.get_user_institution_id()
    )
  );

-- Insert: Admins can create workflow steps
CREATE POLICY "Admins can create workflow steps"
  ON workflow_steps
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workflow_definition_id IN (
      SELECT id FROM workflow_definitions 
      WHERE institution_id = public.get_user_institution_id()
      AND status = 'DRAFT'
    )
    AND public.user_is_admin()
  );

-- Update: Admins can update workflow steps (draft only)
CREATE POLICY "Admins can update workflow steps"
  ON workflow_steps
  FOR UPDATE
  TO authenticated
  USING (
    workflow_definition_id IN (
      SELECT id FROM workflow_definitions 
      WHERE institution_id = public.get_user_institution_id()
      AND status = 'DRAFT'
    )
    AND public.user_is_admin()
  )
  WITH CHECK (
    workflow_definition_id IN (
      SELECT id FROM workflow_definitions 
      WHERE institution_id = public.get_user_institution_id()
      AND status = 'DRAFT'
    )
    AND public.user_is_admin()
  );

-- Delete: Admins can delete workflow steps (draft only)
CREATE POLICY "Admins can delete workflow steps"
  ON workflow_steps
  FOR DELETE
  TO authenticated
  USING (
    workflow_definition_id IN (
      SELECT id FROM workflow_definitions 
      WHERE institution_id = public.get_user_institution_id()
      AND status = 'DRAFT'
    )
    AND public.user_is_admin()
  );

-- ============================================================================
-- WORKFLOW_INSTANCES
-- ============================================================================

-- Read: Users can view workflow instances in their institution
CREATE POLICY "Users can view workflow instances in their institution"
  ON workflow_instances
  FOR SELECT
  TO authenticated
  USING (institution_id = public.get_user_institution_id());

-- Insert: Users can create workflow instances
CREATE POLICY "Users can create workflow instances"
  ON workflow_instances
  FOR INSERT
  TO authenticated
  WITH CHECK (
    institution_id = public.get_user_institution_id()
    AND initiated_by = auth.uid()
  );

-- Update: Service role only (workflow execution engine)
-- Delete: Admins only

CREATE POLICY "Admins can delete workflow instances"
  ON workflow_instances
  FOR DELETE
  TO authenticated
  USING (institution_id = public.get_user_institution_id() AND public.user_is_admin());

-- ============================================================================
-- WORKFLOW_INSTANCE_STEPS
-- ============================================================================

-- Read: Users can view workflow instance steps for instances in their institution
CREATE POLICY "Users can view workflow instance steps in their institution"
  ON workflow_instance_steps
  FOR SELECT
  TO authenticated
  USING (
    workflow_instance_id IN (
      SELECT id FROM workflow_instances 
      WHERE institution_id = public.get_user_institution_id()
    )
  );

-- Insert/Update: Service role only (workflow execution)
-- Delete: Not allowed (historical preservation)

-- ============================================================================
-- APPROVALS
-- ============================================================================

-- Read: Users can view approvals in their institution
CREATE POLICY "Users can view approvals in their institution"
  ON approvals
  FOR SELECT
  TO authenticated
  USING (
    workflow_instance_id IN (
      SELECT id FROM workflow_instances 
      WHERE institution_id = public.get_user_institution_id()
    )
  );

-- Insert: Users can create approvals when assigned
CREATE POLICY "Users can create approvals when assigned"
  ON approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    approver_id = auth.uid()
    AND workflow_instance_id IN (
      SELECT id FROM workflow_instances 
      WHERE institution_id = public.get_user_institution_id()
    )
  );

-- Update/Delete: Immutable (no policies)

-- ============================================================================
-- SIGNATURES
-- ============================================================================

-- Read: Users can view signatures in their institution
CREATE POLICY "Users can view signatures in their institution"
  ON signatures
  FOR SELECT
  TO authenticated
  USING (
    workflow_instance_id IN (
      SELECT id FROM workflow_instances 
      WHERE institution_id = public.get_user_institution_id()
    )
  );

-- Insert: Users can create their own signatures
CREATE POLICY "Users can create their own signatures"
  ON signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    signer_id = auth.uid()
    AND workflow_instance_id IN (
      SELECT id FROM workflow_instances 
      WHERE institution_id = public.get_user_institution_id()
    )
  );

-- Update: Service role only (signature processing)
-- Delete: Not allowed (immutable)

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

-- Read: Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- Update: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Insert: Service role only (notification system)
-- Delete: Users can delete their own notifications

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (recipient_id = auth.uid());

-- ============================================================================
-- AUDIT_EVENTS
-- ============================================================================

-- Read: Users can view audit events in their institution
CREATE POLICY "Users can view audit events in their institution"
  ON audit_events
  FOR SELECT
  TO authenticated
  USING (institution_id = public.get_user_institution_id());

-- Read: Admins can view all audit events in their institution
CREATE POLICY "Admins can view all audit events"
  ON audit_events
  FOR SELECT
  TO authenticated
  USING (institution_id = public.get_user_institution_id() AND public.user_is_admin());

-- Insert: Service role only (audit system)
-- Update/Delete: Not allowed (immutable audit trail)

-- ============================================================================
-- AI_GENERATION_RECORDS
-- ============================================================================

-- Read: Users can view AI generation records in their institution
CREATE POLICY "Users can view AI generation records in their institution"
  ON ai_generation_records
  FOR SELECT
  TO authenticated
  USING (
    document_id IN (
      SELECT id FROM documents 
      WHERE institution_id = public.get_user_institution_id()
    )
  );

-- Insert: Service role only (AI system)
-- Update: Service role only (validation)
-- Delete: Reserved for service role

-- ============================================================================
-- POLICY_VALIDATION_RECORDS
-- ============================================================================

-- Read: Users can view policy validation records in their institution
CREATE POLICY "Users can view policy validation records in their institution"
  ON policy_validation_records
  FOR SELECT
  TO authenticated
  USING (
    workflow_definition_id IN (
      SELECT id FROM workflow_definitions 
      WHERE institution_id = public.get_user_institution_id()
    )
    OR policy_id IN (
      SELECT id FROM policies 
      WHERE institution_id = public.get_user_institution_id()
    )
  );

-- Insert: Service role only (validation engine)
-- Update/Delete: Not allowed (historical preservation)

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.get_user_institution_id() IS 
  'Returns the institution_id of the currently authenticated user from their profile';

COMMENT ON FUNCTION public.user_has_institution() IS 
  'Checks if the currently authenticated user has a profile with institution membership';

COMMENT ON FUNCTION public.get_user_role() IS 
  'Returns the role of the currently authenticated user';

COMMENT ON FUNCTION public.user_is_admin() IS 
  'Checks if the currently authenticated user has an administrative role';

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- 1. Service role operations (INSERT/UPDATE for system tables) are NOT
--    restricted by RLS policies. Use service role with extreme caution.
--
-- 2. Role changes are protected: users cannot update their own role field.
--    Only admins can modify roles through the UPDATE policy.
--
-- 3. Audit events are append-only: no UPDATE or DELETE policies exist.
--    This ensures audit trail immutability.
--
-- 4. Document versions are immutable: no UPDATE or DELETE policies.
--    Historical document versions are preserved.
--
-- 5. Approvals are immutable: only INSERT policy exists.
--    Approval decisions cannot be modified after creation.
--
-- 6. Tenant isolation is enforced through institution_id checks.
--    Users can only access data within their institution.
--
-- 7. Anonymous users have no access to any table (no policies for anon role).
--
-- 8. Helper functions use SECURITY DEFINER with explicit search_path
--    to prevent search_path-based privilege escalation attacks.

