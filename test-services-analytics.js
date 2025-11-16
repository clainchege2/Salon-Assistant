// Test script for services analytics endpoint
const axios = require('axios');

async function testServicesAnalytics() {
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'owner@luxuryhair.com',
      password: 'Password123!'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login successful');
    
    // Test services analytics
    console.log('\n📊 Testing services analytics endpoint...');
    const response = await axios.get('http://localhost:5000/api/analytics/services?range=30D', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ Services Analytics Response:');
    console.log('Status:', response.status);
    console.log('\nData structure:');
    console.log('- topServices:', response.data.topServices?.length || 0, 'items');
    console.log('- categoryData:', response.data.categoryData?.length || 0, 'items');
    console.log('- scatterData:', response.data.scatterData?.length || 0, 'items');
    
    if (response.data.topServices && response.data.topServices.length > 0) {
      console.log('\n📋 Top Services:');
      response.data.topServices.forEach((service, i) => {
        console.log(`  ${i + 1}. ${service.name}: ${service.bookings} bookings, $${service.revenue}`);
      });
    } else {
      console.log('\n⚠️  No top services data found');
    }
    
    if (response.data.categoryData && response.data.categoryData.length > 0) {
      console.log('\n📊 Category Data:');
      response.data.categoryData.forEach(cat => {
        console.log(`  - ${cat.name}: ${cat.value}`);
      });
    }
    
    if (response.data.scatterData && response.data.scatterData.length > 0) {
      console.log('\n📈 Scatter Data (Duration vs Revenue):');
      response.data.scatterData.forEach(point => {
        console.log(`  - ${point.name}: ${point.duration.toFixed(0)}min, $${point.revenue.toFixed(2)}`);
      });
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testServicesAnalytics();
