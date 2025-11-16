const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'hairvia';

/**
 * COMPREHENSIVE SEED DATA - Populates ALL features for ALL tiers
 * Includes: Services, Clients, Bookings, Feedback, Communications, 
 * Staff Performance, Materials, Marketing Campaigns
 */

// Helper to get dates relative to today
const getDate = (daysOffset) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

// Helper to generate random time
const randomTime = (startHour = 9, endHour = 17) => {
  const hour = startHour + Math.floor(Math.random() * (endHour - startHour));
  const minute = Math.random() > 0.5 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
};

// Kenyan names for realistic data
const firstNames = {
  female: ['Grace', 'Patricia', 'Elizabeth', 'Mary', 'Betty', 'Catherine', 'Susan', 'Jane', 'Lucy', 'Rose', 
           'Faith', 'Joyce', 'Nancy', 'Margaret', 'Alice', 'Ann', 'Sarah', 'Rebecca', 'Caroline', 'Monica',
           'Esther', 'Lydia', 'Agnes', 'Beatrice', 'Doris', 'Ruth', 'Rachel', 'Hannah', 'Mercy', 'Eunice'],
  male: ['John', 'Peter', 'David', 'James', 'Joseph', 'Daniel', 'Michael', 'Samuel', 'Paul', 'Stephen']
};

const lastNames = ['Wambui', 'Mwende', 'Chebet', 'Njoki', 'Wanjiku', 'Atieno', 'Auma', 'Akinyi', 'Wangari',
                   'Nyambura', 'Moraa', 'Adhiambo', 'Njeri', 'Wanjiru', 'Muthoni', 'Achieng', 'Wangui',
                   'Nyokabi', 'Awuor', 'Mwangi', 'Kamau', 'Ochieng', 'Otieno', 'Kipchoge'];

async function seedData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(dbName);
    
    // Find all tenants
    const freeTenant = await db.collection('tenants').findOne({ slug: 'basic-beauty-demo' });
    const proTenant = await db.collection('tenants').findOne({ slug: 'elite-styles-demo' });
    const premiumTenant = await db.collection('tenants').findOne({ slug: 'luxury-hair-demo' });
    
    if (!freeTenant || !proTenant || !premiumTenant) {
      console.log('\n❌ Tenants not found!');
      console.log('   Please run "node seed-accounts.js" first');
      await client.close();
      process.exit(1);
    }
    
    console.log('🗑️  Clearing existing data...');
    
    // Clear all data collections
    const collections = ['services', 'clients', 'bookings', 'feedbacks', 'communications', 'materialitems'];
    for (const coll of collections) {
      await db.collection(coll).deleteMany({});
    }
    
    console.log('✅ Old data cleared\n');

    // ============================================================================
    // SERVICES - Common across all tiers
    // ============================================================================
    const createServices = (tenantId) => [
      // Braiding
      { _id: new ObjectId(), tenantId, name: 'Box Braids', description: 'Classic box braids', duration: 240, price: 3000, category: 'Braiding', isActive: true },
      { _id: new ObjectId(), tenantId, name: 'Cornrows', description: 'Traditional cornrow braiding', duration: 180, price: 2000, category: 'Braiding', isActive: true },
      { _id: new ObjectId(), tenantId, name: 'Knotless Braids', description: 'Protective knotless braids', duration: 300, price: 4000, category: 'Braiding', isActive: true },
      { _id: new ObjectId(), tenantId, name: 'Twists', description: 'Two-strand twists', duration: 150, price: 2500, category: 'Braiding', isActive: true },
      // Weaving
      { _id: new ObjectId(), tenantId, name: 'Weave Installation', description: 'Full weave installation', duration: 120, price: 3500, category: 'Weaving', isActive: true },
      { _id: new ObjectId(), tenantId, name: 'Closure Installation', description: 'Lace closure', duration: 90, price: 2500, category: 'Weaving', isActive: true },
      { _id: new ObjectId(), tenantId, name: 'Frontal Installation', description: 'Lace frontal', duration: 120, price: 3000, category: 'Weaving', isActive: true },
      // Treatment
      { _id: new ObjectId(), tenantId, name: 'Deep Conditioning', description: 'Intensive treatment', duration: 60, price: 1500, category: 'Treatment', isActive: true },
      { _id: new ObjectId(), tenantId, name: 'Protein Treatment', description: 'Strengthening treatment', duration: 75, price: 2000, category: 'Treatment', isActive: true },
      { _id: new ObjectId(), tenantId, name: 'Hot Oil Treatment', description: 'Moisturizing treatment', duration: 45, price: 1200, category: 'Treatment', isActive: true },
      // Styling
      { _id: new ObjectId(), tenantId, name: 'Blow Dry & Style', description: 'Professional styling', duration: 45, price: 1000, category: 'Styling', isActive: true },
      { _id: new ObjectId(), tenantId, name: 'Silk Press', description: 'Heat styling', duration: 90, price: 2500, category: 'Styling', isActive: true },
      { _id: new ObjectId(), tenantId, name: 'Updo Styling', description: 'Special occasion updo', duration: 60, price: 1800, category: 'Styling', isActive: true },
      // Locs
      { _id: new ObjectId(), tenantId, name: 'Locs Retwist', description: 'Maintenance retwist', duration: 90, price: 2000, category: 'Locs', isActive: true },
      { _id: new ObjectId(), tenantId, name: 'Locs Installation', description: 'New locs', duration: 240, price: 5000, category: 'Locs', isActive: true },
      // Color
      { _id: new ObjectId(), tenantId, name: 'Hair Coloring', description: 'Full color service', duration: 120, price: 3500, category: 'Color', isActive: true },
      { _id: new ObjectId(), tenantId, name: 'Highlights', description: 'Partial highlights', duration: 150, price: 4000, category: 'Color', isActive: true },
      { _id: new ObjectId(), tenantId, name: 'Balayage', description: 'Hand-painted highlights', duration: 180, price: 5000, category: 'Color', isActive: true }
    ];
    
    console.log('📊 Creating services for all tiers...');
    const freeServices = createServices(freeTenant._id);
    const proServices = createServices(proTenant._id);
    const premiumServices = createServices(premiumTenant._id);
    
    await db.collection('services').insertMany([...freeServices, ...proServices, ...premiumServices]);
    console.log(`✅ Created ${freeServices.length} services per tenant (${freeServices.length * 3} total)`);

    // ============================================================================
    // CLIENTS - Different volumes per tier to show scalability
    // ============================================================================
    const createClients = (tenantId, count, staffIds) => {
      const clients = [];
      for (let i = 0; i < count; i++) {
        const firstName = firstNames.female[i % firstNames.female.length];
        const lastName = lastNames[i % lastNames.length];
        
        // Vary client profiles for realistic RFM distribution
        let visits, spent, lastVisit, firstVisit, category;
        
        if (i < count * 0.1) { // 10% Champions
          visits = 15 + Math.floor(Math.random() * 10);
          spent = visits * (2500 + Math.random() * 1500);
          lastVisit = -3 - Math.floor(Math.random() * 10);
          firstVisit = -300 - Math.floor(Math.random() * 100);
          category = 'vip';
        } else if (i < count * 0.25) { // 15% Loyal
          visits = 8 + Math.floor(Math.random() * 7);
          spent = visits * (2000 + Math.random() * 1000);
          lastVisit = -10 - Math.floor(Math.random() * 15);
          firstVisit = -200 - Math.floor(Math.random() * 100);
          category = 'usual';
        } else if (i < count * 0.40) { // 15% Potential Loyalists
          visits = 4 + Math.floor(Math.random() * 3);
          spent = visits * (2200 + Math.random() * 800);
          lastVisit = -5 - Math.floor(Math.random() * 10);
          firstVisit = -60 - Math.floor(Math.random() * 40);
          category = 'usual';
        } else if (i < count * 0.55) { // 15% New
          visits = 1 + Math.floor(Math.random() * 2);
          spent = visits * (2000 + Math.random() * 1000);
          lastVisit = -2 - Math.floor(Math.random() * 5);
          firstVisit = -10 - Math.floor(Math.random() * 15);
          category = 'new';
        } else if (i < count * 0.70) { // 15% Need Attention
          visits = 6 + Math.floor(Math.random() * 4);
          spent = visits * (2000 + Math.random() * 1000);
          lastVisit = -35 - Math.floor(Math.random() * 20);
          firstVisit = -150 - Math.floor(Math.random() * 50);
          category = 'usual';
        } else if (i < count * 0.85) { // 15% At Risk
          visits = 8 + Math.floor(Math.random() * 5);
          spent = visits * (2500 + Math.random() * 1000);
          lastVisit = -90 - Math.floor(Math.random() * 30);
          firstVisit = -300 - Math.floor(Math.random() * 100);
          category = 'longtime-no-see';
        } else { // 15% Lost
          visits = 2 + Math.floor(Math.random() * 3);
          spent = visits * (2000 + Math.random() * 1000);
          lastVisit = -150 - Math.floor(Math.random() * 50);
          firstVisit = -200 - Math.floor(Math.random() * 100);
          category = 'longtime-no-see';
        }
        
        const birthYear = 1985 + Math.floor(Math.random() * 15);
        const createdBy = staffIds[i % staffIds.length];
        
        // Realistic referral source distribution
        const referralSources = ['tiktok', 'instagram', 'facebook', 'whatsapp', 'friend', 'google', 'walk-by', 'advertisement', 'other'];
        const referralWeights = [25, 30, 15, 10, 10, 5, 3, 1, 1]; // Percentage weights
        let random = Math.random() * 100;
        let referralSource = 'other';
        let cumulative = 0;
        for (let j = 0; j < referralWeights.length; j++) {
          cumulative += referralWeights[j];
          if (random <= cumulative) {
            referralSource = referralSources[j];
            break;
          }
        }
        
        clients.push({
          _id: new ObjectId(),
          tenantId,
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
          phone: `+25472${String(2000000 + i).substring(0, 7)}`,
          category,
          totalVisits: visits,
          totalSpent: Math.round(spent),
          lastVisit: getDate(lastVisit),
          firstVisit: getDate(firstVisit),
          dateOfBirth: new Date(`${birthYear}-${String((i % 12) + 1).padStart(2, '0')}-15`),
          gender: 'female',
          referralSource,
          marketingConsent: { 
            sms: i % 3 !== 0, 
            email: i % 2 === 0, 
            whatsapp: i % 4 !== 0 
          },
          preferences: {
            preferredStylist: staffIds[i % staffIds.length],
            preferredDays: ['Monday', 'Wednesday', 'Friday'][i % 3],
            allergies: i % 10 === 0 ? 'Sensitive scalp' : null
          },
          createdBy,
          createdAt: getDate(firstVisit)
        });
      }
      return clients;
    };
    
    console.log('\n👥 Creating clients for all tiers...');
    
    // Get staff for each tenant
    const freeStaff = await db.collection('users').find({ tenantId: freeTenant._id }).toArray();
    const proStaff = await db.collection('users').find({ tenantId: proTenant._id }).toArray();
    const premiumStaff = await db.collection('users').find({ tenantId: premiumTenant._id }).toArray();
    
    // FREE: 15 clients (small salon)
    const freeClients = createClients(freeTenant._id, 15, freeStaff.map(s => s._id));
    
    // PRO: 35 clients (growing salon)
    const proClients = createClients(proTenant._id, 35, proStaff.map(s => s._id));
    
    // PREMIUM: 60 clients (established salon)
    const premiumClients = createClients(premiumTenant._id, 60, premiumStaff.map(s => s._id));
    
    await db.collection('clients').insertMany([...freeClients, ...proClients, ...premiumClients]);
    console.log(`✅ Created ${freeClients.length} FREE + ${proClients.length} PRO + ${premiumClients.length} PREMIUM clients`);

    // ============================================================================
    // BOOKINGS - Generate realistic booking history with varied statuses
    // ============================================================================
    const createBookings = (tenantId, clients, services, staffIds) => {
      const bookings = [];
      
      clients.forEach((client, clientIndex) => {
        const visitsToGenerate = client.totalVisits;
        const daysBetweenVisits = Math.abs(
          Math.floor((client.firstVisit - client.lastVisit) / (1000 * 60 * 60 * 24))
        ) / Math.max(visitsToGenerate - 1, 1);
        
        for (let i = 0; i < visitsToGenerate; i++) {
          const daysAgo = Math.floor(
            (client.firstVisit - new Date()) / (1000 * 60 * 60 * 24) + (i * daysBetweenVisits)
          );
          
          if (daysAgo >= 0) continue; // Skip future dates
          
          const service = services[Math.floor(Math.random() * services.length)];
          const staffMember = staffIds[clientIndex % staffIds.length];
          const priceVariation = 0.95 + (Math.random() * 0.1);
          const price = Math.round(service.price * priceVariation);
          
          const startHour = 9 + Math.floor(Math.random() * 8);
          const startTime = `${String(startHour).padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`;
          const endHour = startHour + Math.ceil(service.duration / 60);
          const endTime = `${String(endHour).padStart(2, '0')}:00`;
          
          // Determine status (most completed, some cancelled/no-show)
          let status = 'completed';
          if (i < visitsToGenerate && Math.random() < 0.05) status = 'cancelled';
          else if (i < visitsToGenerate && Math.random() < 0.03) status = 'no-show';
          
          bookings.push({
            _id: new ObjectId(),
            tenantId,
            clientId: client._id,
            stylistId: staffMember,
            scheduledDate: getDate(daysAgo),
            type: 'reserved',
            status,
            services: [{
              serviceId: service._id,
              serviceName: service.name,
              price: price,
              duration: service.duration
            }],
            totalPrice: price,
            totalDuration: service.duration,
            customerInstructions: i === 0 ? `First visit for ${client.firstName}` : '',
            createdBy: staffMember,
            createdAt: getDate(daysAgo - 3),
            completedAt: status === 'completed' ? getDate(daysAgo) : null
          });
        }
      });
      
      // Add upcoming bookings for active clients
      const activeClients = clients.filter(c => {
        const daysSince = Math.floor((new Date() - c.lastVisit) / (1000 * 60 * 60 * 24));
        return daysSince < 30;
      });
      
      activeClients.slice(0, Math.min(10, activeClients.length)).forEach((client, index) => {
        const futureDay = 2 + (index * 2);
        const service = services[Math.floor(Math.random() * services.length)];
        
        bookings.push({
          _id: new ObjectId(),
          tenantId,
          clientId: client._id,
          stylistId: staffIds[index % staffIds.length],
          scheduledDate: getDate(futureDay),
          type: 'reserved',
          status: 'confirmed',
          services: [{
            serviceId: service._id,
            serviceName: service.name,
            price: service.price,
            duration: service.duration
          }],
          totalPrice: service.price,
          totalDuration: service.duration,
          customerInstructions: 'Regular appointment',
          createdBy: staffIds[0],
          createdAt: new Date()
        });
      });
      
      return bookings;
    };
    
    console.log('\n📅 Creating bookings for all tiers...');
    
    const freeBookings = createBookings(freeTenant._id, freeClients, freeServices, freeStaff.map(s => s._id));
    const proBookings = createBookings(proTenant._id, proClients, proServices, proStaff.map(s => s._id));
    const premiumBookings = createBookings(premiumTenant._id, premiumClients, premiumServices, premiumStaff.map(s => s._id));
    
    await db.collection('bookings').insertMany([...freeBookings, ...proBookings, ...premiumBookings]);
    console.log(`✅ Created ${freeBookings.length} FREE + ${proBookings.length} PRO + ${premiumBookings.length} PREMIUM bookings`);

    // ============================================================================
    // FEEDBACK - Client reviews and ratings (PRO & PREMIUM only)
    // ============================================================================
    console.log('\n⭐ Creating feedback data...');
    
    const createFeedback = (tenantId, bookings, clients) => {
      const feedbacks = [];
      const completedBookings = bookings.filter(b => b.status === 'completed');
      
      // 40% of completed bookings have feedback
      const bookingsWithFeedback = completedBookings
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(completedBookings.length * 0.4));
      
      bookingsWithFeedback.forEach((booking, index) => {
        const client = clients.find(c => c._id.equals(booking.client));
        if (!client) return;
        
        // Generate realistic ratings (skewed positive)
        const overallRating = Math.random() < 0.7 ? (4 + Math.floor(Math.random() * 2)) : 
                             Math.random() < 0.8 ? 3 : 
                             (1 + Math.floor(Math.random() * 2));
        
        const serviceRating = overallRating + (Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? 1 : -1));
        const staffRating = overallRating + (Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? 1 : -1));
        const cleanlinessRating = overallRating + (Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? 1 : -1));
        const valueRating = overallRating + (Math.random() < 0.4 ? 0 : (Math.random() < 0.5 ? 1 : -1));
        
        const clampRating = (r) => Math.max(1, Math.min(5, r));
        
        const comments = {
          5: ['Excellent service! Will definitely come back.', 'Amazing experience, highly recommend!', 
              'Best salon in town!', 'Professional and friendly staff.', 'Love my new look!'],
          4: ['Great service, very satisfied.', 'Good experience overall.', 'Nice work, will return.',
              'Professional service.', 'Happy with the results.'],
          3: ['Decent service, nothing special.', 'It was okay.', 'Average experience.',
              'Service was fine.', 'Met expectations.'],
          2: ['Not very satisfied.', 'Expected better.', 'Service could improve.',
              'Disappointed with the result.', 'Not worth the price.'],
          1: ['Very disappointed.', 'Poor service.', 'Will not return.',
              'Terrible experience.', 'Waste of money.']
        };
        
        const comment = comments[overallRating][Math.floor(Math.random() * comments[overallRating].length)];
        
        feedbacks.push({
          _id: new ObjectId(),
          tenantId,
          clientId: client._id,
          bookingId: booking._id,
          overallRating,
          serviceRating: clampRating(serviceRating),
          staffRating: clampRating(staffRating),
          cleanlinessRating: clampRating(cleanlinessRating),
          valueRating: clampRating(valueRating),
          comment,
          wouldRecommend: overallRating >= 4,
          source: ['portal', 'sms', 'whatsapp', 'email'][Math.floor(Math.random() * 4)],
          status: overallRating <= 2 ? 'flagged' : 'published',
          isPositive: overallRating >= 4,
          isNegative: overallRating <= 2,
          requiresAction: overallRating <= 2,
          createdAt: new Date(booking.date.getTime() + (24 * 60 * 60 * 1000)) // Next day
        });
      });
      
      return feedbacks;
    };
    
    // PRO tier gets feedback
    const proFeedbacks = createFeedback(proTenant._id, proBookings, proClients);
    
    // PREMIUM tier gets more feedback
    const premiumFeedbacks = createFeedback(premiumTenant._id, premiumBookings, premiumClients);
    
    if (proFeedbacks.length > 0 || premiumFeedbacks.length > 0) {
      await db.collection('feedbacks').insertMany([...proFeedbacks, ...premiumFeedbacks]);
      console.log(`✅ Created ${proFeedbacks.length} PRO + ${premiumFeedbacks.length} PREMIUM feedback entries`);
    }

    // ============================================================================
    // COMMUNICATIONS - Messages, reminders, follow-ups (PRO & PREMIUM)
    // ============================================================================
    console.log('\n💬 Creating communications data...');
    
    const createCommunications = (tenantId, clients, bookings, staffIds) => {
      const communications = [];
      
      // Appointment reminders (outgoing)
      const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
      upcomingBookings.forEach(booking => {
        const client = clients.find(c => c._id.equals(booking.client));
        if (!client) return;
        
        communications.push({
          _id: new ObjectId(),
          tenantId,
          clientId: client._id,
          direction: 'outgoing',
          messageType: 'reminder',
          channel: 'sms',
          message: `Hi ${client.firstName}, reminder of your appointment tomorrow at ${booking.startTime}. See you soon!`,
          status: 'sent',
          priority: 'medium',
          relatedBookingId: booking._id,
          sentBy: staffIds[0],
          sentAt: new Date(booking.date.getTime() - (24 * 60 * 60 * 1000)),
          deliveredAt: new Date(booking.date.getTime() - (24 * 60 * 60 * 1000) + 5000),
          createdAt: new Date(booking.date.getTime() - (24 * 60 * 60 * 1000))
        });
      });
      
      // Birthday wishes (outgoing)
      const birthdayClients = clients.filter(c => {
        if (!c.dateOfBirth) return false;
        const today = new Date();
        const bday = new Date(c.dateOfBirth);
        return bday.getMonth() === today.getMonth() && 
               Math.abs(bday.getDate() - today.getDate()) <= 7;
      });
      
      birthdayClients.forEach(client => {
        communications.push({
          _id: new ObjectId(),
          tenantId,
          clientId: client._id,
          direction: 'outgoing',
          messageType: 'birthday',
          channel: 'whatsapp',
          message: `Happy Birthday ${client.firstName}! 🎉 Enjoy 15% off your next visit. We hope you have a wonderful day!`,
          status: 'delivered',
          priority: 'low',
          sentBy: staffIds[0],
          sentAt: getDate(-2),
          deliveredAt: getDate(-2),
          createdAt: getDate(-2)
        });
      });
      
      // Follow-up messages (outgoing)
      const recentCompletedBookings = bookings
        .filter(b => b.status === 'completed')
        .sort((a, b) => b.date - a.date)
        .slice(0, 15);
      
      recentCompletedBookings.forEach(booking => {
        const client = clients.find(c => c._id.equals(booking.client));
        if (!client || Math.random() > 0.6) return;
        
        communications.push({
          _id: new ObjectId(),
          tenantId,
          clientId: client._id,
          direction: 'outgoing',
          messageType: 'follow-up',
          channel: 'sms',
          message: `Hi ${client.firstName}, thank you for visiting us! We'd love to hear your feedback. How was your experience?`,
          status: 'delivered',
          priority: 'low',
          relatedBookingId: booking._id,
          sentBy: staffIds[0],
          sentAt: new Date(booking.date.getTime() + (48 * 60 * 60 * 1000)),
          deliveredAt: new Date(booking.date.getTime() + (48 * 60 * 60 * 1000) + 3000),
          createdAt: new Date(booking.date.getTime() + (48 * 60 * 60 * 1000))
        });
      });
      
      // Client inquiries (incoming)
      const activeClients = clients.slice(0, Math.min(10, clients.length));
      activeClients.forEach((client, index) => {
        if (Math.random() > 0.4) return;
        
        const inquiries = [
          'Do you have availability this Saturday?',
          'What are your prices for box braids?',
          'Can I book an appointment for next week?',
          'Do you offer hair coloring services?',
          'What time do you close today?'
        ];
        
        const requiresAction = Math.random() > 0.5;
        
        communications.push({
          _id: new ObjectId(),
          tenantId,
          clientId: client._id,
          direction: 'incoming',
          messageType: 'inquiry',
          channel: 'whatsapp',
          message: inquiries[index % inquiries.length],
          status: requiresAction ? 'new' : 'replied',
          priority: 'medium',
          requiresAction,
          receivedAt: getDate(-1 - index),
          replies: requiresAction ? [] : [{
            message: 'Yes, we have availability. Would you like to book?',
            repliedBy: staffIds[0],
            repliedAt: getDate(-1 - index)
          }],
          createdAt: getDate(-1 - index)
        });
      });
      
      // Complaints (incoming - requires action)
      if (Math.random() > 0.7) {
        const complainingClient = clients[Math.floor(Math.random() * clients.length)];
        communications.push({
          _id: new ObjectId(),
          tenantId,
          clientId: complainingClient._id,
          direction: 'incoming',
          messageType: 'complaint',
          channel: 'portal',
          message: 'I was not satisfied with my last service. The braids were too tight and my scalp hurts.',
          status: 'new',
          priority: 'high',
          requiresAction: true,
          receivedAt: getDate(-1),
          createdAt: getDate(-1)
        });
      }
      
      return communications;
    };
    
    const proCommunications = createCommunications(proTenant._id, proClients, proBookings, proStaff.map(s => s._id));
    const premiumCommunications = createCommunications(premiumTenant._id, premiumClients, premiumBookings, premiumStaff.map(s => s._id));
    
    if (proCommunications.length > 0 || premiumCommunications.length > 0) {
      await db.collection('communications').insertMany([...proCommunications, ...premiumCommunications]);
      console.log(`✅ Created ${proCommunications.length} PRO + ${premiumCommunications.length} PREMIUM communications`);
    }

    // ============================================================================
    // MATERIALS/STOCK - Inventory management (PRO & PREMIUM)
    // ============================================================================
    console.log('\n📦 Creating stock/materials data...');
    
    const createMaterials = (tenantId) => [
      // Hair Extensions
      { _id: new ObjectId(), tenantId, name: 'Brazilian Hair Bundle 18"', category: 'Hair Extensions', barcode: `890${tenantId.toString().slice(-10)}01`, quantity: 25, unit: 'bundle', reorderLevel: 10, costPrice: 3500, sellingPrice: 5000, supplier: 'Premium Hair Supplies', location: 'Shelf A1', lastRestocked: getDate(-15), createdAt: getDate(-90) },
      { _id: new ObjectId(), tenantId, name: 'Peruvian Hair Bundle 20"', category: 'Hair Extensions', barcode: `890${tenantId.toString().slice(-10)}02`, quantity: 18, unit: 'bundle', reorderLevel: 8, costPrice: 4000, sellingPrice: 5500, supplier: 'Premium Hair Supplies', location: 'Shelf A2', lastRestocked: getDate(-20), createdAt: getDate(-90) },
      { _id: new ObjectId(), tenantId, name: 'Closure 4x4 Lace', category: 'Hair Extensions', barcode: `890${tenantId.toString().slice(-10)}03`, quantity: 12, unit: 'piece', reorderLevel: 5, costPrice: 2500, sellingPrice: 3500, supplier: 'Premium Hair Supplies', location: 'Shelf A3', lastRestocked: getDate(-10), createdAt: getDate(-90) },
      
      // Braiding Hair
      { _id: new ObjectId(), tenantId, name: 'Kanekalon Braiding Hair - Black', category: 'Braiding Hair', barcode: `890${tenantId.toString().slice(-10)}04`, quantity: 45, unit: 'pack', reorderLevel: 20, costPrice: 150, sellingPrice: 250, supplier: 'Braids & More', location: 'Shelf B1', lastRestocked: getDate(-5), createdAt: getDate(-90) },
      { _id: new ObjectId(), tenantId, name: 'Kanekalon Braiding Hair - Brown', category: 'Braiding Hair', barcode: `890${tenantId.toString().slice(-10)}05`, quantity: 38, unit: 'pack', reorderLevel: 20, costPrice: 150, sellingPrice: 250, supplier: 'Braids & More', location: 'Shelf B2', lastRestocked: getDate(-5), createdAt: getDate(-90) },
      { _id: new ObjectId(), tenantId, name: 'X-Pression Braiding Hair', category: 'Braiding Hair', barcode: `890${tenantId.toString().slice(-10)}06`, quantity: 52, unit: 'pack', reorderLevel: 25, costPrice: 200, sellingPrice: 300, supplier: 'Braids & More', location: 'Shelf B3', lastRestocked: getDate(-8), createdAt: getDate(-90) },
      
      // Hair Care Products
      { _id: new ObjectId(), tenantId, name: 'Deep Conditioning Treatment 500ml', category: 'Hair Care', barcode: `890${tenantId.toString().slice(-10)}07`, quantity: 15, unit: 'bottle', reorderLevel: 8, costPrice: 800, sellingPrice: 1200, supplier: 'Beauty Supplies Ltd', location: 'Shelf C1', lastRestocked: getDate(-12), createdAt: getDate(-90) },
      { _id: new ObjectId(), tenantId, name: 'Protein Treatment 250ml', category: 'Hair Care', barcode: `890${tenantId.toString().slice(-10)}08`, quantity: 10, unit: 'bottle', reorderLevel: 5, costPrice: 1000, sellingPrice: 1500, supplier: 'Beauty Supplies Ltd', location: 'Shelf C2', lastRestocked: getDate(-18), createdAt: getDate(-90) },
      { _id: new ObjectId(), tenantId, name: 'Leave-in Conditioner 300ml', category: 'Hair Care', barcode: `890${tenantId.toString().slice(-10)}09`, quantity: 22, unit: 'bottle', reorderLevel: 10, costPrice: 600, sellingPrice: 900, supplier: 'Beauty Supplies Ltd', location: 'Shelf C3', lastRestocked: getDate(-7), createdAt: getDate(-90) },
      
      // Styling Products
      { _id: new ObjectId(), tenantId, name: 'Edge Control Gel', category: 'Styling Products', barcode: `890${tenantId.toString().slice(-10)}10`, quantity: 28, unit: 'jar', reorderLevel: 12, costPrice: 400, sellingPrice: 650, supplier: 'Beauty Supplies Ltd', location: 'Shelf D1', lastRestocked: getDate(-10), createdAt: getDate(-90) },
      { _id: new ObjectId(), tenantId, name: 'Hair Spray - Strong Hold', category: 'Styling Products', barcode: `890${tenantId.toString().slice(-10)}11`, quantity: 18, unit: 'can', reorderLevel: 8, costPrice: 500, sellingPrice: 800, supplier: 'Beauty Supplies Ltd', location: 'Shelf D2', lastRestocked: getDate(-14), createdAt: getDate(-90) },
      { _id: new ObjectId(), tenantId, name: 'Shine Serum 100ml', category: 'Styling Products', barcode: `890${tenantId.toString().slice(-10)}12`, quantity: 14, unit: 'bottle', reorderLevel: 6, costPrice: 700, sellingPrice: 1100, supplier: 'Beauty Supplies Ltd', location: 'Shelf D3', lastRestocked: getDate(-16), createdAt: getDate(-90) },
      
      // Tools & Accessories
      { _id: new ObjectId(), tenantId, name: 'Rat Tail Comb', category: 'Tools', barcode: `890${tenantId.toString().slice(-10)}13`, quantity: 35, unit: 'piece', reorderLevel: 15, costPrice: 50, sellingPrice: 100, supplier: 'Salon Tools Co', location: 'Drawer 1', lastRestocked: getDate(-20), createdAt: getDate(-90) },
      { _id: new ObjectId(), tenantId, name: 'Hair Clips Set (12pcs)', category: 'Tools', barcode: `890${tenantId.toString().slice(-10)}14`, quantity: 20, unit: 'set', reorderLevel: 10, costPrice: 150, sellingPrice: 250, supplier: 'Salon Tools Co', location: 'Drawer 2', lastRestocked: getDate(-25), createdAt: getDate(-90) },
      { _id: new ObjectId(), tenantId, name: 'Spray Bottle 500ml', category: 'Tools', barcode: `890${tenantId.toString().slice(-10)}15`, quantity: 8, unit: 'piece', reorderLevel: 5, costPrice: 200, sellingPrice: 350, supplier: 'Salon Tools Co', location: 'Shelf E1', lastRestocked: getDate(-30), createdAt: getDate(-90) },
      
      // Low stock items (need reordering)
      { _id: new ObjectId(), tenantId, name: 'Hair Color - Jet Black', category: 'Color Products', barcode: `890${tenantId.toString().slice(-10)}16`, quantity: 3, unit: 'tube', reorderLevel: 8, costPrice: 800, sellingPrice: 1200, supplier: 'Color Pro Supplies', location: 'Shelf F1', lastRestocked: getDate(-45), createdAt: getDate(-90) },
      { _id: new ObjectId(), tenantId, name: 'Developer 20 Volume', category: 'Color Products', barcode: `890${tenantId.toString().slice(-10)}17`, quantity: 4, unit: 'bottle', reorderLevel: 10, costPrice: 600, sellingPrice: 900, supplier: 'Color Pro Supplies', location: 'Shelf F2', lastRestocked: getDate(-40), createdAt: getDate(-90) }
    ];
    
    const proMaterials = createMaterials(proTenant._id);
    const premiumMaterials = createMaterials(premiumTenant._id);
    
    await db.collection('materialitems').insertMany([...proMaterials, ...premiumMaterials]);
    console.log(`✅ Created ${proMaterials.length} PRO + ${premiumMaterials.length} PREMIUM stock items`);

    // ============================================================================
    // RFM CALCULATION - Calculate scores for all clients
    // ============================================================================
    console.log('\n🧮 Calculating RFM scores for all clients...');
    
    const calculateClientRFM = (client, allClients) => {
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
    
    // Calculate for all clients
    const allClients = [...freeClients, ...proClients, ...premiumClients];
    for (const client of allClients) {
      const rfmData = calculateClientRFM(client, allClients);
      await db.collection('clients').updateOne(
        { _id: client._id },
        { $set: rfmData }
      );
    }
    
    console.log('✅ RFM scores calculated for all clients');

    // ============================================================================
    // STAFF PERFORMANCE METRICS - Update user records with performance data
    // ============================================================================
    console.log('\n👨‍💼 Calculating staff performance metrics...');
    
    const calculateStaffPerformance = async (tenantId, staff, bookings) => {
      for (const staffMember of staff) {
        const staffBookings = bookings.filter(b => 
          b.stylist && b.stylist.equals(staffMember._id) && b.status === 'completed'
        );
        
        const totalRevenue = staffBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const totalBookings = staffBookings.length;
        const avgServiceTime = staffBookings.length > 0
          ? staffBookings.reduce((sum, b) => sum + (b.duration || 60), 0) / staffBookings.length
          : 0;
        
        // Calculate rating from feedback
        const staffFeedbacks = await db.collection('feedbacks').find({
          tenantId,
          bookingId: { $in: staffBookings.map(b => b._id) }
        }).toArray();
        
        const avgRating = staffFeedbacks.length > 0
          ? staffFeedbacks.reduce((sum, f) => sum + (f.staffRating || f.overallRating), 0) / staffFeedbacks.length
          : 4.5;
        
        // Update user with performance metrics
        await db.collection('users').updateOne(
          { _id: staffMember._id },
          {
            $set: {
              performance: {
                totalRevenue,
                totalBookings,
                avgServiceTime: Math.round(avgServiceTime),
                avgRating: Math.round(avgRating * 10) / 10,
                lastUpdated: new Date()
              }
            }
          }
        );
      }
    };
    
    await calculateStaffPerformance(freeTenant._id, freeStaff, freeBookings);
    await calculateStaffPerformance(proTenant._id, proStaff, proBookings);
    await calculateStaffPerformance(premiumTenant._id, premiumStaff, premiumBookings);
    
    console.log('✅ Staff performance metrics calculated');
    
    // ============================================================================
    // SUMMARY & STATISTICS
    // ============================================================================
    const calculateStats = (bookings) => {
      const completed = bookings.filter(b => b.status === 'completed');
      const totalRevenue = completed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const upcoming = bookings.filter(b => b.status === 'confirmed').length;
      return { completed: completed.length, totalRevenue, upcoming };
    };
    
    const freeStats = calculateStats(freeBookings);
    const proStats = calculateStats(proBookings);
    const premiumStats = calculateStats(premiumBookings);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPREHENSIVE SEED DATA CREATED SUCCESSFULLY!');
    console.log('='.repeat(80));
    
    console.log('\n🆓 FREE TIER - Basic Beauty Salon (basic-beauty-demo)');
    console.log('─'.repeat(80));
    console.log(`   • ${freeServices.length} services`);
    console.log(`   • ${freeClients.length} clients`);
    console.log(`   • ${freeBookings.length} bookings (${freeStats.completed} completed, ${freeStats.upcoming} upcoming)`);
    console.log(`   • Ksh ${freeStats.totalRevenue.toLocaleString()} total revenue`);
    console.log(`   • Login: owner@basicbeauty.com / Password123!`);
    console.log(`   • Features: Basic bookings, clients, services only`);
    
    console.log('\n⭐ PRO TIER - Elite Styles Pro (elite-styles-demo)');
    console.log('─'.repeat(80));
    console.log(`   • ${proServices.length} services`);
    console.log(`   • ${proClients.length} clients with RFM scores`);
    console.log(`   • ${proBookings.length} bookings (${proStats.completed} completed, ${proStats.upcoming} upcoming)`);
    console.log(`   • ${proFeedbacks.length} feedback entries`);
    console.log(`   • ${proCommunications.length} communications`);
    console.log(`   • ${proMaterials.length} stock items`);
    console.log(`   • Ksh ${proStats.totalRevenue.toLocaleString()} total revenue`);
    console.log(`   • Login: owner@elitestyles.com / Password123!`);
    console.log(`   • Features: + Staff management, Stock, Communications, Feedback`);
    
    console.log('\n💎 PREMIUM TIER - Luxury Hair Lounge (luxury-hair-demo)');
    console.log('─'.repeat(80));
    console.log(`   • ${premiumServices.length} services`);
    console.log(`   • ${premiumClients.length} clients with RFM scores`);
    console.log(`   • ${premiumBookings.length} bookings (${premiumStats.completed} completed, ${premiumStats.upcoming} upcoming)`);
    console.log(`   • ${premiumFeedbacks.length} feedback entries`);
    console.log(`   • ${premiumCommunications.length} communications`);
    console.log(`   • ${premiumMaterials.length} stock items`);
    console.log(`   • Ksh ${premiumStats.totalRevenue.toLocaleString()} total revenue`);
    console.log(`   • Staff performance metrics calculated`);
    console.log(`   • Login: owner@luxuryhair.com / Password123!`);
    console.log(`   • Features: + Marketing, Analytics, Reports, AI Insights`);
    
    console.log('\n📊 KEY FEATURES DEMONSTRATED:');
    console.log('   ✅ Realistic booking patterns (6+ months history)');
    console.log('   ✅ RFM segmentation (11 customer segments)');
    console.log('   ✅ Client feedback & ratings');
    console.log('   ✅ Two-way communications (SMS, WhatsApp, Email)');
    console.log('   ✅ Stock management with low-stock alerts');
    console.log('   ✅ Staff performance tracking');
    console.log('   ✅ Organic data distribution (realistic patterns)');
    console.log('   ✅ Tier-appropriate feature access');
    
    console.log('\n🎯 TESTING RECOMMENDATIONS:');
    console.log('   1. Start with FREE tier to see basic features');
    console.log('   2. Move to PRO tier to see staff, stock, communications');
    console.log('   3. Explore PREMIUM tier for full analytics & marketing');
    console.log('   4. Compare dashboards across tiers to see upgrade value');
    
    console.log('\n' + '='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.error(error.stack);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedData();
