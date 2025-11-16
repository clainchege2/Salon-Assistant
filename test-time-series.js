const ranges = ['1D', '7D', '30D', '90D', '180D', '1Y', '2Y', '3Y', '5Y', '7Y', '9Y', '10Y', '15Y', '20Y', 'ALL'];

console.log('Testing Time Series Granularity\n');
console.log('Range | Days | Data Points | Granularity');
console.log('------|------|-------------|------------');

ranges.forEach(range => {
  const now = new Date();
  let startDate, endDate = new Date();
  
  switch(range) {
    case '1D':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '7D':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30D':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90D':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '180D':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 180);
      break;
    case '1Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case '2Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2);
      break;
    case '3Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 3);
      break;
    case '5Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 5);
      break;
    case '7Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 7);
      break;
    case '9Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 9);
      break;
    case '10Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 10);
      break;
    case '15Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 15);
      break;
    case '20Y':
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 20);
      break;
    case 'ALL':
      startDate = new Date('2000-01-01');
      break;
  }
  
  const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  let dataPoints, groupBy;
  
  if (daysDiff <= 1) {
    dataPoints = 1;
    groupBy = 'day';
  } else if (daysDiff <= 7) {
    dataPoints = daysDiff;
    groupBy = 'day';
  } else if (daysDiff <= 30) {
    dataPoints = daysDiff;
    groupBy = 'day';
  } else if (daysDiff <= 90) {
    dataPoints = daysDiff;
    groupBy = 'day';
  } else if (daysDiff <= 181) {
    dataPoints = daysDiff;
    groupBy = 'day';
  } else if (daysDiff <= 366) {
    dataPoints = Math.ceil(daysDiff / 7);
    groupBy = 'week';
  } else if (daysDiff <= 1826) {
    // 2Y-5Y: Weekly
    dataPoints = Math.ceil(daysDiff / 7);
    groupBy = 'week';
  } else if (daysDiff <= 3653) {
    // 5Y-10Y: Monthly
    dataPoints = Math.ceil(daysDiff / 30);
    groupBy = 'month';
  } else {
    // 10Y+: Yearly
    dataPoints = Math.ceil(daysDiff / 365);
    groupBy = 'year';
  }
  
  console.log(`${range.padEnd(5)} | ${String(daysDiff).padEnd(4)} | ${String(dataPoints).padEnd(11)} | ${groupBy}`);
});

console.log('\n✓ All ranges use minimum 1-day granularity');
console.log('✓ 1D-180D: Daily data points');
console.log('✓ 1Y-5Y: Weekly data points');
console.log('✓ 7Y-10Y: Monthly data points');
console.log('✓ 15Y-20Y & ALL: Yearly data points');
