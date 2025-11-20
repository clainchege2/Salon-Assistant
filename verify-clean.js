require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');

async function verifyClean() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hairvia';
    await mongoose.connect(mongoUri);
    
    console.log('🔍 Checking database status...\n');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    if (collections.length === 0) {
      console.log('✅ DATABASE IS COMPLETELY CLEAN!');
      console.log('📊 No collections found');
      console.log('🎉 Ready for first signup!\n');
    } else {
      console.log('📋 Found collections:');
      for (const col of collections) {
        const count = await mongoose.connection.db.collection(col.name).countDocuments();
        console.log(`   - ${col.name}: ${count} documents`);
      }
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyClean();
