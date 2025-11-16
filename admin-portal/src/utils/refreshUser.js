import axios from 'axios';

/**
 * Refresh user data from the server and update localStorage
 * This is useful when permissions are updated by an admin
 */
export async function refreshUserData() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await axios.get('http://localhost:5000/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      // Update localStorage with fresh user data
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Store tenant data for localization
      if (response.data.user.tenant) {
        localStorage.setItem('tenant', JSON.stringify(response.data.user.tenant));
      }
      
      console.log('✅ User data refreshed:', response.data.user);
      return response.data.user;
    }
  } catch (error) {
    console.error('❌ Failed to refresh user data:', error);
    throw error;
  }
}

/**
 * Check if user data in localStorage is stale (older than 5 minutes)
 */
export function isUserDataStale() {
  const lastRefresh = localStorage.getItem('userDataRefreshedAt');
  if (!lastRefresh) return true;
  
  const fiveMinutes = 5 * 60 * 1000;
  return Date.now() - parseInt(lastRefresh) > fiveMinutes;
}

/**
 * Mark user data as refreshed
 */
export function markUserDataRefreshed() {
  localStorage.setItem('userDataRefreshedAt', Date.now().toString());
}
