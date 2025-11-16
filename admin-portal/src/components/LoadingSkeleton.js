import React from 'react';
import './LoadingSkeleton.css';

const LoadingSkeleton = ({ type = 'default' }) => {
  if (type === 'kpi-grid') {
    return (
      <div className="skeleton-kpi-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-kpi-card">
            <div className="skeleton-icon"></div>
            <div className="skeleton-text skeleton-text-lg"></div>
            <div className="skeleton-text skeleton-text-sm"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="skeleton-chart">
        <div className="skeleton-text skeleton-text-lg" style={{ width: '200px', marginBottom: '20px' }}></div>
        <div className="skeleton-chart-area"></div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="skeleton-list">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-list-item">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-content">
              <div className="skeleton-text skeleton-text-md"></div>
              <div className="skeleton-text skeleton-text-sm"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="skeleton-default">
      <div className="skeleton-text skeleton-text-lg"></div>
      <div className="skeleton-text skeleton-text-md"></div>
      <div className="skeleton-text skeleton-text-sm"></div>
    </div>
  );
};

export default LoadingSkeleton;
