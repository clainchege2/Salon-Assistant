# Badge Alerts Fix - Client Portal Messages & Offers

## Issue
Badge alerts on the Messages and Offers tabs in the client portal were not working properly. Users couldn't see which tab had new/unread items.

## Solution Implemented

### 1. Added Tab Badge Counters
**File:** `client-portal/src/pages/Messages.js`

Added state management for tracking unread/new items:
```javascript
const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
const [newCampaignsCount, setNewCampaignsCount] = useState(0);
```

### 2. Smart Badge Logic

#### Messages Tab:
- Counts unread messages (messages without `readAt` timestamp)
- Shows badge with count on Messages tab
- Marks messages as read only when user views the Messages tab
- Badge clears automatically when tab is viewed

#### Offers/Campaigns Tab:
- Tracks viewed campaigns using localStorage
- Counts campaigns not in `viewedCampaigns` list
- Shows badge with count on Offers tab
- Marks campaigns as viewed only when user views the Campaigns tab
- Badge clears automatically when tab is viewed

### 3. Tab Switching Behavior
Added `useEffect` hook that:
- Saves active tab to localStorage for persistence
- Marks items as read/viewed when switching to that tab
- Clears the badge count for the active tab
- Prevents premature marking (only marks when actually viewing)

### 4. Visual Design
**File:** `client-portal/src/pages/Messages.css`

Added prominent badge styling:
- Red gradient background (#ef4444 to #dc2626)
- White text, bold font
- Rounded pill shape
- Pulsing shadow animation for attention
- Positioned next to tab text

```css
.tab-badge {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  animation: badgePulse 2s infinite;
}
```

### 5. Integration with Dashboard
The Messages page now properly integrates with the Dashboard's notification system:
- Dashboard shows combined count of unread messages + new campaigns
- When user clicks to view Messages, Dashboard clears its badge
- Messages page shows individual badges for each tab
- Badges clear as user views each tab

## User Experience Flow

1. **User on Dashboard:**
   - Sees notification badge: "📬 Messages & Offers (3)"
   - Badge shows total of unread messages + new campaigns

2. **User clicks Messages & Offers:**
   - Dashboard badge clears immediately
   - Navigates to Messages page
   - Sees two tabs with individual badges:
     - "💬 Messages (5) [2]" - 2 unread
     - "🎁 Offers & Promotions (3) [1]" - 1 new

3. **User views Messages tab:**
   - Messages marked as read in backend
   - Badge on Messages tab disappears
   - Offers tab still shows badge

4. **User switches to Offers tab:**
   - Campaigns marked as viewed in localStorage
   - Badge on Offers tab disappears
   - All badges now cleared

## Technical Details

### State Management
- `unreadMessagesCount`: Tracks unread messages
- `newCampaignsCount`: Tracks unviewed campaigns
- Both update dynamically based on data fetching

### Data Persistence
- Active tab saved to localStorage: `messagesActiveTab`
- Viewed campaigns saved to localStorage: `viewedCampaigns`
- Ensures badges don't reappear on page refresh

### API Integration
- Messages: Uses `readAt` field from backend
- Campaigns: Uses localStorage for client-side tracking
- Marks items as read/viewed via API calls

## Files Modified

1. `client-portal/src/pages/Messages.js`
   - Added badge state management
   - Implemented smart read/viewed logic
   - Added tab switching behavior
   - Updated JSX to show badges

2. `client-portal/src/pages/Messages.css`
   - Added `.tab-content` styling
   - Added `.tab-badge` styling
   - Added `badgePulse` animation

## Testing Checklist

- [x] Badge shows on Messages tab when there are unread messages
- [x] Badge shows on Offers tab when there are new campaigns
- [x] Badge clears when viewing Messages tab
- [x] Badge clears when viewing Offers tab
- [x] Badge persists across page refreshes (until viewed)
- [x] Dashboard badge integrates properly
- [x] No duplicate marking of messages as read
- [x] Responsive design works on mobile
- [x] Animation is smooth and not distracting

## Benefits

1. **Clear Visual Feedback:** Users immediately see which tab has new content
2. **Smart Marking:** Items only marked as read/viewed when actually seen
3. **Persistent State:** Badges don't reappear after refresh
4. **Smooth UX:** Badges clear automatically without user action
5. **Attention-Grabbing:** Pulsing animation draws eye to new content

## Future Enhancements

- Add sound notification when new messages arrive
- Add desktop notifications for new campaigns
- Add "Mark all as read" button
- Add filter for unread messages only
- Add timestamp for when campaign was added
