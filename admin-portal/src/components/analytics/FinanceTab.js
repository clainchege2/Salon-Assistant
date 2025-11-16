import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import KPICard from './KPICard';
import './FinanceTab.css';

const FinanceTab = ({ dateRange, customRange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceData();
  }, [dateRange, customRange]);

  const fetchFinanceData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/analytics/finance?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-state">Loading finance data...</div>;

  const kpiData = [
    {
      icon: '💰',
      label: 'Total Revenue',
      value: `$${data?.totalRevenue?.toLocaleString() || '0'}`,
      change: data?.revenueChange || 0,
      color: '#2ecc71'
    },
    {
      icon: '💇',
      label: 'Service Revenue',
      value: `$${data?.serviceRevenue?.toLocaleString() || '0'}`,
      subValue: `${data?.servicePercent || 0}% of total`,
      color: '#ff69b4'
    },
    {
      icon: '🛍️',
      label: 'Product Revenue',
      value: `$${data?.productRevenue?.toLocaleString() || '0'}`,
      subValue: `${data?.productPercent || 0}% of total`,
      color: '#3498db'
    },
    {
      icon: '💵',
      label: 'Tips',
      value: `$${data?.tips?.toLocaleString() || '0'}`,
      subValue: `${data?.tipsPercent || 0}% of total`,
      color: '#f39c12'
    }
  ];

  return (
    <div className="finance-tab">
      <div className="kpi-grid">
        {kpiData.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>

      <div className="chart-widget">
        <div className="widget-header">
          <h3>Monthly Revenue Trend</h3>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data?.monthlyData || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#999" />
            <YAxis stroke="#999" />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="current" 
              stroke="#ff69b4" 
              strokeWidth={3}
              name="This Year"
            />
            <Line 
              type="monotone" 
              dataKey="previous" 
              stroke="#ddd" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Last Year"
            />
          </LineChart>
        </ResponsiveContainer>
        
        <div className="insight-footer">
          💡 {data?.trendInsight || 'Revenue up 18% compared to same period last year'}
        </div>
      </div>

      <div className="chart-widget">
        <div className="widget-header">
          <h3>Top Revenue Sources</h3>
        </div>
        
        <div className="revenue-sources">
          <div className="source-section">
            <h4>By Service Category</h4>
            <div className="source-list">
              {(data?.topServiceCategories || []).map((category, index) => (
                <div key={index} className="source-item">
                  <div className="source-info">
                    <span className="source-rank">#{index + 1}</span>
                    <span className="source-name">{category.name}</span>
                  </div>
                  <div className="source-revenue">${category.revenue?.toLocaleString()}</div>
                  <div className="source-bar">
                    <div 
                      className="source-fill"
                      style={{ width: `${category.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="source-section">
            <h4>By Stylist</h4>
            <div className="source-list">
              {(data?.topStylists || []).map((stylist, index) => (
                <div key={index} className="source-item">
                  <div className="source-info">
                    <span className="source-rank">#{index + 1}</span>
                    <span className="source-name">{stylist.name}</span>
                  </div>
                  <div className="source-revenue">${stylist.revenue?.toLocaleString()}</div>
                  <div className="source-bar">
                    <div 
                      className="source-fill"
                      style={{ width: `${stylist.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="source-section">
            <h4>By Product</h4>
            <div className="source-list">
              {(data?.topProducts || []).map((product, index) => (
                <div key={index} className="source-item">
                  <div className="source-info">
                    <span className="source-rank">#{index + 1}</span>
                    <span className="source-name">{product.name}</span>
                  </div>
                  <div className="source-revenue">${product.revenue?.toLocaleString()}</div>
                  <div className="source-bar">
                    <div 
                      className="source-fill"
                      style={{ width: `${product.percent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {data?.profitability && (
        <div className="chart-widget">
          <div className="widget-header">
            <h3>Profitability Analysis</h3>
          </div>
          
          <div className="profitability-section">
            <div className="profit-card">
              <div className="profit-label">Services with Best Margins</div>
              <div className="profit-list">
                {(data.profitability.bestMargins || []).map((service, index) => (
                  <div key={index} className="profit-item">
                    <span>{service.name}</span>
                    <span className="profit-margin">{service.margin}% margin</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="profit-card">
              <div className="profit-label">Consumable Cost Analysis</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.profitability.consumableCosts || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip />
                  <Bar dataKey="cost" fill="#e74c3c" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="insight-footer">
            💡 {data.profitability.insight || 'Color services have highest margins but also highest consumable costs'}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceTab;
