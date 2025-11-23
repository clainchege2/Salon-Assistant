/**
 * Session Manager for Admin Portal
 * Handles automatic logout after 8 hours
 */

class SessionManager {
  constructor() {
    this.checkInterval = null;
    this.SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    this.CHECK_INTERVAL = 60 * 1000; // Check every minute
  }

  /**
   * Start monitoring the session
   */
  start() {
    // Store login time
    const loginTime = localStorage.getItem('adminLoginTime');
    if (!loginTime) {
      localStorage.setItem('adminLoginTime', Date.now().toString());
    }

    // Start checking session validity
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, this.CHECK_INTERVAL);

    // Check immediately
    this.checkSession();
  }

  /**
   * Stop monitoring the session
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check if session is still valid
   */
  checkSession() {
    const token = localStorage.getItem('adminToken');
    const loginTime = localStorage.getItem('adminLoginTime');

    // If no token or login time, session is invalid
    if (!token || !loginTime) {
      return;
    }

    const now = Date.now();
    const elapsed = now - parseInt(loginTime);

    // If session has expired (8 hours)
    if (elapsed >= this.SESSION_DURATION) {
      console.log('Session expired after 8 hours');
      this.logout();
    }
  }

  /**
   * Logout and redirect to login page
   */
  logout() {
    this.stop();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant');
    localStorage.removeItem('adminLoginTime');
    
    // Redirect to login
    window.location.href = '/login';
  }

  /**
   * Reset session timer (call this on login)
   */
  reset() {
    localStorage.setItem('adminLoginTime', Date.now().toString());
  }

  /**
   * Get remaining session time in milliseconds
   */
  getRemainingTime() {
    const loginTime = localStorage.getItem('adminLoginTime');
    if (!loginTime) return 0;

    const elapsed = Date.now() - parseInt(loginTime);
    const remaining = this.SESSION_DURATION - elapsed;
    
    return Math.max(0, remaining);
  }

  /**
   * Get remaining time formatted as string
   */
  getRemainingTimeFormatted() {
    const remaining = this.getRemainingTime();
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m`;
  }
}

// Export singleton instance
const sessionManager = new SessionManager();
export default sessionManager;
