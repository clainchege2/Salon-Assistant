import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import KPICard from './KPICard';
import HeatmapChart from './HeatmapChart';
import InsightCard from './InsightCard';
import LoadingSkeleton from '../LoadingSkeleton';
import { formatCurrency } from '../../utils/formatters';
import './OverviewTab.css';

const OverviewTab = ({ dateRange, customRange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, [dateRange, customRange]);

  const fetchOverviewData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`[Analytics] Fetching data for range: ${dateRange}`);
      const response = await fetch(`http://localhost:5000/api/analytics/overview?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Handle expired token
      if (response.status === 401) {
        console.log('Session expired. Redirecting to login...');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="overview-tab">
        <LoadingSkeleton type="kpi-grid" />
        <LoadingSkeleton type="chart" />
        <LoadingSkeleton type="chart" />
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h3>No Data Available</h3>
        <p>Unable to load analytics data. Please try refreshing the page.</p>
      </div>
    );
  }

  const kpiData = [
    {
      icon: '💰',
      label: 'Total Revenue',
      value: formatCurrency(data?.totalRevenue || 0),
      change: data?.revenueChange || 0,
      color: '#ff69b4'
    },
    {
      icon: '📅',
      label: 'Total Appointments',
      value: data?.totalAppointments || '0',
      change: data?.appointmentsChange || 0,
      color: '#9b59b6'
    },
    {
      icon: '',
      label: 'Avg Booking Value',
      value: formatCurrency(data?.avgTicketSize || 0),
      change: data?.ticketChange || 0,
      color: '#3498db'
    },
    {
      icon: '🔄',
      label: 'Returning Clients',
      value: `${data?.returningClientsPercent || '0'}%`,
      change: data?.returningChange || 0,
      color: '#2ecc71'
    },
    {
      icon: '⭐',
      label: 'Most Booked Service',
      value: data?.topService?.name || 'N/A',
      subValue: `${data?.topService?.count || 0} bookings`,
      color: '#f39c12'
    },
    {
      icon: '👑',
      label: 'Top Stylist',
      value: data?.topStylist?.name || 'N/A',
      subValue: formatCurrency(data?.topStylist?.revenue || 0),
      color: '#e74c3c'
    }
  ];

  // Determine insight types based on changes
  const getInsightType = (change) => {
    if (change > 5) return 'positive';
    if (change < -5) return 'warning';
    return 'info';
  };

  const revenueChange = data?.revenueChange || 0;
  const appointmentsChange = data?.appointmentsChange || 0;

  const insights = [
    {
      icon: '💰',
      text: data?.insights?.revenue || `Revenue ${revenueChange > 0 ? 'increased' : 'decreased'} ${Math.abs(revenueChange).toFixed(1)}% vs previous period`,
      type: getInsightType(revenueChange)
    },
    {
      icon: '📅',
      text: appointmentsChange !== 0 
        ? `Appointments ${appointmentsChange > 0 ? 'up' : 'down'} ${Math.abs(appointmentsChange).toFixed(1)}% from last period`
        : 'Appointment volume remained stable',
      type: getInsightType(appointmentsChange)
    },
    data?.topService?.name && {
      icon: '💅',
      text: data?.insights?.trend || `${data.topService.name} is your top service with ${data.topService.count} bookings`,
      type: 'info'
    }
  ].filter(Boolean); // Remove null/undefined entries

  return (
    <div className="overview-tab">
      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Quick Insights - Moved to Top */}
      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          {insights.map((insight, index) => (
            <InsightCard key={index} {...insight} />
          ))}
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="chart-widget">
        <div className="widget-header">
          <h3>Revenue Over Time</h3>
          <div className="chart-info">
            <span style={{ fontSize: '13px', color: '#999' }}>
              {['1D', '7D', '30D', '90D'].includes(dateRange) && 'Daily view'}
              {['180D', '1Y', '2Y', '3Y', '5Y'].includes(dateRange) && 'Weekly view'}
              {['7Y', '9Y', '10Y'].includes(dateRange) && 'Monthly view'}
              {['15Y', '20Y', 'ALL'].includes(dateRange) && 'Yearly view'}
              {dateRange === 'thisWeek' && 'Daily view'}
              {dateRange === 'thisMonth' && 'Daily view'}
              {dateRange === 'lastMonth' && 'Daily view'}
              {dateRange === 'last3Months' && 'Weekly view'}
            </span>
          </div>
        </div>
        
        {data?.revenueData && data.revenueData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#999"
                angle={data.revenueData.length > 30 ? -45 : 0}
                textAnchor={data.revenueData.length > 30 ? "end" : "middle"}
                height={data.revenueData.length > 30 ? 80 : 30}
                interval={data.revenueData.length > 90 ? Math.floor(data.revenueData.length / 20) : 'preserveStartEnd'}
              />
              <YAxis stroke="#999" />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#ff69b4" 
                strokeWidth={3}
                dot={{ fill: '#ff69b4', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="lastMonth" 
                stroke="#ddd" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <div>No revenue data available for this period</div>
              <div style={{ fontSize: '13px', marginTop: '8px' }}>Try selecting a different date range</div>
            </div>
          </div>
        )}
        
        <div className="insight-footer">
          💡 {data?.insights?.revenue || 'Select a date range to see revenue trends.'}
        </div>
      </div>

      {/* Appointments Heatmap */}
      <div className="chart-widget">
        <div className="widget-header">
          <h3>Peak Booking Hours</h3>
        </div>
        <HeatmapChart data={data?.heatmapData || []} />
      </div>
    </div>
  );
};

export default OverviewTab;
