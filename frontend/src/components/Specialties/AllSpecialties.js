import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import './AllSpecialties.css';

const AllSpecialties = () => {
  const navigate = useNavigate();
  const [specialtyCounts, setSpecialtyCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSpecialtyCounts();
  }, []);

  const fetchSpecialtyCounts = async () => {
    try {
      const res = await fetch(API_BASE_URL + '/api/doctor/specialty-counts');
      const data = await res.json();
      if (data.success) {
        setSpecialtyCounts(data.counts);
      }
    } catch (error) {
      console.error('Error fetching specialty counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const specialties = [
    { name: 'Ayurveda Physician', sub: 'Traditional Medicine Specialist', icon: '🌿' },
    { name: 'Cardiologist', sub: 'Heart Specialist', icon: '🫀' },
    { name: 'Dental Surgeon', sub: 'Teeth & Oral Specialist', icon: '🦷' },
    { name: 'Dermatologist', sub: 'Skin & Hair Specialist', icon: '🧬' },
    { name: 'Endocrinologist', sub: 'Diabetes & Hormone Specialist', icon: '💉' },
    { name: 'Gastroenterologist', sub: 'Stomach & Liver Specialist', icon: '🫁' },
    { name: 'General Physician', sub: 'Internal Medicine & Fever', icon: '🩺' },
    { name: 'General Practitioner', sub: 'Family Doctor', icon: '💊' },
    { name: 'General Surgeon', sub: 'General Operations', icon: '🏥' },
    { name: 'Gynecologist & Obstetrician', sub: 'Women\'s Health & Pregnancy', icon: '🤰' },
    { name: 'Nephrologist', sub: 'Kidney Specialist', icon: '🔬' },
    { name: 'Neurologist', sub: 'Brain & Nerve Specialist', icon: '🧠' },
    { name: 'Neurosurgeon', sub: 'Brain & Spine Surgeon', icon: '🧠' },
    { name: 'Oncologist', sub: 'Cancer Specialist', icon: '🎗️' },
    { name: 'Ophthalmologist', sub: 'Eye Specialist', icon: '👁️' },
    { name: 'Orthopedic Surgeon', sub: 'Bone & Joint Specialist', icon: '🦴' },
    { name: 'Otolaryngologist', sub: 'ENT - Ear, Nose & Throat Specialist', icon: '👂' },
    { name: 'Pediatrician', sub: 'Child & Newborn Specialist', icon: '👶' },
    { name: 'Physiotherapist', sub: 'Physical Rehab Specialist', icon: '🏃' },
    { name: 'Psychiatrist', sub: 'Mental Health & Counseling Specialist', icon: '🧘' },
    { name: 'Pulmonologist', sub: 'Chest & Lung Specialist', icon: '🫁' },
    { name: 'Radiologist', sub: 'X-Ray & Ultrasound Specialist', icon: '📡' },
    { name: 'Rheumatologist', sub: 'Arthritis & Joint Pain Specialist', icon: '🦴' },
    { name: 'Urologist', sub: 'Urinary & Kidney Stone Specialist', icon: '🔬' },
  ];

  const getDoctorCount = (specName) => {
    const exact = specialtyCounts[specName];
    if (exact !== undefined) return exact;
    const key = Object.keys(specialtyCounts).find(k =>
      k.toLowerCase().includes(specName.toLowerCase()) ||
      specName.toLowerCase().includes(k.toLowerCase())
    );
    return key ? specialtyCounts[key] : 0;
  };

  const filteredSpecialties = specialties.filter(spec =>
    spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    spec.sub.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectSpecialty = (specName) => {
    // Navigate to find-doctors page with specialty pre-selected
    navigate('/find-doctors', { state: { preSelectedSpecialty: `${specName} (${specialties.find(s => s.name === specName)?.sub})` } });
  };

  return (
    <div className="all-specialties-page">
      <div className="all-specialties-container">
        {/* Progress Stepper */}
        <div className="booking-stepper">
          <div className="stepper-step active">
            <div className="step-label">
              <div className="step-title">STEP 1</div>
              <div className="step-desc">Select Department</div>
            </div>
          </div>
          <div className="stepper-line"></div>
          <div className="stepper-step">
            <div className="step-label">
              <div className="step-title">STEP 2</div>
              <div className="step-desc">Select the doctor</div>
            </div>
          </div>
          <div className="stepper-line"></div>
          <div className="stepper-step">
            <div className="step-label">
              <div className="step-title">STEP 3</div>
              <div className="step-desc">Select Appointment time</div>
            </div>
          </div>
          <div className="stepper-line"></div>
          <div className="stepper-step">
            <div className="step-label">
              <div className="step-title">STEP 4</div>
              <div className="step-desc">Verify Patient</div>
            </div>
          </div>
          <div className="stepper-line"></div>
          <div className="stepper-step">
            <div className="step-label">
              <div className="step-title">STEP 5</div>
              <div className="step-desc">Payments</div>
            </div>
          </div>
        </div>

        <div className="all-specialties-header">
          <div>
            <h1>Find By Speciality:</h1>
            <p className="date-text">Browse all medical specialties and select one to find doctors</p>
          </div>
        </div>

        <div className="all-specialties-toolbar">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="specialty-count-badge">
            {filteredSpecialties.length} departments
          </div>
        </div>

        {loading ? (
          <div className="loading-state">Loading specialties...</div>
        ) : (
          <div className="specialties-grid">
            {filteredSpecialties.map((spec, idx) => (
              <div key={idx} className="specialty-card">
                <div className="specialty-icon-circle">
                  <span>{spec.icon}</span>
                </div>
                <h3>{spec.name.toUpperCase()}</h3>
                <p className="specialty-description">({spec.sub})</p>
                <p className="doctor-count">{getDoctorCount(spec.name)} Doctors</p>
                <button
                  onClick={() => handleSelectSpecialty(spec.name)}
                  className="consult-btn-specialty"
                >
                  Select Specialty
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllSpecialties;
