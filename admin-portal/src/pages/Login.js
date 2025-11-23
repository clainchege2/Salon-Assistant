import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import sessionManager from '../utils/sessionManager';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState(localStorage.getItem('lastTenantSlug') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempUserId, setTempUserId] = useState(null);
  const [trustDevice, setTrustDevice] = useState(false);
  const [showSlugRecovery, setShowSlugRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('Attempting login with:', { email, tenantSlug });

    try {
      const response = await axios.post('http://localhost:5000/api/v1/auth/login', {
        email,
        password,
        tenantSlug
      });

      console.log('Login response:', response.data);

      // Check if 2FA is required
      if (response.data.requires2FA) {
        setShowTwoFactor(true);
        setTempUserId(response.data.twoFactorId); // Use twoFactorId, not userId
        setError('');
        setLoading(false);
        return;
      }

      if (response.data.success) {
        // Save tenant slug for next time
        localStorage.setItem('lastTenantSlug', tenantSlug);

        // Set new data
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Store tenant data for localization
        if (response.data.tenant) {
          localStorage.setItem('tenant', JSON.stringify(response.data.tenant));
        }

        // Check if password change is required
        if (response.data.requirePasswordChange) {
          console.log('Password change required, redirecting...');
          navigate('/change-password');
          return;
        }

        console.log('Navigating to dashboard...');
        navigate('/dashboard');
      } else {
        setError('Login failed - no success flag');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed - ' + err.message;
      setError(errorMessage);
      setLoading(false);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Re-submit login with 2FA code
      const response = await axios.post('http://localhost:5000/api/v1/auth/login', {
        email,
        password,
        tenantSlug,
        twoFactorCode,
        twoFactorId: tempUserId,
        trustDevice: trustDevice
      });

      if (response.data.success) {
        // Save tenant slug for next time
        localStorage.setItem('lastTenantSlug', tenantSlug);

        // Set new data
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Store tenant data for localization
        if (response.data.tenant) {
          localStorage.setItem('tenant', JSON.stringify(response.data.tenant));
        }

        // Check if password change is required
        if (response.data.requirePasswordChange) {
          console.log('Password change required after 2FA, redirecting...');
          navigate('/change-password');
          return;
        }

        // Reset session timer and start monitoring
        sessionManager.reset();
        sessionManager.start();

        console.log('Navigating to dashboard...');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('2FA verification error:', err);
      const errorMessage = err.response?.data?.message || 'Verification failed';
      setError(errorMessage);
      setLoading(false);
      
      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  const handleSlugRecovery = async (e) => {
    e.preventDefault();
    setRecoveryMessage('');
    setRecoveryLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/v1/slug-recovery/send-slug', {
        email: recoveryEmail
      });

      setRecoveryMessage(response.data.message);
      setRecoveryLoading(false);
      
      // Auto-close modal after 5 seconds
      setTimeout(() => {
        setShowSlugRecovery(false);
        setRecoveryEmail('');
        setRecoveryMessage('');
      }, 5000);
    } catch (err) {
      console.error('Slug recovery error:', err);
      setRecoveryMessage(err.response?.data?.message || 'Failed to send slug. Please try again.');
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="brand-logo">HairVia</div>
        <h1>Welcome Back</h1>
        <p className="subtitle">Your Salon, Elevated</p>

        {error && <div className="error-message">{error}</div>}

        {showTwoFactor ? (
          <form onSubmit={handleVerify2FA}>
            <div className="form-group">
              <label>Verification Code</label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength="6"
                required
                autoFocus
                style={{ fontSize: '24px', textAlign: 'center', letterSpacing: '8px' }}
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '8px', display: 'block' }}>
                Check your SMS/Email for the verification code
              </small>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  style={{ marginRight: '8px', cursor: 'pointer' }}
                />
                Remember this device for 30 days
              </label>
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block', marginLeft: '24px' }}>
                You won't need to enter a code on this device
              </small>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button 
              type="button" 
              onClick={() => {
                setShowTwoFactor(false);
                setTwoFactorCode('');
                setError('');
              }}
              style={{ marginTop: '10px', background: '#6b7280' }}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@salon.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="form-group">
            <label>Tenant Slug</label>
            <input
              type="text"
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              placeholder="your-salon-slug"
              required
            />
            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Test accounts: luxury-hair-demo, elite-styles-demo, basic-beauty-demo
            </small>
            <button 
              type="button"
              onClick={() => setShowSlugRecovery(true)}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#667eea', 
                fontSize: '13px', 
                cursor: 'pointer',
                marginTop: '8px',
                padding: '0',
                textDecoration: 'underline'
              }}
            >
              Forgot your slug?
            </button>
          </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        <div className="register-link">
          <p>Don't have an account? <a href="/signup">Sign up here</a></p>
        </div>
      </div>

      {/* Slug Recovery Modal */}
      {showSlugRecovery && (
        <div 
          className="modal-overlay" 
          onClick={() => {
            setShowSlugRecovery(false);
            setRecoveryEmail('');
            setRecoveryMessage('');
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '450px',
              width: '90%',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
          >
            <h2 style={{ marginBottom: '10px', color: '#1f2937' }}>🔍 Forgot Your Slug?</h2>
            <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px' }}>
              Enter your email address and we'll send you your salon slug.
            </p>

            {recoveryMessage && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                background: recoveryMessage.includes('sent') ? '#d1fae5' : '#fee2e2',
                color: recoveryMessage.includes('sent') ? '#065f46' : '#991b1b',
                fontSize: '14px'
              }}>
                {recoveryMessage}
              </div>
            )}

            <form onSubmit={handleSlugRecovery}>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button"
                  onClick={() => {
                    setShowSlugRecovery(false);
                    setRecoveryEmail('');
                    setRecoveryMessage('');
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={recoveryLoading}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: recoveryLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: recoveryLoading ? 0.6 : 1
                  }}
                >
                  {recoveryLoading ? 'Sending...' : 'Send Slug'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
