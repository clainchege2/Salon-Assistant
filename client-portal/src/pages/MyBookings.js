import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MyBookings.css';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ show: false, booking: null, fee: 0 });
  const [successMessage, setSuccessMessage] = useState('');
  const [lastCancelledBooking, setLastCancelledBooking] = useState(null);
  const [error, setError] = useState('');
  const [outsideClickCount, setOutsideClickCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  // Handle clicks outside the alert to dismiss it
  useEffect(() => {
    if (!lastCancelledBooking) {
      setOutsideClickCount(0);
      return;
    }

    const handleClickOutside = (e) => {
      // Check if click is outside the success message
      const successMsg = document.querySelector('.success-message');
      if (successMsg && !successMsg.contains(e.target)) {
        setOutsideClickCount(prev => {
          const newCount = prev + 1;
          
          if (newCount === 1) {
            // First click: show confirmation
            setSuccessMessage('⚠️ Click anywhere again to dismiss. You can still cancel this booking if needed.');
          } else if (newCount >= 2) {
            // Second click: dismiss
            setSuccessMessage('');
            setLastCancelledBooking(null);
            setOutsideClickCount(0);
          }
          
          return newCount;
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [lastCancelledBooking]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client/bookings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Sort bookings: active bookings first, then by date
      const sortedBookings = (response.data.data || []).sort((a, b) => {
        const now = new Date();
        const aDate = new Date(a.scheduledDate);
        const bDate = new Date(b.scheduledDate);
        
        // Define active statuses
        const activeStatuses = ['pending', 'confirmed', 'in-progress'];
        const aIsActive = activeStatuses.includes(a.status) && aDate >= now;
        const bIsActive = activeStatuses.includes(b.status) && bDate >= now;
        
        // Active bookings come first
        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;
        
        // Within same category (both active or both inactive), sort by date
        // Active bookings: upcoming first (ascending)
        // Inactive bookings: most recent first (descending)
        if (aIsActive && bIsActive) {
          return aDate - bDate; // Upcoming first
        } else {
          return bDate - aDate; // Most recent first
        }
      });
      
      setBookings(sortedBookings);
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
      const bookingId = cancelModal.booking._id;
      const fee = cancelModal.fee;
      
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/v1/client/bookings/${bookingId}/cancel`,
        { cancellationFee: fee },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchBookings();
      setCancelModal({ show: false, booking: null, fee: 0 });
      
      // Store the cancelled booking info for undo
      setLastCancelledBooking({ id: bookingId, fee });
      setOutsideClickCount(0);
      
      if (fee > 0) {
        setSuccessMessage(`✅ Booking cancelled. A cancellation fee of KSh ${fee} has been logged.`);
      } else {
        setSuccessMessage('✅ Booking cancelled successfully!');
      }
      
      // Clear message and undo option after 10 seconds
      setTimeout(() => {
        setSuccessMessage('');
        setLastCancelledBooking(null);
        setOutsideClickCount(0);
      }, 10000);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      setError('❌ Failed to cancel booking. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUndoCancellation = async () => {
    if (!lastCancelledBooking) return;
    
    try {
      const token = localStorage.getItem('clientToken');
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/v1/client/bookings/${lastCancelledBooking.id}/reactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchBookings();
      setLastCancelledBooking(null);
      setSuccessMessage('');
      setError('');
      setOutsideClickCount(0);
      
      // Show success message
      setSuccessMessage('✅ Booking restored successfully! No fee charged.');
      setTimeout(() => {
        setSuccessMessage('');
        setOutsideClickCount(0);
      }, 5000);
    } catch (error) {
      console.error('Error restoring booking:', error);
      setError('❌ Failed to restore booking. Please contact support.');
      setTimeout(() => setError(''), 5000);
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

      {(successMessage || error) && <div className="alert-backdrop"></div>}
      
      {successMessage && (
        <div className="success-message" onClick={(e) => e.stopPropagation()}>
          <span>{successMessage}</span>
          {lastCancelledBooking && outsideClickCount === 0 && (
            <button 
              className="btn-undo"
              onClick={handleUndoCancellation}
            >
              ↺ Undo & Avoid Fee
            </button>
          )}
        </div>
      )}
      {error && <div className="error-message" onClick={(e) => e.stopPropagation()}>{error}</div>}

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
              <div key={booking._id} className="booking-card">
                {/* Date Badge */}
                <div className="booking-date">
                  <div className="date-day">
                    {new Date(booking.scheduledDate).getDate()}
                  </div>
                  <div className="date-month">
                    {new Date(booking.scheduledDate).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                  </div>
                </div>

                {/* Main Content */}
                <div className="booking-content">
                  <div className="booking-header">
                    <h3>{booking.services?.map(s => s.serviceName).join(', ')}</h3>
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="booking-info">
                    <div className="info-item">
                      <span className="info-icon">🕐</span>
                      <span className="info-text">
                        {new Date(booking.scheduledDate).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    {(booking.assignedTo || booking.stylistId) && (
                      <div className="info-item">
                        <span className="info-icon">💇</span>
                        <span className="info-text">
                          {booking.assignedTo 
                            ? `${booking.assignedTo.firstName} ${booking.assignedTo.lastName}`
                            : booking.stylistId 
                              ? `${booking.stylistId.firstName} ${booking.stylistId.lastName}`
                              : 'Staff Member'
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {booking.status !== 'cancelled' && booking.status !== 'completed' && new Date(booking.scheduledDate) > new Date() && (
                    <button 
                      className="btn-cancel-booking"
                      onClick={() => handleCancelClick(booking)}
                    >
                      Cancel Booking
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
