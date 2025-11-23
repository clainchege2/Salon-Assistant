import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionManager from '../utils/sessionManager';
import Toast from './Toast';

export default function SessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(5);
  const navigate = useNavigate();

  useEffect(() => {
    // Start session monitoring
    sessionManager.start(
      // On session expired
      () => {
        setShowWarning(false);
        navigate('/login', { 
          state: { message: 'Your session has expired. Please login again.' }
        });
      },
      // On session warning (5 minutes before expiration)
      () => {
        setShowWarning(true);
        setRemainingMinutes(5);
      }
    );

    // Update remaining time every minute when warning is shown
    const interval = setInterval(() => {
      if (showWarning) {
        const remaining = sessionManager.getRemainingTime();
        setRemainingMinutes(remaining);
        if (remaining <= 0) {
          setShowWarning(false);
        }
      }
    }, 60000); // Update every minute

    // Reset session on user activity
    const handleActivity = () => {
      if (!showWarning) {
        sessionManager.reset();
      }
    };

    // Listen for user activity
    window.addEventListener('click', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('mousemove', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('mousemove', handleActivity);
      sessionManager.stop();
    };
  }, [navigate, showWarning]);

  const handleExtendSession = () => {
    sessionManager.reset();
    setShowWarning(false);
  };

  if (!showWarning) return null;

  return (
    <Toast
      message={`Your session will expire in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}. Click to stay logged in.`}
      type="warning"
      onClose={handleExtendSession}
      duration={300000} // Show for 5 minutes
    />
  );
}
