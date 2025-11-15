import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatCurrency } from '../utils/formatters';
import './Reports.css';

export default function Reports() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalClients: 0,
    completedBookings: 0,
    averageBookingValue: 0,
    topServices: [],
    clientCategories: {},
    revenueByMonth: [],
    referralSources: {}
  });
  const [rfmData, setRfmData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [segmentClients, setSegmentClients] = useState([]);
  const [showRfmResult, setShowRfmResult] = useState(false);
  const [rfmResultCount, setRfmResultCount] = useState(0);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [categoryModal, setCategoryModal] = useState({ show: false, category: '', clients: [] });
  const [allClients, setAllClients] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
    fetchRFMData();
  }, [timeRange]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [bookingsRes, clientsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/v1/bookings', config),
        axios.get('http://localhost:5000/api/v1/clients', config)
      ]);

      const allBookings = bookingsRes.data.data || [];
      const clients = clientsRes.data.data || [];
      setAllClients(clients); // Store for category modal
      
      // Filter bookings by time range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
      const bookings = allBookings.filter(b => new Date(b.scheduledDate) >= cutoffDate);

      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const averageBookingValue = completedBookings.length > 0 
        ? totalRevenue / completedBookings.length 
        : 0;

      const serviceCount = {};
      completedBookings.forEach(booking => {
        booking.services?.forEach(service => {
          const name = service.serviceName;
          if (!serviceCount[name]) {
            serviceCount[name] = { count: 0, revenue: 0 };
          }
          serviceCount[name].count++;
          serviceCount[name].revenue += service.price || 0;
        });
      });

      const topServices = Object.entries(serviceCount)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const clientCategories = clients.reduce((acc, client) => {
        acc[client.category] = (acc[client.category] || 0) + 1;
        return acc;
      }, {});

      // Calculate referral source statistics
      const referralSources = clients.reduce((acc, client) => {
        const source = client.referralSource || 'not-specified';
        if (!acc[source]) {
          acc[source] = { count: 0, totalSpent: 0, totalVisits: 0 };
        }
        acc[source].count++;
        acc[source].totalSpent += client.totalSpent || 0;
        acc[source].totalVisits += client.totalVisits || 0;
        return acc;
      }, {});

      const revenueByMonth = calculateRevenueByMonth(completedBookings);

      setStats({
        totalRevenue,
        totalBookings: bookings.length,
        totalClients: clients.length,
        completedBookings: completedBookings.length,
        averageBookingValue,
        topServices,
        clientCategories,
        revenueByMonth,
        referralSources
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRFMData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/v1/marketing/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRfmData(response.data.data);
    } catch (error) {
      console.error('Error fetching RFM data:', error);
    }
  };

  const calculateRFM = async () => {
    if (calculating) return;
    setCalculating(true);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        'http://localhost:5000/api/v1/marketing/rfm/calculate',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRfmResultCount(response.data.data.length);
      setShowRfmResult(true);
      await fetchRFMData();
    } catch (error) {
      console.error('RFM calculation error:', error);
      alert('Failed to calculate RFM: ' + (error.response?.data?.message || error.message));
    } finally {
      setCalculating(false);
    }
  };

  const viewSegmentClients = async (segment) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `http://localhost:5000/api/v1/marketing/segments/${segment}/clients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSegmentClients(response.data.data || []);
      setSelectedSegment(segment);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const createCampaignForSegment = (segment) => {
    navigate('/marketing', { 
      state: { 
        selectedSegment: segment,
        clients: segmentClients 
      } 
    });
  };

  const calculateRevenueByMonth = (bookings) => {
    const months = {};
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months[key] = 0;
    }

    bookings.forEach(booking => {
      const date = new Date(booking.scheduledDate);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (months.hasOwnProperty(key)) {
        months[key] += booking.totalPrice || 0;
      }
    });

    return Object.entries(months).map(([month, revenue]) => ({ month, revenue }));
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div className="reports-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <div className="page-title-wrapper">
          <div className="title-with-icon">
            <span className="title-icon">📈</span>
            <div className="title-content">
              <h1>Analytics & Reports</h1>
              <p className="page-tagline">Insights to drive your salon's success</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px' }}
          >
            <option value="7">Last 7 days</option>
            <option value="14">Last 2 weeks</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 2 months</option>
            <option value="90">Last 3 months</option>
            <option value="180">Last 6 months</option>
            <option value="365">Last year</option>
            <option value="730">Last 2 years</option>
            <option value="1825">Last 5 years</option>
            <option value="99999">All time</option>
          </select>
          <button 
            className="primary-btn"
            onClick={calculateRFM}
            disabled={calculating}
          >
            {calculating ? 'Calculating...' : '🔄 Calculate RFM'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card revenue">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Total Revenue</h3>
            <p className="metric-value">{formatCurrency(stats.totalRevenue)}</p>
            <span className="metric-label">From {stats.completedBookings} completed bookings</span>
          </div>
        </div>

        <div className="metric-card bookings">
          <div className="metric-icon">📅</div>
          <div className="metric-content">
            <h3>Total Bookings</h3>
            <p className="metric-value">{stats.totalBookings}</p>
            <span className="metric-label">{stats.completedBookings} completed</span>
          </div>
        </div>

        <div className="metric-card clients">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>Total Clients</h3>
            <p className="metric-value">{stats.totalClients}</p>
            <span className="metric-label">Active client base</span>
          </div>
        </div>

        <div className="metric-card average">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>Avg Booking Value</h3>
            <p className="metric-value">{formatCurrency(stats.averageBookingValue)}</p>
            <span className="metric-label">Per completed booking</span>
          </div>
        </div>
      </div>

      {/* RFM Client Segments */}
      <div className="report-section">
        <div className="section-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 8px 0' }}>📈 RFM Client Segments</h2>
          <p className="section-subtitle" style={{ margin: 0, fontSize: '14px', color: '#666', fontWeight: 'normal' }}>
            Recency, Frequency, Monetary analysis of your client base
          </p>
        </div>
        <div className="segments-grid">
          {rfmData?.segments && Object.entries(rfmData.segments).map(([segment, data]) => {
            // Map segment to icon
            const getSegmentIcon = (seg) => {
              const icons = {
                champions: '👑',
                loyal: '⭐',
                potentialLoyalist: '🌟',
                newCustomers: '✨',
                promising: '💫',
                needAttention: '👀',
                aboutToSleep: '😴',
                atRisk: '⚠️',
                cantLoseThem: '🚨',
                hibernating: '💤',
                lost: '❌'
              };
              return icons[seg] || '👤';
            };
            
            // Format segment name for display
            const formatSegmentName = (seg) => {
              return seg
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
            };
            
            return (
              <div 
                key={segment}
                className={`segment-card ${data.count > 0 ? 'has-clients' : ''}`}
                onClick={() => data.count > 0 && viewSegmentClients(segment)}
              >
                <div className="segment-header">
                  <div className="segment-icon">{getSegmentIcon(segment)}</div>
                  <div className="segment-name">{formatSegmentName(segment)}</div>
                </div>
                <div className="segment-count">{data.count} clients</div>
                <div className="segment-value">{formatCurrency(data.totalValue)}</div>
                <div className="segment-desc">{data.description}</div>
                {data.action && <div className="segment-action">{data.action}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="report-section">
        <h2>💹 Revenue Trend (Last 6 Months)</h2>
        <div className="chart-container">
          <div className="bar-chart">
            {stats.revenueByMonth.map((item, index) => {
              const maxRevenue = Math.max(...stats.revenueByMonth.map(m => m.revenue));
              const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              
              return (
                <div key={index} className="bar-wrapper">
                  <div className="bar-value">{formatCurrency(item.revenue)}</div>
                  <div className="bar" style={{ height: `${height}%` }}>
                    <div className="bar-fill"></div>
                  </div>
                  <div className="bar-label">{item.month}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Services */}
      <div className="report-section">
        <h2>⭐ Top Services by Revenue</h2>
        <div className="services-list">
          {stats.topServices.map((service, index) => (
            <div key={index} className="service-item">
              <div className="service-rank">#{index + 1}</div>
              <div className="service-info">
                <h4>{service.name}</h4>
                <p>{service.count} bookings</p>
              </div>
              <div className="service-revenue">{formatCurrency(service.revenue)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Marketing Source Analytics */}
      <div className="report-section">
        <h2>📊 How Clients Found Us</h2>
        <p className="section-subtitle" style={{ marginBottom: '20px', color: '#666' }}>
          Track which marketing channels bring in the most valuable clients
        </p>
        <div className="referral-sources-grid">
          {Object.entries(stats.referralSources || {})
            .sort((a, b) => b[1].count - a[1].count)
            .map(([source, data]) => {
              const sourceLabels = {
                'social-media': { icon: '📱', label: 'Social Media', color: '#E1306C' },
                'friend': { icon: '👥', label: 'Friend Referral', color: '#10B981' },
                'google': { icon: '🔍', label: 'Google Search', color: '#4285F4' },
                'walk-by': { icon: '🚶', label: 'Walk-by', color: '#F59E0B' },
                'advertisement': { icon: '📺', label: 'Advertisement', color: '#8B5CF6' },
                'other': { icon: '📋', label: 'Other', color: '#6B7280' },
                'not-specified': { icon: '❓', label: 'Not Specified', color: '#9CA3AF' }
              };
              
              const sourceInfo = sourceLabels[source] || sourceLabels['other'];
              const avgSpend = data.count > 0 ? data.totalSpent / data.count : 0;
              const avgVisits = data.count > 0 ? data.totalVisits / data.count : 0;
              
              return (
                <div key={source} className="referral-source-card" style={{ borderLeft: `4px solid ${sourceInfo.color}` }}>
                  <div className="source-header">
                    <span className="source-icon" style={{ fontSize: '32px' }}>{sourceInfo.icon}</span>
                    <div className="source-info">
                      <h4>{sourceInfo.label}</h4>
                      <p className="source-count">{data.count} clients</p>
                    </div>
                  </div>
                  <div className="source-stats">
                    <div className="stat-item">
                      <span className="stat-label">Total Revenue</span>
                      <span className="stat-value">{formatCurrency(data.totalSpent)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg per Client</span>
                      <span className="stat-value">{formatCurrency(avgSpend)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Avg Visits</span>
                      <span className="stat-value">{avgVisits.toFixed(1)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">% of Total</span>
                      <span className="stat-value">
                        {((data.count / stats.totalClients) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        {Object.keys(stats.referralSources || {}).length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <p>No referral source data yet. Start collecting this info when adding new clients!</p>
          </div>
        )}
      </div>

      {/* Communication Preferences Overview */}
      <div className="report-section">
        <h2>📱 Communication Preferences</h2>
        <p className="section-subtitle" style={{ marginBottom: '20px', color: '#666' }}>
          Understand how clients prefer to be contacted and respect their preferences
        </p>
        <div className="communication-overview">
          <div className="comm-stats-grid">
            <div className="comm-stat-card">
              <div className="comm-icon">📱</div>
              <h4>SMS Consent</h4>
              <p className="comm-count">
                {allClients.filter(c => c.marketingConsent?.sms).length} / {stats.totalClients}
              </p>
              <span className="comm-percentage">
                {stats.totalClients > 0 
                  ? ((allClients.filter(c => c.marketingConsent?.sms).length / stats.totalClients) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            
            <div className="comm-stat-card">
              <div className="comm-icon">💬</div>
              <h4>WhatsApp Consent</h4>
              <p className="comm-count">
                {allClients.filter(c => c.marketingConsent?.whatsapp).length} / {stats.totalClients}
              </p>
              <span className="comm-percentage">
                {stats.totalClients > 0 
                  ? ((allClients.filter(c => c.marketingConsent?.whatsapp).length / stats.totalClients) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            
            <div className="comm-stat-card">
              <div className="comm-icon">📧</div>
              <h4>Email Consent</h4>
              <p className="comm-count">
                {allClients.filter(c => c.marketingConsent?.email).length} / {stats.totalClients}
              </p>
              <span className="comm-percentage">
                {stats.totalClients > 0 
                  ? ((allClients.filter(c => c.marketingConsent?.email).length / stats.totalClients) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            
            <div className="comm-stat-card warning">
              <div className="comm-icon">🚫</div>
              <h4>Do Not Disturb</h4>
              <p className="comm-count">
                {allClients.filter(c => c.communicationStatus?.doNotDisturb).length}
              </p>
              <span className="comm-percentage">
                {stats.totalClients > 0 
                  ? ((allClients.filter(c => c.communicationStatus?.doNotDisturb).length / stats.totalClients) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            
            <div className="comm-stat-card danger">
              <div className="comm-icon">⛔</div>
              <h4>Blocked</h4>
              <p className="comm-count">
                {allClients.filter(c => c.communicationStatus?.blocked).length}
              </p>
              <span className="comm-percentage">
                {stats.totalClients > 0 
                  ? ((allClients.filter(c => c.communicationStatus?.blocked).length / stats.totalClients) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            
            <div className="comm-stat-card info">
              <div className="comm-icon">⚠️</div>
              <h4>Warnings Issued</h4>
              <p className="comm-count">
                {allClients.filter(c => (c.communicationStatus?.warningCount || 0) > 0).length}
              </p>
              <span className="comm-percentage">
                {allClients.reduce((sum, c) => sum + (c.communicationStatus?.warningCount || 0), 0)} total
              </span>
            </div>
          </div>
          
          <div className="comm-insights" style={{ marginTop: '20px', padding: '20px', background: '#F3F4F6', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💡</span>
              <span>Communication Insights</span>
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#666' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Preferred Channel:</strong> {
                  (() => {
                    const sms = allClients.filter(c => c.marketingConsent?.sms).length;
                    const whatsapp = allClients.filter(c => c.marketingConsent?.whatsapp).length;
                    const email = allClients.filter(c => c.marketingConsent?.email).length;
                    const max = Math.max(sms, whatsapp, email);
                    if (max === 0) return 'No data yet';
                    if (whatsapp === max) return `WhatsApp (${whatsapp} clients)`;
                    if (sms === max) return `SMS (${sms} clients)`;
                    return `Email (${email} clients)`;
                  })()
                }
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Reachable Clients:</strong> {
                  allClients.filter(c => 
                    (c.marketingConsent?.sms || c.marketingConsent?.whatsapp || c.marketingConsent?.email) &&
                    !c.communicationStatus?.blocked &&
                    !c.communicationStatus?.doNotDisturb
                  ).length
                } clients can receive marketing messages
              </li>
              <li>
                <strong>Action Required:</strong> {
                  (() => {
                    const dnd = allClients.filter(c => c.communicationStatus?.doNotDisturb).length;
                    const blocked = allClients.filter(c => c.communicationStatus?.blocked).length;
                    if (dnd > 0 || blocked > 0) {
                      return `Review ${dnd + blocked} clients with communication restrictions`;
                    }
                    return 'All clients have clear communication preferences ✓';
                  })()
                }
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Client Categories */}
      <div className="report-section">
        <h2>👥 Client Distribution</h2>
        <div className="categories-grid">
          {Object.entries(stats.clientCategories).map(([category, count]) => (
            <div 
              key={category} 
              className="category-card"
              onClick={() => {
                const categoryClients = allClients.filter(c => c.category === category);
                setCategoryModal({ show: true, category, clients: categoryClients });
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className="category-icon">
                {category === 'new' && '✨'}
                {category === 'vip' && '⭐'}
                {category === 'usual' && '👤'}
                {category === 'longtime-no-see' && '💤'}
              </div>
              <h4>{category}</h4>
              <p className="category-count">{count}</p>
              <span className="category-percentage">
                {((count / stats.totalClients) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RFM Result Modal */}
      {showRfmResult && (
        <div className="modal-overlay" onClick={() => setShowRfmResult(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✅ RFM Calculation Complete</h3>
              <button onClick={() => setShowRfmResult(false)}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🎉</div>
              <h2 style={{ marginBottom: '10px' }}>Success!</h2>
              <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
                RFM scores calculated for <strong>{rfmResultCount} clients</strong>
              </p>
              <p style={{ color: '#666', marginBottom: '30px' }}>
                Your clients have been analyzed and categorized into segments.
                Click on any segment to view clients and create targeted campaigns.
              </p>
              <button 
                className="primary-btn"
                onClick={() => setShowRfmResult(false)}
                style={{ padding: '12px 30px' }}
              >
                View Segments
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segment Clients Modal */}
      {selectedSegment && (
        <div className="modal-overlay" onClick={() => setSelectedSegment(null)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedSegment.toUpperCase()} Clients ({segmentClients.length})</h3>
              <button onClick={() => setSelectedSegment(null)}>×</button>
            </div>
            <div className="modal-body">
              {segmentClients.length === 0 ? (
                <p>No clients in this segment</p>
              ) : (
                <>
                  <div className="modal-actions">
                    <button 
                      className="primary-btn"
                      onClick={() => createCampaignForSegment(selectedSegment)}
                    >
                      📢 Create Campaign for This Segment
                    </button>
                  </div>
                  <table className="clients-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Phone</th>
                        <th>Total Spent</th>
                        <th>Visits</th>
                        <th>Last Visit</th>
                        <th>RFM Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segmentClients.map(client => (
                        <tr key={client._id}>
                          <td>{client.firstName} {client.lastName}</td>
                          <td>{client.phone}</td>
                          <td>{formatCurrency(client.totalSpent || 0)}</td>
                          <td>{client.totalVisits || 0}</td>
                          <td>
                            {client.lastVisit 
                              ? new Date(client.lastVisit).toLocaleDateString()
                              : 'Never'
                            }
                          </td>
                          <td>
                            <span className="rfm-badge">
                              R:{client.rfmScores?.recency || 0} 
                              F:{client.rfmScores?.frequency || 0} 
                              M:{client.rfmScores?.monetary || 0}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Category Clients Modal */}
      {categoryModal.show && (
        <div className="modal-overlay" onClick={() => setCategoryModal({ show: false, category: '', clients: [] })}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>
                {categoryModal.category === 'new' && '✨ New Clients'}
                {categoryModal.category === 'vip' && '⭐ VIP Clients'}
                {categoryModal.category === 'usual' && '👤 Usual Clients'}
                {categoryModal.category === 'longtime-no-see' && '💤 Long Time No See'}
              </h3>
              <button onClick={() => setCategoryModal({ show: false, category: '', clients: [] })}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <p style={{ marginBottom: '15px', color: '#666' }}>
                {categoryModal.clients.length} client{categoryModal.clients.length !== 1 ? 's' : ''} in this category
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categoryModal.clients.map(client => (
                  <div 
                    key={client._id} 
                    style={{ 
                      padding: '12px', 
                      background: '#f9fafb', 
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {client.firstName} {client.lastName}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {client.phone}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '13px' }}>
                      <div style={{ color: '#10b981', fontWeight: '500' }}>
                        {client.totalVisits || 0} visits
                      </div>
                      <div style={{ color: '#666' }}>
                        Ksh {client.totalSpent || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
