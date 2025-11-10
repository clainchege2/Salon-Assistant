const mongoose = require('mongoose');
const Communication = require('./src/models/Communication');

async function cleanupCommunications() {
  try {
    await mongoose.connect('mongodb://localhost:27017/elegance-hair-salon-kenya');
    console.log('Connected to MongoDB');

    // Remove communications without salon field (orphaned data)
    const result = await Communication.deleteMany({ salon: { $exists: false } });
    console.log(`Deleted ${result.deletedCount} orphaned communications`);

    console.log('Cleanup completed');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanupCommunications();