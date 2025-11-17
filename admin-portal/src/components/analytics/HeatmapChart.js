import React from 'react';
import './HeatmapChart.css';

const HeatmapChart = ({ data }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm'];
  
  // Generate sample data if none provided
  const heatmapData = data || generateSampleData();
  
  function generateSampleData() {
    const result = [];
    days.forEach((day, dayIndex) => {
      hours.forEach((hour, hourIndex) => {
        const value = Math.floor(Math.random() * 10);
        result.push({ day: dayIndex, hour: hourIndex, value });
      });
    });
    return result;
  }
  
  const getColor = (value) => {
    if (value === 0) return '#f5f5f5';
    if (value <= 2) return '#c7e9c0';
    if (value <= 4) return '#74c476';
    if (value <= 6) return '#31a354';
    if (value <= 8) return '#006d2c';
    return '#00441b';
  };
  
  const getTextColor = (value) => {
    return value > 4 ? 'white' : '#333';
  };
  
  const getCellData = (dayIndex, hourIndex) => {
    const cell = heatmapData.find(d => d.day === dayIndex && d.hour === hourIndex);
    return cell ? cell.value : 0;
  };
  
  return (
    <div className="heatmap-chart">
      <div className="heatmap-grid">
        <div className="heatmap-hours">
          <div className="hour-label empty"></div>
          {hours.map((hour, index) => (
            <div key={index} className="hour-label">{hour}</div>
          ))}
        </div>
        
        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="heatmap-row">
            <div className="day-label">{day}</div>
            {hours.map((hour, hourIndex) => {
              const value = getCellData(dayIndex, hourIndex);
              return (
                <div
                  key={hourIndex}
                  className="heatmap-cell"
                  style={{
                    background: getColor(value),
                    color: getTextColor(value)
                  }}
                  title={`${day} ${hour}: ${value} bookings`}
                >
                  {value > 0 ? value : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div className="heatmap-legend">
        <span>Less</span>
        <div className="legend-gradient"></div>
        <span>More</span>
      </div>
    </div>
  );
};

export default HeatmapChart;
