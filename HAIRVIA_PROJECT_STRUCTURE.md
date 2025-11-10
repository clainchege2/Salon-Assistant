# Hairvia - Multitenant Salon Management Platform

## Project Structure

```
hairvia/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── models/            # Database models
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Auth, tenant isolation, etc.
│   │   ├── services/          # Business logic
│   │   ├── routes/            # API routes
│   │   ├── utils/             # Helper functions
│   │   └── validators/        # Input validation
│   └── tests/
├── mobile/                     # React Native app
│   ├── src/
│   │   ├── screens/           # App screens
│   │   ├── components/        # Reusable components
│   │   ├── navigation/        # Navigation setup
│   │   ├── services/          # API calls
│   │   └── store/             # State management
├── admin-portal/              # Developer admin portal
│   └── src/
└── shared/                    # Shared types/utilities
```

## Tech Stack
- Backend: Node.js, Express, MongoDB
- Mobile: React Native (iOS & Android)
- Admin Portal: React
- Authentication: JWT with refresh tokens
- Security: Helmet, rate limiting, encryption
- Compliance: GDPR, Kenya Data Protection Act
