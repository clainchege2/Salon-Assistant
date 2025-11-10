const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'hairvia';

/**
 * SEED ACCOUNTS - Creates stable tenant accounts and users
 * Run this ONCE to set up test accounts with fixed slugs
 * Login credentials will remain constant across data reseeds
 */

async function seedAccounts() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Drop database to start fresh
    await db.dropDatabase();
    console.log('✅ Database cleared');
    
    console.log('🏗️  Creating tenant accounts...\n');
    
    // ============================================================================
    // FREE TIER - Basic Beauty Salon
    // ============================================================================
    const freeTenantId = new ObjectId();
    await db.collection('tenants').insertOne({
      _id: freeTenantId,
      businessName: 'Basic Beauty Salon',
      slug: 'basic-beauty-demo',
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
    
    console.log('✅ FREE tier account created');
    
    // ============================================================================
    // PRO TIER - Elite Styles Pro
    // ============================================================================
    const proTenantId = new ObjectId();
    await db.collection('tenants').insertOne({
      _id: proTenantId,
      businessName: 'Elite Styles Pro',
      slug: 'elite-styles-demo',
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
    
    console.log('✅ PRO tier account created');
    
    // ============================================================================
    // PREMIUM TIER - Luxury Hair Lounge
    // ============================================================================
    const premiumTenantId = new ObjectId();
    await db.collection('tenants').insertOne({
      _id: premiumTenantId,
      businessName: 'Luxury Hair Lounge',
      slug: 'luxury-hair-demo',
      contactEmail: 'owner@luxuryhair.com',
      contactPhone: '+254712000003',
      address: '789 Westlands Road, Nairobi',
      country: 'Kenya',
      status: 'active',
      subscriptionTier: 'premium',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await db.collection('users').insertMany([
      {
        _id: new ObjectId(),
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
        _id: new ObjectId(),
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
        _id: new ObjectId(),
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
    
    console.log('✅ PREMIUM tier account created');
    
    // ============================================================================
    // PRINT CREDENTIALS
    // ============================================================================
    console.log('\n' + '='.repeat(80));
    console.log('✅ ACCOUNTS CREATED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log('\n🔐 All passwords: Password123!');
    console.log('📱 Login URL: http://localhost:3000');
    console.log('\n' + '='.repeat(80));
    
    console.log('\n🆓 FREE TIER - Basic Beauty Salon');
    console.log('─'.repeat(80));
    console.log('   Tenant Slug: basic-beauty-demo');
    console.log('   Owner:       owner@basicbeauty.com / Password123!');
    console.log('   Features:    Bookings, Clients, Services only');
    
    console.log('\n⭐ PRO TIER - Elite Styles Pro');
    console.log('─'.repeat(80));
    console.log('   Tenant Slug: elite-styles-demo');
    console.log('   Owner:       owner@elitestyles.com / Password123!');
    console.log('   Stylist:     stylist@elitestyles.com / Password123!');
    console.log('   Features:    + Staff, Stock, Communications');
    
    console.log('\n💎 PREMIUM TIER - Luxury Hair Lounge');
    console.log('─'.repeat(80));
    console.log('   Tenant Slug: luxury-hair-demo');
    console.log('   Owner:       owner@luxuryhair.com / Password123!');
    console.log('   Manager:     manager@luxuryhair.com / Password123!');
    console.log('   Stylist:     stylist@luxuryhair.com / Password123!');
    console.log('   Features:    + Marketing, Reports, Analytics, AI');
    
    console.log('\n' + '='.repeat(80));
    console.log('📝 NEXT STEP: Run "node seed-data.js" to populate test data');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedAccounts();
