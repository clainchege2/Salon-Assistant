import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

export default function Dashboard() {
  const [client, setClient] = useState(null);
  const [salon, setSalon] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [upcomingBookingsCount, setUpcomingBookingsCount] = useState(0);
  const [newCampaignsCount, setNewCampaignsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();

    // Refresh unread count when user navigates back to dashboard
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchUnreadCount();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Also refresh count when component mounts (user navigates back)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const clientData = JSON.parse(localStorage.getItem('clientData'));
      setClient(clientData);

      // Fetch salon information
      const salonResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client-auth/salons`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const clientSalon = salonResponse.data.data.find(s => s._id === clientData.tenantId);
      setSalon(clientSalon);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client/bookings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const upcoming = response.data.data.filter(b => 
        new Date(b.scheduledDate) > new Date() && 
        b.status !== 'cancelled' &&
        b.status !== 'completed' &&
        b.status !== 'no-show'
      );
      setUpcomingBookings(upcoming.slice(0, 3));
      setUpcomingBookingsCount(upcoming.length);

      // Fetch unread messages count
      const messagesResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const unreadCount = messagesResponse.data.data.filter(m => !m.readAt).length;
      setUnreadMessagesCount(unreadCount);

      // Fetch new campaigns count (only unviewed)
      const campaignsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client/campaigns`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const viewedCampaigns = JSON.parse(localStorage.getItem('viewedCampaigns') || '[]');
      const unviewedCampaigns = (campaignsResponse.data.data || []).filter(
        c => !viewedCampaigns.includes(c._id)
      );
      setNewCampaignsCount(unviewedCampaigns.length);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      
      // Fetch unread messages
      const messagesResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const unreadCount = messagesResponse.data.data.filter(m => !m.readAt).length;
      setUnreadMessagesCount(unreadCount);

      // Fetch new campaigns (only unviewed)
      const campaignsResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client/campaigns`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const viewedCampaigns = JSON.parse(localStorage.getItem('viewedCampaigns') || '[]');
      const unviewedCampaigns = (campaignsResponse.data.data || []).filter(
        c => !viewedCampaigns.includes(c._id)
      );
      setNewCampaignsCount(unviewedCampaigns.length);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientData');
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Hi, {client?.firstName}!</h1>
          <p>Welcome to your beauty dashboard</p>
          {salon && (
            <div className="salon-badge">
              <span className="salon-icon">🏢</span>
              <span className="salon-name">{salon.businessName}</span>
            </div>
          )}
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/profile')} className="btn-profile">
            👤 My Profile
          </button>
          <button onClick={handleLogout} className="btn-logout">
            🚪 Logout
          </button>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Quick Actions */}
        <div className="quick-actions">
          <button onClick={() => navigate('/book')} className="action-card primary">
            <span className="action-icon">📅</span>
            <span className="action-text">Book Appointment</span>
          </button>
          <button onClick={() => {
            setUpcomingBookingsCount(0);
            navigate('/bookings');
          }} className="action-card">
            <span className="action-icon-wrapper">
              <span className="action-icon">📋</span>
              {upcomingBookingsCount > 0 && (
                <span className="notification-badge">{upcomingBookingsCount}</span>
              )}
            </span>
            <span className="action-text">My Bookings</span>
          </button>
          <button onClick={() => {
            setUnreadMessagesCount(0); // Clear badge immediately
            setNewCampaignsCount(0); // Clear campaigns badge
            navigate('/messages');
          }} className="action-card">
            <span className="action-icon-wrapper">
              <span className="action-icon">📬</span>
              {(unreadMessagesCount + newCampaignsCount) > 0 && (
                <span className="notification-badge">{unreadMessagesCount + newCampaignsCount}</span>
              )}
            </span>
            <span className="action-text">Messages & Offers</span>
          </button>
          <button onClick={() => navigate('/feedback')} className="action-card">
            <span className="action-icon">💬</span>
            <span className="action-text">Share Feedback</span>
          </button>
        </div>

        {/* Upcoming Appointments */}
        <div className="card">
          <h2>📅 Upcoming Appointments</h2>
          {upcomingBookings.length === 0 ? (
            <div className="empty-state">
              <p>No upcoming appointments</p>
              <button onClick={() => navigate('/book')} className="btn btn-primary">
                Book Now
              </button>
            </div>
          ) : (
            <div className="bookings-list">
              {upcomingBookings.map(booking => (
                <div key={booking._id} className="booking-item">
                  <div className="booking-date">
                    <div className="date-day">
                      {new Date(booking.scheduledDate).getDate()}
                    </div>
                    <div className="date-month">
                      {new Date(booking.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  <div className="booking-details">
                    <h3>{booking.services?.map(s => s.serviceName).join(', ')}</h3>
                    <p className="booking-time">
                      {new Date(booking.scheduledDate).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {(booking.assignedTo || booking.stylistId) && (
                      <p className="booking-stylist">
                        with {booking.assignedTo 
                          ? `${booking.assignedTo.firstName} ${booking.assignedTo.lastName}`
                          : booking.stylistId 
                            ? `${booking.stylistId.firstName} ${booking.stylistId.lastName}`
                            : 'Staff Member'
                        }
                      </p>
                    )}
                  </div>
                  <div className="booking-status">
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
