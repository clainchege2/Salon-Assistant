const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'hairvia';

const getDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

const getRandomTime = (day) => {
  const hours = 9 + Math.floor(Math.random() * 8); // 9 AM - 5 PM
  const date = new Date(day);
  date.setHours(hours, 0, 0, 0);
  return date;
};

async function seedTenant(db, tenant, tierName) {
  console.log(`\n📊 Seeding ${tierName} (${tenant.slug})...`);
  
  const staff = await db.collection('users').find({ tenantId: tenant._id }).toArray();
  const owner = staff.find(s => s.role === 'owner');
  const manager = staff.find(s => s.role === 'manager');
  const stylists = staff.filter(s => s.role === 'stylist');
  
  // Clear old data
  await db.collection('services').deleteMany({ tenantId: tenant._id });
  await db.collection('clients').deleteMany({ tenantId: tenant._id });
  await db.collection('bookings').deleteMany({ tenantId: tenant._id });
  await db.collection('communications').deleteMany({ tenantId: tenant._id });
  await db.collection('materialitems').deleteMany({ tenantId: tenant._id });
  
  // Services
  const serviceData = [
    { name: 'Box Braids', category: 'Braiding', price: 3500, duration: 180 },
    { name: 'Cornrows', category: 'Braiding', price: 2000, duration: 120 },
    { name: 'Knotless Braids', category: 'Braiding', price: 4500, duration: 240 },
    { name: 'Weave Install', category: 'Weaving', price: 4000, duration: 150 },
    { name: 'Closure Install', category: 'Weaving', price: 3000, duration: 120 },
    { name: 'Deep Conditioning', category: 'Treatment', price: 1500, duration: 60 },
    { name: 'Protein Treatment', category: 'Treatment', price: 2000, duration: 90 },
    { name: 'Blow Dry', category: 'Styling', price: 1000, duration: 45 },
    { name: 'Silk Press', category: 'Styling', price: 2500, duration: 90 },
    { name: 'Hair Coloring', category: 'Color', price: 5000, duration: 180 }
  ];
  
  const services = await db.collection('services').insertMany(
    serviceData.map(s => ({
      _id: new ObjectId(),
      tenantId: tenant._id,
      ...s,
      createdAt: getDate(-60)
    }))
  );
  const serviceIds = Object.values(services.insertedIds);
  
  // Clients with valid categories: new, vip, usual, longtime-no-see
  const clientData = [
    { firstName: 'Grace', lastName: 'Wanjiku', phone: '+254712001', email: 'grace@test.com', category: 'vip', visits: 8, spent: 28000 },
    { firstName: 'Mary', lastName: 'Akinyi', phone: '+254712002', email: 'mary@test.com', category: 'usual', visits: 6, spent: 18000 },
    { firstName: 'Jane', lastName: 'Muthoni', phone: '+254712003', category: 'usual', visits: 5, spent: 15000 },
    { firstName: 'Lucy', lastName: 'Wambui', phone: '+254712004', email: 'lucy@test.com', category: 'vip', visits: 7, spent: 24500 },
    { firstName: 'Faith', lastName: 'Njeri', phone: '+254712005', category: 'usual', visits: 4, spent: 12000 },
    { firstName: 'Rose', lastName: 'Achieng', phone: '+254712006', email: 'rose@test.com', category: 'new', visits: 2, spent: 5500 },
    { firstName: 'Sarah', lastName: 'Kamau', phone: '+254712007', category: 'new', visits: 1, spent: 3500 },
    { firstName: 'Ann', lastName: 'Mutua', phone: '+254712008', email: 'ann@test.com', category: 'usual', visits: 5, spent: 14000 }
  ];
  
  const clients = await db.collection('clients').insertMany(
    clientData.map(c => ({
      _id: new ObjectId(),
      tenantId: tenant._id,
      ...c,
      totalVisits: c.visits,
      totalSpent: c.spent,
      lastVisit: getDate(-Math.floor(Math.random() * 7)),
      createdAt: getDate(-90)
    }))
  );
  const clientIds = Object.values(clients.insertedIds);
  
  // Bookings - Past 2 weeks (completed)
  const bookings = [];
  for (let day = -14; day < 0; day++) {
    const bookingsPerDay = Math.floor(Math.random() * 3) + 2; // 2-4 bookings per day
    for (let i = 0; i < bookingsPerDay; i++) {
      const serviceIndex = Math.floor(Math.random() * serviceData.length);
      const service = serviceData[serviceIndex];
      const clientIndex = Math.floor(Math.random() * clientIds.length);
      const staffMember = stylists[Math.floor(Math.random() * stylists.length)] || owner;
      
      bookings.push({
        _id: new ObjectId(),
        tenantId: tenant._id,
        clientId: clientIds[clientIndex],
        assignedTo: staffMember._id,
        services: [{ 
          serviceId: serviceIds[serviceIndex], 
          serviceName: service.name, 
          price: service.price
        }],
        scheduledDate: getRandomTime(getDate(day)),
        totalPrice: service.price,
        status: 'completed',
        createdAt: getDate(day - 2)
      });
    }
  }
  
  // Bookings - Next 2 weeks (upcoming)
  for (let day = 1; day <= 14; day++) {
    const bookingsPerDay = Math.floor(Math.random() * 3) + 1; // 1-3 bookings per day
    for (let i = 0; i < bookingsPerDay; i++) {
      const serviceIndex = Math.floor(Math.random() * serviceData.length);
      const service = serviceData[serviceIndex];
      const clientIndex = Math.floor(Math.random() * clientIds.length);
      const staffMember = stylists[Math.floor(Math.random() * stylists.length)] || manager || owner;
      
      bookings.push({
        _id: new ObjectId(),
        tenantId: tenant._id,
        clientId: clientIds[clientIndex],
        assignedTo: staffMember._id,
        services: [{ 
          serviceId: serviceIds[serviceIndex], 
          serviceName: service.name, 
          price: service.price
        }],
        scheduledDate: getRandomTime(getDate(day)),
        totalPrice: service.price,
        status: 'confirmed',
        createdAt: getDate(-1)
      });
    }
  }
  
  await db.collection('bookings').insertMany(bookings);
  
  // Communications (Pro & Premium)
  if (tenant.subscriptionTier !== 'free') {
    const comms = [];
    for (let i = 0; i < 15; i++) {
      comms.push({
        _id: new ObjectId(),
        tenantId: tenant._id,
        clientId: clientIds[i % clientIds.length],
        type: ['confirmation', 'reminder', 'thank_you'][i % 3],
        channel: 'sms',
        message: 'Appointment message',
        status: 'sent',
        sentAt: getDate(-14 + i),
        createdAt: getDate(-14 + i)
      });
    }
    await db.collection('communications').insertMany(comms);
  }
  
  // Stock (Pro & Premium)
  if (tenant.subscriptionTier !== 'free') {
    await db.collection('materialitems').insertMany([
      { _id: new ObjectId(), tenantId: tenant._id, name: 'Braiding Hair - Black', category: 'Hair Extensions', quantity: 15, minQuantity: 10, price: 500, createdAt: new Date() },
      { _id: new ObjectId(), tenantId: tenant._id, name: 'Braiding Hair - Brown', category: 'Hair Extensions', quantity: 8, minQuantity: 10, price: 500, createdAt: new Date() },
      { _id: new ObjectId(), tenantId: tenant._id, name: 'Deep Conditioner', category: 'Hair Care', quantity: 5, minQuantity: 10, price: 800, createdAt: new Date() },
      { _id: new ObjectId(), tenantId: tenant._id, name: 'Hair Gel', category: 'Styling Products', quantity: 20, minQuantity: 8, price: 300, createdAt: new Date() },
      { _id: new ObjectId(), tenantId: tenant._id, name: 'Hair Oil', category: 'Hair Care', quantity: 12, minQuantity: 8, price: 600, createdAt: new Date() }
    ]);
  }
  
  // Calculate RFM scores for clients
  const completedBookings = bookings.filter(b => b.status === 'completed');
  for (const clientId of clientIds) {
    const clientBookings = completedBookings.filter(b => b.clientId.equals(clientId));
    if (clientBookings.length > 0) {
      const recency = Math.floor((new Date() - new Date(clientBookings[clientBookings.length - 1].scheduledDate)) / (1000 * 60 * 60 * 24));
      const frequency = clientBookings.length;
      const monetary = clientBookings.reduce((sum, b) => sum + b.totalPrice, 0);
      
      // Simple RFM scoring
      let rfmSegment = 'new_customers';
      if (frequency >= 5 && monetary >= 15000 && recency <= 30) rfmSegment = 'champions';
      else if (frequency >= 4 && monetary >= 12000 && recency <= 60) rfmSegment = 'loyal';
      else if (frequency >= 3 && recency <= 45) rfmSegment = 'potential_loyalist';
      else if (frequency <= 2 && recency <= 30) rfmSegment = 'new_customers';
      else if (frequency >= 3 && recency > 60 && recency <= 120) rfmSegment = 'at_risk';
      else if (frequency >= 4 && monetary >= 15000 && recency > 120) rfmSegment = 'cant_lose_them';
      
      await db.collection('clients').updateOne(
        { _id: clientId },
        { $set: { rfmSegment, rfmRecency: recency, rfmFrequency: frequency, rfmMonetary: monetary } }
      );
    }
  }
  
  const completed = bookings.filter(b => b.status === 'completed').length;
  const upcoming = bookings.filter(b => b.status === 'confirmed').length;
  console.log(`   ✅ ${tierName}: 10 services, ${clientIds.length} clients, ${bookings.length} bookings (${completed} past, ${upcoming} future)`);
}

async function seedMonth() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    const tenants = await db.collection('tenants').find({}).toArray();
    
    if (tenants.length === 0) {
      console.log('❌ Run seed-accounts.js first');
      process.exit(1);
    }
    
    for (const tenant of tenants) {
      await seedTenant(db, tenant, tenant.subscriptionTier.toUpperCase());
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ MONTH DATA SEEDED - Full analytics ready!');
    console.log('='.repeat(70));
    console.log('\n📊 Data includes:');
    console.log('   • 10 services per tier');
    console.log('   • 8 clients with varied visit patterns');
    console.log('   • ~70 bookings per tier (past 2 weeks + next 2 weeks)');
    console.log('   • 15 communications (Pro/Premium)');
    console.log('   • 5 stock items with low stock alerts (Pro/Premium)');
    console.log('   • All bookings assigned to staff');
    console.log('   • Revenue trends & analytics ready');
    console.log('\n💡 Logins:');
    console.log('   FREE:    owner@basicbeauty.com / Password123!');
    console.log('   PRO:     owner@elitestyles.com / Password123!');
    console.log('   PREMIUM: owner@luxuryhair.com / Password123!');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedMonth();
