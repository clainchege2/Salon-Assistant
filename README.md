# Hairvia - Multitenant Salon Management Platform

Hairvia is a comprehensive salon management platform designed for salons in Kenya, with support for iOS and Android mobile apps.

## Features

### For Salon Owners
- **Complete Business Management**: Manage bookings, clients, staff, and services
- **Role-Based Access Control**: Owner has full control, can create/block staff access
- **Material Tracking**: Track usage of salon materials and inventory
- **Client Categorization**: Automatic categorization (VIP, Usual, New, Long-time no see)
- **Communication Hub**: View and respond to client feedback and inquiries
- **Marketing Tools**: Create and schedule promotional campaigns

### For Staff (Manager & Stylist)
- **Booking Management**: Add bookings and new clients
- **Walk-in & Reserved**: Categorize bookings appropriately
- **Service Customization**: Add customer instructions and service details
- **Quick Reminders**: Send appointment reminders with customizable messages

### For Clients (Customer Portal)
- **Easy Booking**: Book appointments online
- **Service Catalog**: View available services with images and prices
- **Feedback System**: Leave feedback and communicate with salon
- **Booking History**: View past and upcoming appointments

### For Developers (Admin Portal)
- **Tenant Management**: View all registered salons
- **Troubleshooting**: Access tenant details and statistics
- **Suspension/Delisting**: Handle non-payment or rule violations
- **System Monitoring**: Track platform health and usage

## Tech Stack

### Backend
- Node.js & Express
- MongoDB with tenant isolation
- JWT authentication
- Twilio (SMS for Kenya)
- Cloudinary (image storage)

### Mobile App
- React Native (iOS & Android)
- Expo framework
- React Navigation

### Admin Portal
- React
- Axios for API calls

## Security Features

- **Tenant Isolation**: Complete data separation between salons
- **Role-Based Permissions**: Granular access control
- **Rate Limiting**: Protection against abuse
- **Input Sanitization**: XSS protection
- **Audit Logging**: Track sensitive operations
- **Secure Authentication**: JWT with refresh tokens
- **HTTPS Only**: Encrypted communication

## Compliance

- Kenya Data Protection Act compliant
- GDPR ready for international expansion
- Secure data storage and encryption
- User consent management
- Data deletion capabilities

## Project Structure

```
hairvia/
├── backend/              # Node.js API
│   ├── src/
│   │   ├── models/      # Database models
│   │   ├── controllers/ # Business logic
│   │   ├── middleware/  # Auth, security, tenant isolation
│   │   ├── routes/      # API endpoints
│   │   └── config/      # Configuration
├── mobile/              # React Native app
│   ├── src/
│   │   ├── screens/    # App screens
│   │   ├── services/   # API integration
│   │   └── context/    # State management
└── admin-portal/        # Admin dashboard
    └── src/
        └── pages/      # Admin pages
```

## Getting Started

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed setup instructions.

### Quick Start

1. **Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
```

2. **Mobile App**
```bash
cd mobile
npm install
npm start
```

3. **Admin Portal**
```bash
cd admin-portal
npm install
npm start
```

## API Documentation

### Authentication
- `POST /api/v1/auth/register` - Register new salon
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Bookings
- `GET /api/v1/bookings` - Get all bookings
- `POST /api/v1/bookings` - Create booking
- `PUT /api/v1/bookings/:id` - Update booking
- `DELETE /api/v1/bookings/:id` - Delete booking (owner only)

### Communications
- `GET /api/v1/communications` - Get communications
- `POST /api/v1/communications` - Create communication
- `PUT /api/v1/communications/:id/reply` - Reply to communication

### Admin (Developer Portal)
- `GET /api/v1/admin/stats` - System statistics
- `GET /api/v1/admin/tenants` - All tenants
- `PUT /api/v1/admin/tenants/:id/suspend` - Suspend tenant
- `PUT /api/v1/admin/tenants/:id/delist` - Delist tenant
- `PUT /api/v1/admin/tenants/:id/reactivate` - Reactivate tenant

## License

Proprietary - All rights reserved

## Support

For support, contact: [support email]
