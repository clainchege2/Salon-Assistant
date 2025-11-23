# Client Portal API Endpoint Fix

## Issue
Client portal was getting 404 errors because the API endpoints were inconsistent between frontend and backend.

## Root Cause
- **Backend route**: Registered as `/api/v1/client-bookings` in app.js
- **Frontend calls**: Were using `/api/v1/client/*` (wrong path)
- **Result**: 404 Not Found errors for all client portal features

## All Endpoints Fixed

### Frontend (Client Portal)
Updated all API calls from `/api/v1/client/*` to `/api/v1/client-bookings/*`:

1. **MyBookings.js**
   - GET bookings: `/api/v1/client-bookings`
   - PUT cancel: `/api/v1/client-bookings/:id/cancel`
   - PUT reactivate: `/api/v1/client-bookings/:id/reactivate`

2. **Dashboard.js**
   - GET bookings: `/api/v1/client-bookings`
   - GET messages: `/api/v1/client-bookings/messages`
   - GET campaigns: `/api/v1/client-bookings/campaigns`

3. **Messages.js**
   - GET messages: `/api/v1/client-bookings/messages`
   - PUT mark as read: `/api/v1/client-bookings/messages/:id/read`
   - GET campaigns: `/api/v1/client-bookings/campaigns`

4. **Feedback.js**
   - GET bookings: `/api/v1/client-bookings`
   - POST feedback: `/api/v1/client-bookings/feedback`

5. **BookAppointment.js**
   - GET services: `/api/v1/client-bookings/services`
   - GET staff: `/api/v1/client-bookings/staff`
   - GET availability: `/api/v1/client-bookings/availability`
   - POST create booking: `/api/v1/client-bookings`

### Backend (clientBookings.js)
Fixed all route paths and comments:
- Changed `router.post('/bookings')` → `router.post('/')`
- Changed `router.put('/bookings/:id/cancel')` → `router.put('/:id/cancel')`
- Changed `router.put('/bookings/:id/reactivate')` → `router.put('/:id/reactivate')`
- Changed `router.put('/bookings/:id/instructions')` → `router.put('/:id/instructions')`
- Updated all route comments from `/api/v1/client/*` to `/api/v1/client-bookings/*`

## Complete Route List

All client portal routes are now under `/api/v1/client-bookings`:

- `GET /api/v1/client-bookings` - Get all bookings
- `GET /api/v1/client-bookings/:id` - Get single booking
- `POST /api/v1/client-bookings` - Create booking
- `PUT /api/v1/client-bookings/:id/cancel` - Cancel booking
- `PUT /api/v1/client-bookings/:id/reactivate` - Reactivate booking
- `PUT /api/v1/client-bookings/:id/instructions` - Update instructions
- `GET /api/v1/client-bookings/services` - Get services
- `GET /api/v1/client-bookings/staff` - Get staff
- `GET /api/v1/client-bookings/availability` - Get availability
- `GET /api/v1/client-bookings/messages` - Get messages
- `PUT /api/v1/client-bookings/messages/:id/read` - Mark message as read
- `GET /api/v1/client-bookings/campaigns` - Get campaigns
- `POST /api/v1/client-bookings/feedback` - Submit feedback
- `GET /api/v1/client-bookings/profile` - Get profile

## Result
✅ All client portal features now work correctly  
✅ No more 404 errors  
✅ Consistent API endpoint naming across entire client portal  
✅ Backend routes properly documented
