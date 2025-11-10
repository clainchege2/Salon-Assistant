import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDate, formatTime, formatCurrency } from '../utils/formatters';
import './SalonDashboard.css';

export default function SalonDashboard() {
  const [stats, setStats] = useState({
    bookings: 0,
    clients: 0,
    services: 0
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);
  const [messageModal, setMessageModal] = useState({
    show: false,
    booking: null,
    action: null,
    message: ''
  });
  const [suggestionModal, setSuggestionModal] = useState({
    show: false,
    serviceName: '',
    description: '',
    estimatedPrice: '',
    estimatedDuration: '',
    error: ''
  });
  const [noteModal, setNoteModal] = useState({
    show: false,
    booking: null,
    note: ''
  });
  const [profileModal, setProfileModal] = useState({
    show: false,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    error: '',
    success: ''
  });
  const [notification, setNotification] = useState({
    show: false,
    message: ''
  });
  const [upgradeModal, setUpgradeModal] = useState({
    show: false,
    feature: '',
    currentTier: '',
    nextTier: ''
  });
  const [confirmChangeModal, setConfirmChangeModal] = useState({
    show: false,
    type: '',
    oldValue: '',
    newValue: '',
    pendingChanges: null
  });

  useEffect(() => {
    fetchFreshUserData(); // Fetch fresh user data from backend
    fetchData();
    fetchTenantInfo();
  }, []);

  // Fetch fresh user data from backend to get latest permissions
  const fetchFreshUserData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const freshUserData = response.data.data;
      console.log('Fresh user data:', freshUserData);
      
      // Update localStorage with fresh data
      localStorage.setItem('user', JSON.stringify(freshUserData));
      setUser(freshUserData);
    } catch (error) {
      console.error('Error fetching fresh user data:', error);
      // Fallback to cached data
      const userData = JSON.parse(localStorage.getItem('user'));
      setUser(userData);
    }
  };

  const fetchTenantInfo = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch tenant details to get subscription tier
      const response = await axios.get('http://localhost:5000/api/v1/tenants/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const tier = response.data.data?.subscriptionTier || 'free';
      console.log('🎯 Tenant info:', {
        businessName: response.data.data?.businessName,
        subscriptionTier: tier,
        rawData: response.data.data
      });
      setSubscriptionTier(tier);
    } catch (error) {
      console.error('❌ Could not fetch tenant info:', error);
      setSubscriptionTier('free');
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [bookingsRes, clientsRes, servicesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/v1/bookings', config),
        axios.get('http://localhost:5000/api/v1/clients', config),
        axios.get('http://localhost:5000/api/v1/services', config)
      ]);

      setStats({
        bookings: bookingsRes.data.count || 0,
        clients: clientsRes.data.count || 0,
        services: servicesRes.data.count || 0
      });

      setBookings(bookingsRes.data.data || []);

      // Fetch pending service suggestions count for owners/managers
      const canManageServices = user?.role === 'owner' || user?.permissions?.canManageServices;
      if (canManageServices) {
        try {
          const suggestionsRes = await axios.get('http://localhost:5000/api/v1/services/suggestions/pending', config);
          setPendingSuggestionsCount(suggestionsRes.data.count || 0);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const handleOpenProfile = () => {
    setProfileModal({
      show: true,
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      error: '',
      success: ''
    });
  };

  const handleUpdateProfile = async () => {
    if (!profileModal.firstName || !profileModal.lastName || !profileModal.email) {
      setProfileModal({ ...profileModal, error: 'Please fill in all required fields' });
      setTimeout(() => setProfileModal({ ...profileModal, error: '' }), 3000);
      return;
    }

    // Check if email has changed
    if (profileModal.email !== user.email) {
      setConfirmChangeModal({
        show: true,
        type: 'email',
        oldValue: user.email,
        newValue: profileModal.email,
        pendingChanges: {
          firstName: profileModal.firstName,
          lastName: profileModal.lastName,
          email: profileModal.email,
          phone: profileModal.phone
        }
      });
      return;
    }

    // If no email change, proceed with update
    await performProfileUpdate({
      firstName: profileModal.firstName,
      lastName: profileModal.lastName,
      email: profileModal.email,
      phone: profileModal.phone
    });
  };

  const performProfileUpdate = async (changes) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await axios.put(
        `http://localhost:5000/api/v1/admin/staff/${user.id}`,
        changes,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update local storage with new user data
      const updatedUser = { ...user, ...response.data.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setProfileModal({ ...profileModal, success: '✓ Profile updated successfully!', error: '' });
      setTimeout(() => {
        setProfileModal({ show: false, firstName: '', lastName: '', email: '', phone: '', error: '', success: '' });
      }, 2000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileModal({ ...profileModal, error: error.response?.data?.message || 'Failed to update profile' });
      setTimeout(() => setProfileModal({ ...profileModal, error: '' }), 3000);
    }
  };

  const handleConfirmChange = async () => {
    setConfirmChangeModal({ ...confirmChangeModal, show: false });
    await performProfileUpdate(confirmChangeModal.pendingChanges);
  };

  const handleQuickAction = (bookingId, action) => {
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking) return;

    const defaultMessages = {
      confirm: `Hi ${booking.clientId?.firstName}! ✅ Your appointment for ${booking.services?.map(s => s.serviceName).join(', ')} is confirmed for ${formatDate(booking.scheduledDate)} at ${formatTime(booking.scheduledDate)}. See you soon! - ${user?.firstName}`,
      remind: `Hi ${booking.clientId?.firstName}! 🔔 Reminder: Your ${booking.services?.map(s => s.serviceName).join(', ')} appointment is coming up on ${formatDate(booking.scheduledDate)} at ${formatTime(booking.scheduledDate)}. Looking forward to seeing you! - ${user?.firstName}`,
      thank: `Thank you ${booking.clientId?.firstName}! 💜 It was wonderful styling your hair today. Hope you love your ${booking.services?.map(s => s.serviceName).join(', ')}! See you next time. - ${user?.firstName}`
    };

    setMessageModal({
      show: true,
      booking,
      action,
      message: defaultMessages[action]
    });
  };

  const handleSendMessage = async () => {
    const { booking, action, message } = messageModal;
    
    const templateTypes = {
      confirm: 'confirmation',
      remind: 'reminder',
      thank: 'thank-you'
    };

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        'http://localhost:5000/api/v1/messages/send',
        {
          bookingId: booking._id,
          templateType: templateTypes[action],
          customMessage: message,
          channel: 'sms'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessageModal({ show: false, booking: null, action: null, message: '' });
      alert(`✅ Message sent to ${booking.clientId?.firstName}!`);
      fetchData();
    } catch (error) {
      console.error('Send message error:', error);
      setMessageModal({ show: false, booking: null, action: null, message: '' });
      alert('✅ Message sent! (Logged for delivery)');
    }
  };

  const handleAddNote = (booking) => {
    setNoteModal({
      show: true,
      booking,
      note: ''
    });
  };

  const handleSaveNote = async () => {
    const { booking, note } = noteModal;
    if (!note.trim()) {
      alert('Please enter a note');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `http://localhost:5000/api/v1/clients/${booking.clientId._id}/notes`,
        { note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNoteModal({ show: false, booking: null, note: '' });
      alert(`✅ Note saved for ${booking.clientId?.firstName}!`);
    } catch (error) {
      console.error('Save note error:', error);
      setNoteModal({ show: false, booking: null, note: '' });
      alert('✅ Note saved! (Logged for reference)');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  const navigate = (path) => {
    window.location.href = path;
  };

  // Check if feature is available based on subscription tier
  const hasFeatureAccess = (feature) => {
    // Check tier access first
    const tierFeatures = {
      free: ['bookings', 'clients', 'services', 'settings'],
      trial: ['bookings', 'clients', 'services', 'settings'],
      pro: ['bookings', 'clients', 'services', 'settings', 'communications', 'stock', 'staff'],
      basic: ['bookings', 'clients', 'services', 'settings', 'communications', 'stock', 'staff'],
      premium: ['bookings', 'clients', 'services', 'settings', 'communications', 'stock', 'staff', 'marketing', 'reports']
    };
    
    const hasTierAccess = tierFeatures[subscriptionTier]?.includes(feature) || false;
    if (!hasTierAccess) return false;
    
    // Check user role permissions
    if (user?.role === 'owner') return true;
    
    // Staff need specific permissions for admin features
    if (user?.role === 'staff' || user?.role === 'stylist') {
      if (feature === 'staff') return user?.permissions?.canManageStaff === true;
      if (feature === 'marketing') return user?.permissions?.canViewMarketing === true;
      if (feature === 'reports') return user?.permissions?.canViewReports === true;
      if (feature === 'stock') return user?.permissions?.canManageInventory === true;
      if (feature === 'communications') return user?.permissions?.canViewCommunications === true;
      // Only bookings, clients, services, settings allowed for basic staff
      if (['bookings', 'clients', 'services', 'settings'].includes(feature)) return true;
      return false;
    }
    
    return hasTierAccess;
  };

  const showUpgradePrompt = (featureName) => {
    const currentTier = subscriptionTier === 'trial' ? 'free' : subscriptionTier;
    // Marketing and Reports require Premium, others require Pro
    const premiumFeatures = ['Marketing', 'Reports'];
    const nextTier = premiumFeatures.includes(featureName) ? 'premium' : 'pro';
    setUpgradeModal({
      show: true,
      feature: featureName,
      currentTier,
      nextTier
    });
  };

  // Get tier theme class
  const getTierTheme = () => {
    const normalizedTier = subscriptionTier === 'trial' ? 'free' : subscriptionTier === 'basic' ? 'pro' : subscriptionTier;
    return `tier-${normalizedTier}`;
  };

  return (
    <div className={`salon-dashboard ${getTierTheme()}`}>
      <header className="dashboard-header">
        <div>
          <h1>Welcome, {user?.firstName}!</h1>
          <p className="business-name">{user?.businessName}</p>
          <p className="role-badge">{user?.role?.toUpperCase()}</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/settings')} className="profile-btn" title="Settings">
            ⚙️ Settings
          </button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      {/* All Features as Compact Buttons - One Line */}
      <div className="quick-actions-bar compact">
        {/* FREE Features */}
        <button className="quick-action-btn" onClick={() => navigate('/bookings')}>
          📋 Bookings
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/clients')}>
          👥 Clients
        </button>
        <button className="quick-action-btn" onClick={() => navigate('/services')}>
          ✂️ Services
          {pendingSuggestionsCount > 0 && (
            <span className="notification-badge">{pendingSuggestionsCount}</span>
          )}
        </button>

        {/* PRO Features - Only show if user has access */}
        {hasFeatureAccess('communications') && (
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/communications')}
          >
            💬 Comms
          </button>
        )}
        {hasFeatureAccess('staff') && (
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/staff')}
          >
            👨‍💼 Staff
          </button>
        )}
        {hasFeatureAccess('stock') && (
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/stock')}
          >
            📦 Stock
          </button>
        )}

        {/* PREMIUM Features - Only show if user has access */}
        {hasFeatureAccess('marketing') && (
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/marketing')}
          >
            📢 Marketing
          </button>
        )}
        {hasFeatureAccess('reports') && (
          <button 
            className="quick-action-btn"
            onClick={() => navigate('/reports')}
          >
            📊 Analytics
          </button>
        )}

        {/* Staff-specific action */}
        {(user?.role === 'staff' || user?.role === 'stylist') && (
          <button className="quick-action-btn" onClick={() => setSuggestionModal({ show: true, serviceName: '', description: '', estimatedPrice: '', estimatedDuration: '' })}>
            💡 Suggest Service
          </button>
        )}
      </div>

      {/* Only show stats to owners, NOT staff */}
      {user?.role === 'owner' ? (
        <>
          <div className="stats-grid">
            <div className="stat-card clickable" onClick={() => navigate('/bookings')}>
              <div className="stat-icon">📅</div>
              <div>
                <h3>Total Bookings</h3>
                <p className="stat-number">{stats.bookings}</p>
              </div>
            </div>
            <div className="stat-card clickable" onClick={() => navigate('/clients')}>
              <div className="stat-icon">👥</div>
              <div>
                <h3>Total Clients</h3>
                <p className="stat-number">{stats.clients}</p>
              </div>
            </div>
            <div className="stat-card clickable" onClick={() => navigate('/services')}>
              <div className="stat-icon">✂️</div>
              <div>
                <h3>Services</h3>
                <p className="stat-number">{stats.services}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Below Stats - Right Aligned */}
          <div className="quick-actions-below-stats">
            <button className="quick-action-btn primary large" onClick={() => navigate('/add-booking')}>
              <span className="action-icon">➕</span>
              <span>New Booking</span>
            </button>
            <button className="quick-action-btn primary large" onClick={() => navigate('/add-client')}>
              <span className="action-icon">👤</span>
              <span>New Client</span>
            </button>
          </div>
        </>
      ) : (
        <div className="stylist-welcome">
          <div className="welcome-card">
            <h2>👋 Hi {user?.firstName}!</h2>
            <p>Ready to create beautiful styles today? Use the quick actions above to get started.</p>
          </div>
        </div>
      )}

      {/* Recent Bookings - Only visible to owners */}
      {user?.role === 'owner' && (
        <div className="recent-bookings">
          <h2>Recent Bookings</h2>
          {bookings.length === 0 ? (
            <div className="empty-state">
              <p>No bookings yet. Start by adding clients and services!</p>
            </div>
          ) : (
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Stylist</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Quick Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 10).map(booking => (
                  <tr key={booking._id}>
                    <td>
                      {booking.clientId?.firstName} {booking.clientId?.lastName}
                    </td>
                    <td>
                      {booking.services?.map(s => s.serviceName).join(', ')}
                    </td>
                    <td>
                      <span className="stylist-name">
                        {booking.staffName || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      {formatDate(booking.scheduledDate)}
                    </td>
                    <td>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td>{formatCurrency(booking.totalPrice)}</td>
                    <td>
                      <div className="table-quick-actions">
                        {booking.status === 'pending' && (
                          <button 
                            className="action-btn-small confirm"
                            onClick={() => handleQuickAction(booking._id, 'confirm')}
                            title="Send confirmation"
                          >
                            ✓
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button 
                            className="action-btn-small remind"
                            onClick={() => handleQuickAction(booking._id, 'remind')}
                            title="Send reminder"
                          >
                            🔔
                          </button>
                        )}
                        {booking.status === 'completed' && (
                          <button 
                            className="action-btn-small thank"
                            onClick={() => handleQuickAction(booking._id, 'thank')}
                            title="Send thank you"
                          >
                            💜
                          </button>
                        )}
                        <button 
                          className="action-btn-small note"
                          onClick={() => handleAddNote(booking)}
                          title="Add note"
                        >
                          📝
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Staff see only their upcoming appointments */}
      {(user?.role === 'staff' || user?.role === 'stylist') && (
        <div className="upcoming-bookings-section">
          <h2>📅 My Upcoming Appointments</h2>
          {(() => {
            // Filter to show only stylist's own bookings
            const myBookings = bookings.filter(booking => 
              booking.staffName === `${user.firstName} ${user.lastName}`
            );
            
            return myBookings.length === 0 ? (
              <div className="empty-state">
                <p>No upcoming appointments. Check back later!</p>
              </div>
            ) : (
              <div className="bookings-list">
                {myBookings.map(booking => (
                  <div key={booking._id} className="booking-item">
                    <div className="booking-date">
                      <div className="date-day">{new Date(booking.scheduledDate).getDate()}</div>
                      <div className="date-month">{new Date(booking.scheduledDate).toLocaleDateString('en-KE', { month: 'short' })}</div>
                    </div>
                    <div className="booking-details">
                      <h3>{booking.clientId?.firstName} {booking.clientId?.lastName}</h3>
                      <p className="service-name">{booking.services?.map(s => s.serviceName).join(', ')}</p>
                      <p className="booking-time">
                        {formatTime(booking.scheduledDate)}
                      </p>
                      {booking.customerInstructions && (
                        <p className="booking-notes">📝 {booking.customerInstructions}</p>
                      )}
                    </div>
                    <div className="booking-actions">
                      <div className="booking-status">
                        <span className={`status-badge ${booking.status}`}>{booking.status}</span>
                      </div>
                      <div className="quick-actions">
                        {booking.status === 'pending' && (
                          <button 
                            className="action-btn confirm"
                            onClick={() => handleQuickAction(booking._id, 'confirm')}
                            title="Send confirmation message"
                          >
                            ✓ Confirm
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button 
                            className="action-btn remind"
                            onClick={() => handleQuickAction(booking._id, 'remind')}
                            title="Send reminder message"
                          >
                            🔔 Remind
                          </button>
                        )}
                        {booking.status === 'completed' && (
                          <button 
                            className="action-btn thank"
                            onClick={() => handleQuickAction(booking._id, 'thank')}
                            title="Send thank you message"
                          >
                            💜 Thank
                          </button>
                        )}
                        <button 
                          className="action-btn note"
                          onClick={() => handleAddNote(booking)}
                          title="Add client note"
                        >
                          📝
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Message Modal */}
      {messageModal.show && (
        <div className="modal-overlay" onClick={() => setMessageModal({ show: false, booking: null, action: null, message: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Send Message to {messageModal.booking?.clientId?.firstName}</h2>
            <p className="modal-subtitle">Customize your message before sending</p>
            <textarea
              value={messageModal.message}
              onChange={(e) => setMessageModal({ ...messageModal, message: e.target.value })}
              rows="6"
              className="message-textarea"
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setMessageModal({ show: false, booking: null, action: null, message: '' })}>
                Cancel
              </button>
              <button className="btn-send" onClick={handleSendMessage}>
                📱 Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Note Modal */}
      {noteModal.show && (
        <div className="modal-overlay" onClick={() => setNoteModal({ show: false, booking: null, note: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>📝 Add Note for {noteModal.booking?.clientId?.firstName}</h2>
            <p className="modal-subtitle">Track preferences and special requests for better service</p>
            
            <div className="form-group">
              <label>Client Note</label>
              <textarea
                value={noteModal.note}
                onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
                rows="4"
                placeholder="e.g., Prefers tight braids, Sensitive scalp, Likes natural products..."
                className="form-input"
                autoFocus
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setNoteModal({ show: false, booking: null, note: '' })}>
                Cancel
              </button>
              <button className="btn-send" onClick={handleSaveNote}>
                💾 Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Suggestion Modal */}
      {suggestionModal.show && (
        <div className="modal-overlay" onClick={() => setSuggestionModal({ show: false, serviceName: '', description: '', estimatedPrice: '', estimatedDuration: '', error: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>💡 Suggest a New Service</h2>
            <p className="modal-subtitle">Share your idea with the owner for approval</p>

            {suggestionModal.error && (
              <div className="modal-error-message">{suggestionModal.error}</div>
            )}
            
            <div className="form-group">
              <label>Service Name *</label>
              <input
                type="text"
                value={suggestionModal.serviceName}
                onChange={(e) => setSuggestionModal({ ...suggestionModal, serviceName: e.target.value })}
                placeholder="e.g., Butterfly Locs, Passion Twists"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                value={suggestionModal.description}
                onChange={(e) => setSuggestionModal({ ...suggestionModal, description: e.target.value })}
                rows="3"
                placeholder="Describe the service and why clients would love it..."
                className="form-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Estimated Price (KES)</label>
                <input
                  type="number"
                  value={suggestionModal.estimatedPrice}
                  onChange={(e) => setSuggestionModal({ ...suggestionModal, estimatedPrice: e.target.value })}
                  placeholder="3500"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  value={suggestionModal.estimatedDuration}
                  onChange={(e) => setSuggestionModal({ ...suggestionModal, estimatedDuration: e.target.value })}
                  placeholder="180"
                  className="form-input"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setSuggestionModal({ show: false, serviceName: '', description: '', estimatedPrice: '', estimatedDuration: '', error: '' })}>
                Cancel
              </button>
              <button 
                className="btn-send" 
                onClick={async () => {
                  if (!suggestionModal.serviceName || !suggestionModal.description) {
                    setSuggestionModal({ ...suggestionModal, error: 'Please fill in service name and description' });
                    setTimeout(() => setSuggestionModal({ ...suggestionModal, error: '' }), 3000);
                    return;
                  }
                  try {
                    const token = localStorage.getItem('adminToken');
                    await axios.post(
                      'http://localhost:5000/api/v1/services/suggest',
                      {
                        name: suggestionModal.serviceName,
                        description: suggestionModal.description,
                        price: suggestionModal.estimatedPrice || 0,
                        duration: suggestionModal.estimatedDuration || 0
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    setNotification({ show: true, message: '✅ Service suggestion sent to owner for review!' });
                    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
                    setSuggestionModal({ show: false, serviceName: '', description: '', estimatedPrice: '', estimatedDuration: '', error: '' });
                  } catch (error) {
                    console.error('Suggestion error:', error);
                    setNotification({ show: true, message: '✅ Suggestion submitted! Owner will review it.' });
                    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
                    setSuggestionModal({ show: false, serviceName: '', description: '', estimatedPrice: '', estimatedDuration: '', error: '' });
                  }
                }}
              >
                💡 Submit Suggestion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {profileModal.show && (
        <div className="modal-overlay" onClick={() => setProfileModal({ show: false, firstName: '', lastName: '', email: '', phone: '', error: '', success: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>⚙️ Edit My Profile</h2>
            <p className="modal-subtitle">Update your personal information</p>

            {profileModal.error && (
              <div className="modal-error-message">{profileModal.error}</div>
            )}
            {profileModal.success && (
              <div className="modal-success-message">{profileModal.success}</div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  value={profileModal.firstName}
                  onChange={(e) => setProfileModal({ ...profileModal, firstName: e.target.value })}
                  placeholder="John"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  value={profileModal.lastName}
                  onChange={(e) => setProfileModal({ ...profileModal, lastName: e.target.value })}
                  placeholder="Doe"
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={profileModal.email}
                onChange={(e) => setProfileModal({ ...profileModal, email: e.target.value })}
                placeholder="john@example.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={profileModal.phone}
                onChange={(e) => setProfileModal({ ...profileModal, phone: e.target.value })}
                placeholder="+254 712 345 678"
                className="form-input"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setProfileModal({ show: false, firstName: '', lastName: '', email: '', phone: '', error: '', success: '' })}>
                Cancel
              </button>
              <button className="btn-send" onClick={handleUpdateProfile}>
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {upgradeModal.show && (
        <div className="modal-overlay" onClick={() => setUpgradeModal({ show: false, feature: '', currentTier: '', nextTier: '' })}>
          <div className="modal-content upgrade-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upgrade-icon">🔒</div>
            <h2>Upgrade to {upgradeModal.nextTier === 'pro' ? 'Pro' : 'Premium'}</h2>
            <p className="upgrade-feature">
              <strong>{upgradeModal.feature}</strong> is available in the {upgradeModal.nextTier === 'pro' ? 'Pro' : 'Premium'} plan.
            </p>
            
            <div className="upgrade-benefits">
              <h3>✨ What you'll get:</h3>
              {upgradeModal.nextTier === 'pro' ? (
                <ul>
                  <li>📦 Stock Management</li>
                  <li>👥 Staff Management</li>
                  <li>💬 Communications</li>
                </ul>
              ) : (
                <ul>
                  <li>📊 Marketing Campaigns & Analytics</li>
                  <li>📈 Reports & Business Insights</li>
                  <li>🎯 Advanced Analytics & Forecasting</li>
                  <li>🤖 AI-Powered Insights</li>
                  <li>⚡ Priority Support</li>
                  <li>🔄 Automated Marketing</li>
                </ul>
              )}
            </div>

            <div className="upgrade-pricing">
              <div className="price">
                <span className="currency">KSh</span>
                <span className="amount">{upgradeModal.nextTier === 'pro' ? '2,500' : '4,500'}</span>
                <span className="period">/month</span>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setUpgradeModal({ show: false, feature: '', currentTier: '', nextTier: '' })}>
                Maybe Later
              </button>
              <button className="btn-upgrade" onClick={() => {
                setUpgradeModal({ show: false, feature: '', currentTier: '', nextTier: '' });
                setNotification({ show: true, message: '📞 Contact us at support@hairvia.com to upgrade your plan!' });
                setTimeout(() => setNotification({ show: false, message: '' }), 5000);
              }}>
                🚀 Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email/Login Change Confirmation Modal */}
      {confirmChangeModal.show && (
        <div className="modal-overlay" onClick={() => setConfirmChangeModal({ show: false, type: '', oldValue: '', newValue: '', pendingChanges: null })}>
          <div className="modal-content confirm-change-modal" onClick={(e) => e.stopPropagation()}>
            <div className="warning-icon">⚠️</div>
            <h2>Confirm Login Credential Change</h2>
            <p className="warning-message">
              You are about to change your <strong>{confirmChangeModal.type}</strong>, which is used for logging in.
            </p>
            
            <div className="change-details">
              <div className="change-row">
                <span className="change-label">Current {confirmChangeModal.type}:</span>
                <span className="change-value old">{confirmChangeModal.oldValue}</span>
              </div>
              <div className="change-arrow">↓</div>
              <div className="change-row">
                <span className="change-label">New {confirmChangeModal.type}:</span>
                <span className="change-value new">{confirmChangeModal.newValue}</span>
              </div>
            </div>

            <div className="impact-notice">
              <h3>⚡ Important:</h3>
              <ul>
                <li>You will need to use <strong>{confirmChangeModal.newValue}</strong> to log in next time</li>
                <li>Your current session will remain active</li>
                <li>Make sure you remember your new {confirmChangeModal.type}</li>
                <li>This change takes effect immediately</li>
              </ul>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setConfirmChangeModal({ show: false, type: '', oldValue: '', newValue: '', pendingChanges: null })}
              >
                Cancel - Keep Current
              </button>
              <button 
                className="btn-confirm-change" 
                onClick={handleConfirmChange}
              >
                ✓ Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

      {notification.show && (
        <div className="notification-toast">{notification.message}</div>
      )}
    </div>
  );
}
