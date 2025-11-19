import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';
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
  const [toast, setToast] = useState(null);
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

        console.log('Navigating to dashboard...');
        navigate('/dashboard');
      } else {
        setError('Login failed - no success flag');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed - ' + err.message);
      setLoading(false);
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
        twoFactorId: tempUserId
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

        console.log('Navigating to dashboard...');
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('2FA verification error:', err);
      setError(err.response?.data?.message || 'Verification failed');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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
          </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {!showTwoFactor && (
          <div className="quick-login" style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>Quick Test Login:</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setEmail('owner@luxuryhair.com');
                setPassword('Password123!');
                setTenantSlug('luxury-hair-demo');
              }}
              style={{ padding: '6px 12px', fontSize: '11px', background: '#8b5cf6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Premium
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('owner@elitestyles.com');
                setPassword('Password123!');
                setTenantSlug('elite-styles-demo');
              }}
              style={{ padding: '6px 12px', fontSize: '11px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Pro
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('owner@basicbeauty.com');
                setPassword('Password123!');
                setTenantSlug('basic-beauty-demo');
              }}
              style={{ padding: '6px 12px', fontSize: '11px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Free
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
            Note: 2FA code will be logged to console in development
          </p>
        </div>
        )}

        <div className="register-link">
          <p>Don't have an account? <a href="/signup">Sign up here</a></p>
        </div>
      </div>
    </div>
  );
}
