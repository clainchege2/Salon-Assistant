# Analytics Dashboard Access Guide

## ✅ Data is Populated!

The database now contains:
- **891 total bookings** across all tiers
- **487 bookings** for Premium tier (Luxury Hair Lounge)
- **287 bookings** for Pro tier (Elite Styles Pro)
- **117 bookings** for Free tier (Basic Beauty Salon)

## 🔐 How to Access Analytics

### Step 1: Login to Premium Tier
1. Go to: http://localhost:3000
2. Enter credentials:
   - **Email**: owner@luxuryhair.com
   - **Password**: Password123!
   - **Tenant Slug**: luxury-hair-demo

### Step 2: Navigate to Analytics
**Option A - From Dashboard:**
1. After login, you'll see the dashboard
2. Click the **📊 Analytics** button in the quick actions section

**Option B - Direct URL:**
1. Go directly to: http://localhost:3000/analytics

### Step 3: Explore the 6 Tabs
1. **Overview** - KPIs, revenue trends, booking heatmap
2. **Appointments** - Volume, cancellations, time distribution
3. **Services** - Top services, category breakdown
4. **Clients** - Growth, segmentation, churn
5. **Stylists** - Performance leaderboard, efficiency
6. **Finance** - Revenue breakdown, trends, profitability

## 🎯 What You Should See

### Overview Tab
- **Total Revenue**: ~Ksh 1,208,222
- **Total Appointments**: 441 completed
- **Avg Ticket Size**: ~Ksh 2,740
- **Returning Clients**: Percentage of repeat customers
- **Top Service**: Most booked service
- **Top Stylist**: Highest revenue generator

### Charts & Visualizations
- Revenue trend line chart (last 7 days)
- Booking heatmap (peak hours visualization)
- AI-powered insights cards

## 🔧 Troubleshooting

### If Analytics Shows "Loading..." Forever:
1. Open browser console (F12)
2. Check for errors
3. Verify you're logged in as Premium tier
4. Check that backend is running on port 5000

### If Data Appears Empty:
1. Verify you're logged into the correct tenant (luxury-hair-demo)
2. Check the date range selector (default: This Month)
3. Try selecting "Last 3 Months" to see more data

### If You See "Access Denied":
1. Verify you're logged in as owner@luxuryhair.com
2. Check that the user has Premium tier subscription
3. Ensure `canViewReports` permission is true

## 📊 API Endpoints (for testing)

You can test the analytics API directly:

```bash
# Get auth token first (login)
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@luxuryhair.com","password":"Password123!","tenantSlug":"luxury-hair-demo"}'

# Then use the token to access analytics
curl http://localhost:5000/api/analytics/overview?range=thisMonth \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🎨 Expected Data Ranges

The seed data covers approximately **6 months** of history:
- **Oldest bookings**: ~180 days ago
- **Most recent**: Today + upcoming appointments
- **Peak period**: Last 90 days

### Date Range Options:
- **This Week**: Last 7 days
- **This Month**: Current month (default)
- **Last Month**: Previous month
- **Last 3 Months**: 90 days (recommended for full view)
- **Custom Range**: Select your own dates

## 💡 Tips for Best Experience

1. **Start with "Last 3 Months"** to see the full data range
2. **Explore each tab** to see different visualizations
3. **Hover over charts** for detailed tooltips
4. **Check the insights cards** for AI-powered recommendations
5. **Compare with other tiers** to see feature differences

## 🆚 Tier Comparison

### FREE Tier (Basic Beauty Salon)
- ❌ No Analytics access
- Shows upgrade prompt

### PRO Tier (Elite Styles Pro)
- ❌ No Analytics access
- Shows upgrade prompt to Premium

### PREMIUM Tier (Luxury Hair Lounge)
- ✅ Full Analytics access
- All 6 tabs available
- Complete data visualization

## 🔄 Refresh Data

If you want to regenerate the seed data:
```bash
node seed-data-comprehensive.js
```

This will:
- Clear existing data
- Create fresh bookings, clients, services
- Recalculate RFM scores
- Generate new feedback and communications

---

**Ready to explore!** 🚀

Login at: http://localhost:3000  
Analytics at: http://localhost:3000/analytics
