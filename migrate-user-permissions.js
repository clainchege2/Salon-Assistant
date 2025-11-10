const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

/**
 * Migration script to update existing users with new owner-only permission structure
 * This script ensures:
 * - Owners retain all permissions
 * - All other staff get minimal permissions (booking operations only)
 */

async function migrateUserPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/salon-management');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    let ownersUpdated = 0;
    let staffUpdated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        console.log(`Processing user: ${user.name} (${user.email}) - Role: ${user.role}`);
        
        // Store original permissions for comparison
        const originalPermissions = { ...user.permissions };
        
        // Apply new permission structure
        user.setDefaultPermissions();
        
        // Save the updated user
        await user.save();
        
        if (user.role === 'owner') {
          ownersUpdated++;
          console.log(`✓ Owner ${user.name} - All permissions granted`);
        } else {
          staffUpdated++;
          console.log(`✓ Staff ${user.name} - Minimal permissions (booking only)`);
        }
        
        // Log permission changes
        const newPermissions = user.permissions;
        const changedPermissions = [];
        
        for (const [key, value] of Object.entries(newPermissions)) {
          if (originalPermissions[key] !== value) {
            changedPermissions.push(`${key}: ${originalPermissions[key]} → ${value}`);
          }
        }
        
        if (changedPermissions.length > 0) {
          console.log(`  Permission changes: ${changedPermissions.join(', ')}`);
        }
        
      } catch (error) {
        errors++;
        console.error(`✗ Error updating user ${user.name}: ${error.message}`);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total users processed: ${users.length}`);
    console.log(`Owners updated: ${ownersUpdated}`);
    console.log(`Staff updated: ${staffUpdated}`);
    console.log(`Errors: ${errors}`);
    
    if (errors === 0) {
      console.log('✓ Migration completed successfully!');
    } else {
      console.log(`⚠ Migration completed with ${errors} errors`);
    }

    // Verify the migration
    console.log('\n=== Verification ===');
    const verificationUsers = await User.find({});
    
    for (const user of verificationUsers) {
      const hasAdminPermissions = user.permissions.canManageStaff || 
                                 user.permissions.canManageSettings || 
                                 user.permissions.canManageMarketing ||
                                 user.permissions.canViewReports;
      
      if (user.role === 'owner' && !hasAdminPermissions) {
        console.error(`✗ Owner ${user.name} missing administrative permissions!`);
      } else if (user.role !== 'owner' && hasAdminPermissions) {
        console.error(`✗ Staff ${user.name} has administrative permissions!`);
      } else {
        console.log(`✓ ${user.name} (${user.role}) - Permissions correct`);
      }
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  migrateUserPermissions()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateUserPermissions;