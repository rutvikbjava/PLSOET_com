# Test Credentials for EduSphere AI

This document contains test credentials for all user roles in the system.

## Setup Instructions

### Step 1: Sign Up Through the UI

Visit `http://localhost:3000/auth/sign-up` and create accounts with these credentials:

| Email | Password | Display Name | Role (will be assigned) |
|-------|----------|--------------|-------------------------|
| `faculty@test.com` | `Test1234!` | Faculty Test User | FACULTY |
| `hod@test.com` | `Test1234!` | HOD Test User | HOD |
| `coe@test.com` | `Test1234!` | COE Test User | COE |
| `principal@test.com` | `Test1234!` | Principal Test User | PRINCIPAL |
| `admin@test.com` | `Test1234!` | Admin Test User | ADMIN |
| `superadmin@test.com` | `Test1234!` | Super Admin Test User | SUPER_ADMIN |

**Note:** When signing up, select any ACTIVE institution from the dropdown.

### Step 2: Run the Seed Script

After all 6 accounts are created, run the SQL script in your Supabase SQL Editor:

```bash
# The script is located at:
supabase/seed-test-users.sql
```

Or copy and run this SQL directly:

```sql
-- Activate and assign roles
UPDATE profiles SET role = 'FACULTY', status = 'ACTIVE' WHERE email = 'faculty@test.com';
UPDATE profiles SET role = 'HOD', status = 'ACTIVE' WHERE email = 'hod@test.com';
UPDATE profiles SET role = 'COE', status = 'ACTIVE' WHERE email = 'coe@test.com';
UPDATE profiles SET role = 'PRINCIPAL', status = 'ACTIVE' WHERE email = 'principal@test.com';
UPDATE profiles SET role = 'ADMIN', status = 'ACTIVE' WHERE email = 'admin@test.com';
UPDATE profiles SET role = 'SUPER_ADMIN', status = 'ACTIVE' WHERE email = 'superadmin@test.com';

-- Verify
SELECT email, role, status FROM profiles WHERE email LIKE '%@test.com' ORDER BY role;
```

### Step 3: Test Each Role

Now you can sign in with each account and test role-specific features!

## Test Credentials Reference

### 1. FACULTY (Regular User)
```
Email: faculty@test.com
Password: Test1234!
```
**Capabilities:**
- View dashboard
- Upload documents
- View own documents
- Create policies (if permitted)
- View notifications
- Sign documents (when requested)
- Approve requests (when designated)

### 2. HOD (Head of Department)
```
Email: hod@test.com
Password: Test1234!
```
**Capabilities:**
- All FACULTY capabilities
- Department-level approvals
- View department documents
- Manage department workflows

### 3. COE (Controller of Examinations)
```
Email: coe@test.com
Password: Test1234!
```
**Capabilities:**
- All FACULTY capabilities
- Examination workflow management
- Grade sheet approvals
- Academic calendar management

### 4. PRINCIPAL (Highest Authority)
```
Email: principal@test.com
Password: Test1234!
```
**Capabilities:**
- All above capabilities
- Institution-wide approvals
- Final authority on all workflows
- View all institutional documents

### 5. ADMIN (System Administrator)
```
Email: admin@test.com
Password: Test1234!
```
**Capabilities:**
- All user capabilities
- User management (/admin/users)
- Approve pending users
- Reject users
- View audit logs (/audit)
- System configuration

### 6. SUPER_ADMIN (Super Administrator)
```
Email: superadmin@test.com
Password: Test1234!
```
**Capabilities:**
- All ADMIN capabilities
- Full system access
- Cross-institution visibility (if configured)
- System-wide audit logs
- Advanced configuration

## Testing Workflows

### Test Approval Workflow
1. Sign in as **faculty@test.com**
2. Upload a document
3. Create an approval request (assign to hod@test.com)
4. Sign out
5. Sign in as **hod@test.com**
6. Visit `/approvals` and approve the request
7. Verify notification appears for faculty user

### Test Signature Workflow
1. Sign in as **hod@test.com**
2. Create a signature request for a document (assign to faculty@test.com)
3. Sign out
4. Sign in as **faculty@test.com**
5. Visit `/signatures` and sign the document
6. Verify signature completion

### Test Admin Functions
1. Sign in as **admin@test.com**
2. Visit `/admin/users` to see pending users
3. Visit `/audit` to see audit logs
4. Approve/reject test users

### Test Notifications
1. Sign in as any user
2. Check the notification bell (top right)
3. Visit `/notifications` for full notification center
4. Mark notifications as read

## Security Notes

⚠️ **IMPORTANT:** These are TEST credentials only!

- **NEVER** use these credentials in production
- **NEVER** commit real passwords to Git
- Change all test passwords regularly
- Use proper password management in production
- Enable 2FA for production admin accounts

## Cleanup

To remove all test users:

```sql
-- Delete test users (careful!)
DELETE FROM profiles WHERE email LIKE '%@test.com';
```

## Quick Verification

After setup, verify all users exist:

```sql
SELECT 
  email,
  display_name,
  role,
  status,
  created_at
FROM profiles
WHERE email LIKE '%@test.com'
ORDER BY 
  CASE role
    WHEN 'SUPER_ADMIN' THEN 1
    WHEN 'ADMIN' THEN 2
    WHEN 'PRINCIPAL' THEN 3
    WHEN 'COE' THEN 4
    WHEN 'HOD' THEN 5
    WHEN 'FACULTY' THEN 6
  END;
```

Expected output:
```
superadmin@test.com | Super Admin Test User | SUPER_ADMIN | ACTIVE
admin@test.com      | Admin Test User       | ADMIN       | ACTIVE
principal@test.com  | Principal Test User   | PRINCIPAL   | ACTIVE
coe@test.com        | COE Test User         | COE         | ACTIVE
hod@test.com        | HOD Test User         | HOD         | ACTIVE
faculty@test.com    | Faculty Test User     | FACULTY     | ACTIVE
```

## Need Help?

If you encounter issues:

1. **Users can't sign in:** Check status is 'ACTIVE' in database
2. **Wrong permissions:** Verify role assignment in database
3. **Supabase errors:** Check `.env.local` has correct credentials
4. **Database connection:** Ensure Supabase project is running

Run this diagnostic query:

```sql
SELECT 
  email,
  role,
  status,
  institution_id,
  department_id
FROM profiles
WHERE email LIKE '%@test.com';
```

All users should have:
- `status = 'ACTIVE'`
- Same `institution_id` (the one you selected during signup)
- `department_id` can be NULL for now
