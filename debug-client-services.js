const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function debugClientServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Service = require('./backend/src/models/Service');
    const Client = require('./backend/src/models/Client');
    const Tenant = require('./backend/src/models/Tenant');

    // Find Geoffrey
    const geoffrey = await Client.findOne({ firstName: 'Geoffrey' });
    if (!geoffrey) {
      console.log('❌ Geoffrey not found');
      process.exit(1);
    }

    console.log('👤 Geoffrey:');
    console.log(`   Name: ${geoffrey.firstName} ${geoffrey.lastName}`);
    console.log(`   Phone: ${geoffrey.phone}`);
    console.log(`   Tenant ID: ${geoffrey.tenantId}`);

    // Find Geoffrey's tenant
    const tenant = await Tenant.findById(geoffrey.tenantId);
    if (!tenant) {
      console.log('❌ Tenant not found');
      process.exit(1);
    }

    console.log(`\n🏢 Salon: ${tenant.businessName}`);
    console.log(`   Slug: ${tenant.slug}`);
    console.log(`   ID: ${tenant._id}`);

    // Find services for this tenant
    const allServices = await Service.find({ tenantId: tenant._id });
    const activeServices = await Service.find({ tenantId: tenant._id, isActive: true });

    console.log(`\n💅 Services for ${tenant.businessName}:`);
    console.log(`   Total: ${allServices.length}`);
    console.log(`   Active: ${activeServices.length}`);
    console.log(`   Inactive: ${allServices.length - activeServices.length}`);

    if (allServices.length > 0) {
      console.log('\n📋 All Services:');
      allServices.forEach(s => {
        console.log(`   ${s.isActive ? '✓' : '✗'} ${s.name} - KES ${s.price} - ${s.duration} mins - Active: ${s.isActive}`);
      });
    }

    // Check what the API would return
    console.log('\n🔍 What API would return:');
    console.log(`   Query: { tenantId: "${tenant._id}", isActive: true }`);
    console.log(`   Results: ${activeServices.length} services`);

    if (activeServices.length === 0 && allServices.length > 0) {
      console.log('\n⚠️  PROBLEM FOUND:');
      console.log('   Services exist but none are marked as active!');
      console.log('   Solution: Edit services in admin portal and check "Active"');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

debugClientServices();
