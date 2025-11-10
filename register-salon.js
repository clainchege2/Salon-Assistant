const axios = require('axios');

async function registerSalon() {
  try {
    const response = await axios.post('http://localhost:5000/api/v1/auth/register', {
      businessName: "Kanywele Salon",
      email: "owner@kanywele.com",
      phone: "+254712345678",
      password: "SecurePass123!",
      firstName: "Jane",
      lastName: "Doe",
      country: "Kenya"
    });

    console.log('\n✅ Salon registered successfully!\n');
    console.log('📋 Login Details:');
    console.log('Email:', response.data.user.email);
    console.log('Tenant Slug:', response.data.user.tenantId);
    console.log('\n🔑 Token:', response.data.token);
    console.log('\n👉 Use these credentials to login at http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Registration failed:');
    console.error(error.response?.data || error.message);
  }
}

registerSalon();
