// Kenyan formatting utilities

// Format currency in Kenyan Shillings
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date in Kenyan format (DD/MM/YYYY)
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-KE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Format date with day name (e.g., "Monday, 15/01/2024")
export const formatDateLong = (date) => {
  return new Date(date).toLocaleDateString('en-KE', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Format time in 24-hour format (Kenyan standard)
export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Format time in 12-hour format with AM/PM
export const formatTime12 = (date) => {
  return new Date(date).toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

// Format date and time together
export const formatDateTime = (date) => {
  return `${formatDate(date)} at ${formatTime(date)}`;
};

// Format phone number (Kenyan format)
export const formatPhone = (phone) => {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +254 XXX XXX XXX
  if (cleaned.startsWith('254')) {
    return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  
  // Format as 0XXX XXX XXX
  if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  
  return phone;
};

// Get relative time (e.g., "2 hours ago", "in 3 days")
export const getRelativeTime = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 1) return `in ${diffDays} days`;
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === 0 && diffHours > 0) return `in ${diffHours} hours`;
  if (diffDays === 0 && diffMins > 0) return `in ${diffMins} minutes`;
  if (diffDays === -1) return 'yesterday';
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  if (diffHours < 0) return `${Math.abs(diffHours)} hours ago`;
  return 'just now';
};
