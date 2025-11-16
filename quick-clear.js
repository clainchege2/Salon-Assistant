const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function clearData() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('salon-assistant');
    
    const bookings = await db.collection('bookings').deleteMany({});
    console.log(`✅ Deleted ${bookings.deletedCount} bookings`);
    
    const clients = await db.collection('clients').deleteMany({});
    console.log(`✅ Deleted ${clients.deletedCount} clients`);
    
    const services = await db.collection('services').deleteMany({});
    console.log(`✅ Deleted ${services.deletedCount} services`);
    
    const stylists = await db.collection('users').deleteMany({ role: 'stylist' });
    console.log(`✅ Deleted ${stylists.deletedCount} stylists`);
    
    console.log('\n✅ Data cleared! Login accounts preserved.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

clearData();
