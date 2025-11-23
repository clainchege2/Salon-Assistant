import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';
import './Settings.css';

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || location.state?.activeTab || 'profile');
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [businessData, setBusinessData] = useState({
    businessName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    operatingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true }
    },
    notifications: {
      email: true,
      sms: true,
      whatsapp: true,
      reminderTiming: 24
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmChangeModal, setConfirmChangeModal] = useState({
    show: false,
    type: '',
    oldValue: '',
    newValue: '',
    pendingChanges: null
  });
  const [accountModal, setAccountModal] = useState({
    show: false,
    action: '', // 'changeTier', 'cancel', 'delete'
    targetTier: '', // 'basic', 'pro', 'premium'
    confirmText: ''
  });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const userData = JSON.parse(localStorage.getItem('user'));
      setUser(userData);

      // Set profile data from localStorage first (immediate display)
      if (userData) {
        setProfileData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || ''
        });
      }

      // Then fetch fresh data from API
      try {
        const userResponse = await axios.get(
          'http://localhost:5000/api/v1/auth/me',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const userInfo = userResponse.data.data;
        setProfileData({
          firstName: userInfo.firstName || '',
          lastName: userInfo.lastName || '',
          email: userInfo.email || '',
          phone: userInfo.phone || ''
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Keep the localStorage data if API fails
      }

      // Fetch business settings
      try {
        const tenantResponse = await axios.get(
          'http://localhost:5000/api/v1/tenants/me',
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const tenant = tenantResponse.data.data;
        setTenant(tenant);
        setBusinessData({
          businessName: tenant.businessName || '',
          address: typeof tenant.address === 'string' ? tenant.address : (tenant.address?.street || ''),
          phone: tenant.phone || '',
          email: tenant.email || '',
          website: tenant.website || '',
          country: tenant.country || 'Kenya',
          currency: tenant.settings?.currency || 'KES',
          timezone: tenant.settings?.timezone || 'Africa/Nairobi',
          operatingHours: tenant.operatingHours || businessData.operatingHours,
          notifications: tenant.notifications || businessData.notifications
        });
      } catch (error) {
        console.error('Error fetching business settings:', error);
        showMessage('error', 'Failed to load business settings. Using defaults.');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    // Check if email has changed
    if (profileData.email !== user.email) {
      setConfirmChangeModal({
        show: true,
        type: 'email',
        oldValue: user.email,
        newValue: profileData.email,
        pendingChanges: profileData
      });
      return;
    }

    // If no email change, proceed with update
    await performProfileUpdate(profileData);
  };

  const performProfileUpdate = async (changes) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');

      await axios.put(
        `http://localhost:5000/api/v1/admin/staff/${user.id}`,
        changes,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local storage
      const updatedUser = { ...user, ...changes };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      showMessage('error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmChange = async () => {
    setConfirmChangeModal({ show: false, type: '', oldValue: '', newValue: '', pendingChanges: null });
    await performProfileUpdate(confirmChangeModal.pendingChanges);
  };

  const handleSaveBusiness = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');

      await axios.put(
        'http://localhost:5000/api/v1/tenants/me',
        businessData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Business settings saved successfully!');
    } catch (error) {
      console.error('Error saving business settings:', error);
      showMessage('error', 'Failed to save business settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type, text) => {
    setToast({ type, message: text });
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        'http://localhost:5000/api/v1/tenants/export-data',
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `hairvia-data-export-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showMessage('success', 'Data exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      showMessage('error', 'Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleChangeTier = async () => {
    const expectedText = `CHANGE TO ${accountModal.targetTier.toUpperCase()}`;
    if (accountModal.confirmText !== expectedText) {
      showMessage('error', `Please type "${expectedText}" to confirm`);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        'http://localhost:5000/api/v1/tenants/change-tier',
        { newTier: accountModal.targetTier },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const action = getTierLevel(accountModal.targetTier) > getTierLevel(tenant?.subscriptionTier) ? 'upgraded' : 'downgraded';
      showMessage('success', `Successfully ${action} to ${accountModal.targetTier} tier!`);
      setAccountModal({ show: false, action: '', targetTier: '', confirmText: '' });
      
      // Refresh data without page reload - stay on current tab
      await fetchData();
    } catch (error) {
      console.error('Change tier error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to change tier');
    }
  };

  const getTierLevel = (tier) => {
    const levels = { free: 1, pro: 2, premium: 3 };
    return levels[tier] || 0;
  };

  const handleCancelSubscription = async () => {
    if (accountModal.confirmText !== 'CANCEL SUBSCRIPTION') {
      showMessage('error', 'Please type CANCEL SUBSCRIPTION to confirm');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        'http://localhost:5000/api/v1/tenants/cancel-subscription',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Subscription cancelled. You can continue using until the end of your billing period.');
      setAccountModal({ show: false, action: '', confirmText: '' });
      setTimeout(() => fetchData(), 2000);
    } catch (error) {
      console.error('Cancel subscription error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const handleDeleteAccount = async () => {
    if (accountModal.confirmText !== 'DELETE MY ACCOUNT') {
      showMessage('error', 'Please type DELETE MY ACCOUNT to confirm');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        'http://localhost:5000/api/v1/tenants/delete-account',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showMessage('success', 'Account deleted successfully. Redirecting...');
      setAccountModal({ show: false, action: '', confirmText: '' });
      
      // Clear local storage and redirect to login
      setTimeout(() => {
        localStorage.clear();
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Delete account error:', error);
      showMessage('error', error.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleHoursChange = (day, field, value) => {
    setBusinessData({
      ...businessData,
      operatingHours: {
        ...businessData.operatingHours,
        [day]: {
          ...businessData.operatingHours[day],
          [field]: value
        }
      }
    });
  };

  if (loading) return <div className="loading">Loading settings...</div>;

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back to Dashboard
        </button>
        <div className="page-title-wrapper">
          <div className="title-with-icon">
            <span className="title-icon">⚙️</span>
            <div className="title-content">
              <h1>Settings</h1>
              <p className="page-tagline">Configure your salon preferences</p>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 My Profile
        </button>
        {user?.role === 'owner' && (
          <>
            <button
              className={`tab-btn ${activeTab === 'business' ? 'active' : ''}`}
              onClick={() => setActiveTab('business')}
            >
              🏢 Business Settings
            </button>
            <button
              className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              ⚙️ Account Management
            </button>
          </>
        )}
      </div>

      <div className="settings-container">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <>
            <div className="settings-section">
              <h2>👤 Personal Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+254 712 345 678"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="save-btn"
                >
                  {saving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Business Tab */}
        {activeTab === 'business' && user?.role === 'owner' && (
          <>
            {/* Business Information */}
            <div className="settings-section">
              <h2>🏢 Business Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Business Name *</label>
                  <input
                    type="text"
                    value={businessData.businessName}
                    onChange={(e) => setBusinessData({ ...businessData, businessName: e.target.value })}
                    placeholder="Elegant Styles Salon"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={businessData.phone}
                    onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                    placeholder="+254 712 345 678"
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={businessData.email}
                    onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                    placeholder="info@elegantstyles.com"
                  />
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={businessData.website}
                    onChange={(e) => setBusinessData({ ...businessData, website: e.target.value })}
                    placeholder="https://elegantstyles.com"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Business Address</label>
                  <textarea
                    value={businessData.address}
                    onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                    placeholder="123 Main Street, Nairobi, Kenya"
                    rows="3"
                  />
                </div>
              </div>
            </div>

            {/* Regional & Currency Settings */}
            <div className="settings-section">
              <h2>🌍 Regional & Currency Settings</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label>Country/Region *</label>
                  <select
                    value={businessData.country || 'Kenya'}
                    onChange={(e) => {
                      const country = e.target.value;
                      const currencyMap = {
                        'Kenya': 'KES',
                        'USA': 'USD',
                        'UK': 'GBP',
                        'Nigeria': 'NGN',
                        'South Africa': 'ZAR',
                        'Ghana': 'GHS'
                      };
                      setBusinessData({ 
                        ...businessData, 
                        country,
                        currency: currencyMap[country] || 'KES'
                      });
                    }}
                  >
                    <option value="Kenya">Kenya</option>
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="South Africa">South Africa</option>
                    <option value="Ghana">Ghana</option>
                  </select>
                  <small className="form-hint">This affects currency display and date/time formats</small>
                </div>

                <div className="form-group">
                  <label>Currency</label>
                  <select
                    value={businessData.currency || 'KES'}
                    onChange={(e) => setBusinessData({ ...businessData, currency: e.target.value })}
                  >
                    <option value="KES">KES - Kenyan Shilling (KSh)</option>
                    <option value="USD">USD - US Dollar ($)</option>
                    <option value="GBP">GBP - British Pound (£)</option>
                    <option value="NGN">NGN - Nigerian Naira (₦)</option>
                    <option value="ZAR">ZAR - South African Rand (R)</option>
                    <option value="GHS">GHS - Ghanaian Cedi (GH₵)</option>
                  </select>
                  <small className="form-hint">Currency used throughout the application</small>
                </div>

                <div className="form-group">
                  <label>Timezone</label>
                  <select
                    value={businessData.timezone || 'Africa/Nairobi'}
                    onChange={(e) => setBusinessData({ ...businessData, timezone: e.target.value })}
                  >
                    <option value="Africa/Nairobi">East Africa Time (EAT)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">Greenwich Mean Time (GMT)</option>
                    <option value="Africa/Lagos">West Africa Time (WAT)</option>
                    <option value="Africa/Johannesburg">South Africa Time (SAST)</option>
                  </select>
                  <small className="form-hint">Timezone for appointments and reports</small>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="settings-section">
              <h2>🕐 Operating Hours</h2>
              <div className="hours-grid">
                {Object.keys(businessData.operatingHours).map(day => (
                  <div key={day} className="hours-row">
                    <div className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</div>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={businessData.operatingHours[day].closed}
                        onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                      />
                      <span>Closed</span>
                    </label>
                    {!businessData.operatingHours[day].closed && (
                      <>
                        <input
                          type="time"
                          value={businessData.operatingHours[day].open}
                          onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                        />
                        <span className="time-separator">to</span>
                        <input
                          type="time"
                          value={businessData.operatingHours[day].close}
                          onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="settings-section">
              <h2>🔔 Notification Preferences</h2>
              <div className="notification-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={businessData.notifications.email}
                    onChange={(e) => setBusinessData({
                      ...businessData,
                      notifications: { ...businessData.notifications, email: e.target.checked }
                    })}
                  />
                  <span>Email Notifications</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={businessData.notifications.sms}
                    onChange={(e) => setBusinessData({
                      ...businessData,
                      notifications: { ...businessData.notifications, sms: e.target.checked }
                    })}
                  />
                  <span>SMS Notifications</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={businessData.notifications.whatsapp}
                    onChange={(e) => setBusinessData({
                      ...businessData,
                      notifications: { ...businessData.notifications, whatsapp: e.target.checked }
                    })}
                  />
                  <span>WhatsApp Notifications</span>
                </label>

                <div className="form-group">
                  <label>Reminder Timing (hours before appointment)</label>
                  <select
                    value={businessData.notifications.reminderTiming}
                    onChange={(e) => setBusinessData({
                      ...businessData,
                      notifications: { ...businessData.notifications, reminderTiming: parseInt(e.target.value) }
                    })}
                  >
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="4">4 hours</option>
                    <option value="12">12 hours</option>
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                onClick={handleSaveBusiness}
                disabled={saving}
                className="save-btn"
              >
                {saving ? 'Saving...' : 'Save Business Settings'}
              </button>
            </div>
          </>
        )}

        {/* Account Management Tab - Owner Only */}
        {activeTab === 'account' && user?.role === 'owner' && (
          <>
            {/* Subscription Info & Management */}
            <div className="settings-section">
              <h2>💳 Subscription & Billing</h2>
              {!tenant ? (
                <div className="loading-state">Loading subscription info...</div>
              ) : (
                <>
                  <div className="subscription-info">
                    <div className="info-row">
                      <span className="info-label">Current Plan:</span>
                      <span className={`tier-badge tier-${tenant.subscriptionTier || 'free'}`}>
                        {(tenant.subscriptionTier || 'free').toUpperCase()}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Status:</span>
                      <span className={`status-badge ${tenant.subscriptionStatus === 'active' ? 'active' : 'inactive'}`}>
                        {tenant.subscriptionStatus === 'active' ? 'Active' : tenant.subscriptionStatus || 'Active'}
                      </span>
                    </div>
                    {tenant.subscriptionEndDate && (
                      <div className="info-row">
                        <span className="info-label">Renewal Date:</span>
                        <span className="info-value">
                          {new Date(tenant.subscriptionEndDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tier Change Options */}
                  <div className="tier-options">
                    <h3>Change Your Plan</h3>
                    
                    {/* Premium Tier Options */}
                    {tenant.subscriptionTier === 'premium' && (
                      <div className="tier-change-grid">
                        <div className="action-card">
                          <div className="action-info">
                            <h4>Downgrade to Pro</h4>
                            <p>Keep staff, stock, and communications. Lose marketing campaigns, reports, and AI features.</p>
                          </div>
                          <button 
                            onClick={() => setAccountModal({ show: true, action: 'changeTier', targetTier: 'pro', confirmText: '' })}
                            className="action-btn warning-btn"
                          >
                            ⬇️ Downgrade to Pro
                          </button>
                        </div>
                        <div className="action-card">
                          <div className="action-info">
                            <h4>Downgrade to Free</h4>
                            <p>Keep only core features: bookings, clients, services. Lose all team and marketing features.</p>
                          </div>
                          <button 
                            onClick={() => setAccountModal({ show: true, action: 'changeTier', targetTier: 'free', confirmText: '' })}
                            className="action-btn warning-btn"
                          >
                            ⬇️ Downgrade to Free
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Pro Tier Options */}
                    {tenant.subscriptionTier === 'pro' && (
                      <div className="tier-change-grid">
                        <div className="action-card upgrade-card">
                          <div className="action-info">
                            <h4>Upgrade to Premium</h4>
                            <p>Add marketing campaigns, reports & analytics, AI insights, and priority support.</p>
                          </div>
                          <button 
                            onClick={() => setAccountModal({ show: true, action: 'changeTier', targetTier: 'premium', confirmText: '' })}
                            className="action-btn upgrade-btn"
                          >
                            ⬆️ Upgrade to Premium
                          </button>
                        </div>
                        <div className="action-card">
                          <div className="action-info">
                            <h4>Downgrade to Free</h4>
                            <p>Lose staff management, stock tracking, and communications. Single-user only.</p>
                          </div>
                          <button 
                            onClick={() => setAccountModal({ show: true, action: 'changeTier', targetTier: 'free', confirmText: '' })}
                            className="action-btn warning-btn"
                          >
                            ⬇️ Downgrade to Free
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Free Tier Options */}
                    {(tenant.subscriptionTier === 'free' || !tenant.subscriptionTier) && (
                      <div className="tier-change-grid">
                        <div className="action-card upgrade-card">
                          <div className="action-info">
                            <h4>Upgrade to Pro</h4>
                            <p>Add staff management, stock tracking with barcode scanning, and communications hub.</p>
                          </div>
                          <button 
                            onClick={() => setAccountModal({ show: true, action: 'changeTier', targetTier: 'pro', confirmText: '' })}
                            className="action-btn upgrade-btn"
                          >
                            ⬆️ Upgrade to Pro
                          </button>
                        </div>
                        <div className="action-card upgrade-card">
                          <div className="action-info">
                            <h4>Upgrade to Premium</h4>
                            <p>Get everything: staff, stock, communications, marketing, reports, AI insights, and priority support.</p>
                          </div>
                          <button 
                            onClick={() => setAccountModal({ show: true, action: 'changeTier', targetTier: 'premium', confirmText: '' })}
                            className="action-btn upgrade-btn"
                          >
                            ⬆️ Upgrade to Premium
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Data Management */}
            <div className="settings-section">
              <h2>📦 Data Management</h2>
              <div className="action-card">
                <div className="action-info">
                  <h3>Export Your Data</h3>
                  <p>Download all your business data including clients, bookings, services, and more in JSON format.</p>
                </div>
                <button 
                  onClick={handleExportData}
                  disabled={exportLoading}
                  className="action-btn export-btn"
                >
                  {exportLoading ? '⏳ Exporting...' : '📥 Export Data'}
                </button>
              </div>
            </div>



            {/* Account Actions */}
            {tenant && (
              <div className="settings-section danger-section">
                <h2>⚠️ Account Actions</h2>

                {tenant.subscriptionStatus === 'active' && tenant.subscriptionTier !== 'free' && (
                <div className="action-card">
                  <div className="action-info">
                    <h3>Cancel Subscription</h3>
                    <p>Stop automatic renewals. You can continue using until the end of your billing period.</p>
                  </div>
                  <button 
                    onClick={() => setAccountModal({ show: true, action: 'cancel', confirmText: '' })}
                    className="action-btn warning-btn"
                  >
                    🚫 Cancel Subscription
                  </button>
                </div>
              )}

              <div className="action-card danger-card">
                <div className="action-info">
                  <h3>Delete Account</h3>
                  <p className="danger-text">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <button 
                  onClick={() => setAccountModal({ show: true, action: 'delete', confirmText: '' })}
                  className="action-btn danger-btn"
                >
                  🗑️ Delete Account
                </button>
              </div>
              </div>
            )}

            {/* Privacy & Security */}
            <div className="settings-section">
              <h2>🔒 Privacy & Security</h2>
              <div className="privacy-options">
                <div className="privacy-item">
                  <div className="privacy-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <button className="action-btn secondary-btn" disabled>
                    Coming Soon
                  </button>
                </div>
                <div className="privacy-item">
                  <div className="privacy-info">
                    <h3>Login History</h3>
                    <p>View recent login activity and devices</p>
                  </div>
                  <button className="action-btn secondary-btn" disabled>
                    Coming Soon
                  </button>
                </div>
                <div className="privacy-item">
                  <div className="privacy-info">
                    <h3>API Access</h3>
                    <p>Manage API keys and integrations</p>
                  </div>
                  <button className="action-btn secondary-btn" disabled>
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Account Action Confirmation Modal */}
      {accountModal.show && (
        <div className="modal-overlay" onClick={() => setAccountModal({ show: false, action: '', targetTier: '', confirmText: '' })}>
          <div className="modal-content account-action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="warning-icon">
              {accountModal.action === 'delete' ? '🗑️' : 
               accountModal.action === 'cancel' ? '🚫' : 
               accountModal.targetTier && tenant?.subscriptionTier && getTierLevel(accountModal.targetTier) > getTierLevel(tenant.subscriptionTier) ? '⬆️' : '⬇️'}
            </div>
            
            {accountModal.action === 'changeTier' && accountModal.targetTier && (
              <>
                <h2>
                  {tenant?.subscriptionTier && getTierLevel(accountModal.targetTier) > getTierLevel(tenant.subscriptionTier) ? 'Upgrade' : 'Change'} to {accountModal.targetTier.charAt(0).toUpperCase() + accountModal.targetTier.slice(1)} Plan
                </h2>
                <p className="warning-message">
                  You're about to change from <strong>{tenant?.subscriptionTier?.toUpperCase()}</strong> to <strong>{accountModal.targetTier?.toUpperCase()}</strong> tier.
                </p>
                <div className="impact-notice">
                  <h3>⚡ What changes:</h3>
                  <ul>
                    {accountModal.targetTier === 'free' && tenant?.subscriptionTier === 'premium' && (
                      <>
                        <li>✅ Keep: Bookings, Clients, Services, Mobile App</li>
                        <li>❌ Lose: Marketing campaigns, Reports & Analytics</li>
                        <li>❌ Lose: Staff management, Stock management, Communications</li>
                        <li>❌ Lose: Advanced analytics, AI features, Priority support</li>
                        <li>💾 Your data will be preserved</li>
                        <li>🔄 You can upgrade again anytime</li>
                      </>
                    )}
                    {accountModal.targetTier === 'free' && tenant?.subscriptionTier === 'pro' && (
                      <>
                        <li>✅ Keep: Bookings, Clients, Services, Mobile App</li>
                        <li>❌ Lose: Staff management, Stock management</li>
                        <li>❌ Lose: Communications Hub, Barcode scanning</li>
                        <li>⚠️ Account becomes single-user only</li>
                        <li>💾 Your data will be preserved</li>
                        <li>🔄 You can upgrade again anytime</li>
                      </>
                    )}
                    {accountModal.targetTier === 'pro' && tenant?.subscriptionTier === 'premium' && (
                      <>
                        <li>✅ Keep: All Basic features + Staff, Stock, Communications</li>
                        <li>✅ Keep: Barcode scanning, Multi-user access</li>
                        <li>❌ Lose: Marketing campaigns, Reports & Analytics</li>
                        <li>❌ Lose: Advanced analytics, AI features, Priority support</li>
                        <li>💾 Your data will be preserved</li>
                        <li>🔄 You can upgrade to Premium anytime</li>
                      </>
                    )}
                    {accountModal.targetTier === 'pro' && tenant?.subscriptionTier === 'free' && (
                      <>
                        <li>✅ Gain: Staff Management - Add unlimited team members</li>
                        <li>✅ Gain: Stock Management - Track inventory with barcode scanning</li>
                        <li>✅ Gain: Communications Hub - Centralized client messaging</li>
                        <li>✅ Gain: Multi-user access (Owner, Managers, Stylists)</li>
                        <li>📱 Mobile barcode scanning via camera</li>
                        <li>🚀 Perfect for growing salons with multiple staff</li>
                      </>
                    )}
                    {accountModal.targetTier === 'premium' && tenant?.subscriptionTier === 'pro' && (
                      <>
                        <li>✅ Gain: Marketing Campaigns - SMS, WhatsApp, Email automation</li>
                        <li>✅ Gain: Reports & Analytics - Revenue, client insights, trends</li>
                        <li>✅ Gain: Advanced Analytics - Predictive insights, forecasting</li>
                        <li>✅ Gain: AI-Powered Insights - Smart recommendations</li>
                        <li>✅ Gain: Priority Support - Dedicated support team</li>
                        <li>⭐ Best for data-driven salons doing 100+ bookings/month</li>
                      </>
                    )}
                    {accountModal.targetTier === 'premium' && tenant?.subscriptionTier === 'free' && (
                      <>
                        <li>✅ Gain: All Pro features (Staff, Stock, Communications)</li>
                        <li>✅ Gain: Marketing Campaigns - SMS, WhatsApp, Email automation</li>
                        <li>✅ Gain: Reports & Analytics - Revenue, client insights</li>
                        <li>✅ Gain: Advanced Analytics & AI-Powered Insights</li>
                        <li>✅ Gain: Priority Support</li>
                        <li>⭐ Complete solution for established salons</li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="form-group">
                  <label>Type <strong>CHANGE TO {accountModal.targetTier?.toUpperCase()}</strong> to confirm:</label>
                  <input
                    type="text"
                    value={accountModal.confirmText}
                    onChange={(e) => setAccountModal({ ...accountModal, confirmText: e.target.value })}
                    placeholder={`CHANGE TO ${accountModal.targetTier?.toUpperCase()}`}
                    className="confirm-input"
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    className="btn-cancel" 
                    onClick={() => setAccountModal({ show: false, action: '', targetTier: '', confirmText: '' })}
                  >
                    Cancel
                  </button>
                  <button 
                    className={getTierLevel(accountModal.targetTier) > getTierLevel(tenant?.subscriptionTier) ? 'btn-upgrade' : 'btn-confirm-change'}
                    onClick={handleChangeTier}
                  >
                    {getTierLevel(accountModal.targetTier) > getTierLevel(tenant?.subscriptionTier) ? '⬆️ Confirm Upgrade' : '✓ Confirm Change'}
                  </button>
                </div>
              </>
            )}

            {accountModal.action === 'cancel' && (
              <>
                <h2>Cancel Subscription</h2>
                <p className="warning-message">
                  You're about to cancel your subscription. Here's what will happen:
                </p>
                <div className="impact-notice">
                  <h3>⚡ What to expect:</h3>
                  <ul>
                    <li>No more automatic renewals</li>
                    <li>You can continue using until {tenant?.subscriptionEndDate ? new Date(tenant.subscriptionEndDate).toLocaleDateString() : 'end of billing period'}</li>
                    <li>After that, you'll be downgraded to Basic plan</li>
                    <li>Your data will be preserved</li>
                    <li>You can resubscribe anytime</li>
                  </ul>
                </div>
                <div className="form-group">
                  <label>Type <strong>CANCEL SUBSCRIPTION</strong> to confirm:</label>
                  <input
                    type="text"
                    value={accountModal.confirmText}
                    onChange={(e) => setAccountModal({ ...accountModal, confirmText: e.target.value })}
                    placeholder="CANCEL SUBSCRIPTION"
                    className="confirm-input"
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    className="btn-cancel" 
                    onClick={() => setAccountModal({ show: false, action: '', targetTier: '', confirmText: '' })}
                  >
                    Keep Subscription
                  </button>
                  <button 
                    className="btn-confirm-change" 
                    onClick={handleCancelSubscription}
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </>
            )}

            {accountModal.action === 'delete' && (
              <>
                <h2 style={{ color: '#dc2626' }}>Delete Account Permanently</h2>
                <p className="warning-message">
                  ⚠️ <strong>This action is irreversible!</strong> All your data will be permanently deleted.
                </p>
                <div className="impact-notice" style={{ background: '#fee2e2', borderColor: '#dc2626' }}>
                  <h3>🔥 What will be deleted:</h3>
                  <ul>
                    <li>All client records and contact information</li>
                    <li>All booking history and appointments</li>
                    <li>All services, staff, and business settings</li>
                    <li>All communications and marketing data</li>
                    <li>All reports and analytics</li>
                    <li>Your account and login credentials</li>
                  </ul>
                </div>
                <div className="form-group">
                  <label>Type <strong>DELETE MY ACCOUNT</strong> to confirm:</label>
                  <input
                    type="text"
                    value={accountModal.confirmText}
                    onChange={(e) => setAccountModal({ ...accountModal, confirmText: e.target.value })}
                    placeholder="DELETE MY ACCOUNT"
                    className="confirm-input"
                  />
                </div>
                <div className="modal-actions">
                  <button 
                    className="btn-cancel" 
                    onClick={() => setAccountModal({ show: false, action: '', targetTier: '', confirmText: '' })}
                  >
                    Cancel - Keep Account
                  </button>
                  <button 
                    className="btn-confirm-change" 
                    style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}
                    onClick={handleDeleteAccount}
                  >
                    Delete Forever
                  </button>
                </div>
              </>
            )}
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
    </div>
  );
}
