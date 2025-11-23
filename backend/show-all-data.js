require('dotenv').config();
const mongoose = require('mongoose');

async function showAllData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;

    // Show all tenants
    console.log('🏢 ALL TENANTS:');
    console.log('═'.repeat(80));
    const tenants = await db.collection('tenants').find().sort({ createdAt: -1 }).toArray();
    
    if (tenants.length === 0) {
      console.log('  No tenants found\n');
    } else {
      tenants.forEach((t, index) => {
        console.log(`\n${index + 1}. ${t.businessName}`);
        console.log(`   ID: ${t._id}`);
        console.log(`   Slug: ${t.slug}`);
        console.log(`   Email: ${t.contactEmail}`);
        console.log(`   Phone: ${t.contactPhone}`);
        console.log(`   Status: ${t.status}`);
        console.log(`   Created: ${t.createdAt}`);
      });
      console.log('\n' + '═'.repeat(80));
      console.log(`Total Tenants: ${tenants.length}\n`);
    }

    // Show all users
    console.log('\n👤 ALL USERS:');
    console.log('═'.repeat(80));
    const users = await db.collection('users').find().sort({ createdAt: -1 }).toArray();
    
    if (users.length === 0) {
      console.log('  No users found\n');
    } else {
      for (const u of users) {
        const tenant = tenants.find(t => t._id.toString() === u.tenantId.toString());
        console.log(`\n${u.firstName} ${u.lastName}`);
        console.log(`   ID: ${u._id}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Phone: ${u.phone}`);
        console.log(`   Role: ${u.role}`);
        console.log(`   Status: ${u.status}`);
        console.log(`   Tenant: ${tenant ? tenant.businessName : 'Unknown'}`);
        console.log(`   Created: ${u.createdAt}`);
      }
      console.log('\n' + '═'.repeat(80));
      console.log(`Total Users: ${users.length}\n`);
    }

    // Show all clients
    console.log('\n👥 ALL CLIENTS:');
    console.log('═'.repeat(80));
    const clients = await db.collection('clients').find().sort({ createdAt: -1 }).toArray();
    
    if (clients.length === 0) {
      console.log('  No clients found\n');
    } else {
      for (const c of clients) {
        const tenant = tenants.find(t => t._id.toString() === c.tenantId.toString());
        console.log(`\n${c.firstName} ${c.lastName}`);
        console.log(`   ID: ${c._id}`);
        console.log(`   Email: ${c.email || 'N/A'}`);
        console.log(`   Phone: ${c.phone}`);
        console.log(`   Status: ${c.accountStatus}`);
        console.log(`   Tenant: ${tenant ? tenant.businessName : 'Unknown'}`);
        console.log(`   Created: ${c.createdAt}`);
      }
      console.log('\n' + '═'.repeat(80));
      console.log(`Total Clients: ${clients.length}\n`);
    }

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

showAllData();
