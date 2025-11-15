import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BookingCalendar from '../components/BookingCalendar';
import './AddBooking.css';

export default function AddBooking() {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    clientId: '',
    type: 'reserved',
    scheduledDate: '',
    scheduledTime: '',
    services: [],
    assignedTo: '',
    customerInstructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    phone: '+254',
    email: '',
    dateOfBirth: '',
    gender: '',
    referralSource: '',
    referredBy: '',
    hairType: '',
    instagramHandle: '',
    tiktokHandle: '',
    smsConsent: true,
    whatsappConsent: true,
    emailConsent: false
  });
  const [showSuggestServiceModal, setShowSuggestServiceModal] = useState(false);
  const [suggestedService, setSuggestedService] = useState({
    name: '',
    description: ''
  });
  const [modalError, setModalError] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const navigate = useNavigate();

  // Calculate total duration from selected services
  const totalDuration = formData.services.reduce((sum, s) => sum + (s.duration || 0), 0);

  useEffect(() => {
    fetchData();
    
    // Check if a client was pre-selected from Clients page
    const selectedClient = sessionStorage.getItem('selectedClient');
    if (selectedClient) {
      try {
        const client = JSON.parse(selectedClient);
        setFormData(prev => ({ ...prev, clientId: client._id }));
        sessionStorage.removeItem('selectedClient'); // Clear after use
      } catch (error) {
        console.error('Error parsing selected client:', error);
      }
    }
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [clientsRes, servicesRes, staffRes] = await Promise.all([
        axios.get('http://localhost:5000/api/v1/clients', config),
        axios.get('http://localhost:5000/api/v1/services', config),
        axios.get('http://localhost:5000/api/v1/admin/staff', config).catch((err) => {
          console.error('Staff fetch error:', err.response?.status, err.response?.data);
          setError(`Staff loading failed: ${err.response?.data?.message || err.message}`);
          return { data: { data: [] } };
        })
      ]);

      setClients(clientsRes.data.data || []);
      setServices(servicesRes.data.data || []);
      setStaff(staffRes.data.data || []);
      console.log('Staff loaded:', staffRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please refresh the page.');
    }
  };

  const handleSlotSelect = (slot) => {
    const slotDate = new Date(slot.time);
    setFormData({
      ...formData,
      scheduledDate: slotDate.toISOString().split('T')[0],
      scheduledTime: `${slotDate.getHours().toString().padStart(2, '0')}:00`
    });
    setSelectedSlot(slot);
    setShowCalendar(false);
  };

  const handleServiceToggle = (service) => {
    const exists = formData.services.find(s => s.serviceId === service._id);
    
    if (exists) {
      setFormData({
        ...formData,
        services: formData.services.filter(s => s.serviceId !== service._id)
      });
    } else {
      setFormData({
        ...formData,
        services: [...formData.services, {
          serviceId: service._id,
          serviceName: service.name,
          price: service.price,
          duration: service.duration
        }]
      });
    }
  };

  const handleSuggestService = async () => {
    if (!suggestedService.name || !suggestedService.description) {
      setModalError('Please fill in service name and description');
      setTimeout(() => setModalError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      // For now, we'll just show a success message
      // In production, you might want to save this to a "suggested services" collection
      setSuccessMessage(`✓ Service suggestion "${suggestedService.name}" submitted! We'll review and add it soon.`);
      setTimeout(() => setSuccessMessage(''), 5000);
      
      // Reset and close modal
      setSuggestedService({ name: '', description: '' });
      setModalError('');
      setShowSuggestServiceModal(false);
    } catch (err) {
      console.error('Suggest service error:', err);
      setModalError('Failed to submit suggestion');
      setTimeout(() => setModalError(''), 3000);
    }
  };

  const handleQuickAddClient = async () => {
    if (!newClient.firstName || !newClient.lastName || !newClient.phone) {
      setError('Please fill in required fields (First Name, Last Name, Phone)');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      // Build client data object
      const clientData = {
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        phone: newClient.phone,
        email: newClient.email || undefined,
        dateOfBirth: newClient.dateOfBirth || undefined,
        gender: newClient.gender || undefined,
        referralSource: newClient.referralSource || undefined,
        referredBy: newClient.referredBy || undefined,
        marketingConsent: {
          sms: newClient.smsConsent,
          email: newClient.emailConsent,
          whatsapp: newClient.whatsappConsent
        },
        communicationPreference: newClient.whatsappConsent ? 'whatsapp' : 'sms'
      };

      // Add optional fields
      if (newClient.instagramHandle || newClient.tiktokHandle) {
        clientData.socialMedia = {};
        if (newClient.instagramHandle) clientData.socialMedia.instagram = newClient.instagramHandle;
        if (newClient.tiktokHandle) clientData.socialMedia.tiktok = newClient.tiktokHandle;
      }
      if (newClient.hairType) {
        clientData.preferences = { hairType: newClient.hairType };
      }

      const response = await axios.post('http://localhost:5000/api/v1/clients', clientData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add new client to list and select it
      const createdClient = response.data.data;
      const updatedClients = [...clients, createdClient];
      setClients(updatedClients);
      
      // Update form data with new client ID while preserving other fields
      setFormData(prev => ({ ...prev, clientId: createdClient._id }));
      
      setShowNewClientForm(false);
      
      // Reset new client form
      setNewClient({ 
        firstName: '', lastName: '', phone: '+254', email: '', dateOfBirth: '',
        gender: '', referralSource: '', referredBy: '', hairType: '', instagramHandle: '',
        tiktokHandle: '', smsConsent: true, whatsappConsent: true, emailConsent: false
      });

      // Show success message
      setSuccessMessage(`✓ ${createdClient.firstName} ${createdClient.lastName} added successfully!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Add client error:', err);
      setError(err.response?.data?.message || 'Failed to add client');
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const scheduledDate = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

      await axios.post('http://localhost:5000/api/v1/bookings', {
        clientId: formData.clientId,
        type: formData.type,
        scheduledDate,
        services: formData.services,
        assignedTo: formData.assignedTo || undefined,
        customerInstructions: formData.customerInstructions
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-booking-container">
      <div className="add-booking-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
        <h1>Add New Booking</h1>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label>Client *</label>
          <select
            value={formData.clientId}
            onChange={(e) => {
              if (e.target.value === 'ADD_NEW') {
                setShowNewClientForm(true);
                setFormData({ ...formData, clientId: '' });
              } else {
                setFormData({ ...formData, clientId: e.target.value });
              }
            }}
            required
          >
            <option value="">Select a client</option>
            <option value="ADD_NEW" style={{ fontWeight: 'bold', color: '#6B46C1' }}>
              ➕ Add New Client
            </option>
            {clients.map(client => (
              <option key={client._id} value={client._id}>
                {client.firstName} {client.lastName} - {client.phone}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Add Client Form - Enhanced */}
        {showNewClientForm && (
          <div className="quick-add-client">
            <h4>✨ Quick Add New Client</h4>
            <p className="quick-subtitle">Capture key info for personalized service & marketing</p>
            
            {/* Basic Info Section */}
            <div className="form-section">
              <div className="section-header">
                <span className="section-icon">👤</span>
                <span className="section-title">Basic Information</span>
              </div>
              
              <div className="quick-form-row">
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="First Name *"
                    value={newClient.firstName}
                    onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Last Name *"
                    value={newClient.lastName}
                    onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="quick-form-row">
                <div className="input-wrapper">
                  <div className="phone-input-wrapper">
                    <span className="phone-prefix">+254</span>
                    <input
                      type="tel"
                      placeholder="712345678"
                      value={newClient.phone.startsWith('+254') ? newClient.phone.slice(4) : newClient.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '');
                        setNewClient({ ...newClient, phone: '+254' + digits });
                      }}
                      required
                      maxLength="9"
                    />
                  </div>
                  <span className="input-hint">For booking confirmations & reminders</span>
                </div>
                <div className="input-wrapper">
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  />
                  <span className="input-hint">For receipts & newsletters</span>
                </div>
              </div>
            </div>

            {/* Personal Details Section */}
            <div className="form-section">
              <div className="section-header">
                <span className="section-icon">🎂</span>
                <span className="section-title">Personal Details (Optional)</span>
              </div>
              
              <div className="quick-form-row">
                <div className="input-wrapper">
                  <label className="input-label">Birthday</label>
                  <input
                    type="date"
                    value={newClient.dateOfBirth}
                    onChange={(e) => setNewClient({ ...newClient, dateOfBirth: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <span className="input-hint">🎁 Send birthday wishes & special offers</span>
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Gender</label>
                  <select
                    value={newClient.gender}
                    onChange={(e) => setNewClient({ ...newClient, gender: e.target.value })}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                  <span className="input-hint">For personalized recommendations</span>
                </div>
              </div>
            </div>

            {/* Hair & Preferences Section */}
            <div className="form-section">
              <div className="section-header">
                <span className="section-icon">💇</span>
                <span className="section-title">Hair & Preferences</span>
              </div>
              
              <div className="quick-form-row">
                <div className="input-wrapper">
                  <label className="input-label">Hair Type</label>
                  <select
                    value={newClient.hairType}
                    onChange={(e) => setNewClient({ ...newClient, hairType: e.target.value })}
                  >
                    <option value="">Select hair type</option>
                    <option value="natural">Natural Hair</option>
                    <option value="relaxed">Relaxed</option>
                    <option value="locs">Locs</option>
                    <option value="braids">Braids</option>
                    <option value="other">Other</option>
                  </select>
                  <span className="input-hint">Helps recommend suitable services</span>
                </div>
              </div>
            </div>

            {/* Social Media Section */}
            <div className="form-section">
              <div className="section-header">
                <span className="section-icon">📱</span>
                <span className="section-title">Social Media (Optional)</span>
              </div>
              
              <div className="quick-form-row">
                <div className="input-wrapper">
                  <label className="input-label">Instagram Handle</label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={newClient.instagramHandle}
                    onChange={(e) => setNewClient({ ...newClient, instagramHandle: e.target.value })}
                  />
                  <span className="input-hint">For tagging in posts (with permission)</span>
                </div>
                <div className="input-wrapper">
                  <label className="input-label">TikTok Handle</label>
                  <input
                    type="text"
                    placeholder="@username"
                    value={newClient.tiktokHandle}
                    onChange={(e) => setNewClient({ ...newClient, tiktokHandle: e.target.value })}
                  />
                  <span className="input-hint">For tagging in TikTok videos</span>
                </div>
              </div>
            </div>

            {/* Marketing Source Section */}
            <div className="form-section">
              <div className="section-header">
                <span className="section-icon">📊</span>
                <span className="section-title">How They Found Us</span>
              </div>
              
              <div className="input-wrapper">
                <select
                  value={newClient.referralSource}
                  onChange={(e) => setNewClient({ ...newClient, referralSource: e.target.value })}
                >
                  <option value="">How did they hear about us?</option>
                  <option value="social-media">📱 Instagram/Facebook/TikTok</option>
                  <option value="friend">👥 Friend Referral</option>
                  <option value="google">🔍 Google Search</option>
                  <option value="walk-by">🚶 Walked By</option>
                  <option value="other">Other</option>
                </select>
                <span className="input-hint">Helps us understand what marketing works</span>
              </div>
            </div>

            {/* Referral Tracking */}
            {newClient.referralSource === 'friend' && (
              <div className="referral-section">
                <div className="section-header">
                  <span className="section-icon">🎁</span>
                  <span className="section-title">Referral Tracking</span>
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Who referred them?</label>
                  <select
                    value={newClient.referredBy}
                    onChange={(e) => setNewClient({ ...newClient, referredBy: e.target.value })}
                  >
                    <option value="">Select existing client (optional)</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id}>
                        {client.firstName} {client.lastName} - {client.phone}
                      </option>
                    ))}
                  </select>
                  <span className="input-hint">💡 Track referrals to reward loyal clients who bring friends</span>
                </div>
              </div>
            )}

            {/* Marketing Consent Section */}
            <div className="marketing-consent">
              <p className="consent-title">
                <span>📱</span>
                <span>Communication Preferences</span>
              </p>
              <p className="consent-subtitle">How can we send appointment reminders & special offers?</p>
              <div className="consent-options">
                <label className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={newClient.smsConsent}
                    onChange={(e) => setNewClient({ ...newClient, smsConsent: e.target.checked })}
                  />
                  <span>📱 SMS</span>
                </label>
                <label className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={newClient.whatsappConsent}
                    onChange={(e) => setNewClient({ ...newClient, whatsappConsent: e.target.checked })}
                  />
                  <span>💬 WhatsApp</span>
                </label>
                <label className="consent-checkbox">
                  <input
                    type="checkbox"
                    checked={newClient.emailConsent}
                    onChange={(e) => setNewClient({ ...newClient, emailConsent: e.target.checked })}
                  />
                  <span>📧 Email</span>
                </label>
              </div>
            </div>

            <div className="quick-form-actions">
              <button type="button" onClick={handleQuickAddClient} className="btn-add">
                ✓ Add Client & Continue
              </button>
              <button type="button" onClick={() => setShowNewClientForm(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Booking Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            required
          >
            <option value="reserved">Reserved</option>
            <option value="walk-in">Walk-in</option>
          </select>
        </div>

        <div className="form-group">
          <div className="services-header">
            <label>Services * (Select at least one)</label>
            {(() => {
              const userStr = localStorage.getItem('user');
              const user = userStr ? JSON.parse(userStr) : null;
              const canManageServices = user?.role === 'owner' || user?.permissions?.canManageServices;
              return !canManageServices && (
                <button 
                  type="button" 
                  className="btn-suggest-service"
                  onClick={() => setShowSuggestServiceModal(true)}
                >
                  💡 Suggest New Service
                </button>
              );
            })()}
          </div>
          <div className="services-grid">
            {services.map(service => (
              <div
                key={service._id}
                className={`service-card ${formData.services.find(s => s.serviceId === service._id) ? 'selected' : ''}`}
                onClick={() => handleServiceToggle(service)}
              >
                <h4>{service.name}</h4>
                <p>KES {service.price}</p>
                <p>{service.duration} mins</p>
              </div>
            ))}
          </div>
        </div>

        {/* Suggest Service Modal */}
        {showSuggestServiceModal && (
          <div className="modal-overlay" onClick={() => setShowSuggestServiceModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>💡 Suggest New Service</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowSuggestServiceModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="modal-body">
                <p className="modal-description">
                  Don't see the service you need? Suggest it here and we'll review it for addition to our service menu.
                </p>

                {modalError && <div className="modal-error-message">{modalError}</div>}
                
                <div className="form-group">
                  <label>Service Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Box Braids, Silk Press, etc."
                    value={suggestedService.name}
                    onChange={(e) => setSuggestedService({ ...suggestedService, name: e.target.value })}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    placeholder="Describe the service, what it includes, and any special requirements..."
                    value={suggestedService.description}
                    onChange={(e) => setSuggestedService({ ...suggestedService, description: e.target.value })}
                    rows="4"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn-submit"
                  onClick={handleSuggestService}
                >
                  Submit Suggestion
                </button>
                <button 
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setSuggestedService({ name: '', description: '' });
                    setModalError('');
                    setShowSuggestServiceModal(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Assign To Staff Member * {staff.length > 0 && `(${staff.length} available)`}</label>
          <select
            value={formData.assignedTo}
            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
          >
            <option value="">Select staff member (required for calendar)</option>
            {staff.length === 0 && <option disabled>Loading staff...</option>}
            {staff.map(member => (
              <option key={member._id} value={member._id}>
                {member.firstName} {member.lastName} ({member.role})
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Time *</label>
            <div className="time-selection">
              <input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                required
                readOnly
              />
              <button 
                type="button"
                className="btn-calendar"
                onClick={() => {
                  console.log('Calendar button clicked. Show:', !showCalendar);
                  console.log('Date:', formData.scheduledDate, 'Staff:', formData.assignedTo, 'Services:', formData.services.length);
                  setShowCalendar(!showCalendar);
                }}
                disabled={!formData.scheduledDate || !formData.assignedTo || formData.services.length === 0}
              >
                📅 View Available Slots
              </button>
            </div>
            {!formData.scheduledDate && <p className="help-text">⚠️ Select a date first</p>}
            {!formData.assignedTo && <p className="help-text">⚠️ Select a staff member first</p>}
            {formData.services.length === 0 && <p className="help-text">⚠️ Select at least one service first</p>}
            {formData.scheduledDate && formData.assignedTo && formData.services.length > 0 && (
              <p className="help-text success">✓ Ready to view available slots</p>
            )}
          </div>
        </div>

        {showCalendar && formData.scheduledDate && formData.assignedTo && (
          <div className="calendar-container">
            <BookingCalendar
              selectedDate={formData.scheduledDate}
              staffId={formData.assignedTo}
              serviceDuration={totalDuration}
              onSelectSlot={handleSlotSelect}
            />
          </div>
        )}

        <div className="form-group">
          <label>Customer Instructions</label>
          <textarea
            value={formData.customerInstructions}
            onChange={(e) => setFormData({ ...formData, customerInstructions: e.target.value })}
            rows="4"
            placeholder="Any special requests or notes..."
          />
        </div>

        <button type="submit" disabled={loading || formData.services.length === 0}>
          {loading ? 'Creating...' : 'Create Booking'}
        </button>
      </form>
    </div>
  );
}
