const Marketing = require('../models/Marketing');
const Client = require('../models/Client');
const logger = require('../config/logger');

exports.getAllCampaigns = async (req, res) => {
  try {
    const { status, type } = req.query;
    
    const filter = { tenantId: req.tenantId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const campaigns = await Marketing.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort('-createdAt');

    res.json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    logger.error(`Get campaigns error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getCampaign = async (req, res) => {
  try {
    const campaign = await Marketing.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    }).populate('createdBy', 'firstName lastName');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    logger.error(`Get campaign error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.createCampaign = async (req, res) => {
  try {
    const campaign = await Marketing.create({
      ...req.body,
      tenantId: req.tenantId,
      createdBy: req.user._id
    });

    logger.info(`Campaign created: ${campaign._id} by user ${req.user._id}`);

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    logger.error(`Create campaign error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const campaign = await Marketing.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    logger.error(`Update campaign error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owners can delete campaigns'
      });
    }

    const campaign = await Marketing.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    logger.info(`Campaign deleted: ${campaign._id} by user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete campaign error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.sendCampaign = async (req, res) => {
  try {
    const campaign = await Marketing.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    if (campaign.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Campaign already sent'
      });
    }

    // Get target clients
    let targetClients = [];
    
    if (campaign.targetAudience.specificClients.length > 0) {
      targetClients = await Client.find({
        _id: { $in: campaign.targetAudience.specificClients },
        tenantId: req.tenantId
      });
    } else if (campaign.targetAudience.categories.includes('all')) {
      targetClients = await Client.find({ tenantId: req.tenantId });
    } else {
      targetClients = await Client.find({
        tenantId: req.tenantId,
        category: { $in: campaign.targetAudience.categories }
      });
    }

    // Filter by marketing consent
    const consentedClients = targetClients.filter(client => {
      if (campaign.channel === 'sms' || campaign.channel === 'both') {
        return client.marketingConsent?.sms;
      }
      return true;
    });

    // TODO: Implement actual SMS/email sending via Twilio/SendGrid
    // For now, just update the campaign status

    campaign.status = 'sent';
    campaign.sentAt = new Date();
    campaign.stats.totalSent = consentedClients.length;
    await campaign.save();

    logger.info(`Campaign sent: ${campaign._id} to ${consentedClients.length} clients`);

    res.json({
      success: true,
      message: `Campaign sent to ${consentedClients.length} clients`,
      data: campaign
    });
  } catch (error) {
    logger.error(`Send campaign error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


// Marketing Analytics - Simplified version
exports.getAnalytics = async (req, res) => {
  try {
    console.log('Getting analytics for tenant:', req.tenantId);
    
    // Get clients first
    const clients = await Client.find({ tenantId: req.tenantId });
    console.log('Found clients:', clients.length);
    
    // Count segments manually from client data - using new RFM segment names
    const segments = {
      champions: { count: 0, totalValue: 0, description: 'Champions - Best customers', action: 'Reward with loyalty perks, priority booking' },
      loyal: { count: 0, totalValue: 0, description: 'Loyal Customers - Regular high-value clients', action: 'Upsell premium services, VIP treatment' },
      potentialLoyalist: { count: 0, totalValue: 0, description: 'Potential Loyalists - Recent customers with potential', action: 'Build relationship, offer membership' },
      newCustomers: { count: 0, totalValue: 0, description: 'New Customers - Recently joined', action: 'Welcome offers, build loyalty' },
      promising: { count: 0, totalValue: 0, description: 'Promising - Recent shoppers with potential', action: 'Engage with offers, build frequency' },
      needAttention: { count: 0, totalValue: 0, description: 'Need Attention - Average customers slipping', action: 'Re-engage with targeted offers' },
      aboutToSleep: { count: 0, totalValue: 0, description: 'About to Sleep - Below average, declining', action: 'Reactivation campaigns' },
      atRisk: { count: 0, totalValue: 0, description: 'At Risk - Good clients going inactive', action: 'Win-back campaigns, special offers' },
      cantLoseThem: { count: 0, totalValue: 0, description: 'Can\'t Lose Them - High-value clients at risk', action: 'Urgent win-back, personal outreach' },
      hibernating: { count: 0, totalValue: 0, description: 'Hibernating - Inactive but had value', action: 'Reactivation with strong incentives' },
      lost: { count: 0, totalValue: 0, description: 'Lost - Inactive low-value', action: 'Ignore or minimal effort' }
    };
    
    // Count clients by segment if RFM calculated
    clients.forEach(client => {
      const segment = client.rfmScores?.segment;
      if (segment && segments[segment]) {
        segments[segment].count++;
        segments[segment].totalValue += client.totalSpent || 0;
      }
    });
    
    // Get campaign stats
    let campaigns = [];
    try {
      campaigns = await Marketing.find({ tenantId: req.tenantId });
    } catch (e) {
      console.log('No campaigns yet');
    }
    
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
    const totalSent = campaigns.reduce((sum, c) => sum + (c.stats?.totalSent || 0), 0);
    const totalRevenue = campaigns.reduce((sum, c) => sum + (c.performance?.revenue || 0), 0);
    
    // Get client stats
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.lifecycle?.stage === 'active').length;
    const atRiskClients = clients.filter(c => c.lifecycle?.churnRisk > 50).length;
    
    console.log('Sending analytics:', { totalClients, totalCampaigns });
    
    res.json({
      success: true,
      data: {
        segments,
        campaigns: {
          total: totalCampaigns,
          active: activeCampaigns,
          totalSent,
          totalRevenue
        },
        clients: {
          total: totalClients,
          active: activeClients,
          atRisk: atRiskClients
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Calculate RFM for all clients
exports.calculateRFM = async (req, res) => {
  try {
    logger.info(`Calculating RFM for tenant: ${req.tenantId}`);
    
    // Check if clients exist
    const clientCount = await Client.countDocuments({ tenantId: req.tenantId });
    logger.info(`Found ${clientCount} clients`);
    
    if (clientCount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No clients found. Add clients first.'
      });
    }
    
    const rfmService = require('../services/rfmService');
    const results = await rfmService.calculateTenantRFM(req.tenantId);
    
    logger.info(`RFM calculated for ${results.length} clients in tenant ${req.tenantId}`);
    
    res.json({
      success: true,
      message: `RFM scores calculated for ${results.length} clients`,
      data: results
    });
  } catch (error) {
    logger.error(`Calculate RFM error: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate RFM: ' + error.message
    });
  }
};

// Get clients by segment
exports.getSegmentClients = async (req, res) => {
  try {
    const { segment } = req.params;
    
    const clients = await Client.find({
      tenantId: req.tenantId,
      'rfmScores.segment': segment
    }).select('firstName lastName phone email totalSpent totalVisits lastVisit rfmScores');
    
    res.json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    logger.error(`Get segment clients error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get clients with special occasions (birthdays, anniversaries, holidays)
exports.getSpecialOccasionClients = async (req, res) => {
  try {
    const { occasion } = req.params;
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    let clients = [];
    
    if (occasion === 'birthday') {
      // Find clients with birthdays in the next 7 days
      const allClients = await Client.find({ 
        tenantId: req.tenantId,
        dateOfBirth: { $exists: true, $ne: null }
      }).select('firstName lastName phone email dateOfBirth');
      
      clients = allClients.filter(client => {
        if (!client.dateOfBirth) return false;
        
        const dob = new Date(client.dateOfBirth);
        const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        
        // Check if birthday is within next 7 days
        return thisYearBirthday >= today && thisYearBirthday <= nextWeek;
      });
    } else if (occasion === 'anniversary') {
      // Find clients with first visit anniversary in the next 7 days
      const allClients = await Client.find({ 
        tenantId: req.tenantId,
        firstVisit: { $exists: true, $ne: null }
      }).select('firstName lastName phone email firstVisit');
      
      clients = allClients.filter(client => {
        if (!client.firstVisit) return false;
        
        const firstVisit = new Date(client.firstVisit);
        const thisYearAnniversary = new Date(today.getFullYear(), firstVisit.getMonth(), firstVisit.getDate());
        
        // Check if anniversary is within next 7 days and at least 1 year has passed
        const yearsSince = today.getFullYear() - firstVisit.getFullYear();
        return yearsSince >= 1 && thisYearAnniversary >= today && thisYearAnniversary <= nextWeek;
      });
    } else if (occasion === 'holiday') {
      // For holidays, return all clients with marketing consent
      clients = await Client.find({ 
        tenantId: req.tenantId,
        'marketingConsent.sms': true
      }).select('firstName lastName phone email');
    }
    
    logger.info(`Found ${clients.length} clients for ${occasion} in tenant ${req.tenantId}`);
    
    res.json({
      success: true,
      count: clients.length,
      data: clients
    });
  } catch (error) {
    logger.error(`Get special occasion clients error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
