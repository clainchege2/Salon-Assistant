const axios = require('axios');

async function testStylists() {
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
    
    // Test stylists analytics
    console.log('👨‍🎨 Testing Stylists Analytics API...');
    const stylistsResponse = await axios.get('http://localhost:5000/api/analytics/stylists?range=last3Months', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = stylistsResponse.data;
    console.log('\n✅ Stylists Data Retrieved:');
    console.log(`   Total Stylists: ${data.stylists?.length || 0}`);
    console.log(`   Avg Duration: ${data.avgDuration || 0} min`);
    console.log(`   Fastest: ${data.fastest?.name || 'N/A'} (${data.fastest?.time || 0} min)`);
    console.log(`   Slowest: ${data.slowest?.name || 'N/A'} (${data.slowest?.time || 0} min)`);
    console.log('\n📊 Stylist Leaderboard:');
    
    if (data.stylists && data.stylists.length > 0) {
      data.stylists
        .sort((a, b) => b.revenue - a.revenue)
        .forEach((s, i) => {
          console.log(`   ${i + 1}. ${s.name}`);
          console.log(`      Revenue: Ksh ${s.revenue?.toLocaleString() || 0}`);
          console.log(`      Bookings: ${s.bookings || 0}`);
          console.log(`      Rating: ⭐ ${s.rating?.toFixed(1) || 0}`);
          console.log(`      Avg Time: ${s.avgTime || 0} min`);
        });
    }
    
    console.log('\n🎉 Stylists API is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testStylists();
