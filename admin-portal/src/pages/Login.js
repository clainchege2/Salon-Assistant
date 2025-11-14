import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState(localStorage.getItem('lastTenantSlug') || '');
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
        // Save tenant slug for next time
        localStorage.setItem('lastTenantSlug', tenantSlug);
        
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
            <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
              Test accounts: luxury-hair-demo, elite-styles-demo, basic-beauty-demo
            </small>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

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
        </div>

        <div className="register-link">
          <p>Don't have an account? Register your salon first via API</p>
        </div>
      </div>
    </div>
  );
}
