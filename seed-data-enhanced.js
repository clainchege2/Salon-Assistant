const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'hairvia';

/**
 * ENHANCED SEED DATA - Comprehensive test data with communications
 * Includes: Services, Clients, Bookings (with staff assignments), 
 * Stock items, Communications, and Marketing campaigns
 */

const getDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

const getDateTime = (daysOffset, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, 0, 0, 0);
  return date;
};

async function seedEnhancedData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Find premium tenant
    const premiumTenant = await db.collection('tenants').findOne({ slug: 'luxury-hair-demo' });
    
    if (!premiumTenant) {
      console.log('\n❌ Premium tenant not found!');
      console.log('   Please run "node seed-accounts.js" first');
      await client.close();
      process.exit(1);
    }
    
    console.log('🗑️  Clearing existing data...');
    
    // Clear data but keep accounts
    await db.collection('services').deleteMany({ tenantId: premiumTenant._id });
    await db.collection('clients').deleteMany({ tenantId: premiumTenant._id });
    await db.collection('bookings').deleteMany({ tenantId: premiumTenant._id });
    await db.collection('materialitems').deleteMany({ tenantId: premiumTenant._id });
    await db.collection('communications').deleteMany({ tenantId: premiumTenant._id });
    await db.collection('campaigns').deleteMany({ tenantId: premiumTenant._id });
    
    console.log('✅ Old data cleared\n');
    
    // Get staff members
    const staff = await db.collection('users').find({ 
      tenantId: premiumTenant._id 
    }).toArray();
    
    const owner = staff.find(s => s.role === 'owner');
    const manager = staff.find(s => s.role === 'manager');
    const stylists = staff.filter(s => s.role === 'stylist');
    
    console.log(`👥 Found ${staff.length} staff members (${stylists.length} stylists)\n`);
    
    // ============================================================================
    // 1. SERVICES
    // ============================================================================
    console.log('✂️  Creating services...');
    
    const services = [
      // Braiding
      { name: 'Box Braids', category: 'Braiding', price: 3500, duration: 180, description: 'Classic box braids, protective style' },
      { name: 'Cornrows', category: 'Braiding', price: 2000, duration: 120, description: 'Traditional cornrow braiding' },
      { name: 'Knotless Braids', category: 'Braiding', price: 4500, duration: 240, description: 'Gentle knotless braiding technique' },
      { name: 'Ghana Braids', category: 'Braiding', price: 3000, duration: 150, description: 'Feed-in Ghana braids' },
      
      // Weaving
      { name: 'Weave Installation', category: 'Weaving', price: 4000, duration: 180, description: 'Full weave installation with closure' },
      { name: 'Closure Installation', category: 'Weaving', price: 2500, duration: 120, description: 'Lace closure installation' },
      { name: 'Frontal Installation', category: 'Weaving', price: 3500, duration: 150, description: 'Lace frontal installation' },
      
      // Treatment
      { name: 'Deep Conditioning', category: 'Treatment', price: 1500, duration: 60, description: 'Intensive moisture treatment' },
      { name: 'Protein Treatment', category: 'Treatment', price: 2000, duration: 75, description: 'Strengthening protein treatment' },
      { name: 'Hot Oil Treatment', category: 'Treatment', price: 1200, duration: 45, description: 'Nourishing hot oil therapy' },
      
      // Styling
      { name: 'Blow Dry & Style', category: 'Styling', price: 1500, duration: 60, description: 'Professional blow dry and styling' },
      { name: 'Silk Press', category: 'Styling', price: 3000, duration: 120, description: 'Smooth silk press finish' },
      { name: 'Updo Styling', category: 'Styling', price: 2500, duration: 90, description: 'Elegant updo for special occasions' },
      
      // Locs
      { name: 'Loc Retwist', category: 'Locs', price: 2000, duration: 90, description: 'Maintenance retwist for locs' },
      { name: 'Loc Installation', category: 'Locs', price: 5000, duration: 300, description: 'New loc installation' },
      
      // Color
      { name: 'Hair Coloring', category: 'Color', price: 4000, duration: 150, description: 'Full hair coloring service' },
      { name: 'Highlights', category: 'Color', price: 3500, duration: 120, description: 'Partial highlights' }
    ];
    
    const serviceIds = [];
    for (const service of services) {
      const result = await db.collection('services').insertOne({
        ...service,
        tenantId: premiumTenant._id,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      serviceIds.push({ ...service, _id: result.insertedId });
    }
    
    console.log(`✅ Created ${services.length} services\n`);
    
    // ============================================================================
    // 2. CLIENTS
    // ============================================================================
    console.log('👥 Creating clients...');
    
    const clientsData = [
      { firstName: 'Amara', lastName: 'Okonkwo', phone: '+254712345001', email: 'amara@email.com', category: 'vip', dateOfBirth: '1990-03-15' },
      { firstName: 'Zuri', lastName: 'Mwangi', phone: '+254712345002', email: 'zuri@email.com', category: 'regular', dateOfBirth: '1995-07-22' },
      { firstName: 'Nia', lastName: 'Kamau', phone: '+254712345003', email: 'nia@email.com', category: 'new', dateOfBirth: '1998-11-08' },
      { firstName: 'Imani', lastName: 'Ochieng', phone: '+254712345004', email: 'imani@email.com', category: 'regular', dateOfBirth: '1992-05-30' },
      { firstName: 'Aaliyah', lastName: 'Wanjiru', phone: '+254712345005', email: 'aaliyah@email.com', category: 'vip', dateOfBirth: '1988-09-12' },
      { firstName: 'Makena', lastName: 'Njeri', phone: '+254712345006', email: 'makena@email.com', category: 'regular', dateOfBirth: '1994-02-18' },
      { firstName: 'Sanaa', lastName: 'Achieng', phone: '+254712345007', email: 'sanaa@email.com', category: 'new', dateOfBirth: '1999-06-25' },
      { firstName: 'Zara', lastName: 'Mutua', phone: '+254712345008', email: 'zara@email.com', category: 'regular', dateOfBirth: '1991-12-03' },
      { firstName: 'Amina', lastName: 'Otieno', phone: '+254712345009', email: 'amina@email.com', category: 'vip', dateOfBirth: '1987-04-20' },
      { firstName: 'Khadija', lastName: 'Kimani', phone: '+254712345010', email: 'khadija@email.com', category: 'regular', dateOfBirth: '1996-08-14' },
      { firstName: 'Fatima', lastName: 'Wambui', phone: '+254712345011', email: 'fatima@email.com', category: 'new', dateOfBirth: '2000-01-09' },
      { firstName: 'Halima', lastName: 'Chebet', phone: '+254712345012', email: 'halima@email.com', category: 'regular', dateOfBirth: '1993-10-27' },
      { firstName: 'Mariam', lastName: 'Jepkoech', phone: '+254712345013', email: 'mariam@email.com', category: 'vip', dateOfBirth: '1989-07-16' },
      { firstName: 'Aisha', lastName: 'Moraa', phone: '+254712345014', email: 'aisha@email.com', category: 'regular', dateOfBirth: '1997-03-05' },
      { firstName: 'Safiya', lastName: 'Nyambura', phone: '+254712345015', email: 'safiya@email.com', category: 'new', dateOfBirth: '2001-09-22' }
    ];
    
    const clientIds = [];
    for (const clientData of clientsData) {
      const result = await db.collection('clients').insertOne({
        ...clientData,
        tenantId: premiumTenant._id,
        totalVisits: 0,
        totalSpent: 0,
        lastVisit: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      clientIds.push({ ...clientData, _id: result.insertedId });
    }
    
    console.log(`✅ Created ${clientsData.length} clients\n`);
    
    // ============================================================================
    // 3. BOOKINGS (with staff assignments)
    // ============================================================================
    console.log('📅 Creating bookings with staff assignments...');
    
    const bookingsData = [];
    const allStaff = [owner, manager, ...stylists].filter(Boolean);
    
    // Past bookings (last 3 months)
    for (let i = 0; i < 40; i++) {
      const daysAgo = Math.floor(Math.random() * 90) + 1;
      const client = clientIds[Math.floor(Math.random() * clientIds.length)];
      const service = serviceIds[Math.floor(Math.random() * serviceIds.length)];
      const assignedStaff = allStaff[Math.floor(Math.random() * allStaff.length)];
      
      bookingsData.push({
        tenantId: premiumTenant._id,
        clientId: client._id,
        services: [{
          serviceId: service._id,
          serviceName: service.name,
          price: service.price,
          duration: service.duration
        }],
        scheduledDate: getDateTime(-daysAgo, 9 + Math.floor(Math.random() * 8)),
        totalPrice: service.price,
        status: 'completed',
        assignedTo: assignedStaff._id,
        createdAt: getDate(-daysAgo),
        updatedAt: getDate(-daysAgo)
      });
    }
    
    // Upcoming bookings (next 2 weeks)
    for (let i = 0; i < 12; i++) {
      const daysAhead = Math.floor(Math.random() * 14) + 1;
      const client = clientIds[Math.floor(Math.random() * clientIds.length)];
      const service = serviceIds[Math.floor(Math.random() * serviceIds.length)];
      const assignedStaff = allStaff[Math.floor(Math.random() * allStaff.length)];
      
      bookingsData.push({
        tenantId: premiumTenant._id,
        clientId: client._id,
        services: [{
          serviceId: service._id,
          serviceName: service.name,
          price: service.price,
          duration: service.duration
        }],
        scheduledDate: getDateTime(daysAhead, 9 + Math.floor(Math.random() * 8)),
        totalPrice: service.price,
        status: 'confirmed',
        assignedTo: assignedStaff._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    await db.collection('bookings').insertMany(bookingsData);
    
    // Update client stats
    for (const client of clientIds) {
      const clientBookings = bookingsData.filter(b => 
        b.clientId.toString() === client._id.toString() && b.status === 'completed'
      );
      
      const totalSpent = clientBookings.reduce((sum, b) => sum + b.totalPrice, 0);
      const lastBooking = clientBookings.sort((a, b) => b.scheduledDate - a.scheduledDate)[0];
      
      await db.collection('clients').updateOne(
        { _id: client._id },
        {
          $set: {
            totalVisits: clientBookings.length,
            totalSpent: totalSpent,
            lastVisit: lastBooking ? lastBooking.scheduledDate : null
          }
        }
      );
    }
    
    console.log(`✅ Created ${bookingsData.length} bookings (${bookingsData.filter(b => b.status === 'completed').length} completed, ${bookingsData.filter(b => b.status === 'confirmed').length} upcoming)\n`);
    
    // ============================================================================
    // 4. STOCK ITEMS
    // ============================================================================
    console.log('📦 Creating stock items...');
    
    const stockItems = [
      { name: 'Brazilian Hair 18"', category: 'Hair Extensions', quantity: 15, minQuantity: 5, unitPrice: 8000 },
      { name: 'Peruvian Hair 20"', category: 'Hair Extensions', quantity: 12, minQuantity: 5, unitPrice: 9500 },
      { name: 'Malaysian Hair 22"', category: 'Hair Extensions', quantity: 8, minQuantity: 5, unitPrice: 11000 },
      { name: 'Kanekalon Braiding Hair', category: 'Braiding Hair', quantity: 50, minQuantity: 20, unitPrice: 300 },
      { name: 'X-Pression Braiding Hair', category: 'Braiding Hair', quantity: 3, minQuantity: 15, unitPrice: 350 },
      { name: 'Shea Moisture Conditioner', category: 'Hair Care', quantity: 25, minQuantity: 10, unitPrice: 1200 },
      { name: 'Cantu Leave-In', category: 'Hair Care', quantity: 30, minQuantity: 10, unitPrice: 900 },
      { name: 'Eco Styler Gel', category: 'Styling Products', quantity: 20, minQuantity: 8, unitPrice: 600 },
      { name: 'Edge Control', category: 'Styling Products', quantity: 2, minQuantity: 10, unitPrice: 500 },
      { name: 'Hair Dryer', category: 'Tools', quantity: 4, minQuantity: 2, unitPrice: 5000 },
      { name: 'Flat Iron', category: 'Tools', quantity: 3, minQuantity: 2, unitPrice: 7000 },
      { name: 'Hair Color - Black', category: 'Color Products', quantity: 8, minQuantity: 5, unitPrice: 800 },
      { name: 'Hair Color - Brown', category: 'Color Products', quantity: 6, minQuantity: 5, unitPrice: 800 }
    ];
    
    await db.collection('materialitems').insertMany(
      stockItems.map(item => ({
        ...item,
        tenantId: premiumTenant._id,
        supplier: 'Beauty Supply Co.',
        location: 'Main Storage',
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );
    
    const lowStockCount = stockItems.filter(item => item.quantity < item.minQuantity).length;
    console.log(`✅ Created ${stockItems.length} stock items (${lowStockCount} low stock alerts)\n`);
    
    // ============================================================================
    // 5. COMMUNICATIONS
    // ============================================================================
    console.log('💬 Creating communications...');
    
    const communications = [];
    
    // Create some past communications
    for (let i = 0; i < 15; i++) {
      const client = clientIds[Math.floor(Math.random() * clientIds.length)];
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const types = ['confirmation', 'reminder', 'thank_you', 'birthday', 'promotion'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      communications.push({
        tenantId: premiumTenant._id,
        clientId: client._id,
        type: type,
        channel: 'sms',
        message: `Sample ${type} message to ${client.firstName}`,
        status: 'sent',
        sentAt: getDate(-daysAgo),
        createdAt: getDate(-daysAgo)
      });
    }
    
    await db.collection('communications').insertMany(communications);
    console.log(`✅ Created ${communications.length} communications\n`);
    
    // ============================================================================
    // SUMMARY
    // ============================================================================
    const totalRevenue = bookingsData
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    
    console.log('='.repeat(80));
    console.log('✅ ENHANCED TEST DATA CREATED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log(`\n📊 Data Summary for Premium Tier (luxury-hair-demo):`);
    console.log(`   • ${services.length} services across ${[...new Set(services.map(s => s.category))].length} categories`);
    console.log(`   • ${clientsData.length} clients`);
    console.log(`   • ${bookingsData.length} bookings`);
    console.log(`     - ${bookingsData.filter(b => b.status === 'completed').length} completed (KES ${totalRevenue.toLocaleString()})`);
    console.log(`     - ${bookingsData.filter(b => b.status === 'confirmed').length} upcoming`);
    console.log(`   • ${stockItems.length} stock items (${lowStockCount} low stock)`);
    console.log(`   • ${communications.length} communications sent`);
    console.log(`   • All bookings assigned to staff members`);
    console.log(`\n💡 Login: owner@luxuryhair.com / Password123!`);
    console.log(`   Tenant Slug: luxury-hair-demo\n`);
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedEnhancedData();
