const mongoose = require('mongoose');
const MarketingCampaign = require('./src/models/MarketingCampaign');
const Salon = require('./src/models/Salon');

async function createTestMarketing() {
  try {
    await mongoose.connect('mongodb://localhost:27017/elegance-hair-salon-kenya');
    console.log('Connected to MongoDB');

    // Find both salons
    const salons = await Salon.find().limit(2);
    if (salons.length < 2) {
      console.log('Need at least 2 salons. Please run the multi-tenant test first.');
      process.exit(1);
    }

    console.log('Found salons:', salons.map(s => s.name));

    for (const salon of salons) {
      console.log(`\n📧 Creating marketing campaigns for ${salon.name}...`);
      
      const campaigns = [
        {
          name: `${salon.name} - Holiday Special`,
          description: 'Special holiday discount for loyal customers',
          type: 'email',
          targetSegment: 'regular',
          status: 'draft',
          template: {
            email: {
              subject: 'Holiday Special - 20% Off Your Next Visit!',
              htmlContent: `<h1>Happy Holidays from ${salon.name}!</h1><p>Enjoy 20% off your next appointment. Book now!</p>`,
              textContent: `Happy Holidays from ${salon.name}! Enjoy 20% off your next appointment. Book now!`
            }
          },
          scheduling: {
            sendNow: false,
            scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            timezone: 'Africa/Nairobi'
          },
          salon: salon._id,
          createdBy: salon.name.includes('Test') ? 'Jane Doe' : 'John Smith',
          tags: ['holiday', 'discount']
        },
        {
          name: `${salon.name} - New Client Welcome`,
          description: 'Welcome message for new clients',
          type: 'both',
          targetSegment: 'new',
          status: 'scheduled',
          template: {
            email: {
              subject: `Welcome to ${salon.name}!`,
              htmlContent: `<h1>Welcome!</h1><p>Thank you for choosing ${salon.name}. We look forward to serving you!</p>`,
              textContent: `Welcome to ${salon.name}! Thank you for choosing us. We look forward to serving you!`
            },
            sms: {
              content: `Welcome to ${salon.name}! Thank you for your first visit. We hope you loved your experience!`
            }
          },
          scheduling: {
            sendNow: false,
            scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
            timezone: 'Africa/Nairobi'
          },
          salon: salon._id,
          createdBy: salon.name.includes('Test') ? 'Jane Doe' : 'John Smith',
          tags: ['welcome', 'new-client']
        },
        {
          name: `${salon.name} - Win Back Campaign`,
          description: 'Re-engage inactive clients',
          type: 'sms',
          targetSegment: 'inactive',
          status: 'sent',
          template: {
            sms: {
              content: `We miss you at ${salon.name}! Come back for a special 15% discount on any service. Valid until month end.`
            }
          },
          scheduling: {
            sendNow: true,
            timezone: 'Africa/Nairobi'
          },
          sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Sent a week ago
          salon: salon._id,
          createdBy: salon.name.includes('Test') ? 'Jane Doe' : 'John Smith',
          tags: ['win-back', 'discount']
        }
      ];

      // Insert campaigns
      for (const campaignData of campaigns) {
        const campaign = new MarketingCampaign(campaignData);
        await campaign.save();
      }
      
      console.log(`✅ Created ${campaigns.length} marketing campaigns for ${salon.name}`);
    }

    // Verify the data isolation
    console.log('\n🔍 Verifying marketing campaign isolation...');
    
    for (const salon of salons) {
      const salonCampaigns = await MarketingCampaign.find({ salon: salon._id });
      console.log(`${salon.name}: ${salonCampaigns.length} campaigns`);
    }

    console.log('\n🎉 Test marketing campaigns created successfully!');
    console.log('Now each salon should see only their own campaigns.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create test marketing campaigns:', error);
    process.exit(1);
  }
}

createTestMarketing();