/**
 * Diagnose why dashboard is stuck on "Loading..."
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api/v1';

async function diagnose() {
  try {
    console.log('=== Diagnosing Dashboard Loading Issue ===\n');
    
    // Step 1: Login
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'owner@elitestyles.com',
      password: 'Password123!',
      tenantSlug: 'elite-styles-demo'
    });
    
    const token = loginResponse.data.token;
    const tenantId = loginResponse.data.user.tenantId;
    console.log('✓ Login successful');
    console.log(`  Tenant: ${tenantId}`);
    console.log(`  User: ${loginResponse.data.user.firstName} ${loginResponse.data.user.lastName}\n`);
    
    // Step 2: Test all dashboard API calls
    const endpoints = [
      { name: 'Bookings', url: '/bookings' },
      { name: 'Clients', url: '/clients' },
      { name: 'Services', url: '/services' },
      { name: 'Staff (Admin)', url: '/admin/staff' },
      { name: 'Analytics', url: '/analytics/overview' },
      { name: 'Messages', url: '/messages' },
      { name: 'Tenant Info', url: `/tenants/${tenantId}` }
    ];
    
    console.log('2. Testing dashboard API endpoints...\n');
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:5000/api${endpoint.url}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`✓ ${endpoint.name}: ${response.status}`);
        console.log(`  Data count: ${response.data.count || response.data.data?.length || 'N/A'}`);
        console.log(`  Rate Limit: ${response.headers['x-ratelimit-remaining']}/${response.headers['x-ratelimit-limit']}`);
      } catch (error) {
        console.log(`✗ ${endpoint.name}: ${error.response?.status || 'ERROR'}`);
        console.log(`  Error: ${error.response?.data?.message || error.message}`);
        console.log(`  Details:`, error.response?.data);
      }
      console.log('');
    }
    
    console.log('=== Diagnosis Complete ===');
    
  } catch (error) {
    console.log('✗ Diagnosis failed:', error.message);
    if (error.response) {
      console.log('  Status:', error.response.status);
      console.log('  Data:', error.response.data);
    }
  }
}

diagnose();
