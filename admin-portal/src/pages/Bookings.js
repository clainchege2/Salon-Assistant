import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { formatDate, formatTime, formatCurrency } from '../utils/formatters';
import './Bookings.css';

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'
  const [viewModal, setViewModal] = useState({ show: false, booking: null });
  const [confirmModal, setConfirmModal] = useState({ show: false, booking: null });
  const [cancelModal, setCancelModal] = useState({ show: false, booking: null, reason: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [filter, searchTerm, bookings]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/v1/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(b => b.status === filter);
    }

    // Search by client name
    if (searchTerm) {
      filtered = filtered.filter(b => {
        const clientName = `${b.clientId?.firstName} ${b.clientId?.lastName}`.toLowerCase();
        return clientName.includes(searchTerm.toLowerCase());
      });
    }

    setFilteredBookings(filtered);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      'in-progress': '#8b5cf6',
      completed: '#10b981',
      cancelled: '#ef4444',
      'no-show': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const handleViewBooking = (booking) => {
    setViewModal({ show: true, booking });
  };

  const handleConfirmBooking = async (booking) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/v1/bookings/${booking._id}`,
        { status: 'confirmed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
      setConfirmModal({ show: false, booking: null });
      alert('✅ Booking confirmed successfully!');
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('❌ Failed to confirm booking');
    }
  };

  const handleCancelBooking = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/v1/bookings/${cancelModal.booking._id}`,
        { 
          status: 'cancelled',
          notes: cancelModal.reason 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
      setCancelModal({ show: false, booking: null, reason: '' });
      alert('✅ Booking cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('❌ Failed to cancel booking');
    }
  };

  if (loading) return <div className="loading">Loading bookings...</div>;

  return (
    <div className="bookings-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <div className="page-title-wrapper">
          <div className="title-with-icon">
            <span className="title-icon">🗓️</span>
            <div className="title-content">
              <h1>Bookings</h1>
              <p className="page-tagline">Manage appointments and schedules</p>
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/add-booking')} className="add-btn">
          ➕ New Booking
        </button>
      </div>

      <div className="bookings-controls">
        <div className="controls-row">
          <input
            type="text"
            placeholder="🔍 Search by client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
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
          >
            All ({bookings.length})
          </button>
          <button
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pending ({bookings.filter(b => b.status === 'pending').length})
          </button>
          <button
            className={filter === 'confirmed' ? 'active' : ''}
            onClick={() => setFilter('confirmed')}
          >
            Confirmed ({bookings.filter(b => b.status === 'confirmed').length})
          </button>
          <button
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            Completed ({bookings.filter(b => b.status === 'completed').length})
          </button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <p>📭 No bookings found</p>
          <button onClick={() => navigate('/add-booking')} className="add-btn">
            Create Your First Booking
          </button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="bookings-table-container">
          <table className="bookings-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Date & Time</th>
                <th>Services</th>
                <th>Staff</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => (
                <tr key={booking._id}>
                  <td>
                    <div className="client-cell">
                      <strong>{booking.clientId?.firstName} {booking.clientId?.lastName}</strong>
                      <span className="phone-small">{booking.clientId?.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <span>{formatDate(booking.scheduledDate)}</span>
                      <span className="time-small">{formatTime(booking.scheduledDate)}</span>
                    </div>
                  </td>
                  <td>{booking.services?.map(s => s.serviceName).join(', ')}</td>
                  <td>{booking.assignedTo?.firstName || '-'}</td>
                  <td className="price-cell">{formatCurrency(booking.totalPrice)}</td>
                  <td>
                    <span 
                      className="status-badge-small" 
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      {booking.status === 'pending' && (
                        <button className="btn-action confirm" title="Confirm booking" onClick={() => setConfirmModal({ show: true, booking })}>
                          ✓ Confirm
                        </button>
                      )}
                      {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                        <button className="btn-action cancel" title="Cancel booking" onClick={() => setCancelModal({ show: true, booking, reason: '' })}>
                          ✕ Cancel
                        </button>
                      )}
                      <button className="btn-action view" title="View details" onClick={() => handleViewBooking(booking)}>
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bookings-grid">
          {filteredBookings.map(booking => (
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <div className="client-info">
                  <h3>{booking.clientId?.firstName} {booking.clientId?.lastName}</h3>
                  <p className="phone">{booking.clientId?.phone}</p>
                </div>
                <span 
                  className="status-badge" 
                  style={{ backgroundColor: getStatusColor(booking.status) }}
                >
                  {booking.status}
                </span>
              </div>

              <div className="booking-details">
                <div className="detail-row">
                  <span className="icon">📅</span>
                  <span>{formatDate(booking.scheduledDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="icon">🕐</span>
                  <span>{formatTime(booking.scheduledDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="icon">✂️</span>
                  <span>{booking.services?.map(s => s.serviceName).join(', ')}</span>
                </div>
                {booking.assignedTo && (
                  <div className="detail-row">
                    <span className="icon">👤</span>
                    <span>{booking.assignedTo?.firstName} {booking.assignedTo?.lastName}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="icon">💰</span>
                  <span className="price">{formatCurrency(booking.totalPrice)}</span>
                </div>
              </div>

              {booking.customerInstructions && (
                <div className="booking-notes">
                  <strong>Notes:</strong> {booking.customerInstructions}
                </div>
              )}

              <div className="booking-actions">
                <button className="btn-view" onClick={() => handleViewBooking(booking)}>
                  View
                </button>
                {booking.status === 'pending' && (
                  <button className="btn-confirm" onClick={() => setConfirmModal({ show: true, booking })}>
                    Confirm
                  </button>
                )}
                {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                  <button className="btn-cancel" onClick={() => setCancelModal({ show: true, booking, reason: '' })}>
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Booking Modal */}
      {viewModal.show && (
        <div className="modal-overlay" onClick={() => setViewModal({ show: false, booking: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Booking Details</h2>
              <button className="close-btn" onClick={() => setViewModal({ show: false, booking: null })}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Client Information</h3>
                <p><strong>Name:</strong> {viewModal.booking.clientId?.firstName} {viewModal.booking.clientId?.lastName}</p>
                <p><strong>Phone:</strong> {viewModal.booking.clientId?.phone}</p>
                <p><strong>Email:</strong> {viewModal.booking.clientId?.email || 'N/A'}</p>
              </div>
              <div className="detail-section">
                <h3>Appointment Details</h3>
                <p><strong>Date:</strong> {formatDate(viewModal.booking.scheduledDate)}</p>
                <p><strong>Time:</strong> {formatTime(viewModal.booking.scheduledDate)}</p>
                <p><strong>Status:</strong> <span className="status-badge" style={{ backgroundColor: getStatusColor(viewModal.booking.status) }}>{viewModal.booking.status}</span></p>
              </div>
              <div className="detail-section">
                <h3>Services</h3>
                {viewModal.booking.services?.map((service, idx) => (
                  <div key={idx} className="service-item">
                    <p><strong>{service.serviceName}</strong></p>
                    <p>Duration: {service.duration} mins | Price: {formatCurrency(service.price)}</p>
                  </div>
                ))}
                <p className="total-price"><strong>Total:</strong> {formatCurrency(viewModal.booking.totalPrice)}</p>
              </div>
              {viewModal.booking.assignedTo && (
                <div className="detail-section">
                  <h3>Assigned Staff</h3>
                  <p>{viewModal.booking.assignedTo.firstName} {viewModal.booking.assignedTo.lastName}</p>
                </div>
              )}
              {viewModal.booking.customerInstructions && (
                <div className="detail-section">
                  <h3>Notes</h3>
                  <p>{viewModal.booking.customerInstructions}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setViewModal({ show: false, booking: null })}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Booking Modal */}
      {confirmModal.show && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ show: false, booking: null })}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✓ Confirm Booking</h2>
              <button className="close-btn" onClick={() => setConfirmModal({ show: false, booking: null })}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to confirm this booking for:</p>
              <p><strong>{confirmModal.booking?.clientId?.firstName} {confirmModal.booking?.clientId?.lastName}</strong></p>
              <p>{formatDate(confirmModal.booking?.scheduledDate)} at {formatTime(confirmModal.booking?.scheduledDate)}</p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setConfirmModal({ show: false, booking: null })}>Cancel</button>
              <button className="btn-primary" onClick={() => handleConfirmBooking(confirmModal.booking)}>Confirm Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Booking Modal */}
      {cancelModal.show && (
        <div className="modal-overlay" onClick={() => setCancelModal({ show: false, booking: null, reason: '' })}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>❌ Cancel Booking</h2>
              <button className="close-btn" onClick={() => setCancelModal({ show: false, booking: null, reason: '' })}>×</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel this booking for:</p>
              <p><strong>{cancelModal.booking?.clientId?.firstName} {cancelModal.booking?.clientId?.lastName}</strong></p>
              <p>{formatDate(cancelModal.booking?.scheduledDate)} at {formatTime(cancelModal.booking?.scheduledDate)}</p>
              <div className="form-group">
                <label>Cancellation Reason (Optional)</label>
                <textarea
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                  placeholder="Enter reason for cancellation..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setCancelModal({ show: false, booking: null, reason: '' })}>Go Back</button>
              <button className="btn-danger" onClick={handleCancelBooking}>Cancel Booking</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
