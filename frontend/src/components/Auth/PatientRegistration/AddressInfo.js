import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PatientRegLayout from './PatientRegLayout';
import './PatientRegLayout.css';

const AddressInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const existingData = location.state || {};

  const [formData, setFormData] = useState({
    address: existingData.address || '',
    city: existingData.city || '',
    district: existingData.district || '',
    province: existingData.province || ''
  });

  const provinces = [
    'Province 1 (Koshi)', 'Province 2 (Madhesh)', 'Province 3 (Bagmati)',
    'Province 4 (Gandaki)', 'Province 5 (Lumbini)', 'Province 6 (Karnali)',
    'Province 7 (Sudurpashchim)'
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleNext = (e) => {
    e.preventDefault();
    navigate('/register/emergency', { state: { ...existingData, ...formData } });
  };

  return (
    <PatientRegLayout step={2} title="Address Information" subtitle="Where do you live?">
      <form onSubmit={handleNext}>
        <div className="prl-float">
          <input type="text" name="address" placeholder=" " value={formData.address} onChange={handleChange} />
          <label>Street Address</label>
        </div>
        <div className="prl-row">
          <div className="prl-float">
            <input type="text" name="city" placeholder=" " value={formData.city} onChange={handleChange} />
            <label>City / Municipality</label>
          </div>
          <div className="prl-float">
            <input type="text" name="district" placeholder=" " value={formData.district} onChange={handleChange} />
            <label>District</label>
          </div>
        </div>
        <div className={`prl-float ${formData.province ? 'has-value' : ''}`}>
          <select name="province" value={formData.province} onChange={handleChange} style={{ color: formData.province ? '#1e293b' : 'transparent' }}>
            <option value="" disabled> </option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <label>Province</label>
        </div>
        <div className="btn-group">
          <button type="button" className="reg-btn secondary" onClick={() => navigate('/register/personal', { state: existingData })}>← Back</button>
          <button type="submit" className="reg-btn">Continue →</button>
        </div>
      </form>
    </PatientRegLayout>
  );
};

export default AddressInfo;
