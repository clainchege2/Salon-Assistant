// Public holidays by country
const HOLIDAYS = {
  Kenya: [
    { date: '2025-01-01', name: 'New Year\'s Day', type: 'public' },
    { date: '2025-04-18', name: 'Good Friday', type: 'public' },
    { date: '2025-04-21', name: 'Easter Monday', type: 'public' },
    { date: '2025-05-01', name: 'Labour Day', type: 'public' },
    { date: '2025-06-01', name: 'Madaraka Day', type: 'public' },
    { date: '2025-10-10', name: 'Huduma Day', type: 'public' },
    { date: '2025-10-20', name: 'Mashujaa Day', type: 'public' },
    { date: '2025-12-12', name: 'Jamhuri Day', type: 'public' },
    { date: '2025-12-25', name: 'Christmas Day', type: 'public' },
    { date: '2025-12-26', name: 'Boxing Day', type: 'public' },
    // Islamic holidays (approximate dates)
    { date: '2025-03-30', name: 'Eid al-Fitr', type: 'public' },
    { date: '2025-06-06', name: 'Eid al-Adha', type: 'public' },
    // Special occasions for marketing
    { date: '2025-02-14', name: 'Valentine\'s Day', type: 'special' },
    { date: '2025-03-08', name: 'International Women\'s Day', type: 'special' },
    { date: '2025-05-11', name: 'Mother\'s Day', type: 'special' },
    { date: '2025-06-15', name: 'Father\'s Day', type: 'special' }
  ],
  
  USA: [
    { date: '2025-01-01', name: 'New Year\'s Day', type: 'public' },
    { date: '2025-01-20', name: 'Martin Luther King Jr. Day', type: 'public' },
    { date: '2025-02-17', name: 'Presidents\' Day', type: 'public' },
    { date: '2025-05-26', name: 'Memorial Day', type: 'public' },
    { date: '2025-07-04', name: 'Independence Day', type: 'public' },
    { date: '2025-09-01', name: 'Labor Day', type: 'public' },
    { date: '2025-10-13', name: 'Columbus Day', type: 'public' },
    { date: '2025-11-11', name: 'Veterans Day', type: 'public' },
    { date: '2025-11-27', name: 'Thanksgiving', type: 'public' },
    { date: '2025-12-25', name: 'Christmas Day', type: 'public' },
    // Special occasions
    { date: '2025-02-14', name: 'Valentine\'s Day', type: 'special' },
    { date: '2025-03-17', name: 'St. Patrick\'s Day', type: 'special' },
    { date: '2025-05-11', name: 'Mother\'s Day', type: 'special' },
    { date: '2025-06-15', name: 'Father\'s Day', type: 'special' },
    { date: '2025-10-31', name: 'Halloween', type: 'special' },
    { date: '2025-11-28', name: 'Black Friday', type: 'special' }
  ],
  
  UK: [
    { date: '2025-01-01', name: 'New Year\'s Day', type: 'public' },
    { date: '2025-04-18', name: 'Good Friday', type: 'public' },
    { date: '2025-04-21', name: 'Easter Monday', type: 'public' },
    { date: '2025-05-05', name: 'Early May Bank Holiday', type: 'public' },
    { date: '2025-05-26', name: 'Spring Bank Holiday', type: 'public' },
    { date: '2025-08-25', name: 'Summer Bank Holiday', type: 'public' },
    { date: '2025-12-25', name: 'Christmas Day', type: 'public' },
    { date: '2025-12-26', name: 'Boxing Day', type: 'public' },
    // Special occasions
    { date: '2025-02-14', name: 'Valentine\'s Day', type: 'special' },
    { date: '2025-03-08', name: 'International Women\'s Day', type: 'special' },
    { date: '2025-03-30', name: 'Mother\'s Day', type: 'special' },
    { date: '2025-06-15', name: 'Father\'s Day', type: 'special' }
  ],
  
  Nigeria: [
    { date: '2025-01-01', name: 'New Year\'s Day', type: 'public' },
    { date: '2025-04-18', name: 'Good Friday', type: 'public' },
    { date: '2025-04-21', name: 'Easter Monday', type: 'public' },
    { date: '2025-05-01', name: 'Workers\' Day', type: 'public' },
    { date: '2025-05-29', name: 'Democracy Day', type: 'public' },
    { date: '2025-10-01', name: 'Independence Day', type: 'public' },
    { date: '2025-12-25', name: 'Christmas Day', type: 'public' },
    { date: '2025-12-26', name: 'Boxing Day', type: 'public' },
    // Islamic holidays
    { date: '2025-03-30', name: 'Eid al-Fitr', type: 'public' },
    { date: '2025-06-06', name: 'Eid al-Adha', type: 'public' },
    { date: '2025-09-27', name: 'Maulud Nabiyy', type: 'public' },
    // Special occasions
    { date: '2025-02-14', name: 'Valentine\'s Day', type: 'special' },
    { date: '2025-03-08', name: 'International Women\'s Day', type: 'special' }
  ],
  
  'South Africa': [
    { date: '2025-01-01', name: 'New Year\'s Day', type: 'public' },
    { date: '2025-03-21', name: 'Human Rights Day', type: 'public' },
    { date: '2025-04-18', name: 'Good Friday', type: 'public' },
    { date: '2025-04-21', name: 'Family Day', type: 'public' },
    { date: '2025-04-27', name: 'Freedom Day', type: 'public' },
    { date: '2025-05-01', name: 'Workers\' Day', type: 'public' },
    { date: '2025-06-16', name: 'Youth Day', type: 'public' },
    { date: '2025-08-09', name: 'National Women\'s Day', type: 'public' },
    { date: '2025-09-24', name: 'Heritage Day', type: 'public' },
    { date: '2025-12-16', name: 'Day of Reconciliation', type: 'public' },
    { date: '2025-12-25', name: 'Christmas Day', type: 'public' },
    { date: '2025-12-26', name: 'Day of Goodwill', type: 'public' },
    // Special occasions
    { date: '2025-02-14', name: 'Valentine\'s Day', type: 'special' }
  ],
  
  Ghana: [
    { date: '2025-01-01', name: 'New Year\'s Day', type: 'public' },
    { date: '2025-03-06', name: 'Independence Day', type: 'public' },
    { date: '2025-04-18', name: 'Good Friday', type: 'public' },
    { date: '2025-04-21', name: 'Easter Monday', type: 'public' },
    { date: '2025-05-01', name: 'May Day', type: 'public' },
    { date: '2025-08-04', name: 'Founders\' Day', type: 'public' },
    { date: '2025-09-21', name: 'Kwame Nkrumah Memorial Day', type: 'public' },
    { date: '2025-12-25', name: 'Christmas Day', type: 'public' },
    { date: '2025-12-26', name: 'Boxing Day', type: 'public' },
    // Islamic holidays
    { date: '2025-03-30', name: 'Eid al-Fitr', type: 'public' },
    { date: '2025-06-06', name: 'Eid al-Adha', type: 'public' },
    // Special occasions
    { date: '2025-02-14', name: 'Valentine\'s Day', type: 'special' },
    { date: '2025-03-08', name: 'International Women\'s Day', type: 'special' }
  ]
};

/**
 * Get public holidays for a specific country
 * @param {string} country - Country name
 * @param {string} year - Year (optional, defaults to current year)
 * @returns {Array} Array of holidays
 */
exports.getHolidaysByCountry = (country, year = new Date().getFullYear()) => {
  const holidays = HOLIDAYS[country] || HOLIDAYS['Kenya']; // Default to Kenya
  
  // Filter by year if specified
  return holidays.filter(h => h.date.startsWith(year.toString()));
};

/**
 * Get upcoming holidays (next 90 days)
 * @param {string} country - Country name
 * @returns {Array} Array of upcoming holidays
 */
exports.getUpcomingHolidays = (country) => {
  const holidays = HOLIDAYS[country] || HOLIDAYS['Kenya'];
  const today = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);
  
  return holidays
    .filter(h => {
      const holidayDate = new Date(h.date);
      return holidayDate >= today && holidayDate <= ninetyDaysFromNow;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Get holiday by date
 * @param {string} country - Country name
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Object|null} Holiday object or null
 */
exports.getHolidayByDate = (country, date) => {
  const holidays = HOLIDAYS[country] || HOLIDAYS['Kenya'];
  return holidays.find(h => h.date === date) || null;
};

/**
 * Check if a date is a holiday
 * @param {string} country - Country name
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {boolean} True if holiday
 */
exports.isHoliday = (country, date) => {
  return exports.getHolidayByDate(country, date) !== null;
};

/**
 * Get marketing suggestions for upcoming holidays
 * @param {string} country - Country name
 * @returns {Array} Array of marketing suggestions
 */
exports.getMarketingSuggestions = (country) => {
  const upcoming = exports.getUpcomingHolidays(country);
  
  return upcoming.map(holiday => {
    const daysUntil = Math.ceil((new Date(holiday.date) - new Date()) / (1000 * 60 * 60 * 24));
    
    return {
      ...holiday,
      daysUntil,
      suggestion: getMarketingSuggestion(holiday.name, daysUntil),
      urgency: daysUntil <= 7 ? 'high' : daysUntil <= 14 ? 'medium' : 'low'
    };
  });
};

function getMarketingSuggestion(holidayName, daysUntil) {
  const suggestions = {
    'Valentine\'s Day': 'Offer couples packages, romantic hairstyles, and special date-night looks',
    'Mother\'s Day': 'Promote pampering packages, mother-daughter specials, and gift certificates',
    'Father\'s Day': 'Market grooming services, beard trims, and men\'s styling packages',
    'Christmas Day': 'Holiday party looks, festive hairstyles, and gift vouchers',
    'New Year\'s Day': 'New year, new look promotions and fresh start packages',
    'International Women\'s Day': 'Celebrate with special discounts and empowerment packages',
    'Easter Monday': 'Spring refresh specials and Easter-themed promotions',
    'Independence Day': 'Patriotic themed services and national pride discounts',
    'Black Friday': 'Massive discounts on services and product bundles'
  };
  
  const suggestion = suggestions[holidayName] || `Plan special promotions for ${holidayName}`;
  
  if (daysUntil <= 7) {
    return `🔥 URGENT: ${suggestion} - Only ${daysUntil} days left!`;
  } else if (daysUntil <= 14) {
    return `⏰ ${suggestion} - ${daysUntil} days to prepare`;
  } else {
    return `📅 ${suggestion} - ${daysUntil} days away`;
  }
}
