# Enhanced Client Model - Implementation Guide

## 🎯 Overview
This document outlines the upgraded Client model with comprehensive activity tracking for RFM analysis, segmentation, and predictive analytics.

---

## 📊 New Fields to Add to Client Model

### 1. Service Preferences & History
```javascript
servicePreferences: {
  favoriteServices: [{
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    serviceName: String,
    timesBooked: Number,
    lastBooked: Date,
    averageSpend: Number
  }],
  preferredStylist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  averageServiceDuration: Number,  // in minutes
  preferredTimeSlots: [{
    type: String,
    enum: ['morning', 'afternoon', 'evening']
  }],
  preferredDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  serviceHistory: [{
    serviceId: mongoose.Schema.Types.ObjectId,
    serviceName: String,
    date: Date,
    price: Number,
    stylistId: mongoose.Schema.Types.ObjectId
  }]
}
```

### 2. Financial Profile (for RFM - Monetary)
```javascript
financialProfile: {
  totalSpent: { type: Number, default: 0 },           // Lifetime value
  averageSpend: { type: Number, default: 0 },         // Per visit
  lastSpendAmount: { type: Number, default: 0 },      // Most recent
  highestSpend: { type: Number, default: 0 },         // Peak transaction
  lowestSpend: { type: Number, default: 0 },          // Minimum transaction
  spendingTrend: {
    type: String,
    enum: ['increasing', 'stable', 'decreasing', 'unknown'],
    default: 'unknown'
  },
  last3MonthsSpend: { type: Number, default: 0 },
  last6MonthsSpend: { type: Number, default: 0 },
  last12MonthsSpend: { type: Number, default: 0 },
  preferredPaymentMethod: {
    type: String,
    enum: ['cash', 'mpesa', 'card', 'bank-transfer']
  },
  outstandingBalance: { type: Number, default: 0 }
}
```

### 3. Visit History & Patterns (for RFM - Recency & Frequency)
```javascript
visitHistory: {
  totalVisits: { type: Number, default: 0 },
  firstVisit: Date,
  lastVisit: Date,
  secondLastVisit: Date,  // For trend analysis
  nextExpectedVisit: Date,  // Predicted
  
  // Frequency metrics
  visitsLast30Days: { type: Number, default: 0 },
  visitsLast60Days: { type: Number, default: 0 },
  visitsLast90Days: { type: Number, default: 0 },
  visitsLast6Months: { type: Number, default: 0 },
  visitsLast12Months: { type: Number, default: 0 },
  
  // Pattern analysis
  averageDaysBetweenVisits: { type: Number, default: 0 },
  visitFrequency: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'irregular'],
    default: 'irregular'
  },
  mostCommonVisitDay: String,  // 'monday', 'tuesday', etc.
  mostCommonVisitTime: String,  // 'morning', 'afternoon', 'evening'
  
  // Detailed visit log
  visits: [{
    date: Date,
    services: [String],
    totalAmount: Number,
    stylistId: mongoose.Schema.Types.ObjectId,
    duration: Number,
    bookingId: mongoose.Schema.Types.ObjectId
  }]
}
```

### 4. Behavioral Metrics
```javascript
behaviorMetrics: {
  // Booking behavior
  cancellationRate: { type: Number, default: 0 },      // % of cancelled bookings
  noShowRate: { type: Number, default: 0 },            // % of no-shows
  lateArrivalRate: { type: Number, default: 0 },       // % of late arrivals
  rebookingRate: { type: Number, default: 0 },         // % who rebook after visit
  advanceBookingDays: { type: Number, default: 0 },    // How far ahead they book
  
  // Reliability scores
  reliabilityScore: { type: Number, default: 100 },    // 0-100, decreases with cancellations
  punctualityScore: { type: Number, default: 100 },    // 0-100, decreases with late arrivals
  
  // Booking history
  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  cancelledBookings: { type: Number, default: 0 },
  noShowBookings: { type: Number, default: 0 },
  
  // Last actions
  lastBookingDate: Date,
  lastCancellationDate: Date,
  lastNoShowDate: Date
}
```

### 5. Engagement Metrics
```javascript
engagement: {
  // Communication engagement
  messagesSent: { type: Number, default: 0 },
  messagesResponded: { type: Number, default: 0 },
  responseRate: { type: Number, default: 0 },          // %
  averageResponseTime: { type: Number, default: 0 },   // hours
  lastMessageDate: Date,
  lastResponseDate: Date,
  
  // Referral activity
  referralsMade: { type: Number, default: 0 },
  successfulReferrals: { type: Number, default: 0 },   // Referrals who became clients
  referralValue: { type: Number, default: 0 },         // Total value from referrals
  
  // Feedback & reviews
  reviewsGiven: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },         // 1-5 stars
  lastReviewDate: Date,
  
  // Social media
  socialMediaEngagement: { type: Boolean, default: false },  // Tagged salon
  instagramMentions: { type: Number, default: 0 },
  
  // Loyalty program
  loyaltyPoints: { type: Number, default: 0 },
  loyaltyTier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  pointsEarned: { type: Number, default: 0 },
  pointsRedeemed: { type: Number, default: 0 }
}
```

### 6. Marketing Profile
```javascript
marketingProfile: {
  // Channel preferences
  bestChannelToReach: {
    type: String,
    enum: ['sms', 'whatsapp', 'email', 'phone'],
    default: 'sms'
  },
  bestTimeToContact: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    default: 'afternoon'
  },
  
  // Campaign engagement
  campaignsReceived: { type: Number, default: 0 },
  campaignsOpened: { type: Number, default: 0 },
  campaignsClicked: { type: Number, default: 0 },
  campaignsConverted: { type: Number, default: 0 },    // Led to booking
  
  // Response patterns
  respondsToBirthday: { type: Boolean, default: false },
  respondsToPromotions: { type: Boolean, default: false },
  respondsToWinBack: { type: Boolean, default: false },
  
  // Campaign history
  lastCampaignDate: Date,
  lastCampaignEngaged: Date,
  campaignResponseHistory: [{
    campaignId: mongoose.Schema.Types.ObjectId,
    campaignName: String,
    sentDate: Date,
    opened: Boolean,
    clicked: Boolean,
    converted: Boolean,
    bookingId: mongoose.Schema.Types.ObjectId
  }],
  
  // Preferences
  unsubscribed: { type: Boolean, default: false },
  unsubscribeDate: Date,
  doNotDisturb: { type: Boolean, default: false }
}
```

### 7. Segmentation & Risk
```javascript
segmentation: {
  // Current segment
  currentSegment: {
    type: String,
    enum: ['vip', 'loyal', 'new', 'at-risk', 'occasional', 'dormant'],
    default: 'new'
  },
  segmentSince: Date,
  previousSegment: String,
  segmentHistory: [{
    segment: String,
    startDate: Date,
    endDate: Date
  }],
  
  // RFM Scores (1-5, 5 is best)
  rfmScores: {
    recency: { type: Number, default: 5 },
    frequency: { type: Number, default: 1 },
    monetary: { type: Number, default: 1 },
    totalScore: { type: Number, default: 7 },
    lastCalculated: Date
  },
  
  // Churn risk
  churnRisk: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    },
    riskScore: { type: Number, default: 0 },           // 0-100
    daysSinceLastVisit: { type: Number, default: 0 },
    missedExpectedVisit: { type: Boolean, default: false },
    reasonForRisk: String,
    winBackAttempts: { type: Number, default: 0 },
    lastWinBackDate: Date,
    lastCalculated: Date
  },
  
  // Lifetime value
  lifetimeValue: {
    current: { type: Number, default: 0 },
    predicted12Months: { type: Number, default: 0 },
    predicted24Months: { type: Number, default: 0 },
    lastCalculated: Date
  }
}
```

### 8. Notes & History
```javascript
notes: [{
  text: String,
  createdBy: mongoose.Schema.Types.ObjectId,
  createdAt: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['general', 'service', 'complaint', 'compliment', 'preference']
  },
  private: { type: Boolean, default: false }  // Only visible to managers
}],

activityLog: [{
  action: String,  // 'booking_created', 'booking_cancelled', 'message_sent', etc.
  description: String,
  performedBy: mongoose.Schema.Types.ObjectId,
  timestamp: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed
}]
```

---

## 🔄 Auto-Calculation Methods

### Method 1: Update RFM Scores
```javascript
clientSchema.methods.calculateRFMScores = function() {
  const now = new Date();
  
  // Recency Score (1-5, 5 is best)
  const daysSinceLastVisit = this.visitHistory.lastVisit 
    ? Math.floor((now - this.visitHistory.lastVisit) / (1000 * 60 * 60 * 24))
    : 999;
  
  this.segmentation.rfmScores.recency = 
    daysSinceLastVisit <= 30 ? 5 :
    daysSinceLastVisit <= 60 ? 4 :
    daysSinceLastVisit <= 90 ? 3 :
    daysSinceLastVisit <= 180 ? 2 : 1;
  
  // Frequency Score (1-5, 5 is best)
  this.segmentation.rfmScores.frequency = 
    this.visitHistory.visitsLast90Days >= 4 ? 5 :
    this.visitHistory.visitsLast90Days === 3 ? 4 :
    this.visitHistory.visitsLast90Days === 2 ? 3 :
    this.visitHistory.visitsLast90Days === 1 ? 2 : 1;
  
  // Monetary Score (1-5, 5 is best)
  const avgSpend = this.financialProfile.averageSpend;
  this.segmentation.rfmScores.monetary = 
    avgSpend >= 5000 ? 5 :
    avgSpend >= 4000 ? 4 :
    avgSpend >= 3000 ? 3 :
    avgSpend >= 2000 ? 2 : 1;
  
  this.segmentation.rfmScores.totalScore = 
    this.segmentation.rfmScores.recency +
    this.segmentation.rfmScores.frequency +
    this.segmentation.rfmScores.monetary;
  
  this.segmentation.rfmScores.lastCalculated = now;
};
```

### Method 2: Assign Segment
```javascript
clientSchema.methods.assignSegment = function() {
  const { recency, frequency, monetary } = this.segmentation.rfmScores;
  const daysSinceLastVisit = this.segmentation.churnRisk.daysSinceLastVisit;
  const totalVisits = this.visitHistory.totalVisits;
  
  let newSegment;
  
  // VIP: High on all three
  if (recency >= 4 && frequency >= 4 && monetary >= 4) {
    newSegment = 'vip';
  }
  // At Risk: Was good, now declining
  else if (recency <= 2 && frequency >= 3 && monetary >= 3) {
    newSegment = 'at-risk';
  }
  // New: Recent but low frequency
  else if (totalVisits <= 3 && recency >= 3) {
    newSegment = 'new';
  }
  // Loyal: Consistent and recent
  else if (recency >= 3 && frequency >= 3) {
    newSegment = 'loyal';
  }
  // Occasional: Irregular pattern
  else if (frequency <= 2 && recency >= 2) {
    newSegment = 'occasional';
  }
  // Dormant: Long time no visit
  else if (recency === 1 || daysSinceLastVisit > 180) {
    newSegment = 'dormant';
  }
  else {
    newSegment = 'occasional';
  }
  
  // Update segment if changed
  if (newSegment !== this.segmentation.currentSegment) {
    this.segmentation.segmentHistory.push({
      segment: this.segmentation.currentSegment,
      startDate: this.segmentation.segmentSince,
      endDate: new Date()
    });
    this.segmentation.previousSegment = this.segmentation.currentSegment;
    this.segmentation.currentSegment = newSegment;
    this.segmentation.segmentSince = new Date();
  }
};
```

### Method 3: Calculate Churn Risk
```javascript
clientSchema.methods.calculateChurnRisk = function() {
  const now = new Date();
  const daysSinceLastVisit = this.visitHistory.lastVisit 
    ? Math.floor((now - this.visitHistory.lastVisit) / (1000 * 60 * 60 * 24))
    : 999;
  
  this.segmentation.churnRisk.daysSinceLastVisit = daysSinceLastVisit;
  
  // Calculate risk score (0-100)
  let riskScore = 0;
  
  // Days since last visit (40% weight)
  if (daysSinceLastVisit > 180) riskScore += 40;
  else if (daysSinceLastVisit > 120) riskScore += 30;
  else if (daysSinceLastVisit > 90) riskScore += 20;
  else if (daysSinceLastVisit > 60) riskScore += 10;
  
  // Missed expected visit (30% weight)
  if (this.visitHistory.nextExpectedVisit && now > this.visitHistory.nextExpectedVisit) {
    this.segmentation.churnRisk.missedExpectedVisit = true;
    riskScore += 30;
  }
  
  // Declining spend trend (20% weight)
  if (this.financialProfile.spendingTrend === 'decreasing') {
    riskScore += 20;
  }
  
  // Low engagement (10% weight)
  if (this.engagement.responseRate < 20) {
    riskScore += 10;
  }
  
  this.segmentation.churnRisk.riskScore = riskScore;
  this.segmentation.churnRisk.riskLevel = 
    riskScore >= 60 ? 'high' :
    riskScore >= 30 ? 'medium' : 'low';
  
  this.segmentation.churnRisk.lastCalculated = now;
};
```

---

## 🔄 Hooks & Triggers

### After Booking Completion
```javascript
// Update visit history
client.visitHistory.totalVisits += 1;
client.visitHistory.secondLastVisit = client.visitHistory.lastVisit;
client.visitHistory.lastVisit = new Date();

// Update financial profile
client.financialProfile.totalSpent += booking.totalPrice;
client.financialProfile.lastSpendAmount = booking.totalPrice;
client.financialProfile.averageSpend = 
  client.financialProfile.totalSpent / client.visitHistory.totalVisits;

// Recalculate metrics
client.calculateRFMScores();
client.assignSegment();
client.calculateChurnRisk();

await client.save();
```

---

## 📊 Indexes for Performance
```javascript
clientSchema.index({ 'segmentation.currentSegment': 1 });
clientSchema.index({ 'segmentation.churnRisk.riskLevel': 1 });
clientSchema.index({ 'visitHistory.lastVisit': 1 });
clientSchema.index({ 'visitHistory.nextExpectedVisit': 1 });
clientSchema.index({ 'financialProfile.totalSpent': -1 });
clientSchema.index({ 'segmentation.rfmScores.totalScore': -1 });
```

---

## 🚀 Implementation Steps

1. **Backup current database**
2. **Add new fields to Client model** (backward compatible)
3. **Create migration script** to populate existing clients
4. **Update booking completion hook** to update metrics
5. **Create scheduled job** to recalculate metrics daily
6. **Test with sample data**
7. **Deploy to production**

---

**This enhanced model enables:**
- Accurate RFM segmentation
- Churn prediction
- Lifetime value forecasting
- Personalized marketing
- Behavioral insights
- Predictive analytics
