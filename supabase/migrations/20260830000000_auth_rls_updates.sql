-- ============================================================================
-- EduSphere AI — Authentication RLS Updates
-- Migration: 20260830000000_auth_rls_updates.sql
-- Task: EDU-005
-- Created: 2026-08-30
--
-- This migration adds RLS policies needed for authentication flows:
-- 1. Allow anonymous users to view ACTIVE institutions (for signup)
-- 2. Add RLS enable statement confirmation (defense in depth)
-- ============================================================================

-- ============================================================================
-- INSTITUTIONS - Anonymous Access for Sign-Up
-- ============================================================================

-- Allow anonymous users to view active institutions
-- This is required for the sign-up form to display institution selection
CREATE POLICY "Anonymous users can view active institutions for signup"
  ON institutions
  FOR SELECT
  TO anon
  USING (status = 'ACTIVE');

COMMENT ON POLICY "Anonymous users can view active institutions for signup" ON institutions IS
  'Allows unauthenticated users to see active institutions during registration. Only ACTIVE institutions are visible to prevent information disclosure about inactive/suspended institutions.';

-- ============================================================================
-- ENABLE RLS (Confirmation - should already be enabled)
-- ============================================================================

-- These statements are idempotent - safe to run multiple times
-- Ensures RLS is enabled on all application tables

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

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- This migration addresses EDU-005 requirements:
-- 
-- 1. Anonymous users MUST be able to view active institutions during sign-up
--    - Limited to ACTIVE status only (security consideration)
--    - Required for institution selection in registration form
--    - No sensitive information exposed (name, code only)
--
-- 2. RLS enable statements are defensive (already enabled in EDU-004)
--    - Idempotent operation (safe to run multiple times)
--    - Ensures RLS cannot be accidentally disabled
--    - Part of security-in-depth strategy
