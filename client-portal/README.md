# HairVia Client Portal

A web-based client portal for customers to book appointments, view their booking history, and manage their profile.

## Features

- 🔐 **Authentication** - Login/Register with phone number
- 📅 **Book Appointments** - Browse services and book online
- 📋 **View Bookings** - See all past and upcoming appointments
- 👤 **Profile Management** - View and update personal information
- ⭐ **Loyalty Points** - Track rewards and points

## Setup Instructions

### 1. Install Dependencies
```bash
cd client-portal
npm install
```

### 2. Configure Environment
The `.env` file is already configured:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_NAME=HairVia
PORT=3002
```

### 3. Start the Portal
```bash
npm start
```

The portal will open at `http://localhost:3002`

## Backend API Requirements

The client portal requires these backend endpoints:

### Authentication
- `POST /api/v1/client-auth/login` - Client login
- `POST /api/v1/client-auth/register` - Client registration

### Bookings
- `GET /api/v1/client/bookings` - Get client's bookings
- `POST /api/v1/bookings` - Create new booking

### Services
- `GET /api/v1/services` - Get available services

## Pages

### 1. Login (`/login`)
- Phone number and password authentication
- Link to registration page

### 2. Register (`/register`)
- New client registration
- Collects: First name, Last name, Phone, Email (optional), Password

### 3. Dashboard (`/dashboard`)
- Welcome message with client name
- Quick action buttons (Book, My Bookings, Profile)
- Stats cards (Loyalty Points, Total Visits, Status)
- Upcoming appointments list

### 4. Book Appointment (`/book`)
- Browse and select services
- Choose date and time
- Add special notes
- Confirm booking

### 5. My Bookings (`/bookings`)
- View all bookings (past and upcoming)
- See booking details (services, date, time, stylist)
- Status badges (pending, confirmed, completed)

### 6. Profile (`/profile`)
- View personal information
- See account statistics
- Loyalty points balance

## Styling

The portal uses a modern, mobile-first design with:
- **Primary Color:** Hot Pink (#ff69b4)
- **Secondary Color:** Purple (#9b59b6)
- **Gradient Background:** Purple gradient
- **Responsive Design:** Works on all devices

## Security

- JWT token-based authentication
- Tokens stored in localStorage
- Protected routes (redirect to login if not authenticated)
- Client can only access their own data

## Next Steps

To complete the client portal:

1. **Add Backend Routes** - Create client-auth controller and routes
2. **Add Cancel/Reschedule** - Allow clients to modify bookings
3. **Add Notifications** - SMS/Email confirmations
4. **Add Payment Integration** - Online payment for bookings
5. **Add Reviews** - Let clients rate completed services
6. **Add Loyalty Rewards** - Redeem points for discounts

## Testing

### Test Account
After setting up the backend, you can create a test client:
- Phone: +254712345678
- Password: password123

### Test Flow
1. Register a new account
2. Login with credentials
3. Browse services
4. Book an appointment
5. View bookings
6. Check profile

## Deployment

For production deployment:

1. Update `.env` with production API URL
2. Build the app: `npm run build`
3. Deploy the `build` folder to your hosting service
4. Ensure HTTPS is enabled
5. Update CORS settings on backend

## Support

For issues or questions, refer to the main project documentation.
