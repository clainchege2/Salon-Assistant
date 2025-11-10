# HairVia - Complete Salon Management System Build Prompt

## Project Overview
Build a complete multi-tenant salon management system for the Kenyan market with three subscription tiers (Free, Pro, Premium). The system includes a web admin portal, REST API backend, and mobile app.

## Tech Stack Requirements

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with refresh tokens
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors, rate limiting
- **Logging**: winston
- **Environment**: dotenv

### Admin Portal (Web)
- **Framework**: React 18+
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS Modules or plain CSS
- **Icons**: Use emoji or simple SVG icons
- **Build Tool**: Create React App or Vite

### Mobile App
- **Framework**: React Native
- **Navigation**: React Navigation
- **State**: React Context API
- **HTTP**: Axios

## Core Features by Tier

### FREE TIER (Trial)
**Users**: Owner only (no staff accounts)
**Features**:
- Client management (CRUD)
- Service management (CRUD)
- Booking management (CRUD)
- Basic dashboard with stats
- Profile settings

### PRO TIER (Basic)
**Users**: Owner + unlimited staff
**Additional Features**:
- Staff management with role-based permissions
- Stock/inventory management with barcode scanning
- SMS/Email communications
- Client segmentation (New, Regular, VIP)
- Staff performance tracking

### PREMIUM TIER
**Users**: Owner + unlimited staff
**Additional Features** (includes all Pro features):
- Advanced marketing automation
- RFM (Recency, Frequency, Monetary) analysis
- Campaign scheduling
- Client targeting and segmentation
- Advanced analytics and reports
- Revenue forecasting

## Database Schema

### Tenants Collection
```javascript
{
  businessName: String (required),
  slug: String (required, unique, lowercase, indexed),
  contactEmail: String (required),
  contactPhone: String (required),
  country: String (default: 'Kenya', enum: ['Kenya', 'USA']),
  status: String (enum: ['active', 'suspended', 'delisted', 'trial'], default: 'trial'),
  subscriptionTier: String (enum: ['trial', 'basic', 'premium'], default: 'trial'),
  address: {
    street: String,
    city: String,
    county: String,
    country: String
  },
  settings: {
    timezone: String (default: 'Africa/Nairobi'),
    currency: String (default: 'KES'),
    businessHours: [{
      day: String,
      open: String,
      close: String,
      closed: Boolean
    }],
    bookingBuffer: Number (default: 15)
  },
  timestamps: true
}
```

### Users Collection
```javascript
{
  tenantId: ObjectId (required, ref: 'Tenant'),
  email: String (required, unique per tenant, lowercase),
  phone: String (required),
  password: String (required, select: false, min: 8),
  firstName: String (required),
  lastName: String (required),
  role: String (enum: ['owner', 'staff'], default: 'staff'),
  permissions: {
    canManageStaff: Boolean (default: false),
    canViewReports: Boolean (default: false),
    canManageInventory: Boolean (default: false),
    canViewCommunications: Boolean (default: false),
    canViewMarketing: Boolean (default: false)
  },
  isActive: Boolean (default: true),
  lastLogin: Date,
  timestamps: true
}
```

### Clients Collection
```javascript
{
  tenantId: ObjectId (required, ref: 'Tenant'),
  firstName: String (required),
  lastName: String (required),
  email: String,
  phone: String (required),
  dateOfBirth: Date,
  gender: String (enum: ['male', 'female', 'other']),
  address: String,
  notes: String,
  category: String (enum: ['new', 'regular', 'vip'], default: 'new'),
  totalVisits: Number (default: 0),
  totalSpent: Number (default: 0),
  lastVisit: Date,
  marketingConsent: Boolean (default: false),
  preferredStylist: ObjectId (ref: 'User'),
  tags: [String],
  timestamps: true
}
```

### Services Collection
```javascript
{
  tenantId: ObjectId (required, ref: 'Tenant'),
  name: String (required),
  description: String,
  duration: Number (required, in minutes),
  price: Number (required),
  category: String (enum: ['Hair', 'Nails', 'Makeup', 'Spa', 'Other']),
  isActive: Boolean (default: true),
  timestamps: true
}
```

### Bookings Collection
```javascript
{
  tenantId: ObjectId (required, ref: 'Tenant'),
  clientId: ObjectId (required, ref: 'Client'),
  serviceId: ObjectId (required, ref: 'Service'),
  staffId: ObjectId (ref: 'User'),
  staffName: String,
  date: Date (required),
  startTime: String (required),
  endTime: String (required),
  status: String (enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'], default: 'pending'),
  totalPrice: Number (required),
  notes: String,
  reminderSent: Boolean (default: false),
  timestamps: true
}
```

### Communications Collection (Pro+)
```javascript
{
  tenantId: ObjectId (required, ref: 'Tenant'),
  type: String (enum: ['sms', 'email'], required),
  subject: String,
  message: String (required),
  recipients: [ObjectId] (ref: 'Client'),
  segmentCriteria: Object,
  status: String (enum: ['draft', 'scheduled', 'sent', 'failed'], default: 'draft'),
  scheduledFor: Date,
  sentAt: Date,
  sentBy: ObjectId (ref: 'User'),
  createdBy: ObjectId (ref: 'User'),
  timestamps: true
}
```

### MaterialItems Collection (Pro+)
```javascript
{
  tenantId: ObjectId (required, ref: 'Tenant'),
  name: String (required),
  barcode: String (unique, sparse),
  category: String,
  quantity: Number (required, default: 0),
  unit: String (default: 'piece'),
  reorderLevel: Number (default: 10),
  costPrice: Number,
  supplier: String,
  lastRestocked: Date,
  notes: String,
  timestamps: true
}
```

## Authentication & Authorization

### Registration Flow
1. User registers with business name, email, phone, password
2. System creates tenant with unique slug (businessName-timestamp)
3. System creates owner user linked to tenant
4. Return JWT token and refresh token

### Login Flow
1. User provides email, password, and tenant slug
2. System finds tenant by slug
3. System finds user by email within that tenant
4. Validate password using bcrypt
5. Return JWT token, refresh token, and user data (including subscriptionTier)

### Permission System
- **Owner**: Has all permissions automatically
- **Staff**: Only has permissions explicitly granted
- **Free Tier**: No staff accounts allowed
- **Pro/Premium**: Staff can have granular permissions

### JWT Configuration
```javascript
JWT_SECRET=your-secret-key
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRE=7d
```

## API Endpoints Structure

### Auth Routes (`/api/v1/auth`)
- POST `/register` - Register new salon
- POST `/login` - Login with tenant slug
- POST `/refresh` - Refresh access token
- GET `/me` - Get current user info
- PUT `/profile` - Update profile
- PUT `/change-password` - Change password

### Client Routes (`/api/v1/clients`)
- GET `/` - List all clients (with pagination, search, filter)
- POST `/` - Create client
- GET `/:id` - Get client details
- PUT `/:id` - Update client
- DELETE `/:id` - Delete client
- GET `/:id/history` - Get client booking history

### Service Routes (`/api/v1/services`)
- GET `/` - List all services
- POST `/` - Create service
- GET `/:id` - Get service details
- PUT `/:id` - Update service
- DELETE `/:id` - Delete service

### Booking Routes (`/api/v1/bookings`)
- GET `/` - List bookings (with date range, status filters)
- POST `/` - Create booking
- GET `/:id` - Get booking details
- PUT `/:id` - Update booking
- DELETE `/:id` - Cancel booking
- PUT `/:id/status` - Update booking status
- GET `/calendar` - Get calendar view data

### Staff Routes (`/api/v1/staff`) - Pro+
- GET `/` - List staff members
- POST `/` - Add staff member
- GET `/:id` - Get staff details
- PUT `/:id` - Update staff
- DELETE `/:id` - Remove staff
- PUT `/:id/permissions` - Update permissions

### Communications Routes (`/api/v1/communications`) - Pro+
- GET `/` - List communications
- POST `/` - Create communication
- GET `/:id` - Get communication details
- PUT `/:id` - Update communication
- DELETE `/:id` - Delete communication
- POST `/:id/send` - Send communication

### Marketing Routes (`/api/v1/marketing`) - Premium
- GET `/rfm-analysis` - Get RFM analysis
- GET `/segments` - Get client segments
- POST `/campaigns` - Create campaign
- GET `/campaigns` - List campaigns
- GET `/analytics` - Get marketing analytics

### Materials Routes (`/api/v1/materials`) - Pro+
- GET `/` - List materials
- POST `/` - Add material
- GET `/:id` - Get material details
- PUT `/:id` - Update material
- DELETE `/:id` - Delete material
- POST `/scan` - Scan barcode
- PUT `/:id/restock` - Restock material

### Reports Routes (`/api/v1/reports`) - Premium
- GET `/revenue` - Revenue reports
- GET `/clients` - Client reports
- GET `/staff-performance` - Staff performance
- GET `/services` - Service popularity

## Admin Portal Pages

### Public Pages
- `/login` - Login page with tenant slug input

### Dashboard (`/dashboard`)
- **Owner View**: 
  - Stats cards (total bookings, clients, revenue)
  - Recent bookings table
  - Quick actions (new booking, new client)
  - Revenue chart
- **Staff View**:
  - Welcome message
  - My upcoming appointments only
  - Quick actions (new booking, new client)
  - No revenue/price information

### Bookings (`/bookings`)
- List view with filters (date range, status, staff)
- Calendar view
- Create/edit booking modal
- Status update actions
- Search by client name

### Clients (`/clients`)
- List view with search and filters
- Client cards with category badges
- Create/edit client modal
- Client detail view with booking history
- Export functionality

### Services (`/services`)
- List view with categories
- Create/edit service modal
- Active/inactive toggle
- Price and duration display

### Staff (`/staff`) - Pro+ Owner Only
- List of staff members
- Add/edit staff modal
- Permission management
- Active/inactive toggle
- Performance metrics (Premium)

### Communications (`/communications`) - Pro+ Owner Only
- List of sent/draft communications
- Create communication modal
- Client segment selection
- Schedule sending
- Message templates

### Marketing (`/marketing`) - Premium Owner Only
- RFM analysis dashboard
- Client segments visualization
- Campaign creation
- Campaign performance metrics
- Automated campaign setup

### Stock Management (`/stock`) - Pro+
- Material list with low stock alerts
- Add/edit material modal
- Barcode scanning interface
- Restock functionality
- Supplier management

### Reports (`/reports`) - Premium Owner Only
- Revenue reports with charts
- Client acquisition/retention
- Service popularity
- Staff performance
- Export to PDF/Excel

### Settings (`/settings`)
- Profile settings
- Business information
- Subscription management (owner only)
- Notification preferences

## Mobile App Screens

### Authentication
- Login screen
- Registration screen

### Main Tabs
- Home (Dashboard)
- Bookings
- Clients
- Profile

### Home Screen
- Quick stats
- Today's appointments
- Quick actions

### Bookings Screen
- List of bookings
- Filter by date/status
- Create new booking
- Booking details

### Clients Screen
- Client list with search
- Client details
- Add new client
- Call/message client

### Profile Screen
- User information
- Settings
- Logout

## UI/UX Requirements

### Design Principles
- Clean, modern interface
- Mobile-first responsive design
- Consistent color scheme (primary, secondary, success, warning, danger)
- Clear typography hierarchy
- Intuitive navigation
- Loading states for all async operations
- Error handling with user-friendly messages
- Success confirmations for actions

### Color Scheme Suggestion
- Primary: #6366f1 (Indigo)
- Secondary: #8b5cf6 (Purple)
- Success: #10b981 (Green)
- Warning: #f59e0b (Amber)
- Danger: #ef4444 (Red)
- Background: #f9fafb (Light gray)
- Text: #111827 (Dark gray)

### Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- Sufficient color contrast
- Focus indicators
- Alt text for images

## Security Requirements

### Password Security
- Minimum 8 characters
- Hash with bcrypt (salt rounds: 10)
- Never store plain text passwords
- Secure password reset flow

### API Security
- JWT authentication for all protected routes
- Rate limiting (100 requests per 15 minutes per IP)
- CORS configuration
- Helmet for security headers
- Input validation and sanitization
- SQL injection prevention (use Mongoose)
- XSS protection

### Data Privacy
- Multi-tenant data isolation (always filter by tenantId)
- Soft delete for sensitive data
- Audit logs for critical actions
- GDPR compliance considerations

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/hairvia
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Admin Portal (.env)
```
REACT_APP_API_URL=http://localhost:5000/api/v1
```

## Testing Requirements

### Seed Data
Create seed script that generates:
- 3 tenants (one per tier)
- Multiple users per tenant
- Sample clients (15-40 per tenant)
- Sample services (5-10 per tenant)
- Sample bookings (past, present, future)
- Sample communications (Premium)
- Sample materials (Pro+)

### Test Accounts
- **Free Tier**: owner@basicbeauty.com / Password123!
- **Pro Tier**: owner@elitestyles.com / Password123!
- **Premium Tier**: owner@luxuryhair.com / Password123!

## Development Workflow

### Phase 1: Backend Foundation
1. Set up Express server with middleware
2. Configure MongoDB connection
3. Create all Mongoose models
4. Implement authentication (register, login, JWT)
5. Create CRUD routes for core entities
6. Add validation and error handling

### Phase 2: Admin Portal Core
1. Set up React app with routing
2. Create authentication pages
3. Build dashboard layout with navigation
4. Implement client management
5. Implement service management
6. Implement booking management

### Phase 3: Advanced Features
1. Add staff management (Pro+)
2. Add communications (Pro+)
3. Add stock management (Pro+)
4. Add marketing features (Premium)
5. Add reports (Premium)

### Phase 4: Mobile App
1. Set up React Native project
2. Implement authentication
3. Build main navigation
4. Create booking screens
5. Create client screens
6. Add offline support

### Phase 5: Polish & Deploy
1. Add loading states and error handling
2. Implement responsive design
3. Add data validation
4. Performance optimization
5. Security audit
6. Documentation
7. Deployment setup

## Deployment Considerations

### Backend
- Use PM2 for process management
- Set up MongoDB Atlas or local MongoDB
- Configure environment variables
- Set up logging
- Enable HTTPS

### Frontend
- Build optimized production bundle
- Configure CDN for static assets
- Set up proper CORS
- Enable gzip compression

### Mobile
- Build APK for Android
- Build IPA for iOS
- Configure app signing
- Set up push notifications (future)

## Success Criteria

### Functional Requirements
✅ Multi-tenant architecture working correctly
✅ All CRUD operations functional
✅ Authentication and authorization working
✅ Tier-based feature access enforced
✅ Staff permissions working correctly
✅ Data isolation between tenants
✅ Responsive design on all devices

### Performance Requirements
✅ API response time < 500ms
✅ Page load time < 3 seconds
✅ Database queries optimized with indexes
✅ No memory leaks
✅ Handles 100+ concurrent users

### Security Requirements
✅ All passwords hashed
✅ JWT tokens secure
✅ Rate limiting active
✅ Input validation on all endpoints
✅ No sensitive data in logs
✅ CORS properly configured

## Additional Notes

- Use Kenyan phone number format: +254XXXXXXXXX
- Currency: KES (Kenyan Shillings)
- Timezone: Africa/Nairobi
- Date format: DD/MM/YYYY
- Time format: 24-hour (HH:mm)
- All monetary values stored as integers (cents/smallest unit)
- Use proper error codes (400, 401, 403, 404, 500)
- Log all errors with winston
- Use async/await for all async operations
- Follow RESTful API conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use ES6+ features
- Follow consistent code style

## Final Deliverables

1. **Backend API** - Fully functional REST API
2. **Admin Portal** - Complete web application
3. **Mobile App** - React Native app (iOS & Android)
4. **Database** - MongoDB with proper indexes
5. **Seed Script** - For testing with sample data
6. **Documentation** - API docs, setup guide, user guide
7. **Environment Files** - Example .env files
8. **README** - Project overview and setup instructions

---

**Build this system with clean, maintainable code following best practices. Ensure proper error handling, validation, and security throughout. The system should be production-ready and scalable.**
