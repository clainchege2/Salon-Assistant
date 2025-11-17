# Client Portal - Setup Guide

## Overview
Creating a web-based client portal for customers to:
- View their booking history
- Book new appointments
- Update their profile
- View loyalty points
- Receive notifications

## Quick Setup

### Option 1: Create React App (Recommended)
```bash
# From project root
npx create-react-app client-portal
cd client-portal
npm start
```

### Option 2: Use Existing Structure
Copy the admin-portal structure and modify for clients:
```bash
cp -r admin-portal client-portal
cd client-portal
# Update package.json name
# Update port in .env (use 3002)
```

## Client Portal Structure

```
client-portal/
├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── BookingCard.js
│   │   ├── ServiceCard.js
│   │   └── ProfileForm.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Dashboard.js
│   │   ├── BookAppointment.js
│   │   ├── MyBookings.js
│   │   ├── Profile.js
│   │   └── Loyalty.js
│   ├── utils/
│   │   └── api.js
│   ├── App.js
│   ├── App.css
│   └── index.js
├── .env
└── package.json
```

## Key Features

### 1. Authentication
- Client login with phone number
- OTP verification
- Session management

### 2. Dashboard
- Upcoming appointments
- Recent bookings
- Loyalty points balance
- Quick book button

### 3. Book Appointment
- Browse services
- Select date/time
- Choose stylist (optional)
- Add special requests

### 4. My Bookings
- View all bookings
- Cancel/reschedule
- Add to calendar
- Rate completed services

### 5. Profile
- Update personal info
- Manage preferences
- Communication settings
- Payment methods

### 6. Loyalty Program
- Points balance
- Rewards catalog
- Referral tracking
- Special offers

## Backend API Endpoints Needed

### Authentication
- `POST /api/v1/client-auth/login` - Client login
- `POST /api/v1/client-auth/verify-otp` - Verify OTP
- `POST /api/v1/client-auth/register` - New client registration

### Bookings
- `GET /api/v1/client/bookings` - Get client's bookings
- `POST /api/v1/client/bookings` - Create new booking
- `PUT /api/v1/client/bookings/:id` - Update booking
- `DELETE /api/v1/client/bookings/:id` - Cancel booking

### Services
- `GET /api/v1/client/services` - Get available services
- `GET /api/v1/client/availability` - Check availability

### Profile
- `GET /api/v1/client/profile` - Get client profile
- `PUT /api/v1/client/profile` - Update profile

### Loyalty
- `GET /api/v1/client/loyalty` - Get loyalty points
- `GET /api/v1/client/rewards` - Get available rewards
- `POST /api/v1/client/redeem` - Redeem reward

## Environment Variables

Create `client-portal/.env`:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_NAME=HairVia Client Portal
PORT=3002
```

## Styling

### Theme Colors
```css
:root {
  --primary: #ff69b4;      /* Hot Pink */
  --secondary: #9b59b6;    /* Purple */
  --success: #2ecc71;      /* Green */
  --warning: #f39c12;      /* Orange */
  --danger: #e74c3c;       /* Red */
  --dark: #2c3e50;         /* Dark Blue */
  --light: #ecf0f1;        /* Light Gray */
}
```

### Mobile-First Design
- Responsive layout
- Touch-friendly buttons
- Easy navigation
- Fast loading

## Security Considerations

### Client Authentication
- Phone-based OTP login
- JWT tokens with short expiry
- Secure session storage
- HTTPS only in production

### Data Access
- Clients can only see their own data
- No access to other clients' info
- Rate limiting on API calls
- Input validation

## Next Steps

1. **Create the portal structure**
   ```bash
   npx create-react-app client-portal
   ```

2. **Install dependencies**
   ```bash
   cd client-portal
   npm install axios react-router-dom
   ```

3. **Create backend routes**
   - Add client authentication controller
   - Add client-specific endpoints
   - Add middleware for client auth

4. **Build core pages**
   - Login/Register
   - Dashboard
   - Book Appointment
   - My Bookings

5. **Test and deploy**
   - Test on mobile devices
   - Optimize performance
   - Deploy to production

## Would You Like Me To:

1. ✅ **Create the full client portal structure** (recommended)
2. ✅ **Create backend API endpoints for clients**
3. ✅ **Build specific pages (Login, Dashboard, etc.)**
4. ✅ **Set up authentication flow**
5. ✅ **All of the above**

Let me know which option you'd like, and I'll build it for you!
