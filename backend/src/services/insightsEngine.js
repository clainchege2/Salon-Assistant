// Insights Engine - Generates dynamic, context-aware insights based on data analysis

/**
 * Generate insights by comparing current period with previous period
 */
const generateInsights = (currentData, previousData, range) => {
  const insights = {
    revenue: generateRevenueInsight(currentData, previousData, range),
    trend: generateTrendInsight(currentData, previousData, range),
    warning: generateWarningInsight(currentData, previousData, range)
  };

  return insights;
};

/**
 * Revenue insights - Compare revenue trends
 */
const generateRevenueInsight = (current, previous, range) => {
  if (!current.totalRevenue || !previous.totalRevenue) {
    return 'Insufficient data to generate revenue insights for this period';
  }

  const change = ((current.totalRevenue - previous.totalRevenue) / previous.totalRevenue) * 100;
  const absChange = Math.abs(change).toFixed(1);
  const period = getRangeName(range);

  if (change > 15) {
    return `Excellent! Revenue surged ${absChange}% compared to the previous ${period}`;
  } else if (change > 5) {
    return `Revenue increased ${absChange}% vs previous ${period} - steady growth`;
  } else if (change > 0) {
    return `Revenue up ${absChange}% from last ${period} - maintaining momentum`;
  } else if (change > -5) {
    return `Revenue dipped ${absChange}% vs last ${period} - consider promotional campaigns`;
  } else {
    return `Revenue down ${absChange}% from previous ${period} - urgent action needed`;
  }
};

/**
 * Trend insights - Identify patterns and opportunities
 */
const generateTrendInsight = (current, previous, range) => {
  // Analyze top service
  if (current.topService && current.topService.count > 0) {
    const serviceName = current.topService.name;
    const count = current.topService.count;
    
    return `${serviceName} is your top performer with ${count} bookings this ${getRangeName(range)}`;
  }

  return 'Track your service performance to identify top revenue generators';
};

/**
 * Warning insights - Alert about issues
 */
const generateWarningInsight = (current, previous, range) => {
  // Check for declining bookings
  if (current.totalAppointments && previous.totalAppointments) {
    const bookingChange = ((current.totalAppointments - previous.totalAppointments) / previous.totalAppointments) * 100;
    
    if (bookingChange < -10) {
      return `Bookings dropped ${Math.abs(bookingChange).toFixed(0)}% - time to boost marketing efforts`;
    }
  }

  // Default positive message
  return 'No major concerns detected - keep up the great work!';
};

/**
 * Helper: Get human-readable range name
 */
const getRangeName = (range) => {
  const rangeNames = {
    '1D': 'day',
    '7D': 'week',
    '30D': 'month',
    '90D': 'quarter',
    '180D': '6 months',
    '1Y': 'year',
    '2Y': '2 years',
    '3Y': '3 years',
    'thisWeek': 'week',
    'thisMonth': 'month',
    'lastMonth': 'month',
    'last3Months': 'quarter',
    'last6Months': '6 months',
    'lastYear': 'year'
  };

  return rangeNames[range] || 'period';
};

/**
 * Calculate previous period date range
 */
const getPreviousPeriodRange = (startDate, endDate) => {
  const duration = endDate - startDate;
  const previousEnd = new Date(startDate);
  const previousStart = new Date(startDate - duration);
  
  return { previousStart, previousEnd };
};

module.exports = {
  generateInsights,
  getPreviousPeriodRange
};
