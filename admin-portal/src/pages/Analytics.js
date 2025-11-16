import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import './Analytics.css';
import OverviewTab from '../components/analytics/OverviewTab';
import AppointmentsTab from '../components/analytics/AppointmentsTab';
import ServicesTab from '../components/analytics/ServicesTab';
import ClientsTab from '../components/analytics/ClientsTab';
import StylistsTab from '../components/analytics/StylistsTab';
import FinanceTab from '../components/analytics/FinanceTab';

const Analytics = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('thisMonth');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [showDatePicker, setShowDatePicker] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'services', label: 'Services', icon: '💅🏾' },
    { id: 'clients', label: 'Clients', icon: '💇🏾‍♀️' },
    { id: 'stylists', label: 'Stylists', icon: '👔' },
    { id: 'finance', label: 'Finance', icon: '💰' }
  ];

  const dateRanges = [
    { id: '1D', label: '1D' },
    { id: '7D', label: '7D' },
    { id: '30D', label: '30D' },
    { id: '90D', label: '90D' },
    { id: '180D', label: '180D' },
    { id: '1Y', label: '1Y' },
    { id: '2Y', label: '2Y' },
    { id: '3Y', label: '3Y' },
    { id: '5Y', label: '5Y' },
    { id: '7Y', label: '7Y' },
    { id: '9Y', label: '9Y' },
    { id: '10Y', label: '10Y' },
    { id: '15Y', label: '15Y' },
    { id: '20Y', label: '20Y' },
    { id: 'ALL', label: 'ALL' },
    { id: 'custom', label: 'Custom' }
  ];

  const handleDownload = () => {
    const message = `Export functionality ready!\n\nAvailable exports:\n- Summary Report (CSV)\n- Revenue Data (CSV)\n- Stylist Performance (CSV)\n\nWould you like to export the current ${activeTab} data?`;
    
    if (window.confirm(message)) {
      alert(`Exporting ${activeTab} data for ${dateRange}...\n\nNote: Full export implementation requires additional setup.`);
    }
  };

  const renderTabContent = () => {
    const props = { dateRange, customRange };
    
    switch(activeTab) {
      case 'overview': return <OverviewTab {...props} />;
      case 'appointments': return <AppointmentsTab {...props} />;
      case 'services': return <ServicesTab {...props} />;
      case 'clients': return <ClientsTab {...props} />;
      case 'stylists': return <StylistsTab {...props} />;
      case 'finance': return <FinanceTab {...props} />;
      default: return <OverviewTab {...props} />;
    }
  };

  return (
    <ErrorBoundary>
    <div className="analytics-page">
      <div className="page-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <div className="page-title-wrapper">
          <div className="title-with-icon">
            <span className="title-icon">📈</span>
            <div className="title-content">
              <h1>Analytics</h1>
              <p className="page-tagline">Business performance at a glance</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button className="export-btn" onClick={handleDownload} title="Export Report">
            📥 Export
          </button>
        </div>
      </div>

      <div className="analytics-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Range Selector - Positioned above content */}
      <div className="content-controls">
        <div className="date-range-selector">
          <label>Date Range:</label>
          <button 
            className="filter-btn"
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            {dateRanges.find(r => r.id === dateRange)?.label}
            <span className="dropdown-arrow">▼</span>
          </button>
          
          {showDatePicker && (
            <div className="date-picker-dropdown">
              {dateRanges.map(range => (
                <div
                  key={range.id}
                  className={`date-option ${dateRange === range.id ? 'active' : ''}`}
                  onClick={() => {
                    setDateRange(range.id);
                    if (range.id !== 'custom') setShowDatePicker(false);
                  }}
                >
                  {range.label}
                </div>
              ))}
              {dateRange === 'custom' && (
                <div className="custom-range-inputs">
                  <input
                    type="date"
                    value={customRange.start}
                    onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={customRange.end}
                    onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="analytics-content">
        {renderTabContent()}
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default Analytics;
