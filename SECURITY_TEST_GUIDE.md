# 🔐 Security Testing Guide

## Overview

This guide provides step-by-step instructions for testing all security features of the HairVia Salon Management System.

## Prerequisites

- Clean database (no existing data)
- All dependencies installed
- Environment variables configured
- Application running locally

## Test Environment Setup

### 1. Verify Clean State
```bash
node verify-clean.js
```

Expected output:
```
✅ DATABASE IS COMPLETELY CLEAN!
📊 No collections found
🎉 Ready for first signup!
```

### 2. Start All Services
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Admin Portal  
cd admin-portal && npm start

# Terminal 3 - Client Portal
cd client-portal && npm start
```

## Manual Security Tests

### Test 1: User Registration & 2FA

**Objective**: Verify secure user registration with 2FA

**Steps**:
1. Navigate to http://localhost:3000
2. Click "Sign Up"
3. Fill in business details:
   - Business Name: "Test Salon"
   - Email: your-email@example.com
   - Phone: +254700000000
   - Password: TestPass123!
   - First Name: Test
   - Last Name: User
4. Submit form

**Expected Results**:
- ✅ Registration successful
- ✅ 2FA code sent to email/phone
- ✅ Redirected to verification page
- ✅ Password hashed in database (not plain text)

**Verify in Database**:
```javascript
// User password should be hashed
db.users.findOne({ email: "your-email@example.com" })
// password field should start with "$2a$" (bcrypt hash)
```

### Test 2: 2FA Verification

**Objective**: Verify 2FA code validation

**Steps**:
1. Check email/phone for 2FA code
2. Enter the 6-digit code
3. Submit verification

**Expected Results**:
- ✅ Code accepted if valid
- ✅ Account status changes to "active"
- ✅ Redirected to dashboard
- ✅ JWT token generated

**Test Invalid Code**:
- Enter wrong code → Should show error
- Wait for expiration (5 min) → Should show expired error

### Test 3: Login Flow

**Objective**: Verify secure login process

**Steps**:
1. Logout from dashboard
2. Go to login page
3. Enter credentials
4. Submit login

**Expected Results**:
- ✅ 2FA code sent
- ✅ Must verify 2FA to complete login
- ✅ JWT token issued after verification
- ✅ Redirected to dashboard

### Test 4: Failed Login Attempts

**Objective**: Verify account lockout mechanism

**Steps**:
1. Attempt login with wrong password (5 times)
2. Try 6th attempt

**Expected Results**:
- ✅ First 4 attempts: "Invalid credentials"
- ✅ 5th attempt: Account locked message
- ✅ 6th attempt: "Account locked" error
- ✅ User.failedLoginAttempts = 5
- ✅ User.accountLockedUntil set to +15 minutes

**Verify in Database**:
```javascript
db.users.findOne({ email: "your-email@example.com" })
// Should show:
// failedLoginAttempts: 5
// accountLockedUntil: [future timestamp]
```

### Test 5: Rate Limiting

**Objective**: Verify rate limiting on auth endpoints

**Steps**:
1. Make 6 rapid login attempts
2. Observe response

**Expected Results**:
- ✅ First 5 attempts: Normal response
- ✅ 6th attempt: 429 Too Many Requests
- ✅ Error message: "Too many login attempts"

### Test 6: Role-Based Access Control

**Objective**: Verify users can only access permitted resources

**Setup**:
1. Create Owner account (already done)
2. Create Manager account (via admin panel)
3. Create Stylist account (via admin panel)

**Test Owner Access**:
- ✅ Can access all features
- ✅ Can manage users
- ✅ Can view reports
- ✅ Can delete data

**Test Manager Access**:
- ✅ Can view bookings
- ✅ Can manage clients
- ✅ Can view reports
- ❌ Cannot manage users
- ❌ Cannot change permissions

**Test Stylist Access**:
- ✅ Can view own bookings
- ✅ Can view clients
- ❌ Cannot delete bookings
- ❌ Cannot view reports
- ❌ Cannot manage users

### Test 7: Tenant Isolation

**Objective**: Verify users cannot access other tenants' data

**Setup**:
1. Create Tenant A (Salon A)
2. Create Tenant B (Salon B)
3. Create clients in both tenants

**Test Cross-Tenant Access**:
1. Login as Tenant A owner
2. Try to access Tenant B's client via API:
   ```bash
   curl -H "Authorization: Bearer <tenant-a-token>" \
        http://localhost:5000/api/v1/clients/<tenant-b-client-id>
   ```

**Expected Results**:
- ✅ 404 Not Found (client not visible)
- ✅ Cannot modify Tenant B data
- ✅ Cannot view Tenant B data

### Test 8: Token Security

**Objective**: Verify JWT token validation

**Test Invalid Token**:
```bash
curl -H "Authorization: Bearer invalid-token" \
     http://localhost:5000/api/v1/auth/me
```
Expected: 401 Unauthorized

**Test Expired Token**:
1. Generate token with 1-second expiration
2. Wait 2 seconds
3. Use token

Expected: 401 Unauthorized

**Test Modified Token**:
1. Get valid token
2. Modify payload
3. Use modified token

Expected: 401 Unauthorized

### Test 9: Audit Logging

**Objective**: Verify all sensitive operations are logged

**Steps**:
1. Perform various operations:
   - Login
   - Create client
   - Update user
   - Delete booking
   - Export report

2. Check audit logs:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        http://localhost:5000/api/v1/audit-logs
   ```

**Expected Results**:
- ✅ All operations logged
- ✅ Includes timestamp, user, action, resource
- ✅ Sensitive operations marked as HIGH/CRITICAL risk
- ✅ IP address captured
- ✅ User agent captured
- ✅ Passwords redacted in logs

### Test 10: Password Security

**Objective**: Verify password requirements and hashing

**Test Weak Passwords**:
Try registering with:
- "123456" → Should reject
- "password" → Should reject
- "abc" → Should reject

**Test Strong Passwords**:
- "MySecure123!" → Should accept
- "P@ssw0rd2024" → Should accept

**Verify Hashing**:
```javascript
// Check database
db.users.findOne({ email: "test@example.com" })
// password should be bcrypt hash ($2a$12$...)
// Should NOT be plain text
```

### Test 11: Session Management

**Objective**: Verify proper session handling

**Test Logout**:
1. Login successfully
2. Get JWT token
3. Logout
4. Try using old token

**Expected Results**:
- ✅ Logout successful
- ✅ Token still valid (stateless JWT)
- ✅ Client removes token
- ✅ Logout event logged

**Test Token Refresh**:
1. Get access token (15min expiry)
2. Get refresh token (7d expiry)
3. Wait for access token to expire
4. Use refresh token to get new access token

Expected: New access token issued

### Test 12: Input Validation

**Objective**: Verify input sanitization

**Test SQL Injection**:
```bash
# Try SQL injection in login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com OR 1=1","password":"test"}'
```
Expected: Rejected, no SQL execution

**Test XSS**:
```bash
# Try XSS in client name
curl -X POST http://localhost:5000/api/v1/clients \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"firstName":"<script>alert(1)</script>","lastName":"Test"}'
```
Expected: Script tags sanitized

## Automated Security Tests

### Run All Tests
```bash
cd backend
npm test -- --testPathPattern=security --coverage
```

### Expected Results
- ✅ Authentication: 21/21 passing
- ✅ Authorization: 26/26 passing
- ✅ Tenant Isolation: 18/18 passing
- ✅ Audit Logging: 22/22 passing

**Total**: 87/87 tests passing (100%)

### Coverage Goals
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

## Security Checklist

### Authentication ✅
- [x] User registration with 2FA
- [x] Login with 2FA
- [x] Password hashing (bcrypt)
- [x] Failed login tracking
- [x] Account lockout
- [x] Rate limiting
- [x] Token generation
- [x] Token validation
- [x] Logout

### Authorization ✅
- [x] Role-based access control
- [x] Permission-based access control
- [x] Resource ownership
- [x] Privilege escalation prevention

### Tenant Isolation ✅
- [x] Cross-tenant data prevention
- [x] Query filtering by tenantId
- [x] Token validation includes tenantId

### Audit Logging ✅
- [x] Authentication events
- [x] CRUD operations
- [x] Sensitive operations
- [x] Failed operations
- [x] Data redaction

### Input Validation ✅
- [x] SQL injection prevention
- [x] XSS prevention
- [x] Input sanitization

### Session Management ✅
- [x] JWT tokens
- [x] Token expiration
- [x] Refresh tokens
- [x] Logout handling

## Common Issues & Solutions

### Issue: Tests Failing Due to Rate Limiting
**Solution**: Disable rate limiting in test environment
```javascript
// backend/src/middleware/security.js
skip: (req) => process.env.NODE_ENV === 'test'
```

### Issue: 2FA Codes Not Sending
**Solution**: Configure email settings in .env
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Issue: Database Connection Failed
**Solution**: Ensure MongoDB is running
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"
```

## Reporting Results

After completing all tests, document:

1. **Test Results**: Pass/Fail for each test
2. **Issues Found**: Description, severity, steps to reproduce
3. **Recommendations**: Suggested fixes or improvements
4. **Coverage Report**: Code coverage percentages
5. **Performance**: Response times for critical operations

## Next Steps

1. Fix any failing tests
2. Address security vulnerabilities
3. Improve code coverage
4. Perform penetration testing
5. Security code review
6. Deploy to staging
7. Final security audit
8. Production deployment

---

**Remember**: Security is an ongoing process, not a one-time task!
