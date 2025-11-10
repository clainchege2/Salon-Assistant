const mongoose = require('mongoose');
const User = require('./src/models/User');

async function completePermissionFix() {
  try {
    await mongoose.connect('mongodb://localhost:27017/elegance-hair-salon-kenya');
    console.log('🔗 Connected to MongoDB');

    // Step 1: Clear all existing permissions
    console.log('\n🧹 Step 1: Clearing all existing permissions...');
    await User.updateMany({}, { $unset: { permissions: 1 } });
    console.log('✅ Cleared all existing permissions');

    // Step 2: Find all users and set proper permissions
    console.log('\n👥 Step 2: Setting new permission structure...');
    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);

    for (const user of users) {
      console.log(`\n🔧 Processing ${user.name} (${user.role})...`);
      
      // Set default permissions based on role
      user.setDefaultPermissions();
      await user.save();
      
      // Verify permissions were set
      const updatedUser = await User.findById(user._id);
      const permissionCount = Object.keys(updatedUser.permissions || {}).length;
      const enabledCount = Object.values(updatedUser.permissions || {}).filter(p => p).length;
      
      console.log(`✅ ${user.name}: ${enabledCount}/${permissionCount} permissions enabled`);
      
      // Show enabled permissions for owners
      if (user.role === 'owner') {
        const enabled = Object.keys(updatedUser.permissions).filter(p => updatedUser.permissions[p]);
        console.log(`   Owner permissions: ${enabled.join(', ')}`);
      }
    }

    // Step 3: Verify the permission structure
    console.log('\n🔍 Step 3: Verifying permission structure...');
    
    const rolePermissions = {};
    const allUsers = await User.find({}).select('name role permissions');
    
    for (const user of allUsers) {
      if (!rolePermissions[user.role]) {
        rolePermissions[user.role] = {};
      }
      
      if (user.permissions) {
        Object.keys(user.permissions).forEach(perm => {
          if (!rolePermissions[user.role][perm]) {
            rolePermissions[user.role][perm] = 0;
          }
          if (user.permissions[perm]) {
            rolePermissions[user.role][perm]++;
          }
        });
      }
    }

    console.log('\n📊 Permission Summary by Role:');
    Object.keys(rolePermissions).forEach(role => {
      console.log(`\n${role.toUpperCase()}:`);
      Object.keys(rolePermissions[role]).forEach(perm => {
        const count = rolePermissions[role][perm];
        const status = count > 0 ? '✅' : '❌';
        console.log(`  ${status} ${perm} (${count} users)`);
      });
    });

    // Step 4: Test permission checking
    console.log('\n🧪 Step 4: Testing permission system...');
    
    const owner = await User.findOne({ role: 'owner' });
    const stylist = await User.findOne({ role: 'stylist' });
    
    if (owner && stylist) {
      console.log(`\n👑 Owner (${owner.name}) permissions:`);
      console.log(`  canManageStaff: ${owner.permissions?.canManageStaff ? '✅' : '❌'}`);
      console.log(`  canViewCommunications: ${owner.permissions?.canViewCommunications ? '✅' : '❌'}`);
      console.log(`  canManageSettings: ${owner.permissions?.canManageSettings ? '✅' : '❌'}`);
      
      console.log(`\n💇 Stylist (${stylist.name}) permissions:`);
      console.log(`  canManageStaff: ${stylist.permissions?.canManageStaff ? '✅' : '❌'}`);
      console.log(`  canViewCommunications: ${stylist.permissions?.canViewCommunications ? '✅' : '❌'}`);
      console.log(`  canManageSettings: ${stylist.permissions?.canManageSettings ? '✅' : '❌'}`);
    }

    console.log('\n🎉 Complete permission system fix completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Restart the server to load new permission structure');
    console.log('2. Login as owner to test permission management');
    console.log('3. Test role-based access with different user types');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Permission fix failed:', error);
    process.exit(1);
  }
}

completePermissionFix();