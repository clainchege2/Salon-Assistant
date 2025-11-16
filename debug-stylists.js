const { MongoClient, ObjectId } = require('mongodb');

async function debug() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  
  const db = client.db('hairvia');
  const premium = await db.collection('tenants').findOne({ slug: 'luxury-hair-demo' });
  
  // Get date range for last 3 months
  const now = new Date();
  const startDate = new Date(now.setMonth(now.getMonth() - 3));
  const endDate = new Date();
  
  console.log('\n📅 Date Range:');
  console.log(`   Start: ${startDate.toISOString().split('T')[0]}`);
  console.log(`   End: ${endDate.toISOString().split('T')[0]}`);
  
  // Get bookings in range
  const bookings = await db.collection('bookings').find({
    tenantId: premium._id,
    scheduledDate: { $gte: startDate, $lte: endDate },
    status: { $in: ['confirmed', 'completed'] }
  }).toArray();
  
  console.log(`\n📊 Found ${bookings.length} bookings in date range`);
  
  if (bookings.length > 0) {
    console.log('\nSample booking:');
    const sample = bookings[0];
    console.log(`   ID: ${sample._id}`);
    console.log(`   Date: ${sample.scheduledDate}`);
    console.log(`   Status: ${sample.status}`);
    console.log(`   StylistId: ${sample.stylistId}`);
    console.log(`   TotalPrice: ${sample.totalPrice}`);
    console.log(`   TotalDuration: ${sample.totalDuration}`);
  }
  
  // Get users
  const users = await db.collection('users').find({
    tenantId: premium._id,
    role: { $in: ['stylist', 'owner', 'manager'] }
  }).toArray();
  
  console.log(`\n👥 Found ${users.length} staff members`);
  users.forEach(u => {
    const userBookings = bookings.filter(b => 
      b.stylistId && b.stylistId.toString() === u._id.toString()
    );
    console.log(`   ${u.firstName} ${u.lastName}: ${userBookings.length} bookings`);
  });
  
  await client.close();
}

debug();
