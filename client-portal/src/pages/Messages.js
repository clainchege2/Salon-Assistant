import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Messages.css';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('messages');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
    fetchCampaigns();
  }, []);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(response.data.data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client/campaigns`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCampaigns(response.data.data || []);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="messages-page">
      <div className="messages-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>Messages & Offers</h1>
      </div>

      <div className="messages-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            💬 Messages ({messages.length})
          </button>
          <button
            className={`tab ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            🎁 Offers & Promotions ({campaigns.length})
          </button>
        </div>

        {activeTab === 'messages' && (
          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>No messages yet</p>
                <small>Messages from your salon will appear here</small>
              </div>
            ) : (
              messages.map(message => (
                <div key={message._id} className="message-card">
                  <div className="message-icon">
                    {message.type === 'confirmation' && '✅'}
                    {message.type === 'reminder' && '🔔'}
                    {message.type === 'thank-you' && '💜'}
                    {message.type === 'general' && '💬'}
                  </div>
                  <div className="message-content">
                    <h3>{message.subject || 'Message from Salon'}</h3>
                    <p>{message.message}</p>
                    <span className="message-date">{formatDate(message.createdAt)}</span>
                  </div>
                  <div className="message-status">
                    <span className={`status-badge ${message.status}`}>
                      {message.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="campaigns-list">
            {campaigns.length === 0 ? (
              <div className="empty-state">
                <p>No offers available</p>
                <small>Special offers and promotions will appear here</small>
              </div>
            ) : (
              campaigns.map(campaign => (
                <div key={campaign._id} className="campaign-card">
                  <div className="campaign-badge">
                    {campaign.type === 'promotion' && '🎉'}
                    {campaign.type === 'announcement' && '📢'}
                    {campaign.type === 'seasonal' && '🌟'}
                  </div>
                  <div className="campaign-content">
                    <h3>{campaign.name}</h3>
                    <p>{campaign.message}</p>
                    {campaign.discount && (
                      <div className="discount-badge">
                        {campaign.discount}% OFF
                      </div>
                    )}
                    <div className="campaign-footer">
                      <span className="campaign-date">
                        Valid until: {new Date(campaign.endDate).toLocaleDateString()}
                      </span>
                      <span className={`status-badge ${campaign.status}`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
