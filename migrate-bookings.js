const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const Client = require('./src/models/Client');

async function migrateBookings() {
  try {
    await mongoose.connect('mongodb://localhost:27017/hair-salon-assistant');
    console.log('Connected to MongoDB');

    // Find all bookings without salon field
    const bookingsWithoutSalon = await Booking.find({ salon: { $exists: false } });
    console.log(`Found ${bookingsWithoutSalon.length} bookings without salon field`);

    for (const booking of bookingsWithoutSalon) {
      // Get the client to find their salon
      const client = await Client.findById(booking.client);
      if (client && client.salon) {
        booking.salon = client.salon;
        await booking.save();
        console.log(`Updated booking ${booking._id} with salon ${client.salon}`);
      } else {
        console.log(`Could not find salon for booking ${booking._id}`);
      }
    }

    console.log('Migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateBookings();