import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Services.css';

export default function Services() {
  const [services, setServices] = useState([]);
  const [pendingSuggestions, setPendingSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  // Check if user can manage services
  const canManageServices = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    
    try {
      const user = JSON.parse(userStr);
      return user.role === 'owner' || user.permissions?.canManageServices === true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch both active services and pending suggestions
      const [servicesRes, suggestionsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/v1/services', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        canManageServices() 
          ? axios.get('http://localhost:5000/api/v1/services/suggestions/pending', {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } })
      ]);
      
      const activeServices = servicesRes.data.data || [];
      const suggestions = suggestionsRes.data.data || [];
      
      // Update pending suggestions state
      setPendingSuggestions(suggestions);
      
      // Only show active services in the main list
      setServices(activeServices);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingSuggestions = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/v1/services/suggestions/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingSuggestions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleApproveSuggestion = async (suggestionId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`http://localhost:5000/api/v1/services/suggestions/${suggestionId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('✓ Service suggestion approved and added!');
      setTimeout(() => setSuccessMessage(''), 3000);
      // Refresh the entire list
      await fetchServices();
    } catch (error) {
      console.error('Error approving suggestion:', error);
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to approve suggestion');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRejectSuggestion = async (suggestionId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5000/api/v1/services/suggestions/${suggestionId}/reject`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage('✓ Service suggestion rejected');
      setTimeout(() => setSuccessMessage(''), 3000);
      // Refresh the entire list
      await fetchServices();
    } catch (error) {
      console.error('Error rejecting suggestion:', error);
      setError('Failed to reject suggestion');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAddService = async () => {
    if (!newService.name || !newService.price || !newService.duration) {
      setError('Please fill in all required fields');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = canManageServices() 
        ? 'http://localhost:5000/api/v1/services'
        : 'http://localhost:5000/api/v1/services/suggest';
      
      await axios.post(endpoint, {
        ...newService,
        price: parseFloat(newService.price),
        duration: parseInt(newService.duration)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddModal(false);
      setNewService({ name: '', description: '', price: '', duration: '', category: '' });
      
      if (canManageServices()) {
        setSuccessMessage('✓ Service added successfully!');
        fetchServices();
      } else {
        setSuccessMessage('✓ Service suggestion sent to owner for approval!');
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding service:', error);
      setError(canManageServices() ? 'Failed to add service' : 'Failed to send suggestion');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditService = (service) => {
    setEditingService({
      id: service._id,
      name: service.name,
      description: service.description || '',
      price: service.price,
      duration: service.duration,
      category: service.category || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateService = async () => {
    if (!editingService.name || !editingService.price || !editingService.duration) {
      setError('Please fill in all required fields');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`http://localhost:5000/api/v1/services/${editingService.id}`, {
        name: editingService.name,
        description: editingService.description,
        price: parseFloat(editingService.price),
        duration: parseInt(editingService.duration),
        category: editingService.category
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowEditModal(false);
      setEditingService(null);
      setSuccessMessage('✓ Service updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchServices();
    } catch (error) {
      console.error('Error updating service:', error);
      setError('Failed to update service');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteClick = (service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5000/api/v1/services/${serviceToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMessage(`✓ ${serviceToDelete.name} deleted successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowDeleteModal(false);
      setServiceToDelete(null);
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Failed to delete service');
      setTimeout(() => setError(''), 3000);
      setShowDeleteModal(false);
      setServiceToDelete(null);
    }
  };

  if (loading) return <div className="loading">Loading services...</div>;

  return (
    <div className="services-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>✂️ Services</h1>
        <div className="header-actions">
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
          {canManageServices() ? (
            <button onClick={() => setShowAddModal(true)} className="add-btn">
              ➕ Add Service
            </button>
          ) : (
            <button onClick={() => setShowAddModal(true)} className="add-btn suggest">
              💡 Suggest New Service
            </button>
          )}
        </div>
      </div>

      {/* Show notification badge if there are pending suggestions */}
      {/* Pending Suggestions Section */}
      {canManageServices() && pendingSuggestions.length > 0 && (
        <div className="pending-suggestions-section">
          <h2>💡 Pending Service Suggestions ({pendingSuggestions.length})</h2>
          <div className="suggestions-list">
            {pendingSuggestions.map(suggestion => (
              <div key={suggestion._id} className="suggestion-card">
                <div className="suggestion-header">
                  <h3>{suggestion.name}</h3>
                  <span className="suggested-by">
                    Suggested by {suggestion.suggestedBy?.firstName} {suggestion.suggestedBy?.lastName}
                  </span>
                </div>
                <div className="suggestion-details">
                  <p><strong>Category:</strong> {suggestion.category}</p>
                  <p><strong>Price:</strong> KES {suggestion.price}</p>
                  <p><strong>Duration:</strong> {suggestion.duration} mins</p>
                  {suggestion.description && <p><strong>Description:</strong> {suggestion.description}</p>}
                </div>
                <div className="suggestion-actions">
                  <button 
                    className="btn-approve"
                    onClick={() => handleApproveSuggestion(suggestion._id)}
                  >
                    ✓ Approve
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => handleRejectSuggestion(suggestion._id)}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {services.length === 0 && pendingSuggestions.length === 0 ? (
        <div className="empty-state">
          <p>📭 No services yet</p>
          <button onClick={() => setShowAddModal(true)} className="add-btn">
            Add Your First Service
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="services-table-container">
          <table className="services-table">
            <thead>
              <tr>
                <th>Service Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => {
                const isPending = service.status === 'pending';
                return (
                <tr key={service._id} className={isPending ? 'pending-row' : ''}>
                  <td>
                    <div className="service-name-cell">
                      <strong>{service.name}</strong>
                      {isPending && (
                        <span className="pending-badge" title={`Suggested by ${service.suggestedBy?.firstName} ${service.suggestedBy?.lastName}`}>
                          💡 Pending
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{service.category || '-'}</td>
                  <td className="price-cell">KES {service.price}</td>
                  <td>{service.duration} mins</td>
                  <td className="description-cell">{service.description || '-'}</td>
                  <td>
                    {isPending && canManageServices() ? (
                      <div className="table-actions">
                        <button 
                          className="btn-action approve"
                          onClick={() => handleApproveSuggestion(service._id)}
                          title="Approve and activate service"
                        >
                          ✓ Approve
                        </button>
                        <button 
                          className="btn-action reject"
                          onClick={() => handleRejectSuggestion(service._id)}
                          title="Reject suggestion"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    ) : canManageServices() ? (
                      <div className="table-actions">
                        <button 
                          className="btn-action edit"
                          onClick={() => handleEditService(service)}
                          title="Edit service"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="delete-btn-small"
                          onClick={() => handleDeleteClick(service)}
                          title="Delete service"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <span className="no-permission">View only</span>
                    )}
                  </td>
                </tr>
              )}
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="services-grid">
          {services.map(service => (
            <div key={service._id} className="service-card">
              <div className="service-header">
                <h3>{service.name}</h3>
                {canManageServices() && (
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteClick(service)}
                    title="Delete service"
                  >
                    <span className="delete-icon">×</span>
                  </button>
                )}
              </div>

              {service.description && (
                <p className="service-description">{service.description}</p>
              )}

              <div className="service-details">
                <div className="detail">
                  <span className="label">Price</span>
                  <span className="value price">KES {service.price}</span>
                </div>
                <div className="detail">
                  <span className="label">Duration</span>
                  <span className="value">{service.duration} mins</span>
                </div>
                {service.category && (
                  <div className="detail">
                    <span className="label">Category</span>
                    <span className="value">{service.category}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Service Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{canManageServices() ? '✨ Add New Service' : '💡 Suggest New Service'}</h2>
            {!canManageServices() && (
              <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
                Your suggestion will be sent to the salon owner for approval.
              </p>
            )}

            <div className="form-group">
              <label>Service Name *</label>
              <input
                type="text"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                placeholder="e.g., Box Braids, Silk Press"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                placeholder="Brief description of the service..."
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (KES) *</label>
                <input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                  placeholder="3500"
                />
              </div>

              <div className="form-group">
                <label>Duration (minutes) *</label>
                <input
                  type="number"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                  placeholder="180"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={newService.category}
                onChange={(e) => setNewService({ ...newService, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="Braids">Braids</option>
                <option value="Weaves">Weaves</option>
                <option value="Natural Hair">Natural Hair</option>
                <option value="Locs">Locs</option>
                <option value="Treatments">Treatments</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleAddService}>
                {canManageServices() ? '💾 Add Service' : '📤 Send Suggestion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Service Modal */}
      {showEditModal && editingService && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>✏️ Edit Service</h2>

            <div className="form-group">
              <label>Service Name *</label>
              <input
                type="text"
                value={editingService.name}
                onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                placeholder="e.g., Box Braids, Silk Press"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                value={editingService.description}
                onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                placeholder="Brief description of the service..."
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Price (KES) *</label>
                <input
                  type="number"
                  value={editingService.price}
                  onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
                  placeholder="3500"
                />
              </div>

              <div className="form-group">
                <label>Duration (minutes) *</label>
                <input
                  type="number"
                  value={editingService.duration}
                  onChange={(e) => setEditingService({ ...editingService, duration: e.target.value })}
                  placeholder="180"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={editingService.category}
                onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="Braids">Braids</option>
                <option value="Weaves">Weaves</option>
                <option value="Natural Hair">Natural Hair</option>
                <option value="Locs">Locs</option>
                <option value="Treatments">Treatments</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleUpdateService}>
                💾 Update Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && serviceToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Delete Service</h2>
            <p className="delete-warning">
              Are you sure you want to delete <strong>{serviceToDelete.name}</strong>?
            </p>
            <p className="delete-note">
              This action cannot be undone. Any bookings using this service will need to be updated.
            </p>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => {
                setShowDeleteModal(false);
                setServiceToDelete(null);
              }}>
                Cancel
              </button>
              <button className="btn-delete-confirm" onClick={handleDeleteService}>
                🗑️ Yes, Delete Service
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-toast">{error}</div>}
      {successMessage && <div className="success-toast">{successMessage}</div>}
    </div>
  );
}
