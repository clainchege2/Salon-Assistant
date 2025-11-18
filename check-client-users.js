const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function checkClientUsers() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('salon-assistant');
    
    // Find Luxury Hair Lounge tenant
    const tenant = await db.collection('tenants').findOne({ 
      slug: 'luxury-hair-demo' 
    });
    
    if (!tenant) {
      console.log('❌ Luxury Hair Lounge tenant not found');
      return;
    }
    
    console.log('📍 Tenant:', tenant.businessName);
    console.log('   ID:', tenant._id);
    console.log('   Slug:', tenant.slug);
    console.log('\n');
    
    // Check admin portal clients (customer records)
    const adminClients = await db.collection('clients').find({ 
      tenantId: tenant._id 
    }).toArray();
    
    console.log('👥 Admin Portal Clients (Customer Records):');
    console.log(`   Total: ${adminClients.length}`);
    if (adminClients.length > 0) {
      adminClients.forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.firstName} ${c.lastName} - ${c.email || 'No email'}`);
      });
    }
    console.log('\n');
    
    // Check client portal users (login accounts)
    const clientUsers = await db.collection('clientusers').find({ 
      tenantId: tenant._id 
    }).toArray();
    
    console.log('🔐 Client Portal Users (Login Accounts):');
    console.log(`   Total: ${clientUsers.length}`);
    if (clientUsers.length > 0) {
      clientUsers.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.firstName} ${u.lastName} - ${u.email}`);
        console.log(`      Created: ${u.createdAt}`);
      });
    } else {
      console.log('   ⚠️  No client portal users registered yet');
      console.log('   💡 Users need to register through the client portal to create accounts');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkClientUsers();
