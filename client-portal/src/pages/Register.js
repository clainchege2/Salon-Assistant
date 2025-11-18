import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SalonSelector from '../components/SalonSelector';
import './Register.css';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '+254',
    email: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    tenantSlug: ''
  });
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/client-auth/register`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        password: formData.password,
        tenantSlug: formData.tenantSlug
      });

      localStorage.setItem('clientToken', response.data.token);
      localStorage.setItem('clientData', JSON.stringify(response.data.data));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container" style={{ maxWidth: '500px' }}>
        <div className="register-card">
          <div className="register-header">
            <div className="brand-logo">HairVia</div>
            <h1>Join Us</h1>
            <p>Create your account to start booking</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loadingSalons ? (
            <div className="loading">Loading salons...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Salon *</label>
                <SalonSelector
                  value={formData.tenantSlug}
                  onChange={(slug) => setFormData({...formData, tenantSlug: slug})}
                  salons={salons}
                  required
                />
              </div>

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
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+254712345678"
                required
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength="6"
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength="6"
                required
              />
            </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating Account...' : '✨ Create Account'}
              </button>
            </form>
          )}

          <div className="register-footer">
            <p>Already have an account? <Link to="/login">Login here</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
