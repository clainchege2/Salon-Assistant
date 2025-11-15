import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BookingCalendar.css';

export default function BookingCalendar({ selectedDate, onSelectSlot, staffId, serviceDuration }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        const params = new URLSearchParams({
          date: selectedDate
        });
        
        if (staffId) {
          params.append('staffId', staffId);
        }

        console.log('Fetching slots for:', selectedDate, 'Staff:', staffId);
        const response = await axios.get(
          `http://localhost:5000/api/v1/bookings/availability?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('Slots response:', response.data);
        setSlots(response.data.data || []);
      } catch (error) {
        console.error('Error fetching slots:', error);
        console.error('Error details:', error.response?.data);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate, staffId]);

  const roundToNearestHour = (minutes) => {
    return Math.ceil(minutes / 60);
  };

  const isSlotAvailableForDuration = (slotIndex, duration) => {
    const hoursNeeded = roundToNearestHour(duration || 60);
    
    // Check if enough consecutive slots are available
    for (let i = 0; i < hoursNeeded; i++) {
      if (!slots[slotIndex + i] || !slots[slotIndex + i].available) {
        return false;
      }
    }
    return true;
  };

  const handleSlotClick = (slot, index) => {
    if (slot.available && isSlotAvailableForDuration(index, serviceDuration)) {
      onSelectSlot(slot);
    }
  };

  if (loading) {
    return <div className="calendar-loading">Loading available slots...</div>;
  }

  return (
    <div className="booking-calendar">
      <div className="calendar-header">
        <h3>Available Time Slots</h3>
        <p className="calendar-date">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        {serviceDuration && (
          <p className="duration-info">
            Service Duration: {serviceDuration} min (~{roundToNearestHour(serviceDuration)} hour{roundToNearestHour(serviceDuration) > 1 ? 's' : ''})
          </p>
        )}
      </div>
      
      <div className="slots-grid">
        {slots.map((slot, index) => {
          const canBook = slot.available && isSlotAvailableForDuration(index, serviceDuration);
          
          return (
            <button
              key={index}
              className={`time-slot ${canBook ? 'available' : 'booked'}`}
              onClick={() => handleSlotClick(slot, index)}
              disabled={!canBook}
            >
              <span className="slot-time">{slot.hour}</span>
              <span className="slot-status">{canBook ? '✓ Available' : '✗ Booked'}</span>
            </button>
          );
        })}
      </div>

      {slots.length === 0 && (
        <div className="no-slots">
          <p>No slots available for this date. Please select another date.</p>
        </div>
      )}
    </div>
  );
}
