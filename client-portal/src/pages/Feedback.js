import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Toast from '../components/Toast';
import './Feedback.css';

export default function Feedback() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompletedBookings();
  }, []);

  const fetchCompletedBookings = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client-bookings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Filter completed or confirmed bookings without feedback
      const eligible = response.data.data.filter(b => 
        (b.status === 'completed' || b.status === 'confirmed') && !b.feedback
      );
      
      // Remove duplicates by booking ID
      const uniqueBookings = eligible.filter((booking, index, self) =>
        index === self.findIndex((b) => b._id === booking._id)
      );
      
      setBookings(uniqueBookings);
      
      console.log('Total bookings:', response.data.data.length);
      console.log('Eligible bookings for feedback:', uniqueBookings.length);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setToast({ message: 'Failed to load bookings', type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('clientToken');
      
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/client-bookings/feedback`,
        {
          bookingId: selectedBooking,
          rating,
          comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setToast({ message: 'Thank you for your feedback!', type: 'success' });
      setSelectedBooking(null);
      setRating(5);
      setComment('');
      
      // Refresh bookings
      fetchCompletedBookings();
    } catch (err) {
      console.error('Feedback error:', err.response?.data);
      setToast({ message: err.response?.data?.message || 'Failed to submit feedback', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-page">
      <div className="feedback-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>Share Your Feedback</h1>
      </div>

      <div className="feedback-container">
        <div className="card">
          <h2>How was your experience?</h2>
          <p className="subtitle">Your feedback helps us improve our services</p>

          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Appointment *</label>
              <select
                value={selectedBooking || ''}
                onChange={(e) => setSelectedBooking(e.target.value)}
                required
              >
                <option value="">Choose an appointment...</option>
                {bookings.map((booking, index) => (
                  <option key={booking._id} value={booking._id}>
                    {new Date(booking.scheduledDate).toLocaleDateString()} at {new Date(booking.scheduledDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {booking.services?.map(s => s.serviceName).join(', ')} ({booking.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Rating *</label>
              <div className="rating-selector">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${rating >= star ? 'active' : ''}`}
                    onClick={() => setRating(star)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <p className="rating-text">
                {rating === 5 && '🌟 Excellent!'}
                {rating === 4 && '😊 Very Good'}
                {rating === 3 && '🙂 Good'}
                {rating === 2 && '😐 Fair'}
                {rating === 1 && '😞 Needs Improvement'}
              </p>
            </div>

            <div className="form-group">
              <label>Your Comments</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="5"
                placeholder="Tell us about your experience..."
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !selectedBooking}
            >
              {loading ? 'Submitting...' : '💬 Submit Feedback'}
            </button>
          </form>
        </div>

        {bookings.length === 0 && (
          <div className="empty-state">
            <p>No appointments available for feedback</p>
            <small>You can leave feedback after your appointment is confirmed or completed</small>
            <button 
              onClick={() => navigate('/book')} 
              className="btn btn-primary"
              style={{marginTop: '16px'}}
            >
              Book an Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
