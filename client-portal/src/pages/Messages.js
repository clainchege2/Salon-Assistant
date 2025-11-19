import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Messages.css';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('messagesActiveTab') || 'messages';
  });
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [newCampaignsCount, setNewCampaignsCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
    fetchCampaigns();
  }, []);

  useEffect(() => {
    localStorage.setItem('messagesActiveTab', activeTab);
    
    // Mark items as read/viewed when switching tabs
    if (activeTab === 'messages' && unreadMessagesCount > 0) {
      const markMessagesAsRead = async () => {
        try {
          const token = localStorage.getItem('clientToken');
          const unreadMessages = messages.filter(m => !m.readAt);
          if (unreadMessages.length > 0) {
            await Promise.all(
              unreadMessages.map(msg =>
                axios.put(
                  `${process.env.REACT_APP_API_URL}/api/v1/client/messages/${msg._id}/read`,
                  {},
                  { headers: { Authorization: `Bearer ${token}` } }
                ).catch(err => console.error('Error marking message as read:', err))
              )
            );
            setUnreadMessagesCount(0);
          }
        } catch (err) {
          console.error('Error marking messages as read:', err);
        }
      };
      markMessagesAsRead();
    } else if (activeTab === 'campaigns' && newCampaignsCount > 0) {
      const viewedCampaigns = JSON.parse(localStorage.getItem('viewedCampaigns') || '[]');
      const campaignIds = campaigns.map(c => c._id);
      const updatedViewed = [...new Set([...viewedCampaigns, ...campaignIds])];
      localStorage.setItem('viewedCampaigns', JSON.stringify(updatedViewed));
      setNewCampaignsCount(0);
    }
  }, [activeTab, messages, campaigns, unreadMessagesCount, newCampaignsCount]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('clientToken');
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const messagesData = response.data.data || [];
      setMessages(messagesData);
      
      // Count unread messages before marking as read
      const unreadCount = messagesData.filter(m => !m.readAt).length;
      setUnreadMessagesCount(unreadCount);
      
      // Mark all unread messages as read only when viewing messages tab
      if (activeTab === 'messages') {
        const unreadMessages = messagesData.filter(m => !m.readAt);
        if (unreadMessages.length > 0) {
          await Promise.all(
            unreadMessages.map(msg =>
              axios.put(
                `${process.env.REACT_APP_API_URL}/api/v1/client/messages/${msg._id}/read`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
              ).catch(err => console.error('Error marking message as read:', err))
            )
          );
          // Clear the badge after marking as read
          setUnreadMessagesCount(0);
        }
      }
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
      const campaignsData = response.data.data || [];
      setCampaigns(campaignsData);
      
      // Count new campaigns before marking as viewed
      const viewedCampaigns = JSON.parse(localStorage.getItem('viewedCampaigns') || '[]');
      const unviewedCount = campaignsData.filter(c => !viewedCampaigns.includes(c._id)).length;
      setNewCampaignsCount(unviewedCount);
      
      // Mark all campaigns as viewed in localStorage only when viewing campaigns tab
      if (activeTab === 'campaigns') {
        const campaignIds = campaignsData.map(c => c._id);
        const updatedViewed = [...new Set([...viewedCampaigns, ...campaignIds])];
        localStorage.setItem('viewedCampaigns', JSON.stringify(updatedViewed));
        // Clear the badge after marking as viewed
        setNewCampaignsCount(0);
      }
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
            <span className="tab-content">
              💬 Messages ({messages.length})
              {unreadMessagesCount > 0 && (
                <span className="tab-badge">{unreadMessagesCount}</span>
              )}
            </span>
          </button>
          <button
            className={`tab ${activeTab === 'campaigns' ? 'active' : ''}`}
            onClick={() => setActiveTab('campaigns')}
          >
            <span className="tab-content">
              🎁 Offers & Promotions ({campaigns.length})
              {newCampaignsCount > 0 && (
                <span className="tab-badge">{newCampaignsCount}</span>
              )}
            </span>
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
                      {campaign.endDate && (
                        <span className="campaign-date">
                          Valid until: {new Date(campaign.endDate).toLocaleDateString()}
                        </span>
                      )}
                      <button 
                        className="btn-book-now"
                        onClick={() => navigate('/book')}
                      >
                        📅 Book Now!
                      </button>
                    </div>
                    <div className="campaign-status">
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
