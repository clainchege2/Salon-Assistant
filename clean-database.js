require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

async function cleanDatabase() {
  try {
    console.log('🧹 Connecting to database...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hairvia';
    console.log('📍 Using:', mongoUri);
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected to MongoDB');
    console.log('🗑️  Dropping entire database...');
    
    // Drop the entire database
    await mongoose.connection.dropDatabase();
    
    console.log('✅ Database completely cleaned!');
    console.log('📊 All collections deleted:');
    console.log('   - Tenants');
    console.log('   - Users');
    console.log('   - Clients');
    console.log('   - Bookings');
    console.log('   - Services');
    console.log('   - Communications');
    console.log('   - Marketing');
    console.log('   - Materials');
    console.log('   - Audit Logs');
    console.log('   - Two Factor Auth');
    console.log('   - All other data');
    console.log('\n🎉 App is now fresh - ready for first signup!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    process.exit(1);
  }
}

cleanDatabase();
