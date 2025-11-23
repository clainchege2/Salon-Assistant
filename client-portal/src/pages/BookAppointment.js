import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';
import './BookAppointment.css';

export default function BookAppointment() {
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [salonName, setSalonName] = useState('');
  const [salonTier, setSalonTier] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
    fetchSalonInfo();
  }, []);

  // Fetch staff only after we know the salon tier
  useEffect(() => {
    if (salonTier && salonTier !== 'free') {
      fetchStaff();
    }
  }, [salonTier]);

  useEffect(() => {
    if (date) {
      fetchAvailability();
    }
  }, [date, selectedStaff]);

  const fetchSalonInfo = async () => {
    const token = localStorage.getItem('clientToken');
    const clientData = JSON.parse(localStorage.getItem('clientData'));
    
    try {
      // Get salon details including tier
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client-bookings/salon-info`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.data) {
        setSalonName(response.data.data.businessName);
        setSalonTier(response.data.data.subscriptionTier || 'free');
      }
    } catch (err) {
      console.error('Error fetching salon:', err);
      // Fallback: try to get from salons list
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/v1/client-auth/salons`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const salon = response.data.data.find(s => s._id === clientData.tenantId);
        if (salon) {
          setSalonName(salon.businessName);
          setSalonTier('free'); // Default to free if tier not available
        }
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr);
      }
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('clientToken');
      
      if (!token) {
        setToast({ message: 'Please login to book an appointment.', type: 'warning' });
        setTimeout(() => navigate('/login'), 1500);
        return;
      }
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client-bookings/services`,
        { 
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setServices(response.data.data || []);
      
      if (!response.data.data || response.data.data.length === 0) {
        setToast({ message: 'No services available at this salon.', type: 'info' });
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      setToast({ message: error.response?.data?.message || 'Failed to load services. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      console.log('Fetching staff...');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client-bookings/staff`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Staff response:', response.data);
      setStaff(response.data.data || []);
      if (!response.data.data || response.data.data.length === 0) {
        console.warn('No staff members found');
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const fetchAvailability = async () => {
    if (!date) return;
    
    setLoadingSlots(true);
    try {
      const token = localStorage.getItem('clientToken');
      const params = new URLSearchParams({ date });
      if (selectedStaff) params.append('staffId', selectedStaff);
      
      console.log('Fetching availability for date:', date, 'staffId:', selectedStaff);
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client-bookings/availability?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Availability response:', response.data);
      console.log('Slots:', response.data.data);
      console.log('Available slots count:', response.data.data?.filter(s => s.available).length);
      
      setAvailableSlots(response.data.data || []);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoadingSlots(false);
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
    setToast(null);

    setLoading(true);

    try {
      const token = localStorage.getItem('clientToken');
      
      const scheduledDate = new Date(`${date}T${time}`);
      
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/client-bookings`,
        {
          scheduledDate,
          services: selectedServices.map(s => ({
            serviceId: s._id,
            serviceName: s.name,
            price: s.price,
            duration: s.duration
          })),
          stylistId: selectedStaff || null,
          customerInstructions: notes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setToast({ message: 'Booking created successfully!', type: 'success' });
      
      // Refresh availability to show the newly booked slot
      if (date) {
        await fetchAvailability();
      }
      
      setTimeout(() => navigate('/bookings'), 2000);
    } catch (err) {
      console.error('Booking error:', err.response?.data);
      
      // Handle specific error codes
      if (err.response?.status === 409) {
        setToast({ message: 'This time slot was just booked. Please select a different time.', type: 'warning' });
        // Refresh availability
        await fetchAvailability();
      } else {
        setToast({ message: err.response?.data?.message || 'Failed to create booking. Please try again.', type: 'error' });
      }
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
        <h1>Book Appointment</h1>
      </div>
      {salonName && (
        <div style={{marginBottom: '20px', textAlign: 'center'}}>
          <div className="salon-badge">
            <span className="salon-icon">🏢</span>
            <span className="salon-name">{salonName}</span>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="book-container">
        <div className="card">
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

            {/* Only show stylist selection for Pro and Premium tiers */}
            {salonTier !== 'free' && (
              <div className="form-section">
                <h2>Select Stylist (Optional)</h2>
                <div className="form-group">
                  <label>Preferred Stylist</label>
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                  >
                    <option value="">Any Available Stylist</option>
                    {staff.length === 0 && (
                      <option value="" disabled>Loading staff...</option>
                    )}
                    {staff.map(member => (
                      <option key={member._id} value={member._id}>
                        {member.firstName} {member.lastName}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#86868b', fontSize: '13px', marginTop: '4px', display: 'block' }}>
                    {staff.length === 0 
                      ? 'Loading staff members...' 
                      : selectedStaff 
                        ? '✓ Availability will be filtered for this stylist' 
                        : 'Leave blank to see all available stylists'
                    }
                  </small>
                </div>
              </div>
            )}

            <div className="form-section">
              <h2>Select Date & Time</h2>
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

              {date && (
                <div className="form-group">
                  <label>Available Time Slots *</label>
                  {loadingSlots ? (
                    <div className="loading-slots">Loading available times...</div>
                  ) : availableSlots.length === 0 || !availableSlots.some(slot => slot.available) ? (
                    <div className="empty-state">
                      <p>No available slots for this date</p>
                      <small>Please select a different date{selectedStaff ? ' or choose a different stylist' : ''}</small>
                    </div>
                  ) : (
                    <div className="time-slots-grid">
                      {availableSlots.map(slot => (
                        <button
                          key={slot.hour}
                          type="button"
                          className={`time-slot ${!slot.available ? 'disabled' : ''} ${time === slot.hour ? 'selected' : ''}`}
                          onClick={() => slot.available && setTime(slot.hour)}
                          disabled={!slot.available}
                        >
                          {slot.display}
                          {!slot.available && <span className="booked-badge">Booked</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
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

            <div className="cancellation-policy">
              <h3>💡 Good to Know</h3>
              <p>
                Life happens! You can cancel or reschedule for free anytime up to <strong>2 days (48 hours)</strong> before your appointment.
              </p>
              <p className="policy-note">
                If you need to cancel with less than 2 days notice, there's a small <strong>KSh 100 fee</strong> to help cover our costs. 
                The same fee applies if you're running more than 30 minutes late.
              </p>
              <p className="policy-tip">
                💬 Need to reschedule? Just cancel and book a new time that works better for you!
              </p>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || selectedServices.length === 0 || !time}
            >
              {loading ? 'Booking...' : '✨ Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
