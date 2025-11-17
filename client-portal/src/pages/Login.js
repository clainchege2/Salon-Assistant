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
        tenantSlug
      });

      localStorage.setItem('clientToken', response.data.token);
      localStorage.setItem('clientData', JSON.stringify(response.data.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
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
