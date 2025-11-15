# Form Field Reordering - AddBooking.js

## Current Order (Illogical)
1. Client Selection
2. Booking Type
3. **Date/Time** ← Too early!
4. Staff Assignment
5. Services Selection

## New Order (Logical)
1. Client Selection
2. Booking Type
3. **Services Selection** ← Move up
4. **Staff Assignment** ← Move up
5. **Date/Time** ← Move down (requires services & staff first)

## Why This Order Makes Sense
- User selects WHO (client)
- User selects WHAT (services) - determines duration
- User selects WHO DOES IT (staff) - determines availability
- User selects WHEN (date/time) - shows available slots based on above

## Implementation

The Date/Time section (lines ~524-575) including the calendar should be moved to AFTER the Services section.

### Section to Move:
```javascript
// Lines 524-575: Date/Time + Calendar
<div className="form-row">
  <div className="form-group">
    <label>Date *</label>
    ...
  </div>
  <div className="form-group">
    <label>Time *</label>
    <div className="time-selection">
      ...
      <button className="btn-calendar">
        📅 View Available Slots
      </button>
    </div>
    ...
  </div>
</div>

{showCalendar && ... (
  <div className="calendar-container">
    <BookingCalendar ... />
  </div>
)}
```

### Move To:
After the Services section (after line ~620) and before Customer Instructions

## Result
User flow becomes:
1. Select client ✓
2. Choose booking type ✓
3. Pick services → calculates duration ✓
4. Assign staff → determines who's availability to check ✓
5. Select date → enables calendar button ✓
6. Click "View Available Slots" → shows available times ✓
7. Pick time slot → auto-fills time ✓
8. Add instructions (optional) ✓
9. Submit ✓

This is the natural, logical flow!
