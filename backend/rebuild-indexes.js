require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const Client = require('./src/models/Client');

async function rebuildIndexes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🔨 Rebuilding indexes...\n');

    // Drop and rebuild Tenant indexes
    console.log('📋 Tenant model:');
    await Tenant.collection.dropIndexes();
    await Tenant.syncIndexes();
    const tenantIndexes = await Tenant.collection.getIndexes();
    console.log('  Indexes:', Object.keys(tenantIndexes).join(', '));

    // Drop and rebuild User indexes
    console.log('\n👤 User model:');
    await User.collection.dropIndexes();
    await User.syncIndexes();
    const userIndexes = await User.collection.getIndexes();
    console.log('  Indexes:', Object.keys(userIndexes).join(', '));

    // Drop and rebuild Client indexes
    console.log('\n👥 Client model:');
    await Client.collection.dropIndexes();
    await Client.syncIndexes();
    const clientIndexes = await Client.collection.getIndexes();
    console.log('  Indexes:', Object.keys(clientIndexes).join(', '));

    console.log('\n✅ All indexes rebuilt successfully!');
    console.log('\n📊 Unique Constraints Applied:');
    console.log('  • Tenant: contactEmail, contactPhone, slug');
    console.log('  • User: email, phone');
    console.log('  • Client: email (sparse), phone');
    
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error rebuilding indexes:', error.message);
    process.exit(1);
  }
}

rebuildIndexes();
