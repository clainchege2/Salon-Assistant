# Test Accounts for HairVia - Full Feature Testing

## 🔐 All Passwords: `Password123!`

---

## 📦 FREE TIER: Basic Beauty Salon

### Owner Account
- **Email:** `owner@basicbeauty.com`
- **Password:** `Password123!`
- **Tenant Slug:** `basic-beauty-salon-1762621490181`
- **Role:** Owner
- **Name:** Jane Doe

### Features Available
- ✅ Basic Bookings Management
- ✅ Client Management (10 clients)
- ✅ Service Management (8 services)
- ❌ No Staff Management
- ❌ No Marketing Campaigns
- ❌ No Reports
- ❌ No Stock Management

### Test Data
- **Clients:** 10
- **Services:** 8
- **Bookings:** ~30 (historical + upcoming)

---

## ⭐ PRO TIER: Elite Styles Pro

### Owner Account
- **Email:** `owner@elitestyles.com`
- **Password:** `Password123!`
- **Tenant Slug:** `elite-styles-pro-1762621490356`
- **Role:** Owner (Full Access)
- **Name:** Sarah Johnson

### Manager Account
- **Email:** `manager@elitestyles.com`
- **Password:** `Password123!`
- **Tenant Slug:** `elite-styles-pro-1762621490356`
- **Role:** Manager
- **Name:** Grace Mwangi

### Stylist Account
- **Email:** `stylist@elitestyles.com`
- **Password:** `Password123!`
- **Tenant Slug:** `elite-styles-pro-1762621490356`
- **Role:** Stylist
- **Name:** Lucy Wanjiru

### Features Available
- ✅ All Free Tier Features
- ✅ Staff Management (3 staff members)
- ✅ Marketing Campaigns (3 campaigns)
- ✅ Reports & Analytics
- ✅ Stock Management (8 materials)
- ✅ Communications (30+ messages)
- ❌ No Advanced Analytics

### Test Data
- **Clients:** 25
- **Services:** 8
- **Bookings:** ~65 (historical + upcoming)
- **Staff:** 3 (Owner, Manager, Stylist)
- **Materials:** 8 inventory items
- **Communications:** 30+ sent messages
- **Marketing Campaigns:** 3 (completed, active, scheduled)

---

## 💎 PREMIUM TIER: Luxury Hair Lounge

### Owner Account
- **Email:** `owner@luxuryhair.com`
- **Password:** `Password123!`
- **Tenant Slug:** `luxury-hair-lounge-1762621490669`
- **Role:** Owner (Full Access)
- **Name:** Diana Kamau

### Manager Account
- **Email:** `manager@luxuryhair.com`
- **Password:** `Password123!`
- **Tenant Slug:** `luxury-hair-lounge-1762621490669`
- **Role:** Manager
- **Name:** Mary Njeri

### Stylist Accounts
- **Email:** `stylist1@luxuryhair.com`
  - **Password:** `Password123!`
  - **Name:** Faith Achieng
  
- **Email:** `stylist2@luxuryhair.com`
  - **Password:** `Password123!`
  - **Name:** Rose Mutua

### Features Available
- ✅ All Pro Tier Features
- ✅ Advanced Analytics & Reports
- ✅ Priority Support
- ✅ Multiple Staff Members (4 total)
- ✅ Larger Client Base
- ✅ More Historical Data

### Test Data
- **Clients:** 40
- **Services:** 8
- **Bookings:** ~65 (historical + upcoming)
- **Staff:** 4 (Owner, Manager, 2 Stylists)
- **Materials:** 8 inventory items
- **Communications:** 30+ sent messages
- **Marketing Campaigns:** 3 (completed, active, scheduled)

---

## 🎯 Login URL
**Web App:** http://localhost:3000

---

## 📊 What to Test in Each Tier

### FREE TIER Testing
1. Basic booking creation and management
2. Client CRUD operations
3. Service management
4. View limitations on premium features

### PRO TIER Testing
1. Staff management (add, edit staff)
2. Marketing campaigns (create, schedule, view analytics)
3. Reports dashboard (revenue, client insights)
4. Stock management (track materials, low stock alerts)
5. Communications (SMS/WhatsApp message history)
6. Multi-user access (login as owner, manager, stylist)

### PREMIUM TIER Testing
1. All Pro features with more data
2. Advanced analytics with larger dataset
3. Multiple staff member coordination
4. Comprehensive reporting with 40+ clients
5. Team collaboration features

---

## 🧪 Testing Scenarios

### Test Multi-User Access
1. Login as Owner → Full access to all features
2. Login as Manager → Access to reports, communications, bookings
3. Login as Stylist → Limited to bookings and clients only

### Test Subscription Tiers
1. Login to FREE tier → See locked features
2. Login to PRO tier → Access marketing and reports
3. Login to PREMIUM tier → Access all features

### Test Marketing Features (PRO/PREMIUM)
1. View existing campaigns
2. Create new campaign
3. Schedule future campaign
4. View campaign analytics

### Test Reports (PRO/PREMIUM)
1. Revenue analytics (last 3 months of data)
2. Client insights (visit frequency, spending)
3. Service performance
4. Staff performance

### Test Stock Management (PRO/PREMIUM)
1. View inventory
2. Add new materials
3. Restock items
4. Low stock alerts

---

## 🔄 Regenerate Test Data

To create fresh test data with new tenant slugs:
```bash
node seed-full-test-data.js
```

This will:
- Clear all existing data
- Create 3 tenants (FREE, PRO, PREMIUM)
- Generate realistic test data for each tier
- Create historical bookings (last 3 months)
- Set up marketing campaigns
- Populate stock inventory
- Create communication history

---

## 📝 Notes

- All test data includes realistic dates (past 3 months + upcoming 2 weeks)
- Client data includes various marketing consent levels
- Bookings have different statuses (completed, confirmed, pending, cancelled)
- Marketing campaigns show different stages (completed, active, scheduled)
- Stock items have varying quantities to test low stock alerts
- Communications show sent/pending statuses

---

## 🆘 Troubleshooting

**Can't login?**
- Make sure backend server is running: `node backend/src/server.js`
- Check you're using the correct tenant slug
- Password is case-sensitive: `Password123!`

**No data showing?**
- Run the seed script: `node seed-full-test-data.js`
- Check browser console for errors
- Verify you're logged into the correct tenant

**Features locked?**
- Check your subscription tier
- FREE tier has limited features
- PRO tier unlocks marketing, reports, stock
- PREMIUM tier has all features
