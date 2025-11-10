const mongoose = require('mongoose');
const Communication = require('./src/models/Communication');
const Client = require('./src/models/Client');

async function migrateCommunications() {
  try {
    await mongoose.connect('mongodb://localhost:27017/elegance-hair-salon-kenya');
    console.log('Connected to MongoDB');

    // Find all communications without salon field
    const communicationsWithoutSalon = await Communication.find({ salon: { $exists: false } });
    console.log(`Found ${communicationsWithoutSalon.length} communications without salon field`);

    for (const communication of communicationsWithoutSalon) {
      // Get the client to find their salon
      const client = await Client.findById(communication.client);
      if (client && client.salon) {
        communication.salon = client.salon;
        await communication.save();
        console.log(`Updated communication ${communication._id} with salon ${client.salon}`);
      } else {
        console.log(`Could not find salon for communication ${communication._id}`);
      }
    }

    console.log('Communication migration completed');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateCommunications();