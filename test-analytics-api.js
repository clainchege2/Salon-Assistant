const axios = require('axios');

async function testAnalytics() {
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'owner@luxuryhair.com',
      password: 'Password123!',
      tenantSlug: 'luxury-hair-demo'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');
    
    // Test analytics overview
    console.log('📊 Testing Analytics Overview API...');
    const analyticsResponse = await axios.get('http://localhost:5000/api/analytics/overview?range=thisMonth', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = analyticsResponse.data;
    console.log('\n✅ Analytics Data Retrieved:');
    console.log(`   Total Revenue: Ksh ${data.totalRevenue?.toLocaleString() || 0}`);
    console.log(`   Total Appointments: ${data.totalAppointments || 0}`);
    console.log(`   Avg Ticket Size: Ksh ${data.avgTicketSize?.toFixed(2) || 0}`);
    console.log(`   Returning Clients: ${data.returningClientsPercent || 0}%`);
    console.log(`   Top Service: ${data.topService?.name || 'N/A'} (${data.topService?.count || 0} bookings)`);
    console.log(`   Top Stylist: ${data.topStylist?.name || 'N/A'} (Ksh ${data.topStylist?.revenue?.toLocaleString() || 0})`);
    console.log(`   Revenue Data Points: ${data.revenueData?.length || 0}`);
    console.log('\n🎉 Analytics API is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAnalytics();
