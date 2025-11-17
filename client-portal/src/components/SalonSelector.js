import React, { useState, useEffect, useRef } from 'react';
import './SalonSelector.css';

export default function SalonSelector({ value, onChange, salons, required = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredSalons, setFilteredSalons] = useState(salons);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setFilteredSalons(
      salons.filter(salon =>
        salon.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        salon.address?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, salons]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedSalon = salons.find(s => s.slug === value);

  const handleSelect = (salon) => {
    onChange(salon.slug);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="salon-selector" ref={dropdownRef}>
      <div 
        className={`salon-selector-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedSalon ? (
          <div className="selected-salon">
            <div className="salon-icon">🏢</div>
            <div className="salon-info">
              <div className="salon-name">{selectedSalon.businessName}</div>
              {selectedSalon.address && (
                <div className="salon-address">{selectedSalon.address}</div>
              )}
            </div>
          </div>
        ) : (
          <div className="placeholder">
            <span className="search-icon">🔍</span>
            <span>Search and select your salon...</span>
          </div>
        )}
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className="salon-dropdown">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="salon-list">
            {filteredSalons.length === 0 ? (
              <div className="no-results">
                <span>😕</span>
                <p>No salons found</p>
                <small>Try a different search term</small>
              </div>
            ) : (
              filteredSalons.map(salon => (
                <div
                  key={salon._id}
                  className={`salon-option ${value === salon.slug ? 'selected' : ''}`}
                  onClick={() => handleSelect(salon)}
                >
                  <div className="salon-icon">🏢</div>
                  <div className="salon-details">
                    <div className="salon-name">{salon.businessName}</div>
                    {salon.address && (
                      <div className="salon-address">📍 {salon.address}</div>
                    )}
                    {salon.phone && (
                      <div className="salon-phone">📞 {salon.phone}</div>
                    )}
                  </div>
                  {value === salon.slug && (
                    <span className="check-icon">✓</span>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="dropdown-footer">
            <small>{filteredSalons.length} salon{filteredSalons.length !== 1 ? 's' : ''} found</small>
          </div>
        </div>
      )}
    </div>
  );
}
