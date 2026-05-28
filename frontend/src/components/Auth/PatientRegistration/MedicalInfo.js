import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PatientRegLayout from './PatientRegLayout';
import './PatientRegLayout.css';

const MedicalInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const existingData = location.state || {};

  const [formData, setFormData] = useState({
    medicalConditions: existingData.medicalConditions || '',
    allergies: existingData.allergies || ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = (e) => {
    e.preventDefault();
    navigate('/register/nid', { state: { ...existingData, ...formData } });
  };

  return (
    <PatientRegLayout step={4} title="Medical Information" subtitle="Help us understand your health better">
      <form onSubmit={handleNext}>
        <div className="prl-float">
          <textarea name="medicalConditions" placeholder=" " value={formData.medicalConditions} onChange={handleChange} rows={4} />
          <label>Known Medical Conditions</label>
        </div>
        <div className="prl-float">
          <textarea name="allergies" placeholder=" " value={formData.allergies} onChange={handleChange} rows={3} />
          <label>Allergies</label>
        </div>
        <div className="info-box">
          <span>ℹ️</span>
          <p>This information helps doctors provide better care. You can update it later from your profile.</p>
        </div>
        <div className="btn-group">
          <button type="button" className="reg-btn secondary" onClick={() => navigate('/register/emergency', { state: existingData })}>← Back</button>
          <button type="submit" className="reg-btn">Continue →</button>
        </div>
      </form>
    </PatientRegLayout>
  );
};

export default MedicalInfo;
