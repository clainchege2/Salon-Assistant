import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';
import './Profile.css';

export default function Profile() {
  const [client, setClient] = useState(null);
  const [salonName, setSalonName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // 2FA States
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFAAction, setTwoFAAction] = useState(''); // 'enable', 'disable', 'change'
  const [twoFAMethod, setTwoFAMethod] = useState('sms');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchClientProfile();
  }, []);

  const fetchClientProfile = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client-auth/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const clientData = response.data.data;
      localStorage.setItem('clientData', JSON.stringify(clientData));
      setClient(clientData);
      setFormData({
        firstName: clientData.firstName || '',
        lastName: clientData.lastName || '',
        email: clientData.email || '',
        dateOfBirth: clientData.dateOfBirth ? clientData.dateOfBirth.split('T')[0] : '',
        gender: clientData.gender || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      // Fallback to localStorage if API fails
      const clientData = JSON.parse(localStorage.getItem('clientData'));
      if (clientData) {
        setClient(clientData);
        setFormData({
          firstName: clientData.firstName || '',
          lastName: clientData.lastName || '',
          email: clientData.email || '',
          dateOfBirth: clientData.dateOfBirth ? clientData.dateOfBirth.split('T')[0] : '',
          gender: clientData.gender || ''
        });
      }
    }
  };

  useEffect(() => {
    const fetchSalonInfo = async () => {
      try {
        const token = localStorage.getItem('clientToken');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/v1/client-auth/salons`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const clientSalon = response.data.data.find(s => s._id === client?.tenantId);
        if (clientSalon) setSalonName(clientSalon.businessName);
      } catch (err) {
        console.error('Error fetching salon:', err);
      }
    };
    
    if (client) fetchSalonInfo();
  }, [client]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);
    setLoading(true);

    try {
      const token = localStorage.getItem('clientToken');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/v1/client-auth/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local storage
      localStorage.setItem('clientData', JSON.stringify(response.data.data));
      setClient(response.data.data);
      setIsEditing(false);
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    const clientData = JSON.parse(localStorage.getItem('clientData'));
    setFormData({
      firstName: clientData.firstName || '',
      lastName: clientData.lastName || '',
      email: clientData.email || '',
      dateOfBirth: clientData.dateOfBirth ? clientData.dateOfBirth.split('T')[0] : '',
      gender: clientData.gender || ''
    });
    setIsEditing(false);
    setToast(null);
  };

  // 2FA Functions
  const handleEnable2FA = () => {
    setTwoFAAction('enable');
    setTwoFAMethod('sms');
    setShow2FAModal(true);
    setCodeSent(false);
    setVerificationCode('');
  };

  const handleDisable2FA = () => {
    setTwoFAAction('disable');
    setShow2FAModal(true);
    setCodeSent(false);
    setVerificationCode('');
  };

  const handleChange2FAMethod = () => {
    setTwoFAAction('change');
    setTwoFAMethod(client.twoFactorMethod === 'sms' ? 'email' : 'sms');
    setShow2FAModal(true);
    setCodeSent(false);
    setVerificationCode('');
  };

  const sendVerificationCode = async () => {
    setTwoFALoading(true);
    setToast(null);
    
    try {
      const token = localStorage.getItem('clientToken');
      const endpoint = twoFAAction === 'enable' ? 'enable-2fa' : 'verify-2fa-change';
      
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/client-auth/${endpoint}`,
        { method: twoFAMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCodeSent(true);
      setToast({ message: `Verification code sent to your ${twoFAMethod === 'sms' ? 'phone' : 'email'}!`, type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to send verification code', type: 'error' });
    } finally {
      setTwoFALoading(false);
    }
  };

  const verify2FACode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setToast({ message: 'Please enter a valid 6-digit code', type: 'error' });
      return;
    }

    setTwoFALoading(true);
    setToast(null);
    
    try {
      const token = localStorage.getItem('clientToken');
      let endpoint = '';
      
      if (twoFAAction === 'enable') {
        endpoint = 'verify-2fa';
      } else if (twoFAAction === 'disable') {
        endpoint = 'disable-2fa';
      } else if (twoFAAction === 'change') {
        endpoint = 'change-2fa-method';
      }
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/client-auth/${endpoint}`,
        { code: verificationCode, method: twoFAMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local storage
      localStorage.setItem('clientData', JSON.stringify(response.data.data));
      setClient(response.data.data);
      
      setShow2FAModal(false);
      setToast({ 
        message: twoFAAction === 'enable' 
          ? '2FA enabled successfully!' 
          : twoFAAction === 'disable'
          ? '2FA disabled successfully!'
          : '2FA method changed successfully!',
        type: 'success'
      });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Invalid verification code', type: 'error' });
    } finally {
      setTwoFALoading(false);
    }
  };

  const close2FAModal = () => {
    setShow2FAModal(false);
    setCodeSent(false);
    setVerificationCode('');
    setToast(null);
  };

  if (!client) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="book-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>My Profile</h1>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="dashboard-container">
        <div className="card">
          {!isEditing ? (
            <>
              <div className="profile-info">
                <div className="profile-avatar">
                  {client.firstName[0]}{client.lastName[0]}
                </div>
                <h2>{client.firstName} {client.lastName}</h2>
                <p>{client.phone}</p>
                {client.email && <p>{client.email}</p>}
                <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{marginTop: '16px'}}>
                  ✏️ Edit Profile
                </button>
              </div>

              {/* Stats Overview */}
              <div className="stats-container" style={{marginBottom: '24px'}}>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-content">
                      <h3>{client?.loyaltyPoints || 0}</h3>
                      <p>Points</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💇</div>
                    <div className="stat-content">
                      <h3>{client?.totalVisits || 0}</h3>
                      <p>Visits</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🎉</div>
                    <div className="stat-content">
                      <h3>{client?.category || 'new'}</h3>
                      <p>Status</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Details */}
              <div className="profile-details">
                <div className="detail-item">
                  <span className="detail-label">📅 Member Since</span>
                  <span className="detail-value">{new Date(client.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* 2FA Status Banner */}
              <div className={`twofa-banner ${client.twoFactorEnabled ? 'enabled' : 'disabled'}`}>
                <div className="twofa-header">
                  <div className="twofa-icon">
                    {client.twoFactorEnabled ? '🔒' : '🔓'}
                  </div>
                  <div className="twofa-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>
                      {client.twoFactorEnabled 
                        ? `Active via ${client.twoFactorMethod === 'email' ? 'Email' : 'SMS'} - Your account is protected`
                        : 'Not enabled - Add an extra layer of security to your account'
                      }
                    </p>
                  </div>
                  <div className="twofa-status">
                    <span className={`status-pill ${client.twoFactorEnabled ? 'active' : 'inactive'}`}>
                      {client.twoFactorEnabled ? '✓ Active' : '○ Inactive'}
                    </span>
                  </div>
                </div>
                
                <div className="twofa-actions">
                  {client.twoFactorEnabled ? (
                    <>
                      <button 
                        className="btn-twofa-secondary"
                        onClick={handleChange2FAMethod}
                      >
                        🔄 Change Method
                      </button>
                      <button 
                        className="btn-twofa-danger"
                        onClick={handleDisable2FA}
                      >
                        🔓 Disable 2FA
                      </button>
                    </>
                  ) : (
                    <button 
                      className="btn-twofa-primary"
                      onClick={handleEnable2FA}
                    >
                      🔐 Enable Two-Factor Authentication
                    </button>
                  )}
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <div className="twofa-dev-notice">
                    <span>⚠️</span>
                    <p>Development Mode: 2FA verification is bypassed for testing</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{maxWidth: '500px', margin: '0 auto'}}>
              <h3 style={{marginBottom: '20px'}}>Edit Profile</h3>
              
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button type="button" onClick={cancelEdit} className="btn btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="modal-overlay" onClick={close2FAModal}>
          <div className="modal-content twofa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {twoFAAction === 'enable' && '🔐 Enable Two-Factor Authentication'}
                {twoFAAction === 'disable' && '🔓 Disable Two-Factor Authentication'}
                {twoFAAction === 'change' && '🔄 Change 2FA Method'}
              </h2>
              <button className="close-btn" onClick={close2FAModal}>×</button>
            </div>

            <div className="modal-body">
              {!codeSent ? (
                <>
                  <p className="modal-description">
                    {twoFAAction === 'enable' && 
                      'Add an extra layer of security to your account. Choose how you want to receive verification codes:'
                    }
                    {twoFAAction === 'disable' && 
                      'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
                    }
                    {twoFAAction === 'change' && 
                      `Switch your 2FA method from ${client.twoFactorMethod === 'sms' ? 'SMS' : 'Email'} to ${twoFAMethod === 'sms' ? 'SMS' : 'Email'}.`
                    }
                  </p>

                  {twoFAAction === 'enable' && (
                    <div className="method-selector">
                      <label className={`method-option ${twoFAMethod === 'sms' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="method"
                          value="sms"
                          checked={twoFAMethod === 'sms'}
                          onChange={(e) => setTwoFAMethod(e.target.value)}
                        />
                        <div className="method-content">
                          <span className="method-icon">📱</span>
                          <div>
                            <strong>SMS</strong>
                            <p>Receive codes via text message to {client.phone}</p>
                          </div>
                        </div>
                      </label>

                      <label className={`method-option ${twoFAMethod === 'email' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="method"
                          value="email"
                          checked={twoFAMethod === 'email'}
                          onChange={(e) => setTwoFAMethod(e.target.value)}
                        />
                        <div className="method-content">
                          <span className="method-icon">📧</span>
                          <div>
                            <strong>Email</strong>
                            <p>Receive codes via email to {client.email || 'your email'}</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  )}

                  <div className="modal-actions">
                    <button className="btn btn-outline" onClick={close2FAModal}>
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={sendVerificationCode}
                      disabled={twoFALoading || (twoFAAction === 'enable' && twoFAMethod === 'email' && !client.email)}
                    >
                      {twoFALoading ? 'Sending...' : 'Send Verification Code'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="modal-description">
                    We've sent a 6-digit verification code to your {twoFAMethod === 'sms' ? 'phone' : 'email'}.
                    Enter it below to complete the process.
                  </p>

                  <div className="verification-input-group">
                    <label>Verification Code</label>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      className="verification-input"
                      autoFocus
                    />
                    <p className="input-hint">Enter the 6-digit code sent to you</p>
                  </div>

                  <div className="modal-actions">
                    <button className="btn btn-outline" onClick={() => setCodeSent(false)}>
                      ← Back
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={verify2FACode}
                      disabled={twoFALoading || verificationCode.length !== 6}
                    >
                      {twoFALoading ? 'Verifying...' : 'Verify & Complete'}
                    </button>
                  </div>

                  <button 
                    className="resend-link"
                    onClick={sendVerificationCode}
                    disabled={twoFALoading}
                  >
                    Didn't receive the code? Resend
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
