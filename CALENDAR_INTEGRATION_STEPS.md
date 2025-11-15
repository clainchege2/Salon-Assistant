# Calendar Integration - Remaining Steps

## ✅ Completed
1. Backend availability endpoint (`/api/v1/bookings/availability`)
2. BookingCalendar component created
3. Calendar CSS styling
4. Time rounding logic (rounds to nearest hour)

## 🔄 Next Steps

### 1. Update AddBooking.js

Add after line 19 (after formData state):
```javascript
const [showCalendar, setShowCalendar] = useState(false);
const [selectedSlot, setSelectedSlot] = useState(null);

// Calculate total duration from selected services
const totalDuration = formData.services.reduce((sum, s) => sum + (s.duration || 0), 0);
```

### 2. Add Calendar Toggle Handler

```javascript
const handleSlotSelect = (slot) => {
  const slotDate = new Date(slot.time);
  setFormData({
    ...formData,
    scheduledDate: slotDate.toISOString().split('T')[0],
    scheduledTime: `${slotDate.getHours().toString().padStart(2, '0')}:00`
  });
  setSelectedSlot(slot);
  setShowCalendar(false);
};
```

### 3. Replace Time Input Section (around line 520)

Replace:
```javascript
<div className="form-group">
  <label>Time *</label>
  <input
    type="time"
    value={formData.scheduledTime}
    onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
    required
  />
</div>
```

With:
```javascript
<div className="form-group">
  <label>Time *</label>
  <div className="time-selection">
    <input
      type="time"
      value={formData.scheduledTime}
      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
      required
      readOnly
    />
    <button 
      type="button"
      className="btn-calendar"
      onClick={() => setShowCalendar(!showCalendar)}
      disabled={!formData.scheduledDate || !formData.assignedTo || formData.services.length === 0}
    >
      📅 View Available Slots
    </button>
  </div>
  {!formData.scheduledDate && <p className="help-text">Select a date first</p>}
  {!formData.assignedTo && <p className="help-text">Select a staff member first</p>}
  {formData.services.length === 0 && <p className="help-text">Select services first</p>}
</div>

{showCalendar && formData.scheduledDate && formData.assignedTo && (
  <div className="calendar-container">
    <BookingCalendar
      selectedDate={formData.scheduledDate}
      staffId={formData.assignedTo}
      serviceDuration={totalDuration}
      onSelectSlot={handleSlotSelect}
    />
  </div>
)}
```

### 4. Add CSS to AddBooking.css

```css
.time-selection {
  display: flex;
  gap: 12px;
  align-items: center;
}

.time-selection input {
  flex: 1;
}

.btn-calendar {
  padding: 10px 16px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn-calendar:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-1px);
}

.btn-calendar:disabled {
  background: #d1d5db;
  cursor: not-allowed;
  transform: none;
}

.help-text {
  margin: 4px 0 0 0;
  font-size: 12px;
  color: #ef4444;
}

.calendar-container {
  margin-top: 20px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Testing

1. Start backend: `npm run dev` (in backend folder)
2. Start frontend: `npm start` (in admin-portal folder)
3. Navigate to Add Booking
4. Select client, services, staff, and date
5. Click "View Available Slots"
6. Calendar should show available hourly slots
7. Click an available slot to book

## Features Implemented

✅ Hourly time slots (9 AM - 6 PM)
✅ Service duration rounding to nearest hour
✅ Availability checking based on existing bookings
✅ Visual indication of available vs booked slots
✅ Staff-specific availability
✅ Multi-hour booking support (e.g., 2-hour service blocks 2 consecutive slots)

## Notes

- Services under 60 min round to 1 hour
- Services 61-120 min round to 2 hours
- Calendar only shows when date, staff, and services are selected
- Booked slots are disabled and marked red
- Available slots are green and clickable
