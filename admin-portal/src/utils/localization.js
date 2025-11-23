// Localization utilities based on tenant region/country

// Currency configurations by country
const CURRENCY_CONFIG = {
  Kenya: {
    code: 'KES',
    locale: 'en-KE',
    symbol: 'KSh',
    name: 'Kenyan Shilling'
  },
  USA: {
    code: 'USD',
    locale: 'en-US',
    symbol: '$',
    name: 'US Dollar'
  },
  UK: {
    code: 'GBP',
    locale: 'en-GB',
    symbol: '£',
    name: 'British Pound'
  },
  Nigeria: {
    code: 'NGN',
    locale: 'en-NG',
    symbol: '₦',
    name: 'Nigerian Naira'
  },
  'South Africa': {
    code: 'ZAR',
    locale: 'en-ZA',
    symbol: 'R',
    name: 'South African Rand'
  },
  Ghana: {
    code: 'GHS',
    locale: 'en-GH',
    symbol: 'GH₵',
    name: 'Ghanaian Cedi'
  }
};

// Get tenant settings from localStorage or API
const getTenantSettings = () => {
  try {
    const tenantData = localStorage.getItem('tenant');
    if (tenantData) {
      const tenant = JSON.parse(tenantData);
      return {
        country: tenant.country || 'Kenya',
        currency: tenant.settings?.currency || 'KES',
        timezone: tenant.settings?.timezone || 'Africa/Nairobi',
        locale: tenant.settings?.locale
      };
    }
  } catch (error) {
    console.warn('Could not load tenant settings:', error);
  }
  
  // Default to Kenya
  return {
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi'
  };
};

// Get currency config for current tenant
export const getCurrencyConfig = () => {
  const settings = getTenantSettings();
  const config = CURRENCY_CONFIG[settings.country];
  
  if (!config) {
    console.warn(`No currency config for country: ${settings.country}, using Kenya as default`);
    return CURRENCY_CONFIG.Kenya;
  }
  
  return config;
};

// Format currency based on tenant's region
export const formatCurrency = (amount) => {
  const config = getCurrencyConfig();
  
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// Format date based on tenant's region
export const formatDate = (date) => {
  const config = getCurrencyConfig();
  
  return new Date(date).toLocaleDateString(config.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Format date with day name
export const formatDateLong = (date) => {
  const config = getCurrencyConfig();
  
  return new Date(date).toLocaleDateString(config.locale, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Format time in 12-hour format with AM/PM (user-friendly for all regions)
export const formatTime = (date) => {
  const config = getCurrencyConfig();
  
  return new Date(date).toLocaleTimeString(config.locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Format phone number based on region
export const formatPhone = (phone) => {
  const settings = getTenantSettings();
  const cleaned = phone.replace(/\D/g, '');
  
  switch (settings.country) {
    case 'Kenya':
      // Format as +254 XXX XXX XXX or 0XXX XXX XXX
      if (cleaned.startsWith('254')) {
        return `+254 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
      }
      if (cleaned.startsWith('0')) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
      }
      break;
      
    case 'USA':
      // Format as (XXX) XXX-XXXX
      if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
      }
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
      }
      break;
      
    case 'UK':
      // Format as +44 XXXX XXXXXX
      if (cleaned.startsWith('44')) {
        return `+44 ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
      }
      break;
      
    default:
      return phone;
  }
  
  return phone;
};

// Get relative time
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

// Get currency symbol only
export const getCurrencySymbol = () => {
  const config = getCurrencyConfig();
  return config.symbol;
};

// Get currency code only
export const getCurrencyCode = () => {
  const config = getCurrencyConfig();
  return config.code;
};
