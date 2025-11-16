import React from 'react';
import './InsightCard.css';

const InsightCard = ({ icon, text, type = 'info' }) => {
  return (
    <div className={`insight-card ${type}`}>
      <div className="insight-icon">{icon}</div>
      <div className="insight-text">{text}</div>
    </div>
  );
};

export default InsightCard;
