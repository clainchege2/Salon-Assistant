import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SalonSelector from '../components/SalonSelector';
import './Login.css';

export default function Login() {
  const [phone, setPhone] = useState('+254');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [salons, setSalons] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSalons, setLoadingSalons] = useState(true);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorId, setTwoFactorId] = useState(null);
  const [twoFactorMethod, setTwoFactorMethod] = useState('');
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
      setError('Failed to load salons. Please refresh the page.');
    } finally {
      setLoadingSalons(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/client-auth/login`, {
        phone,
        password,
        tenantSlug,
        skipTwoFactor: true // Skip 2FA in development
      });

      // Check if 2FA is required
      if (response.data.requires2FA) {
        setShowTwoFactor(true);
        setTwoFactorId(response.data.twoFactorId);
        setTwoFactorMethod(response.data.method);
        setError('');
        setLoading(false);
        return;
      }

      localStorage.setItem('clientToken', response.data.token);
      localStorage.setItem('clientData', JSON.stringify(response.data.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/client-auth/login`, {
        phone,
        password,
        tenantSlug,
        twoFactorCode,
        twoFactorId
      });

      localStorage.setItem('clientToken', response.data.token);
      localStorage.setItem('clientData', JSON.stringify(response.data.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="brand-logo">HairVia</div>
            <h1>Welcome Back</h1>
            <p>Book your next appointment</p>
          </div>

          {error && <div className="error-message">{error}</div>}

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
                  Check your {twoFactorMethod === 'email' ? 'email' : 'phone'} for the verification code
                </small>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <button 
                type="button" 
                onClick={() => {
                  setShowTwoFactor(false);
                  setTwoFactorCode('');
                  setError('');
                }}
                className="btn btn-secondary"
                style={{ marginTop: '10px' }}
              >
                Back to Login
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
