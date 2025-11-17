import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BookAppointment.css';

export default function BookAppointment() {
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [salonName, setSalonName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
    fetchSalonInfo();
  }, []);

  const fetchSalonInfo = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const clientData = JSON.parse(localStorage.getItem('clientData'));
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client-auth/salons`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const salon = response.data.data.find(s => s._id === clientData.tenantId);
      if (salon) setSalonName(salon.businessName);
    } catch (err) {
      console.error('Error fetching salon:', err);
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('clientToken');
      
      if (!token) {
        setError('Please login to book an appointment.');
        navigate('/login');
        return;
      }
      
      console.log('Fetching services...');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client/services`,
        { 
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      console.log('Services response:', response.data);
      setServices(response.data.data || []);
      
      if (!response.data.data || response.data.data.length === 0) {
        setError('No services available. Please contact the salon.');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service) => {
    if (selectedServices.find(s => s._id === service._id)) {
      setSelectedServices(selectedServices.filter(s => s._id !== service._id));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('clientToken');
      
      const scheduledDate = new Date(`${date}T${time}`);
      
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/client/bookings`,
        {
          scheduledDate,
          services: selectedServices.map(s => ({
            serviceId: s._id,
            serviceName: s.name,
            price: s.price,
            duration: s.duration
          })),
          customerInstructions: notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('✅ Booking created successfully!');
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err) {
      console.error('Booking error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="book-page">
      <div className="book-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <div>
          <h1>📅 Book Appointment</h1>
          {salonName && (
            <div className="salon-badge" style={{marginTop: '8px'}}>
              <span className="salon-icon">🏢</span>
              <span className="salon-name">{salonName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="book-container">
        <div className="card">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Select Services</h2>
              {loading && <div className="loading">Loading services...</div>}
              {!loading && services.length === 0 && (
                <div className="empty-state">
                  <p>No services available at this salon.</p>
                  <small>Please contact the salon or try again later.</small>
                </div>
              )}
              {!loading && services.length > 0 && (
                <div className="services-grid">
                  {services.map(service => (
                    <div
                      key={service._id}
                      className={`service-card ${selectedServices.find(s => s._id === service._id) ? 'selected' : ''}`}
                      onClick={() => toggleService(service)}
                    >
                      <h3>{service.name}</h3>
                      <p className="service-price">KES {service.price}</p>
                      <p className="service-duration">{service.duration} mins</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-section">
              <h2>Select Date & Time</h2>
              <div className="datetime-grid">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time *</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h2>Additional Notes</h2>
              <div className="form-group">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="4"
                  placeholder="Any special requests or preferences..."
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || selectedServices.length === 0}
            >
              {loading ? 'Booking...' : '✨ Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
