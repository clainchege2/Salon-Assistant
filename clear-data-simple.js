// Simple script to clear data - run with backend stopped
require('./backend/src/config/database');
const Booking = require('./backend/src/models/Booking');
const Client = require('./backend/src/models/Client');
const Service = require('./backend/src/models/Service');
const User = require('./backend/src/models/User');

setTimeout(async () => {
  try {
    console.log('Clearing data...');
    
    await Booking.deleteMany({});
    console.log('✅ Bookings cleared');
    
    await Client.deleteMany({});
    console.log('✅ Clients cleared');
    
    await Service.deleteMany({});
    console.log('✅ Services cleared');
    
    await User.deleteMany({ role: 'stylist' });
    console.log('✅ Stylists cleared');
    
    console.log('\n✅ Done! Login accounts preserved.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}, 2000);
