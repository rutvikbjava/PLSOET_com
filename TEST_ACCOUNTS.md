# EduSphere AI — Test Accounts

## Overview

This document contains test accounts for EduSphere AI development and testing. All accounts are pre-configured with different roles to test the complete user approval workflow.

## Test Accounts

### 👑 System Administrator
- **Email:** `admin@univalpha.edu`
- **Password:** `admin123456`
- **Role:** `SYSTEM_ADMIN`
- **Status:** `ACTIVE` (pre-approved)
- **Capabilities:**
  - Full system access
  - Manage all institutions
  - Approve/reject users
  - Access all admin features

### 🎓 Principal
- **Email:** `principal@univalpha.edu`
- **Password:** `principal123`
- **Role:** `PRINCIPAL`
- **Status:** `ACTIVE` (pre-approved)
- **Capabilities:**
  - Institution-wide management
  - Approve/reject users in their institution
  - Manage departments
  - Access admin panel

### 📊 Department Admin
- **Email:** `dean@univalpha.edu`
- **Password:** `dean123456`
- **Role:** `ADMIN`
- **Status:** `ACTIVE` (pre-approved)
- **Capabilities:**
  - Department management
  - Approve users within department
  - Manage workflows

### 👨‍🏫 Head of Department
- **Email:** `hod.cs@univalpha.edu`
- **Password:** `hod123456`
- **Role:** `HOD`
- **Status:** `ACTIVE` (pre-approved)
- **Capabilities:**
  - Department-level approvals
  - View department analytics
  - Manage department workflows

### 👤 Faculty Member 1 (Pending Verification)
- **Email:** `faculty1@univalpha.edu`
- **Password:** `faculty123`
- **Role:** `FACULTY`
- **Status:** `PENDING_VERIFICATION` ⏳
- **Use Case:** Test user approval workflow

### 👤 Faculty Member 2 (Pending Verification)
- **Email:** `faculty2@univalpha.edu`
- **Password:** `faculty123`
- **Role:** `FACULTY`
- **Status:** `PENDING_VERIFICATION` ⏳
- **Use Case:** Test user approval workflow

### 🛠️ Support Staff (Pending Verification)
- **Email:** `staff@univalpha.edu`
- **Password:** `staff123456`
- **Role:** `STAFF`
- **Status:** `PENDING_VERIFICATION` ⏳
- **Use Case:** Test staff user workflow

---

## Testing the User Approval Workflow

### Step 1: Sign in as Admin
1. Open http://localhost:3001
2. Sign in with `admin@univalpha.edu` / `admin123456`
3. Navigate to **Admin → Users** (or `/admin/users`)

### Step 2: View Pending Users
You should see 3 users with `PENDING_VERIFICATION` status:
- faculty1@univalpha.edu
- faculty2@univalpha.edu  
- staff@univalpha.edu

### Step 3: Approve/Reject Users
1. Click on a pending user
2. Review their profile
3. Choose **Approve** or **Reject**
4. User status will change to `ACTIVE` or `SUSPENDED`

### Step 4: Test Approved User Access
1. Sign out from admin account
2. Sign in as the approved faculty user
3. Verify they can now access the dashboard fully

---

## Your Personal Account

Your personal account is also in the system:

- **Email:** `gopalradha172004@gmail.com`
- **Password:** `rutvik123`
- **Role:** `FACULTY`
- **Status:** `PENDING_VERIFICATION` ⏳

To activate your account:
1. Sign in as admin
2. Navigate to Admin → Users
3. Find your account and approve it

---

## Security Notes

⚠️ **IMPORTANT:**
- These are **DEVELOPMENT/TEST accounts only**
- Change all passwords before deploying to production
- Never commit passwords to version control
- Use strong, unique passwords in production
- Enable 2FA for admin accounts in production

---

## Recreating Test Users

If you need to recreate all test users, run:

```bash
node create-test-users.js
```

This script will:
- Check for existing users
- Create missing users
- Update existing users to match the correct roles
- Auto-confirm all emails for testing

---

## Application URL

- **Development:** http://localhost:3001
- **Sign-in page:** http://localhost:3001/auth/sign-in
- **Admin panel:** http://localhost:3001/admin/users

---

## Quick Reference

| Role | Can Approve Users | Full Admin Access | Department Limited |
|------|-------------------|-------------------|-------------------|
| SYSTEM_ADMIN | ✅ All institutions | ✅ Yes | ❌ No |
| PRINCIPAL | ✅ Own institution | ✅ Yes | ❌ No |
| ADMIN | ✅ Own department | ⚠️ Limited | ✅ Yes |
| HOD | ✅ Own department | ❌ No | ✅ Yes |
| FACULTY | ❌ No | ❌ No | ❌ No |
| STAFF | ❌ No | ❌ No | ❌ No |

---

Generated: 2026-09-06
Script: `create-test-users.js`
