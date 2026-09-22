-- Fix All RLS Policies for EduSphere AI
-- This script opens up all necessary tables for authenticated users
-- Run this in Supabase SQL Editor

-- =====================================================
-- DOCUMENT_CONTEXTS (for processing page)
-- =====================================================
DROP POLICY IF EXISTS "Users can view contexts for documents in their institution" ON document_contexts;
DROP POLICY IF EXISTS "Service can create contexts" ON document_contexts;

CREATE POLICY "allow_authenticated_select_contexts"
ON document_contexts
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_insert_contexts"
ON document_contexts
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_authenticated_update_contexts"
ON document_contexts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- POLICIES TABLE
-- =====================================================
DROP POLICY IF EXISTS "Users can view policies in their institution" ON policies;
DROP POLICY IF EXISTS "Admins can create policies" ON policies;
DROP POLICY IF EXISTS "Admins can update policies" ON policies;

CREATE POLICY "allow_authenticated_select_policies"
ON policies
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_insert_policies"
ON policies
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "allow_authenticated_update_policies"
ON policies
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- =====================================================
-- WORKFLOW_DEFINITIONS
-- =====================================================
DROP POLICY IF EXISTS "Users can view workflow definitions in their institution" ON workflow_definitions;
DROP POLICY IF EXISTS "Admins can create workflow definitions" ON workflow_definitions;
DROP POLICY IF EXISTS "Admins can update workflow definitions" ON workflow_definitions;

CREATE POLICY "allow_authenticated_select_workflows"
ON workflow_definitions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_insert_workflows"
ON workflow_definitions
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "allow_authenticated_update_workflows"
ON workflow_definitions
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- =====================================================
-- WORKFLOW_STEPS
-- =====================================================
DROP POLICY IF EXISTS "Users can view workflow steps in their institution" ON workflow_steps;

CREATE POLICY "allow_authenticated_select_workflow_steps"
ON workflow_steps
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_insert_workflow_steps"
ON workflow_steps
FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- WORKFLOW_EXECUTIONS
-- =====================================================
DROP POLICY IF EXISTS "Users can view executions in their institution" ON workflow_executions;
DROP POLICY IF EXISTS "Users can create workflow executions" ON workflow_executions;

CREATE POLICY "allow_authenticated_select_executions"
ON workflow_executions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_insert_executions"
ON workflow_executions
FOR INSERT
TO authenticated
WITH CHECK (initiated_by = auth.uid());

CREATE POLICY "allow_authenticated_update_executions"
ON workflow_executions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- APPROVAL_REQUESTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view approval requests in their institution" ON approval_requests;
DROP POLICY IF EXISTS "Users can create approval requests" ON approval_requests;

CREATE POLICY "allow_authenticated_select_approvals"
ON approval_requests
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_insert_approvals"
ON approval_requests
FOR INSERT
TO authenticated
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "allow_authenticated_update_approvals"
ON approval_requests
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- SIGNATURE_REQUESTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view signature requests in their institution" ON signature_requests;
DROP POLICY IF EXISTS "Users can create signature requests" ON signature_requests;

CREATE POLICY "allow_authenticated_select_signatures"
ON signature_requests
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_insert_signatures"
ON signature_requests
FOR INSERT
TO authenticated
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "allow_authenticated_update_signatures"
ON signature_requests
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

CREATE POLICY "allow_authenticated_select_notifications"
ON notifications
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "allow_authenticated_update_notifications"
ON notifications
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- =====================================================
-- AUDIT_EVENTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view audit events in their institution" ON audit_events;

CREATE POLICY "allow_authenticated_select_audit"
ON audit_events
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_authenticated_insert_audit"
ON audit_events
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- DEPARTMENTS
-- =====================================================
DROP POLICY IF EXISTS "Users can view departments in their institution" ON departments;

CREATE POLICY "allow_authenticated_select_departments"
ON departments
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- INSTITUTIONS
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own institution" ON institutions;
DROP POLICY IF EXISTS "Admins can view all institutions" ON institutions;

CREATE POLICY "allow_authenticated_select_institutions"
ON institutions
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- PROFILES
-- =====================================================
DROP POLICY IF EXISTS "Users can view profiles in their institution" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "allow_authenticated_select_profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_user_update_own_profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check which tables still have restrictive policies
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- List all policies to verify
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
