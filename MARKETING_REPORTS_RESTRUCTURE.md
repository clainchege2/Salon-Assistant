# Marketing & Reports Restructure Plan

## Current State
- **Marketing Page**: Contains RFM analytics, client segmentation, AND campaign management
- **Reports Page**: Basic revenue and booking reports

## New Structure

### 📊 Reports Page (Analytics & Insights)
**Purpose**: Data analysis and business intelligence

**Features to Move Here:**
1. ✅ Revenue Analytics (already there)
2. ✅ Booking Analytics (already there)
3. **➕ RFM Analysis** (move from Marketing)
   - Client segmentation by Recency, Frequency, Monetary
   - Champions, Loyal Customers, At Risk, etc.
   - Visual charts and graphs
4. **➕ Client Insights** (move from Marketing)
   - Client lifetime value
   - Visit frequency analysis
   - Spending patterns
5. **➕ Service Performance**
   - Most popular services
   - Revenue by service
6. **➕ Staff Performance**
   - Bookings per stylist
   - Revenue per stylist

### 📢 Marketing Page (Campaigns & Outreach)
**Purpose**: Creating and sending marketing campaigns

**Features to Keep/Add:**
1. ✅ Campaign Management
   - Create campaigns
   - Schedule campaigns
   - View campaign history
2. **➕ Special Messages Feature**
   - Birthday messages
   - Anniversary messages
   - Holiday greetings
   - Custom occasion messages
3. **➕ Bulk Messaging**
   - Send to specific segments (from Reports)
   - Send to custom lists
4. **➕ Message Templates**
   - Pre-built templates
   - Custom templates
   - Personalization tokens
5. **➕ Campaign Analytics**
   - Delivery rates
   - Response rates
   - ROI tracking

## Implementation Steps

### Phase 1: Move RFM to Reports
1. Copy RFM components from Marketing to Reports
2. Update Reports page to include RFM tab
3. Remove RFM from Marketing page
4. Update navigation and permissions

### Phase 2: Enhance Marketing Page
1. Add Special Messages section
   - Birthday automation
   - Anniversary tracking
   - Custom occasions
2. Improve campaign creation UI
3. Add message template library
4. Add bulk messaging with segment selection

### Phase 3: Connect Reports → Marketing
1. Add "Send Campaign" button in Reports segments
2. Allow selecting clients from RFM segments
3. Pass selected clients to Marketing page
4. Pre-fill campaign with segment data

## User Flow Example

**Scenario**: Send promotion to "At Risk" clients

1. **Reports Page**
   - View RFM Analysis
   - See "At Risk" segment (15 clients)
   - Click "Create Campaign for This Segment"

2. **Marketing Page**
   - Opens with 15 clients pre-selected
   - Choose message template
   - Customize message
   - Schedule or send immediately

## Benefits

✅ **Clear Separation of Concerns**
- Reports = Analysis & Insights
- Marketing = Action & Outreach

✅ **Better User Experience**
- Find analytics in one place
- Create campaigns in another
- Logical workflow

✅ **Scalability**
- Each page can grow independently
- Easier to add features
- Less cluttered UI

## Special Messages Feature Details

### Birthday Messages
- Automatic detection from client birthdate
- Send X days before birthday
- Personalized greeting
- Optional discount code

### Anniversary Messages
- Track first visit anniversary
- Celebrate loyalty milestones
- Thank you messages
- Special offers

### Holiday Greetings
- Christmas, New Year, Valentine's
- Mother's Day, Father's Day
- Local holidays (Kenya: Jamhuri Day, Madaraka Day)
- Customizable per salon

### Custom Occasions
- Salon owner can add custom dates
- Grand opening anniversary
- Special promotions
- Seasonal campaigns

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (move RFM)
3. Implement Phase 2 (special messages)
4. Connect everything in Phase 3

---

**Note**: This restructure will make the system more intuitive and powerful for salon owners to understand their business (Reports) and take action (Marketing).
