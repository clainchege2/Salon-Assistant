const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB with timeout settings
mongoose.connect('mongodb://localhost:27017/salon-assistant', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});

const Tenant = require('./backend/src/models/Tenant');
const User = require('./backend/src/models/User');
const Client = require('./backend/src/models/Client');
const Service = require('./backend/src/models/Service');
const Booking = require('./backend/src/models/Booking');

// Kenyan female names
const kenyanFirstNames = [
  'Amani', 'Asha', 'Ayana', 'Bahati', 'Chiku', 'Dalila', 'Eshe', 'Faraja',
  'Grace', 'Halima', 'Imani', 'Jamila', 'Kadija', 'Layla', 'Makena', 'Naima',
  'Nia', 'Pendo', 'Rehema', 'Safiya', 'Salama', 'Subira', 'Tatu', 'Upendo',
  'Wambui', 'Wanjiku', 'Wairimu', 'Zawadi', 'Zuri', 'Akinyi', 'Atieno', 'Awino',
  'Faith', 'Hope', 'Joy', 'Mercy', 'Patience', 'Prudence', 'Ruth', 'Sarah',
  'Njeri', 'Nyambura', 'Nyokabi', 'Wangari', 'Wangui', 'Waithera', 'Wanjiru'
];

const kenyanLastNames = [
  'Mwangi', 'Kamau', 'Njoroge', 'Otieno', 'Ochieng', 'Wanjiru', 'Achieng',
  'Wambui', 'Njeri', 'Kariuki', 'Kimani', 'Mutua', 'Omondi', 'Owino', 'Adhiambo',
  'Wangari', 'Nyambura', 'Wairimu', 'Wanjiku', 'Githinji', 'Karanja', 'Kibet'
];

// Service categories with realistic pricing
const serviceCategories = {
  hair: [
    { name: 'Box Braids', duration: 180, price: 2500, popularity: 0.25 },
    { name: 'Cornrows', duration: 120, price: 1500, popularity: 0.20 },
    { name: 'Weave Installation', duration: 150, price: 3000, popularity: 0.15 },
    { name: 'Twist Braids', duration: 150, price: 2000, popularity: 0.18 },
    { name: 'Dreadlocks Maintenance', duration: 90, price: 1800, popularity: 0.08 },
    { name: 'Hair Coloring', duration: 120, price: 2800, popularity: 0.05 },
    { name: 'Blow Dry & Style', duration: 60, price: 800, popularity: 0.09 }
  ],
  nails: [
    { name: 'Gel Manicure', duration: 60, price: 1200, popularity: 0.30 },
    { name: 'Acrylic Nails', duration: 90, price: 2000, popularity: 0.25 },
    { name: 'Pedicure', duration: 45, price: 1000, popularity: 0.25 },
    { name: 'Nail Art', duration: 30, price: 500, popularity: 0.15 },
    { name: 'Gel Polish Removal', duration: 20, price: 300, popularity: 0.05 }
  ],
  beauty: [
    { name: 'Makeup Application', duration: 60, price: 2500, popularity: 0.15 },
    { name: 'Eyebrow Threading', duration: 15, price: 300, popularity: 0.30 },
    { name: 'Facial Treatment', duration: 60, price: 2000, popularity: 0.20 },
    { name: 'Eyelash Extensions', duration: 90, price: 3500, popularity: 0.10 },
    { name: 'Waxing', duration: 30, price: 800, popularity: 0.25 }
  ]
};

// Helper to generate phone number
function generatePhone() {
  const prefixes = ['0710', '0720', '0730', '0740', '0750', '0790'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return prefix + suffix;
}

// Helper to get random item weighted by popularity
function getWeightedRandom(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.popularity, 0);
  let random = Math.random() * totalWeight;
  
  for (const item of items) {
    random -= item.popularity;
    if (random <= 0) return item;
  }
  return items[0];
}

// Helper to generate realistic booking time (peak hours: 10am-2pm, 4pm-6pm)
function getRealisticBookingHour(dayOfWeek) {
  // Weekend has different patterns
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Weekends: 10am-4pm peak
    const hours = [10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 16];
    return hours[Math.floor(Math.random() * hours.length)];
  }
  
  // Weekdays: Morning and evening peaks
  const rand = Math.random();
  if (rand < 0.4) return 10 + Math.floor(Math.random() * 4); // 10am-1pm
  if (rand < 0.7) return 14 + Math.floor(Math.random() * 2); // 2pm-3pm
  return 16 + Math.floor(Math.random() * 3); // 4pm-6pm
}

async function seedRealisticData() {
  try {
    console.log('🌱 Starting realistic data seeding...\n');

    // Wait for connection
    await mongoose.connection.asPromise();
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data
    await Booking.deleteMany({});
    await Client.deleteMany({});
    await Service.deleteMany({});
    await User.deleteMany({ role: { $ne: 'super_admin' } });
    
    console.log('✅ Cleared existing data\n');

    // Get tenants
    const tenants = await Tenant.find({});
    if (tenants.length === 0) {
      console.log('❌ No tenants found. Run seed-accounts.js first');
      process.exit(1);
    }

    for (const tenant of tenants) {
      console.log(`\n📍 Seeding data for: ${tenant.businessName}`);
      console.log('='.repeat(50));

      // Create services
      const services = [];
      for (const [category, items] of Object.entries(serviceCategories)) {
        for (const item of items) {
          const service = await Service.create({
            tenantId: tenant._id,
            name: item.name,
            category: category,
            duration: item.duration,
            price: item.price,
            description: `Professional ${item.name.toLowerCase()} service`,
            isActive: true
          });
          services.push({ ...service.toObject(), popularity: item.popularity });
        }
      }
      console.log(`✅ Created ${services.length} services`);

      // Create stylists
      const stylists = [];
      const stylistNames = [
        { first: 'Faith', last: 'Achieng', skill: 0.9 },
        { first: 'Grace', last: 'Wanjiru', skill: 0.85 },
        { first: 'Mercy', last: 'Otieno', skill: 0.8 },
        { first: 'Joy', last: 'Kamau', skill: 0.75 }
      ];

      for (const stylistData of stylistNames) {
        const stylist = await User.create({
          tenantId: tenant._id,
          email: `${stylistData.first.toLowerCase()}.${stylistData.last.toLowerCase()}@${tenant.slug}.com`,
          password: await bcrypt.hash('password123', 10),
          firstName: stylistData.first,
          lastName: stylistData.last,
          phone: generatePhone(),
          role: 'stylist',
          status: 'active',
          permissions: ['view_bookings', 'manage_own_bookings']
        });
        stylists.push({ ...stylist.toObject(), skill: stylistData.skill });
      }
      console.log(`✅ Created ${stylists.length} stylists`);

      // Create clients with realistic patterns
      const clients = [];
      const clientCount = 150; // Good number for analytics
      
      for (let i = 0; i < clientCount; i++) {
        const firstName = kenyanFirstNames[Math.floor(Math.random() * kenyanFirstNames.length)];
        const lastName = kenyanLastNames[Math.floor(Math.random() * kenyanLastNames.length)];
        
        // Client behavior patterns
        const loyaltyLevel = Math.random();
        let visitFrequency, totalVisits;
        
        if (loyaltyLevel > 0.7) {
          // VIP clients: 8-15 visits
          visitFrequency = 'regular';
          totalVisits = 8 + Math.floor(Math.random() * 8);
        } else if (loyaltyLevel > 0.4) {
          // Regular clients: 3-7 visits
          visitFrequency = 'occasional';
          totalVisits = 3 + Math.floor(Math.random() * 5);
        } else {
          // New/rare clients: 1-2 visits
          visitFrequency = 'rare';
          totalVisits = 1 + Math.floor(Math.random() * 2);
        }

        const client = await Client.create({
          tenantId: tenant._id,
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
          phone: generatePhone(),
          dateOfBirth: new Date(1985 + Math.floor(Math.random() * 25), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)),
          totalVisits: 0, // Will update after bookings
          totalSpent: 0,
          lastVisit: null,
          notes: visitFrequency === 'regular' ? 'VIP client - prefers Faith' : '',
          marketingConsent: Math.random() > 0.3,
          referralSource: ['Instagram', 'Facebook', 'Google', 'Walk-in', 'Referral'][Math.floor(Math.random() * 5)]
        });
        
        clients.push({ ...client.toObject(), targetVisits: totalVisits, loyaltyLevel });
      }
      console.log(`✅ Created ${clients.length} clients`);

      // Create bookings over 12 months with realistic patterns
      console.log('\n📅 Creating bookings...');
      const bookings = [];
      const now = new Date();
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 12);

      let totalBookings = 0;
      
      // Generate bookings for each client based on their pattern
      for (const client of clients) {
        const numBookings = client.targetVisits;
        
        for (let b = 0; b < numBookings; b++) {
          // Spread bookings over time
          const daysAgo = Math.floor(Math.random() * 365);
          const bookingDate = new Date(now);
          bookingDate.setDate(bookingDate.getDate() - daysAgo);
          
          // Skip Sundays (salon closed)
          if (bookingDate.getDay() === 0) {
            bookingDate.setDate(bookingDate.getDate() - 1);
          }
          
          // Set realistic time
          const hour = getRealisticBookingHour(bookingDate.getDay());
          bookingDate.setHours(hour, [0, 15, 30, 45][Math.floor(Math.random() * 4)], 0, 0);
          
          // Select service based on popularity
          const service = getWeightedRandom(services);
          
          // Assign stylist (VIP clients prefer top stylist)
          let stylist;
          if (client.loyaltyLevel > 0.7 && Math.random() > 0.3) {
            stylist = stylists[0]; // Top stylist
          } else {
            stylist = stylists[Math.floor(Math.random() * stylists.length)];
          }
          
          // Status distribution
          let status;
          if (daysAgo > 7) {
            // Past bookings
            const rand = Math.random();
            if (rand < 0.85) status = 'completed';
            else if (rand < 0.95) status = 'cancelled';
            else status = 'no-show';
          } else if (daysAgo > 0) {
            status = Math.random() > 0.1 ? 'completed' : 'confirmed';
          } else {
            status = 'confirmed'; // Future bookings
          }
          
          const booking = await Booking.create({
            tenantId: tenant._id,
            clientId: client._id,
            stylistId: stylist._id,
            scheduledDate: bookingDate,
            services: [{
              serviceId: service._id,
              serviceName: service.name,
              duration: service.duration,
              price: service.price
            }],
            totalDuration: service.duration,
            totalPrice: service.price,
            status,
            notes: '',
            createdAt: new Date(bookingDate.getTime() - 24 * 60 * 60 * 1000) // Booked 1 day before
          });
          
          bookings.push(booking);
          totalBookings++;
          
          // Update client stats for completed bookings
          if (status === 'completed') {
            await Client.findByIdAndUpdate(client._id, {
              $inc: { totalVisits: 1, totalSpent: service.price },
              lastVisit: bookingDate
            });
          }
        }
      }
      
      console.log(`✅ Created ${totalBookings} bookings`);
      
      // Calculate and display stats
      const completed = bookings.filter(b => b.status === 'completed').length;
      const cancelled = bookings.filter(b => b.status === 'cancelled').length;
      const noShows = bookings.filter(b => b.status === 'no-show').length;
      const totalRevenue = bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.totalPrice, 0);
      
      console.log(`\n📊 Statistics for ${tenant.businessName}:`);
      console.log(`   Total Bookings: ${totalBookings}`);
      console.log(`   Completed: ${completed} (${(completed/totalBookings*100).toFixed(1)}%)`);
      console.log(`   Cancelled: ${cancelled} (${(cancelled/totalBookings*100).toFixed(1)}%)`);
      console.log(`   No-shows: ${noShows} (${(noShows/totalBookings*100).toFixed(1)}%)`);
      console.log(`   Total Revenue: KSh ${totalRevenue.toLocaleString()}`);
      console.log(`   Avg per booking: KSh ${Math.round(totalRevenue/completed).toLocaleString()}`);
    }

    console.log('\n\n✅ Realistic data seeding complete!');
    console.log('\n🎯 You can now:');
    console.log('   - View analytics with real patterns');
    console.log('   - See peak hours heatmaps');
    console.log('   - Analyze client retention');
    console.log('   - Compare stylist performance');
    console.log('   - Track revenue trends\n');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedRealisticData();
