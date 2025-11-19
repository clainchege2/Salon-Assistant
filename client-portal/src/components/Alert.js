import React from 'react';

export default function Alert({ message, type = 'success', onClose, children }) {
  if (!message) return null;

  return (
    <>
      <div className="alert-backdrop" onClick={onClose}></div>
      <div className={type === 'success' ? 'success-message' : 'error-message'}>
        <span>{message}</span>
        {children}
      </div>
    </>
  );
}
