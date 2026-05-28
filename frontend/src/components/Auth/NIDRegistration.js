import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './NIDRegistration.css';

const NIDRegistration = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = location.state?.role || 'patient';
  const userId = location.state?.userId || '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  const [formData, setFormData] = useState({
    profilePhoto: null,
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    city: '',
    district: '',
    province: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    nidNumber: '',
    nidFront: null,
    nidBack: null,
    medicalConditions: '',
    allergies: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'profile') {
          setFormData({ ...formData, profilePhoto: file });
          setProfilePreview(reader.result);
        } else if (type === 'front') {
          setFormData({ ...formData, nidFront: file });
          setFrontPreview(reader.result);
        } else {
          setFormData({ ...formData, nidBack: file });
          setBackPreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };


  const removeImage = (type) => {
    if (type === 'profile') {
      setFormData({ ...formData, profilePhoto: null });
      setProfilePreview(null);
    } else if (type === 'front') {
      setFormData({ ...formData, nidFront: null });
      setFrontPreview(null);
    } else {
      setFormData({ ...formData, nidBack: null });
      setBackPreview(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.dateOfBirth || !formData.gender) {
      alert('Please fill in required fields (Date of Birth, Gender)');
      return;
    }

    if (!formData.nidNumber.trim()) {
      alert('Please enter your NID number');
      return;
    }
    
    if (!formData.nidFront || !formData.nidBack) {
      alert('Please upload both front and back images of your NID');
      return;
    }

    setIsSubmitting(true);
    
    // TODO: API call to save patient details
    console.log('Patient Registration:', { ...formData, role: userRole, userId });
    
    setTimeout(() => {
      setIsSubmitting(false);
      navigate('/');
    }, 1500);
  };

  const provinces = [
    'Province 1 (Koshi)',
    'Province 2 (Madhesh)',
    'Province 3 (Bagmati)',
    'Province 4 (Gandaki)',
    'Province 5 (Lumbini)',
    'Province 6 (Karnali)',
    'Province 7 (Sudurpashchim)'
  ];

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="nid-container">
      <div className="nid-card patient-registration">
        <div className="nid-header">
          <Link to="/" className="nid-logo">
            <img src="/logo.png" alt="HealthMandala" />
            <span>HealthMandala</span>
          </Link>
          <h2>Complete Your Profile</h2>
          <p>Please provide your details for registration</p>
        </div>

        <form className="nid-form" onSubmit={handleSubmit}>
          {/* Profile Photo */}
          <div className="profile-photo-section">
            <label>Profile Photo</label>
            <div className="profile-upload-wrapper">
              {profilePreview ? (
                <div className="profile-preview">
                  <img src={profilePreview} alt="Profile" />
                  <button type="button" className="remove-btn" onClick={() => removeImage('profile')}>X</button>
                </div>
              ) : (
                <label className="profile-upload-area">
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} hidden />
                  <div className="profile-upload-content">
                    <div className="profile-icon">+</div>
                    <span>Upload Photo</span>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Personal Information */}
          <div className="section-title">Personal Information</div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Blood Group</label>
            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
              <option value="">Select Blood Group</option>
              {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>

          {/* Address Information */}
          <div className="section-title">Address Information</div>
          
          <div className="form-group">
            <label>Address</label>
            <input
              type="text"
              name="address"
              placeholder="Street address, ward no."
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City/Municipality</label>
              <input
                type="text"
                name="city"
                placeholder="e.g. Kathmandu"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>District</label>
              <input
                type="text"
                name="district"
                placeholder="e.g. Kathmandu"
                value={formData.district}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Province</label>
            <select name="province" value={formData.province} onChange={handleChange}>
              <option value="">Select Province</option>
              {provinces.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>


          {/* Emergency Contact */}
          <div className="section-title">Emergency Contact</div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Contact Name</label>
              <input
                type="text"
                name="emergencyContactName"
                placeholder="Full name"
                value={formData.emergencyContactName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Relationship</label>
              <select name="emergencyContactRelation" value={formData.emergencyContactRelation} onChange={handleChange}>
                <option value="">Select Relation</option>
                <option value="spouse">Spouse</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="child">Child</option>
                <option value="friend">Friend</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Contact Phone</label>
            <div className="phone-input-group">
              <span className="country-code">+977</span>
              <input
                type="tel"
                name="emergencyContactPhone"
                placeholder="98XXXXXXXX"
                value={formData.emergencyContactPhone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Medical Information */}
          <div className="section-title">Medical Information (Optional)</div>
          
          <div className="form-group">
            <label>Known Medical Conditions</label>
            <textarea
              name="medicalConditions"
              placeholder="e.g. Diabetes, Hypertension, Heart Disease..."
              value={formData.medicalConditions}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Allergies</label>
            <textarea
              name="allergies"
              placeholder="e.g. Penicillin, Peanuts, Dust..."
              value={formData.allergies}
              onChange={handleChange}
              rows={2}
            />
          </div>

          {/* NID Verification */}
          <div className="section-title">NID Verification *</div>

          <div className="form-group">
            <label>NID Number *</label>
            <input
              type="text"
              name="nidNumber"
              placeholder="Enter your NID number"
              value={formData.nidNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="upload-section">
            <label>Upload NID Photos *</label>
            
            <div className="upload-grid">
              <div className="upload-box">
                <p className="upload-label">Front Side</p>
                {frontPreview ? (
                  <div className="image-preview">
                    <img src={frontPreview} alt="NID Front" />
                    <button type="button" className="remove-btn" onClick={() => removeImage('front')}>X</button>
                  </div>
                ) : (
                  <label className="upload-area">
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'front')} hidden />
                    <div className="upload-content">
                      <div className="upload-icon">+</div>
                      <span>Click to upload</span>
                      <span className="upload-hint">JPG, PNG (Max 5MB)</span>
                    </div>
                  </label>
                )}
              </div>

              <div className="upload-box">
                <p className="upload-label">Back Side</p>
                {backPreview ? (
                  <div className="image-preview">
                    <img src={backPreview} alt="NID Back" />
                    <button type="button" className="remove-btn" onClick={() => removeImage('back')}>X</button>
                  </div>
                ) : (
                  <label className="upload-area">
                    <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'back')} hidden />
                    <div className="upload-content">
                      <div className="upload-icon">+</div>
                      <span>Click to upload</span>
                      <span className="upload-hint">JPG, PNG (Max 5MB)</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="nid-info">
            <div className="info-icon">i</div>
            <p>Your information will be kept secure and used only for verification purposes.</p>
          </div>

          <button type="submit" className="nid-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NIDRegistration;
