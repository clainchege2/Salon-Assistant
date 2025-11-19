# Sorting & Filtering Audit - All Portals

## Current Status

### ✅ Already Implemented

1. **admin-portal/src/pages/Bookings.js**
   - ✅ Search by client name
   - ✅ Filter by status (all, pending, confirmed, completed)
   - ✅ Sort by: priority, date (asc/desc), client name, price
   - ✅ View modes: list/cards

2. **admin-portal/src/pages/Clients.js**
   - ✅ Search by name/phone
   - ✅ Filter by category (all, VIP, regular, at-risk, new)
   - ✅ View modes: list/cards

3. **admin-portal/src/pages/Communications.js**
   - ✅ Search term
   - ✅ Filter by direction (all, sent, received)
   - ✅ Filter by type (all, sms, email, whatsapp)

4. **admin-portal/src/pages/StockManagement.js**
   - ✅ View modes: grid/list
   - ⚠️ No search or filter by category/status

### ❌ Missing Sorting/Filtering

1. **admin-portal/src/pages/Staff.js**
   - ❌ No search
   - ❌ No filter by role
   - ❌ No filter by status (active/revoked)
   - ❌ No sort options

2. **admin-portal/src/pages/Services.js**
   - ❌ No search by name
   - ❌ No filter by category
   - ❌ No sort by price/duration/name
   - ⚠️ Has pending suggestions section but no filter

3. **client-portal/src/pages/MyBookings.js**
   - ❌ No search
   - ❌ No filter by status
   - ❌ No sort by date

4. **client-portal/src/pages/Messages.js**
   - ❌ No search
   - ❌ No filter by read/unread
   - ❌ No sort by date
   - ⚠️ Has tabs (messages/campaigns) but no filtering within tabs

5. **mobile/src/screens/BookingsScreen.js**
   - ❌ No filter by status
   - ❌ No sort options

6. **mobile/src/screens/ClientsScreen.js**
   - ❌ No search
   - ❌ No filter options

## Implementation Plan

### Priority 1: Admin Portal (High Traffic)

#### Staff.js
Add:
- Search by name/email
- Filter by role (all, owner, manager, stylist, receptionist)
- Filter by status (all, active, revoked)
- Sort by: name, role, date added

#### Services.js
Add:
- Search by service name
- Filter by category
- Sort by: name, price (high/low), duration, popularity

#### StockManagement.js (Enhancement)
Add:
- Search by material name/barcode
- Filter by: all, low stock, out of stock, adequate
- Filter by category (if categories exist)
- Sort by: name, quantity, last updated

### Priority 2: Client Portal

#### MyBookings.js
Add:
- Filter by status (all, upcoming, past, cancelled)
- Sort by: date (upcoming first, recent first)
- Search by service name

#### Messages.js
Add:
- Search by message content
- Filter by: all, unread, read
- Sort by: date (newest/oldest)

### Priority 3: Mobile App

#### BookingsScreen.js
Add:
- Filter tabs: All, Upcoming, Past, Cancelled
- Sort dropdown: Date (upcoming/recent)

#### ClientsScreen.js
Add:
- Search bar at top
- Filter by category (if applicable)

## Design Pattern

All implementations should follow this consistent pattern:

```jsx
// State
const [items, setItems] = useState([]);
const [filteredItems, setFilteredItems] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [filter, setFilter] = useState('all');
const [sortBy, setSortBy] = useState('default');

// Effect to filter and sort
useEffect(() => {
  filterAndSortItems();
}, [items, searchTerm, filter, sortBy]);

// UI Controls
<div className="controls">
  <input 
    type="text"
    placeholder="🔍 Search..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  
  <div className="filter-tabs">
    <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
      All
    </button>
    {/* More filter buttons */}
  </div>
  
  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
    <option value="default">Sort by...</option>
    {/* More sort options */}
  </select>
</div>
```

## Next Steps

1. Implement Staff.js sorting/filtering
2. Implement Services.js sorting/filtering
3. Enhance StockManagement.js
4. Implement MyBookings.js sorting/filtering
5. Implement Messages.js sorting/filtering
6. Update mobile screens
7. Test all implementations
8. Update documentation
