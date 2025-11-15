# Calendar-Based Booking System Implementation

## Overview
Transform the booking system to show a calendar with available time slots, automatically rounding service durations to the nearest hour.

## Key Requirements
1. **Calendar View**: Display bookings in a calendar format
2. **Available Slots**: Show which time slots are available vs booked
3. **Time Rounding**: Round service times to nearest hour (50 min → 1 hour)
4. **Slot Blocking**: Block entire hour when booked

## Implementation Plan

### 1. Backend Changes

#### Update Booking Model (backend/src/models/Booking.js)
- Add `duration` field (in minutes)
- Add `endTime` calculated field
- Add method to round duration to nearest hour

#### Create Availability Endpoint (backend/src/controllers/bookingController.js)
```javascript
// GET /api/v1/bookings/availability?date=2024-01-15&staffId=xxx
// Returns available time slots for a given date and staff member
```

### 2. Frontend Changes

#### Create Calendar Component (admin-portal/src/components/BookingCalendar.js)
- Week view with time slots (9 AM - 6 PM)
- Click on slot to create booking
- Visual indicators:
  - Green: Available
  - Red: Booked
  - Yellow: Partially available

#### Update AddBooking.js
- Replace time picker with calendar slot selection
- Calculate service duration from selected services
- Round duration to nearest hour
- Show only available slots based on:
  - Staff member's existing bookings
  - Operating hours
  - Service duration

### 3. Time Rounding Logic

```javascript
function roundToNearestHour(minutes) {
  return Math.ceil(minutes / 60) * 60;
}

// Examples:
// 30 min → 60 min (1 hour)
// 50 min → 60 min (1 hour)
// 90 min → 120 min (2 hours)
// 150 min → 180 min (3 hours)
```

### 4. Slot Calculation Logic

```javascript
function getAvailableSlots(date, staffId, duration) {
  // 1. Get all bookings for staff on that date
  // 2. Get operating hours (9 AM - 6 PM)
  // 3. Create hourly slots
  // 4. Mark slots as unavailable if:
  //    - Booking exists in that time
  //    - Not enough consecutive slots for service duration
  // 5. Return available slots
}
```

### 5. UI/UX Improvements

#### Calendar View Features:
- **Day View**: Hourly slots for selected date
- **Week View**: Overview of week with availability
- **Staff Filter**: Filter by specific stylist
- **Service Duration Indicator**: Show how many hours service will take
- **Booking Details on Hover**: Show client name, service on hover

#### Visual Design:
- Color-coded slots
- Clear time labels
- Responsive grid layout
- Mobile-friendly touch interactions

## Files to Modify

### Backend:
1. `backend/src/models/Booking.js` - Add duration fields
2. `backend/src/controllers/bookingController.js` - Add availability endpoint
3. `backend/src/routes/bookingRoutes.js` - Add availability route

### Frontend:
1. `admin-portal/src/pages/AddBooking.js` - Complete rewrite with calendar
2. `admin-portal/src/pages/AddBooking.css` - Calendar styling
3. `admin-portal/src/components/BookingCalendar.js` - New calendar component
4. `admin-portal/src/components/BookingCalendar.css` - Calendar styles
5. `admin-portal/src/utils/timeUtils.js` - Time calculation utilities

## Next Steps

1. **Phase 1**: Backend availability endpoint
2. **Phase 2**: Time rounding logic
3. **Phase 3**: Calendar component
4. **Phase 4**: Integration with AddBooking
5. **Phase 5**: Testing and refinement

## Estimated Effort
- Backend: 2-3 hours
- Frontend Calendar: 4-5 hours
- Integration & Testing: 2-3 hours
- **Total**: 8-11 hours of development

Would you like me to start with Phase 1 (Backend) or would you prefer to tackle this in a future session with fresh context?
