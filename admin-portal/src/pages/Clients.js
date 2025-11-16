import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Clients.css';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('clientsViewMode') || 'list';
  });
  const [viewModal, setViewModal] = useState({ show: false, client: null, bookings: [] });
  const [editModal, setEditModal] = useState({ show: false, client: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, client: null });
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [filter, searchTerm, clients]);

  // Save view mode preference
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('clientsViewMode', mode);
  };

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Mask phone number for privacy
  const maskPhone = (phone) => {
    if (!phone || phone.length < 4) return phone;
    return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
  };

  // Check if user can delete clients
  const canDeleteClients = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    try {
      const user = JSON.parse(userStr);
      return user.role === 'owner' || user.permissions?.canDeleteClients === true;
    } catch {
      return false;
    }
  };

  // Check if user can edit clients
  const canEditClients = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    try {
      const user = JSON.parse(userStr);
      return user.role === 'owner' || user.role === 'manager';
    } catch {
      return false;
    }
  };

  // Check if user can view client stats and history
  const canViewClientStats = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    try {
      const user = JSON.parse(userStr);
      return user.role === 'owner' || user.role === 'manager';
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [filter, searchTerm, clients]);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/v1/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = clients;

    // Filter by category
    if (filter !== 'all') {
      filtered = filtered.filter(c => c.category === filter);
    }

    // Search by name or phone
    if (searchTerm) {
      filtered = filtered.filter(c => {
        const name = `${c.firstName} ${c.lastName}`.toLowerCase();
        const phone = c.phone.toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm.toLowerCase());
      });
    }

    setFilteredClients(filtered);
  };

  const getCategoryColor = (category) => {
    const colors = {
      'longtime-no-see': '#dc2626', // Urgent red - needs immediate attention
      new: '#2563eb',                // Bright blue - high priority to convert
      usual: '#059669',              // Calm green - maintain steady engagement
      vip: '#9333ea'                 // Royal purple - premium treatment
    };
    return colors[category] || '#6b7280';
  };

  const getCategoryStyle = (category) => {
    const styles = {
      'longtime-no-see': {
        background: '#fee2e2',
        color: '#dc2626',
        border: '2px solid #fecaca'
      },
      new: {
        background: '#dbeafe',
        color: '#2563eb',
        border: '2px solid #bfdbfe'
      },
      usual: {
        background: '#d1fae5',
        color: '#059669',
        border: '2px solid #a7f3d0'
      },
      vip: {
        background: '#f3e8ff',
        color: '#9333ea',
        border: '2px solid #e9d5ff'
      }
    };
    return styles[category] || { background: '#f3f4f6', color: '#6b7280', border: '2px solid #e5e7eb' };
  };

  const getCategoryIcon = (category) => {
    const icons = {
      new: '✨',
      vip: '⭐',
      usual: '👤',
      'longtime-no-see': '💤'
    };
    return icons[category] || '👤';
  };

  const getCategoryDisplayName = (category) => {
    const names = {
      new: 'New',
      vip: 'VIP',
      usual: 'Regular',
      'longtime-no-see': 'Win-Back'
    };
    return names[category] || category;
  };

  const getCategoryDescription = (category) => {
    const descriptions = {
      'longtime-no-see': '🚨 URGENT: Re-engagement needed - Win them back now!',
      new: '⚡ HIGH PRIORITY: Build lasting relationship from first visit',
      usual: '✅ MAINTAIN: Keep consistent engagement & loyalty',
      vip: '👑 PREMIUM: Provide exceptional VIP treatment'
    };
    return descriptions[category] || 'Valued client';
  };

  const getInsightBoxStyle = (category) => {
    const styles = {
      'longtime-no-see': {
        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
        borderColor: '#dc2626',
        color: '#7f1d1d'
      },
      new: {
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        borderColor: '#2563eb',
        color: '#1e3a8a'
      },
      usual: {
        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
        borderColor: '#059669',
        color: '#064e3b'
      },
      vip: {
        background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
        borderColor: '#9333ea',
        color: '#581c87'
      }
    };
    return styles[category] || styles.usual;
  };

  const handleBookAppointment = (client) => {
    // Store client data in sessionStorage to pre-populate booking form
    sessionStorage.setItem('selectedClient', JSON.stringify(client));
    navigate('/add-booking');
  };

  const handleViewClient = async (client) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `http://localhost:5000/api/v1/clients/${client._id}/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setViewModal({ show: true, client, bookings: response.data.data || [] });
    } catch (error) {
      console.error('Error fetching client history:', error);
      setViewModal({ show: true, client, bookings: [] });
    }
  };

  const handleEditClient = (client) => {
    setEditModal({ show: true, client: { ...client } });
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/v1/clients/${editModal.client._id}`,
        editModal.client,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchClients();
      setEditModal({ show: false, client: null });
      alert('✅ Client updated successfully!');
    } catch (error) {
      console.error('Error updating client:', error);
      alert('❌ Failed to update client');
    }
  };

  const handleDeleteClient = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `http://localhost:5000/api/v1/clients/${deleteModal.client._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchClients();
      setDeleteModal({ show: false, client: null });
      alert('✅ Client deleted successfully!');
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('❌ Failed to delete client');
    }
  };

  if (loading) return <div className="loading">Loading clients...</div>;

  return (
    <div className="clients-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <div className="page-title-wrapper">
          <div className="title-with-icon">
            <span className="title-icon">💇🏾‍♀️</span>
            <div className="title-content">
              <h1>Client Management</h1>
              <p className="page-tagline">Build lasting relationships with your valued clients</p>
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/add-client')} className="add-btn">
          ➕ New Client
        </button>
      </div>

      <div className="clients-controls">
        <div className="controls-row">
          <input
            type="text"
            placeholder="🔍 Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.trim().slice(0, 100))}
            className="search-input"
            maxLength={100}
            aria-label="Search clients"
          />
          
          <div className="view-toggle">
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
              title="List view"
            >
              ☰
            </button>
            <button 
              className={viewMode === 'cards' ? 'active' : ''}
              onClick={() => setViewMode('cards')}
              title="Card view"
            >
              ⊞
            </button>
          </div>
        </div>

        <div className="filter-tabs">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
            title="All clients"
          >
            All ({clients.length})
          </button>
          <button
            className={filter === 'new' ? 'active' : ''}
            onClick={() => setFilter('new')}
            title="First-time clients - Build lasting relationships"
          >
            ✨ New ({clients.filter(c => c.category === 'new').length})
          </button>
          <button
            className={filter === 'vip' ? 'active' : ''}
            onClick={() => setFilter('vip')}
            title="High-value clients - Premium service priority"
          >
            ⭐ VIP ({clients.filter(c => c.category === 'vip').length})
          </button>
          <button
            className={filter === 'usual' ? 'active' : ''}
            onClick={() => setFilter('usual')}
            title="Regular clients - Consistent engagement"
          >
            👤 Regular ({clients.filter(c => c.category === 'usual').length})
          </button>
          <button
            className={filter === 'longtime-no-see' ? 'active' : ''}
            onClick={() => setFilter('longtime-no-see')}
            title="Re-engagement opportunity - Win them back"
          >
            💤 Win-Back ({clients.filter(c => c.category === 'longtime-no-see').length})
          </button>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="empty-state">
          <p>📭 No clients found</p>
          <button onClick={() => navigate('/add-client')} className="add-btn">
            Add Your First Client
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="clients-table-container">
          <table className="clients-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>Category</th>
                {canViewClientStats() && (
                  <>
                    <th>Visits</th>
                    <th>Total Spent</th>
                    <th>Last Visit</th>
                  </>
                )}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map(client => (
                <tr key={client._id}>
                  <td>
                    <div className="client-name-cell">
                      <div className="client-avatar-small">
                        {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                      </div>
                      <strong>{client.firstName} {client.lastName}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <span>{client.phone}</span>
                      {client.email && <span className="email-small">{client.email}</span>}
                    </div>
                  </td>
                  <td>
                    <span 
                      className="category-badge-small"
                      style={{
                        background: getCategoryStyle(client.category).background,
                        color: getCategoryStyle(client.category).color,
                        border: getCategoryStyle(client.category).border
                      }}
                    >
                      {getCategoryIcon(client.category)} {getCategoryDisplayName(client.category)}
                    </span>
                  </td>
                  {canViewClientStats() && (
                    <>
                      <td className="number-cell">{client.totalVisits || 0}</td>
                      <td className="price-cell">KES {client.totalSpent || 0}</td>
                      <td>
                        {client.lastVisit 
                          ? new Date(client.lastVisit).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '-'
                        }
                      </td>
                    </>
                  )}
                  <td>
                    <div className="table-actions">
                      <button className="btn-action book" onClick={() => handleBookAppointment(client)}>
                        📅 Book
                      </button>
                      <button className="btn-action view" onClick={() => handleViewClient(client)}>
                        View
                      </button>
                      {canEditClients() && (
                        <button className="btn-action edit" onClick={() => handleEditClient(client)}>
                          ✏️
                        </button>
                      )}
                      {canDeleteClients() && (
                        <button className="btn-action delete" onClick={() => setDeleteModal({ show: true, client })}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="clients-grid">
          {filteredClients.map(client => (
            <div key={client._id} className="client-card">
              <div className="client-header">
                <div className="client-avatar">
                  {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                </div>
                <div className="client-info">
                  <h3>{client.firstName} {client.lastName}</h3>
                  <p className="phone">{client.phone}</p>
                  {client.email && <p className="email">{client.email}</p>}
                </div>
                <span 
                  className="category-badge" 
                  style={{
                    background: getCategoryStyle(client.category).background,
                    color: getCategoryStyle(client.category).color,
                    border: getCategoryStyle(client.category).border
                  }}
                >
                  {getCategoryIcon(client.category)} {getCategoryDisplayName(client.category)}
                </span>
              </div>

              {canViewClientStats() && (
                <div className="client-stats">
                  <div className="stat">
                    <span className="stat-value">{client.totalVisits || 0}</span>
                    <span className="stat-label">Visits</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">KES {client.totalSpent || 0}</span>
                    <span className="stat-label">Spent</span>
                  </div>
                  {client.lastVisit && (
                    <div className="stat">
                      <span className="stat-value">
                        {new Date(client.lastVisit).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="stat-label">Last Visit</span>
                    </div>
                  )}
                </div>
              )}

              {client.preferences?.hairType && (
                <div className="client-details">
                  <span className="detail-item">💇 {client.preferences.hairType}</span>
                </div>
              )}

              {client.dateOfBirth && (
                <div className="client-details">
                  <span className="detail-item">
                    🎂 {new Date(client.dateOfBirth).toLocaleDateString('en-KE', { month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}

              <div 
                className="client-marketing-note"
                style={{
                  background: getInsightBoxStyle(client.category).background,
                  borderLeftColor: getInsightBoxStyle(client.category).borderColor
                }}
              >
                <p 
                  className="marketing-insight"
                  style={{ color: getInsightBoxStyle(client.category).color }}
                >
                  {getCategoryDescription(client.category)}
                </p>
              </div>

              <div className="client-actions">
                <button className="btn-view" onClick={() => handleViewClient(client)}>
                  View Profile
                </button>
                <button className="btn-book" onClick={() => handleBookAppointment(client)}>
                  Book Appointment
                </button>
                {canEditClients() && (
                  <button className="btn-edit" onClick={() => handleEditClient(client)}>
                    Edit
                  </button>
                )}
                {canDeleteClients() && (
                  <button className="btn-delete" onClick={() => setDeleteModal({ show: true, client })}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Client Modal */}
      {viewModal.show && (
        <div className="modal-overlay" onClick={() => setViewModal({ show: false, client: null, bookings: [] })}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 Client Profile</h2>
              <button className="close-btn" onClick={() => setViewModal({ show: false, client: null, bookings: [] })}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Personal Information</h3>
                <p><strong>Name:</strong> {viewModal.client.firstName} {viewModal.client.lastName}</p>
                <p><strong>Phone:</strong> {viewModal.client.phone}</p>
                <p><strong>Email:</strong> {viewModal.client.email || 'N/A'}</p>
                <p><strong>Category:</strong> <span className="category-badge-small" style={getCategoryStyle(viewModal.client.category)}>{getCategoryIcon(viewModal.client.category)} {getCategoryDisplayName(viewModal.client.category)}</span></p>
              </div>
              {canViewClientStats() && (
                <>
                  <div className="detail-section">
                    <h3>Statistics</h3>
                    <p><strong>Total Visits:</strong> {viewModal.client.totalVisits || 0}</p>
                    <p><strong>Total Spent:</strong> KES {viewModal.client.totalSpent || 0}</p>
                    <p><strong>Last Visit:</strong> {viewModal.client.lastVisit ? new Date(viewModal.client.lastVisit).toLocaleDateString() : 'Never'}</p>
                  </div>
                  <div className="detail-section">
                    <h3>Booking History</h3>
                    {viewModal.bookings.length === 0 ? (
                      <p>No booking history</p>
                    ) : (
                      <div className="booking-history-list">
                        {viewModal.bookings.map((booking, idx) => (
                          <div key={idx} className="history-item">
                            <p><strong>{new Date(booking.scheduledDate).toLocaleDateString()}</strong></p>
                            <p>{booking.services?.map(s => s.serviceName).join(', ')}</p>
                            <p>KES {booking.totalPrice} - {booking.status}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewModal({ show: false, client: null, bookings: [] })}>Close</button>
              <button className="btn-primary" onClick={() => handleBookAppointment(viewModal.client)}>Book Appointment</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editModal.show && (
        <div className="modal-overlay" onClick={() => setEditModal({ show: false, client: null })}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Client</h2>
              <button className="close-btn" onClick={() => setEditModal({ show: false, client: null })}>×</button>
            </div>
            <div className="modal-body">
              <h3 className="section-title">📋 Basic Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={editModal.client.firstName}
                    onChange={(e) => setEditModal({ ...editModal, client: { ...editModal.client, firstName: e.target.value } })}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={editModal.client.lastName}
                    onChange={(e) => setEditModal({ ...editModal, client: { ...editModal.client, lastName: e.target.value } })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={editModal.client.phone}
                  onChange={(e) => setEditModal({ ...editModal, client: { ...editModal.client, phone: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editModal.client.email || ''}
                  onChange={(e) => setEditModal({ ...editModal, client: { ...editModal.client, email: e.target.value } })}
                />
              </div>

              <h3 className="section-title">📅 Special Dates</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth 🎂</label>
                  <input
                    type="date"
                    value={editModal.client.dateOfBirth ? new Date(editModal.client.dateOfBirth).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditModal({ ...editModal, client: { ...editModal.client, dateOfBirth: e.target.value } })}
                  />
                </div>
                <div className="form-group">
                  <label>Anniversary 💍</label>
                  <input
                    type="date"
                    value={editModal.client.anniversary ? new Date(editModal.client.anniversary).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEditModal({ ...editModal, client: { ...editModal.client, anniversary: e.target.value } })}
                  />
                </div>
              </div>

              <h3 className="section-title">👤 Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={editModal.client.gender || ''}
                    onChange={(e) => setEditModal({ ...editModal, client: { ...editModal.client, gender: e.target.value } })}
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
                    value={editModal.client.occupation || ''}
                    onChange={(e) => setEditModal({ ...editModal, client: { ...editModal.client, occupation: e.target.value } })}
                  />
                </div>
              </div>

              <h3 className="section-title">💇 Hair & Beauty Preferences</h3>
              <div className="form-group">
                <label>Hair Type</label>
                <select
                  value={editModal.client.preferences?.hairType || ''}
                  onChange={(e) => setEditModal({ 
                    ...editModal, 
                    client: { 
                      ...editModal.client, 
                      preferences: { ...editModal.client.preferences, hairType: e.target.value } 
                    } 
                  })}
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
                  value={editModal.client.preferences?.allergies || ''}
                  onChange={(e) => setEditModal({ 
                    ...editModal, 
                    client: { 
                      ...editModal.client, 
                      preferences: { ...editModal.client.preferences, allergies: e.target.value } 
                    } 
                  })}
                />
              </div>
              <div className="form-group">
                <label>Skin Sensitivity</label>
                <input
                  type="text"
                  value={editModal.client.preferences?.skinSensitivity || ''}
                  onChange={(e) => setEditModal({ 
                    ...editModal, 
                    client: { 
                      ...editModal.client, 
                      preferences: { ...editModal.client.preferences, skinSensitivity: e.target.value } 
                    } 
                  })}
                />
              </div>
              <div className="form-group">
                <label>Additional Notes</label>
                <textarea
                  rows="3"
                  value={editModal.client.preferences?.notes || ''}
                  onChange={(e) => setEditModal({ 
                    ...editModal, 
                    client: { 
                      ...editModal.client, 
                      preferences: { ...editModal.client.preferences, notes: e.target.value } 
                    } 
                  })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setEditModal({ show: false, client: null })}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Modal */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ show: false, client: null })}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🗑️ Delete Client</h2>
              <button className="close-btn" onClick={() => setDeleteModal({ show: false, client: null })}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this client?</p>
              <p><strong>{deleteModal.client?.firstName} {deleteModal.client?.lastName}</strong></p>
              <p className="warning-text">⚠️ This action cannot be undone. All booking history will be preserved but the client record will be removed.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setDeleteModal({ show: false, client: null })}>Cancel</button>
              <button className="btn-danger" onClick={handleDeleteClient}>Delete Client</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
