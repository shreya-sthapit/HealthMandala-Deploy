import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';

const LandingPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [specialtyCounts, setSpecialtyCounts] = useState({});
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  
  // Quick search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [allDoctors, setAllDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  useEffect(() => {
    fetchDoctorsAndSpecialties();
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const res = await fetch(API_BASE_URL + '/api/partner/approved');
      const data = await res.json();
      if (data.success && data.hospitals) {
        setHospitals(data.hospitals); // Store all hospitals for dropdown
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoadingHospitals(false);
    }
  };

  const fetchDoctorsAndSpecialties = async () => {
    try {
      const [doctorsRes, countsRes] = await Promise.all([
        fetch(API_BASE_URL + '/api/doctor/approved'),
        fetch(API_BASE_URL + '/api/doctor/specialty-counts')
      ]);

      const doctorsData = await doctorsRes.json();
      const countsData = await countsRes.json();

      if (doctorsData.success && doctorsData.doctors) {
        setAllDoctors(doctorsData.doctors); // Store all doctors for search
        setDoctors(doctorsData.doctors.slice(0, 5)); // Show first 5 in carousel
      }

      if (countsData.success) {
        setSpecialtyCounts(countsData.counts);
        // Build specialties list from actual DB data (sorted by count desc)
        setSpecialties(Object.keys(countsData.counts).slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoadingDoctors(false);
    }
  };
  
  const handleDoctorSearch = () => {
    if (!searchQuery.trim()) {
      alert('Please enter a doctor name or specialty');
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results = allDoctors.filter(doc => 
      doc.name.toLowerCase().includes(query) || 
      doc.specialty.toLowerCase().includes(query)
    );
    
    if (results.length > 0) {
      navigate('/find-doctors', { state: { searchQuery: searchQuery } });
    } else {
      alert('No doctors found matching your search');
    }
  };
  
  const handleHospitalSelect = () => {
    if (!selectedHospital) {
      alert('Please select a hospital');
      return;
    }
    
    navigate('/book-appointment', { state: { hospitalFilter: selectedHospital } });
  };

  const getHospitalLocation = (hospital) => {
    const parts = [];
    if (hospital.palika) parts.push(hospital.palika);
    if (hospital.district && hospital.district !== hospital.palika) parts.push(hospital.district);
    return parts.join(', ') || 'Nepal';
  };

  // Helper functions to calculate next available time
  const getAvailableDays = (doc) => {
    if (doc.hospitalSchedules && doc.hospitalSchedules.length > 0) {
      const hospitalSchedule = doc.hospitalSchedules[0];
      if (hospitalSchedule.schedule && hospitalSchedule.schedule.length > 0) {
        return hospitalSchedule.schedule.filter(s => s.active).map(s => s.day);
      }
    }
    if (doc.schedule && doc.schedule.length > 0) {
      return doc.schedule.filter(s => s.active).map(s => s.day);
    }
    return doc.availableDays || [];
  };

  const getNextDates = (doc) => {
    const days = getAvailableDays(doc);
    if (!days.length) return [];
    const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const results = [];
    for (let i = 0; i < 14 && results.length < 3; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      if (days.includes(dayNames[d.getDay()])) {
        results.push(d);
      }
    }
    return results;
  };

  const getTimeSlots = (doc, date) => {
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
    let start = doc.availableTimeStart || '09:00';
    let end = doc.availableTimeEnd || '17:00';
    let breakStart = null;
    let breakEnd = null;
    let hasBreak = false;
    
    let daySchedule = null;
    if (doc.hospitalSchedules && doc.hospitalSchedules.length > 0) {
      const hospitalSchedule = doc.hospitalSchedules[0];
      if (hospitalSchedule.schedule) {
        daySchedule = hospitalSchedule.schedule.find(s => s.day === dayName && s.active);
      }
    }
    if (!daySchedule && doc.schedule) {
      daySchedule = doc.schedule.find(s => s.day === dayName && s.active);
    }
    
    if (daySchedule) {
      start = daySchedule.start;
      end = daySchedule.end;
      if (daySchedule.hasBreak && daySchedule.breakStart && daySchedule.breakEnd) {
        hasBreak = true;
        breakStart = daySchedule.breakStart;
        breakEnd = daySchedule.breakEnd;
      }
    }
    
    const slots = [];
    const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
    const toStr = m => { const h = Math.floor(m/60); const mn = m%60; return `${String(h).padStart(2,'0')}:${String(mn).padStart(2,'0')}`; };
    
    const startMin = toMin(start);
    const endMin = toMin(end);
    const breakStartMin = hasBreak ? toMin(breakStart) : null;
    const breakEndMin = hasBreak ? toMin(breakEnd) : null;
    const interval = doc.consultationDuration || 10;
    
    for (let m = startMin; m < endMin; m += interval) {
      if (hasBreak && m >= breakStartMin && m < breakEndMin) {
        continue;
      }
      slots.push(toStr(m));
    }
    
    return slots;
  };

  const getNextAvailableTime = (doc) => {
    const dates = getNextDates(doc);
    if (dates.length === 0) return null;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const todayStr = new Date().toISOString().split('T')[0];
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    for (const date of dates) {
      const slots = getTimeSlots(doc, date);
      if (slots.length === 0) continue;

      const dateIso = date.toISOString().split('T')[0];
      const isToday = dateIso === todayStr;

      for (const slot of slots) {
        if (isToday) {
          const [h, m] = slot.split(':').map(Number);
          if (h * 60 + m <= nowMinutes) continue;
        }
        const month = monthNames[date.getMonth()];
        const day = date.getDate();
        const [hours, minutes] = slot.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
        const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        return `Next Available: ${month} ${day} at ${timeStr}`;
      }
    }

    return null;
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <p className="hero-eyebrow">Nepal's Trusted Healthcare Platform</p>
            <h1>
              Book Doctor<br />Appointments<br />
              <span className="hero-gradient-text">Instantly, Anytime, Anywhere</span>
            </h1>
            <p>
              Connect with verified specialists in seconds. Fast booking, instant confirmation, and care you can trust, built for patients across Nepal.
            </p>
            <div className="hero-buttons">
              <Link to={isLoggedIn && userRole === 'patient' ? '/find-doctors' : '/auth?role=patient&mode=signup'} className="btn btn-primary">Consult Now</Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-illustration"> 
              <img src="/Doctor.png" alt="Doctor" className="hero-doctor-img" />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Search Section */}
      <section className="quick-search-section">
        <div className="quick-search-container">
          <h2>Find Your Doctor or Hospital</h2>
          <p>Quick access to book appointments</p>
          
          <div className="quick-search-boxes">
            {/* Doctor Search */}
            <div className="search-box">
              <div className="search-box-header">
                <h3>Search Doctor</h3>
              </div>
              <div className="input-with-icon">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00a896" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search by doctor name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleDoctorSearch()}
                  className="search-input"
                />
              </div>
              <button onClick={handleDoctorSearch} className="search-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Search Doctor
              </button>
            </div>

            {/* Hospital Dropdown */}
            <div className="search-box">
              <div className="search-box-header">
                <h3>Book at Hospital</h3>
              </div>
              <div className="input-with-icon">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                  className="hospital-select"
                >
                  <option value="">Select a hospital...</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital._id} value={hospital.hospitalName}>
                      {hospital.hospitalName}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={handleHospitalSelect} className="search-btn hospital-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-title">
          <h2>Why Choose HealthMandala?</h2>
          <p>Experience healthcare booking like never before</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrap" style={{ background: 'linear-gradient(135deg, #e0f7f4, #b2ece6)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00a896" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <h3>Easy Scheduling</h3>
            <p>Book appointments 24/7 with just a few taps. No more waiting on hold.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap" style={{ background: 'linear-gradient(135deg, #e8f4fd, #bde0f9)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h3>Verified Doctors</h3>
            <p>All our doctors are verified professionals with proven track records.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap" style={{ background: 'linear-gradient(135deg, #fef9e7, #fde68a)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </div>
            <h3>Smart Reminders</h3>
            <p>Never miss an appointment with our automated reminder system.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap" style={{ background: 'linear-gradient(135deg, #fce7f3, #f9a8d4)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3>Secure & Private</h3>
            <p>Your health data is encrypted and protected with industry standards.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrap" style={{ background: 'linear-gradient(135deg, #ede9fe, #c4b5fd)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3>24/7 Support</h3>
            <p>Our support team is always ready to help you with any queries.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-title">
          <h2>How It Works</h2>
          <p>Book your appointment in 3 simple steps</p>
        </div>
        <div className="steps">
          <div className="step">
            <div className="step-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <div className="step-badge">1</div>
            </div>
            <div className="step-connector">
              <svg width="80" height="20" viewBox="0 0 80 20"><path d="M0 10 Q40 0 80 10" stroke="#00a896" strokeWidth="2" strokeDasharray="6 4" fill="none"/><polygon points="76,6 80,10 76,14" fill="#00a896"/></svg>
            </div>
            <h3>Search Doctor</h3>
            <p>Find doctors by specialty, location, or name</p>
          </div>
          <div className="step">
            <div className="step-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <div className="step-badge">2</div>
            </div>
            <div className="step-connector">
              <svg width="80" height="20" viewBox="0 0 80 20"><path d="M0 10 Q40 0 80 10" stroke="#00a896" strokeWidth="2" strokeDasharray="6 4" fill="none"/><polygon points="76,6 80,10 76,14" fill="#00a896"/></svg>
            </div>
            <h3>Choose Time</h3>
            <p>Select a convenient time slot from available options</p>
          </div>
          <div className="step">
            <div className="step-icon-wrap">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <div className="step-badge">3</div>
            </div>
            <div className="step-connector" style={{ visibility: 'hidden' }}>
              <svg width="80" height="20" viewBox="0 0 80 20"><path d="M0 10 Q40 0 80 10" stroke="#00a896" strokeWidth="2" strokeDasharray="6 4" fill="none"/></svg>
            </div>
            <h3>Confirm Booking</h3>
            <p>Confirm your appointment and receive instant confirmation</p>
          </div>
        </div>
      </section>

      {/* Stats Section removed */}

      {/* Browse Doctors Section */}
      <section className="browse-doctors">
        <div className="section-title">
          <h2>Appointments with Top Doctors</h2>
          <p>Experienced medical practitioners available to schedule appointments</p>
        </div>
        
        {loadingDoctors ? (
          <div className="loading-state">Loading doctors...</div>
        ) : (
          <>
            <div className="doctors-carousel">
              {doctors.map((doctor) => {
                // Fix path: strip "backend/" prefix since server serves /uploads directly
                const photoPath = doctor.profilePhoto
                  ? doctor.profilePhoto.replace(/\\/g, '/').replace(/^backend\//, '')
                  : null;
                return (
                <div key={doctor.id} className="doctor-card-browse">
                  <div className="doctor-image">
                    {photoPath ? (
                      <img
                        src={`/${photoPath}`}
                        alt={doctor.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="doctor-avatar"
                      style={{ display: photoPath ? 'none' : 'flex' }}
                    >
                      {doctor.name.split(' ')[1]?.[0] || 'D'}
                    </div>
                  </div>
                  <h3>{doctor.name}</h3>
                  <p className="specialty">{doctor.specialty}</p>
                  <p className="availability">
                    {getNextAvailableTime(doctor) || 'Contact clinic for availability'}
                  </p>
                  {isLoggedIn ? (
                    <button
                      className="btn btn-primary btn-small"
                      onClick={() => navigate('/book-appointment', { state: { preSelectedDoctor: doctor } })}
                    >
                      Book Appointment
                    </button>
                  ) : (
                    <Link to={`/login?redirect=/find-doctors`} className="btn btn-primary btn-small">
                      Book Appointment
                    </Link>
                  )}
                </div>
                );
              })}
            </div>
            <div className="browse-footer">
              <Link to="/find-doctors" className="view-all-link">View all Doctors →</Link>
            </div>
          </>
        )}
      </section>

      {/* Browse Specialties Section */}
      <section className="browse-specialties">
        <div className="specialties-header">
          <div className="specialties-header-left">
            <h2>Easy Appointment with 24 area of specialities</h2>
            <p>More than 200 Doctors on HealthMandala providing easy appointment</p>
          </div>
          <Link to="/specialties" className="view-all-btn">View All Specialists →</Link>
        </div>
        <div className="specialties-scroll-wrapper">
          <div className="specialties-track">
            {[
              { name: 'Ayurveda Physician', fullName: 'Ayurveda Physician (Traditional Medicine Specialist)', sub: 'Traditional Medicine Specialist', icon: '🌿' },
              { name: 'Cardiologist', fullName: 'Cardiologist (Heart Specialist)', sub: 'Heart Specialist', icon: '🫀' },
              { name: 'Dental Surgeon', fullName: 'Dental Surgeon (Teeth & Oral Specialist)', sub: 'Teeth & Oral Specialist', icon: '🦷' },
              { name: 'Dermatologist', fullName: 'Dermatologist (Skin & Hair Specialist)', sub: 'Skin & Hair Specialist', icon: '🧬' },
              { name: 'Endocrinologist', fullName: 'Endocrinologist (Diabetes & Hormone Specialist)', sub: 'Diabetes & Hormone Specialist', icon: '⚗️' },
              { name: 'Gastroenterologist', fullName: 'Gastroenterologist (Stomach & Liver Specialist)', sub: 'Stomach & Liver Specialist', icon: '🫁' },
              { name: 'General Physician', fullName: 'General Physician (Internal Medicine & Fever)', sub: 'Internal Medicine & Fever', icon: '🩺' },
              { name: 'General Practitioner', fullName: 'General Practitioner (Family Doctor)', sub: 'Family Doctor', icon: '👨‍⚕️' },
              { name: 'General Surgeon', fullName: 'General Surgeon (General Operations)', sub: 'General Operations', icon: '🏥' },
              { name: 'Gynecologist & Obstetrician', fullName: 'Gynecologist & Obstetrician (Women\'s Health & Pregnancy)', sub: 'Women\'s Health & Pregnancy', icon: '🤰' },
              { name: 'Nephrologist', fullName: 'Nephrologist (Kidney Specialist)', sub: 'Kidney Specialist', icon: '🔬' },
              { name: 'Neurologist', fullName: 'Neurologist (Brain & Nerve Specialist)', sub: 'Brain & Nerve Specialist', icon: '🧠' },
              { name: 'Neurosurgeon', fullName: 'Neurosurgeon (Brain & Spine Surgeon)', sub: 'Brain & Spine Surgeon', icon: '🧠' },
              { name: 'Oncologist', fullName: 'Oncologist (Cancer Specialist)', sub: 'Cancer Specialist', icon: '🎗️' },
              { name: 'Ophthalmologist', fullName: 'Ophthalmologist (Eye Specialist)', sub: 'Eye Specialist', icon: '👁️' },
              { name: 'Orthopedic Surgeon', fullName: 'Orthopedic Surgeon (Bone & Joint Specialist)', sub: 'Bone & Joint Specialist', icon: '🦴' },
              { name: 'Otolaryngologist', fullName: 'Otolaryngologist (ENT - Ear, Nose & Throat Specialist)', sub: 'ENT - Ear, Nose & Throat Specialist', icon: '👂' },
              { name: 'Pediatrician', fullName: 'Pediatrician (Child & Newborn Specialist)', sub: 'Child & Newborn Specialist', icon: '👶' },
              { name: 'Physiotherapist', fullName: 'Physiotherapist (Physical Rehab Specialist)', sub: 'Physical Rehab Specialist', icon: '🏃' },
              { name: 'Psychiatrist', fullName: 'Psychiatrist (Mental Health & Counseling Specialist)', sub: 'Mental Health & Counseling Specialist', icon: '🧘' },
              { name: 'Pulmonologist', fullName: 'Pulmonologist (Chest & Lung Specialist)', sub: 'Chest & Lung Specialist', icon: '🫁' },
              { name: 'Radiologist', fullName: 'Radiologist (X-Ray & Ultrasound Specialist)', sub: 'X-Ray & Ultrasound Specialist', icon: '📡' },
              { name: 'Rheumatologist', fullName: 'Rheumatologist (Arthritis & Joint Pain Specialist)', sub: 'Arthritis & Joint Pain Specialist', icon: '🦴' },
              { name: 'Urologist', fullName: 'Urologist (Urinary & Kidney Stone Specialist)', sub: 'Urinary & Kidney Stone Specialist', icon: '🔬' },
            ].map((spec, idx) => (
              <div key={idx} className="specialty-card-new">
                <div className="specialty-icon-box">
                  <span>{spec.icon}</span>
                </div>
                <h4>{spec.name.toUpperCase()}</h4>
                <p className="spec-sub">{spec.sub}</p>
                <p className="spec-count">
                  {(() => {
                    // Exact match first, then case-insensitive partial match
                    const exact = specialtyCounts[spec.name];
                    if (exact !== undefined) return exact;
                    const key = Object.keys(specialtyCounts).find(k =>
                      k.toLowerCase().includes(spec.name.toLowerCase()) ||
                      spec.name.toLowerCase().includes(k.toLowerCase())
                    );
                    return key ? specialtyCounts[key] : 0;
                  })()} Doctors
                </p>
                <Link
                  to="/find-doctors"
                  state={{ preSelectedSpecialty: spec.fullName }}
                  className="consult-btn"
                >Consult Now</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse Hospitals Section */}
      <section className="browse-hospitals">
        <div className="section-title">
          <h2>Book Appointment at Hospital</h2>
          <p>For easy appointments from any place at top hospitals in Nepal</p>
        </div>
        
        {loadingHospitals ? (
          <div className="loading-state">Loading hospitals...</div>
        ) : hospitals.length > 0 ? (
          <>
            <div className="hospitals-carousel">
              {hospitals.slice(0, 6).map((hospital) => (
                <div key={hospital._id} className="hospital-card-browse">
                  <div className="hospital-image">
                    {hospital.logoUrl ? (
                      <img 
                        src={`${hospital.logoUrl}`} 
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
                        fontSize: '2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {hospital.hospitalName.charAt(0)}
                    </div>
                  </div>
                  <h3>{hospital.hospitalName}</h3>
                  <p className="location">{getHospitalLocation(hospital)}</p>
                  <Link
                    to="/find-doctors"
                    state={{ hospitalFilter: hospital.hospitalName }}
                    className="btn btn-primary btn-small"
                  >Book an Appointment</Link>
                </div>
              ))}
            </div>

            <div className="browse-footer">
              <Link to="/hospitals" className="view-all-link">View all Hospitals →</Link>
            </div>
          </>
        ) : (
          <div className="loading-state">No hospitals available at the moment</div>
        )}
      </section>

      {/* CTA Section removed */}

      {/* Doctor CTA Section */}
      <section className="doctor-cta-section">
        <div className="doctor-cta-inner">
          <div className="doctor-cta-left">
            <img src="/Text.png" alt="Are you a Doctor?" className="doctor-cta-img" />
          </div>
          <div className="doctor-cta-right">
            <h2>Join our growing network of<br/>healthcare professionals <span>NOW!</span></h2>
            <p>Register as a doctor on HealthMandala and connect with thousands of patients. Manage your schedule, and appointments all in one place.</p>
            <div className="doctor-cta-actions">
              <Link to="/doctor-auth" className="btn btn-primary doctor-signup-btn">
                Doctor Login
              </Link>
            </div>
            <div className="doctor-cta-perks">
              <div className="perk">
                <span className="perk-icon">✓</span>
                <span>Flexible scheduling</span>
              </div>
              <div className="perk">
                <span className="perk-icon">✓</span>
                <span>Streamlined workflow</span>
              </div>
              <div className="perk">
                <span className="perk-icon">✓</span>
                <span>Automated reminders</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer is rendered globally in App.js */}
    </>
  );
};

export default LandingPage;
