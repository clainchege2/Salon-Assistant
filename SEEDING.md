# HairVia Seeding System

This project uses a two-script seeding system to separate stable login credentials from test data.

## 📁 Seed Scripts

### 1. `seed-accounts.js` - Create Stable Accounts
Creates tenant accounts and users with **fixed tenant slugs** that never change.

**When to use:**
- First time setup
- After manually dropping the database
- When you want to completely reset everything

**What it creates:**
- 3 tenant accounts (Free, Pro, Premium)
- User accounts for each tenant
- **Fixed slugs**: `basic-beauty-demo`, `elite-styles-demo`, `luxury-hair-demo`

```bash
node seed-accounts.js
```

### 2. `seed-data.js` - Populate Test Data
Adds clients, services, and bookings to the Premium tier account.

**When to use:**
- After running `seed-accounts.js`
- Whenever you want fresh test data
- Can be run multiple times without affecting login credentials

**What it creates:**
- 5 services (braids, weave, treatment, etc.)
- 6 clients with realistic data
- 7 bookings (past and upcoming)
- RFM scores for all clients

```bash
node seed-data.js
```

### 3. `seed.js` - Full Reset (Legacy)
Drops the entire database and recreates everything with **random slugs**.

**When to use:**
- Only when you want completely fresh data with new slugs
- Not recommended for regular testing

```bash
node seed.js
```

## 🚀 Recommended Workflow

### First Time Setup
```bash
# 1. Create accounts (once)
node seed-accounts.js

# 2. Add test data
node seed-data.js

# 3. Login at http://localhost:3000
# Use: luxury-hair-demo / owner@luxuryhair.com / Password123!
```

### Daily Development
```bash
# Just refresh test data as needed
node seed-data.js

# Your login credentials stay the same!
# Slug: luxury-hair-demo
```

### Complete Reset
```bash
# Start over from scratch
node seed-accounts.js
node seed-data.js
```

## 🔑 Fixed Login Credentials

### Premium Tier (Recommended)
- **Slug**: `luxury-hair-demo`
- **Owner**: owner@luxuryhair.com / Password123!
- **Manager**: manager@luxuryhair.com / Password123!
- **Stylist**: stylist@luxuryhair.com / Password123!

### Pro Tier
- **Slug**: `elite-styles-demo`
- **Owner**: owner@elitestyles.com / Password123!
- **Stylist**: stylist@elitestyles.com / Password123!

### Free Tier
- **Slug**: `basic-beauty-demo`
- **Owner**: owner@basicbeauty.com / Password123!

## 📊 Test Data Details

The `seed-data.js` script creates:

**Services (5)**
- Braids (Ksh 2,500, 3 hours)
- Weave Installation (Ksh 3,500, 2 hours)
- Hair Treatment (Ksh 1,500, 1 hour)
- Blow Dry & Style (Ksh 1,000, 45 min)
- Locs Maintenance (Ksh 2,000, 1.5 hours)

**Clients (6)** - with varying visit patterns
- Grace Wambui - VIP (15 visits, Ksh 45,000)
- Mary Njoki - Regular (8 visits, Ksh 20,000)
- Jane Akinyi - New (2 visits, Ksh 5,000)
- Ann Muthoni - Inactive (5 visits, Ksh 12,000)
- Betty Wanjiku - Regular (6 visits, Ksh 15,000)
- Catherine Atieno - Regular (10 visits, Ksh 28,000)

**Bookings (7)**
- 3 completed (past dates)
- 4 upcoming (future dates: confirmed/pending)

**RFM Segments** - Automatically calculated
- Champions, Loyal, Potential Loyalist, At Risk, etc.

## 💡 Benefits

✅ **Stable credentials** - No more copying new slugs every time  
✅ **Fast iteration** - Regenerate test data in seconds  
✅ **Realistic data** - Proper RFM scores, varied client patterns  
✅ **Flexible** - Keep accounts, refresh data as needed  

## 🔧 Troubleshooting

**"Accounts already exist" error**
```bash
# Run seed-accounts.js again (it will drop and recreate)
node seed-accounts.js
```

**"Premium tenant not found" error**
```bash
# Create accounts first
node seed-accounts.js
# Then add data
node seed-data.js
```

**Want completely fresh start**
```bash
# Option 1: Use the two-script system
node seed-accounts.js
node seed-data.js

# Option 2: Use legacy full reset (random slugs)
node seed.js
```
