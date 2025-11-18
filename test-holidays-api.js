const axios = require('axios');

async function testHolidaysAPI() {
  try {
    // First login to get token (Premium tier account)
    console.log('🔐 Logging in as owner@luxuryhair.com...');
    const loginResponse = await axios.post('http://localhost:5000/api/v1/auth/login', {
      tenantSlug: 'luxury-hair-demo',
      email: 'owner@luxuryhair.com',
      password: 'Password123!'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log('User:', loginResponse.data.user.firstName, loginResponse.data.user.lastName);
    console.log('Tenant:', loginResponse.data.tenant.businessName);
    console.log('Tier:', loginResponse.data.tenant.subscriptionTier);
    console.log('Country:', loginResponse.data.tenant.country || 'Not set');
    console.log('');
    
    // Test holidays endpoint
    console.log('🎉 Testing: GET /api/v1/marketing/holidays?type=suggestions');
    const holidaysResponse = await axios.get('http://localhost:5000/api/v1/marketing/holidays?type=suggestions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Holidays API Response:');
    console.log(JSON.stringify(holidaysResponse.data, null, 2));
    console.log('');
    console.log(`📅 Found ${holidaysResponse.data.data.length} upcoming holidays for ${holidaysResponse.data.country}`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.status, error.response?.statusText);
    console.error('Error data:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Detailed error:', error.response.data.error);
    }
  }
}

testHolidaysAPI();
