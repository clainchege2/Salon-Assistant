const Client = require('../models/Client');
const Booking = require('../models/Booking');

/**
 * RFM Analysis Service
 * Calculates Recency, Frequency, Monetary scores for client segmentation
 */

// RFM Segments matching Client model enum
const RFM_SEGMENTS = {
  champions: { 
    r: [4, 5], f: [4, 5], m: [4, 5], 
    description: 'Champions - Best customers',
    action: 'Reward with loyalty perks, priority booking'
  },
  loyal: { 
    r: [3, 5], f: [4, 5], m: [3, 5], 
    description: 'Loyal Customers - Regular high-value clients',
    action: 'Upsell premium services, VIP treatment'
  },
  potentialLoyalist: { 
    r: [4, 5], f: [2, 3], m: [2, 4], 
    description: 'Potential Loyalists - Recent customers with potential',
    action: 'Build relationship, offer membership'
  },
  newCustomers: { 
    r: [4, 5], f: [1, 2], m: [1, 3], 
    description: 'New Customers - Recently joined',
    action: 'Welcome offers, build loyalty'
  },
  promising: { 
    r: [3, 4], f: [1, 2], m: [1, 2], 
    description: 'Promising - Recent shoppers with potential',
    action: 'Engage with offers, build frequency'
  },
  needAttention: { 
    r: [2, 3], f: [2, 3], m: [2, 3], 
    description: 'Need Attention - Average customers slipping',
    action: 'Re-engage with targeted offers'
  },
  aboutToSleep: { 
    r: [2, 3], f: [1, 2], m: [1, 2], 
    description: 'About to Sleep - Below average, declining',
    action: 'Reactivation campaigns'
  },
  atRisk: { 
    r: [1, 2], f: [3, 5], m: [3, 5], 
    description: 'At Risk - Good clients going inactive',
    action: 'Win-back campaigns, special offers'
  },
  cantLoseThem: { 
    r: [1, 2], f: [4, 5], m: [4, 5], 
    description: 'Can\'t Lose Them - High-value clients at risk',
    action: 'Urgent win-back, personal outreach'
  },
  hibernating: { 
    r: [1, 2], f: [2, 3], m: [2, 3], 
    description: 'Hibernating - Inactive but had value',
    action: 'Reactivation with strong incentives'
  },
  lost: { 
    r: [1, 2], f: [1, 2], m: [1, 2], 
    description: 'Lost - Inactive low-value',
    action: 'Ignore or minimal effort'
  }
};

/**
 * Calculate RFM scores for a single client
 */
exports.calculateClientRFM = async (client, tenantClients = null) => {
  const now = new Date();
  
  // Calculate Recency (days since last visit)
  const daysSinceLastVisit = client.lastVisit 
    ? Math.floor((now - client.lastVisit) / (1000 * 60 * 60 * 24))
    : 999;
  
  // Calculate Frequency (visits per month)
  const daysSinceFirst = client.firstVisit
    ? Math.floor((now - client.firstVisit) / (1000 * 60 * 60 * 24))
    : 1;
  const monthsSinceFirst = Math.max(daysSinceFirst / 30, 1);
  const visitFrequency = client.totalVisits / monthsSinceFirst;
  
  // Calculate Monetary (average spend per visit)
  const averageSpend = client.totalVisits > 0 
    ? client.totalSpent / client.totalVisits 
    : 0;
  
  // Get all clients for percentile calculation if not provided
  if (!tenantClients) {
    tenantClients = await Client.find({ tenantId: client.tenantId });
  }
  
  // Calculate percentile scores (1-5)
  const recencyScore = calculatePercentileScore(
    daysSinceLastVisit,
    tenantClients.map(c => {
      return c.lastVisit ? Math.floor((now - c.lastVisit) / (1000 * 60 * 60 * 24)) : 999;
    }),
    true // Lower is better for recency
  );
  
  const frequencyScore = calculatePercentileScore(
    client.totalVisits,
    tenantClients.map(c => c.totalVisits)
  );
  
  const monetaryScore = calculatePercentileScore(
    client.totalSpent,
    tenantClients.map(c => c.totalSpent)
  );
  
  // Combined RFM score
  const rfmCombined = recencyScore + frequencyScore + monetaryScore;
  
  // Determine segment
  const segment = determineSegment(recencyScore, frequencyScore, monetaryScore);
  
  // Calculate lifecycle stage
  const lifecycleStage = determineLifecycleStage(client, daysSinceLastVisit);
  
  // Calculate churn risk
  const churnRisk = calculateChurnRisk(client, daysSinceLastVisit, visitFrequency);
  
  // Calculate predicted lifetime value
  const predictedLTV = calculatePredictedLTV(client, visitFrequency, averageSpend);
  
  return {
    rfmScores: {
      recency: recencyScore,
      frequency: frequencyScore,
      monetary: monetaryScore,
      combined: rfmCombined,
      segment,
      lastCalculated: now
    },
    metrics: {
      daysSinceLastVisit,
      visitFrequency: Math.round(visitFrequency * 10) / 10,
      averageSpend: Math.round(averageSpend)
    },
    lifecycle: {
      stage: lifecycleStage,
      churnRisk,
      predictedLTV: Math.round(predictedLTV)
    }
  };
};

/**
 * Calculate percentile score (1-5) based on value distribution
 */
function calculatePercentileScore(value, allValues, lowerIsBetter = false) {
  const sorted = allValues.filter(v => v !== null && v !== undefined).sort((a, b) => a - b);
  if (sorted.length === 0) return 3;
  
  const percentile = sorted.filter(v => v <= value).length / sorted.length;
  
  let score;
  if (lowerIsBetter) {
    // For recency, lower days = better score
    if (percentile <= 0.2) score = 5;
    else if (percentile <= 0.4) score = 4;
    else if (percentile <= 0.6) score = 3;
    else if (percentile <= 0.8) score = 2;
    else score = 1;
  } else {
    // For frequency and monetary, higher = better score
    if (percentile >= 0.8) score = 5;
    else if (percentile >= 0.6) score = 4;
    else if (percentile >= 0.4) score = 3;
    else if (percentile >= 0.2) score = 2;
    else score = 1;
  }
  
  return score;
}

/**
 * Determine RFM segment based on scores
 */
function determineSegment(r, f, m) {
  // Champions: Best customers - recent, frequent, high spending
  if (r >= 4 && f >= 4 && m >= 4) return 'champions';
  
  // Loyal: Regular high-value clients
  if (r >= 3 && f >= 4 && m >= 3) return 'loyal';
  
  // Can't Lose Them: High-value but haven't returned recently
  if (r <= 2 && f >= 4 && m >= 4) return 'cantLoseThem';
  
  // At Risk: Were good, now inactive
  if (r <= 2 && f >= 3 && m >= 3) return 'atRisk';
  
  // Potential Loyalists: Recent with good potential
  if (r >= 4 && f >= 2 && f <= 3) return 'potentialLoyalist';
  
  // New Customers: Recent but low frequency
  if (r >= 4 && f <= 2 && m <= 3) return 'newCustomers';
  
  // Promising: Recent shoppers
  if (r >= 3 && f <= 2 && m <= 2) return 'promising';
  
  // Need Attention: Average customers slipping
  if (r >= 2 && r <= 3 && f >= 2 && f <= 3) return 'needAttention';
  
  // About to Sleep: Below average
  if (r >= 2 && r <= 3 && f <= 2) return 'aboutToSleep';
  
  // Hibernating: Inactive but had some value
  if (r <= 2 && f >= 2 && f <= 3) return 'hibernating';
  
  // Lost: Inactive low-value
  return 'lost';
}

/**
 * Determine lifecycle stage
 */
function determineLifecycleStage(client, daysSinceLastVisit) {
  if (client.totalVisits === 0) return 'prospect';
  if (client.totalVisits === 1) return 'new';
  
  if (daysSinceLastVisit > 180) return 'churned';
  if (daysSinceLastVisit > 90) return 'at-risk';
  if (daysSinceLastVisit <= 30 && client.totalVisits >= 3) return 'active';
  
  return 'active';
}

/**
 * Calculate churn risk (0-100)
 */
function calculateChurnRisk(client, daysSinceLastVisit, visitFrequency) {
  let risk = 0;
  
  // Recency factor (0-40 points)
  if (daysSinceLastVisit > 180) risk += 40;
  else if (daysSinceLastVisit > 90) risk += 30;
  else if (daysSinceLastVisit > 60) risk += 20;
  else if (daysSinceLastVisit > 30) risk += 10;
  
  // Frequency factor (0-30 points)
  if (visitFrequency < 0.5) risk += 30; // Less than once per 2 months
  else if (visitFrequency < 1) risk += 20;
  else if (visitFrequency < 2) risk += 10;
  
  // Engagement trend (0-30 points)
  if (client.totalVisits === 1) risk += 20;
  else if (client.totalVisits === 2) risk += 10;
  
  return Math.min(risk, 100);
}

/**
 * Calculate predicted lifetime value
 */
function calculatePredictedLTV(client, visitFrequency, averageSpend) {
  // Assume 2-year customer lifetime
  const monthsRemaining = 24;
  const expectedVisits = visitFrequency * monthsRemaining;
  const predictedRevenue = expectedVisits * averageSpend;
  
  // Apply retention probability
  const retentionFactor = client.totalVisits >= 5 ? 0.8 : 0.5;
  
  return predictedRevenue * retentionFactor;
}

/**
 * Calculate RFM for all clients in a tenant
 */
exports.calculateTenantRFM = async (tenantId) => {
  const clients = await Client.find({ tenantId });
  const results = [];
  
  for (const client of clients) {
    const rfmData = await this.calculateClientRFM(client, clients);
    
    // Update client with RFM data
    client.rfmScores = rfmData.rfmScores;
    client.metrics = rfmData.metrics;
    client.lifecycle = rfmData.lifecycle;
    
    await client.save();
    results.push({ clientId: client._id, ...rfmData });
  }
  
  return results;
};

/**
 * Get segment distribution for a tenant
 */
exports.getSegmentDistribution = async (tenantId) => {
  const clients = await Client.find({ tenantId });
  
  const distribution = {};
  Object.keys(RFM_SEGMENTS).forEach(segment => {
    distribution[segment] = {
      count: 0,
      totalValue: 0,
      description: RFM_SEGMENTS[segment].description,
      action: RFM_SEGMENTS[segment].action
    };
  });
  
  clients.forEach(client => {
    const segment = client.rfmScores?.segment || 'lost';
    if (distribution[segment]) {
      distribution[segment].count++;
      distribution[segment].totalValue += client.totalSpent;
    }
  });
  
  return distribution;
};

module.exports = exports;
