import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import PatientRegLayout from './PatientRegLayout';
import './PatientRegLayout.css';

const PersonalInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Support both navigate state (from old flow) and query params (from email verification redirect)
  const existingData = location.state || {};
  const userId = existingData.userId || searchParams.get('userId');
  const firstName = existingData.firstName || searchParams.get('firstName') || '';
  const lastName = existingData.lastName || searchParams.get('lastName') || '';
  const email = existingData.email || searchParams.get('email') || '';
  const role = existingData.role || searchParams.get('role') || 'patient';

  const [formData, setFormData] = useState({
    dateOfBirth: existingData.dateOfBirth || '',
    gender: existingData.gender || '',
    bloodGroup: existingData.bloodGroup || ''
  });
  const [error, setError] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.dateOfBirth || !formData.gender) {
      setError('Please fill in Date of Birth and Gender');
      return;
    }
    navigate('/register/address', {
      state: { ...existingData, ...formData, userId, firstName, lastName, email, role }
    });
  };

  return (
    <PatientRegLayout step={1} title="Personal Information" subtitle="Tell us about yourself">
      <form className="reg-form" onSubmit={handleNext}>

        <div className="prl-float">
          <input type="date" name="dateOfBirth" placeholder=" " value={formData.dateOfBirth} onChange={handleChange} required />
          <label>Date of Birth *</label>
        </div>

        <div className={`prl-float ${formData.gender ? 'has-value' : ''}`}>
          <select name="gender" value={formData.gender} onChange={handleChange} required style={{ color: formData.gender ? '#1e293b' : 'transparent' }}>
            <option value="" disabled> </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <label>Gender *</label>
        </div>

        <div className={`prl-float ${formData.bloodGroup ? 'has-value' : ''}`}>
          <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} style={{ color: formData.bloodGroup ? '#1e293b' : 'transparent' }}>
            <option value="" disabled> </option>
            {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
          <label>Blood Group (Optional)</label>
        </div>

        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="reg-btn">Continue →</button>
      </form>
    </PatientRegLayout>
  );
};

export default PersonalInfo;
