// Region-aware formatting utilities
// This file now imports from localization.js for tenant-aware formatting

import {
  formatCurrency as formatCurrencyLocalized,
  formatDate as formatDateLocalized,
  formatDateLong as formatDateLongLocalized,
  formatTime as formatTimeLocalized,
  formatPhone as formatPhoneLocalized,
  getRelativeTime as getRelativeTimeLocalized,
  getCurrencySymbol,
  getCurrencyCode
} from './localization';

// Export localized functions
export const formatCurrency = formatCurrencyLocalized;
export const formatDate = formatDateLocalized;
export const formatDateLong = formatDateLongLocalized;
export const formatTime = formatTimeLocalized;
export const formatPhone = formatPhoneLocalized;
export const getRelativeTime = getRelativeTimeLocalized;

// Additional utility exports
export { getCurrencySymbol, getCurrencyCode };

// Format date and time together
export const formatDateTime = (date) => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

// Format time in 12-hour format with AM/PM (for compatibility)
export const formatTime12 = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};
