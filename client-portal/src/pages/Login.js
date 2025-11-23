import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SalonSelector from '../components/SalonSelector';
import Toast from '../components/Toast';
import './Login.css';

export default function Login() {
  const [phone, setPhone] = useState('+254');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [salons, setSalons] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSalons, setLoadingSalons] = useState(true);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorId, setTwoFactorId] = useState(null);
  const [twoFactorMethod, setTwoFactorMethod] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const navigate = useNavigate();

  // Fetch salons on component mount
  React.useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/client-auth/salons`);
      setSalons(response.data.data || []);
    } catch (err) {
      console.error('Error fetching salons:', err);
      setToast({ message: 'Failed to load salons. Please refresh the page.', type: 'error' });
    } finally {
      setLoadingSalons(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/client-auth/login`, {
        phone,
        password,
        tenantSlug
      });

      // Check if 2FA is required
      if (response.data.requires2FA) {
        setShowTwoFactor(true);
        setTwoFactorId(response.data.twoFactorId);
        setTwoFactorMethod(response.data.method);
        setSentTo(response.data.sentTo);
        setToast({ message: response.data.message || 'Verification code sent', type: 'info' });
        setLoading(false);
        return;
      }

      // Check if account needs verification (pending-verification error)
      if (response.data.requiresVerification) {
        setShowTwoFactor(true);
        setTwoFactorId(response.data.twoFactorId);
        setTwoFactorMethod(response.data.method);
        setSentTo(response.data.sentTo);
        setToast({ message: response.data.message || 'Please verify your account', type: 'warning' });
        setLoading(false);
        return;
      }

      localStorage.setItem('clientToken', response.data.token);
      localStorage.setItem('clientData', JSON.stringify(response.data.data));
      navigate('/dashboard');
    } catch (err) {
      // Handle pending verification error
      if (err.response?.data?.error === 'PENDING_VERIFICATION' && err.response?.data?.requiresVerification) {
        setShowTwoFactor(true);
        setTwoFactorId(err.response.data.twoFactorId);
        setTwoFactorMethod(err.response.data.method);
        setSentTo(err.response.data.sentTo);
        setToast({ message: err.response.data.message, type: 'warning' });
        setLoading(false);
        return;
      }
      
      setToast({ message: err.response?.data?.message || 'Login failed. Please try again.', type: 'error' });
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setToast(null);
    setLoading(true);

    try {
      // Try login with 2FA code first
      const loginResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/client-auth/login`, {
        phone,
        password,
        tenantSlug,
        twoFactorCode,
        twoFactorId,
        trustDevice
      });

      localStorage.setItem('clientToken', loginResponse.data.token);
      localStorage.setItem('clientData', JSON.stringify(loginResponse.data.data));
      setToast({ message: 'Login successful!', type: 'success' });
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (loginErr) {
      // If login fails, try the verify endpoint (for registration verification)
      try {
        const verifyResponse = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/client-auth/verify`, {
          twoFactorId,
          code: twoFactorCode
        });

        localStorage.setItem('clientToken', verifyResponse.data.token);
        localStorage.setItem('clientData', JSON.stringify(verifyResponse.data.data));
        setToast({ message: 'Account verified successfully!', type: 'success' });
        setTimeout(() => navigate('/dashboard'), 500);
      } catch (verifyErr) {
        setToast({ 
          message: verifyErr.response?.data?.message || loginErr.response?.data?.message || 'Verification failed. Please try again.', 
          type: 'error' 
        });
        setLoading(false);
      }
    }
  };

  const handleResendCode = async () => {
    setToast(null);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/client-auth/resend`, {
        twoFactorId
      });
      setToast({ message: 'Verification code resent successfully', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to resend code', type: 'error' });
    }
  };

  return (
    <div className="login-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="brand-logo">HairVia</div>
            <h1>Welcome Back</h1>
            <p>Book your next appointment</p>
          </div>

          {loadingSalons ? (
            <div className="loading">Loading salons...</div>
          ) : showTwoFactor ? (
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
                  Code sent to {sentTo || (twoFactorMethod === 'email' ? 'your email' : 'your phone')}
                </small>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                    style={{ marginRight: '8px', width: 'auto', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px' }}>Remember this device for 30 days</span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Verifying...' : '✓ Verify Code'}
              </button>

              <button 
                type="button" 
                onClick={handleResendCode}
                className="btn btn-secondary"
                style={{ marginTop: '10px' }}
              >
                🔄 Resend Code
              </button>

              <button 
                type="button" 
                onClick={() => {
                  setShowTwoFactor(false);
                  setTwoFactorCode('');
                  setToast(null);
                }}
                className="btn btn-secondary"
                style={{ marginTop: '10px' }}
              >
                ← Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Salon *</label>
                <SalonSelector
                  value={tenantSlug}
                  onChange={setTenantSlug}
                  salons={salons}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254712345678"
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

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Logging in...' : '🔐 Login'}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p>Don't have an account? <Link to="/register">Register here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
