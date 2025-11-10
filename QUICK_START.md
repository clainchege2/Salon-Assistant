# Hairvia Quick Start Guide

## Your Server is Running! 🎉

The backend is now running on `http://localhost:5000`

## Next Steps

### 1. Test the API

You can use the `test-api.http` file with REST Client extension in VS Code, or use curl/Postman:

```bash
# Health check
curl http://localhost:5000/health

# Register a new salon
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "My Salon",
    "email": "owner@mysalon.com",
    "phone": "+254712345678",
    "password": "SecurePass123!",
    "firstName": "Jane",
    "lastName": "Doe",
    "country": "Kenya"
  }'
```

### 2. Start the Mobile App

```bash
cd mobile
npm install
npm start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on your phone

### 3. Start the Admin Portal

```bash
cd admin-portal
npm install
npm start
```

Opens at `http://localhost:3000`

## Current Status

✅ Backend API running on port 5000
✅ MongoDB connected
✅ All routes configured:
   - /api/v1/auth (register, login)
   - /api/v1/bookings
   - /api/v1/clients
   - /api/v1/services
   - /api/v1/communications
   - /api/v1/admin

## Default Permissions

**Owner Role:**
- Full access to everything
- Can create/block staff
- Can delete bookings and clients
- Can view all communications
- Can manage services

**Manager/Stylist Roles:**
- Can add bookings
- Can add new clients
- Cannot delete anything
- Cannot view communications (unless granted by owner)

## Testing Flow

1. **Register a salon** → Get token
2. **Login** → Get token
3. **Create clients** → Add customer data
4. **Create services** → Add hair services
5. **Create bookings** → Schedule appointments
6. **Test communications** → Client feedback

## Important Notes

- All API requests (except auth) require Bearer token
- Tenant isolation is automatic - no cross-tenant data access
- Rate limiting: 100 requests per 15 minutes
- Auth endpoints: 5 attempts per 15 minutes

## Troubleshooting

**MongoDB connection issues?**
- Make sure MongoDB is running
- Check MONGODB_URI in .env file

**Port already in use?**
- Change PORT in .env file
- Or stop other process using port 5000

**Token expired?**
- Use refresh token endpoint
- Or login again

## What to Build Next

1. **SMS Integration**: Configure Twilio for Kenya SMS
2. **Image Upload**: Set up Cloudinary for service images
3. **Scheduling**: Add cron jobs for reminders
4. **Reports**: Add analytics and reporting
5. **Payments**: Integrate M-Pesa for Kenya

Enjoy building with Hairvia! 🚀
