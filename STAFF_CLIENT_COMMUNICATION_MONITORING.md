# Staff-Client Communication Monitoring System

## Overview
Complete system for monitoring and controlling communications between staff and clients, with permission-based access control.

## Features Implemented

### 1. **New Permission: `canMonitorCommunications`**
- Owners get this permission by default
- Can be delegated to managers or senior staff
- Allows viewing all staff-client communications
- Enables blocking/unblocking communications

### 2. **Communication Model Updates**
Added fields to track and control communications:
- `staffId`: Links communication to specific staff member
- `isBlocked`: Flag for blocked communications
- `blockedBy`, `blockedAt`, `blockReason`: Audit trail for blocks
- `flagged`, `flaggedBy`, `flaggedAt`, `flagReason`: Flag problematic communications

### 3. **Access Levels**

#### **Stylists (without monitor permission)**
- Can only see their own communications with clients
- Cannot view other staff communications
- Cannot block communications

#### **Managers/Staff (with monitor permission)**
- Can view all staff-client communications
- Can flag communications for review
- Can block/unblock communications
- Full monitoring dashboard access

#### **Owners**
- Full access to all communications
- Can monitor all staff-client interactions
- Can block communications between any staff and client
- Can delegate monitoring permission to trusted staff

### 4. **New API Endpoints**

```
GET  /api/v1/communications/staff-client
  - Get staff-client communications
  - Query params: staffId, clientId, flagged
  - Auto-filters to user's own comms if no monitor permission

POST /api/v1/communications/block
  - Block communication between staff and client
  - Body: { staffId, clientId, reason }
  - Requires: canMonitorCommunications

POST /api/v1/communications/unblock
  - Unblock communication
  - Body: { staffId, clientId }
  - Requires: canMonitorCommunications

PUT  /api/v1/communications/:id/flag
  - Flag communication for review
  - Body: { reason }
  - Requires: canMonitorCommunications

PUT  /api/v1/communications/:id/unflag
  - Remove flag from communication
  - Requires: canMonitorCommunications
```

### 5. **Use Cases**

#### **Scenario 1: Inappropriate Communication**
1. Manager notices inappropriate messages from staff to client
2. Manager flags the communication with reason
3. Owner reviews flagged communication
4. Owner blocks communication between that staff and client
5. System prevents future messages between them

#### **Scenario 2: Client Complaint**
1. Client complains about staff member's messages
2. Owner views all communications between staff and client
3. Owner can see full conversation history
4. Owner blocks communication if necessary
5. Audit trail maintained for HR purposes

#### **Scenario 3: Staff Monitoring**
1. Stylist can view their own client communications
2. Manager with permission can view all stylists' communications
3. Owner can monitor all communications across salon
4. Helps ensure professional standards

### 6. **Security & Privacy**

- **Tenant Isolation**: All communications scoped to tenant
- **Permission-Based**: Access controlled by permissions
- **Audit Trail**: All blocks/flags tracked with user and timestamp
- **Role-Based**: Automatic permission assignment by role

### 7. **Next Steps for Frontend**

To complete this feature, update the Communications page to:

1. **Add Filter Dropdown**
   - "All Communications" (existing)
   - "Staff-Client Communications" (new)
   - Filter by staff member
   - Show only flagged communications

2. **Add Monitoring View**
   - Table showing: Staff | Client | Last Message | Date | Status
   - Flag button for each communication
   - Block button for staff-client pairs
   - View conversation history

3. **Add Staff View**
   - Stylists see only their own client communications
   - Simple list of their conversations
   - Cannot see other staff communications

4. **Add Action Buttons**
   - 🚩 Flag (for problematic messages)
   - 🚫 Block (prevent future communication)
   - ✅ Unblock (restore communication)
   - 👁️ View Full Thread

5. **Add Permission Check**
   ```javascript
   const canMonitor = user?.permissions?.canMonitorCommunications;
   ```

## Database Migration

No migration needed - new fields have defaults:
- `isBlocked`: defaults to `false`
- `flagged`: defaults to `false`
- `staffId`: optional field

Existing communications will work normally.

## Testing

1. **Test as Owner**
   - Should see all communications
   - Can block any staff-client pair
   - Can flag any communication

2. **Test as Manager (with permission)**
   - Should see all communications
   - Can block/flag communications

3. **Test as Stylist (without permission)**
   - Should only see own communications
   - Cannot access monitoring features

4. **Test Blocking**
   - Block communication between staff and client
   - Verify no new messages can be sent
   - Verify existing messages still visible

## Benefits

✅ **Protect Clients**: Prevent inappropriate staff behavior
✅ **Protect Staff**: Monitor for client harassment
✅ **Quality Control**: Ensure professional communication standards
✅ **Compliance**: Maintain audit trail for HR/legal purposes
✅ **Delegation**: Owners can delegate monitoring to managers
✅ **Privacy**: Staff can't see each other's communications without permission

## Implementation Complete

- ✅ User model updated with new permission
- ✅ Communication model updated with blocking fields
- ✅ Controller methods added for monitoring
- ✅ Routes configured with permission checks
- ✅ Tenant isolation enforced
- ✅ Audit logging included
- ⏳ Frontend UI (next step)
