import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';
import './Signup.css';

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: signup form, 2: verification
  const [formData, setFormData] = useState({
    businessName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    country: 'Kenya',
    twoFactorMethod: 'sms'
  });
  const [verificationData, setVerificationData] = useState({
    twoFactorId: '',
    code: '',
    sentTo: '',
    method: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.phone.startsWith('+')) {
      setError('Phone number must include country code (e.g., +254...)');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/v1/auth/register', {
        businessName: formData.businessName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        country: formData.country,
        twoFactorMethod: formData.twoFactorMethod
      });

      console.log('Registration response:', response.data);

      // Move to verification step
      setVerificationData({
        twoFactorId: response.data.twoFactorId,
        code: '',
        sentTo: response.data.sentTo,
        method: response.data.method,
        tenantSlug: response.data.tenantSlug // Save the slug
      });
      setStep(2);
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    setLoading(true);

    console.log('Submitting verification:', {
      twoFactorId: verificationData.twoFactorId,
      code: verificationData.code
    });

    try {
      const response = await axios.post('http://localhost:5000/api/v1/auth/2fa/verify', {
        twoFactorId: verificationData.twoFactorId,
        code: verificationData.code
      });

      console.log('Verification response:', response.data);

      // Clear error on success
      setError('');
      
      // Save tenant slug for login
      if (verificationData.tenantSlug) {
        localStorage.setItem('lastTenantSlug', verificationData.tenantSlug);
      }
      
      // Show success toast with slug
      setToast({
        message: `Account verified! Your tenant slug is: ${verificationData.tenantSlug}. Redirecting to login...`,
        type: 'success'
      });
      
      // Mark as new signup for welcome nudge
      localStorage.setItem('isNewSignup', 'true');

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Verification error:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(err.response?.data?.message || 'Invalid verification code. Please try again.');
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError('');
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/v1/auth/2fa/resend', {
        twoFactorId: verificationData.twoFactorId
      });
      setToast({
        message: 'Verification code resent successfully!',
        type: 'success'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="signup-card">
        <div className="signup-header">
          <h1>🎨 HairVia</h1>
          <p className="tagline">Professional Salon Management</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSignup} className="signup-form">
            <h2>Create Your Salon Account</h2>
            <p className="subtitle">Start managing your salon professionally</p>

            {error && <div className="error-message">{error}</div>}

            <div className="form-section">
              <h3>Business Information</h3>
              <div className="form-group">
                <label>Business Name *</label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="e.g., Elite Hair Studio"
                  required
                />
              </div>

              <div className="form-group">
                <label>Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                >
                  <option value="Kenya">Kenya</option>
                  <option value="Uganda">Uganda</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Rwanda">Rwanda</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="South Africa">South Africa</option>
                </select>
              </div>
            </div>

            <div className="form-section">
              <h3>Owner Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
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
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="owner@yoursalon.com"
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
                  placeholder="+254700000000"
                  required
                />
                <small>Include country code (e.g., +254 for Kenya)</small>
              </div>
            </div>

            <div className="form-section">
              <h3>Security</h3>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
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
                  placeholder="Re-enter password"
                  required
                />
              </div>

              <div className="form-group">
                <label>Verification Method</label>
                <select
                  name="twoFactorMethod"
                  value={formData.twoFactorMethod}
                  onChange={handleChange}
                >
                  <option value="sms">SMS (Recommended)</option>
                  <option value="email">Email</option>
                </select>
                <small>We'll send a verification code to confirm your account</small>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="signup-footer">
              <p>Already have an account? <a href="/login">Login here</a></p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerification} className="verification-form">
            <h2>Verify Your Account</h2>
            <p className="subtitle">
              We sent a verification code to {verificationData.sentTo} via {verificationData.method}
            </p>

            {error && (
              <div className="error-message small">
                {error.includes('attempts remaining') 
                  ? error.replace('Invalid code.', '❌').replace('attempts remaining', 'tries left')
                  : error}
              </div>
            )}

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
                  // Clear error when user starts typing
                  if (error) setError('');
                }}
                placeholder="Enter 6-digit code"
                maxLength="6"
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div className="verification-footer">
              <p>Didn't receive the code?</p>
              <button type="button" onClick={resendCode} className="btn-link" disabled={loading}>
                Resend Code
              </button>
              <button type="button" onClick={() => setStep(1)} className="btn-link">
                Change Information
              </button>
            </div>
          </form>
        )}

        <div className="features-section">
          <h3>What you get with HairVia:</h3>
          <ul>
            <li>📅 Smart booking management</li>
            <li>💇‍♀️ Client database & history</li>
            <li>💰 Financial tracking</li>
            <li>📱 Mobile app for clients</li>
            <li>⚙️ Easy to use & setup</li>
          </ul>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.85rem', marginTop: '15px' }}>
            Start FREE, upgrade anytime! 🚀
          </p>
        </div>
      </div>
    </div>
  );
}
