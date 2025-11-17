import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Communications.css';

export default function Communications() {
  const [communications, setCommunications] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('communicationsActiveTab') || 'messages';
  });
  const [directionFilter, setDirectionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComm, setSelectedComm] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnClientData, setWarnClientData] = useState(null);
  const [warnAction, setWarnAction] = useState('warn');
  const [warnReason, setWarnReason] = useState('');
  const [warnNotes, setWarnNotes] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailComm, setDetailComm] = useState(null);
  const [feedbackResponse, setFeedbackResponse] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('');
  const [userTier, setUserTier] = useState('free');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserTier();
    if (activeTab === 'messages') {
      fetchCommunications();
    } else {
      fetchFeedback();
    }
  }, [activeTab]); // Only refetch when tab changes, filters are applied on frontend

  useEffect(() => {
    localStorage.setItem('communicationsActiveTab', activeTab);
  }, [activeTab]);

  const fetchUserTier = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tier = response.data.data.tenant?.subscriptionTier || 'free';
      console.log('User tier:', tier);
      setUserTier(tier);
    } catch (error) {
      console.error('Error fetching user tier:', error);
      setUserTier('free'); // Default to free on error
    }
  };

  const hasAccess = (requiredTier) => {
    const tiers = { free: 0, pro: 1, premium: 2 };
    return tiers[userTier] >= tiers[requiredTier];
  };

  const handleLockedFeature = (feature, requiredTier) => {
    setUpgradeFeature(feature);
    setShowUpgradeModal(true);
  };

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      // Fetch all communications and filter on frontend for better UX
      const url = 'http://localhost:5000/api/v1/communications';
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCommunications(response.data.data || []);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/v1/communications/feedback', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Feedback response:', response.data);
      console.log('Feedback count:', response.data.count);
      console.log('Feedback data:', response.data.data);
      
      setFeedback(response.data.data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (commId) => {
    if (!replyText.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/v1/communications/${commId}/reply`,
        { message: replyText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReplyText('');
      setSelectedComm(null);
      fetchCommunications();
      showToast('Reply sent successfully');
    } catch (error) {
      showToast('Failed to send reply', 'error');
    }
  };

  const handleResolve = async (commId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/v1/communications/${commId}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchCommunications();
      setShowDetailModal(false);
      showToast('Communication resolved');
    } catch (error) {
      showToast('Failed to resolve', 'error');
    }
  };

  const openWarnModal = (client, action = 'warn') => {
    setWarnClientData(client);
    setWarnAction(action);
    setWarnReason('');
    setWarnNotes('');
    setShowWarnModal(true);
  };

  const handleWarnOrBlock = async () => {
    if (!warnReason) {
      showToast('Please select a reason', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const endpoint = warnAction === 'warn' ? 'warn-client' : 'block-client';
      
      await axios.post(
        `http://localhost:5000/api/v1/communications/${endpoint}`,
        {
          clientId: warnClientData._id,
          reason: warnReason,
          notes: warnNotes
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowWarnModal(false);
      fetchCommunications();
      showToast(`Client ${warnAction === 'warn' ? 'warned' : 'blocked'} successfully`);
    } catch (error) {
      showToast(`Failed to ${warnAction} client`, 'error');
    }
  };

  const handleRespondToFeedback = async (feedbackId) => {
    if (!feedbackResponse.trim()) return;

    try {
      const token = localStorage.getItem('adminToken');
      console.log('Sending feedback response with token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.put(
        `http://localhost:5000/api/v1/communications/feedback/${feedbackId}/respond`,
        { text: feedbackResponse },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Response sent successfully:', response.data);
      setFeedbackResponse('');
      fetchFeedback();
      showToast('Response sent successfully');
    } catch (error) {
      console.error('Failed to send response:', error.response?.data || error.message);
      showToast(error.response?.data?.message || 'Failed to send response', 'error');
    }
  };

  const handlePublishFeedback = async (feedbackId) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/v1/communications/feedback/${feedbackId}/status`,
        { status: 'published' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchFeedback();
      showToast('Feedback published');
    } catch (error) {
      showToast('Failed to publish feedback', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getDirectionIcon = (direction) => {
    return direction === 'outgoing' ? '↗️' : '↙️';
  };

  const getStatusBadge = (status) => {
    const badges = {
      sent: { text: 'Sent', color: '#10b981' },
      delivered: { text: 'Delivered ✓✓', color: '#10b981' },
      read: { text: 'Read ✓✓', color: '#3b82f6' },
      replied: { text: 'Replied', color: '#8b5cf6' },
      resolved: { text: 'Resolved', color: '#6b7280' },
      pending: { text: 'Pending', color: '#f59e0b' }
    };
    const badge = badges[status] || badges.pending;
    return <span className="status-badge" style={{ backgroundColor: badge.color }}>{badge.text}</span>;
  };

  const getStarRating = (rating) => {
    return '⭐'.repeat(rating);
  };

  // Render template placeholders
  const renderTemplate = (message, comm) => {
    if (!message) return '';
    
    // Get client name
    const clientFirstName = comm.clientId?.firstName || comm.client?.firstName || '';
    const clientLastName = comm.clientId?.lastName || comm.client?.lastName || '';
    const clientFullName = `${clientFirstName} ${clientLastName}`.trim() || 'Client';
    
    // Get booking details
    const booking = comm.bookingId || comm.booking;
    const scheduledDate = booking?.scheduledDate;
    
    const placeholders = {
      '{clientName}': clientFullName,
      '{name}': clientFullName,
      '{firstName}': clientFirstName || 'there',
      '{lastName}': clientLastName,
      '{serviceName}': booking?.services?.map(s => s.serviceName).join(', ') || 'your appointment',
      '{date}': scheduledDate ? new Date(scheduledDate).toLocaleDateString('en-KE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }) : 'your scheduled date',
      '{time}': scheduledDate ? new Date(scheduledDate).toLocaleTimeString('en-KE', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      }) : 'your scheduled time',
      '{salonName}': 'HairVia',
      '{price}': booking?.totalPrice ? `KSh ${booking.totalPrice.toLocaleString()}` : ''
    };

    let rendered = message;
    Object.keys(placeholders).forEach(placeholder => {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'gi');
      rendered = rendered.replace(regex, placeholders[placeholder]);
    });

    return rendered;
  };

  const filteredCommunications = communications.filter(comm => {
    // Filter by direction
    if (directionFilter !== 'all' && comm.direction !== directionFilter) {
      return false;
    }
    
    // Filter by type
    if (typeFilter !== 'all' && comm.messageType !== typeFilter && comm.type !== typeFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm) {
      const clientName = `${comm.clientId?.firstName} ${comm.clientId?.lastName}`.toLowerCase();
      const message = comm.message.toLowerCase();
      if (!clientName.includes(searchTerm.toLowerCase()) && !message.includes(searchTerm.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });

  const formatDate = (date) => {
    const now = new Date();
    const commDate = new Date(date);
    const diffMs = now - commDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return commDate.toLocaleDateString();
  };

  if (loading) return <div className="loading">Loading communications...</div>;

  const isLocked = !hasAccess('pro');
  console.log('User tier:', userTier, 'Is locked:', isLocked);

  return (
    <div className="communications-page">
      <div className="comm-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
        <div className="page-title-wrapper">
          <div className="title-with-icon">
            <span className="title-icon">💬</span>
            <div className="title-content">
              <h1>Communications Hub</h1>
              <p className="page-tagline">Connect with your clients effectively</p>
            </div>
          </div>
        </div>
      </div>

      {isLocked && (
        <div className="feature-locked-banner">
          <div className="locked-content">
            <div className="locked-icon">🔒</div>
            <div className="locked-text">
              <h2>Unlock Powerful Communication Tools</h2>
              <p>Centralize all your client communications, track feedback, and manage relationships - all in one place!</p>
              <div className="locked-features">
                <div className="locked-feature-item">
                  <span className="feature-icon">💬</span>
                  <div>
                    <strong>Unified Messaging</strong>
                    <p>Track all SMS, WhatsApp, and email conversations</p>
                  </div>
                </div>
                <div className="locked-feature-item">
                  <span className="feature-icon">⭐</span>
                  <div>
                    <strong>Feedback & Reviews</strong>
                    <p>Collect and manage client reviews automatically</p>
                  </div>
                </div>
                <div className="locked-feature-item">
                  <span className="feature-icon">🎯</span>
                  <div>
                    <strong>Smart Templates</strong>
                    <p>Send personalized messages with one click</p>
                  </div>
                </div>
                <div className="locked-feature-item">
                  <span className="feature-icon">⚠️</span>
                  <div>
                    <strong>Client Management</strong>
                    <p>Track warnings and manage problematic clients</p>
                  </div>
                </div>
              </div>
              <button 
                className="upgrade-btn-large"
                onClick={() => handleLockedFeature('Communications Hub', 'pro')}
              >
                Upgrade to PRO - KSh 2,500/month
              </button>
              <p className="upgrade-subtext">Join hundreds of salons managing communications better</p>
            </div>
          </div>
        </div>
      )}

      {!isLocked && (
        <>
          <div className="comm-tabs">
            <button 
              className={activeTab === 'messages' ? 'active' : ''} 
              onClick={() => setActiveTab('messages')}
            >
              Messages
            </button>
            <button 
              className={activeTab === 'feedback' ? 'active' : ''} 
              onClick={() => setActiveTab('feedback')}
            >
              Feedback & Reviews
            </button>
          </div>

          {activeTab === 'messages' && (
            <>
          <div className="comm-filters">
            <div className="filter-group">
              <label>Direction:</label>
              <select value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="outgoing">Sent</option>
                <option value="incoming">Received</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Type:</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="reminder">Reminders</option>
                <option value="confirmation">Confirmations</option>
                <option value="follow-up">Follow-ups</option>
                <option value="complaint">Complaints</option>
                <option value="inquiry">Inquiries</option>
                <option value="feedback-response">Feedback</option>
              </select>
            </div>

            <div className="filter-group search-group">
              <input
                type="text"
                placeholder="🔍 Search by client name or message..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="comm-list">
            {filteredCommunications.length === 0 ? (
              <div className="empty-state">
                <p>No communications found</p>
              </div>
            ) : (
              filteredCommunications.map(comm => (
                <div key={comm._id} className="comm-card">
                  <div className="comm-card-header">
                    <div className="comm-direction">
                      {getDirectionIcon(comm.direction)} {comm.direction === 'outgoing' ? 'SENT' : 'RECEIVED'}
                    </div>
                    <div className="comm-meta">
                      <span className="comm-type">{comm.messageType || comm.type}</span>
                      <span className="comm-client">
                        {comm.clientId?.firstName} {comm.clientId?.lastName}
                      </span>
                      <span className="comm-time">{formatDate(comm.createdAt)}</span>
                    </div>
                  </div>

                  <div className="comm-message">
                    {renderTemplate(comm.message, comm)}
                  </div>

                  <div className="comm-card-footer">
                    <div className="comm-status">
                      {getStatusBadge(comm.status)}
                      {comm.requiresAction && <span className="action-required">⚠️ Requires Action</span>}
                      {comm.clientId?.communicationStatus?.blocked && (
                        <span className="blocked-badge">🚫 Blocked</span>
                      )}
                    </div>

                    <div className="comm-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => {
                          setDetailComm(comm);
                          setShowDetailModal(true);
                        }}
                      >
                        View Details
                      </button>
                      
                      {comm.direction === 'incoming' && comm.status !== 'replied' && (
                        <button 
                          className="btn-primary"
                          onClick={() => setSelectedComm(comm._id)}
                        >
                          Reply
                        </button>
                      )}

                      {comm.requiresAction && (
                        <button 
                          className="btn-success"
                          onClick={() => handleResolve(comm._id)}
                        >
                          Resolve
                        </button>
                      )}

                      {comm.direction === 'incoming' && comm.messageType === 'complaint' && (
                        <button 
                          className="btn-warning"
                          onClick={() => openWarnModal(comm.clientId, 'warn')}
                        >
                          Warn Client
                        </button>
                      )}
                    </div>
                  </div>

                  {selectedComm === comm._id && (
                    <div className="reply-box">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows="3"
                      />
                      <div className="reply-actions">
                        <button onClick={() => setSelectedComm(null)} className="btn-secondary">
                          Cancel
                        </button>
                        <button onClick={() => handleReply(comm._id)} className="btn-primary">
                          Send Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
            </>
          )}

          {activeTab === 'feedback' && (
        <div className="feedback-list">
          {feedback.length === 0 ? (
            <div className="empty-state">
              <p>No feedback yet</p>
            </div>
          ) : (
            feedback.map(fb => (
              <div key={fb._id} className="feedback-card">
                <div className="feedback-header">
                  <div className="feedback-rating">
                    {getStarRating(fb.overallRating)}
                    <span className="rating-number">{fb.overallRating}/5</span>
                  </div>
                  <div className="feedback-meta">
                    <span className="feedback-client">
                      {fb.clientId?.firstName} {fb.clientId?.lastName}
                    </span>
                    <span className="feedback-time">{formatDate(fb.createdAt)}</span>
                  </div>
                </div>

                <div className="feedback-comment">
                  {fb.comment || 'No comment provided'}
                </div>

                {fb.bookingId && (
                  <div className="feedback-booking">
                    Service: {fb.bookingId.serviceId}
                  </div>
                )}

                <div className="feedback-flags">
                  {fb.isPositive && <span className="flag-positive">✓ Positive</span>}
                  {fb.isNegative && <span className="flag-negative">⚠️ Negative</span>}
                  {fb.requiresAction && <span className="flag-action">🔴 Action Required</span>}
                  {fb.wouldRecommend && <span className="flag-recommend">👍 Would Recommend</span>}
                </div>

                {fb.response?.text && (
                  <div className="feedback-response">
                    <strong>Your Response:</strong>
                    <p>{fb.response.text}</p>
                    <small>Responded {formatDate(fb.response.respondedAt)}</small>
                  </div>
                )}

                <div className="feedback-actions">
                  {!fb.response?.text && (
                    <div>
                      <textarea
                        placeholder="Type your response..."
                        value={feedbackResponse}
                        onChange={(e) => setFeedbackResponse(e.target.value)}
                        rows="2"
                      />
                      <button 
                        className="btn-primary"
                        onClick={() => handleRespondToFeedback(fb._id)}
                      >
                        Send Response
                      </button>
                    </div>
                  )}
                  
                  {fb.status === 'pending' && fb.isPositive && (
                    <button 
                      className="btn-success"
                      onClick={() => handlePublishFeedback(fb._id)}
                    >
                      Publish Review
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailComm && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Message Details</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Client:</strong>
                <span>{detailComm.clientId?.firstName} {detailComm.clientId?.lastName}</span>
              </div>
              <div className="detail-row">
                <strong>Phone:</strong>
                <span>{detailComm.clientId?.phone}</span>
              </div>
              <div className="detail-row">
                <strong>Type:</strong>
                <span>{detailComm.messageType || detailComm.type}</span>
              </div>
              <div className="detail-row">
                <strong>Channel:</strong>
                <span>{detailComm.channel}</span>
              </div>
              <div className="detail-row">
                <strong>Direction:</strong>
                <span>{detailComm.direction}</span>
              </div>
              <div className="detail-row">
                <strong>Date:</strong>
                <span>{new Date(detailComm.createdAt).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                {getStatusBadge(detailComm.status)}
              </div>
              <div className="detail-message">
                <strong>Message:</strong>
                <p>{renderTemplate(detailComm.message, detailComm)}</p>
              </div>
              {detailComm.replies && detailComm.replies.length > 0 && (
                <div className="detail-replies">
                  <strong>Replies:</strong>
                  {detailComm.replies.map((reply, idx) => (
                    <div key={idx} className="reply-item">
                      <p>{reply.message}</p>
                      <small>{new Date(reply.repliedAt).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warn/Block Modal */}
      {showWarnModal && warnClientData && (
        <div className="modal-overlay" onClick={() => setShowWarnModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⚠️ {warnAction === 'warn' ? 'Warn' : 'Block'} Client</h2>
              <button className="close-btn" onClick={() => setShowWarnModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <strong>Client:</strong>
                <span>{warnClientData.firstName} {warnClientData.lastName}</span>
              </div>
              <div className="detail-row">
                <strong>Phone:</strong>
                <span>{warnClientData.phone}</span>
              </div>
              <div className="detail-row">
                <strong>Current Status:</strong>
                <span>{warnClientData.communicationStatus?.blocked ? '🚫 Blocked' : '✓ Active'}</span>
              </div>
              <div className="detail-row">
                <strong>Previous Warnings:</strong>
                <span>{warnClientData.communicationStatus?.warningCount || 0}</span>
              </div>

              <div className="form-group">
                <label>Action:</label>
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      value="warn"
                      checked={warnAction === 'warn'}
                      onChange={(e) => setWarnAction(e.target.value)}
                    />
                    Issue Warning
                  </label>
                  <label>
                    <input
                      type="radio"
                      value="block"
                      checked={warnAction === 'block'}
                      onChange={(e) => setWarnAction(e.target.value)}
                    />
                    Block Client
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Reason: *</label>
                <select value={warnReason} onChange={(e) => setWarnReason(e.target.value)}>
                  <option value="">Select reason...</option>
                  <option value="inappropriate-language">Inappropriate language</option>
                  <option value="harassment">Harassment</option>
                  <option value="spam">Spam</option>
                  <option value="no-show-pattern">No-show pattern</option>
                  <option value="payment-issues">Payment issues</option>
                  <option value="other">Other (specify below)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Additional Notes:</label>
                <textarea
                  value={warnNotes}
                  onChange={(e) => setWarnNotes(e.target.value)}
                  rows="3"
                  placeholder="Provide additional details..."
                />
              </div>

              <div className="warning-notice">
                ⚠️ Warning: This action will be logged and the client will be notified.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowWarnModal(false)}>
                Cancel
              </button>
              <button 
                className={warnAction === 'warn' ? 'btn-warning' : 'btn-danger'}
                onClick={handleWarnOrBlock}
              >
                {warnAction === 'warn' ? 'Issue Warning' : 'Block Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content upgrade-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚀 Upgrade to Unlock {upgradeFeature}</h2>
              <button className="close-btn" onClick={() => setShowUpgradeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="upgrade-comparison">
                <div className="tier-column current-tier">
                  <div className="tier-header">
                    <h3>FREE</h3>
                    <div className="tier-price">KSh 0/month</div>
                    <div className="tier-status">Current Plan</div>
                  </div>
                  <ul className="tier-features">
                    <li>✓ Basic Bookings</li>
                    <li>✓ Client Management</li>
                    <li>✓ Service Management</li>
                    <li>✓ Mobile App Access</li>
                    <li className="disabled">✗ Communications Hub</li>
                    <li className="disabled">✗ Staff Management</li>
                    <li className="disabled">✗ Stock Management</li>
                  </ul>
                </div>

                <div className="tier-column recommended-tier">
                  <div className="tier-badge-ribbon">RECOMMENDED</div>
                  <div className="tier-header">
                    <h3>PRO</h3>
                    <div className="tier-price">
                      <span className="price-amount">KSh 2,500</span>/month
                    </div>
                    <div className="tier-savings">Save time & grow faster</div>
                  </div>
                  <ul className="tier-features">
                    <li className="highlight">✓ Everything in FREE</li>
                    <li className="highlight">✓ <strong>Communications Hub</strong></li>
                    <li className="highlight">✓ Staff Management</li>
                    <li className="highlight">✓ Stock Management</li>
                    <li className="highlight">✓ Barcode Scanning</li>
                    <li className="highlight">✓ Multi-user Access</li>
                    <li className="highlight">✓ Team Coordination</li>
                  </ul>
                  <button className="upgrade-btn-modal">
                    Upgrade to PRO Now
                  </button>
                </div>

                <div className="tier-column premium-tier">
                  <div className="tier-header">
                    <h3>PREMIUM</h3>
                    <div className="tier-price">
                      <span className="price-amount">KSh 4,500</span>/month
                    </div>
                    <div className="tier-savings">Maximum growth potential</div>
                  </div>
                  <ul className="tier-features">
                    <li>✓ Everything in PRO</li>
                    <li>✓ Marketing Campaigns</li>
                    <li>✓ Advanced Analytics</li>
                    <li>✓ AI-Powered Insights</li>
                    <li>✓ Priority Support</li>
                    <li>✓ Automation Tools</li>
                  </ul>
                  <button className="upgrade-btn-modal secondary">
                    Upgrade to PREMIUM
                  </button>
                </div>
              </div>

              <div className="upgrade-benefits">
                <h3>Why Upgrade to PRO?</h3>
                <div className="benefits-grid">
                  <div className="benefit-item">
                    <span className="benefit-icon">💬</span>
                    <div>
                      <strong>Centralized Communications</strong>
                      <p>Track all client messages in one place - SMS, WhatsApp, email</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">⭐</span>
                    <div>
                      <strong>Automated Feedback</strong>
                      <p>Collect and manage reviews automatically after each visit</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">👥</span>
                    <div>
                      <strong>Team Management</strong>
                      <p>Add unlimited staff members with role-based access</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">📦</span>
                    <div>
                      <strong>Stock Control</strong>
                      <p>Track inventory with mobile barcode scanning</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="upgrade-testimonial">
                <p>"Upgrading to PRO was the best decision for my salon. The communications hub alone saves me 5 hours per week!"</p>
                <cite>- Sarah M., Elite Styles Salon</cite>
              </div>

              <div className="upgrade-guarantee">
                <strong>💯 30-Day Money-Back Guarantee</strong>
                <p>Try PRO risk-free. If you're not satisfied, get a full refund within 30 days.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowUpgradeModal(false)}>
                Maybe Later
              </button>
              <button className="btn-primary upgrade-btn-footer">
                Upgrade to PRO - KSh 2,500/month
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
