# HairVia Test Accounts

All passwords: **Password123!**

## 🆓 FREE TIER - Basic Beauty Salon
- **Tenant Slug**: `basic-beauty-demo` (FIXED)
- **Owner**: owner@basicbeauty.com
- **Features**: Bookings, Clients, Services only

## ⭐ PRO TIER - Elite Styles Pro
- **Tenant Slug**: `elite-styles-demo` (FIXED)
- **Owner**: owner@elitestyles.com
- **Stylist**: stylist@elitestyles.com
- **Features**: + Staff Management, Stock Tracking, Communications Hub

## 💎 PREMIUM TIER - Luxury Hair Lounge (Recommended for Testing)
- **Tenant Slug**: `luxury-hair-demo` (FIXED)
- **Owner**: owner@luxuryhair.com
- **Manager**: manager@luxuryhair.com (with permissions)
- **Stylist**: stylist@luxuryhair.com
- **Features**: All features including Marketing, Reports, Analytics, AI
- **Sample Data**: 6 clients, 5 services, 7 bookings (with RFM scores)

## 🚀 Quick Start

### First Time Setup
1. Create accounts (run once):
   ```bash
   node seed-accounts.js
   ```

2. Populate test data:
   ```bash
   node seed-data.js
   ```

3. Login at: http://localhost:3000 with any account above

### Refresh Test Data (keeps login credentials)
```bash
node seed-data.js
```
This regenerates clients, services, and bookings without changing tenant slugs or user accounts.

### Full Reset (changes everything)
```bash
node seed.js
```
This drops the entire database and recreates everything with new slugs.

## 📝 Notes

- **Tenant slugs are now FIXED** - no more changing credentials!
- Use `seed-accounts.js` once, then `seed-data.js` as needed
- Premium tier has the most complete data for testing
- Manager account has custom permissions configured
- All accounts have proper phone numbers and required fields
- Bookings include past (completed) and future (confirmed/pending) appointments
- RFM scores are automatically calculated for all clients
