const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function listTenants() {
  try {
    await client.connect();
    const db = client.db('salon-assistant');
    
    const tenants = await db.collection('tenants').find({}).toArray();
    
    console.log(`\n📍 Found ${tenants.length} tenant(s):\n`);
    
    tenants.forEach((t, i) => {
      console.log(`${i + 1}. ${t.businessName}`);
      console.log(`   Slug: ${t.slug}`);
      console.log(`   ID: ${t._id}`);
      console.log(`   Status: ${t.status}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

listTenants();
