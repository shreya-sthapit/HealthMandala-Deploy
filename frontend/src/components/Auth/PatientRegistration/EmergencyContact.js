import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PatientRegLayout from './PatientRegLayout';
import './PatientRegLayout.css';

const EmergencyContact = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const existingData = location.state || {};

  const [formData, setFormData] = useState({
    emergencyContactName: existingData.emergencyContactName || '',
    emergencyContactPhone: existingData.emergencyContactPhone || '',
    emergencyContactRelation: existingData.emergencyContactRelation || ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = (e) => {
    e.preventDefault();
    navigate('/register/medical', { state: { ...existingData, ...formData } });
  };

  return (
    <PatientRegLayout step={3} title="Emergency Contact" subtitle="Who should we reach in an emergency?">
      <form onSubmit={handleNext}>
        <div className="prl-float">
          <input type="text" name="emergencyContactName" placeholder=" " value={formData.emergencyContactName} onChange={handleChange} />
          <label>Contact Name</label>
        </div>

        <div className={`prl-float ${formData.emergencyContactRelation ? 'has-value' : ''}`}>
          <select name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange}
            style={{ color: formData.emergencyContactRelation ? '#1e293b' : 'transparent' }}>
            <option value="" disabled> </option>
            <option value="spouse">Spouse</option>
            <option value="parent">Parent</option>
            <option value="sibling">Sibling</option>
            <option value="child">Child</option>
            <option value="friend">Friend</option>
            <option value="other">Other</option>
          </select>
          <label>Relationship</label>
        </div>

        <div className="prl-phone-row">
          <span className="prl-cc">+977</span>
          <div className="prl-float">
            <input type="tel" name="emergencyContactPhone" placeholder=" "
              value={formData.emergencyContactPhone}
              onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value.replace(/\D/g, '') })} />
            <label>Contact Phone</label>
          </div>
        </div>

        <div className="info-box">
          <span>ℹ️</span>
          <p>This information is optional but recommended for your safety.</p>
        </div>

        <div className="btn-group">
          <button type="button" className="reg-btn secondary" onClick={() => navigate('/register/address', { state: existingData })}>← Back</button>
          <button type="submit" className="reg-btn">Continue →</button>
        </div>
      </form>
    </PatientRegLayout>
  );
};

export default EmergencyContact;
