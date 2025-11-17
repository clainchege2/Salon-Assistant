import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MyBookings.css';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
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
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
