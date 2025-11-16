# Emoji Consistency Guide

## Approved Emoji System

### Hair & Beauty Services
- **💇 Hair Services** (replaces ✂️ scissors)
  - Use for: Service revenue, hair-related features
  - Consistent across: Analytics, Services, Bookings

### Money & Finance
- **💰 Money Bag** - Total revenue, earnings, financial metrics
- **💵 Dollar Bill** - Tips, cash payments, specific amounts
- **💳 Credit Card** - Payment methods
- **🛍️ Shopping Bag** - Product sales, retail

### People & Clients
- **👥 Multiple People** - Total clients, groups, referrals
- **🆕 New Badge** - New clients, new features
- **👑 Crown** - Top performer, VIP, premium
- **🧑‍🎨 Artist** - Stylists, staff members

### Appointments & Time
- **📅 Calendar** - Appointments, bookings, dates
- **⏱️ Stopwatch** - Duration, time tracking
- **🔄 Cycle** - Returning clients, recurring

### Performance & Analytics
- **📊 Bar Chart** - Analytics, data, insights
- **📈 Trending Up** - Growth, positive trends
- **⭐ Star** - Ratings, top services, favorites
- **🎫 Ticket** - Ticket size, transactions

### Status & Feedback
- **✅ Check Mark** - Completed, success, confirmed
- **❌ Cross Mark** - Cancelled, failed, rejected
- **⚠️ Warning** - Alerts, caution, attention needed
- **💡 Light Bulb** - Tips, suggestions, insights
- **👻 Ghost** - No-shows, missing

### Communication
- **📱 Mobile Phone** - SMS, phone contact, mobile
- **💬 Speech Bubble** - WhatsApp, messaging, chat
- **📧 Email** - Email communication
- **📢 Megaphone** - Marketing, announcements

### Social Media
- **🎵 TikTok** - TikTok platform
- **📸 Instagram** - Instagram platform  
- **👥 Facebook** - Facebook platform (reusing people icon)

### Other
- **🔍 Magnifying Glass** - Search, discovery
- **🚶 Walking** - Walk-by traffic
- **📝 Memo** - Notes, documentation

---

## ❌ REMOVED EMOJIS

### Scissors (✂️)
**Reason**: Too literal, potentially negative connotation
**Replacement**: 💇 (Hair services emoji)
**Updated in**:
- Analytics tabs
- Service icons
- Dashboard references

---

## Implementation Checklist

### Analytics Components
- [x] OverviewTab.js - Using 💇 for services
- [x] FinanceTab.js - Using 💇 for service revenue
- [x] ServicesTab.js - Using 💇 as default service icon
- [x] All other tabs - Consistent emoji usage

### Forms & Pages
- [x] AddBooking.js - Using 💇 for hair section
- [x] AddClient.js - Consistent social media icons
- [x] All pages - No scissors emoji

### Backend
- [x] Seed data - Using 💇 for service icons
- [x] Controllers - No emoji in code (only in responses)

---

## Usage Examples

### Good ✅
```javascript
icon: '💇'  // Hair services
icon: '💰'  // Revenue
icon: '📅'  // Appointments
icon: '👥'  // Clients
```

### Bad ❌
```javascript
icon: '✂️'  // Too literal, removed
icon: '💇‍♀️'  // Gender-specific, use neutral 💇
icon: '💈'  // Barber pole, too specific
```

---

## Consistency Rules

1. **Use neutral emojis** - Avoid gender-specific variants
2. **One emoji per concept** - Don't mix similar emojis
3. **Context matters** - Same emoji can mean different things in different contexts
4. **Accessibility** - Always provide text labels alongside emojis
5. **Cultural sensitivity** - Avoid emojis that may have different meanings in different cultures

---

## Quick Reference

| Concept | Emoji | Code |
|---------|-------|------|
| Hair Services | 💇 | `💇` |
| Revenue | 💰 | `💰` |
| Appointments | 📅 | `📅` |
| Clients | 👥 | `👥` |
| Analytics | 📊 | `📊` |
| Success | ✅ | `✅` |
| Warning | ⚠️ | `⚠️` |
| Tips/Insights | 💡 | `💡` |
| Top/Best | ⭐ | `⭐` |
| Time | ⏱️ | `⏱️` |

