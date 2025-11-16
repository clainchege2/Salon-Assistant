const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/salon-assistant', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
});

const Booking = require('./backend/src/models/Booking');
const Client = require('./backend/src/models/Client');
const Service = require('./backend/src/models/Service');
const User = require('./backend/src/models/User');

async function clearSeedData() {
  try {
    console.log('🧹 Clearing seed data...\n');

    // Wait for connection
    await mongoose.connection.asPromise();
    console.log('✅ Connected to MongoDB\n');

    // Delete all bookings
    const bookingsDeleted = await Booking.deleteMany({});
    console.log(`✅ Deleted ${bookingsDeleted.deletedCount} bookings`);

    // Delete all clients
    const clientsDeleted = await Client.deleteMany({});
    console.log(`✅ Deleted ${clientsDeleted.deletedCount} clients`);

    // Delete all services
    const servicesDeleted = await Service.deleteMany({});
    console.log(`✅ Deleted ${servicesDeleted.deletedCount} services`);

    // Delete only stylists (keep admin users)
    const stylistsDeleted = await User.deleteMany({ role: 'stylist' });
    console.log(`✅ Deleted ${stylistsDeleted.deletedCount} stylists`);

    console.log('\n✅ Seed data cleared successfully!');
    console.log('✅ Login accounts preserved (tenants and admins)\n');

  } catch (error) {
    console.error('❌ Error clearing data:', error);
  } finally {
    mongoose.connection.close();
  }
}

clearSeedData();
