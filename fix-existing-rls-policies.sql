-- Fix RLS Policies for Existing Tables Only
-- This version checks if tables exist before modifying them

-- =====================================================
-- STEP 1: List all tables to see what exists
-- =====================================================
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- STEP 2: Fix policies only on tables that exist
-- =====================================================

-- DOCUMENT_CONTEXTS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'document_contexts') THEN
    DROP POLICY IF EXISTS "Users can view contexts for documents in their institution" ON document_contexts;
    
    CREATE POLICY "allow_authenticated_select_contexts"
    ON document_contexts FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "allow_authenticated_insert_contexts"
    ON document_contexts FOR INSERT TO authenticated WITH CHECK (true);
    
    CREATE POLICY "allow_authenticated_update_contexts"
    ON document_contexts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'Fixed document_contexts policies';
  END IF;
END $$;

-- POLICIES
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'policies') THEN
    DROP POLICY IF EXISTS "Users can view policies in their institution" ON policies;
    DROP POLICY IF EXISTS "Admins can create policies" ON policies;
    DROP POLICY IF EXISTS "Admins can update policies" ON policies;
    
    CREATE POLICY "allow_authenticated_select_policies"
    ON policies FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "allow_authenticated_insert_policies"
    ON policies FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
    
    CREATE POLICY "allow_authenticated_update_policies"
    ON policies FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
    
    RAISE NOTICE 'Fixed policies policies';
  END IF;
END $$;

-- WORKFLOW_DEFINITIONS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workflow_definitions') THEN
    DROP POLICY IF EXISTS "Users can view workflow definitions in their institution" ON workflow_definitions;
    DROP POLICY IF EXISTS "Admins can create workflow definitions" ON workflow_definitions;
    DROP POLICY IF EXISTS "Admins can update workflow definitions" ON workflow_definitions;
    
    CREATE POLICY "allow_authenticated_select_workflows"
    ON workflow_definitions FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "allow_authenticated_insert_workflows"
    ON workflow_definitions FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
    
    CREATE POLICY "allow_authenticated_update_workflows"
    ON workflow_definitions FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
    
    RAISE NOTICE 'Fixed workflow_definitions policies';
  END IF;
END $$;

-- WORKFLOW_STEPS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'workflow_steps') THEN
    DROP POLICY IF EXISTS "Users can view workflow steps in their institution" ON workflow_steps;
    
    CREATE POLICY "allow_authenticated_select_workflow_steps"
    ON workflow_steps FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "allow_authenticated_insert_workflow_steps"
    ON workflow_steps FOR INSERT TO authenticated WITH CHECK (true);
    
    RAISE NOTICE 'Fixed workflow_steps policies';
  END IF;
END $$;

-- APPROVAL_REQUESTS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'approval_requests') THEN
    DROP POLICY IF EXISTS "Users can view approval requests in their institution" ON approval_requests;
    DROP POLICY IF EXISTS "Users can create approval requests" ON approval_requests;
    
    CREATE POLICY "allow_authenticated_select_approvals"
    ON approval_requests FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "allow_authenticated_insert_approvals"
    ON approval_requests FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());
    
    CREATE POLICY "allow_authenticated_update_approvals"
    ON approval_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'Fixed approval_requests policies';
  END IF;
END $$;

-- SIGNATURE_REQUESTS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'signature_requests') THEN
    DROP POLICY IF EXISTS "Users can view signature requests in their institution" ON signature_requests;
    DROP POLICY IF EXISTS "Users can create signature requests" ON signature_requests;
    
    CREATE POLICY "allow_authenticated_select_signatures"
    ON signature_requests FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "allow_authenticated_insert_signatures"
    ON signature_requests FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());
    
    CREATE POLICY "allow_authenticated_update_signatures"
    ON signature_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    
    RAISE NOTICE 'Fixed signature_requests policies';
  END IF;
END $$;

-- NOTIFICATIONS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
    
    CREATE POLICY "allow_authenticated_select_notifications"
    ON notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid());
    
    CREATE POLICY "allow_authenticated_update_notifications"
    ON notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
    
    RAISE NOTICE 'Fixed notifications policies';
  END IF;
END $$;

-- AUDIT_EVENTS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_events') THEN
    DROP POLICY IF EXISTS "Users can view audit events in their institution" ON audit_events;
    
    CREATE POLICY "allow_authenticated_select_audit"
    ON audit_events FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "allow_authenticated_insert_audit"
    ON audit_events FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());
    
    RAISE NOTICE 'Fixed audit_events policies';
  END IF;
END $$;

-- DEPARTMENTS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'departments') THEN
    DROP POLICY IF EXISTS "Users can view departments in their institution" ON departments;
    
    CREATE POLICY "allow_authenticated_select_departments"
    ON departments FOR SELECT TO authenticated USING (true);
    
    RAISE NOTICE 'Fixed departments policies';
  END IF;
END $$;

-- INSTITUTIONS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'institutions') THEN
    DROP POLICY IF EXISTS "Users can view their own institution" ON institutions;
    DROP POLICY IF EXISTS "Admins can view all institutions" ON institutions;
    
    CREATE POLICY "allow_authenticated_select_institutions"
    ON institutions FOR SELECT TO authenticated USING (true);
    
    RAISE NOTICE 'Fixed institutions policies';
  END IF;
END $$;

-- PROFILES
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    DROP POLICY IF EXISTS "Users can view profiles in their institution" ON profiles;
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update their own basic info" ON profiles;
    DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
    
    CREATE POLICY "allow_authenticated_select_profiles"
    ON profiles FOR SELECT TO authenticated USING (true);
    
    CREATE POLICY "allow_user_update_own_profile"
    ON profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
    
    RAISE NOTICE 'Fixed profiles policies';
  END IF;
END $$;

-- =====================================================
-- STEP 3: Verify policies were created
-- =====================================================
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'documents', 
    'document_versions', 
    'document_contexts',
    'policies',
    'workflow_definitions',
    'workflow_steps',
    'approval_requests',
    'signature_requests',
    'notifications',
    'audit_events',
    'departments',
    'institutions',
    'profiles'
  )
ORDER BY tablename, policyname;
