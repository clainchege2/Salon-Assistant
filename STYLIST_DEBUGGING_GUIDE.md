# Stylist Not Populating - Debugging Guide 🔍

## Issue
Stylists are not showing in the dropdown on the booking page.

## Debugging Steps Added

### 1. Frontend Logging
Added console logs to track staff fetching:
```javascript
console.log('Fetching staff...');
console.log('Staff response:', response.data);
console.warn('No staff members found');
```

### 2. Backend Logging
Added logs to track staff queries:
```javascript
logger.info(`Fetching staff for tenant: ${req.tenantId}`);
logger.info(`Found ${staff.length} staff members`);
```

### 3. UI Feedback
Added loading state in dropdown:
- Shows "Loading staff..." when staff array is empty
- Shows count in helper text

## How to Debug

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Refresh the booking page
4. Look for:
   - "Fetching staff..."
   - "Staff response: {success: true, count: X, data: [...]}"
   - Any error messages

### Step 2: Check Backend Logs
1. Look at backend terminal
2. Find logs:
   - "Fetching staff for tenant: [tenant_id]"
   - "Found X staff members"
   - Any error messages

### Step 3: Check Database
Run this query in MongoDB:
```javascript
db.users.find({
  tenantId: ObjectId("your_tenant_id"),
  role: { $in: ['owner', 'staff', 'stylist'] },
  isActive: true
})
```

## Common Issues & Solutions

### Issue 1: No Staff in Database
**Symptom**: Backend logs show "Found 0 staff members"

**Solution**: 
- Add staff members through admin portal
- Or run seed script to create test data

### Issue 2: Wrong Tenant ID
**Symptom**: Staff exist but not showing for this client

**Solution**:
- Check client's tenantId matches staff tenantId
- Verify client authentication is working

### Issue 3: isActive = false
**Symptom**: Staff exist but marked inactive

**Solution**:
- Update staff to isActive: true
- Check staff management page

### Issue 4: API Endpoint Not Reached
**Symptom**: No "Fetching staff..." log in console

**Solution**:
- Check if fetchStaff() is being called in useEffect
- Verify API URL is correct
- Check authentication token exists

### Issue 5: CORS or Network Error
**Symptom**: Error in console about CORS or network

**Solution**:
- Check backend is running
- Verify CORS settings
- Check API URL matches backend port

## Quick Test

### Test Staff Endpoint Directly
```bash
# Get client token from localStorage
# Then test endpoint:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/client/staff
```

Expected response:
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "role": "stylist"
    }
  ]
}
```

## What to Check in Console

### Good Response
```
Fetching staff...
Staff response: {success: true, count: 3, data: Array(3)}
```

### Bad Response (No Staff)
```
Fetching staff...
Staff response: {success: true, count: 0, data: []}
No staff members found
```

### Error Response
```
Error fetching staff: Error: Request failed with status code 401
Error details: {success: false, message: "Not authorized"}
```

## Next Steps

1. **Check console logs** - See what's being returned
2. **Check backend logs** - Verify query is running
3. **Check database** - Confirm staff exist
4. **Test endpoint** - Use curl or Postman
5. **Report findings** - Share console output for further help

## Expected Behavior

When working correctly:
1. Page loads
2. "Fetching staff..." appears in console
3. Staff response shows in console with data
4. Dropdown populates with staff names
5. Helper text shows "Leave blank to see all available stylists"

## Files Modified

- `client-portal/src/pages/BookAppointment.js` - Added logging
- `backend/src/routes/clientBookings.js` - Added logging
