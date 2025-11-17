import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MyBookings.css';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ show: false, booking: null, fee: 0 });
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client/bookings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCancellationFee = (booking) => {
    const now = new Date();
    const bookingDate = new Date(booking.scheduledDate);
    const hoursUntilBooking = (bookingDate - now) / (1000 * 60 * 60);
    
    // If less than 48 hours, charge 100 KSh fee
    return hoursUntilBooking < 48 ? 100 : 0;
  };

  const handleCancelClick = (booking) => {
    const fee = calculateCancellationFee(booking);
    setCancelModal({ show: true, booking, fee });
  };

  const handleCancelBooking = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/v1/client/bookings/${cancelModal.booking._id}/cancel`,
        { cancellationFee: cancelModal.fee },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchBookings();
      setCancelModal({ show: false, booking: null, fee: 0 });
      
      if (cancelModal.fee > 0) {
        setSuccessMessage(`✅ Booking cancelled. A cancellation fee of KSh ${cancelModal.fee} has been logged to your account.`);
      } else {
        setSuccessMessage('✅ Booking cancelled successfully!');
      }
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError('❌ Failed to cancel booking. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="bookings-page">
      <div className="bookings-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>My Bookings</h1>
      </div>

      {successMessage && <div className="success-message">{successMessage}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="bookings-container">
        {bookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings yet</p>
            <button onClick={() => navigate('/book')} className="btn btn-primary">
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => (
              <div key={booking._id} className="booking-item">
                  <div className="booking-date">
                    <div className="date-day">
                      {new Date(booking.scheduledDate).getDate()}
                    </div>
                    <div className="date-month">
                      {new Date(booking.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                  <div className="booking-details">
                    <h3>{booking.services?.map(s => s.serviceName).join(', ')}</h3>
                    <p className="booking-time">
                      {new Date(booking.scheduledDate).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {(booking.assignedTo || booking.stylistId) && (
                      <p className="booking-stylist">
                        with {booking.assignedTo 
                          ? `${booking.assignedTo.firstName} ${booking.assignedTo.lastName}`
                          : booking.stylistId 
                            ? `${booking.stylistId.firstName} ${booking.stylistId.lastName}`
                            : 'Staff Member'
                        }
                      </p>
                    )}
                  </div>
                  <div className="booking-status">
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status}
                    </span>
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && new Date(booking.scheduledDate) > new Date() && (
                      <button 
                        className="btn-cancel-booking"
                        onClick={() => handleCancelClick(booking)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal.show && (
        <div className="modal-overlay" onClick={() => setCancelModal({ show: false, booking: null, fee: 0 })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cancel Booking</h2>
              <button className="close-btn" onClick={() => setCancelModal({ show: false, booking: null, fee: 0 })}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel this booking?</p>
              <div className="booking-summary">
                <p><strong>Service:</strong> {cancelModal.booking?.services?.map(s => s.serviceName).join(', ')}</p>
                <p><strong>Date:</strong> {new Date(cancelModal.booking?.scheduledDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {new Date(cancelModal.booking?.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              {cancelModal.fee > 0 && (
                <div className="fee-warning">
                  <p>⚠️ <strong>Cancellation Fee:</strong> KSh {cancelModal.fee}</p>
                  <p className="fee-note">This booking is within 48 hours. A cancellation fee will be logged to your account.</p>
                </div>
              )}
              {cancelModal.fee === 0 && (
                <div className="fee-info">
                  <p>✅ No cancellation fee (more than 48 hours notice)</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setCancelModal({ show: false, booking: null, fee: 0 })}>
                Keep Booking
              </button>
              <button className="btn-danger" onClick={handleCancelBooking}>
                {cancelModal.fee > 0 ? `Cancel & Pay KSh ${cancelModal.fee}` : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
