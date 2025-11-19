# Two-Factor Authentication (2FA) Implementation Guide

## Overview

This system implements mandatory 2FA for all new user and client registrations, significantly enhancing security by requiring verification of phone numbers or email addresses during account creation and login.

---

## Features

### ✅ Core Capabilities

1. **Multi-Channel Delivery**
   - SMS verification codes
   - Email verification codes
   - WhatsApp verification codes (ready for integration)

2. **Multiple Use Cases**
   - Registration verification (mandatory)
   - Login verification (optional, configurable per user)
   - Password reset verification
   - Email/phone change verification

3. **Security Features**
   - 6-digit random codes
   - SHA-256 hashed storage
   - 10-minute expiration
   - Maximum 5 attempts per code
   - Rate limiting on resend (1 minute cooldown)
   - IP address and user agent tracking

4. **User Experience**
   - Masked contact information display
   - Code resend functionality
   - Clear error messages with remaining attempts
   - Configurable 2FA method per user

---

## Architecture

### Database Models

#### TwoFactorAuth Model
```javascript
{
  userId: ObjectId,           // Reference to User or Client
  userModel: String,          // 'User' or 'Client'
  tenantId: ObjectId,         // Tenant isolation
  code: String,               // Plain code (removed after sending)
  codeHash: String,           // SHA-256 hash for verification
  method: String,             // 'sms', 'email', 'whatsapp'
  sentTo: String,             // Masked contact info
  purpose: String,            // 'registration', 'login', etc.
  verified: Boolean,
  attempts: Number,
  maxAttempts: Number,
  expiresAt: Date,
  ipAddress: String,
  userAgent: String
}
```

#### User Model Updates
```javascript
{
  status: 'pending-verification' | 'active' | 'blocked' | 'inactive',
  twoFactorEnabled: Boolean,
  twoFactorMethod: 'sms' | 'email' | 'whatsapp',
  phoneVerified: Boolean,
  emailVerified: Boolean,
  verifiedAt: Date
}
```

#### Client Model Updates
```javascript
{
  accountStatus: 'pending-verification' | 'active' | 'suspended',
  phoneVerified: Boolean,
  emailVerified: Boolean,
  verifiedAt: Date,
  twoFactorEnabled: Boolean,
  twoFactorMethod: 'sms' | 'email' | 'whatsapp'
}
```

---

## API Endpoints

### 1. Send 2FA Code
**POST** `/api/v1/auth/2fa/send`

**Request Body:**
```json
{
  "userId": "user_id_here",
  "userModel": "User",
  "method": "sms",
  "purpose": "registration"
}
```

**Response:**
```json
{
  "success": true,
  "twoFactorId": "2fa_record_id",
  "method": "sms",
  "sentTo": "****1234",
  "expiresAt": "2025-11-18T10:30:00Z",
  "expiryMinutes": 10
}
```

---

### 2. Verify 2FA Code
**POST** `/api/v1/auth/2fa/verify`

**Request Body:**
```json
{
  "twoFactorId": "2fa_record_id",
  "code": "123456"
}
```

**Success Response:**
```json
{
  "success": true,
  "userId": "user_id",
  "userModel": "User",
  "tenantId": "tenant_id",
  "purpose": "registration",
  "message": "Verification successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "INVALID_CODE",
  "message": "Invalid code. 3 attempts remaining.",
  "remainingAttempts": 3
}
```

---

### 3. Resend 2FA Code
**POST** `/api/v1/auth/2fa/resend`

**Request Body:**
```json
{
  "twoFactorId": "2fa_record_id"
}
```

**Response:**
```json
{
  "success": true,
  "twoFactorId": "new_2fa_record_id",
  "method": "sms",
  "sentTo": "****1234",
  "expiresAt": "2025-11-18T10:40:00Z"
}
```

**Rate Limited Response:**
```json
{
  "success": false,
  "error": "RATE_LIMITED",
  "message": "Please wait before requesting a new code",
  "retryAfter": 45
}
```

---

### 4. Update 2FA Settings (Protected)
**PUT** `/api/v1/auth/2fa/settings`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "enabled": true,
  "method": "email"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA settings updated",
  "settings": {
    "enabled": true,
    "method": "email"
  }
}
```

---

## Registration Flow

### Staff/Tenant Registration

**Step 1: Register**
```javascript
POST /api/v1/auth/register
{
  "businessName": "Glamour Salon",
  "email": "owner@glamour.com",
  "phone": "+254712345678",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "country": "Kenya",
  "twoFactorMethod": "sms"
}
```

**Response:**
```json
{
  "success": true,
  "requiresVerification": true,
  "twoFactorId": "673abc...",
  "method": "sms",
  "sentTo": "****5678",
  "expiresAt": "2025-11-18T10:30:00Z",
  "user": {
    "id": "user_id",
    "email": "owner@glamour.com",
    "status": "pending-verification",
    ...
  },
  "message": "Registration successful. Please verify your account with the code sent to your phone"
}
```

**Step 2: Verify**
```javascript
POST /api/v1/auth/2fa/verify
{
  "twoFactorId": "673abc...",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user_id",
  "message": "Verification successful"
}
```

**Step 3: Login (after verification)**
```javascript
POST /api/v1/auth/login
{
  "email": "owner@glamour.com",
  "password": "SecurePass123!",
  "tenantSlug": "glamour-salon-1234567890"
}
```

---

### Client Registration

**Step 1: Register**
```javascript
POST /api/v1/client-auth/register
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+254798765432",
  "email": "john@example.com",
  "password": "ClientPass123!",
  "tenantSlug": "glamour-salon-1234567890",
  "twoFactorMethod": "email"
}
```

**Response:**
```json
{
  "success": true,
  "requiresVerification": true,
  "twoFactorId": "673def...",
  "method": "email",
  "sentTo": "jo**@example.com",
  "expiresAt": "2025-11-18T10:30:00Z",
  "data": {
    "accountStatus": "pending-verification",
    ...
  },
  "message": "Registration successful. Please verify your account with the code sent to your email"
}
```

**Step 2: Verify (same as staff)**

---

## Login Flow with 2FA

### When 2FA is Enabled

**Step 1: Initial Login**
```javascript
POST /api/v1/auth/login
{
  "email": "owner@glamour.com",
  "password": "SecurePass123!",
  "tenantSlug": "glamour-salon-1234567890"
}
```

**Response (2FA Required):**
```json
{
  "success": true,
  "requires2FA": true,
  "twoFactorId": "673ghi...",
  "method": "sms",
  "sentTo": "****5678",
  "expiresAt": "2025-11-18T10:30:00Z",
  "message": "Verification code sent. Please check your phone"
}
```

**Step 2: Login with 2FA Code**
```javascript
POST /api/v1/auth/login
{
  "email": "owner@glamour.com",
  "password": "SecurePass123!",
  "tenantSlug": "glamour-salon-1234567890",
  "twoFactorId": "673ghi...",
  "twoFactorCode": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": { ... },
  "tenant": { ... }
}
```

---

## Frontend Integration

### React Example - Registration with 2FA

```javascript
import { useState } from 'react';

function RegistrationForm() {
  const [step, setStep] = useState('register'); // 'register' | 'verify'
  const [twoFactorId, setTwoFactorId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    twoFactorMethod: 'sms'
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.requiresVerification) {
        setTwoFactorId(data.twoFactorId);
        setStep('verify');
        alert(`Code sent to ${data.sentTo}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/v1/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          twoFactorId,
          code: verificationCode
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Account verified! You can now log in.');
        // Redirect to login
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Verification error:', error);
    }
  };

  const handleResend = async () => {
    try {
      const response = await fetch('/api/v1/auth/2fa/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFactorId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTwoFactorId(data.twoFactorId);
        alert('New code sent!');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Resend error:', error);
    }
  };

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify}>
        <h2>Verify Your Account</h2>
        <p>Enter the 6-digit code sent to your {formData.twoFactorMethod === 'email' ? 'email' : 'phone'}</p>
        
        <input
          type="text"
          maxLength="6"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          placeholder="123456"
          required
        />
        
        <button type="submit">Verify</button>
        <button type="button" onClick={handleResend}>Resend Code</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleRegister}>
      <h2>Register</h2>
      
      <input
        type="text"
        value={formData.firstName}
        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
        placeholder="First Name"
        required
      />
      
      <input
        type="text"
        value={formData.lastName}
        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
        placeholder="Last Name"
        required
      />
      
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
        required
      />
      
      <input
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
        placeholder="Phone"
        required
      />
      
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        placeholder="Password"
        required
      />
      
      <select
        value={formData.twoFactorMethod}
        onChange={(e) => setFormData({...formData, twoFactorMethod: e.target.value})}
      >
        <option value="sms">SMS</option>
        <option value="email">Email</option>
      </select>
      
      <button type="submit">Register</button>
    </form>
  );
}
```

---

## SMS/Email Provider Integration

### Current Status: Development Mode

In development, codes are logged to console. For production, integrate with:

### SMS Providers

#### Africa's Talking (Recommended for Kenya)
```javascript
// backend/src/services/twoFactorService.js

const africastalking = require('africastalking')({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME
});

async sendSMS(phone, message) {
  const sms = africastalking.SMS;
  const result = await sms.send({
    to: [phone],
    message,
    from: process.env.AFRICASTALKING_SENDER_ID
  });
  
  return result.SMSMessageData.Recipients[0].status === 'Success';
}
```

#### Twilio (International)
```javascript
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async sendSMS(phone, message) {
  const result = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
  
  return result.status === 'sent' || result.status === 'queued';
}
```

### Email Providers

#### SendGrid
```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async sendEmail(email, message, purpose) {
  await sgMail.send({
    to: email,
    from: process.env.FROM_EMAIL,
    subject: 'Your Verification Code',
    text: message,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Verification Code</h2>
        <p>${message.replace(/\n/g, '<br>')}</p>
      </div>
    `
  });
  
  return true;
}
```

#### AWS SES
```javascript
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: process.env.AWS_REGION });

async sendEmail(email, message, purpose) {
  const params = {
    Source: process.env.FROM_EMAIL,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: 'Your Verification Code' },
      Body: {
        Text: { Data: message },
        Html: { Data: `<p>${message.replace(/\n/g, '<br>')}</p>` }
      }
    }
  };
  
  await ses.sendEmail(params).promise();
  return true;
}
```

---

## Environment Variables

Add to `.env`:

```bash
# 2FA Settings
TWO_FACTOR_EXPIRY_MINUTES=10
TWO_FACTOR_MAX_ATTEMPTS=5
TWO_FACTOR_RESEND_COOLDOWN_SECONDS=60

# SMS Provider (Africa's Talking)
AFRICASTALKING_API_KEY=your_api_key
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_SENDER_ID=your_sender_id

# Or Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Email Provider (SendGrid)
SENDGRID_API_KEY=your_api_key
FROM_EMAIL=noreply@yourdomain.com

# Or AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

---

## Security Best Practices

### ✅ Implemented

1. **Code Hashing** - Codes stored as SHA-256 hashes
2. **Expiration** - 10-minute validity
3. **Attempt Limiting** - Maximum 5 attempts
4. **Rate Limiting** - 1-minute cooldown on resend
5. **Tenant Isolation** - All 2FA records scoped to tenant
6. **IP Tracking** - Audit trail for security
7. **Masked Display** - Contact info masked in responses
8. **TTL Index** - Automatic cleanup of expired codes

### 🔒 Additional Recommendations

1. **Monitor Failed Attempts** - Alert on suspicious patterns
2. **Implement CAPTCHA** - For repeated resend requests
3. **Add Backup Codes** - For account recovery
4. **Log All 2FA Events** - For security audits
5. **Implement Device Trust** - Remember verified devices
6. **Add Biometric Option** - For mobile apps

---

## Testing

### Manual Testing

1. **Registration Flow**
   ```bash
   # Register
   curl -X POST http://localhost:5000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "businessName": "Test Salon",
       "email": "test@example.com",
       "phone": "+254712345678",
       "password": "Test123!",
       "firstName": "Test",
       "lastName": "User",
       "twoFactorMethod": "sms"
     }'
   
   # Check console for code
   # Verify
   curl -X POST http://localhost:5000/api/v1/auth/2fa/verify \
     -H "Content-Type: application/json" \
     -d '{
       "twoFactorId": "from_registration_response",
       "code": "123456"
     }'
   ```

2. **Login with 2FA**
   ```bash
   # Initial login
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!",
       "tenantSlug": "test-salon-1234567890"
     }'
   
   # Check console for code
   # Login with code
   curl -X POST http://localhost:5000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "Test123!",
       "tenantSlug": "test-salon-1234567890",
       "twoFactorId": "from_initial_login",
       "twoFactorCode": "123456"
     }'
   ```

### Automated Tests

```javascript
// tests/2fa.test.js
describe('Two-Factor Authentication', () => {
  it('should send 2FA code on registration', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        businessName: 'Test Salon',
        email: 'test@example.com',
        phone: '+254712345678',
        password: 'Test123!',
        firstName: 'Test',
        lastName: 'User'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.requiresVerification).toBe(true);
    expect(res.body.twoFactorId).toBeDefined();
  });
  
  it('should verify code successfully', async () => {
    // ... test implementation
  });
  
  it('should reject invalid code', async () => {
    // ... test implementation
  });
  
  it('should lock after max attempts', async () => {
    // ... test implementation
  });
});
```

---

## Troubleshooting

### Issue: Codes not being sent

**Check:**
1. Console logs in development mode
2. SMS/Email provider credentials
3. Phone number format (E.164: +254712345678)
4. Email address validity

### Issue: "Code expired" error

**Solution:**
- Codes expire after 10 minutes
- Request a new code using resend endpoint
- Check server time synchronization

### Issue: "Too many attempts" error

**Solution:**
- User exceeded 5 verification attempts
- Request a new code (resets attempt counter)
- Implement CAPTCHA to prevent abuse

### Issue: "Rate limited" on resend

**Solution:**
- Wait 60 seconds between resend requests
- Display countdown timer to user
- This prevents SMS/email spam

---

## Migration Guide

### For Existing Users

Existing users without 2FA can continue logging in normally. To enable 2FA:

```javascript
// Update user settings
PUT /api/v1/auth/2fa/settings
{
  "enabled": true,
  "method": "sms"
}
```

### Database Migration

Run this to update existing users:

```javascript
// migration-script.js
const User = require('./models/User');
const Client = require('./models/Client');

async function migrate() {
  // Update all users
  await User.updateMany(
    { twoFactorEnabled: { $exists: false } },
    {
      $set: {
        twoFactorEnabled: false, // Optional for existing users
        twoFactorMethod: 'sms',
        phoneVerified: true, // Assume existing users are verified
        emailVerified: true
      }
    }
  );
  
  // Update all clients
  await Client.updateMany(
    { twoFactorEnabled: { $exists: false } },
    {
      $set: {
        accountStatus: 'active',
        twoFactorEnabled: false,
        twoFactorMethod: 'sms',
        phoneVerified: true
      }
    }
  );
  
  console.log('Migration complete');
}

migrate();
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Verification Success Rate**
   - % of codes successfully verified
   - Target: >95%

2. **Average Verification Time**
   - Time from code sent to verification
   - Target: <2 minutes

3. **Failed Attempts**
   - Codes that hit max attempts
   - Investigate patterns

4. **Resend Rate**
   - % of users requesting resend
   - High rate may indicate delivery issues

### Dashboard Query

```javascript
// Get 2FA stats
GET /api/v1/admin/2fa/stats?days=30

// Response
{
  "success": true,
  "data": [
    {
      "_id": { "purpose": "registration", "method": "sms" },
      "total": 150,
      "verified": 142,
      "failed": 8
    },
    {
      "_id": { "purpose": "login", "method": "email" },
      "total": 320,
      "verified": 315,
      "failed": 5
    }
  ]
}
```

---

## Support & Maintenance

### Cleanup Job

Run periodically to remove expired codes:

```javascript
// Add to cron job or scheduler
const twoFactorService = require('./services/twoFactorService');

// Run every hour
setInterval(async () => {
  await twoFactorService.cleanupExpired();
}, 3600000);
```

### User Support

**Common User Issues:**

1. **"I didn't receive the code"**
   - Check spam folder (email)
   - Verify phone number format
   - Use resend function
   - Try alternative method (SMS ↔ Email)

2. **"My code expired"**
   - Request new code
   - Codes valid for 10 minutes

3. **"I'm locked out"**
   - Too many failed attempts
   - Request new code (resets counter)
   - Contact support if persistent

---

## Conclusion

This 2FA implementation provides robust security for your multi-tenant salon management system. It's:

- ✅ **Secure** - Industry-standard practices
- ✅ **User-Friendly** - Clear flows and error messages
- ✅ **Flexible** - Multiple delivery methods
- ✅ **Scalable** - Tenant-isolated and performant
- ✅ **Maintainable** - Clean code and documentation

For questions or issues, refer to the troubleshooting section or contact the development team.
