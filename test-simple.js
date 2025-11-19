// Simple test to check if server is working
const axios = require('axios');

async function test() {
  try {
    console.log('Testing health endpoint...');
    const health = await axios.get('http://localhost:5000/health');
    console.log('✓ Health check:', health.data);
    
    console.log('\nTesting login...');
    const login = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'owner@elitestyles.com',
      password: 'Password123!',
      tenantSlug: 'elite-styles-demo'
    });
    
    if (login.data.success) {
      console.log('✓ Login successful!');
      console.log('  Token:', login.data.token.substring(0, 20) + '...');
      console.log('  User:', login.data.user.firstName, login.data.user.lastName);
      console.log('  Tenant:', login.data.user.tenantId);
      
      // Test getting clients
      console.log('\nTesting clients endpoint...');
      const clients = await axios.get('http://localhost:5000/api/v1/clients', {
        headers: { Authorization: `Bearer ${login.data.token}` }
      });
      
      console.log('✓ Clients retrieved:', clients.data.count);
      console.log('  Rate Limit:', clients.headers['x-ratelimit-limit']);
      console.log('  Remaining:', clients.headers['x-ratelimit-remaining']);
      console.log('  Tier:', clients.headers['x-ratelimit-tier']);
      
    } else {
      console.log('✗ Login failed:', login.data.message);
    }
    
  } catch (error) {
    console.log('✗ Error:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.log('  Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

test();
