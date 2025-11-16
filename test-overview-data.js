const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/salon-assistant', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const Booking = require('./backend/src/models/Booking');
const Client = require('./backend/src/models/Client');

async function testOverviewData() {
  try {
    console.log('Testing Overview Data...\n');
    
    // Get all bookings
    const allBookings = await Booking.find({}).populate('services.serviceId stylistId clientId');
    console.log(`Total bookings in database: ${allBookings.length}`);
    
    if (allBookings.length > 0) {
      console.log('\nFirst booking sample:');
      console.log('- ID:', allBookings[0]._id);
      console.log('- Date:', allBookings[0].scheduledDate);
      console.log('- Status:', allBookings[0].status);
      console.log('- Total Price:', allBookings[0].totalPrice);
      console.log('- Tenant ID:', allBookings[0].tenantId);
      console.log('- Client:', allBookings[0].clientId?.firstName, allBookings[0].clientId?.lastName);
      console.log('- Services:', allBookings[0].services?.map(s => s.serviceName).join(', '));
    }
    
    // Check for confirmed/completed bookings
    const confirmedBookings = await Booking.find({
      status: { $in: ['confirmed', 'completed'] }
    });
    console.log(`\nConfirmed/Completed bookings: ${confirmedBookings.length}`);
    
    // Check date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentBookings = await Booking.find({
      scheduledDate: { $gte: thirtyDaysAgo, $lte: now },
      status: { $in: ['confirmed', 'completed'] }
    });
    console.log(`\nBookings in last 30 days: ${recentBookings.length}`);
    
    if (recentBookings.length > 0) {
      const totalRevenue = recentBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      console.log(`Total revenue (last 30 days): KES ${totalRevenue.toLocaleString()}`);
    }
    
    // Check all clients
    const allClients = await Client.find({});
    console.log(`\nTotal clients: ${allClients.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testOverviewData();
