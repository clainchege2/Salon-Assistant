import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

      if (response.data.success) {
        // Clear any old data first
        localStorage.clear();
        
        // Set new data
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
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

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="brand-logo">HairVia</div>
        <h1>Welcome Back</h1>
        <p className="subtitle">Your Salon, Elevated</p>
        
        {error && <div className="error-message">{error}</div>}
        
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
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="register-link">
          <p>Don't have an account? Register your salon first via API</p>
        </div>
      </div>
    </div>
  );
}
