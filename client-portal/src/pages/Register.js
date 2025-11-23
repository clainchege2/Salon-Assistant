import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import SalonSelector from '../components/SalonSelector';
import Toast from '../components/Toast';
import './Register.css';

export default function Register() {
  const [step, setStep] = useState(1); // 1: registration, 2: verification
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
  const [verificationData, setVerificationData] = useState({
    twoFactorId: '',
    code: '',
    sentTo: '',
    method: ''
  });
  const [salons, setSalons] = useState([]);
  const [toast, setToast] = useState(null);
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
      setToast({ message: 'Failed to load salons. Please refresh the page.', type: 'error' });
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
    setToast(null);

    if (formData.password !== formData.confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
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

      // Check if verification is required
      if (response.data.requiresVerification) {
        setVerificationData({
          twoFactorId: response.data.twoFactorId,
          code: '',
          sentTo: response.data.sentTo,
          method: response.data.method
        });
        setStep(2);
        setToast({ message: response.data.message || 'Verification code sent!', type: 'success' });
        setLoading(false);
      } else {
        // Direct login (fallback)
        localStorage.setItem('clientToken', response.data.token);
        localStorage.setItem('clientData', JSON.stringify(response.data.data));
        setToast({ message: 'Account created successfully!', type: 'success' });
        setTimeout(() => navigate('/dashboard'), 500);
      }
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Registration failed. Please try again.', type: 'error' });
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setToast(null);
    setLoading(true);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/client-auth/verify`, {
        twoFactorId: verificationData.twoFactorId,
        code: verificationData.code
      });
      
      localStorage.setItem('clientToken', response.data.token);
      localStorage.setItem('clientData', JSON.stringify(response.data.data));
      
      setToast({ message: 'Account verified successfully!', type: 'success' });
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Invalid verification code. Please try again.', type: 'error' });
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setToast(null);
    setLoading(true);

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/client-auth/resend`, {
        twoFactorId: verificationData.twoFactorId
      });
      setToast({ message: 'Verification code resent successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to resend code', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      <div className="register-container" style={{ maxWidth: '500px' }}>
        <div className="register-card">
          <div className="register-header">
            <div className="brand-logo">HairVia</div>
            <h1>{step === 1 ? 'Join Us' : 'Verify Your Account'}</h1>
            <p>{step === 1 ? 'Create your account to start booking' : `Code sent to ${verificationData.sentTo}`}</p>
          </div>

          {step === 1 ? (
            loadingSalons ? (
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
            )
          ) : (
            <form onSubmit={handleVerification}>
              <div className="form-group">
                <label>Verification Code *</label>
                <input
                  type="text"
                  value={verificationData.code}
                  onChange={(e) => {
                    setVerificationData({
                      ...verificationData,
                      code: e.target.value
                    });
                    // Clear toast when user starts typing
                    if (toast) setToast(null);
                  }}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  required
                  autoFocus
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Verifying...' : '✓ Verify & Continue'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Didn't receive the code?</p>
                <button type="button" onClick={resendCode} className="btn-link" disabled={loading}>
                  Resend Code
                </button>
                <button type="button" onClick={() => setStep(1)} className="btn-link">
                  Change Information
                </button>
              </div>
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
