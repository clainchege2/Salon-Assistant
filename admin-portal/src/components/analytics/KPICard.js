import React from 'react';
import './KPICard.css';

const KPICard = ({ icon, label, value, subValue, change, color }) => {
  const hasChange = typeof change === 'number';
  const isPositive = change > 0;
  
  return (
    <div className="kpi-card" style={{ '--card-color': color }}>
      <div className="kpi-icon" style={{ background: `${color}15` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      
      <div className="kpi-content">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        
        {subValue && (
          <div className="kpi-subvalue">{subValue}</div>
        )}
        
        {hasChange && (
          <div className={`kpi-change ${isPositive ? 'positive' : 'negative'}`}>
            <span className="change-arrow">{isPositive ? '↑' : '↓'}</span>
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
