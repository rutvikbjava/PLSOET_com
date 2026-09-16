/**
 * Create Test Users for EduSphere AI
 * 
 * Creates a set of test users with different roles:
 * - SYSTEM_ADMIN (superuser, can manage everything)
 * - PRINCIPAL (institution head, can approve users)
 * - ADMIN (department admin)
 * - HOD (head of department)
 * - FACULTY (regular faculty, needs approval)
 * - STAFF (support staff)
 * 
 * All users will be created with email confirmation enabled.
 * Default password: "test123456" (change after creation)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// Test users to create
const TEST_USERS = [
  {
    email: 'admin@univalpha.edu',
    password: 'admin123456',
    displayName: 'System Administrator',
    role: 'SYSTEM_ADMIN',
    status: 'ACTIVE', // Admins are pre-activated
    description: 'System-wide administrator with full access'
  },
  {
    email: 'principal@univalpha.edu',
    password: 'principal123',
    displayName: 'Dr. Jane Principal',
    role: 'PRINCIPAL',
    status: 'ACTIVE', // Principals are pre-activated
    description: 'Institution principal, can approve users'
  },
  {
    email: 'dean@univalpha.edu',
    password: 'dean123456',
    displayName: 'Prof. Dean Smith',
    role: 'ADMIN',
    status: 'ACTIVE', // Department admins are pre-activated
    description: 'Department administrator'
  },
  {
    email: 'hod.cs@univalpha.edu',
    password: 'hod123456',
    displayName: 'Dr. CS Head',
    role: 'HOD',
    status: 'ACTIVE',
    description: 'Head of Computer Science Department'
  },
  {
    email: 'faculty1@univalpha.edu',
    password: 'faculty123',
    displayName: 'Prof. John Faculty',
    role: 'FACULTY',
    status: 'PENDING_VERIFICATION',
    description: 'Faculty member awaiting verification'
  },
  {
    email: 'faculty2@univalpha.edu',
    password: 'faculty123',
    displayName: 'Dr. Sarah Teacher',
    role: 'FACULTY',
    status: 'PENDING_VERIFICATION',
    description: 'Another faculty member awaiting verification'
  },
  {
    email: 'staff@univalpha.edu',
    password: 'staff123456',
    displayName: 'Support Staff',
    role: 'STAFF',
    status: 'PENDING_VERIFICATION',
    description: 'Support staff member'
  }
];

async function createTestUsers() {
  console.log('\n=== Creating Test Users for EduSphere AI ===\n');

  try {
    // 1. Get the institution ID
    console.log('1. Finding University Alpha institution...');
    const { data: institutions, error: instError } = await adminClient
      .from('institutions')
      .select('id, name, code')
      .eq('code', 'UNIV_ALPHA')
      .single();

    if (instError || !institutions) {
      console.error('❌ University Alpha not found');
      console.log('   Creating institution...');
      
      const { data: newInst, error: createError } = await adminClient
        .from('institutions')
        .insert({
          id: '11111111-1111-1111-1111-111111111111',
          name: 'University Alpha',
          code: 'UNIV_ALPHA',
          status: 'ACTIVE'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create institution:', createError.message);
        return;
      }
      
      console.log('✅ Institution created');
    } else {
      console.log(`✅ Found institution: ${institutions.name} (${institutions.code})`);
    }

    const institutionId = institutions?.id || '11111111-1111-1111-1111-111111111111';

    // 2. Get existing users to avoid duplicates
    console.log('\n2. Checking existing users...');
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingEmails = new Set(existingUsers.users.map(u => u.email));

    // 3. Create each test user
    console.log('\n3. Creating test users...\n');
    
    const results = [];

    for (const user of TEST_USERS) {
      console.log(`\n--- Creating: ${user.displayName} (${user.role}) ---`);
      
      // Check if user already exists
      if (existingEmails.has(user.email)) {
        console.log(`⚠️  User ${user.email} already exists - skipping`);
        
        // Try to update their profile to match the desired role/status
        const existingUser = existingUsers.users.find(u => u.email === user.email);
        if (existingUser) {
          const { error: updateError } = await adminClient
            .from('profiles')
            .update({
              role: user.role,
              status: user.status,
              display_name: user.displayName
            })
            .eq('id', existingUser.id);

          if (updateError) {
            console.log(`   ❌ Could not update profile: ${updateError.message}`);
          } else {
            console.log(`   ✅ Updated profile to ${user.role}/${user.status}`);
          }
        }
        
        results.push({ email: user.email, status: 'exists', role: user.role });
        continue;
      }

      // Create auth user
      console.log(`   Creating auth user: ${user.email}`);
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email for test users
        user_metadata: {
          display_name: user.displayName
        }
      });

      if (authError) {
        console.error(`   ❌ Auth creation failed: ${authError.message}`);
        results.push({ email: user.email, status: 'failed', error: authError.message });
        continue;
      }

      console.log(`   ✅ Auth user created (ID: ${authData.user.id})`);

      // Create profile
      console.log(`   Creating profile...`);
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: user.email,
          display_name: user.displayName,
          institution_id: institutionId,
          department_id: null,
          role: user.role,
          status: user.status
        });

      if (profileError) {
        console.error(`   ❌ Profile creation failed: ${profileError.message}`);
        
        // Clean up auth user
        await adminClient.auth.admin.deleteUser(authData.user.id);
        console.log(`   🧹 Cleaned up auth user`);
        
        results.push({ email: user.email, status: 'failed', error: profileError.message });
        continue;
      }

      console.log(`   ✅ Profile created`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${user.password}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(`   📊 Status: ${user.status}`);
      
      results.push({ 
        email: user.email, 
        password: user.password,
        role: user.role,
        status: 'created' 
      });
    }

    // 4. Summary
    console.log('\n\n=== SUMMARY ===\n');
    console.log('Test users ready for use:\n');
    
    const created = results.filter(r => r.status === 'created');
    const existing = results.filter(r => r.status === 'exists');
    const failed = results.filter(r => r.status === 'failed');

    if (created.length > 0) {
      console.log('✅ NEWLY CREATED:');
      created.forEach(r => {
        const userDef = TEST_USERS.find(u => u.email === r.email);
        console.log(`\n   ${userDef.displayName}`);
        console.log(`   Email: ${r.email}`);
        console.log(`   Password: ${r.password}`);
        console.log(`   Role: ${r.role}`);
      });
    }

    if (existing.length > 0) {
      console.log('\n\n⚠️  ALREADY EXISTED (updated to correct role):');
      existing.forEach(r => {
        console.log(`   - ${r.email} (${r.role})`);
      });
    }

    if (failed.length > 0) {
      console.log('\n\n❌ FAILED:');
      failed.forEach(r => {
        console.log(`   - ${r.email}: ${r.error}`);
      });
    }

    console.log('\n\n📝 USAGE INSTRUCTIONS:\n');
    console.log('1. Sign in as admin@univalpha.edu / admin123456');
    console.log('2. Navigate to Admin > Users page');
    console.log('3. You should see pending verification users');
    console.log('4. Approve faculty1@univalpha.edu and faculty2@univalpha.edu');
    console.log('5. Test the approval workflow!');
    
    console.log('\n✅ All test users ready!\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error.message);
    console.error(error);
  }
}

createTestUsers().then(() => {
  process.exit(0);
});
