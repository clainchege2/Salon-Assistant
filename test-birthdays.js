require('./backend/src/config/database');
const Client = require('./backend/src/models/Client');

async function testBirthdays() {
  try {
    // Get all clients with birthdays
    const clients = await Client.find({
      dateOfBirth: { $exists: true, $ne: null }
    }).select('firstName lastName dateOfBirth tenantId');

    console.log(`Found ${clients.length} clients with birthdays:`);
    
    const today = new Date();
    clients.forEach(client => {
      const dob = new Date(client.dateOfBirth);
      const thisYear = today.getFullYear();
      let nextBirthday = new Date(thisYear, dob.getMonth(), dob.getDate());
      
      if (nextBirthday < today) {
        nextBirthday = new Date(thisYear + 1, dob.getMonth(), dob.getDate());
      }
      
      const daysUntil = Math.floor((nextBirthday - today) / (1000 * 60 * 60 * 24));
      
      console.log(`- ${client.firstName} ${client.lastName}: ${dob.toDateString()} (in ${daysUntil} days)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testBirthdays();
