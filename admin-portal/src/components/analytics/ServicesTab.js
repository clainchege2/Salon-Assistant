import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, getCurrencyCode } from '../../utils/formatters';
import './ServicesTab.css';

const ServicesTab = ({ dateRange, customRange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedService, setExpandedService] = useState(null);

  useEffect(() => {
    fetchServicesData();
  }, [dateRange, customRange]);

  const fetchServicesData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      console.log('[ServicesTab] Fetching data for range:', dateRange);
      const response = await fetch(`http://localhost:5000/api/analytics/services?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error('[ServicesTab] Response not OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('[ServicesTab] Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('[ServicesTab] Data received:', result);
      console.log('[ServicesTab] topServices:', result?.topServices);
      console.log('[ServicesTab] categoryData:', result?.categoryData);
      console.log('[ServicesTab] scatterData:', result?.scatterData);
      setData(result);
    } catch (error) {
      console.error('[ServicesTab] Error fetching services data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading services data...</div>;
  
  if (!data) {
    return (
      <div className="empty-state">
        <h3>Unable to load services data</h3>
        <p>Please check the console for errors or try refreshing the page.</p>
      </div>
    );
  }

  const COLORS = ['#ff69b4', '#9b59b6', '#3498db', '#2ecc71', '#f39c12', '#e74c3c'];

  console.log('[ServicesTab] Rendering with data:', {
    hasTopServices: !!data?.topServices,
    topServicesLength: data?.topServices?.length,
    hasCategoryData: !!data?.categoryData,
    categoryDataLength: data?.categoryData?.length,
    hasScatterData: !!data?.scatterData,
    scatterDataLength: data?.scatterData?.length
  });

  return (
    <div className="services-tab">
      {/* Insights Section - Moved to Top */}
      <div className="insights-section">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card positive">
            <div className="insight-icon">💰</div>
            <div className="insight-text">
              {data?.topServices?.[0] 
                ? `${data.topServices[0].name} is your top revenue generator at ${formatCurrency(data.topServices[0].revenue)}`
                : 'Add bookings to see top service performance'
              }
            </div>
          </div>
          
          <div className="insight-card info">
            <div className="insight-icon">📊</div>
            <div className="insight-text">
              {data?.scatterInsight || 'Quick services like blowouts have high frequency but lower revenue—consider bundling with treatments'}
            </div>
          </div>
          
          {data?.topServices && data.topServices.length > 1 && (
            <div className="insight-card warning">
              <div className="insight-icon">⚡</div>
              <div className="insight-text">
                {`${data.topServices.length} services tracked - diversify offerings to maximize revenue`}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="chart-widget">
        <div className="widget-header">
          <h3>Top 5 Services</h3>
        </div>
        
        <div className="services-list">
          {(!data?.topServices || data.topServices.length === 0) ? (
            <div className="empty-state">
              <p>No service data available for this period.</p>
            </div>
          ) : (
            data.topServices.map((service, index) => (
            <div key={index} className="service-row">
              <div className="service-rank">#{index + 1}</div>
              <div className="service-icon" style={{ background: `${COLORS[index]}15`, color: COLORS[index] }}>
                {service.icon || '💇'}
              </div>
              <div className="service-info">
                <div className="service-name">{service.name}</div>
                <div className="service-stats">
                  {service.bookings} bookings • ${service.revenue?.toLocaleString()}
                </div>
              </div>
              <div className={`service-trend ${service.trend > 0 ? 'up' : 'down'}`}>
                {service.trend > 0 ? '↑' : '↓'} {Math.abs(service.trend)}%
              </div>
              <button 
                className="expand-btn"
                onClick={() => setExpandedService(expandedService === index ? null : index)}
              >
                {expandedService === index ? '−' : '+'}
              </button>
              
              {expandedService === index && (
                <div className="service-details">
                  <div className="detail-item">
                    <span className="detail-label">Avg Booking Time:</span>
                    <span className="detail-value">{service.avgTime || '60min'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Avg Revenue:</span>
                    <span className="detail-value">{formatCurrency(service.avgRevenue || 0)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Most Common Age Group:</span>
                    <span className="detail-value">{service.ageGroup || '25-34'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Top Stylist:</span>
                    <span className="detail-value">{service.topStylist || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Rebooking Time:</span>
                    <span className="detail-value">{service.rebookingTime || '4-6 weeks'}</span>
                  </div>
                </div>
              )}
            </div>
            ))
          )}
        </div>
      </div>

      <div className="two-column-grid">
        <div className="chart-widget">
          <div className="widget-header">
            <h3>Category Revenue</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data?.categoryData || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {(data?.categoryData || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-widget">
          <div className="widget-header">
            <h3>Duration vs Revenue</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                dataKey="duration" 
                name="Duration" 
                unit="min"
                stroke="#999"
                label={{ value: 'Duration (min)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="number" 
                dataKey="revenue" 
                name="Revenue" 
                stroke="#999"
                label={{ value: `Revenue (${getCurrencyCode()})`, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter 
                name="Services" 
                data={data?.scatterData || []} 
                fill="#ff69b4"
              />
            </ScatterChart>
          </ResponsiveContainer>
          
        </div>
      </div>
    </div>
  );
};

export default ServicesTab;
