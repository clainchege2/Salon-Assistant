const { MongoClient } = require('mongodb');

async function verify() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  
  const db = client.db('hairvia');
  const premium = await db.collection('tenants').findOne({ slug: 'luxury-hair-demo' });
  
  console.log('\n👥 Premium Tier Staff:');
  const users = await db.collection('users').find({ tenantId: premium._id }).toArray();
  users.forEach(u => {
    console.log(`   ${u.firstName} ${u.lastName} (${u.role}) - ID: ${u._id}`);
  });
  
  console.log('\n📅 Sample Bookings:');
  const bookings = await db.collection('bookings')
    .find({ tenantId: premium._id })
    .limit(10)
    .toArray();
  
  bookings.forEach(b => {
    console.log(`   Booking ${b._id.toString().slice(-6)} - stylistId: ${b.stylistId ? b.stylistId.toString().slice(-6) : 'NONE'}`);
  });
  
  console.log('\n📊 Bookings by Stylist:');
  const stylistCounts = {};
  const allBookings = await db.collection('bookings').find({ tenantId: premium._id }).toArray();
  
  allBookings.forEach(b => {
    const id = b.stylistId ? b.stylistId.toString() : 'none';
    stylistCounts[id] = (stylistCounts[id] || 0) + 1;
  });
  
  Object.entries(stylistCounts).forEach(([id, count]) => {
    const stylist = users.find(u => u._id.toString() === id);
    const name = stylist ? `${stylist.firstName} ${stylist.lastName}` : 'Unassigned';
    console.log(`   ${name}: ${count} bookings`);
  });
  
  await client.close();
}

verify();
