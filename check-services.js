const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkServices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Service = require('./backend/src/models/Service');
    const Tenant = require('./backend/src/models/Tenant');
    const Client = require('./backend/src/models/Client');

    // Get all tenants
    const tenants = await Tenant.find();
    console.log('\n📊 Tenants:', tenants.length);
    tenants.forEach(t => {
      console.log(`  - ${t.businessName} (${t.slug}) - ID: ${t._id}`);
    });

    // Get all services
    const allServices = await Service.find();
    console.log('\n💅 Total Services:', allServices.length);
    
    // Group by tenant
    for (const tenant of tenants) {
      const services = await Service.find({ tenantId: tenant._id });
      console.log(`\n  ${tenant.businessName}:`);
      console.log(`    Total: ${services.length}`);
      console.log(`    Active: ${services.filter(s => s.isActive).length}`);
      console.log(`    Inactive: ${services.filter(s => !s.isActive).length}`);
      
      if (services.length > 0) {
        console.log('    Services:');
        services.forEach(s => {
          console.log(`      - ${s.name} (${s.isActive ? '✓ Active' : '✗ Inactive'}) - KES ${s.price}`);
        });
      }
    }

    // Check Geoffrey's client record
    console.log('\n👤 Checking Geoffrey...');
    const geoffrey = await Client.findOne({ firstName: 'Geoffrey' });
    if (geoffrey) {
      console.log(`  Found: ${geoffrey.firstName} ${geoffrey.lastName}`);
      console.log(`  Phone: ${geoffrey.phone}`);
      console.log(`  Tenant ID: ${geoffrey.tenantId}`);
      
      const tenant = await Tenant.findById(geoffrey.tenantId);
      if (tenant) {
        console.log(`  Salon: ${tenant.businessName}`);
        
        const services = await Service.find({ 
          tenantId: geoffrey.tenantId,
          isActive: true 
        });
        console.log(`  Available Services: ${services.length}`);
      }
    } else {
      console.log('  Geoffrey not found in database');
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkServices();
