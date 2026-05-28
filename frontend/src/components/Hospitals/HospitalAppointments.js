import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './HospitalAppointments.css';

const HospitalAppointments = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    'All',
    'Private Hospital',
    'Teaching Hospital',
    'Government Hospital',
    'Community / Non-Profit Hospital',
    'Specialized Clinic',
    'Diagnostic & Lab Center',
    'Polyclinic',
    'Ayurveda and Alternative Medicine Center',
    'Other'
  ];

  const fetchHospitals = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/partner/approved');
      const data = await res.json();
      if (data.success && data.hospitals) {
        setHospitals(data.hospitals);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getHospitalLocation = (hospital) => {
    const parts = [];
    if (hospital.palika) parts.push(hospital.palika);
    if (hospital.district && hospital.district !== hospital.palika) parts.push(hospital.district);
    return parts.join(', ') || 'Nepal';
  };

  const getHospitalType = (category) => {
    if (!category) return 'Other';
    
    // First, check for exact match with our categories
    const exactMatch = categories.find(cat => 
      cat.toLowerCase() === category.toLowerCase()
    );
    if (exactMatch) return exactMatch;
    
    // Then check for keyword matches
    const cat = category.toLowerCase();
    if (cat.includes('private')) return 'Private Hospital';
    if (cat.includes('teaching')) return 'Teaching Hospital';
    if (cat.includes('government')) return 'Government Hospital';
    if (cat.includes('community') || cat.includes('non-profit')) return 'Community / Non-Profit Hospital';
    if (cat.includes('specialized') || cat.includes('clinic')) return 'Specialized Clinic';
    if (cat.includes('diagnostic') || cat.includes('lab')) return 'Diagnostic & Lab Center';
    if (cat.includes('polyclinic')) return 'Polyclinic';
    if (cat.includes('ayurveda') || cat.includes('alternative')) return 'Ayurveda and Alternative Medicine Center';
    
    // If it's just "Hospital" or anything else, return Other
    return 'Other';
  };

  const filtered = hospitals.filter(h => {
    const matchSearch = h.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getHospitalLocation(h).toLowerCase().includes(searchTerm.toLowerCase());
    const hospitalType = getHospitalType(h.facilityCategory);
    const matchType = typeFilter === 'All' || hospitalType === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) {
    return (
      <div className="hospital-page">
        <div className="hospital-content">
          <div className="loading-state">Loading hospitals...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hospital-page">
      <div className="hospital-content">
        {/* Page Header */}
        <div className="hospital-page-header">
          <h1>Book An Appointment at Hospitals</h1>
          <div className="hospital-controls">
            <div className="hospital-search-box">
              <input
                type="text"
                placeholder="Find Hospital"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button className="search-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </div>
            <div className="category-dropdown" ref={dropdownRef}>
              <button 
                className="category-dropdown-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>
                </svg>
                {typeFilter}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div className={`category-dropdown-menu ${dropdownOpen ? 'open' : ''}`}>
                <div className="category-dropdown-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Select category
                </div>
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`category-option ${typeFilter === cat ? 'selected' : ''}`}
                    onClick={() => {
                      setTypeFilter(cat);
                      setDropdownOpen(false);
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hospital Grid */}
        <div className="hospital-grid">
          {filtered.map(hospital => {
            const hospitalType = getHospitalType(hospital.facilityCategory);
            const API_BASE_URL = `http://${window.location.hostname}:5001`;
            
            // Convert category to CSS class name
            const badgeClass = hospitalType.toLowerCase()
              .replace(/\s+/g, '-')
              .replace(/[\/]/g, '-')
              .replace(/--+/g, '-');
            
            return (
              <div key={hospital._id} className="hospital-card">
                <div 
                  className="hospital-card-image"
                  onClick={() => {
                    navigate('/book-appointment', { state: { hospitalFilter: hospital.hospitalName } });
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {hospital.logoUrl ? (
                    <img 
                      src={`${API_BASE_URL}${hospital.logoUrl}`} 
                      alt={hospital.hospitalName}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="hospital-placeholder"
                    style={{ 
                      display: hospital.logoUrl ? 'none' : 'flex',
                      width: '100%',
                      height: '200px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '3rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {hospital.hospitalName.charAt(0)}
                  </div>
                </div>
                <div className="hospital-card-body">
                  <h3>{hospital.hospitalName}</h3>
                  <p className="hospital-location">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {getHospitalLocation(hospital)}
                  </p>
                  <div className="hospital-specialties">
                    <span className="spec-pill">{hospital.facilityCategory || 'Hospital'}</span>
                  </div>
                  <button
                    className="book-hospital-btn"
                    onClick={() => {
                      navigate('/book-appointment', { state: { hospitalFilter: hospital.hospitalName } });
                    }}
                  >
                    Book an Appointment →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <p>No hospitals found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalAppointments;
