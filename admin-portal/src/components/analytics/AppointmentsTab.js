import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import KPICard from './KPICard';
import './AppointmentsTab.css';

const AppointmentsTab = ({ dateRange, customRange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [volumeView, setVolumeView] = useState('daily');

  useEffect(() => {
    fetchAppointmentsData();
  }, [dateRange, customRange]);

  const fetchAppointmentsData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/analytics/appointments?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching appointments data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading appointments data...</div>;

  const kpiData = [
    {
      icon: '✅',
      label: 'Completed',
      value: data?.completed || '0',
      subValue: `${data?.completedPercent || 0}%`,
      color: '#2ecc71'
    },
    {
      icon: '❌',
      label: 'Cancelled',
      value: data?.cancelled || '0',
      subValue: `${data?.cancelledPercent || 0}%`,
      color: '#e74c3c'
    },
    {
      icon: '👻',
      label: 'No-shows',
      value: data?.noShows || '0',
      subValue: `${data?.noShowsPercent || 0}%`,
      color: '#95a5a6'
    },
    {
      icon: '⏱️',
      label: 'Avg Duration',
      value: `${data?.avgDuration || 0}min`,
      color: '#3498db'
    }
  ];

  const COLORS = ['#2ecc71', '#e74c3c', '#95a5a6'];

  return (
    <div className="appointments-tab">
      <div className="kpi-grid">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Key Insights - Moved to Top */}
      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card info">
            <div className="insight-icon">📊</div>
            <div className="insight-text">
              {data?.insights?.overbooked || 'Fridays 3-5pm are consistently overbooked'}
            </div>
          </div>
          <div className="insight-card warning">
            <div className="insight-icon">⚠️</div>
            <div className="insight-text">
              {data?.insights?.underutilized || 'Tuesday mornings have 40% availability'}
            </div>
          </div>
          <div className="insight-card positive">
            <div className="insight-icon">💡</div>
            <div className="insight-text">
              {data?.insights?.suggestion || 'Offer weekday lunch deals to boost mid-day bookings'}
            </div>
          </div>
        </div>
      </div>

      <div className="chart-widget">
        <div className="widget-header">
          <h3>Appointment Volume</h3>
          <div className="chart-info">
            <span style={{ fontSize: '13px', color: '#999' }}>
              {['1D', '7D', '30D', '90D', '180D'].includes(dateRange) && 'Daily view'}
              {['1Y', '2Y', '3Y', '5Y'].includes(dateRange) && 'Weekly view'}
              {['7Y', '9Y', '10Y'].includes(dateRange) && 'Monthly view'}
              {['15Y', '20Y', 'ALL'].includes(dateRange) && 'Yearly view'}
              {data?.volumeData && ` • ${data.volumeData.length} data points`}
            </span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data?.volumeData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#999"
              angle={data?.volumeData && data.volumeData.length > 30 ? -45 : 0}
              textAnchor={data?.volumeData && data.volumeData.length > 30 ? "end" : "middle"}
              height={data?.volumeData && data.volumeData.length > 30 ? 80 : 30}
              interval={data?.volumeData && data.volumeData.length > 90 ? Math.floor(data.volumeData.length / 20) : 'preserveStartEnd'}
            />
            <YAxis stroke="#999" />
            <Tooltip />
            <Bar dataKey="appointments" fill="#ff69b4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="two-column-grid">
        <div className="chart-widget">
          <div className="widget-header">
            <h3>Cancellation Breakdown</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data?.cancellationData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(data?.cancellationData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-widget">
          <div className="widget-header">
            <h3>Time-of-Day Distribution</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.timeOfDayData || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" stroke="#999" />
              <YAxis dataKey="hour" type="category" stroke="#999" />
              <Tooltip />
              <Bar dataKey="bookings" fill="#9b59b6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="insight-footer">
            💡 Peak booking hours: {data?.peakHours || '2-6pm'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentsTab;
