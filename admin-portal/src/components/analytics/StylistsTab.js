import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './StylistsTab.css';

const StylistsTab = ({ dateRange, customRange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('revenue');
  const [selectedStylist, setSelectedStylist] = useState(null);

  useEffect(() => {
    fetchStylistsData();
  }, [dateRange, customRange]);

  const fetchStylistsData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/analytics/stylists?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching stylists data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading stylists data...</div>;

  const sortedStylists = [...(data?.stylists || [])].sort((a, b) => {
    if (sortBy === 'revenue') return b.revenue - a.revenue;
    if (sortBy === 'bookings') return b.bookings - a.bookings;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'avgTime') return a.avgTime - b.avgTime;
    return 0;
  });

  return (
    <div className="stylists-tab">
      <div className="chart-widget">
        <div className="widget-header">
          <h3>Stylist Leaderboard</h3>
          <div className="sort-controls">
            <label>Sort by:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="revenue">Revenue</option>
              <option value="bookings">Bookings</option>
              <option value="rating">Satisfaction Rating</option>
              <option value="avgTime">Avg Service Time</option>
            </select>
          </div>
        </div>
        
        <div className="stylists-list">
          {sortedStylists.map((stylist, index) => (
            <div 
              key={index} 
              className="stylist-row"
              onClick={() => setSelectedStylist(selectedStylist === index ? null : index)}
            >
              <div className="stylist-rank">#{index + 1}</div>
              <div className="stylist-photo">
                {stylist.photo ? (
                  <img src={stylist.photo} alt={stylist.name} />
                ) : (
                  <div className="photo-placeholder">
                    {stylist.name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className="stylist-info">
                <div className="stylist-name">{stylist.name}</div>
                <div className="stylist-stats">
                  ${stylist.revenue?.toLocaleString()} • {stylist.bookings} bookings
                </div>
              </div>
              <div className="stylist-rating">
                ⭐ {stylist.rating?.toFixed(1) || '0.0'}
              </div>
              <button className="expand-btn">
                {selectedStylist === index ? '−' : '+'}
              </button>
              
              {selectedStylist === index && (
                <div className="stylist-details">
                  <div className="detail-section">
                    <h4>Performance Metrics</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Total Revenue</span>
                        <span className="detail-value">${stylist.revenue?.toLocaleString()}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Total Bookings</span>
                        <span className="detail-value">{stylist.bookings}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Avg Service Time</span>
                        <span className="detail-value">{stylist.avgTime}min</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Client Satisfaction</span>
                        <span className="detail-value">⭐ {stylist.rating?.toFixed(1)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Rebooking Rate</span>
                        <span className="detail-value">{stylist.rebookingRate || '0'}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Idle Time</span>
                        <span className="detail-value">{stylist.idleTime || '0'}hrs</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Skills Profile</h4>
                    <div className="skills-list">
                      {(stylist.skills || ['Haircut', 'Color', 'Styling']).map((skill, i) => (
                        <span key={i} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Service Mix</h4>
                    <div className="service-mix">
                      {(stylist.serviceMix || []).map((service, i) => (
                        <div key={i} className="mix-item">
                          <span>{service.name}</span>
                          <span>{service.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="chart-widget">
        <div className="widget-header">
          <h3>Revenue by Stylist</h3>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data?.revenueData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip />
            <Bar dataKey="revenue" fill="#ff69b4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-widget">
        <div className="widget-header">
          <h3>Efficiency Panel</h3>
        </div>
        
        <div className="efficiency-grid">
          <div className="efficiency-card">
            <div className="efficiency-icon">⏱️</div>
            <div className="efficiency-label">Avg Service Duration</div>
            <div className="efficiency-value">{data?.avgDuration || '0'}min</div>
          </div>
          <div className="efficiency-card">
            <div className="efficiency-icon">⚡</div>
            <div className="efficiency-label">Fastest Stylist</div>
            <div className="efficiency-value">{data?.fastest?.name || 'N/A'}</div>
            <div className="efficiency-subvalue">{data?.fastest?.time || '0'}min avg</div>
          </div>
          <div className="efficiency-card">
            <div className="efficiency-icon">🐌</div>
            <div className="efficiency-label">Slowest Stylist</div>
            <div className="efficiency-value">{data?.slowest?.name || 'N/A'}</div>
            <div className="efficiency-subvalue">{data?.slowest?.time || '0'}min avg</div>
          </div>
          <div className="efficiency-card">
            <div className="efficiency-icon">💤</div>
            <div className="efficiency-label">Avg Idle Time</div>
            <div className="efficiency-value">{data?.avgIdleTime || '0'}hrs</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StylistsTab;
