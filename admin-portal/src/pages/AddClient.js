import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddClient.css';

export default function AddClient() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    anniversary: '',
    gender: '',
    occupation: '',
    referralSource: '',
    hairType: '',
    allergies: '',
    skinSensitivity: '',
    notes: '',
    instagramHandle: '',
    tiktokHandle: '',
    smsConsent: true,
    emailConsent: false,
    whatsappConsent: false,
    communicationPreference: 'sms',
    languagePreference: 'english'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      await axios.post('http://localhost:5000/api/v1/clients', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || undefined,
        anniversary: formData.anniversary || undefined,
        gender: formData.gender || undefined,
        occupation: formData.occupation || undefined,
        referralSource: formData.referralSource || undefined,
        socialMedia: {
          instagram: formData.instagramHandle || undefined,
          tiktok: formData.tiktokHandle || undefined
        },
        marketingConsent: {
          sms: formData.smsConsent,
          email: formData.emailConsent,
          whatsapp: formData.whatsappConsent
        },
        communicationPreference: formData.communicationPreference,
        languagePreference: formData.languagePreference,
        preferences: {
          allergies: formData.allergies,
          hairType: formData.hairType || undefined,
          skinSensitivity: formData.skinSensitivity || undefined,
          notes: formData.notes
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-client-container">
      <div className="add-client-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
        <h1>Add New Client</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="client-form">
        <div className="form-section-title">📋 Basic Information</div>

        <div className="form-row">
          <div className="form-group">
            <label>First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Phone Number *</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+254712345678"
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="client@example.com"
          />
        </div>

        <div className="form-section-title">📅 Special Dates (for personalized wishes)</div>

        <div className="form-row">
          <div className="form-group">
            <label>Date of Birth 🎂</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
            <small>We'll send birthday wishes!</small>
          </div>

          <div className="form-group">
            <label>Anniversary 💍</label>
            <input
              type="date"
              value={formData.anniversary}
              onChange={(e) => setFormData({ ...formData, anniversary: e.target.value })}
            />
            <small>Wedding or special anniversary</small>
          </div>
        </div>

        <div className="form-section-title">👤 Personal Information</div>

        <div className="form-row">
          <div className="form-group">
            <label>Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="">Select...</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div className="form-group">
            <label>Occupation</label>
            <input
              type="text"
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              placeholder="e.g., Teacher, Nurse"
            />
          </div>
        </div>

        <div className="form-group">
          <label>How did you hear about us?</label>
          <select
            value={formData.referralSource}
            onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
          >
            <option value="">Select...</option>
            <option value="social-media">Social Media (Instagram, Facebook)</option>
            <option value="friend">Friend/Family Referral</option>
            <option value="google">Google Search</option>
            <option value="walk-by">Walked By</option>
            <option value="advertisement">Advertisement</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-section-title">💇 Hair & Beauty Preferences</div>

        <div className="form-group">
          <label>Hair Type</label>
          <select
            value={formData.hairType}
            onChange={(e) => setFormData({ ...formData, hairType: e.target.value })}
          >
            <option value="">Select...</option>
            <option value="natural">Natural Hair</option>
            <option value="relaxed">Relaxed</option>
            <option value="locs">Locs</option>
            <option value="braids">Braids</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Allergies</label>
          <input
            type="text"
            value={formData.allergies}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            placeholder="Any known allergies..."
          />
        </div>

        <div className="form-group">
          <label>Skin Sensitivity</label>
          <input
            type="text"
            value={formData.skinSensitivity}
            onChange={(e) => setFormData({ ...formData, skinSensitivity: e.target.value })}
            placeholder="Sensitive skin, reactions to products, etc..."
          />
        </div>

        <div className="form-group">
          <label>Additional Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="3"
            placeholder="Preferences, favorite styles, special requests, etc..."
          />
        </div>

        <div className="form-section-title">📱 Social Media</div>

        <div className="form-row">
          <div className="form-group">
            <label>Instagram Handle</label>
            <input
              type="text"
              value={formData.instagramHandle}
              onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
              placeholder="@username"
            />
            <small>For tagging in posts (with permission)</small>
          </div>

          <div className="form-group">
            <label>TikTok Handle</label>
            <input
              type="text"
              value={formData.tiktokHandle}
              onChange={(e) => setFormData({ ...formData, tiktokHandle: e.target.value })}
              placeholder="@username"
            />
            <small>For tagging in TikTok videos</small>
          </div>
        </div>

        <div className="form-section-title">📱 Communication Preferences</div>

        <div className="form-group">
          <label>Marketing Consent (How can we reach you with offers?)</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.smsConsent}
                onChange={(e) => setFormData({ ...formData, smsConsent: e.target.checked })}
              />
              SMS
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.emailConsent}
                onChange={(e) => setFormData({ ...formData, emailConsent: e.target.checked })}
              />
              Email
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.whatsappConsent}
                onChange={(e) => setFormData({ ...formData, whatsappConsent: e.target.checked })}
              />
              WhatsApp
            </label>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Preferred Contact Method</label>
            <select
              value={formData.communicationPreference}
              onChange={(e) => setFormData({ ...formData, communicationPreference: e.target.value })}
            >
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="phone">Phone Call</option>
            </select>
          </div>

          <div className="form-group">
            <label>Language Preference</label>
            <select
              value={formData.languagePreference}
              onChange={(e) => setFormData({ ...formData, languagePreference: e.target.value })}
            >
              <option value="english">English</option>
              <option value="swahili">Swahili</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Client'}
        </button>
      </form>
    </div>
  );
}
