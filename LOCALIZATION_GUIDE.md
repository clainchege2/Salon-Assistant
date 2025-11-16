# Localization System Guide

## Overview
The application now supports region-aware formatting for currency, dates, times, and phone numbers based on the tenant's country/region settings.

## How It Works

### 1. Tenant Settings
Each tenant has country and currency settings stored in the database:
```javascript
{
  country: 'Kenya',  // or 'USA', 'UK', 'Nigeria', etc.
  settings: {
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    locale: 'en-KE'
  }
}
```

### 2. Supported Countries
Currently configured countries:
- **Kenya**: KES (Kenyan Shilling) - KSh symbol
- **USA**: USD (US Dollar) - $ symbol
- **UK**: GBP (British Pound) - £ symbol
- **Nigeria**: NGN (Nigerian Naira) - ₦ symbol
- **South Africa**: ZAR (South African Rand) - R symbol
- **Ghana**: GHS (Ghanaian Cedi) - GH₵ symbol

### 3. Usage in Components

Import formatters from the utilities:
```javascript
import { formatCurrency, formatDate, formatTime, formatPhone } from '../../utils/formatters';

// Use in your component
<div>{formatCurrency(1500)}</div>  // Shows "KSh 1,500" for Kenya
<div>{formatDate(new Date())}</div>  // Shows "16/11/2025" for Kenya
<div>{formatTime(new Date())}</div>  // Shows "20:30" for Kenya, "8:30 PM" for USA
```

### 4. How Tenant Data is Loaded

**On Login:**
- Backend returns tenant data with country and settings
- Frontend stores it in `localStorage.setItem('tenant', ...)`

**On Page Reload:**
- App fetches user data from `/api/v1/auth/me`
- Backend includes tenant data in the response
- Frontend updates localStorage

**In Components:**
- Formatters automatically read from localStorage
- No need to pass tenant data as props

### 5. Adding New Countries

To add a new country, update `admin-portal/src/utils/localization.js`:

```javascript
const CURRENCY_CONFIG = {
  // ... existing countries
  'New Country': {
    code: 'XXX',      // ISO currency code
    locale: 'en-XX',  // Locale for formatting
    symbol: 'X',      // Currency symbol
    name: 'Currency Name'
  }
};
```

Also update the Tenant model enum in `backend/src/models/Tenant.js`:
```javascript
country: {
  type: String,
  default: 'Kenya',
  enum: ['Kenya', 'USA', 'UK', 'Nigeria', 'New Country']
}
```

### 6. Available Formatter Functions

```javascript
// Currency
formatCurrency(amount)           // Auto-formats based on tenant country
getCurrencySymbol()              // Returns just the symbol (e.g., "KSh")
getCurrencyCode()                // Returns currency code (e.g., "KES")

// Dates
formatDate(date)                 // Short date format
formatDateLong(date)             // Long date with day name
formatDateTime(date)             // Date and time combined

// Time
formatTime(date)                 // 24h for most countries, 12h for USA
formatTime12(date)               // Always 12-hour format

// Phone
formatPhone(phoneNumber)         // Formats based on country standards

// Relative
getRelativeTime(date)            // "2 hours ago", "in 3 days", etc.
```

### 7. Testing Different Regions

To test with different regions:

1. Update tenant in database:
```javascript
db.tenants.updateOne(
  { slug: 'your-salon' },
  { 
    $set: { 
      country: 'USA',
      'settings.currency': 'USD'
    }
  }
)
```

2. Log out and log back in
3. All currency and formatting will update automatically

### 8. Default Behavior

If tenant data is not available or country is not configured:
- Defaults to Kenya (KES)
- Console warning is logged
- App continues to function normally

## Benefits

✅ **Automatic**: No need to manually pass currency/locale props  
✅ **Consistent**: All components use the same formatting  
✅ **Scalable**: Easy to add new countries  
✅ **User-friendly**: Shows values in familiar formats  
✅ **Multi-tenant**: Each salon can have different settings  

## Migration Notes

All existing components using hardcoded `$` or `£` symbols have been updated to use `formatCurrency()`. The system is backward compatible - if tenant data is missing, it defaults to Kenya settings.
