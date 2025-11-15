// Script to fix owner permissions
require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const User = require('./backend/src/models/User');

async function fixOwnerPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all owner users
    const owners = await User.find({ role: 'owner' });
    console.log(`Found ${owners.length} owner users`);

    for (const owner of owners) {
      console.log(`\nChecking owner: ${owner.firstName} ${owner.lastName} (${owner.email})`);
      console.log('Current permissions:', owner.permissions);

      // Update permissions
      owner.permissions = {
        canViewCommunications: true,
        canViewMarketing: true,
        canDeleteBookings: true,
        canDeleteClients: true,
        canManageStaff: true,
        canManageServices: true,
        canManageInventory: true,
        canViewReports: true
      };

      await owner.save({ validateBeforeSave: false });
      console.log('✅ Permissions updated!');
    }

    console.log('\n✅ All owner permissions fixed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixOwnerPermissions();
