const mongoose = require('mongoose');
const Communication = require('./src/models/Communication');
const Client = require('./src/models/Client');
const Salon = require('./src/models/Salon');

async function createTestCommunications() {
  try {
    await mongoose.connect('mongodb://localhost:27017/elegance-hair-salon-kenya');
    console.log('Connected to MongoDB');

    // Find both salons
    const salons = await Salon.find().limit(2);
    if (salons.length < 2) {
      console.log('Need at least 2 salons. Please run the multi-tenant test first.');
      process.exit(1);
    }

    console.log('Found salons:', salons.map(s => s.name));

    for (const salon of salons) {
      console.log(`\n📞 Creating communications for ${salon.name}...`);
      
      // Find clients for this salon
      const clients = await Client.find({ salon: salon._id }).limit(3);
      
      if (clients.length === 0) {
        console.log(`No clients found for ${salon.name}, creating a test client...`);
        
        const testClient = new Client({
          firstName: 'Test',
          lastName: 'Client',
          phone: `+25470000000${Math.floor(Math.random() * 10)}`,
          email: `test${Math.floor(Math.random() * 1000)}@${salon.slug}.com`,
          salon: salon._id
        });
        await testClient.save();
        clients.push(testClient);
      }

      // Create sample communications for each client
      for (let i = 0; i < clients.length; i++) {
        const client = clients[i];
        
        // Create different types of communications
        const communications = [
          {
            client: client._id,
            salon: salon._id,
            type: 'call_outgoing',
            direction: 'outgoing',
            content: `Called ${client.firstName} to confirm tomorrow's appointment. Client confirmed and is looking forward to the session.`,
            duration: 120,
            status: 'answered',
            staffMember: salon.name.includes('Test') ? 'Mary Wanjiku' : 'Grace Muthoni'
          },
          {
            client: client._id,
            salon: salon._id,
            type: 'sms_sent',
            direction: 'outgoing',
            content: `Hi ${client.firstName}! This is a reminder about your appointment tomorrow at 2 PM. Looking forward to seeing you!`,
            status: 'delivered',
            staffMember: salon.name.includes('Test') ? 'Jane Doe' : 'John Smith',
            metadata: {
              phoneNumber: client.phone
            }
          },
          {
            client: client._id,
            salon: salon._id,
            type: 'note',
            direction: 'internal',
            subject: 'Client Preferences',
            content: `${client.firstName} prefers morning appointments and likes natural hair colors. Very punctual client.`,
            staffMember: salon.name.includes('Test') ? 'Mary Wanjiku' : 'Grace Muthoni',
            isPrivate: true
          }
        ];

        // Add follow-up communication for some clients
        if (i === 0) {
          communications.push({
            client: client._id,
            salon: salon._id,
            type: 'call_incoming',
            direction: 'incoming',
            content: `${client.firstName} called to reschedule appointment due to emergency. Rescheduled for next week.`,
            duration: 90,
            status: 'answered',
            staffMember: salon.name.includes('Test') ? 'Jane Doe' : 'John Smith',
            followUpRequired: true,
            followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
          });
        }

        // Insert communications
        for (const commData of communications) {
          const communication = new Communication(commData);
          await communication.save();
        }
        
        console.log(`✅ Created ${communications.length} communications for ${client.firstName} ${client.lastName}`);
      }
    }

    // Verify the data isolation
    console.log('\n🔍 Verifying data isolation...');
    
    for (const salon of salons) {
      const salonComms = await Communication.find({ salon: salon._id });
      console.log(`${salon.name}: ${salonComms.length} communications`);
    }

    console.log('\n🎉 Test communications created successfully!');
    console.log('Now each salon should see only their own communications.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create test communications:', error);
    process.exit(1);
  }
}

createTestCommunications();