import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Profile.css';

export default function Profile() {
  const [client, setClient] = useState(null);
  const [salonName, setSalonName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const clientData = JSON.parse(localStorage.getItem('clientData'));
    setClient(clientData);
    setFormData({
      firstName: clientData.firstName || '',
      lastName: clientData.lastName || '',
      email: clientData.email || '',
      dateOfBirth: clientData.dateOfBirth ? clientData.dateOfBirth.split('T')[0] : '',
      gender: clientData.gender || ''
    });
  }, []);

  useEffect(() => {
    const fetchSalonInfo = async () => {
      try {
        const token = localStorage.getItem('clientToken');
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/v1/client-auth/salons`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const clientSalon = response.data.data.find(s => s._id === client?.tenantId);
        if (clientSalon) setSalonName(clientSalon.businessName);
      } catch (err) {
        console.error('Error fetching salon:', err);
      }
    };
    
    if (client) fetchSalonInfo();
  }, [client]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('clientToken');
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/v1/client-auth/profile`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local storage
      localStorage.setItem('clientData', JSON.stringify(response.data.data));
      setClient(response.data.data);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    const clientData = JSON.parse(localStorage.getItem('clientData'));
    setFormData({
      firstName: clientData.firstName || '',
      lastName: clientData.lastName || '',
      email: clientData.email || '',
      dateOfBirth: clientData.dateOfBirth ? clientData.dateOfBirth.split('T')[0] : '',
      gender: clientData.gender || ''
    });
    setIsEditing(false);
    setError('');
  };

  if (!client) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="book-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>My Profile</h1>
      </div>

      <div className="dashboard-container">
        <div className="card">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {!isEditing ? (
            <>
              <div className="profile-info">
                <div className="profile-avatar">
                  {client.firstName[0]}{client.lastName[0]}
                </div>
                <h2>{client.firstName} {client.lastName}</h2>
                <p>{client.phone}</p>
                {client.email && <p>{client.email}</p>}
                <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{marginTop: '16px'}}>
                  ✏️ Edit Profile
                </button>
              </div>

              {/* Stats Overview */}
              <div className="stats-container" style={{marginBottom: '24px'}}>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-content">
                      <h3>{client?.loyaltyPoints || 0}</h3>
                      <p>Points</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💇</div>
                    <div className="stat-content">
                      <h3>{client?.totalVisits || 0}</h3>
                      <p>Visits</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🎉</div>
                    <div className="stat-content">
                      <h3>{client?.category || 'New'}</h3>
                      <p>Status</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <strong>Total Visits:</strong>
                  <span>{client.totalVisits || 0}</span>
                </div>
                <div className="stat-item">
                  <strong>Loyalty Points:</strong>
                  <span>{client.loyaltyPoints || 0}</span>
                </div>
                <div className="stat-item">
                  <strong>Status:</strong>
                  <span className="status-badge">{client.category || 'New'}</span>
                </div>
                <div className="stat-item">
                  <strong>Member Since:</strong>
                  <span>{new Date(client.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} style={{maxWidth: '500px', margin: '0 auto'}}>
              <h3 style={{marginBottom: '20px'}}>Edit Profile</h3>
              
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
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">Prefer not to say</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{display: 'flex', gap: '12px', marginTop: '24px'}}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
                <button type="button" onClick={cancelEdit} className="btn btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
