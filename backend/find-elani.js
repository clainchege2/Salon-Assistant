const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Tenant = require('./src/models/Tenant');

async function findElani() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Search for user with name containing "Elani"
    const users = await User.find({
      $or: [
        { firstName: /elani/i },
        { lastName: /elani/i },
        { email: /elani/i }
      ]
    });

    if (users.length === 0) {
      console.log('❌ No user found with name "Elani"\n');
      console.log('Available stylists:');
      const stylists = await User.find({ role: 'stylist' }).limit(10);
      for (const stylist of stylists) {
        const tenant = await Tenant.findById(stylist.tenantId);
        console.log(`\n📱 ${stylist.firstName} ${stylist.lastName}`);
        console.log(`   Email: ${stylist.email}`);
        console.log(`   Salon Slug: ${tenant?.slug || 'N/A'}`);
        console.log(`   Salon Name: ${tenant?.businessName || 'N/A'}`);
      }
    } else {
      console.log('✅ Found user(s) matching "Elani":\n');
      for (const user of users) {
        const tenant = await Tenant.findById(user.tenantId);
        console.log('═══════════════════════════════════════');
        console.log(`📱 LOGIN CREDENTIALS FOR MOBILE APP:`);
        console.log('═══════════════════════════════════════');
        console.log(`Salon ID: ${tenant?.slug || 'N/A'}`);
        console.log(`Email: ${user.email}`);
        console.log(`Password: [Check your records or reset]`);
        console.log(`\nUser Details:`);
        console.log(`  Name: ${user.firstName} ${user.lastName}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Salon: ${tenant?.businessName || 'N/A'}`);
        console.log('═══════════════════════════════════════\n');
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

findElani();
