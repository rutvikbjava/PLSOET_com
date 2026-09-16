# Authentication Manual Testing Guide

**Environment:** DEVELOPMENT (https://fnxjnfhdhlzbwkisuuzf.supabase.co)
**Application:** http://localhost:3000
**Created:** 2026-09-06
**Purpose:** Complete authentication E2E verification

## ⚠️ CRITICAL SAFETY RULES

1. **ONLY test in DEVELOPMENT environment**
2. **Use ONLY synthetic test emails:** `auth-test-<id>@example.invalid`
3. **NEVER use real personal emails**
4. **NEVER commit test credentials to git**
5. **Clean up test accounts after testing**

## Prerequisites

1. Start development server: `npm run dev`
2. Verify server running at http://localhost:3000
3. Open browser in private/incognito mode (clean session)
4. Have Supabase dashboard access for verification

## Test Accounts

### Recommended Test Account Pattern

```
Email: auth-test-e2e-001@example.invalid
Password: TestPass123!
Display Name: E2E Test User 001
Institution: [Select any ACTIVE institution from dropdown]
```

**Password Requirements:**
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers recommended

## Sign Up Tests

### Test 1: Page Load
**Action:** Navigate to http://localhost:3000/auth/sign-up
**Expected:** 
- ✓ Page loads successfully
- ✓ Form displays: Display Name, Email, Institution, Password, Confirm Password
- ✓ Institution dropdown populated with ACTIVE institutions
- ✓ Notice about PENDING_VERIFICATION status visible

**Result:** [ ] PASS [ ] FAIL

---

### Test 2: Empty Form Submission
**Action:** Click "Create account" without filling any fields
**Expected:**
- ✓ Browser validation prevents submission
- ✓ Required field indicators appear
- ✓ No network request sent

**Result:** [ ] PASS [ ] FAIL

---

### Test 3: Invalid Email Format
**Action:**
1. Fill Display Name: "Test User"
2. Email: "notanemail"
3. Institution: Select any
4. Password: "TestPass123!"
5. Confirm Password: "TestPass123!"
6. Submit

**Expected:**
- ✓ HTML5 email validation triggers
- ✓ Error message: "Please enter a valid email"
- ✓ No account created

**Result:** [ ] PASS [ ] FAIL

---

### Test 4: Password Too Short
**Action:**
1. Fill all fields correctly
2. Password: "Test1!" (< 8 characters)
3. Submit

**Expected:**
- ✓ Client-side validation error: "Password must be at least 8 characters"
- ✓ Form submission blocked
- ✓ No account created

**Result:** [ ] PASS [ ] FAIL

---

### Test 5: Password Mismatch
**Action:**
1. Fill all fields
2. Password: "TestPass123!"
3. Confirm Password: "DifferentPass123!"
4. Submit

**Expected:**
- ✓ Error: "Passwords do not match"
- ✓ No account created

**Result:** [ ] PASS [ ] FAIL

---

### Test 6: Valid Registration
**Action:**
1. Email: auth-test-e2e-001@example.invalid
2. Display Name: E2E Test User 001
3. Institution: [Select first ACTIVE]
4. Password: TestPass123!
5. Confirm Password: TestPass123!
6. Click "Create account"

**Expected:**
- ✓ Loading state: Button shows "Creating account..."
- ✓ Request succeeds (check Network tab: status 200)
- ✓ Redirect to /dashboard
- ✓ If email verification enabled: May show verification notice
- ✓ If verification pending: May show "Account pending verification" message

**Verification:**
1. Check Supabase Dashboard → Authentication → Users
   - New user exists with correct email
2. Check Database → profiles table
   - Profile created with:
     - Correct display_name
     - Correct institution_id
     - role = 'FACULTY' (CRITICAL: Never user-supplied)
     - status = 'PENDING_VERIFICATION'

**Result:** [ ] PASS [ ] FAIL

**Notes:**
____________________

---

### Test 7: Duplicate Registration
**Action:** Repeat Test 6 with same email
**Expected:**
- ✓ Error message: "An account with this email already exists"
- ✓ No duplicate profile created (verify in DB)
- ✓ Original account unchanged

**Result:** [ ] PASS [ ] FAIL

---

### Test 8: Email Verification (If Enabled)
**Check:** Supabase Dashboard → Authentication → Settings → Email Auth
**If enabled:**
1. Check test email inbox (if test email system available)
2. Click verification link
3. Verify redirect and user status update

**If no test email access:**
Mark as **BLOCKED - Email infrastructure unavailable**

**Result:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Sign In Tests

### Test 9: Sign In Page Load
**Action:** Navigate to http://localhost:3000/auth/sign-in
**Expected:**
- ✓ Page loads
- ✓ Email and Password inputs visible
- ✓ "Sign in" button visible

**Result:** [ ] PASS [ ] FAIL

---

### Test 10: Empty Credentials
**Action:** Click "Sign in" without entering credentials
**Expected:**
- ✓ Browser validation blocks submission
- ✓ Required field errors shown

**Result:** [ ] PASS [ ] FAIL

---

### Test 11: Invalid Email Format
**Action:** 
1. Email: "notvalid"
2. Password: "anything"
3. Submit

**Expected:**
- ✓ HTML5 validation error
- ✓ No authentication attempt

**Result:** [ ] PASS [ ] FAIL

---

### Test 12: Wrong Password
**Action:**
1. Email: auth-test-e2e-001@example.invalid
2. Password: WrongPassword123!
3. Submit

**Expected:**
- ✓ Error: "Invalid email or password" (sanitized, no account enumeration)
- ✓ No session created
- ✓ Still on sign-in page

**Result:** [ ] PASS [ ] FAIL

---

### Test 13: Nonexistent Account
**Action:**
1. Email: nonexistent-test@example.invalid
2. Password: TestPass123!
3. Submit

**Expected:**
- ✓ Error: "Invalid email or password" (same message as wrong password)
- ✓ No information leak about account existence

**Result:** [ ] PASS [ ] FAIL

---

### Test 14: Correct Credentials
**Action:**
1. Email: auth-test-e2e-001@example.invalid
2. Password: TestPass123!
3. Submit

**Expected:**
- ✓ Loading state: "Signing in..."
- ✓ Authentication succeeds
- ✓ Redirect to /dashboard (or original protected URL if came from redirect)
- ✓ User sees authenticated UI

**Verification:**
- Check Application tab → Cookies: Supabase auth cookies present
- Check dashboard shows user's display name
- Check institution context is correct

**Result:** [ ] PASS [ ] FAIL

**Notes:**
____________________

---

## Session Tests

### Test 15: Protected Route Access
**Prerequisites:** Signed in from Test 14
**Action:** Navigate to http://localhost:3000/dashboard
**Expected:**
- ✓ Page loads successfully
- ✓ User information displayed
- ✓ No redirect to sign-in

**Result:** [ ] PASS [ ] FAIL

---

### Test 16: Page Refresh Persistence
**Prerequisites:** On /dashboard after sign-in
**Action:** Press F5 (refresh)
**Expected:**
- ✓ Page reloads
- ✓ Still authenticated
- ✓ No redirect to sign-in
- ✓ User data persists

**Result:** [ ] PASS [ ] FAIL

---

### Test 17: Cross-Page Navigation
**Prerequisites:** Authenticated
**Action:** Navigate between:
1. /dashboard
2. /documents
3. /workflows
4. /dashboard again

**Expected:**
- ✓ All pages load successfully
- ✓ Session persists throughout
- ✓ User context maintained

**Result:** [ ] PASS [ ] FAIL

---

### Test 18: New Tab Behavior
**Prerequisites:** Authenticated in Tab 1
**Action:**
1. Open new tab
2. Navigate to http://localhost:3000/dashboard

**Expected:**
- ✓ Session persists (cookies shared across tabs)
- ✓ Authenticated immediately
- ✓ OR: Redirect to sign-in if session cookies don't persist (document expected behavior)

**Result:** [ ] PASS [ ] FAIL

---

### Test 19: Logout
**Prerequisites:** Authenticated
**Action:** Click "Sign Out" (in user menu/navigation)
**Expected:**
- ✓ User signed out
- ✓ Redirect to homepage (/) or /auth/sign-in
- ✓ Auth cookies cleared (check Application tab)
- ✓ UI shows signed-out state

**Result:** [ ] PASS [ ] FAIL

---

### Test 20: Protected Route After Logout
**Prerequisites:** Just signed out (Test 19)
**Action:** Navigate to http://localhost:3000/dashboard
**Expected:**
- ✓ Redirect to /auth/sign-in?redirect=/dashboard
- ✓ Not able to access protected content
- ✓ Dashboard does not load

**Result:** [ ] PASS [ ] FAIL

---

## Authorization Tests

### Test 21: Role-Based Access
**Prerequisites:** Signed in as FACULTY (default)
**Action:** Navigate to http://localhost:3000/admin/users
**Expected:**
- ✓ Access denied OR
- ✓ Page shows "You don't have permission" OR
- ✓ Redirect to dashboard (depends on implementation)

**Verification:** FACULTY user cannot access ADMIN routes

**Result:** [ ] PASS [ ] FAIL [ ] NOT APPLICABLE

---

## RLS & Tenant Isolation Tests

### Test 22: Data Isolation (If Multi-User Test Possible)
**Prerequisites:** Two test accounts in different institutions
**Action:**
1. Sign in as User A (Institution A)
2. Create a document
3. Sign out
4. Sign in as User B (Institution B)
5. Try to access User A's document (if URL known)

**Expected:**
- ✓ User B cannot see User A's document
- ✓ 404 or Access Denied
- ✓ RLS prevents cross-institution data access

**Result:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Security Verification

### Test 23: Service Role Key Protection
**Action:** 
1. Open DevTools → Network tab
2. Perform any authenticated action
3. Inspect request headers and responses

**Expected:**
- ✓ NO service role key in any client request
- ✓ Only anon key in Authorization headers
- ✓ Service role key remains server-only

**Result:** [ ] PASS [ ] FAIL

---

### Test 24: Session Token Inspection
**Action:** DevTools → Application → Cookies → localhost:3000
**Expected:**
- ✓ Supabase auth cookies present
- ✓ Cookies have httpOnly flag (if applicable)
- ✓ Secure flag appropriate for protocol
- ✓ No tokens exposed in localStorage (unless expected)

**Result:** [ ] PASS [ ] FAIL

---

## Test Cleanup

### Post-Testing Cleanup
**Action:** Remove test accounts via Supabase Dashboard

1. Navigate to Supabase Dashboard → SQL Editor
2. Run:
```sql
-- Remove test auth users
DELETE FROM auth.users WHERE email LIKE 'auth-test-%@example.invalid';

-- Remove test profiles (CASCADE should handle this, but verify)
DELETE FROM public.profiles WHERE email LIKE 'auth-test-%@example.invalid';
```

3. Verify:
```sql
SELECT email FROM auth.users WHERE email LIKE 'auth-test-%';
SELECT email FROM public.profiles WHERE email LIKE 'auth-test-%';
-- Should return 0 rows
```

**Cleanup Status:** [ ] COMPLETED

---

## Summary

**Total Tests:** 24
**Passed:** ____
**Failed:** ____
**Blocked:** ____

**Critical Issues Found:**
________________________

**Authentication Status:** [ ] COMPLETE [ ] PARTIAL [ ] BLOCKED

**Tested By:** ____________________
**Date:** ____________________
**Notes:**
________________________
