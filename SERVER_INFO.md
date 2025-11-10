# Server Information & Quick Start

## ✅ Server Status

**Backend API:** Running on `http://localhost:3000`

### Available Endpoints

Visit `http://localhost:3000/` to see all available API endpoints:

```json
{
  "success": true,
  "message": "HairVia API Server",
  "version": "v1",
  "endpoints": {
    "auth": "/api/v1/auth",
    "bookings": "/api/v1/bookings",
    "clients": "/api/v1/clients",
    "services": "/api/v1/services",
    "communications": "/api/v1/communications",
    "marketing": "/api/v1/marketing",
    "materials": "/api/v1/materials",
    "barcodes": "/api/v1/barcodes",
    "messages": "/api/v1/messages",
    "tenants": "/api/v1/tenants",
    "admin": "/api/v1/admin"
  },
  "health": "/health"
}
```

## 🔧 Port Configuration

The server runs on **PORT 3000** (configured in root `.env` file).

- Root `.env`: `PORT=3000` ← Currently active
- Backend `.env`: `PORT=5000` ← Not used (root .env takes precedence)

## 🚀 Quick Start

### 1. Start Backend Server
```bash
node backend/src/server.js
```
Server will start on `http://localhost:3000`

### 2. Seed Test Data
```bash
node seed-full-test-data.js
```
Creates test accounts for FREE, PRO, and PREMIUM tiers.

### 3. Start Frontend
```bash
cd admin-portal
npm start
```
Opens on `http://localhost:3000` (React dev server will use a different port if 3000 is taken)

## 🧪 Test the API

### Check Server Status
```bash
curl http://localhost:3000/
```

### Health Check
```bash
curl http://localhost:3000/health
```

### Test Login (after seeding data)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@elitestyles.com","password":"Password123!"}'
```

## 📝 Test Accounts

After running `node seed-full-test-data.js`:

### PRO Tier (Elite Styles Pro)
- **Owner:** owner@elitestyles.com / Password123!
- **Manager:** manager@elitestyles.com / Password123!
- **Stylist:** stylist@elitestyles.com / Password123!

### PREMIUM Tier (Luxury Hair Lounge)
- **Owner:** owner@luxuryhair.com / Password123!
- **Manager:** manager@luxuryhair.com / Password123!
- **Stylist 1:** stylist1@luxuryhair.com / Password123!
- **Stylist 2:** stylist2@luxuryhair.com / Password123!

### FREE Tier (Basic Beauty Salon)
- **Owner:** owner@basicbeauty.com / Password123!

## 🔍 Troubleshooting

### "Route not found" Error

**Problem:** Accessing `http://localhost:5000/` or wrong port

**Solution:** 
- Server runs on port **3000**, not 5000
- Use `http://localhost:3000/` instead
- Root endpoint now shows helpful API information

### "Invalid credentials" Error

**Problem:** Test accounts don't exist

**Solution:**
```bash
node seed-full-test-data.js
```

### Server Not Starting

**Problem:** Port already in use

**Solution:**
```bash
# Check what's using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change PORT in root .env file
```

### Database Connection Error

**Problem:** MongoDB not running

**Solution:**
```bash
# Start MongoDB service
net start MongoDB

# Or start manually
mongod
```

## 📊 Dashboard Implementation

The dashboard now has role-based views:

### Owner/Manager View
- ✅ Stats cards
- ✅ Recent Bookings table (all bookings)
- ✅ Price information
- ✅ All navigation buttons

### Stylist View
- ✅ Welcome card
- ✅ My Upcoming Appointments (only their bookings)
- ❌ No Recent Bookings table
- ❌ No price information
- ❌ Limited navigation

## 📚 Documentation

- `STYLIST_DASHBOARD_FIX.md` - Technical implementation
- `DASHBOARD_VIEWS_COMPARISON.md` - Visual comparison
- `MANUAL_TESTING_GUIDE.md` - Testing instructions
- `SESSION_SUMMARY.md` - Complete overview
- `TEST_ACCOUNTS.md` - All test account details

## 🎯 Next Steps

1. ✅ Backend server running on port 3000
2. ✅ Root endpoint shows API info
3. ✅ Dashboard changes implemented
4. 🔄 Seed test data: `node seed-full-test-data.js`
5. 🔄 Start frontend: `cd admin-portal && npm start`
6. 🔄 Test with different roles

## 💡 Tips

- Use `http://localhost:3000/` to see all available endpoints
- Use `http://localhost:3000/health` for quick health check
- All test account passwords are `Password123!`
- Backend API uses `/api/v1/` prefix for all routes
- Frontend will proxy API requests in development mode
