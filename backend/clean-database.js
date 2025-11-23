/**
 * Clean Database - Remove All Data
 * WARNING: This will delete ALL data from the database
 */

const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hairvia';

async function cleanDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    // Get all collections
    const collections = await mongoose.connection.db.collections();
    
    console.log('Collections to be cleared:');
    collections.forEach(col => console.log(`  - ${col.collectionName}`));
    console.log('');

    console.log('⚠️  WARNING: This will DELETE ALL DATA!\n');
    console.log('Deleting all data...\n');

    let totalDeleted = 0;
    for (const collection of collections) {
      const result = await collection.deleteMany({});
      console.log(`✓ Cleared ${collection.collectionName}: ${result.deletedCount} documents`);
      totalDeleted += result.deletedCount;
    }

    console.log('\n✅ Database cleaned successfully!');
    console.log(`   Total documents deleted: ${totalDeleted}`);
    console.log('\nYou can now test with fresh accounts:');
    console.log('  1. Admin Portal: http://localhost:3000');
    console.log('     - Register a new tenant/salon');
    console.log('  2. Client Portal: http://localhost:3001');
    console.log('     - Register as a client');
    console.log('');
    
    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cleanDatabase();
