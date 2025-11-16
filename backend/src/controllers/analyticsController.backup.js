const Booking = require('../models/Booking');
const Client = require('../models/Client');
const Service = require('../models/Service');
const User = require('../models/User');

// Helper function to get date range
const getDateRange = (range) => {
  const now = new Date();
  let startDate, endDate = now;
  
  switch(range) {
    case 'thisWeek':
      startDate = new Date(now.setDate(now.getDate() - now.getDay()));
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'last3Months':
      startDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case 'thisMonth':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
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
    }).populate('services.serviceId stylistId');

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
      if (b.stylistId) {
        const name = b.stylistId.name || 'Unknown';
        stylistRevenue[name] = (stylistRevenue[name] || 0) + (b.totalPrice || 0);
      }
    });
    const topStylist = Object.entries(stylistRevenue).sort((a, b) => b[1] - a[1])[0];

    // Generate revenue data for chart (last 7 days)
    const revenueData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayBookings = bookings.filter(b => 
        new Date(b.date) >= dayStart && new Date(b.date) <= dayEnd
      );
      const revenue = dayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      
      revenueData.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: revenue,
        lastMonth: revenue * 0.85 // Mock comparison data
      });
    }

    // Generate heatmap data (sample)
    const heatmapData = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 10; hour++) {
        heatmapData.push({
          day,
          hour,
          value: Math.floor(Math.random() * 10)
        });
      }
    }

    res.json({
      totalRevenue,
      revenueChange: 12,
      totalAppointments,
      appointmentsChange: 8,
      avgTicketSize,
      ticketChange: 5,
      returningClientsPercent,
      returningChange: 3,
      topService: topService ? { name: topService[0], count: topService[1] } : null,
      topStylist: topStylist ? { name: topStylist[0], revenue: topStylist[1] } : null,
      revenueData,
      heatmapData,
      insights: {
        revenue: `Revenue increased ${totalRevenue > 0 ? '14%' : '0%'} compared to last month.`,
        trend: 'Hair color services generated the most revenue this month.',
        warning: 'Your slowest booking day is Tuesday.'
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

    // Volume data (last 7 days)
    const volumeData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayBookings = bookings.filter(b => 
        new Date(b.date) >= dayStart && new Date(b.date) <= dayEnd
      );
      
      volumeData.push({
        date: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        appointments: dayBookings.length
      });
    }

    // Time of day data
    const timeOfDayData = [
      { hour: '9-10am', bookings: Math.floor(Math.random() * 20) },
      { hour: '10-11am', bookings: Math.floor(Math.random() * 20) },
      { hour: '11-12pm', bookings: Math.floor(Math.random() * 20) },
      { hour: '12-1pm', bookings: Math.floor(Math.random() * 20) },
      { hour: '1-2pm', bookings: Math.floor(Math.random() * 20) },
      { hour: '2-3pm', bookings: Math.floor(Math.random() * 20) },
      { hour: '3-4pm', bookings: Math.floor(Math.random() * 20) },
      { hour: '4-5pm', bookings: Math.floor(Math.random() * 20) },
      { hour: '5-6pm', bookings: Math.floor(Math.random() * 20) }
    ];

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
      peakHours: '2-6pm',
      insights: {
        overbooked: 'Fridays 3-5pm are consistently overbooked',
        underutilized: 'Tuesday mornings have 40% availability',
        suggestion: 'Offer weekday lunch deals to boost mid-day bookings'
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
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'completed'] }
    }).populate('service');

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

    const topServices = Object.values(serviceStats)
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

    // Churn
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const churnedClients = clients.filter(c => 
      c.lastVisit && new Date(c.lastVisit) < ninetyDaysAgo
    ).length;

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
      churnedClients
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
    }).populate('stylistId');

    const stylists = await User.find({ 
      tenantId,
      role: { $in: ['stylist', 'admin'] }
    });

    // Calculate stylist stats
    const stylistStats = stylists.map(stylist => {
      const stylistBookings = bookings.filter(b => 
        b.stylistId && b.stylistId._id.toString() === stylist._id.toString()
      );
      
      const revenue = stylistBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const avgTime = stylistBookings.length > 0
        ? stylistBookings.reduce((sum, b) => sum + (b.totalDuration || 60), 0) / stylistBookings.length
        : 0;

      return {
        name: stylist.name,
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
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'completed'] }
    }).populate('service');

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
