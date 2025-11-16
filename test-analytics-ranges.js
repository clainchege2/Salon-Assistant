const axios = require('axios');

// Test different time ranges
const ranges = ['1D', '7D', '30D', '90D', '180D', '1Y', '2Y', '3Y', '5Y', '10Y', '20Y'];

async function testAnalytics() {
  try {
    // First login to get token
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'owner@elitestyles.com',
      password: 'Password123!',
      tenantSlug: 'elite-styles-pro-1762621490356'
    });
    
    const token = loginRes.data.token;
    console.log('✓ Logged in successfully\n');
    
    // Test each range
    for (const range of ranges) {
      console.log(`Testing ${range}...`);
      const res = await axios.get(`http://localhost:5000/api/analytics/overview?range=${range}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = res.data;
      console.log(`  Revenue Data Points: ${data.revenueData?.length || 0}`);
      console.log(`  Total Revenue: $${data.totalRevenue?.toFixed(2) || 0}`);
      console.log(`  Total Appointments: ${data.totalAppointments || 0}`);
      
      if (data.revenueData && data.revenueData.length > 0) {
        console.log(`  First point: ${data.revenueData[0].date}`);
        console.log(`  Last point: ${data.revenueData[data.revenueData.length - 1].date}`);
      }
      console.log('');
    }
    
    console.log('✓ All ranges tested successfully');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAnalytics();
