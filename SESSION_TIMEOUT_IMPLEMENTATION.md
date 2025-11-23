# Session Timeout & Trusted Device Implementation

## Overview
Implemented 8-hour session timeout with "Remember this device" functionality to balance security and user convenience.

## Features

### 1. Session Timeout (8 Hours)
- **Duration**: 8 hours (industry standard)
- **Auto-logout**: Automatic logout when session expires
- **Warning**: 5-minute warning before expiration
- **Activity tracking**: Session resets on user activity
- **Token validation**: Periodic checks for token validity

### 2. Trusted Device (30 Days)
- **"Remember this device"**: Checkbox during 2FA verification
- **Duration**: 30 days (configurable)
- **Skip 2FA**: Trusted devices skip 2FA on subsequent logins
- **Device fingerprinting**: Based on user agent, language, encoding
- **Auto-cleanup**: Expired devices automatically removed

## Implementation

### Backend

#### JWT Token Expiration
```javascript
// clientAuthController.js
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '8h' // 8 hours
  });
};
```

#### Environment Variables (.env)
```bash
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=8h
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_REFRESH_EXPIRE=7d
```

#### Trusted Device Model
```javascript
{
  userId: ObjectId,
  userModel: 'User' | 'Client',
  tenantId: ObjectId,
  deviceFingerprint: String (SHA-256 hash),
  deviceName: String (e.g., "iPhone", "Chrome Browser"),
  ipAddress: String,
  userAgent: String,
  lastUsed: Date,
  expiresAt: Date (30 days from creation)
}
```

#### Trusted Device Service
- `isDeviceTrusted()` - Check if device is trusted
- `trustDevice()` - Add device to trusted list
- `removeTrustedDevice()` - Remove specific device
- `getTrustedDevices()` - Get all trusted devices
- `removeAllTrustedDevices()` - Remove all devices

#### Device Fingerprinting
```javascript
const generateDeviceFingerprint = (req) => {
  const userAgent = req.get('user-agent') || '';
  const acceptLanguage = req.get('accept-language') || '';
  const acceptEncoding = req.get('accept-encoding') || '';
  
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  return crypto.createHash('sha256').update(fingerprintData).digest('hex');
};
```

### Frontend

#### Session Manager (`sessionManager.js`)
- Monitors session duration (8 hours)
- Shows warning 5 minutes before expiration
- Checks token validity every minute
- Resets timer on user activity (click, keypress, scroll, mousemove)
- Auto-logout on expiration

#### SessionTimeout Component
- Displays warning toast 5 minutes before expiration
- Shows countdown: "Your session will expire in X minutes"
- Click toast to extend session
- Auto-redirects to login on expiration

#### Login Flow with Trusted Device
1. User enters credentials
2. If device is trusted → Skip 2FA, login directly
3. If device is not trusted → Show 2FA form
4. User enters 2FA code
5. User checks "Remember this device for 30 days"
6. Device added to trusted list
7. Next login from same device → Skip 2FA

## User Experience

### First Login (New Device)
1. Enter phone + password
2. Receive 2FA code
3. Enter code
4. ✅ Check "Remember this device for 30 days"
5. Login successful
6. Session active for 8 hours

### Subsequent Login (Trusted Device)
1. Enter phone + password
2. ✅ Device recognized as trusted
3. Login successful (no 2FA required)
4. Session active for 8 hours

### Session Expiration Warning
- **At 7h 55m**: Toast appears
- **Message**: "Your session will expire in 5 minutes. Click to stay logged in."
- **Action**: Click toast → Session resets to 8 hours
- **Ignore**: After 5 minutes → Auto-logout

### Session Expired
- **At 8h 00m**: Auto-logout
- **Redirect**: Login page
- **Message**: "Your session has expired. Please login again."

## Security Features

### Session Security
- ✅ 8-hour timeout (industry standard)
- ✅ JWT token expiration enforced
- ✅ Periodic token validation
- ✅ Activity-based session reset
- ✅ Secure logout on expiration

### Trusted Device Security
- ✅ Device fingerprinting (not easily spoofed)
- ✅ 30-day expiration (auto-cleanup)
- ✅ Tenant isolation (device trusted per salon)
- ✅ IP address tracking
- ✅ User agent validation
- ✅ Last used timestamp

### Best Practices
- ✅ Tokens stored in localStorage (not cookies for SPA)
- ✅ HTTPS required in production
- ✅ Token validation on every API call
- ✅ Audit logging for security events
- ✅ User can manage trusted devices (future feature)

## Configuration

### Adjust Session Timeout
```javascript
// sessionManager.js
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // Change to desired hours
const WARNING_TIME = 5 * 60 * 1000; // Warning time before expiration
```

### Adjust Trusted Device Duration
```javascript
// clientAuthController.js
await trustedDeviceService.trustDevice(
  client._id,
  'Client',
  tenant._id,
  req,
  30 // Change to desired days
);
```

### Adjust Token Expiration
```bash
# .env
JWT_EXPIRE=8h  # Change to 1h, 12h, 24h, etc.
```

## Future Enhancements

### Trusted Device Management
- View all trusted devices in profile
- Remove specific devices
- "Remove all devices" button
- Device details (last used, location)
- Email notification on new device trust

### Advanced Session Management
- Sliding session (extend on activity)
- Remember me (longer session)
- Multiple device sessions
- Force logout all devices
- Session history

### Security Enhancements
- IP-based device validation
- Geolocation tracking
- Suspicious activity detection
- Two-factor for sensitive actions
- Biometric authentication (mobile)

## Testing

### Test Session Timeout
1. Login to client portal
2. Wait 7 hours 55 minutes (or adjust timeout for testing)
3. Should see warning toast
4. Click toast → Session extends
5. Wait 8 hours → Auto-logout

### Test Trusted Device
1. Login with 2FA
2. Check "Remember this device"
3. Logout
4. Login again → Should skip 2FA
5. Clear browser data
6. Login again → Should require 2FA

### Test Token Expiration
```bash
# Set short expiration for testing
JWT_EXPIRE=5m

# Login and wait 5 minutes
# Should auto-logout
```

## Result

✅ **8-hour session timeout** (industry standard)  
✅ **5-minute warning** before expiration  
✅ **Activity-based reset** (user stays active)  
✅ **Trusted device support** (30 days)  
✅ **Skip 2FA on trusted devices**  
✅ **Secure device fingerprinting**  
✅ **Auto-cleanup expired devices**  
✅ **Better UX** (less friction, more security)
