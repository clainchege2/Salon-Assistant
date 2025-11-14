const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'hairvia';

const getDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

async function seedTenant(db, tenant, tierName) {
  console.log(`📊 Seeding ${tierName} (${tenant.slug})...`);
  
  const staff = await db.collection('users').find({ tenantId: tenant._id }).toArray();
  const owner = staff.find(s => s.role === 'owner');
  const manager = staff.find(s => s.role === 'manager');
  const stylists = staff.filter(s => s.role === 'stylist');
  
  await db.collection('services').deleteMany({ tenantId: tenant._id });
  await db.collection('clients').deleteMany({ tenantId: tenant._id });
  await db.collection('bookings').deleteMany({ tenantId: tenant._id });
  await db.collection('communications').deleteMany({ tenantId: tenant._id });
  await db.collection('materialitems').deleteMany({ tenantId: tenant._id });
  
  const services = await db.collection('services').insertMany([
    { _id: new ObjectId(), tenantId: tenant._id, name: 'Box Braids', category: 'Braiding', price: 3500, duration: 180, createdAt: new Date() },
    { _id: new ObjectId(), tenantId: tenant._id, name: 'Cornrows', category: 'Braiding', price: 2000, duration: 120, createdAt: new Date() },
    { _id: new ObjectId(), tenantId: tenant._id, name: 'Weave Install', category: 'Weaving', price: 4000, duration: 150, createdAt: new Date() },
    { _id: new ObjectId(), tenantId: tenant._id, name: 'Deep Conditioning', category: 'Treatment', price: 1500, duration: 60, createdAt: new Date() },
    { _id: new ObjectId(), tenantId: tenant._id, name: 'Blow Dry', category: 'Styling', price: 1000, duration: 45, createdAt: new Date() }
  ]);
  const serviceIds = Object.values(services.insertedIds);
  
  const clients = await db.collection('clients').insertMany([
    { _id: new ObjectId(), tenantId: tenant._id, firstName: 'Grace', lastName: 'Wanjiku', phone: '+254712345001', email: 'grace@test.com', category: 'vip', totalVisits: 12, totalSpent: 45000, lastVisit: getDate(-2), createdAt: getDate(-180) },
    { _id: new ObjectId(), tenantId: tenant._id, firstName: 'Mary', lastName: 'Akinyi', phone: '+254712345002', email: 'mary@test.com', category: 'regular', totalVisits: 8, totalSpent: 28000, lastVisit: getDate(-5), createdAt: getDate(-120) },
    { _id: new ObjectId(), tenantId: tenant._id, firstName: 'Jane', lastName: 'Muthoni', phone: '+254712345003', category: 'new', totalVisits: 2, totalSpent: 5500, lastVisit: getDate(-1), createdAt: getDate(-30) }
  ]);
  const clientIds = Object.values(clients.insertedIds);
  
  const bookings = [];
  
  // Past week - completed bookings
  for (let i = 0; i < 7; i++) {
    bookings.push({
      _id: new ObjectId(),
      tenantId: tenant._id,
      clientId: clientIds[i % 3],
      assignedTo: stylists[i % stylists.length]?._id || owner._id,
      services: [{ serviceId: serviceIds[i % 5], serviceName: 'Service', price: 2500 }],
      scheduledDate: getDate(-7 + i),
      totalPrice: 2500,
      status: 'completed',
      createdAt: getDate(-10)
    });
  }
  
  // Next week - upcoming bookings
  for (let i = 0; i < 7; i++) {
    bookings.push({
      _id: new ObjectId(),
      tenantId: tenant._id,
      clientId: clientIds[i % 3],
      assignedTo: stylists[i % stylists.length]?._id || manager?._id || owner._id,
      services: [{ serviceId: serviceIds[i % 5], serviceName: 'Service', price: 3000 }],
      scheduledDate: getDate(i + 1),
      totalPrice: 3000,
      status: 'confirmed',
      createdAt: getDate(-2)
    });
  }
  await db.collection('bookings').insertMany(bookings);
  
  if (tenant.subscriptionTier !== 'free') {
    await db.collection('communications').insertMany([
      { _id: new ObjectId(), tenantId: tenant._id, clientId: clientIds[0], type: 'confirmation', channel: 'sms', message: 'Appointment confirmed', status: 'sent', sentAt: getDate(-1), createdAt: getDate(-1) },
      { _id: new ObjectId(), tenantId: tenant._id, clientId: clientIds[1], type: 'reminder', channel: 'sms', message: 'Appointment reminder', status: 'sent', sentAt: getDate(0), createdAt: getDate(0) }
    ]);
    
    await db.collection('materialitems').insertMany([
      { _id: new ObjectId(), tenantId: tenant._id, name: 'Braiding Hair', category: 'Hair Extensions', quantity: 15, minQuantity: 10, price: 500, createdAt: new Date() },
      { _id: new ObjectId(), tenantId: tenant._id, name: 'Deep Conditioner', category: 'Hair Care', quantity: 5, minQuantity: 10, price: 800, createdAt: new Date() }
    ]);
  }
  
  console.log(`   ✅ ${tierName}: 5 services, 3 clients, 14 bookings (7 past, 7 upcoming)`);
}

async function seedAll() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
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
    console.log('✅ ALL TIERS SEEDED - Past week + Next week data');
    console.log('='.repeat(70));
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

seedAll();
