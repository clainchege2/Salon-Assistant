# 2FA Enabled - Testing Guide

**Date:** November 19, 2025  
**Status:** 2FA is now ENABLED for all portals

---

## 🔐 What Changed

2FA (Two-Factor Authentication) is now **ENABLED** for:
1. ✅ Admin Portal - Tenant Signup
2. ✅ Admin Portal - Login
3. ✅ Client Portal - Registration
4. ✅ Client Portal - Login

---

## 📱 Testing Tenant Signup

### Step 1: Navigate to Signup
Go to: `http://localhost:3000/signup`

### Step 2: Fill Registration Form
```
Business Name: Test Salon
Country: Kenya
First Name: John
Last Name: Doe
Email: owner@testsalon.com
Phone: +254700000000
Password: Test123!
Confirm Password: Test123!
Verification Method: SMS (or Email)
```

### Step 3: Submit & Get Verification Code
- Click "Create Account"
- Check backend console for the verification code
- You'll see something like:
  ```
  📱 2FA Code for +254700***000: 123456
  ```

### Step 4: Enter Verification Code
- Enter the 6-digit code
- Click "Verify & Continue"
- You'll be logged in and redirected to dashboard

### Step 5: Verify Tenant Created
- You should see your dashboard
- Business name should appear in header
- You're logged in as "owner"

---

## 👤 Testing Client Registration

### Step 1: Navigate to Client Portal
Go to: `http://localhost:3001/register`

### Step 2: Fill Registration Form
```
Select Salon: [Choose the salon you just created]
First Name: Jane
Last Name: Smith
Phone: +254711111111
Email: jane@example.com
Date of Birth: 1990-01-01
Password: Client123!
Confirm Password: Client123!
```

### Step 3: Submit & Get Verification Code
- Click "Create Account"
- Check backend console for verification code
- You'll see:
  ```
  📱 2FA Code for +254711***111: 654321
  ```

### Step 4: Enter Verification Code
- Enter the 6-digit code
- Click "Verify & Continue"
- You'll be logged in to client dashboard

---

## 🔑 Testing Login (Admin)

### Step 1: Logout
- Click logout from dashboard

### Step 2: Login
Go to: `http://localhost:3000/login`

```
Email: owner@testsalon.com
Password: Test123!
Tenant Slug: test-salon-[timestamp]
```

### Step 3: 2FA Verification
- If user has 2FA enabled, you'll see verification screen
- Check backend console for code
- Enter code and verify

---

## 🔑 Testing Login (Client)

### Step 1: Logout
- Click logout from client dashboard

### Step 2: Login
Go to: `http://localhost:3001/login`

```
Select Salon: [Your salon]
Phone: +254711111111
Password: Client123!
```

### Step 3: 2FA Verification
- If enabled, you'll see verification screen
- Check backend console for code
- Enter code and verify

---

## 🔍 Where to Find Verification Codes

### In Development Mode:
The backend logs verification codes to the console:

```bash
# Terminal running backend
cd backend
npm start

# You'll see:
📱 2FA Code for +254700***000: 123456
📧 2FA Code for owner@***lon.com: 654321
```

### In Production:
Codes are sent via:
- **SMS:** Using Africa's Talking API
- **Email:** Using configured email service

---

## 🎯 Complete Test Flow

### 1. Tenant Signup Flow
```
Signup Form → Verification Screen → Dashboard (as Owner)
```

### 2. Client Registration Flow
```
Registration Form → Verification Screen → Client Dashboard
```

### 3. Admin Login Flow
```
Login Form → 2FA Screen (if enabled) → Dashboard
```

### 4. Client Login Flow
```
Login Form → 2FA Screen (if enabled) → Client Dashboard
```

---

## 🛠️ Troubleshooting

### Issue: Not seeing verification screen
**Solution:** Check if user has `twoFactorEnabled: true` in database

### Issue: Code not in console
**Solution:** Check backend is running and logs are visible

### Issue: "Invalid verification code"
**Possible causes:**
- Code expired (10 minutes)
- Wrong code entered
- Code already used

**Solution:** Click "Resend Code"

### Issue: Can't find tenant slug
**Solution:** Check database or backend logs after tenant creation:
```
New tenant registered: Test Salon - Verification pending
Tenant slug: test-salon-1234567890
```

---

## 📊 What Gets Created

### After Tenant Signup:
1. **Tenant Document**
   - businessName: "Test Salon"
   - slug: "test-salon-[timestamp]"
   - status: "active"
   - subscriptionTier: "free"

2. **User Document (Owner)**
   - role: "owner"
   - status: "active" (after verification)
   - twoFactorEnabled: true
   - All permissions: true

3. **2FA Record**
   - code: "123456"
   - expiresAt: 10 minutes from now
   - verified: false → true (after verification)

### After Client Registration:
1. **Client Document**
   - firstName, lastName, phone, email
   - tenantId: [linked to salon]
   - status: "active" (after verification)

2. **2FA Record**
   - Similar to tenant signup

---

## 🔐 Security Features

### Enabled:
- ✅ 2FA verification required
- ✅ Codes expire after 10 minutes
- ✅ Codes are single-use
- ✅ Rate limiting on verification attempts
- ✅ Secure code generation (6 digits)
- ✅ Phone number masking in responses

### Code Format:
- 6 digits
- Numeric only
- Random generation
- Expires in 10 minutes

---

## 📝 API Endpoints Used

### Tenant Signup:
```
POST /api/v1/auth/register
POST /api/v1/auth/2fa/verify
```

### Client Registration:
```
POST /api/v1/client-auth/register
POST /api/v1/client-auth/verify
```

### Login (Admin):
```
POST /api/v1/auth/login
POST /api/v1/auth/verify-2fa (if 2FA required)
```

### Login (Client):
```
POST /api/v1/client-auth/login
(includes 2FA in same endpoint)
```

---

## ✅ Testing Checklist

### Tenant Signup:
- [ ] Can access signup page
- [ ] Form validation works
- [ ] Registration creates tenant
- [ ] Verification code received
- [ ] Code verification works
- [ ] Redirects to dashboard
- [ ] User is logged in as owner

### Client Registration:
- [ ] Can access registration page
- [ ] Can select salon
- [ ] Form validation works
- [ ] Registration creates client
- [ ] Verification code received
- [ ] Code verification works
- [ ] Redirects to client dashboard
- [ ] User is logged in

### Login Flows:
- [ ] Admin login works
- [ ] Client login works
- [ ] 2FA verification works
- [ ] Resend code works
- [ ] Error handling works

---

## 🎉 Success Indicators

You'll know it's working when:
1. ✅ Signup shows verification screen
2. ✅ Backend logs show verification codes
3. ✅ Entering code logs you in
4. ✅ Dashboard loads with user data
5. ✅ Tenant/client created in database

---

**Ready to test!** 🚀

Start with tenant signup, then try client registration.
