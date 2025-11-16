import React, { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import KPICard from './KPICard';
import { formatCurrency } from '../../utils/formatters';
import './ClientsTab.css';

const ClientsTab = ({ dateRange, customRange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientsData();
  }, [dateRange, customRange]);

  const fetchClientsData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/analytics/clients?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching clients data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading clients data...</div>;

  const kpiData = [
    {
      icon: '👥',
      label: 'Total Clients',
      value: data?.totalClients || '0',
      change: data?.clientsChange || 0,
      color: '#3498db'
    },
    {
      icon: '🆕',
      label: 'New Clients',
      value: data?.newClients || '0',
      subValue: `${data?.newPercent || 0}%`,
      color: '#2ecc71'
    },
    {
      icon: '🔄',
      label: 'Returning Clients',
      value: data?.returningClients || '0',
      subValue: `${data?.returningPercent || 0}%`,
      color: '#9b59b6'
    },
    {
      icon: '💰',
      label: 'Avg Spend',
      value: formatCurrency(data?.avgSpend || 0),
      change: data?.spendChange || 0,
      color: '#f39c12'
    }
  ];

  const COLORS = ['#2ecc71', '#ff69b4', '#3498db', '#f39c12', '#9b59b6'];

  return (
    <div className="clients-tab">
      <div className="kpi-grid">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      {/* Churn Indicators - Moved Up for Visibility */}
      {data?.churnedClients > 0 && (
        <div className="chart-widget">
          <div className="widget-header">
            <h3>⚠️ Churn Alert</h3>
          </div>
          
          <div className="churn-section">
            <div className="churn-stat">
              <div className="churn-number">{data.churnedClients}</div>
              <div className="churn-label">
                {data.churnedClients === 1 
                  ? `Client hasn't visited in ${data.churnDays || '90+'}+ days` 
                  : `Clients haven't visited in ${data.churnDays || '90+'}+ days`}
              </div>
            </div>
            
            <div className="churn-actions">
              <h4>Win-Back Campaign Ideas</h4>
              <ul>
                <li>Send personalized "We miss you" message with {data.churnedClients > 10 ? '20%' : '15%'} discount</li>
                <li>Offer complimentary consultation or treatment upgrade</li>
                <li>Highlight new services or seasonal promotions</li>
                <li>Request feedback to understand why they left</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="chart-widget">
        <div className="widget-header">
          <h3>Client Growth</h3>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data?.growthData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="new" 
              stroke="#2ecc71" 
              strokeWidth={3}
              name="New Clients"
            />
            <Line 
              type="monotone" 
              dataKey="returning" 
              stroke="#9b59b6" 
              strokeWidth={3}
              name="Returning Clients"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="two-column-grid">
        <div className="chart-widget">
          <div className="widget-header">
            <h3>New vs Returning</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Returning', value: data?.returningClients || 0 },
                  { name: 'New', value: data?.newClients || 0 }
                ]}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={85}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#9b59b6" />
                <Cell fill="#2ecc71" />
              </Pie>
              <Tooltip formatter={(value) => `${value} clients`} />
              <Legend 
                verticalAlign="bottom" 
                height={40}
                formatter={(value, entry) => `${value}: ${entry.payload.value}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-widget">
          <div className="widget-header">
            <h3>Top Client Metrics</h3>
          </div>
          
          <div className="metrics-list">
            <div className="metric-item">
              <div className="metric-label">Visit Frequency</div>
              <div className="metric-value">{data?.visitFrequency || 'Every 6 weeks'}</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Avg Spend Per Client</div>
              <div className="metric-value">{formatCurrency(data?.avgSpendPerClient || 0)}</div>
            </div>
            <div className="metric-item">
              <div className="metric-label">Highest Value Clients</div>
              <div className="metric-value">{data?.highValueCount || '0'} clients</div>
              <div className="metric-subvalue">Spending {formatCurrency(data?.highValueThreshold || 500)}+</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsTab;
