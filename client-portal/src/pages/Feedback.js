import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Feedback.css';

export default function Feedback() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompletedBookings();
  }, []);

  const fetchCompletedBookings = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client/bookings`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Filter completed bookings
      const completed = response.data.data.filter(b => b.status === 'completed');
      setBookings(completed);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('clientToken');
      
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/client/feedback`,
        {
          bookingId: selectedBooking,
          rating,
          comment
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('✅ Thank you for your feedback!');
      setSelectedBooking(null);
      setRating(5);
      setComment('');
      
      // Refresh bookings
      fetchCompletedBookings();
    } catch (err) {
      console.error('Feedback error:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to submit feedback');
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

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Appointment *</label>
              <select
                value={selectedBooking || ''}
                onChange={(e) => setSelectedBooking(e.target.value)}
                required
              >
                <option value="">Choose an appointment...</option>
                {bookings.map(booking => (
                  <option key={booking._id} value={booking._id}>
                    {new Date(booking.scheduledDate).toLocaleDateString()} - {booking.services?.map(s => s.serviceName).join(', ')}
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
            <p>No completed appointments yet</p>
            <small>Complete an appointment to leave feedback</small>
          </div>
        )}
      </div>
    </div>
  );
}
