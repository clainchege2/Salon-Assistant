const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'hairvia';

/**
 * SEED DATA - Populates test data for existing accounts
 * Run this to add/refresh test data without affecting login credentials
 * Can be run multiple times to regenerate data
 */

// Helper to get dates relative to today
const getDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

async function seedData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Find premium tenant
    const premiumTenant = await db.collection('tenants').findOne({ slug: 'luxury-hair-demo' });
    
    if (!premiumTenant) {
      console.log('\n❌ Premium tenant not found!');
      console.log('   Please run "node seed-accounts.js" first to create accounts');
      await client.close();
      process.exit(1);
    }
    
    console.log('🗑️  Clearing existing data...');
    
    // Clear existing data (but keep tenants and users)
    await db.collection('services').deleteMany({ tenantId: premiumTenant._id });
    await db.collection('clients').deleteMany({ tenantId: premiumTenant._id });
    await db.collection('bookings').deleteMany({ tenantId: premiumTenant._id });
    
    console.log('✅ Old data cleared\n');
    console.log('📊 Creating test data for Premium tier...\n');
    
    // Get staff IDs
    const owner = await db.collection('users').findOne({ 
      tenantId: premiumTenant._id, 
      role: 'owner' 
    });
    const stylist = await db.collection('users').findOne({ 
      tenantId: premiumTenant._id, 
      role: 'stylist' 
    });
    const manager = await db.collection('users').findOne({ 
      tenantId: premiumTenant._id, 
      role: 'manager' 
    });
    
    // ============================================================================
    // SERVICES - Expanded for realistic salon
    // ============================================================================
    const services = [
      // Braiding Services
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Box Braids',
        description: 'Classic box braids',
        duration: 240,
        price: 3000,
        category: 'Braiding',
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Cornrows',
        description: 'Traditional cornrow braiding',
        duration: 180,
        price: 2000,
        category: 'Braiding',
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Knotless Braids',
        description: 'Protective knotless braids',
        duration: 300,
        price: 4000,
        category: 'Braiding',
        isActive: true,
        createdAt: new Date()
      },
      // Weaving Services
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
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
        tenantId: premiumTenant._id,
        name: 'Closure Installation',
        description: 'Lace closure installation',
        duration: 90,
        price: 2500,
        category: 'Weaving',
        isActive: true,
        createdAt: new Date()
      },
      // Treatment Services
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Deep Conditioning',
        description: 'Intensive hair treatment',
        duration: 60,
        price: 1500,
        category: 'Treatment',
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Protein Treatment',
        description: 'Strengthening protein treatment',
        duration: 75,
        price: 2000,
        category: 'Treatment',
        isActive: true,
        createdAt: new Date()
      },
      // Styling Services
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Blow Dry & Style',
        description: 'Professional blow dry and styling',
        duration: 45,
        price: 1000,
        category: 'Styling',
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Silk Press',
        description: 'Heat styling for sleek look',
        duration: 90,
        price: 2500,
        category: 'Styling',
        isActive: true,
        createdAt: new Date()
      },
      // Locs Services
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Locs Retwist',
        description: 'Maintenance retwist',
        duration: 90,
        price: 2000,
        category: 'Locs',
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Locs Installation',
        description: 'New locs installation',
        duration: 240,
        price: 5000,
        category: 'Locs',
        isActive: true,
        createdAt: new Date()
      },
      // Color Services
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Hair Coloring',
        description: 'Full hair color service',
        duration: 120,
        price: 3500,
        category: 'Color',
        isActive: true,
        createdAt: new Date()
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Highlights',
        description: 'Partial highlights',
        duration: 150,
        price: 4000,
        category: 'Color',
        isActive: true,
        createdAt: new Date()
      }
    ];
    
    await db.collection('services').insertMany(services);
    console.log(`✅ Created ${services.length} services`);
    
    // ============================================================================
    // CLIENTS - Expanded for realistic analytics (25 clients)
    // ============================================================================
    const clientNames = [
      // VIP/Champions (high frequency, high spend, recent)
      { first: 'Grace', last: 'Wambui', visits: 24, spent: 72000, lastVisit: -3, firstVisit: -365 },
      { first: 'Patricia', last: 'Mwende', visits: 20, spent: 65000, lastVisit: -5, firstVisit: -300 },
      { first: 'Elizabeth', last: 'Chebet', visits: 18, spent: 58000, lastVisit: -7, firstVisit: -280 },
      
      // Loyal (regular visitors, good spend)
      { first: 'Mary', last: 'Njoki', visits: 12, spent: 38000, lastVisit: -10, firstVisit: -200 },
      { first: 'Betty', last: 'Wanjiku', visits: 14, spent: 42000, lastVisit: -8, firstVisit: -220 },
      { first: 'Catherine', last: 'Atieno', visits: 15, spent: 45000, lastVisit: -12, firstVisit: -240 },
      { first: 'Susan', last: 'Auma', visits: 11, spent: 35000, lastVisit: -14, firstVisit: -180 },
      
      // Potential Loyalists (recent, moderate frequency)
      { first: 'Jane', last: 'Akinyi', visits: 5, spent: 15000, lastVisit: -4, firstVisit: -60 },
      { first: 'Lucy', last: 'Wangari', visits: 6, spent: 18000, lastVisit: -6, firstVisit: -75 },
      { first: 'Rose', last: 'Nyambura', visits: 4, spent: 12000, lastVisit: -5, firstVisit: -50 },
      
      // New Customers (very recent, low frequency)
      { first: 'Faith', last: 'Moraa', visits: 2, spent: 5000, lastVisit: -2, firstVisit: -15 },
      { first: 'Joyce', last: 'Wambui', visits: 1, spent: 2500, lastVisit: -3, firstVisit: -10 },
      { first: 'Nancy', last: 'Adhiambo', visits: 2, spent: 6000, lastVisit: -4, firstVisit: -20 },
      
      // Need Attention (moderate recency, declining)
      { first: 'Margaret', last: 'Njeri', visits: 8, spent: 24000, lastVisit: -35, firstVisit: -150 },
      { first: 'Alice', last: 'Wanjiru', visits: 7, spent: 21000, lastVisit: -40, firstVisit: -140 },
      
      // At Risk (were good, now inactive)
      { first: 'Ann', last: 'Muthoni', visits: 10, spent: 32000, lastVisit: -90, firstVisit: -300 },
      { first: 'Sarah', last: 'Achieng', visits: 9, spent: 28000, lastVisit: -95, firstVisit: -280 },
      { first: 'Rebecca', last: 'Wangui', visits: 11, spent: 35000, lastVisit: -100, firstVisit: -320 },
      
      // Can't Lose Them (high value but haven't returned)
      { first: 'Caroline', last: 'Nyokabi', visits: 16, spent: 52000, lastVisit: -85, firstVisit: -350 },
      { first: 'Monica', last: 'Awuor', visits: 15, spent: 48000, lastVisit: -80, firstVisit: -330 },
      
      // Hibernating (inactive, moderate value)
      { first: 'Esther', last: 'Wambui', visits: 6, spent: 18000, lastVisit: -120, firstVisit: -250 },
      { first: 'Lydia', last: 'Njoki', visits: 5, spent: 15000, lastVisit: -110, firstVisit: -230 },
      
      // Lost (inactive, low value)
      { first: 'Agnes', last: 'Akinyi', visits: 3, spent: 9000, lastVisit: -150, firstVisit: -200 },
      { first: 'Beatrice', last: 'Mwangi', visits: 2, spent: 6000, lastVisit: -160, firstVisit: -180 },
      { first: 'Doris', last: 'Wanjiru', visits: 2, spent: 5000, lastVisit: -170, firstVisit: -190 }
    ];
    
    const clients = clientNames.map((client, index) => {
      const category = client.visits >= 15 ? 'vip' : 
                       client.visits >= 8 ? 'usual' : 
                       client.visits <= 2 ? 'new' : 
                       client.lastVisit < -90 ? 'longtime-no-see' : 'usual';
      
      const birthYears = [1985, 1987, 1990, 1992, 1995, 1988, 1993, 1991, 1989, 1994];
      const createdByStaff = [owner._id, stylist._id, manager._id][index % 3];
      
      return {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        firstName: client.first,
        lastName: client.last,
        email: `${client.first.toLowerCase()}.${client.last.toLowerCase()}@email.com`,
        phone: `+25472211${String(1001 + index).padStart(4, '0')}`,
        category,
        totalVisits: client.visits,
        totalSpent: client.spent,
        lastVisit: getDate(client.lastVisit),
        firstVisit: getDate(client.firstVisit),
        dateOfBirth: new Date(`${birthYears[index % birthYears.length]}-${String((index % 12) + 1).padStart(2, '0')}-15`),
        gender: 'female',
        marketingConsent: { 
          sms: index % 3 !== 0, 
          email: index % 2 === 0, 
          whatsapp: index % 4 !== 0 
        },
        createdBy: createdByStaff,
        createdAt: getDate(client.firstVisit)
      };
    });
    
    await db.collection('clients').insertMany(clients);
    console.log(`✅ Created ${clients.length} clients`);
    
    // ============================================================================
    // BOOKINGS - Generate realistic booking history (80+ bookings over 6 months)
    // ============================================================================
    const bookings = [];
    
    // Helper to generate bookings for a client (all past bookings)
    const generateBookingsForClient = (client, clientData) => {
      const visitsToGenerate = clientData.visits;
      const daysBetweenVisits = Math.abs(clientData.firstVisit - clientData.lastVisit) / Math.max(visitsToGenerate - 1, 1);
      
      for (let i = 0; i < visitsToGenerate; i++) {
        // Calculate days ago, ensuring all are in the past
        const daysAgo = Math.floor(clientData.firstVisit + (i * daysBetweenVisits));
        
        // Skip if this would be in the future
        if (daysAgo >= 0) continue;
        
        const serviceIndex = Math.floor(Math.random() * services.length);
        const service = services[serviceIndex];
        const staffMember = [stylist._id, manager._id][Math.floor(Math.random() * 2)];
        
        // Vary the price slightly
        const priceVariation = 0.9 + (Math.random() * 0.2); // 90% to 110%
        const price = Math.round(service.price * priceVariation);
        
        const hour = 9 + Math.floor(Math.random() * 8); // 9am to 5pm
        const startTime = `${String(hour).padStart(2, '0')}:00`;
        const endHour = hour + Math.ceil(service.duration / 60);
        const endTime = `${String(endHour).padStart(2, '0')}:00`;
        
        bookings.push({
          _id: new ObjectId(),
          tenantId: premiumTenant._id,
          clientId: client._id,
          services: [{
            serviceId: service._id,
            serviceName: service.name,
            price: price,
            duration: service.duration
          }],
          stylistId: staffMember,
          scheduledDate: getDate(daysAgo),
          startTime,
          endTime,
          status: 'completed',
          totalPrice: price,
          notes: i === 0 ? `First visit for ${client.firstName}` : '',
          createdBy: owner._id,
          createdAt: getDate(daysAgo - 5)
        });
      }
    };
    
    // Generate bookings for each client based on their visit history
    clients.forEach((client, index) => {
      generateBookingsForClient(client, clientNames[index]);
    });
    
    // Add some upcoming bookings for active clients (next 2 weeks)
    const activeClients = clients.filter(c => c.lastVisit > getDate(-30));
    activeClients.slice(0, 8).forEach((client, index) => {
      const futureDay = 2 + (index * 2); // Spread over next 2 weeks
      const serviceIndex = Math.floor(Math.random() * services.length);
      const service = services[serviceIndex];
      
      bookings.push({
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        clientId: client._id,
        services: [{
          serviceId: service._id,
          serviceName: service.name,
          price: service.price,
          duration: service.duration
        }],
        stylistId: [stylist._id, manager._id][index % 2],
        scheduledDate: getDate(futureDay),
        startTime: `${String(10 + (index % 6)).padStart(2, '0')}:00`,
        endTime: `${String(12 + (index % 6)).padStart(2, '0')}:00`,
        status: 'confirmed',
        totalPrice: service.price,
        notes: 'Regular appointment',
        createdBy: owner._id,
        createdAt: new Date()
      });
    });
    
    // Original bookings for reference (keeping a few specific ones)
    const specificBookings = [
    ];
    
    await db.collection('bookings').insertMany(bookings);
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const upcomingBookings = bookings.filter(b => b.status !== 'completed').length;
    console.log(`✅ Created ${bookings.length} bookings (${completedBookings} completed, ${upcomingBookings} upcoming)`);
    
    // ============================================================================
    // STOCK/MATERIALS - Inventory items for stock management
    // ============================================================================
    const materials = [
      // Hair Extensions
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Brazilian Hair Bundle 18"',
        category: 'Hair Extensions',
        barcode: '8901234567890',
        quantity: 25,
        unit: 'bundle',
        reorderLevel: 10,
        costPrice: 3500,
        sellingPrice: 5000,
        supplier: 'Premium Hair Supplies',
        location: 'Shelf A1',
        lastRestocked: getDate(-15),
        createdAt: getDate(-90)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Peruvian Hair Bundle 20"',
        category: 'Hair Extensions',
        barcode: '8901234567891',
        quantity: 18,
        unit: 'bundle',
        reorderLevel: 8,
        costPrice: 4000,
        sellingPrice: 5500,
        supplier: 'Premium Hair Supplies',
        location: 'Shelf A2',
        lastRestocked: getDate(-20),
        createdAt: getDate(-90)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Closure 4x4 Lace',
        category: 'Hair Extensions',
        barcode: '8901234567892',
        quantity: 12,
        unit: 'piece',
        reorderLevel: 5,
        costPrice: 2500,
        sellingPrice: 3500,
        supplier: 'Premium Hair Supplies',
        location: 'Shelf A3',
        lastRestocked: getDate(-10),
        createdAt: getDate(-90)
      },
      // Braiding Hair
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Kanekalon Braiding Hair - Black',
        category: 'Braiding Hair',
        barcode: '8901234567893',
        quantity: 45,
        unit: 'pack',
        reorderLevel: 20,
        costPrice: 150,
        sellingPrice: 250,
        supplier: 'Braids & More',
        location: 'Shelf B1',
        lastRestocked: getDate(-5),
        createdAt: getDate(-90)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Kanekalon Braiding Hair - Brown',
        category: 'Braiding Hair',
        barcode: '8901234567894',
        quantity: 38,
        unit: 'pack',
        reorderLevel: 20,
        costPrice: 150,
        sellingPrice: 250,
        supplier: 'Braids & More',
        location: 'Shelf B2',
        lastRestocked: getDate(-5),
        createdAt: getDate(-90)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'X-Pression Braiding Hair',
        category: 'Braiding Hair',
        barcode: '8901234567895',
        quantity: 52,
        unit: 'pack',
        reorderLevel: 25,
        costPrice: 200,
        sellingPrice: 300,
        supplier: 'Braids & More',
        location: 'Shelf B3',
        lastRestocked: getDate(-8),
        createdAt: getDate(-90)
      },
      // Hair Care Products
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Deep Conditioning Treatment 500ml',
        category: 'Hair Care',
        barcode: '8901234567896',
        quantity: 15,
        unit: 'bottle',
        reorderLevel: 8,
        costPrice: 800,
        sellingPrice: 1200,
        supplier: 'Beauty Supplies Ltd',
        location: 'Shelf C1',
        lastRestocked: getDate(-12),
        createdAt: getDate(-90)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Protein Treatment 250ml',
        category: 'Hair Care',
        barcode: '8901234567897',
        quantity: 10,
        unit: 'bottle',
        reorderLevel: 5,
        costPrice: 1000,
        sellingPrice: 1500,
        supplier: 'Beauty Supplies Ltd',
        location: 'Shelf C2',
        lastRestocked: getDate(-18),
        createdAt: getDate(-90)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Leave-in Conditioner 300ml',
        category: 'Hair Care',
        barcode: '8901234567898',
        quantity: 22,
        unit: 'bottle',
        reorderLevel: 10,
        costPrice: 600,
        sellingPrice: 900,
        supplier: 'Beauty Supplies Ltd',
        location: 'Shelf C3',
        lastRestocked: getDate(-7),
        createdAt: getDate(-90)
      },
      // Styling Products
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Edge Control Gel',
        category: 'Styling Products',
        barcode: '8901234567899',
        quantity: 28,
        unit: 'jar',
        reorderLevel: 12,
        costPrice: 400,
        sellingPrice: 650,
        supplier: 'Beauty Supplies Ltd',
        location: 'Shelf D1',
        lastRestocked: getDate(-10),
        createdAt: getDate(-90)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Hair Spray - Strong Hold',
        category: 'Styling Products',
        barcode: '8901234567900',
        quantity: 18,
        unit: 'can',
        reorderLevel: 8,
        costPrice: 500,
        sellingPrice: 800,
        supplier: 'Beauty Supplies Ltd',
        location: 'Shelf D2',
        lastRestocked: getDate(-14),
        createdAt: getDate(-90)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Shine Serum 100ml',
        category: 'Styling Products',
        barcode: '8901234567901',
        quantity: 14,
        unit: 'bottle',
        reorderLevel: 6,
        costPrice: 700,
        sellingPrice: 1100,
        supplier: 'Beauty Supplies Ltd',
        location: 'Shelf D3',
        lastRestocked: getDate(-16),
        createdAt: getDate(-90)
      },
      // Tools & Accessories
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Rat Tail Comb',
        category: 'Tools',
        barcode: '8901234567902',
        quantity: 35,
        unit: 'piece',
        reorderLevel: 15,
        costPrice: 50,
        sellingPrice: 100,
        supplier: 'Salon Tools Co',
        location: 'Drawer 1',
        lastRestocked: getDate(-20),
        createdAt: getDate(-90)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Hair Clips Set (12pcs)',
        category: 'Tools',
        barcode: '8901234567903',
        quantity: 20,
        unit: 'set',
        reorderLevel: 10,
        costPrice: 150,
        sellingPrice: 250,
        supplier: 'Salon Tools Co',
        location: 'Drawer 2',
        lastRestocked: getDate(-25),
        createdAt: getDate(-90)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Spray Bottle 500ml',
        category: 'Tools',
        barcode: '8901234567904',
        quantity: 8,
        unit: 'piece',
        reorderLevel: 5,
        costPrice: 200,
        sellingPrice: 350,
        supplier: 'Salon Tools Co',
        location: 'Shelf E1',
        lastRestocked: getDate(-30),
        createdAt: getDate(-90)
      },
      // Low stock items (need reordering)
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Hair Color - Jet Black',
        category: 'Color Products',
        barcode: '8901234567905',
        quantity: 3,
        unit: 'tube',
        reorderLevel: 8,
        costPrice: 800,
        sellingPrice: 1200,
        supplier: 'Color Pro Supplies',
        location: 'Shelf F1',
        lastRestocked: getDate(-45),
        createdAt: getDate(-90)
      },
      {
        _id: new ObjectId(),
        tenantId: premiumTenant._id,
        name: 'Developer 20 Volume',
        category: 'Color Products',
        barcode: '8901234567906',
        quantity: 4,
        unit: 'bottle',
        reorderLevel: 10,
        costPrice: 600,
        sellingPrice: 900,
        supplier: 'Color Pro Supplies',
        location: 'Shelf F2',
        lastRestocked: getDate(-40),
        createdAt: getDate(-90)
      }
    ];
    
    await db.collection('materialitems').insertMany(materials);
    const lowStockItems = materials.filter(m => m.quantity <= m.reorderLevel).length;
    console.log(`✅ Created ${materials.length} stock items (${lowStockItems} need reordering)`);
    
    // ============================================================================
    // CALCULATE RFM SCORES
    // ============================================================================
    console.log('\n🧮 Calculating RFM scores...');
    
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
    
    for (const client of clients) {
      const rfmData = await calculateClientRFM(client, clients);
      await db.collection('clients').updateOne(
        { _id: client._id },
        { $set: rfmData }
      );
    }
    
    console.log('✅ RFM scores calculated');
    
    // ============================================================================
    // SUMMARY
    // ============================================================================
    const totalRevenue = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ TEST DATA CREATED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log(`\n📊 Data Summary for Premium Tier (luxury-hair-demo):`);
    console.log(`   • ${services.length} services across 5 categories`);
    console.log(`   • ${clients.length} clients (with RFM scores)`);
    console.log(`   • ${bookings.length} bookings spanning 6 months`);
    console.log(`     - ${completedBookings} completed (Ksh ${totalRevenue.toLocaleString()})`);
    console.log(`     - ${upcomingBookings} upcoming`);
    console.log(`   • ${materials.length} stock items (${lowStockItems} low stock alerts)`);
    console.log(`   • Realistic revenue trends and analytics`);
    console.log('\n💡 Login with: owner@luxuryhair.com / Password123!');
    console.log('   Tenant Slug: luxury-hair-demo');
    console.log('\n📈 Analytics will show:');
    console.log('   • 6-month revenue trend');
    console.log('   • RFM segments across all 11 categories');
    console.log('   • Top performing services');
    console.log('   • Client distribution patterns');
    console.log('\n' + '='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedData();
