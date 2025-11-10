import React from 'react';
import './AccessDeniedModal.css';

export default function AccessDeniedModal({ show, onClose, type, details }) {
  if (!show) return null;

  // Get user role from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwner = user.role === 'owner';

  const renderContent = () => {
    if (type === 'tier') {
      return (
        <>
          <div className="modal-icon">🔒</div>
          <h2>Upgrade Required</h2>
          <p className="modal-message">
            This feature requires a <strong>{details.requiredTier?.toUpperCase()}</strong> tier subscription.
          </p>
          <div className="tier-info">
            <div className="tier-current">
              <span className="label">Your Current Tier:</span>
              <span className="value">{details.currentTier?.toUpperCase() || 'BASIC'}</span>
            </div>
            <div className="tier-arrow">→</div>
            <div className="tier-required">
              <span className="label">Required Tier:</span>
              <span className="value upgrade">{details.requiredTier?.toUpperCase()}</span>
            </div>
          </div>
          <p className="modal-hint">
            {isOwner ? (
              <>
                💡 Go to <strong>Settings → Account Management</strong> to upgrade your subscription and unlock this feature.
              </>
            ) : (
              'Contact your salon owner to upgrade your subscription and unlock this feature.'
            )}
          </p>
        </>
      );
    } else if (type === 'permission') {
      return (
        <>
          <div className="modal-icon">⛔</div>
          <h2>Access Denied</h2>
          <p className="modal-message">
            You don't have permission to access this feature.
          </p>
          <div className="permission-info">
            <div className="permission-required">
              <span className="label">Required Permission:</span>
              <span className="value">{details.permission}</span>
            </div>
          </div>
          <p className="modal-hint">
            💡 Ask your salon owner to grant you this permission from the Staff Management page.
          </p>
        </>
      );
    }
  };

  return (
    <div className="access-denied-overlay" onClick={onClose}>
      <div className="access-denied-modal" onClick={(e) => e.stopPropagation()}>
        {renderContent()}
        <button className="modal-close-btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  );
}
