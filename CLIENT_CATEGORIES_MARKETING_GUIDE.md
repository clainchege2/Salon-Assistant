
# 📊 Client Categories - Marketing Guide

## Overview

Hairvia automatically categorizes clients based on their visit patterns and spending behavior. Each category represents a unique marketing opportunity and requires a tailored approach.

---

## 🎯 Client Categories

### ✨ New Clients
**Definition:** First-time visitors (0 visits)

**Marketing Insight:** *"First-time client - Build lasting relationship"*

**Strategy:**
- **Goal:** Convert to regular clients
- **Focus:** Exceptional first impression
- **Actions:**
  - Welcome message after first visit
  - Follow-up within 48 hours
  - Ask for feedback
  - Offer second-visit discount (10-15%)
  - Request social media follow

**Messaging:**
```
"Welcome to [Salon Name]! 🎉 We're thrilled to have you. 
How was your experience? Reply and get 10% off your next visit!"
```

**Success Metric:** 60%+ return within 30 days

---

### ⭐ VIP Clients
**Definition:** High-value clients (10+ visits OR KES 50,000+ spent)

**Marketing Insight:** *"High-value client - Premium service priority"*

**Strategy:**
- **Goal:** Retain and delight
- **Focus:** Premium treatment and exclusivity
- **Actions:**
  - Priority booking slots
  - Birthday/anniversary gifts
  - Exclusive early access to new services
  - Personal stylist assignment
  - VIP-only promotions
  - Referral rewards (they bring quality clients)

**Messaging:**
```
"Hi [Name]! 💎 As our VIP client, you get first access to our 
new Silk Press service. Book your exclusive slot today!"
```

**Success Metric:** 90%+ retention rate

---

### 👤 Regular Clients
**Definition:** Consistent visitors (3-9 visits, active within 90 days)

**Marketing Insight:** *"Regular client - Consistent engagement"*

**Strategy:**
- **Goal:** Maintain loyalty and increase frequency
- **Focus:** Consistency and appreciation
- **Actions:**
  - Regular appointment reminders
  - Seasonal promotions
  - Loyalty points/rewards
  - Service recommendations based on history
  - Birthday wishes

**Messaging:**
```
"Hi [Name]! ✨ It's been a while since your last visit. 
Ready for your next fabulous look? Book now and earn double points!"
```

**Success Metric:** Visit every 4-6 weeks

---

### 💤 Win-Back Clients (Longtime-No-See)
**Definition:** Inactive clients (90+ days since last visit)

**Marketing Insight:** *"Re-engagement opportunity - Win them back"*

**Strategy:**
- **Goal:** Reactivate and understand why they left
- **Focus:** Win-back campaigns
- **Actions:**
  - "We miss you" message
  - Special comeback offer (20-25% discount)
  - Survey to understand absence
  - Showcase new services/improvements
  - Limited-time urgency

**Messaging:**
```
"We miss you, [Name]! 💜 It's been a while. Come back and 
enjoy 20% off any service. Valid for 2 weeks only!"
```

**Success Metric:** 30%+ reactivation rate

---

## 📈 Automatic Categorization Rules

### How It Works
```javascript
if (totalVisits === 0) {
  category = 'new'
} else if (totalVisits >= 10 OR totalSpent >= 50000) {
  category = 'vip'
} else if (daysSinceLastVisit > 90) {
  category = 'longtime-no-see'
} else if (totalVisits >= 3) {
  category = 'usual'
}
```

### Category Transitions
- **New → Regular:** After 3rd visit
- **Regular → VIP:** After 10th visit or KES 50K spent
- **Any → Win-Back:** After 90 days of inactivity
- **Win-Back → Regular:** After successful reactivation

---

## 💡 Marketing Campaign Ideas by Category

### For New Clients
1. **Welcome Series**
   - Day 1: Thank you message
   - Day 3: Feedback request
   - Day 7: Second visit offer

2. **First Impression Campaign**
   - Professional service photos
   - Stylist introduction
   - Service menu showcase

### For VIP Clients
1. **Exclusive Access**
   - New service previews
   - Private events
   - Seasonal lookbooks

2. **Appreciation Campaign**
   - Birthday month specials
   - Anniversary rewards
   - Referral bonuses

### For Regular Clients
1. **Loyalty Program**
   - Points per visit
   - Milestone rewards
   - Member-only discounts

2. **Seasonal Campaigns**
   - Holiday specials
   - Back-to-school looks
   - Wedding season packages

### For Win-Back Clients
1. **We Miss You Campaign**
   - Personalized message
   - Comeback discount
   - What's new showcase

2. **Reactivation Series**
   - Week 1: Soft reminder
   - Week 2: Special offer
   - Week 3: Last chance urgency

---

## 📊 Success Metrics by Category

| Category | Target Retention | Avg Visit Frequency | Avg Spend |
|----------|-----------------|---------------------|-----------|
| New | 60% return | 1 visit | Varies |
| VIP | 90%+ | Every 3-4 weeks | KES 5,000+ |
| Regular | 80% | Every 4-6 weeks | KES 3,000+ |
| Win-Back | 30% reactivation | - | Varies |

---

## 🎯 Quick Action Guide

### When You See a New Client
✅ Provide exceptional service
✅ Collect complete profile info
✅ Send welcome message
✅ Schedule follow-up

### When You See a VIP Client
✅ Greet by name
✅ Offer premium treatment
✅ Ask about preferences
✅ Suggest new services

### When You See a Regular Client
✅ Acknowledge loyalty
✅ Maintain consistency
✅ Reward with points
✅ Ask for referrals

### When You See a Win-Back Client
✅ Welcome them back warmly
✅ Ask about their absence (gently)
✅ Showcase improvements
✅ Offer comeback incentive

---

## 💬 Sample Messages by Category

### New Client Welcome
```
Hi [Name]! 🌟 Thank you for choosing [Salon]! 
We hope you loved your [Service]. Share your 
experience and get 10% off next time! 💜
```

### VIP Appreciation
```
[Name], you're a VIP! 💎 Enjoy priority booking 
and exclusive access to our new services. 
You deserve the best! ✨
```

### Regular Client Reminder
```
Hi [Name]! ⏰ Time for your next appointment? 
Book now and keep your fabulous look fresh! 
Your usual stylist is available. 💇
```

### Win-Back Offer
```
We miss you, [Name]! 💜 Come back within 2 weeks 
and enjoy 20% OFF any service. Let's get you 
looking fabulous again! Limited time only! ⏳
```

---

## 🚀 Implementation Tips

1. **Review Categories Weekly**
   - Check new VIPs
   - Identify win-back opportunities
   - Celebrate new client conversions

2. **Personalize Communications**
   - Use client names
   - Reference past services
   - Acknowledge milestones

3. **Track Campaign Performance**
   - Open rates
   - Response rates
   - Conversion rates
   - ROI per category

4. **Adjust Strategies**
   - Test different offers
   - Optimize timing
   - Refine messaging

---

## 📱 Using Categories in Hairvia

### In Client List
- Filter by category
- See marketing insights
- Quick action buttons

### In Reports
- Category distribution
- Revenue by category
- Retention rates

### In Communications
- Target specific categories
- Personalized campaigns
- Automated triggers

---

## 🎓 Best Practices

1. **Don't Over-Message**
   - VIPs: Monthly updates
   - Regular: Bi-weekly reminders
   - New: Welcome series only
   - Win-Back: One campaign per quarter

2. **Respect Preferences**
   - Honor communication channels
   - Respect opt-outs
   - Time messages appropriately

3. **Measure Everything**
   - Track response rates
   - Monitor conversions
   - Calculate ROI

4. **Continuously Improve**
   - A/B test messages
   - Gather feedback
   - Refine strategies

---

## 🏆 Success Stories

### Example 1: VIP Retention
*"By offering VIP clients priority booking and exclusive previews, 
we increased retention from 75% to 92% in 3 months."*

### Example 2: Win-Back Campaign
*"Our 'We Miss You' campaign with 20% off reactivated 35% of 
inactive clients, generating KES 180,000 in recovered revenue."*

### Example 3: New Client Conversion
*"Welcome series with second-visit discount converted 68% of 
new clients to regulars within 30 days."*

---

**Remember:** Every client category is an opportunity. 
Use these insights to build lasting relationships and grow your business! 💜
