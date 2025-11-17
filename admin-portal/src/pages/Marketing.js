import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Marketing.css';

export default function Marketing() {
  const [campaigns, setCampaigns] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [segments, setSegments] = useState({});
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModal, setResultModal] = useState({
    type: 'success', // success or error
    title: '',
    message: ''
  });
  const [sendForm, setSendForm] = useState({
    sendOption: 'now',
    scheduledDate: '',
    scheduledTime: '',
    targetType: 'all',
    selectedClients: [],
    selectedSegment: '',
    dayOfWeek: '',
    message: '',
    originalMessage: ''
  });
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'custom',
    occasion: '',
    message: '',
    targetType: 'all', // all, segment, individual, dayOfWeek
    selectedClients: [],
    selectedSegment: '',
    dayOfWeek: '',
    channel: 'sms',
    sendOption: 'now', // now or scheduled
    scheduledDate: '',
    scheduledTime: ''
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchCampaigns();
    fetchClients();
    fetchSegments();

    // Check if coming from Analytics with segment selection
    if (location.state?.selectedSegment) {
      setCampaignForm(prev => ({
        ...prev,
        targetType: 'segment',
        selectedSegment: location.state.selectedSegment,
        selectedClients: location.state.clients || []
      }));
      setShowCreateModal(true);
    }
  }, [location.state]);

  const fetchCampaigns = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/v1/marketing', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/v1/clients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllClients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchSegments = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/v1/marketing/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSegments(response.data.data.segments || {});
    } catch (error) {
      console.error('Error fetching segments:', error);
    }
  };

  const getSpecialOccasionClients = async (occasion) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `http://localhost:5000/api/v1/marketing/special-occasions/${occasion}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  };

  const getSegmentClients = async (segment) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `http://localhost:5000/api/v1/marketing/segments/${segment}/clients`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data || [];
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  };

  const handleSegmentChange = async (segment) => {
    setCampaignForm(prev => ({ ...prev, selectedSegment: segment }));
    if (segment) {
      const clients = await getSegmentClients(segment);
      setCampaignForm(prev => ({ ...prev, selectedClients: clients }));
    } else {
      setCampaignForm(prev => ({ ...prev, selectedClients: [] }));
    }
  };

  const showSuccess = (title, message) => {
    setResultModal({ type: 'success', title, message });
    setShowResultModal(true);
  };

  const showError = (title, message) => {
    setResultModal({ type: 'error', title, message });
    setShowResultModal(true);
  };

  const handleQuickAction = (type, occasion = '') => {
    setCampaignForm({
      name: type === 'special' ? `${occasion.charAt(0).toUpperCase() + occasion.slice(1)} Messages` : 'Custom Campaign',
      type,
      occasion,
      message: '',
      targetType: occasion === 'birthday' ? 'individual' : (type === 'special' ? 'occasion' : 'all'),
      selectedClients: [],
      selectedSegment: '',
      dayOfWeek: '',
      channel: 'sms'
    });
    setShowCreateModal(true);
  };

  const handleSaveAsDraft = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      let targetClients = [];

      // Determine target clients based on targetType
      if (campaignForm.targetType === 'occasion') {
        targetClients = await getSpecialOccasionClients(campaignForm.occasion);
      } else if (campaignForm.targetType === 'individual') {
        targetClients = campaignForm.selectedClients;
      } else if (campaignForm.targetType === 'segment') {
        targetClients = campaignForm.selectedClients;
      } else if (campaignForm.targetType === 'dayOfWeek') {
        targetClients = allClients.filter(c => c.marketingConsent?.sms);
      } else {
        targetClients = allClients.filter(c => c.marketingConsent?.sms);
      }

      const campaignData = {
        name: campaignForm.name,
        type: campaignForm.type,
        occasion: campaignForm.occasion || undefined,
        message: campaignForm.message,
        targetAudience: {
          specificClients: targetClients.map(c => c._id),
          categories: [],
          targetType: campaignForm.targetType,
          dayOfWeek: campaignForm.dayOfWeek || undefined
        },
        channel: campaignForm.channel,
        status: 'draft',
        scheduledFor: null
      };

      await axios.post(
        'http://localhost:5000/api/v1/marketing',
        campaignData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showSuccess('Draft Saved!', 'Your campaign has been saved as a draft. You can edit and send it later.');
      setShowCreateModal(false);
      resetForm();
      fetchCampaigns();
    } catch (error) {
      console.error('Error:', error);
      showError('Failed to Save Draft', error.response?.data?.message || error.message);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      let targetClients = [];

      // Determine target clients based on targetType
      if (campaignForm.targetType === 'occasion') {
        targetClients = await getSpecialOccasionClients(campaignForm.occasion);
        if (targetClients.length === 0) {
          showError('No Clients Found', `No clients found with ${campaignForm.occasion}s in the next 7 days`);
          return;
        }
      } else if (campaignForm.targetType === 'individual') {
        targetClients = campaignForm.selectedClients;
      } else if (campaignForm.targetType === 'segment') {
        targetClients = campaignForm.selectedClients;
      } else if (campaignForm.targetType === 'dayOfWeek') {
        // All clients with marketing consent for day-of-week specials
        targetClients = allClients.filter(c => c.marketingConsent?.sms);
      } else {
        // All clients
        targetClients = allClients.filter(c => c.marketingConsent?.sms);
      }

      // Determine status and scheduled time
      let status = 'draft';
      let scheduledFor = null;

      if (campaignForm.sendOption === 'scheduled') {
        if (!campaignForm.scheduledDate || !campaignForm.scheduledTime) {
          showError('Missing Information', 'Please select both date and time for scheduled campaign');
          return;
        }
        status = 'scheduled';
        scheduledFor = new Date(`${campaignForm.scheduledDate}T${campaignForm.scheduledTime}`);

        // Validate future date
        if (scheduledFor <= new Date()) {
          showError('Invalid Time', 'Scheduled time must be in the future');
          return;
        }
      }

      const campaignData = {
        name: campaignForm.name,
        type: campaignForm.type,
        occasion: campaignForm.occasion || undefined,
        message: campaignForm.message,
        targetAudience: {
          specificClients: targetClients.map(c => c._id),
          categories: [],
          targetType: campaignForm.targetType,
          dayOfWeek: campaignForm.dayOfWeek || undefined
        },
        channel: campaignForm.channel,
        status: status,
        scheduledFor: scheduledFor
      };

      const response = await axios.post(
        'http://localhost:5000/api/v1/marketing',
        campaignData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // If send now, immediately send the campaign
      if (campaignForm.sendOption === 'now') {
        await axios.post(
          `http://localhost:5000/api/v1/marketing/${response.data.data._id}/send`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showSuccess('Campaign Sent!', 'Your campaign has been sent successfully to all recipients.');
      } else {
        showSuccess('Campaign Scheduled!', `Your campaign has been scheduled for ${scheduledFor.toLocaleString()}`);
      }
      setShowCreateModal(false);
      resetForm();
      fetchCampaigns();
    } catch (error) {
      console.error('Error:', error);
      showError('Failed to Create Campaign', error.response?.data?.message || error.message);
    }
  };

  const openSendModal = async (campaign) => {
    setSelectedCampaign(campaign);

    // Initialize with campaign's current targeting
    const targetType = campaign.targetAudience?.targetType || 'all';
    let selectedClients = [];

    // If campaign has specific clients, fetch them
    if (campaign.targetAudience?.specificClients?.length > 0) {
      const clientIds = campaign.targetAudience.specificClients;
      selectedClients = allClients.filter(c => clientIds.includes(c._id));
    }

    setSendForm({
      sendOption: campaign.status === 'scheduled' ? 'scheduled' : 'now',
      scheduledDate: campaign.scheduledFor ? new Date(campaign.scheduledFor).toISOString().split('T')[0] : '',
      scheduledTime: campaign.scheduledFor ? new Date(campaign.scheduledFor).toTimeString().slice(0, 5) : '',
      targetType: targetType,
      selectedClients: selectedClients,
      selectedSegment: campaign.targetAudience?.targetType === 'segment' ? (campaign.targetAudience.specificClients?.[0] ? 'existing' : '') : '',
      dayOfWeek: campaign.targetAudience?.dayOfWeek || '',
      message: campaign.message || '',
      originalMessage: campaign.message || ''
    });
    setShowSendModal(true);
  };

  const handleSendCampaign = async () => {
    try {
      const token = localStorage.getItem('adminToken');

      // Determine target clients based on targeting options
      let targetClients = [];

      if (sendForm.targetType === 'individual') {
        targetClients = sendForm.selectedClients;
      } else if (sendForm.targetType === 'segment') {
        targetClients = sendForm.selectedClients;
      } else if (sendForm.targetType === 'dayOfWeek') {
        targetClients = allClients.filter(c => c.marketingConsent?.sms);
      } else {
        // All clients
        targetClients = allClients.filter(c => c.marketingConsent?.sms);
      }

      // Update campaign with new targeting and message
      const updateData = {
        targetAudience: {
          specificClients: targetClients.map(c => c._id),
          categories: [],
          targetType: sendForm.targetType,
          dayOfWeek: sendForm.dayOfWeek || undefined
        }
      };

      // If message was edited, include it in update
      if (sendForm.message !== sendForm.originalMessage) {
        updateData.message = sendForm.message;
      }

      if (sendForm.sendOption === 'now') {
        // Update targeting first, then send
        await axios.put(
          `http://localhost:5000/api/v1/marketing/${selectedCampaign._id}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Send immediately
        await axios.post(
          `http://localhost:5000/api/v1/marketing/${selectedCampaign._id}/send`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showSuccess('Campaign Sent!', 'Your campaign has been sent successfully to all recipients.');
      } else {
        // Schedule for later
        if (!sendForm.scheduledDate || !sendForm.scheduledTime) {
          showError('Missing Information', 'Please select both date and time');
          return;
        }

        const scheduledFor = new Date(`${sendForm.scheduledDate}T${sendForm.scheduledTime}`);

        if (scheduledFor <= new Date()) {
          showError('Invalid Time', 'Scheduled time must be in the future');
          return;
        }

        // Update campaign with targeting and schedule
        await axios.put(
          `http://localhost:5000/api/v1/marketing/${selectedCampaign._id}`,
          {
            ...updateData,
            status: 'scheduled',
            scheduledFor: scheduledFor
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        showSuccess('Campaign Scheduled!', `Your campaign has been scheduled for ${scheduledFor.toLocaleString()}`);
      }

      setShowSendModal(false);
      setSelectedCampaign(null);
      fetchCampaigns();
    } catch (error) {
      console.error('Error:', error);
      showError('Failed to Send/Schedule Campaign', error.response?.data?.message || error.message);
    }
  };

  const handleSendFormSegmentChange = async (segment) => {
    setSendForm(prev => ({ ...prev, selectedSegment: segment }));
    if (segment) {
      const clients = await getSegmentClients(segment);
      setSendForm(prev => ({ ...prev, selectedClients: clients }));
    } else {
      setSendForm(prev => ({ ...prev, selectedClients: [] }));
    }
  };

  const toggleSendFormClientSelection = (clientId) => {
    setSendForm(prev => ({
      ...prev,
      selectedClients: prev.selectedClients.some(c => c._id === clientId)
        ? prev.selectedClients.filter(c => c._id !== clientId)
        : [...prev.selectedClients, allClients.find(c => c._id === clientId)]
    }));
  };

  const resetForm = () => {
    setCampaignForm({
      name: '',
      type: 'custom',
      occasion: '',
      message: '',
      targetType: 'all',
      selectedClients: [],
      selectedSegment: '',
      dayOfWeek: '',
      channel: 'sms',
      sendOption: 'now',
      scheduledDate: '',
      scheduledTime: ''
    });
  };

  const toggleClientSelection = (clientId) => {
    setCampaignForm(prev => ({
      ...prev,
      selectedClients: prev.selectedClients.some(c => c._id === clientId)
        ? prev.selectedClients.filter(c => c._id !== clientId)
        : [...prev.selectedClients, allClients.find(c => c._id === clientId)]
    }));
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          ← Back
        </button>
        <div className="page-title-wrapper">
          <div className="title-with-icon">
            <span className="title-icon">📢</span>
            <div className="title-content">
              <h1>Marketing Hub</h1>
              <p className="page-tagline">Grow your business with targeted campaigns</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="secondary-btn"
            onClick={() => navigate('/reports')}
          >
            📈 View Analytics
          </button>
          <button
            className="primary-btn"
            onClick={() => handleQuickAction('custom')}
          >
            ✨ Create Campaign
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="action-card" onClick={() => handleQuickAction('special', 'birthday')}>
          <div className="action-icon">🎂</div>
          <h3>Birthday Messages</h3>
          <p>Send wishes to clients with upcoming birthdays</p>
        </div>
        <div className="action-card" onClick={() => handleQuickAction('special', 'anniversary')}>
          <div className="action-icon">💝</div>
          <h3>Anniversary Messages</h3>
          <p>Celebrate client anniversaries</p>
        </div>
        <div className="action-card" onClick={() => handleQuickAction('special', 'holiday')}>
          <div className="action-icon">🎉</div>
          <h3>Holiday Messages</h3>
          <p>Send seasonal greetings</p>
        </div>
        <div className="action-card" onClick={() => {
          setCampaignForm(prev => ({ ...prev, type: 'dayOfWeek', targetType: 'dayOfWeek' }));
          setShowCreateModal(true);
        }}>
          <div className="action-icon">📅</div>
          <h3>Day of Week Special</h3>
          <p>Target specific days (e.g., Monday Madness)</p>
        </div>
      </div>

      {/* Draft Campaigns */}
      <div className="section">
        <h2>📝 Draft & Scheduled Campaigns</h2>
        {campaigns.filter(c => c.status === 'draft' || c.status === 'scheduled').length === 0 ? (
          <div className="empty-state">
            <p>No draft campaigns. Create one above!</p>
          </div>
        ) : (
          <div className="campaigns-list">
            {campaigns.filter(c => c.status === 'draft' || c.status === 'scheduled').map(campaign => (
              <div key={campaign._id} className="campaign-card">
                <div className="campaign-header">
                  <div>
                    <h3>{campaign.name}</h3>
                    <span className={`campaign-status ${campaign.status}`}>
                      {campaign.status}
                    </span>
                  </div>
                  <div className="campaign-actions">
                    {campaign.status === 'draft' && (
                      <button
                        className="send-btn"
                        onClick={() => openSendModal(campaign)}
                      >
                        📤 Send / Schedule
                      </button>
                    )}
                    {campaign.status === 'scheduled' && (
                      <button
                        className="send-btn secondary"
                        onClick={() => openSendModal(campaign)}
                      >
                        ✏️ Reschedule
                      </button>
                    )}
                  </div>
                </div>
                <p className="campaign-message">{campaign.message}</p>
                <div className="campaign-stats">
                  <span>📱 {campaign.channel}</span>
                  <span>👥 {campaign.targetAudience?.specificClients?.length || 0} recipients</span>
                  {campaign.targetAudience?.dayOfWeek && (
                    <span>📅 {campaign.targetAudience.dayOfWeek}</span>
                  )}
                  {campaign.status === 'scheduled' && campaign.scheduledFor && (
                    <span>⏰ Scheduled for {new Date(campaign.scheduledFor).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Campaigns */}
      <div className="section">
        <h2>✅ Sent Campaigns</h2>
        {campaigns.filter(c => c.status === 'sent' || c.status === 'completed').length === 0 ? (
          <div className="empty-state">
            <p>No sent campaigns yet.</p>
          </div>
        ) : (
          <div className="campaigns-list">
            {campaigns.filter(c => c.status === 'sent' || c.status === 'completed').map(campaign => (
              <div key={campaign._id} className="campaign-card sent">
                <div className="campaign-header">
                  <div>
                    <h3>{campaign.name}</h3>
                    <span className={`campaign-status ${campaign.status}`}>
                      {campaign.status}
                    </span>
                  </div>
                </div>
                <p className="campaign-message">{campaign.message}</p>
                <div className="campaign-stats">
                  <span>📱 {campaign.channel}</span>
                  <span>👥 {campaign.stats?.totalSent || campaign.targetAudience?.specificClients?.length || 0} sent</span>
                  {campaign.targetAudience?.dayOfWeek && (
                    <span>📅 {campaign.targetAudience.dayOfWeek}</span>
                  )}
                  {campaign.sentAt && (
                    <span>✅ Sent {new Date(campaign.sentAt).toLocaleDateString()} at {new Date(campaign.sentAt).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Campaign</h3>
              <button onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Campaign Name</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Monday Madness Sale"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Target Audience</label>
                <select
                  value={campaignForm.targetType}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, targetType: e.target.value, selectedClients: [] }))}
                  className="form-control"
                >
                  <option value="all">All Clients</option>
                  <option value="segment">RFM Segment</option>
                  <option value="individual">Individual Clients</option>
                  <option value="dayOfWeek">Day of Week Special</option>
                  {campaignForm.type === 'special' && (
                    <option value="occasion">Special Occasion</option>
                  )}
                </select>
              </div>

              {campaignForm.targetType === 'dayOfWeek' && (
                <div className="form-group">
                  <label>Select Day</label>
                  <select
                    value={campaignForm.dayOfWeek}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                    className="form-control"
                  >
                    <option value="">Choose a day...</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                  <small className="form-hint">
                    Perfect for "Monday Madness", "Friday Specials", etc.
                  </small>
                </div>
              )}

              {campaignForm.targetType === 'individual' && (
                <div className="form-group">
                  <label>Select Clients ({campaignForm.selectedClients.length} selected)</label>
                  <div className="client-selector">
                    {allClients.map(client => (
                      <div key={client._id} className="client-checkbox">
                        <input
                          type="checkbox"
                          id={`client-${client._id}`}
                          checked={campaignForm.selectedClients.some(c => c._id === client._id)}
                          onChange={() => toggleClientSelection(client._id)}
                        />
                        <label htmlFor={`client-${client._id}`}>
                          {client.firstName} {client.lastName} - {client.phone}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {campaignForm.targetType === 'segment' && (
                <>
                  <div className="form-group">
                    <label>Select RFM Segment</label>
                    <select
                      value={campaignForm.selectedSegment}
                      onChange={(e) => handleSegmentChange(e.target.value)}
                      className="form-control"
                    >
                      <option value="">Choose a segment...</option>
                      {Object.entries(segments).map(([segment, data]) => (
                        <option key={segment} value={segment} disabled={data.count === 0}>
                          {segment.toUpperCase()} ({data.count} clients)
                        </option>
                      ))}
                    </select>
                    <small className="form-hint">
                      Select a client segment based on RFM analysis
                    </small>
                  </div>
                  {campaignForm.selectedClients.length > 0 && (
                    <div className="form-group">
                      <label>Target Audience</label>
                      <div className="target-info">
                        ✅ {campaignForm.selectedClients.length} clients from {campaignForm.selectedSegment.toUpperCase()} segment
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={campaignForm.message}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder={
                    campaignForm.type === 'special' && campaignForm.occasion === 'birthday'
                      ? "Happy Birthday! 🎂 Enjoy 20% off your next visit..."
                      : campaignForm.targetType === 'dayOfWeek'
                        ? "Monday Madness! Get 30% off all services today only..."
                        : "Your custom message here..."
                  }
                  className="form-control"
                  rows="4"
                />
                <small className="form-hint">
                  {campaignForm.message.length}/160 characters
                </small>
              </div>

              <div className="form-group">
                <label>Send Options</label>
                <div className="send-options">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="sendOption"
                      value="now"
                      checked={campaignForm.sendOption === 'now'}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, sendOption: e.target.value }))}
                    />
                    <span>Send Now</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="sendOption"
                      value="scheduled"
                      checked={campaignForm.sendOption === 'scheduled'}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, sendOption: e.target.value }))}
                    />
                    <span>Schedule for Later</span>
                  </label>
                </div>
              </div>

              {campaignForm.sendOption === 'scheduled' && (
                <div className="form-group">
                  <label>Schedule Date & Time</label>
                  <div className="datetime-inputs">
                    <input
                      type="date"
                      value={campaignForm.scheduledDate}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="form-control"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <input
                      type="time"
                      value={campaignForm.scheduledTime}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="form-control"
                    />
                  </div>
                  <small className="form-hint">
                    Campaign will be sent automatically at the scheduled time
                  </small>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="secondary-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="secondary-btn"
                  onClick={handleSaveAsDraft}
                  disabled={!campaignForm.name.trim() || !campaignForm.message.trim()}
                  style={{ marginLeft: 'auto', marginRight: '8px' }}
                >
                  💾 Save as Draft
                </button>
                <button
                  className="primary-btn"
                  onClick={handleCreateCampaign}
                  disabled={!campaignForm.name.trim() || !campaignForm.message.trim()}
                >
                  {campaignForm.sendOption === 'now' ? '📤 Send Now' : '📅 Schedule Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send/Schedule Modal */}
      {showSendModal && selectedCampaign && (
        <div className="modal-overlay" onClick={() => setShowSendModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Campaign: {selectedCampaign.name}</h3>
              <button onClick={() => setShowSendModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Campaign Message</label>
                <textarea
                  value={sendForm.message}
                  onChange={(e) => setSendForm(prev => ({ ...prev, message: e.target.value }))}
                  className="form-control"
                  rows="3"
                  placeholder="Enter your campaign message..."
                />
                <div className="message-actions">
                  <small className="form-hint">
                    {sendForm.message.length}/160 characters
                    {sendForm.message !== sendForm.originalMessage && (
                      <span className="message-edited"> • Message edited</span>
                    )}
                  </small>
                  {sendForm.message !== sendForm.originalMessage && (
                    <button
                      type="button"
                      className="restore-btn"
                      onClick={() => setSendForm(prev => ({ ...prev, message: prev.originalMessage }))}
                    >
                      ↺ Restore Original
                    </button>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Target Audience</label>
                <select
                  value={sendForm.targetType}
                  onChange={(e) => setSendForm(prev => ({ ...prev, targetType: e.target.value, selectedClients: [] }))}
                  className="form-control"
                >
                  <option value="all">All Clients</option>
                  <option value="segment">RFM Segment</option>
                  <option value="individual">Individual Clients</option>
                  <option value="dayOfWeek">Day of Week Special</option>
                </select>
              </div>

              {sendForm.targetType === 'segment' && (
                <>
                  <div className="form-group">
                    <label>Select RFM Segment</label>
                    <select
                      value={sendForm.selectedSegment}
                      onChange={(e) => handleSendFormSegmentChange(e.target.value)}
                      className="form-control"
                    >
                      <option value="">Choose a segment...</option>
                      {Object.entries(segments).map(([segment, data]) => (
                        <option key={segment} value={segment} disabled={data.count === 0}>
                          {segment.toUpperCase()} ({data.count} clients)
                        </option>
                      ))}
                    </select>
                  </div>
                  {sendForm.selectedClients.length > 0 && (
                    <div className="form-group">
                      <div className="target-info">
                        ✅ {sendForm.selectedClients.length} clients from {sendForm.selectedSegment.toUpperCase()} segment
                      </div>
                    </div>
                  )}
                </>
              )}

              {sendForm.targetType === 'individual' && (
                <div className="form-group">
                  <label>Select Clients ({sendForm.selectedClients.length} selected)</label>
                  <div className="client-selector">
                    {allClients.slice(0, 20).map(client => (
                      <div key={client._id} className="client-checkbox">
                        <input
                          type="checkbox"
                          id={`send-client-${client._id}`}
                          checked={sendForm.selectedClients.some(c => c._id === client._id)}
                          onChange={() => toggleSendFormClientSelection(client._id)}
                        />
                        <label htmlFor={`send-client-${client._id}`}>
                          {client.firstName} {client.lastName} - {client.phone}
                        </label>
                      </div>
                    ))}
                  </div>
                  <small className="form-hint">Showing first 20 clients</small>
                </div>
              )}

              {sendForm.targetType === 'dayOfWeek' && (
                <div className="form-group">
                  <label>Select Day</label>
                  <select
                    value={sendForm.dayOfWeek}
                    onChange={(e) => setSendForm(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                    className="form-control"
                  >
                    <option value="">Choose a day...</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Send Options</label>
                <div className="send-options">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="sendOption"
                      value="now"
                      checked={sendForm.sendOption === 'now'}
                      onChange={(e) => setSendForm(prev => ({ ...prev, sendOption: e.target.value }))}
                    />
                    <span>Send Now</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="sendOption"
                      value="scheduled"
                      checked={sendForm.sendOption === 'scheduled'}
                      onChange={(e) => setSendForm(prev => ({ ...prev, sendOption: e.target.value }))}
                    />
                    <span>Schedule for Later</span>
                  </label>
                </div>
              </div>

              {sendForm.sendOption === 'scheduled' && (
                <div className="form-group">
                  <label>Schedule Date & Time</label>
                  <div className="datetime-inputs">
                    <input
                      type="date"
                      value={sendForm.scheduledDate}
                      onChange={(e) => setSendForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="form-control"
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <input
                      type="time"
                      value={sendForm.scheduledTime}
                      onChange={(e) => setSendForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="form-control"
                    />
                  </div>
                  <small className="form-hint">
                    Campaign will be sent automatically at the scheduled time
                  </small>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="secondary-btn"
                  onClick={() => setShowSendModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="primary-btn"
                  onClick={handleSendCampaign}
                >
                  {sendForm.sendOption === 'now' ? '📤 Send Now' : '📅 Schedule Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal (Success/Error) */}
      {showResultModal && (
        <div className="modal-overlay" onClick={() => setShowResultModal(false)}>
          <div className="modal result-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{resultModal.type === 'success' ? '✅' : '❌'} {resultModal.title}</h3>
              <button onClick={() => setShowResultModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className={`result-content ${resultModal.type}`}>
                <div className="result-icon">
                  {resultModal.type === 'success' ? '🎉' : '⚠️'}
                </div>
                <p className="result-message">{resultModal.message}</p>
              </div>
              <div className="modal-actions">
                <button
                  className="primary-btn"
                  onClick={() => setShowResultModal(false)}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
