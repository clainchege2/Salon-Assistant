const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'hairvia';

// Helper to get dates relative to today
const getDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

async function seed() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    await db.dropDatabase();
    console.log('✅ Database cleared');
    
    const timestamp = Date.now();
    
    // ============================================================================
    // FREE TIER - Basic Beauty Salon
    // ============================================================================
    const freeTenantId = new ObjectId();
    await db.collection('tenants').insertOne({
      _id: freeTenantId,
      businessName: 'Basic Beauty Salon',
      slug: `basic-beauty-${timestamp}`,
      contactEmail: 'owner@basicbeauty.com',
      contactPhone: '+254712000001',
      address: '123 Kimathi Street, Nairobi',
      country: 'Kenya',
      status: 'active',
      subscriptionTier: 'free',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await db.collection('users').insertOne({
      _id: new ObjectId(),
      tenantId: freeTenantId,
      email: 'owner@basicbeauty.com',
      password: await bcrypt.hash('Password123!', 10),
      firstName: 'Sarah',
      lastName: 'Kamau',
      phone: '+254712000001',
      role: 'owner',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // ============================================================================
    // PRO TIER - Elite Styles Pro
    // ============================================================================
    const proTenantId = new ObjectId();
    await db.collection('tenants').insertOne({
      _id: proTenantId,
      businessName: 'Elite Styles Pro',
      slug: `elite-styles-${timestamp}`,
      contactEmail: 'owner@elitestyles.com',
      contactPhone: '+254712000002',
      address: '456 Moi Avenue, Nairobi',
      country: 'Kenya',
      status: 'active',
      subscriptionTier: 'pro',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await db.collection('users').insertMany([
      {
        _id: new ObjectId(),
        tenantId: proTenantId,
        email: 'owner@elitestyles.com',
        password: await bcrypt.hash('Password123!', 10),
        firstName: 'James',
        lastName: 'Mwangi',
        phone: '+254712000002',
        role: 'owner',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new ObjectId(),
        tenantId: proTenantId,
        email: 'stylist@elitestyles.com',
        password: await bcrypt.hash('Password123!', 10),
        firstName: 'Lucy',
        lastName: 'Wanjiru',
        phone: '+254712000012',
        role: 'stylist',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    // ============================================================================
    // PREMIUM TIER - Luxury Hair Lounge
    // ============================================================================
    const premiumTenantId = new ObjectId();
    await db.collection('tenants').insertOne({
      _id: premiumTenantId,
      businessName: 'Luxury Hair Lounge',
      slug: `luxury-hair-${timestamp}`,
      contactEmail: 'owner@luxuryhair.com',
      contactPhone: '+254712000003',
      address: '789 Westlands Road, Nairobi',
      country: 'Kenya',
      status: 'active',
      subscriptionTier: 'premium',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const premiumOwnerId = new ObjectId();
    const premiumStylist1Id = new ObjectId();
    const premiumManagerId = new ObjectId();
    
    await db.collection('users').insertMany([
      {
        _id: premiumOwnerId,
        tenantId: premiumTenantId,
        email: 'owner@luxuryhair.com',
        password: await bcrypt.hash('Password123!', 10),
        firstName: 'Diana',
        lastName: 'Njeri',
        phone: '+254712000003',
        role: 'owner',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: premiumStylist1Id,
        tenantId: premiumTenantId,
        email: 'stylist@luxuryhair.com',
        password: await bcrypt.hash('Password123!', 10),
        firstName: 'Faith',
        lastName: 'Achieng',
        phone: '+254712000013',
        role: 'stylist',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: premiumManagerId,
        tenantId: premiumTenantId,
        email: 'manager@luxuryhair.com',
        password: await bcrypt.hash('Password123!', 10),
        firstName: 'Rose',
        lastName: 'Mutua',
        phone: '+254712000023',
        role: 'manager',
        status: 'active',
        permissions: {
          canViewCommunications: true,
          canDeleteBookings: true,
          canDeleteClients: false,
          canManageStaff: true,
          canManageServices: true,
          canViewReports: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    
    // ============================================================================
    // SERVICES for Premium Tier
    // ============================================================================
    const services = [
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        name: 'Braids',
        description: 'Professional braiding service',
        duration: 180,
        price: 2500,
        category: 'Braiding',
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        name: 'Weave Installation',
        description: 'Full weave installation',
        duration: 120,
        price: 3500,
        category: 'Weaving',
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        name: 'Hair Treatment',
        description: 'Deep conditioning treatment',
        duration: 60,
        price: 1500,
        category: 'Treatment',
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        name: 'Blow Dry & Style',
        description: 'Professional blow dry and styling',
        duration: 45,
        price: 1000,
        category: 'Styling',
        isActive: true,
        createdAt: new Date()
      }
    ];
    
    await db.collection('services').insertMany(services);
    
    // ============================================================================
    // CLIENTS for Premium Tier
    // ============================================================================
    const clients = [
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        firstName: 'Grace',
        lastName: 'Wambui',
        email: 'grace.wambui@email.com',
        phone: '+254722111001',
        category: 'vip',
        totalVisits: 15,
        totalSpent: 45000,
        lastVisit: getDate(-5),
        firstVisit: getDate(-180),
        dateOfBirth: new Date('1990-03-15'),
        gender: 'female',
        marketingConsent: { sms: true, email: true, whatsapp: true },
        createdBy: premiumOwnerId,
        createdAt: getDate(-180)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        firstName: 'Mary',
        lastName: 'Njoki',
        email: 'mary.njoki@email.com',
        phone: '+254722111002',
        category: 'usual',
        totalVisits: 8,
        totalSpent: 20000,
        lastVisit: getDate(-10),
        firstVisit: getDate(-120),
        dateOfBirth: new Date('1985-07-22'),
        gender: 'female',
        marketingConsent: { sms: true, email: false, whatsapp: true },
        createdBy: premiumOwnerId,
        createdAt: getDate(-120)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        firstName: 'Jane',
        lastName: 'Akinyi',
        email: 'jane.akinyi@email.com',
        phone: '+254722111003',
        category: 'new',
        totalVisits: 2,
        totalSpent: 5000,
        lastVisit: getDate(-3),
        firstVisit: getDate(-15),
        dateOfBirth: new Date('1995-11-08'),
        gender: 'female',
        marketingConsent: { sms: true, email: true, whatsapp: false },
        createdBy: premiumStylist1Id,
        createdAt: getDate(-15)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        firstName: 'Ann',
        lastName: 'Muthoni',
        email: 'ann.muthoni@email.com',
        phone: '+254722111004',
        category: 'longtime-no-see',
        totalVisits: 5,
        totalSpent: 12000,
        lastVisit: getDate(-120),
        firstVisit: getDate(-300),
        dateOfBirth: new Date('1988-05-30'),
        gender: 'female',
        marketingConsent: { sms: false, email: true, whatsapp: false },
        createdBy: premiumOwnerId,
        createdAt: getDate(-300)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        firstName: 'Betty',
        lastName: 'Wanjiku',
        email: 'betty.wanjiku@email.com',
        phone: '+254722111005',
        category: 'usual',
        totalVisits: 6,
        totalSpent: 15000,
        lastVisit: getDate(-7),
        firstVisit: getDate(-90),
        dateOfBirth: new Date('1992-09-12'),
        gender: 'female',
        marketingConsent: { sms: true, email: true, whatsapp: true },
        createdBy: premiumManagerId,
        createdAt: getDate(-90)
      }
    ];
    
    await db.collection('clients').insertMany(clients);
    
    // ============================================================================
    // BOOKINGS for Premium Tier
    // ============================================================================
    const bookings = [
      // Past bookings
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        clientId: clients[0]._id,
        serviceId: services[0]._id,
        stylistId: premiumStylist1Id,
        date: getDate(-5),
        startTime: '10:00',
        endTime: '13:00',
        status: 'completed',
        price: 2500,
        notes: 'Regular client, prefers box braids',
        createdBy: premiumOwnerId,
        createdAt: getDate(-10)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        clientId: clients[1]._id,
        serviceId: services[1]._id,
        stylistId: premiumStylist1Id,
        date: getDate(-10),
        startTime: '14:00',
        endTime: '16:00',
        status: 'completed',
        price: 3500,
        createdBy: premiumManagerId,
        createdAt: getDate(-15)
      },
      // Upcoming bookings
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        clientId: clients[2]._id,
        serviceId: services[2]._id,
        stylistId: premiumStylist1Id,
        date: getDate(2),
        startTime: '11:00',
        endTime: '12:00',
        status: 'confirmed',
        price: 1500,
        notes: 'First time treatment',
        createdBy: premiumStylist1Id,
        createdAt: getDate(-1)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        clientId: clients[4]._id,
        serviceId: services[3]._id,
        stylistId: premiumManagerId,
        date: getDate(5),
        startTime: '15:00',
        endTime: '15:45',
        status: 'confirmed',
        price: 1000,
        createdBy: premiumManagerId,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenantId,
        clientId: clients[0]._id,
        serviceId: services[0]._id,
        stylistId: premiumStylist1Id,
        date: getDate(10),
        startTime: '10:00',
        endTime: '13:00',
        status: 'pending',
        price: 2500,
        notes: 'VIP client - priority booking',
        createdBy: premiumOwnerId,
        createdAt: new Date()
      }
    ];
    
    await db.collection('bookings').insertMany(bookings);
    
    // ============================================================================
    // CALCULATE RFM SCORES
    // ============================================================================
    console.log('\n🧮 Calculating RFM scores...');
    
    // Import RFM service functions
    const calculateClientRFM = async (client, allClients) => {
      const now = new Date();
      
      const daysSinceLastVisit = client.lastVisit 
        ? Math.floor((now - client.lastVisit) / (1000 * 60 * 60 * 24))
        : 999;
      
      const daysSinceFirst = client.firstVisit
        ? Math.floor((now - client.firstVisit) / (1000 * 60 * 60 * 24))
        : 1;
      const monthsSinceFirst = Math.max(daysSinceFirst / 30, 1);
      const visitFrequency = client.totalVisits / monthsSinceFirst;
      const averageSpend = client.totalVisits > 0 ? client.totalSpent / client.totalVisits : 0;
      
      // Calculate percentile scores
      const calculateScore = (value, values, lowerIsBetter = false) => {
        const sorted = values.filter(v => v != null).sort((a, b) => a - b);
        if (sorted.length === 0) return 3;
        const percentile = sorted.filter(v => v <= value).length / sorted.length;
        
        if (lowerIsBetter) {
          if (percentile <= 0.2) return 5;
          if (percentile <= 0.4) return 4;
          if (percentile <= 0.6) return 3;
          if (percentile <= 0.8) return 2;
          return 1;
        } else {
          if (percentile >= 0.8) return 5;
          if (percentile >= 0.6) return 4;
          if (percentile >= 0.4) return 3;
          if (percentile >= 0.2) return 2;
          return 1;
        }
      };
      
      const recencyScore = calculateScore(
        daysSinceLastVisit,
        allClients.map(c => c.lastVisit ? Math.floor((now - c.lastVisit) / (1000 * 60 * 60 * 24)) : 999),
        true
      );
      
      const frequencyScore = calculateScore(
        client.totalVisits,
        allClients.map(c => c.totalVisits)
      );
      
      const monetaryScore = calculateScore(
        client.totalSpent,
        allClients.map(c => c.totalSpent)
      );
      
      // Determine segment
      const r = recencyScore, f = frequencyScore, m = monetaryScore;
      let segment;
      
      if (r >= 4 && f >= 4 && m >= 4) segment = 'champions';
      else if (r >= 3 && f >= 4 && m >= 3) segment = 'loyal';
      else if (r <= 2 && f >= 4 && m >= 4) segment = 'cantLoseThem';
      else if (r <= 2 && f >= 3 && m >= 3) segment = 'atRisk';
      else if (r >= 4 && f >= 2 && f <= 3) segment = 'potentialLoyalist';
      else if (r >= 4 && f <= 2 && m <= 3) segment = 'newCustomers';
      else if (r >= 3 && f <= 2 && m <= 2) segment = 'promising';
      else if (r >= 2 && r <= 3 && f >= 2 && f <= 3) segment = 'needAttention';
      else if (r >= 2 && r <= 3 && f <= 2) segment = 'aboutToSleep';
      else if (r <= 2 && f >= 2 && f <= 3) segment = 'hibernating';
      else segment = 'lost';
      
      return {
        rfmScores: {
          recency: recencyScore,
          frequency: frequencyScore,
          monetary: monetaryScore,
          combined: recencyScore + frequencyScore + monetaryScore,
          segment,
          lastCalculated: now
        },
        metrics: {
          daysSinceLastVisit,
          visitFrequency: Math.round(visitFrequency * 10) / 10,
          averageSpend: Math.round(averageSpend)
        }
      };
    };
    
    // Calculate RFM for all premium clients
    for (const client of clients) {
      const rfmData = await calculateClientRFM(client, clients);
      await db.collection('clients').updateOne(
        { _id: client._id },
        { $set: rfmData }
      );
    }
    
    console.log('✅ RFM scores calculated for all clients');
    
    // ============================================================================
    // PRINT CREDENTIALS
    // ============================================================================
    const freeSlug = `basic-beauty-${timestamp}`;
    const proSlug = `elite-styles-${timestamp}`;
    const premiumSlug = `luxury-hair-${timestamp}`;
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log('\n🔐 All passwords: Password123!');
    console.log('\n📱 Login URL: http://localhost:3000');
    console.log('\n' + '='.repeat(80));
    
    console.log('\n🆓 FREE TIER - Basic Beauty Salon');
    console.log('─'.repeat(80));
    console.log(`   Tenant Slug: ${freeSlug}`);
    console.log('   Owner:       owner@basicbeauty.com / Password123!');
    console.log('   Features:    Bookings, Clients, Services only');
    
    console.log('\n⭐ PRO TIER - Elite Styles Pro');
    console.log('─'.repeat(80));
    console.log(`   Tenant Slug: ${proSlug}`);
    console.log('   Owner:       owner@elitestyles.com / Password123!');
    console.log('   Stylist:     stylist@elitestyles.com / Password123!');
    console.log('   Features:    + Staff, Stock, Communications');
    
    console.log('\n💎 PREMIUM TIER - Luxury Hair Lounge (FULLY POPULATED)');
    console.log('─'.repeat(80));
    console.log(`   Tenant Slug: ${premiumSlug}`);
    console.log('   Owner:       owner@luxuryhair.com / Password123!');
    console.log('   Manager:     manager@luxuryhair.com / Password123!');
    console.log('   Stylist:     stylist@luxuryhair.com / Password123!');
    console.log('   Features:    + Marketing, Reports, Analytics, AI');
    console.log('   Data:        5 clients, 4 services, 5 bookings');
    
    console.log('\n' + '='.repeat(80));
    console.log('💡 TIP: Use Premium tier to test all features!');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seed();
