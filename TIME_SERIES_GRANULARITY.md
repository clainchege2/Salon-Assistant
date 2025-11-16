# Time Series Granularity Configuration

## Overview
The analytics dashboard now supports trading-style time ranges with intelligent granularity that maintains a minimum of 1-day resolution while optimizing data point counts for performance and readability.

## Supported Time Ranges

### Short-term (Daily Granularity)
- **1D**: 1 day → 1 data point
- **7D**: 7 days → 7 data points
- **30D**: 31 days → 31 data points
- **90D**: 91 days → 91 data points
- **180D**: 181 days → 181 data points

### Medium-term (Weekly Granularity)
- **1Y**: 365 days → ~53 data points (weekly)
- **2Y**: 731 days → ~105 data points (weekly)
- **3Y**: 1,096 days → ~157 data points (weekly)
- **5Y**: 1,826 days → ~261 data points (weekly)

### Long-term (Monthly Granularity)
- **7Y**: 2,557 days → ~86 data points (monthly)
- **9Y**: 3,287 days → ~110 data points (monthly)
- **10Y**: 3,653 days → ~122 data points (monthly)

### Historical (Yearly Granularity)
- **15Y**: 5,479 days → ~16 data points (yearly)
- **20Y**: 7,305 days → ~21 data points (yearly)
- **ALL**: All available data → yearly data points

## Granularity Rules

### Minimum Granularity: 1 Day
All time series data maintains a minimum granularity of 1 day. This ensures:
- Accurate daily tracking for short-term analysis
- No loss of precision for recent data
- Consistent data quality across all ranges

### Automatic Grouping
The system automatically selects the appropriate grouping based on the date range:

1. **≤ 181 days**: Daily data points
   - Best for: Recent trends, daily patterns, short-term analysis
   - Data points: Equal to number of days

2. **182-1,826 days (≤5Y)**: Weekly data points
   - Best for: Medium-term trends, seasonal patterns
   - Data points: ~52 per year

3. **1,827-3,653 days (5Y-10Y)**: Monthly data points
   - Best for: Long-term trends, year-over-year comparisons
   - Data points: ~12 per year

4. **>3,653 days (>10Y)**: Yearly data points
   - Best for: Historical analysis, multi-year trends
   - Data points: 1 per year

## Implementation Details

### Backend (analyticsController.js)
- Date range calculation in `getDateRange()` function
- Granularity logic in `getOverview()` endpoint
- Supports all ranges: 1D, 7D, 30D, 90D, 180D, 1Y, 2Y, 3Y, 5Y, 7Y, 9Y, 10Y, 15Y, 20Y, ALL

### Frontend (Analytics.js)
- Date range selector with all 15 time ranges
- Trading-style button layout
- Custom date range option available

### Data Point Calculation
```javascript
// Daily: 1 point per day
dataPoints = daysDiff;

// Weekly: ~7 days per point
dataPoints = Math.ceil(daysDiff / 7);

// Monthly: ~30 days per point
dataPoints = Math.ceil(daysDiff / 30);

// Yearly: ~365 days per point
dataPoints = Math.ceil(daysDiff / 365);
```

## Performance Considerations

### Optimized Data Points
- **1D-180D**: Max 181 points (daily)
- **1Y-5Y**: Max 261 points (weekly)
- **7Y-10Y**: Max 122 points (monthly)
- **15Y-20Y**: Max 21 points (yearly)

### Chart Rendering
- All ranges stay within reasonable data point limits
- Smooth rendering even for long time periods
- Responsive to user interactions

## Usage Examples

### Recent Performance (Daily)
```javascript
// View last week's daily performance
dateRange = '7D' → 7 daily data points
```

### Quarterly Analysis (Daily)
```javascript
// View last 90 days with daily granularity
dateRange = '90D' → 91 daily data points
```

### Annual Trends (Weekly)
```javascript
// View last year with weekly granularity
dateRange = '1Y' → ~53 weekly data points
```

### Multi-Year Comparison (Monthly)
```javascript
// View 10 years with monthly granularity
dateRange = '10Y' → ~122 monthly data points
```

### Historical Analysis (Yearly)
```javascript
// View 20 years with yearly granularity
dateRange = '20Y' → ~21 yearly data points
```

## Testing

Run the test script to verify granularity:
```bash
node test-time-series.js
```

Expected output shows correct data point counts and granularity for each range.

## Future Enhancements

Potential improvements:
- Adaptive granularity based on data density
- Custom granularity selection
- Drill-down from yearly → monthly → weekly → daily
- Comparison mode with multiple time ranges
- Export with selected granularity
