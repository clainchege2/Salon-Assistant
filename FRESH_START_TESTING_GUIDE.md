# Fresh Start Testing Guide

**Date:** November 22, 2025  
**Status:** ✅ Database Cleaned - Ready for Testing

---

## 🎯 Current Status

- ✅ **Database:** Completely empty (0 tenants, 0 users, 0 clients)
- ✅ **Backend Server:** Running on port 5000
- ✅ **Security Tests:** All 86 tests passing
- ✅ **Warnings Fixed:** Zero MongoDB/Mongoose warnings
- ✅ **Ready for:** Real-world testing with fresh accounts

---

## 🚀 How to Test

### 1. Admin Portal Testing (Tenant/Salon Owner)

**URL:** http://localhost:3000

#### Register a New Salon:
1. Click "Register" or go to registration page
2. Fill in salon details:
   - Business Name: (e.g., "My Test Salon")
   - Email: your-email@example.com
   - Phone: +254700000000
   - Password: (strong password)
   - First Name & Last Name
   - Choose subscription tier: FREE, PRO, or PREMIUM

3. **2FA Verification:**
   - System will send a verification code
   - Check console logs for the code (SMS simulation)
   - Enter the 6-digit code to verify

4. **Login:**
   - Use your tenant slug (auto-generated)
   - Email and password
   - Complete 2FA if enabled

#### Test Admin Features:
- ✅ Dashboard overview
- ✅ Add/manage clients
- ✅ Create services
- ✅ Book appointments
- ✅ Add staff members (PRO/PREMIUM)
- ✅ Marketing campaigns (PRO/PREMIUM)
- ✅ Analytics & reports (PRO/PREMIUM)
- ✅ Stock management (PRO/PREMIUM)

---

### 2. Client Portal Testing

**URL:** http://localhost:3001

#### Register as a Client:
1. Click "Register"
2. Select a salon (from dropdown)
3. Fill in details:
   - First Name & Last Name
   - Phone number
   - Email (optional)
   - Password
   - Date of Birth

4. **2FA Verification:**
   - Enter verification code
   - Check console for code

5. **Login:**
   - Select salon
   - Enter phone and password

#### Test Client Features:
- ✅ View profile
- ✅ View bookings
- ✅ Book appointments
- ✅ View services
- ✅ Update profile

---

## 🔐 Security Features to Test

### Multi-Tenant Isolation:
1. Create 2 different salons
2. Login to each
3. Verify you can't see other salon's data

### Role-Based Access:
1. Create users with different roles (Owner, Manager, Stylist)
2. Test permission restrictions
3. Verify managers can't access user management
4. Verify stylists have limited access

### Client Portal Security:
1. Register as client
2. Try to access admin endpoints (should fail)
3. Try to view other clients' data (should fail)

### 2FA Flow:
1. Register new account
2. Verify 2FA code is required
3. Test with wrong code (should fail)
4. Test with correct code (should succeed)

---

## 📊 Subscription Tiers

### FREE Tier:
- Basic bookings
- Client management (limited)
- Service management
- ❌ No staff management
- ❌ No marketing
- ❌ No reports

### PRO Tier:
- All FREE features
- ✅ Staff management
- ✅ Marketing campaigns
- ✅ Reports & analytics
- ✅ Stock management
- ✅ Communications

### PREMIUM Tier:
- All PRO features
- ✅ Advanced analytics
- ✅ Priority support
- ✅ Unlimited staff
- ✅ Full feature access

---

## 🛠️ Useful Commands

### Check Database Status:
```bash
cd backend
node check-database.js
```

### Clean Database (if needed):
```bash
cd backend
node clean-database.js
```

### Run Security Tests:
```bash
cd backend
npm test
```

### View Server Logs:
Check the terminal where `npm start` is running

---

## 📝 Testing Checklist

### Admin Portal:
- [ ] Register new tenant
- [ ] Complete 2FA verification
- [ ] Login successfully
- [ ] Add clients
- [ ] Create services
- [ ] Book appointments
- [ ] Add staff members
- [ ] Test role permissions
- [ ] View analytics (PRO/PREMIUM)
- [ ] Create marketing campaign (PRO/PREMIUM)

### Client Portal:
- [ ] Register as client
- [ ] Complete 2FA verification
- [ ] Login successfully
- [ ] View profile
- [ ] View bookings
- [ ] Book new appointment
- [ ] Update profile

### Security:
- [ ] Test cross-tenant isolation
- [ ] Test role-based access
- [ ] Test 2FA flow
- [ ] Test invalid credentials
- [ ] Test rate limiting (multiple failed logins)
- [ ] Verify passwords not exposed in API
- [ ] Test audit logging

---

## 🐛 Troubleshooting

### Can't Login:
- Check tenant slug is correct
- Verify 2FA code if enabled
- Check password is correct
- Look at server logs for errors

### 2FA Code Not Working:
- Check server console for the actual code
- Codes expire in 10 minutes
- Maximum 5 attempts per code

### Rate Limited:
- Wait 5-10 minutes
- Or restart the server to clear rate limits

### Server Not Running:
```bash
cd backend
npm start
```

### Frontend Not Running:
```bash
# Admin Portal
cd admin-portal
npm start

# Client Portal
cd client-portal
npm start
```

---

## 📞 Support

- Check `API_DOCUMENTATION.md` for API details
- Check `SECURITY_COMPLIANCE.md` for security info
- Check `QUICK_START.md` for setup instructions
- All 86 security tests are passing ✅

---

**Ready to test!** Start by registering a new salon at http://localhost:3000

