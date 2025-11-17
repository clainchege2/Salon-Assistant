const Booking = require('../models/Booking');
const Client = require('../models/Client');
const Service = require('../models/Service');
const User = require('../models/User');

// Helper function to get date range
const getDateRange = (range) => {
  const now = new Date();
  let startDate, endDate = new Date();
  
  switch(range) {
    case '1D':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '7D':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30D':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90D':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '180D':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 180);
      break;
    case '1Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case '2Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2);
      break;
    case '3Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 3);
      break;
    case '5Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 5);
      break;
    case '7Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 7);
      break;
    case '9Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 9);
      break;
    case '10Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 10);
      break;
    case '15Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 15);
      break;
    case '20Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 20);
      break;
    case 'ALL':
      startDate = new Date('2000-01-01');
      break;
    // Legacy support for old range names
    case 'thisWeek':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'last3Months':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      break;
    case 'last6Months':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 180);
      break;
    case 'lastYear':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'allTime':
      startDate = new Date('2020-01-01');
      break;
    default:
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
  }
  
  return { startDate, endDate };
};

// GET /api/analytics/overview
exports.getOverview = async (req, res) => {
  try {
    const { range = 'thisMonth' } = req.query;
    const { startDate, endDate } = getDateRange(range);
    const tenantId = req.user.tenantId;

    // Get bookings for the period
    const bookings = await Booking.find({
      tenantId,
      scheduledDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'completed'] }
    }).populate('services.serviceId stylistId assignedTo');

    // Calculate KPIs
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const totalAppointments = bookings.length;
    const avgTicketSize = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    // Get returning clients
    const clientIds = [...new Set(bookings.map(b => b.clientId?.toString()))];
    const returningClients = await Client.find({
      _id: { $in: clientIds },
      tenantId,
      totalVisits: { $gt: 1 }
    });
    const returningClientsPercent = clientIds.length > 0 
      ? (returningClients.length / clientIds.length * 100).toFixed(1)
      : 0;

    // Top service
    const serviceCounts = {};
    bookings.forEach(b => {
      if (b.services && b.services.length > 0) {
        const name = b.services[0].serviceName || 'Unknown';
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
      }
    });
    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];

    // Top stylist by revenue
    const stylistRevenue = {};
    bookings.forEach(b => {
      const stylist = b.assignedTo || b.stylistId;
      if (stylist) {
        const name = stylist.firstName && stylist.lastName 
          ? `${stylist.firstName} ${stylist.lastName}`
          : 'Unknown';
        stylistRevenue[name] = (stylistRevenue[name] || 0) + (b.totalPrice || 0);
      }
    });
    const topStylist = Object.entries(stylistRevenue).sort((a, b) => b[1] - a[1])[0];

    // Initialize peak hours variables (will be calculated from heatmap)
    const formatHour = (h) => {
      if (h === 12) return '12pm';
      if (h > 12) return `${h - 12}pm`;
      return `${h}am`;
    };
    
    let peakHours = 'No peak hours data';
    let peakDayText = 'weekdays';

    // Generate revenue data for chart - adaptive based on date range
    // Minimum granularity is 1 day for all ranges
    const revenueData = [];
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    let dataPoints, groupBy;
    
    // Determine grouping based on trading-style ranges
    // Minimum granularity is always 1 day
    if (daysDiff <= 1) {
      // 1D: Show single day
      dataPoints = 1;
      groupBy = 'day';
    } else if (daysDiff <= 7) {
      // 7D: Daily data (7 points)
      dataPoints = daysDiff;
      groupBy = 'day';
    } else if (daysDiff <= 31) {
      // 30D: Daily data (31 points max)
      dataPoints = daysDiff;
      groupBy = 'day';
    } else if (daysDiff <= 91) {
      // 90D: Daily data (91 points max)
      dataPoints = daysDiff;
      groupBy = 'day';
    } else if (daysDiff <= 181) {
      // 180D: Weekly data (~26 points)
      dataPoints = Math.ceil(daysDiff / 7);
      groupBy = 'week';
    } else if (daysDiff <= 366) {
      // 1Y: Weekly data (~52 points)
      dataPoints = Math.ceil(daysDiff / 7);
      groupBy = 'week';
    } else if (daysDiff <= 1826) {
      // 2Y-5Y: Weekly data
      dataPoints = Math.ceil(daysDiff / 7);
      groupBy = 'week';
    } else if (daysDiff <= 3653) {
      // 5Y-10Y: Monthly data
      dataPoints = Math.ceil(daysDiff / 30);
      groupBy = 'month';
    } else {
      // 10Y+: Yearly data
      dataPoints = Math.ceil(daysDiff / 365);
      groupBy = 'year';
    }
    
    // Generate data points
    for (let i = 0; i < dataPoints; i++) {
      let periodStart, periodEnd, label;
      
      if (groupBy === 'day') {
        // Daily granularity
        periodStart = new Date(startDate);
        periodStart.setDate(periodStart.getDate() + i);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setHours(23, 59, 59, 999);
        
        // Format label based on range
        if (daysDiff <= 7) {
          label = periodStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        } else if (daysDiff <= 30) {
          label = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          label = periodStart.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
        }
      } else if (groupBy === 'week') {
        // Weekly granularity
        periodStart = new Date(startDate);
        periodStart.setDate(periodStart.getDate() + (i * 7));
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        
        // Don't exceed end date
        if (periodEnd > endDate) {
          periodEnd = new Date(endDate);
          periodEnd.setHours(23, 59, 59, 999);
        }
        
        label = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (groupBy === 'month') {
        // Monthly granularity
        periodStart = new Date(startDate);
        periodStart.setMonth(periodStart.getMonth() + i);
        periodStart.setDate(1);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0);
        periodEnd.setHours(23, 59, 59, 999);
        
        // Don't exceed end date
        if (periodEnd > endDate) {
          periodEnd = new Date(endDate);
          periodEnd.setHours(23, 59, 59, 999);
        }
        
        label = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        // Yearly granularity
        periodStart = new Date(startDate);
        periodStart.setFullYear(periodStart.getFullYear() + i);
        periodStart.setMonth(0);
        periodStart.setDate(1);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        periodEnd.setMonth(0);
        periodEnd.setDate(0);
        periodEnd.setHours(23, 59, 59, 999);
        
        // Don't exceed end date
        if (periodEnd > endDate) {
          periodEnd = new Date(endDate);
          periodEnd.setHours(23, 59, 59, 999);
        }
        
        label = periodStart.getFullYear().toString();
      }
      
      // Calculate revenue for this period
      const periodBookings = bookings.filter(b => {
        const bookingDate = new Date(b.scheduledDate);
        return bookingDate >= periodStart && bookingDate <= periodEnd;
      });
      
      const revenue = periodBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      
      revenueData.push({
        date: label,
        revenue: revenue,
        lastMonth: revenue * 0.85 // Mock comparison data
      });
    }
    // Generate heatmap data from actual bookings
    const heatmapData = [];
    const dayHourCounts = {};
    
    // Count bookings by day and hour
    bookings.forEach(b => {
      const date = new Date(b.scheduledDate);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const hour = date.getHours();
      const key = `${dayOfWeek}-${hour}`;
      dayHourCounts[key] = (dayHourCounts[key] || 0) + 1;
    });
    
    // Create heatmap array (9am-6pm = 10 hours)
    for (let day = 0; day < 7; day++) {
      for (let hour = 9; hour <= 18; hour++) {
        const key = `${day}-${hour}`;
        heatmapData.push({
          day,
          hour: hour - 9, // Normalize to 0-9 for display
          value: dayHourCounts[key] || 0
        });
      }
    }
    
    // Find actual peak 2-hour window across ALL days
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let bestWindow = { day: 0, start: 9, count: 0 };
    
    // Check every 2-hour window on every day
    for (let day = 0; day < 7; day++) {
      for (let h = 9; h <= 17; h++) {
        const key1 = `${day}-${h}`;
        const key2 = `${day}-${h + 1}`;
        const windowCount = (dayHourCounts[key1] || 0) + (dayHourCounts[key2] || 0);
        if (windowCount > bestWindow.count) {
          bestWindow = { day, start: h, count: windowCount };
        }
      }
    }
    
    if (bestWindow.count > 0) {
      const peakDayName = dayNames[bestWindow.day];
      peakHours = `${formatHour(bestWindow.start)}-${formatHour(bestWindow.start + 2)}`;
      peakDayText = `${peakDayName}s`;
    }

    // Calculate actual revenue change by comparing to previous equivalent period
    const periodLength = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - periodLength);
    const previousPeriodEnd = new Date(startDate);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
    
    const previousBookings = await Booking.find({
      tenantId,
      scheduledDate: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
      status: { $in: ['confirmed', 'completed'] }
    });
    
    const previousRevenue = previousBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const comparisonAppointments = previousBookings.length;
    const previousAvgTicketSize = comparisonAppointments > 0 ? previousRevenue / comparisonAppointments : 0;
    const actualChange = previousRevenue > 0 
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;
    
    // Create previousData object for compatibility
    const previousData = {
      totalRevenue: previousRevenue,
      totalAppointments: comparisonAppointments,
      avgTicketSize: previousAvgTicketSize
    };
    
    // Generate insight message based on selected range
    let periodName = 'period';
    if (range === '1D') periodName = 'day';
    else if (range === '7D') periodName = 'week';
    else if (range === '30D') periodName = 'month';
    else if (range === '90D') periodName = '3 months';
    else if (range === '180D') periodName = '6 months';
    else if (range === '1Y') periodName = 'year';
    else if (range === '2Y') periodName = '2 years';
    else if (range === '3Y') periodName = '3 years';
    else if (range === '5Y') periodName = '5 years';
    else if (range === '7Y') periodName = '7 years';
    else if (range === '9Y') periodName = '9 years';
    else if (range === '10Y') periodName = '10 years';
    else if (range === '15Y') periodName = '15 years';
    else if (range === '20Y') periodName = '20 years';
    else if (range === 'ALL') periodName = 'period';
    // Legacy support
    else if (range === 'thisWeek') periodName = 'week';
    else if (range === 'thisMonth') periodName = 'month';
    else if (range === 'lastMonth') periodName = 'month';
    else if (range === 'last3Months') periodName = '3 months';
    else if (range === 'last6Months') periodName = '6 months';
    else if (range === 'lastYear') periodName = 'year';
    else if (range === 'allTime') periodName = 'period';
    
    let revenueInsight;
    if (totalRevenue === 0) {
      revenueInsight = 'No revenue data for this period. Try selecting a different date range.';
    } else if (actualChange > 0) {
      revenueInsight = `Revenue increased ${actualChange}% compared to previous ${periodName}.`;
    } else if (actualChange < 0) {
      revenueInsight = `Revenue decreased ${Math.abs(actualChange)}% compared to previous ${periodName}.`;
    } else {
      revenueInsight = `Revenue remained stable compared to previous ${periodName}.`;
    }
    
    // Generate dynamic insights
    const dynamicInsights = {
      revenue: revenueInsight,
      trend: topService ? `${topService[0]} is your most popular service with ${topService[1]} bookings` : 'No service data available',
      warning: actualChange < -10 ? `Revenue is down ${Math.abs(actualChange)}% - consider promotional campaigns` : null
    };

    res.json({
      totalRevenue,
      revenueChange: actualChange,
      totalAppointments,
      appointmentsChange: comparisonAppointments > 0 
        ? (((totalAppointments - comparisonAppointments) / comparisonAppointments) * 100).toFixed(1)
        : 0,
      avgTicketSize,
      ticketChange: previousData.avgTicketSize > 0
        ? (((avgTicketSize - previousData.avgTicketSize) / previousData.avgTicketSize) * 100).toFixed(1)
        : 0,
      returningClientsPercent,
      returningChange: 3,
      topService: topService ? { name: topService[0], count: topService[1] } : null,
      topStylist: topStylist ? { name: topStylist[0], revenue: topStylist[1] } : null,
      revenueData,
      heatmapData,
      peakHours,
      peakDay: peakDayText,
      insights: {
        revenue: dynamicInsights.revenue,
        trend: dynamicInsights.trend,
        warning: dynamicInsights.warning,
        peakTime: `Most bookings occur ${peakDayText} between ${peakHours}`
      }
    });
  } catch (error) {
    console.error('Error in getOverview:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/analytics/appointments
exports.getAppointments = async (req, res) => {
  try {
    const { range = 'thisMonth' } = req.query;
    const { startDate, endDate } = getDateRange(range);
    const tenantId = req.user.tenantId;

    const bookings = await Booking.find({
      tenantId,
      scheduledDate: { $gte: startDate, $lte: endDate }
    });

    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const noShows = bookings.filter(b => b.status === 'no-show').length;
    const total = bookings.length;

    const avgDuration = bookings.length > 0
      ? bookings.reduce((sum, b) => sum + (b.totalDuration || 60), 0) / bookings.length
      : 0;

    // Volume data - adaptive based on date range
    const volumeData = [];
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    let dataPoints, groupBy;
    
    // Use same logic as Overview tab
    if (daysDiff <= 1) {
      dataPoints = 1;
      groupBy = 'day';
    } else if (daysDiff <= 7) {
      dataPoints = daysDiff;
      groupBy = 'day';
    } else if (daysDiff <= 31) {
      dataPoints = daysDiff;
      groupBy = 'day';
    } else if (daysDiff <= 91) {
      dataPoints = daysDiff;
      groupBy = 'day';
    } else if (daysDiff <= 181) {
      dataPoints = daysDiff;
      groupBy = 'day';
    } else if (daysDiff <= 366) {
      dataPoints = Math.ceil(daysDiff / 7);
      groupBy = 'week';
    } else if (daysDiff <= 1826) {
      dataPoints = Math.ceil(daysDiff / 7);
      groupBy = 'week';
    } else if (daysDiff <= 3653) {
      dataPoints = Math.ceil(daysDiff / 30);
      groupBy = 'month';
    } else {
      dataPoints = Math.ceil(daysDiff / 365);
      groupBy = 'year';
    }
    
    for (let i = 0; i < dataPoints; i++) {
      let periodStart, periodEnd, label;
      
      if (groupBy === 'day') {
        periodStart = new Date(startDate);
        periodStart.setDate(periodStart.getDate() + i);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setHours(23, 59, 59, 999);
        
        if (daysDiff <= 7) {
          label = periodStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        } else if (daysDiff <= 30) {
          label = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
          label = periodStart.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
        }
      } else if (groupBy === 'week') {
        periodStart = new Date(startDate);
        periodStart.setDate(periodStart.getDate() + (i * 7));
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        
        if (periodEnd > endDate) {
          periodEnd = new Date(endDate);
          periodEnd.setHours(23, 59, 59, 999);
        }
        
        label = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (groupBy === 'month') {
        periodStart = new Date(startDate);
        periodStart.setMonth(periodStart.getMonth() + i);
        periodStart.setDate(1);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        periodEnd.setDate(0);
        periodEnd.setHours(23, 59, 59, 999);
        
        if (periodEnd > endDate) {
          periodEnd = new Date(endDate);
          periodEnd.setHours(23, 59, 59, 999);
        }
        
        label = periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      } else {
        periodStart = new Date(startDate);
        periodStart.setFullYear(periodStart.getFullYear() + i);
        periodStart.setMonth(0);
        periodStart.setDate(1);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        periodEnd.setMonth(0);
        periodEnd.setDate(0);
        periodEnd.setHours(23, 59, 59, 999);
        
        if (periodEnd > endDate) {
          periodEnd = new Date(endDate);
          periodEnd.setHours(23, 59, 59, 999);
        }
        
        label = periodStart.getFullYear().toString();
      }
      
      const periodBookings = bookings.filter(b => {
        const bookingDate = new Date(b.scheduledDate);
        return bookingDate >= periodStart && bookingDate <= periodEnd;
      });
      
      volumeData.push({
        date: label,
        appointments: periodBookings.length
      });
    }

    // Time of day data
    // Calculate real time of day data
    const hourCounts = {};
    bookings.forEach(b => {
      const hour = new Date(b.scheduledDate).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const timeOfDayData = [];
    for (let h = 9; h <= 17; h++) {
      const formatHour = (hour) => {
        if (hour === 12) return '12-1pm';
        if (hour > 12) return `${hour - 12}-${hour - 11}pm`;
        return `${hour}-${hour + 1}am`;
      };
      timeOfDayData.push({
        hour: formatHour(h),
        bookings: hourCounts[h] || 0
      });
    }
    
    // Calculate peak hours (same logic as Overview)
    const formatHour = (h) => {
      if (h === 12) return '12pm';
      if (h > 12) return `${h - 12}pm`;
      return `${h}am`;
    };
    
    let maxBookings = 0;
    let peakHourStart = 9;
    for (let hour = 9; hour <= 17; hour++) {
      const windowBookings = (hourCounts[hour] || 0) + (hourCounts[hour + 1] || 0);
      if (windowBookings > maxBookings) {
        maxBookings = windowBookings;
        peakHourStart = hour;
      }
    }
    
    const peakHours = maxBookings > 0 
      ? `${formatHour(peakHourStart)}-${formatHour(peakHourStart + 2)}`
      : 'No peak hours data';

    res.json({
      completed,
      completedPercent: total > 0 ? ((completed / total) * 100).toFixed(1) : 0,
      cancelled,
      cancelledPercent: total > 0 ? ((cancelled / total) * 100).toFixed(1) : 0,
      noShows,
      noShowsPercent: total > 0 ? ((noShows / total) * 100).toFixed(1) : 0,
      avgDuration: Math.round(avgDuration),
      volumeData,
      cancellationData: [
        { name: 'Completed', value: completed },
        { name: 'Cancelled', value: cancelled },
        { name: 'No-shows', value: noShows }
      ],
      timeOfDayData,
      peakHours,
      insights: {
        volume: total > 0 
          ? `You had ${total} appointment${total === 1 ? '' : 's'} during this period`
          : 'No appointments in this period',
        completion: total > 0
          ? completed === total
            ? `Perfect! All ${completed} appointments were completed`
            : cancelled + noShows > 5
              ? `${cancelled + noShows} appointments didn't happen - consider sending more reminders`
              : `Great job! ${completed} out of ${total} appointments completed successfully`
          : 'Start booking appointments to see completion insights',
        peak: maxBookings > 0
          ? `Busiest time: ${peakHours} - plan extra staff during these hours`
          : 'Not enough data to identify peak hours yet'
      }
    });
  } catch (error) {
    console.error('Error in getAppointments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/analytics/services
exports.getServices = async (req, res) => {
  try {
    const { range = 'thisMonth' } = req.query;
    const { startDate, endDate } = getDateRange(range);
    const tenantId = req.user.tenantId;

    const bookings = await Booking.find({
      tenantId,
      scheduledDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'completed'] }
    });

    // Top services
    const serviceStats = {};
    bookings.forEach(b => {
      if (b.services && b.services.length > 0) {
        const service = b.services[0];
        const id = service.serviceId?._id?.toString() || service.serviceName;
        if (!serviceStats[id]) {
          serviceStats[id] = {
            name: service.serviceName,
            icon: '💇',
            bookings: 0,
            revenue: 0
          };
        }
        serviceStats[id].bookings++;
        serviceStats[id].revenue += b.totalPrice || 0;
      }
    });

    let topServices = Object.values(serviceStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(s => ({
        ...s,
        trend: Math.floor(Math.random() * 30) - 10,
        avgTime: '60min',
        avgRevenue: s.bookings > 0 ? (s.revenue / s.bookings).toFixed(2) : 0,
        ageGroup: '25-34',
        topStylist: 'Sarah Johnson',
        rebookingTime: '4-6 weeks'
      }));

    // If no real data, provide sample data
    if (topServices.length === 0) {
      topServices = [
        { name: 'Haircut & Style', icon: '✂️', bookings: 45, revenue: 2250, trend: 12, avgTime: '45min', avgRevenue: '50.00', ageGroup: '25-34', topStylist: 'N/A', rebookingTime: '4-6 weeks' },
        { name: 'Hair Color', icon: '🎨', bookings: 32, revenue: 3200, trend: 8, avgTime: '120min', avgRevenue: '100.00', ageGroup: '25-34', topStylist: 'N/A', rebookingTime: '8-10 weeks' },
        { name: 'Blowout', icon: '💨', bookings: 28, revenue: 840, trend: -5, avgTime: '30min', avgRevenue: '30.00', ageGroup: '25-34', topStylist: 'N/A', rebookingTime: '2-3 weeks' },
        { name: 'Deep Treatment', icon: '💆', bookings: 18, revenue: 1080, trend: 15, avgTime: '60min', avgRevenue: '60.00', ageGroup: '35-44', topStylist: 'N/A', rebookingTime: '6-8 weeks' },
        { name: 'Highlights', icon: '✨', bookings: 15, revenue: 1875, trend: 10, avgTime: '150min', avgRevenue: '125.00', ageGroup: '25-34', topStylist: 'N/A', rebookingTime: '10-12 weeks' }
      ];
    }

    // Category data
    const categoryData = [
      { name: 'Haircut', value: 35 },
      { name: 'Color', value: 30 },
      { name: 'Treatment', value: 15 },
      { name: 'Styling', value: 12 },
      { name: 'Extensions', value: 8 }
    ];

    // Scatter data (duration vs revenue)
    const scatterData = topServices.map(s => ({
      duration: 30 + Math.random() * 120,
      revenue: s.revenue / s.bookings,
      name: s.name
    }));

    res.json({
      topServices,
      categoryData,
      scatterData,
      scatterInsight: 'Blowouts are high frequency but low revenue—bundle opportunity'
    });
  } catch (error) {
    console.error('Error in getServices:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/analytics/clients
exports.getClients = async (req, res) => {
  try {
    const { range = 'thisMonth' } = req.query;
    const { startDate, endDate } = getDateRange(range);
    const tenantId = req.user.tenantId;

    const clients = await Client.find({ tenantId });
    const bookings = await Booking.find({
      tenantId,
      scheduledDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'completed'] }
    });

    const newClients = clients.filter(c => 
      new Date(c.createdAt) >= startDate && new Date(c.createdAt) <= endDate
    ).length;

    const returningClients = clients.filter(c => c.visitCount > 1).length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const avgSpend = clients.length > 0 ? totalRevenue / clients.length : 0;

    // Growth data
    const growthData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      growthData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        new: Math.floor(Math.random() * 10),
        returning: Math.floor(Math.random() * 20)
      });
    }

    // Churn - Calculate based on selected range (clients who haven't visited during the period)
    // Use the start of the selected period as the churn threshold
    const churnThreshold = new Date(startDate);
    const churnedClients = clients.filter(c => 
      c.lastVisit && new Date(c.lastVisit) < churnThreshold
    ).length;
    
    // Calculate churn period in days for display
    const churnDays = Math.ceil((new Date() - churnThreshold) / (1000 * 60 * 60 * 24));

    res.json({
      totalClients: clients.length,
      clientsChange: 15,
      newClients,
      newPercent: clients.length > 0 ? ((newClients / clients.length) * 100).toFixed(1) : 0,
      returningClients,
      returningPercent: clients.length > 0 ? ((returningClients / clients.length) * 100).toFixed(1) : 0,
      avgSpend: avgSpend.toFixed(2),
      spendChange: 8,
      growthData,
      segmentationData: [
        { name: 'Returning', value: returningClients },
        { name: 'New', value: newClients },
        { name: '18-24', value: Math.floor(clients.length * 0.2) },
        { name: '25-34', value: Math.floor(clients.length * 0.35) },
        { name: '35+', value: Math.floor(clients.length * 0.45) }
      ],
      visitFrequency: 'Every 6 weeks',
      avgSpendPerClient: avgSpend.toFixed(2),
      highValueCount: Math.floor(clients.length * 0.1),
      highValueThreshold: 500,
      churnedClients,
      churnDays
    });
  } catch (error) {
    console.error('Error in getClients:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/analytics/stylists
exports.getStylists = async (req, res) => {
  try {
    const { range = 'thisMonth' } = req.query;
    const { startDate, endDate } = getDateRange(range);
    const tenantId = req.user.tenantId;

    const bookings = await Booking.find({
      tenantId,
      scheduledDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'completed'] }
    }).populate('stylistId assignedTo');

    const stylists = await User.find({ 
      tenantId,
      role: { $in: ['stylist', 'owner', 'manager'] }
    });

    // Calculate stylist stats
    const stylistStats = stylists.map(stylist => {
      const stylistBookings = bookings.filter(b => {
        const assignedStylist = b.assignedTo || b.stylistId;
        if (!assignedStylist) return false;
        return assignedStylist._id.toString() === stylist._id.toString();
      });
      
      const revenue = stylistBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const avgTime = stylistBookings.length > 0
        ? stylistBookings.reduce((sum, b) => sum + (b.totalDuration || 60), 0) / stylistBookings.length
        : 0;

      return {
        name: `${stylist.firstName} ${stylist.lastName}`,
        photo: stylist.photo || null,
        revenue,
        bookings: stylistBookings.length,
        rating: 4.5 + Math.random() * 0.5,
        avgTime: Math.round(avgTime),
        rebookingRate: 70 + Math.floor(Math.random() * 25),
        idleTime: Math.floor(Math.random() * 10),
        skills: ['Haircut', 'Color', 'Styling'],
        serviceMix: [
          { name: 'Haircut', percent: 40 },
          { name: 'Color', percent: 35 },
          { name: 'Styling', percent: 25 }
        ]
      };
    });

    const revenueData = stylistStats.map(s => ({
      name: s.name,
      revenue: s.revenue
    }));

    const sorted = [...stylistStats].sort((a, b) => b.avgTime - a.avgTime);

    res.json({
      stylists: stylistStats,
      revenueData,
      avgDuration: stylistStats.length > 0
        ? Math.round(stylistStats.reduce((sum, s) => sum + s.avgTime, 0) / stylistStats.length)
        : 0,
      fastest: sorted.length > 0 ? { name: sorted[sorted.length - 1].name, time: sorted[sorted.length - 1].avgTime } : null,
      slowest: sorted.length > 0 ? { name: sorted[0].name, time: sorted[0].avgTime } : null,
      avgIdleTime: stylistStats.length > 0
        ? Math.round(stylistStats.reduce((sum, s) => sum + s.idleTime, 0) / stylistStats.length)
        : 0
    });
  } catch (error) {
    console.error('Error in getStylists:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /api/analytics/finance
exports.getFinance = async (req, res) => {
  try {
    const { range = 'thisMonth' } = req.query;
    const { startDate, endDate } = getDateRange(range);
    const tenantId = req.user.tenantId;

    const bookings = await Booking.find({
      tenantId,
      scheduledDate: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'completed'] }
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const serviceRevenue = totalRevenue * 0.85; // Mock split
    const productRevenue = totalRevenue * 0.10;
    const tips = totalRevenue * 0.05;

    // Monthly data (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        current: 8000 + Math.random() * 4000,
        previous: 7000 + Math.random() * 3000
      });
    }

    // Top revenue sources
    const topServiceCategories = [
      { name: 'Hair Color', revenue: totalRevenue * 0.35, percent: 35 },
      { name: 'Haircut', revenue: totalRevenue * 0.30, percent: 30 },
      { name: 'Treatments', revenue: totalRevenue * 0.20, percent: 20 },
      { name: 'Styling', revenue: totalRevenue * 0.10, percent: 10 },
      { name: 'Extensions', revenue: totalRevenue * 0.05, percent: 5 }
    ];

    const topStylists = [
      { name: 'Sarah Johnson', revenue: totalRevenue * 0.30, percent: 30 },
      { name: 'Mike Chen', revenue: totalRevenue * 0.25, percent: 25 },
      { name: 'Emma Davis', revenue: totalRevenue * 0.20, percent: 20 },
      { name: 'Alex Kim', revenue: totalRevenue * 0.15, percent: 15 },
      { name: 'Lisa Brown', revenue: totalRevenue * 0.10, percent: 10 }
    ];

    const topProducts = [
      { name: 'Shampoo', revenue: productRevenue * 0.35, percent: 35 },
      { name: 'Conditioner', revenue: productRevenue * 0.25, percent: 25 },
      { name: 'Hair Serum', revenue: productRevenue * 0.20, percent: 20 },
      { name: 'Styling Gel', revenue: productRevenue * 0.12, percent: 12 },
      { name: 'Hair Spray', revenue: productRevenue * 0.08, percent: 8 }
    ];

    res.json({
      totalRevenue,
      revenueChange: 18,
      serviceRevenue,
      servicePercent: 85,
      productRevenue,
      productPercent: 10,
      tips,
      tipsPercent: 5,
      monthlyData,
      trendInsight: 'Revenue up 18% compared to same period last year',
      topServiceCategories,
      topStylists,
      topProducts,
      profitability: {
        bestMargins: [
          { name: 'Blowout', margin: 75 },
          { name: 'Haircut', margin: 70 },
          { name: 'Styling', margin: 65 }
        ],
        consumableCosts: [
          { category: 'Color', cost: 1200 },
          { category: 'Treatment', cost: 800 },
          { category: 'Styling', cost: 400 }
        ],
        insight: 'Color services have highest margins but also highest consumable costs'
      }
    });
  } catch (error) {
    console.error('Error in getFinance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
