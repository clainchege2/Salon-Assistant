const mongoose = require('mongoose');
const User = require('./src/models/User');

async function clearAndFixPermissions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/elegance-hair-salon-kenya');
    console.log('Connected to MongoDB');

    // Clear all existing permissions first
    console.log('🧹 Clearing existing permissions...');
    await User.updateMany({}, { $unset: { permissions: 1 } });
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);

    for (const user of users) {
      console.log(`Setting new permissions for ${user.name} (${user.role})`);
      
      // Set default permissions based on role
      user.setDefaultPermissions();
      await user.save();
      
      console.log(`✅ Updated ${user.name} with new permission structure`);
    }

    // Verify the updates
    console.log('\n🔍 Verifying new permission structure...');
    
    const updatedUsers = await User.find({}).select('name role permissions');
    for (const user of updatedUsers) {
      console.log(`\n${user.name} (${user.role}):`);
      
      if (user.permissions) {
        Object.keys(user.permissions).forEach(perm => {
          const status = user.permissions[perm] ? '✅' : '❌';
          console.log(`  ${status} ${perm}`);
        });
      } else {
        console.log('  ❌ No permissions set');
      }
    }

    console.log('\n🎉 Permission structure fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

clearAndFixPermissions();