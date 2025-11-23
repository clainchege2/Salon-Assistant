# Complete Bookings Permission

## Overview
New delegatable permission that allows stylists and managers to mark bookings as completed after finishing a service.

## Implementation

### 1. New Permission: `canCompleteBookings`

Added to User model permissions:
```javascript
canCompleteBookings: { type: Boolean, default: false }
```

### 2. Permission Assignment

**Owners:**
- Get `canCompleteBookings: true` by default
- Can always complete bookings

**Managers & Stylists:**
- Get `canCompleteBookings: false` by default
- Owner can delegate this permission to trusted staff
- Useful for senior stylists or floor managers

### 3. Backend Enforcement

Updated `bookingController.updateBooking()` to check permission:
```javascript
if (req.body.status === 'completed') {
  const hasPermission = req.user.role === 'owner' || 
                        req.user.permissions?.canCompleteBookings;
  if (!hasPermission) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to complete bookings'
    });
  }
}
```

### 4. What Happens When Booking is Completed

When a booking is marked as completed:
1. ✅ Status changes to "completed"
2. ✅ `completedAt` timestamp is set
3. ✅ Client stats are updated:
   - `totalVisits` incremented
   - `lastVisit` updated
   - `totalSpent` increased
   - Client category recalculated (VIP, Usual, etc.)
4. ✅ Material stock is deducted (if materials were used)
5. ✅ Thank you message sent to client
6. ✅ Communication logged

## Use Cases

### Scenario 1: Stylist Completes Own Booking
- Stylist finishes a haircut
- Marks booking as "completed" in mobile app
- Client stats automatically updated
- Thank you message sent to client

### Scenario 2: Manager Completes Any Booking
- Manager with permission can complete any booking
- Useful when stylist forgets to mark as complete
- Ensures accurate records and client stats

### Scenario 3: Permission Denied
- Junior stylist without permission tries to complete booking
- System returns 403 error
- Only owner can complete or delegate permission

## How to Delegate Permission

Owner can grant this permission in Staff Management:

1. Go to **Staff** page
2. Click on staff member
3. Enable **"Can Complete Bookings"** permission
4. Save changes

## Benefits

✅ **Workflow Efficiency**: Stylists can complete their own bookings
✅ **Accurate Stats**: Client visit counts and spending tracked automatically
✅ **Controlled Access**: Owner decides who can complete bookings
✅ **Audit Trail**: System tracks who completed each booking
✅ **Real-time Updates**: Completion syncs across all devices

## Frontend Implementation Needed

To complete this feature, update the frontend:

### Admin Portal (Staff.js)
Add checkbox for `canCompleteBookings` permission in staff edit form

### Mobile App (HomeScreen.js or BookingsScreen.js)
Add "Mark as Complete" button that:
- Only shows if user has permission
- Calls the update booking API with `status: 'completed'`
- Shows success/error message

### Permission Check Example:
```javascript
const canComplete = user?.role === 'owner' || 
                    user?.permissions?.canCompleteBookings;

{canComplete && (
  <button onClick={() => handleComplete(booking)}>
    ✅ Mark as Complete
  </button>
)}
```

## Testing

1. **Test as Owner**:
   - Should always be able to complete bookings
   - No permission check needed

2. **Test as Stylist (with permission)**:
   - Grant permission in Staff page
   - Stylist should be able to complete bookings
   - Client stats should update

3. **Test as Stylist (without permission)**:
   - Try to complete booking
   - Should receive 403 error
   - Booking status should not change

4. **Test Permission Delegation**:
   - Owner grants permission to manager
   - Manager can now complete bookings
   - Owner revokes permission
   - Manager can no longer complete bookings

## Implementation Complete

✅ Backend: Permission added to User model
✅ Backend: Permission check in booking controller
✅ Backend: Owner gets permission by default
✅ Backend: Staff get permission = false by default
✅ Backend: 403 error if no permission
⏳ Frontend: Add permission checkbox in Staff page
⏳ Frontend: Add "Complete" button with permission check
