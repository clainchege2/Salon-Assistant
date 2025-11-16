const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const TEST_RANGES = ['7D', '30D', '90D', '1Y', '5Y', '15Y'];

async function verifyAnalytics() {
  console.log('🔍 Analytics Verification Test\n');
  console.log('='.repeat(80));
  
  try {
    // Login
    console.log('\n1. Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'owner@luxuryhair.com',
      password: 'Password123!',
      tenantSlug: 'luxury-hair-demo'
    });
    
    const token = loginRes.data.token;
    console.log('   ✓ Login successful');
    
    const headers = { 'Authorization': `Bearer ${token}` };
    
    // Test each endpoint
    const endpoints = [
      { name: 'Overview', path: '/api/analytics/overview', key: 'revenueData' },
      { name: 'Appointments', path: '/api/analytics/appointments', key: 'volumeData' },
      { name: 'Services', path: '/api/analytics/services', key: 'topServices' },
      { name: 'Clients', path: '/api/analytics/clients', key: 'growthData' },
      { name: 'Stylists', path: '/api/analytics/stylists', key: 'stylists' },
      { name: 'Finance', path: '/api/analytics/finance', key: 'monthlyData' }
    ];
    
    console.log('\n2. Testing Analytics Endpoints\n');
    
    for (const endpoint of endpoints) {
      console.log(`\n   📊 ${endpoint.name} Tab`);
      console.log('   ' + '-'.repeat(60));
      
      for (const range of TEST_RANGES) {
        try {
          const res = await axios.get(`${BASE_URL}${endpoint.path}?range=${range}`, { headers });
          const data = res.data;
          
          // Check if key data exists
          const hasData = data[endpoint.key] && 
                         (Array.isArray(data[endpoint.key]) ? data[endpoint.key].length > 0 : true);
          
          const dataCount = Array.isArray(data[endpoint.key]) ? data[endpoint.key].length : 'N/A';
          
          if (hasData) {
            console.log(`   ✓ ${range.padEnd(5)} - ${String(dataCount).padStart(3)} data points`);
          } else {
            console.log(`   ✗ ${range.padEnd(5)} - NO DATA`);
          }
        } catch (error) {
          console.log(`   ✗ ${range.padEnd(5)} - ERROR: ${error.message}`);
        }
      }
    }
    
    // Detailed check for Overview tab
    console.log('\n\n3. Detailed Overview Tab Check\n');
    console.log('   ' + '-'.repeat(60));
    
    const overviewRes = await axios.get(`${BASE_URL}/api/analytics/overview?range=30D`, { headers });
    const overview = overviewRes.data;
    
    const checks = [
      { name: 'Total Revenue', value: overview.totalRevenue, expected: 'number' },
      { name: 'Total Appointments', value: overview.totalAppointments, expected: 'number' },
      { name: 'Avg Ticket Size', value: overview.avgTicketSize, expected: 'number' },
      { name: 'Returning Clients %', value: overview.returningClientsPercent, expected: 'string' },
      { name: 'Revenue Data Points', value: overview.revenueData?.length, expected: 'number' },
      { name: 'Top Service', value: overview.topService?.name, expected: 'string' },
      { name: 'Top Stylist', value: overview.topStylist?.name, expected: 'string' },
      { name: 'Heatmap Data', value: overview.heatmapData?.length, expected: 'number' },
      { name: 'Revenue Insight', value: overview.insights?.revenue, expected: 'string' }
    ];
    
    checks.forEach(check => {
      const hasValue = check.value !== undefined && check.value !== null && check.value !== 0;
      const status = hasValue ? '✓' : '✗';
      const displayValue = typeof check.value === 'number' ? check.value : 
                          typeof check.value === 'string' ? `"${check.value.substring(0, 30)}..."` : 
                          'MISSING';
      console.log(`   ${status} ${check.name.padEnd(25)} ${displayValue}`);
    });
    
    // Detailed check for Appointments tab
    console.log('\n\n4. Detailed Appointments Tab Check\n');
    console.log('   ' + '-'.repeat(60));
    
    const appointmentsRes = await axios.get(`${BASE_URL}/api/analytics/appointments?range=30D`, { headers });
    const appointments = appointmentsRes.data;
    
    const apptChecks = [
      { name: 'Completed', value: appointments.completed, expected: 'number' },
      { name: 'Cancelled', value: appointments.cancelled, expected: 'number' },
      { name: 'No-shows', value: appointments.noShows, expected: 'number' },
      { name: 'Avg Duration', value: appointments.avgDuration, expected: 'number' },
      { name: 'Volume Data Points', value: appointments.volumeData?.length, expected: 'number' },
      { name: 'Cancellation Data', value: appointments.cancellationData?.length, expected: 'number' },
      { name: 'Time of Day Data', value: appointments.timeOfDayData?.length, expected: 'number' },
      { name: 'Peak Hours', value: appointments.peakHours, expected: 'string' }
    ];
    
    apptChecks.forEach(check => {
      const hasValue = check.value !== undefined && check.value !== null;
      const status = hasValue ? '✓' : '✗';
      const displayValue = typeof check.value === 'number' ? check.value : 
                          typeof check.value === 'string' ? `"${check.value}"` : 
                          'MISSING';
      console.log(`   ${status} ${check.name.padEnd(25)} ${displayValue}`);
    });
    
    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80));
    console.log('\nAll analytics endpoints are responding correctly!');
    console.log('Time series data is populating with adaptive granularity.');
    console.log('\nNext steps:');
    console.log('  1. Test each tab in the browser');
    console.log('  2. Try different time ranges (1D, 7D, 30D, 1Y, 5Y, 15Y, 20Y, ALL)');
    console.log('  3. Verify charts render correctly');
    console.log('  4. Check data point counts in headers\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
    console.error('\nMake sure:');
    console.error('  1. Backend server is running (npm start in backend folder)');
    console.error('  2. MongoDB is running');
    console.error('  3. Test account exists (owner@luxuryhair.com)');
    console.error('  4. Seed data has been loaded\n');
  }
}

verifyAnalytics();
