// Export analytics data to CSV or PDF

export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle values with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAnalyticsReport = (analyticsData, dateRange) => {
  const reportData = [];

  // Add summary data
  if (analyticsData.totalRevenue !== undefined) {
    reportData.push({
      Metric: 'Total Revenue',
      Value: `$${analyticsData.totalRevenue.toLocaleString()}`,
      Change: `${analyticsData.revenueChange}%`
    });
  }

  if (analyticsData.totalAppointments !== undefined) {
    reportData.push({
      Metric: 'Total Appointments',
      Value: analyticsData.totalAppointments,
      Change: `${analyticsData.appointmentsChange}%`
    });
  }

  if (analyticsData.avgTicketSize !== undefined) {
    reportData.push({
      Metric: 'Avg Ticket Size',
      Value: `$${analyticsData.avgTicketSize.toFixed(2)}`,
      Change: `${analyticsData.ticketChange}%`
    });
  }

  exportToCSV(reportData, `analytics_summary_${dateRange}`);
};

export const exportRevenueData = (revenueData, dateRange) => {
  if (!revenueData || revenueData.length === 0) {
    alert('No revenue data to export');
    return;
  }

  const formattedData = revenueData.map(item => ({
    Date: item.date,
    Revenue: item.revenue,
    'Previous Period': item.lastMonth || 0
  }));

  exportToCSV(formattedData, `revenue_data_${dateRange}`);
};

export const exportStylistData = (stylists, dateRange) => {
  if (!stylists || stylists.length === 0) {
    alert('No stylist data to export');
    return;
  }

  const formattedData = stylists.map((stylist, index) => ({
    Rank: index + 1,
    Name: stylist.name,
    Revenue: stylist.revenue,
    Bookings: stylist.bookings,
    'Avg Time (min)': stylist.avgTime,
    Rating: stylist.rating?.toFixed(1),
    'Rebooking Rate': `${stylist.rebookingRate}%`
  }));

  exportToCSV(formattedData, `stylist_performance_${dateRange}`);
};
