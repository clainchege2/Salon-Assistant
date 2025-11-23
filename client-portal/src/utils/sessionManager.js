import axios from 'axios';

const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
const WARNING_TIME = 5 * 60 * 1000; // Show warning 5 minutes before expiration
const CHECK_INTERVAL = 60 * 1000; // Check every minute

class SessionManager {
  constructor() {
    this.timeoutId = null;
    this.warningTimeoutId = null;
    this.checkIntervalId = null;
    this.onSessionExpired = null;
    this.onSessionWarning = null;
  }

  // Start session monitoring
  start(onSessionExpired, onSessionWarning) {
    this.onSessionExpired = onSessionExpired;
    this.onSessionWarning = onSessionWarning;
    
    // Clear any existing timers
    this.stop();
    
    // Set session expiration timer
    this.timeoutId = setTimeout(() => {
      this.handleSessionExpired();
    }, SESSION_TIMEOUT);

    // Set warning timer (5 minutes before expiration)
    this.warningTimeoutId = setTimeout(() => {
      if (this.onSessionWarning) {
        this.onSessionWarning();
      }
    }, SESSION_TIMEOUT - WARNING_TIME);

    // Check token validity periodically
    this.checkIntervalId = setInterval(() => {
      this.checkTokenValidity();
    }, CHECK_INTERVAL);

    // Store session start time
    localStorage.setItem('sessionStartTime', Date.now().toString());
  }

  // Stop session monitoring
  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  // Reset session timer (call on user activity)
  reset() {
    const token = localStorage.getItem('clientToken');
    if (token) {
      this.start(this.onSessionExpired, this.onSessionWarning);
    }
  }

  // Handle session expiration
  handleSessionExpired() {
    this.stop();
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientData');
    localStorage.removeItem('sessionStartTime');
    
    if (this.onSessionExpired) {
      this.onSessionExpired();
    }
  }

  // Check if token is still valid
  async checkTokenValidity() {
    const token = localStorage.getItem('clientToken');
    if (!token) {
      this.handleSessionExpired();
      return;
    }

    try {
      // Try to get user profile to verify token
      await axios.get(
        `${process.env.REACT_APP_API_URL}/api/v1/client-auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      // If token is invalid or expired, logout
      if (error.response?.status === 401) {
        this.handleSessionExpired();
      }
    }
  }

  // Get remaining session time in minutes
  getRemainingTime() {
    const startTime = localStorage.getItem('sessionStartTime');
    if (!startTime) return 0;

    const elapsed = Date.now() - parseInt(startTime);
    const remaining = SESSION_TIMEOUT - elapsed;
    return Math.max(0, Math.floor(remaining / 60000)); // Convert to minutes
  }
}

export default new SessionManager();
