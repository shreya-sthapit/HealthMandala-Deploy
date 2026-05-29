import { useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import API_BASE_URL from '../../../config/api';
import './PatientRegLayout.css';
import './PatientRegistrationForm.css';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const provinces = [
  'Province 1 (Koshi)', 'Province 2 (Madhesh)', 'Province 3 (Bagmati)',
  'Province 4 (Gandaki)', 'Province 5 (Lumbini)', 'Province 6 (Karnali)',
  'Province 7 (Sudurpashchim)'
];

const PatientRegistrationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const existingData = location.state || {};
  const pendingToken = existingData.pendingToken || searchParams.get('pendingToken') || sessionStorage.getItem('pendingToken') || '';
  const userId = existingData.userId || searchParams.get('userId') || '';
  const firstName = existingData.firstName || searchParams.get('firstName') || '';
  const lastName = existingData.lastName || searchParams.get('lastName') || '';
  const email = existingData.email || searchParams.get('email') || '';
  const role = existingData.role || searchParams.get('role') || 'patient';

  const [profilePreview, setProfilePreview] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nidVerifying, setNidVerifying] = useState(false);
  const [nidVerified, setNidVerified] = useState(false);
  const [nidError, setNidError] = useState('');
  const [error, setError] = useState('');

  const NID_REGEX = /^\d{10}$/;

  const [formData, setFormData] = useState({
    // Personal Info
    profilePhoto: null,
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    // Address
    address: '',
    city: '',
    district: '',
    province: '',
    // Emergency Contact
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    // Medical Info
    medicalConditions: '',
    allergies: '',
    // NID
    nidNumber: '',
    nidFront: null,
    nidBack: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError('');
    // Reset NID verification state when the NID number changes
    if (name === 'nidNumber') {
      setNidVerified(false);
      setNidError('');
    }
  };

  const BLACKLISTED_NIDS = [
    '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
    '5555555555', '6666666666', '7777777777', '8888888888', '9999999999',
    '1234567890'
  ];

  // Instant format + blacklist check — runs on every keystroke
  const handleNIDChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10); // digits only, max 10
    setFormData(f => ({ ...f, nidNumber: value }));
    setNidVerified(false);
    setError('');
    if (value.length > 0 && !NID_REGEX.test(value)) {
      setNidError('NID must be exactly 10 digits');
    } else if (value.length === 10 && BLACKLISTED_NIDS.includes(value)) {
      setNidError('Invalid NID: this number is not registered in the National Registry');
    } else {
      setNidError('');
    }
  };

  const handleProfilePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Profile photo must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(f => ({ ...f, profilePhoto: file }));
      setProfilePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleNIDImage = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('NID image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'front') { setFormData(f => ({ ...f, nidFront: file })); setFrontPreview(reader.result); }
      else { setFormData(f => ({ ...f, nidBack: file })); setBackPreview(reader.result); }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dateOfBirth || !formData.gender) {
      setError('Date of Birth and Gender are required');
      return;
    }
    if (!formData.nidNumber.trim()) {
      setError('NID number is required');
      return;
    }
    if (!NID_REGEX.test(formData.nidNumber)) {
      setError('NID must be exactly 10 digits');
      return;
    }
    if (!formData.nidFront || !formData.nidBack) {
      setError('Please upload both front and back images of your NID');
      return;
    }

    // ── Mock DoNIDCR verification ──
    setNidVerifying(true);
    setNidVerified(false);
    setError('');

    try {
      // Simulate network round-trip to national registry
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Blacklisted NIDs — shows "failed verification" during demo
      const blacklistedNumbers = [
        '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
        '5555555555', '6666666666', '7777777777', '8888888888', '9999999999',
        '1234567890'
      ];
      if (blacklistedNumbers.includes(formData.nidNumber)) {
        setNidVerifying(false);
        setError('NID Verification Failed: No records found in National Registry.');
        return;
      }

      setNidVerifying(false);
      setNidVerified(true);
    } catch {
      setNidVerifying(false);
      setError('NID verification service unavailable. Please try again.');
      return;
    }

    // ── Brief pause so user sees the ✅ badge ──
    await new Promise(resolve => setTimeout(resolve, 600));

    setIsSubmitting(true);

    try {
      const fd = new FormData();
      // Send pendingToken if available (new registration), otherwise userId (re-submission)
      if (pendingToken) fd.append('pendingToken', pendingToken);
      else if (userId) fd.append('userId', userId);
      fd.append('firstName', firstName);
      fd.append('lastName', lastName);
      fd.append('email', email);
      fd.append('phone', existingData.phone || '');
      fd.append('dateOfBirth', formData.dateOfBirth);
      fd.append('gender', formData.gender);
      fd.append('bloodGroup', formData.bloodGroup);
      fd.append('address', formData.address);
      fd.append('city', formData.city);
      fd.append('district', formData.district);
      fd.append('province', formData.province);
      fd.append('emergencyContactName', formData.emergencyContactName);
      fd.append('emergencyContactPhone', formData.emergencyContactPhone);
      fd.append('emergencyContactRelation', formData.emergencyContactRelation);
      fd.append('medicalConditions', formData.medicalConditions);
      fd.append('allergies', formData.allergies);
      fd.append('nidNumber', formData.nidNumber);
      if (formData.profilePhoto) fd.append('profilePhoto', formData.profilePhoto);
      fd.append('nidFront', formData.nidFront);
      fd.append('nidBack', formData.nidBack);

      const response = await fetch(API_BASE_URL + '/api/patient/register', { method: 'POST', body: fd });
      const data = await response.json();

      if (data.success) {
        // Clear the pending token — registration is complete
        sessionStorage.removeItem('pendingToken');

        // Store the real auth token issued by the backend
        if (data.authToken) {
          localStorage.setItem('token', data.authToken);
        }
        localStorage.setItem('user', JSON.stringify({
          id: data.userId || data.registration.id,
          firstName,
          lastName,
          email,
          role: 'patient'
        }));
        localStorage.setItem('userRole', 'patient');
        navigate('/');
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="prf-page" style={{ paddingTop: '70px' }}>
      <div className="prf-card">
        {/* Full-width form panel */}
        <div className="prf-right">
          <div className="prf-form-wrapper">
            {/* ── Page header row: title+subtitle left, photo right ── */}
            <div className="prf-header-row">
              <div>
                <h2 className="prf-page-title">Complete Your Profile</h2>
                <p className="prf-page-subtitle">{firstName ? `Welcome, ${firstName}! ` : ''}Fill in the details to finish registration</p>
              </div>
              <div className="prl-form-wrapper" style={{ width: 'auto', padding: 0 }}>
                {profilePreview ? (
                  <div className="profile-preview">
                    <img src={profilePreview} alt="Profile" />
                    <button type="button" className="remove-btn"
                      onClick={() => { setFormData(f => ({ ...f, profilePhoto: null })); setProfilePreview(null); }}>✕</button>
                  </div>
                ) : (
                  <label className="profile-upload-area" title="Upload profile photo">
                    <input type="file" accept="image/*" onChange={handleProfilePhoto} hidden />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <div style={{ width: 32, height: 32, background: '#6dbc95', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>+</div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Upload</span>
                    </div>
                  </label>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit}>

              {/* ── Section 1: Personal Info ── */}
              <div className="prf-section-header">
                <span>Personal Details</span>
              </div>

              <div className="prl-row">
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
              </div>

              <div className={`prl-float ${formData.bloodGroup ? 'has-value' : ''}`}>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} style={{ color: formData.bloodGroup ? '#1e293b' : 'transparent' }}>
                  <option value="" disabled> </option>
                  {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
                <label>Blood Group (Optional)</label>
              </div>

              {/* ── Section 2: Address ── */}
              <div className="prf-section-header">
                <span>Address Information</span>
              </div>

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

              {/* ── Section 3: Emergency Contact ── */}
              <div className="prf-section-header">
                <span>Emergency Contact <span className="prf-optional">(Optional)</span></span>
              </div>

              <div className="prl-row">
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

              {/* ── Section 4: Medical Info ── */}
              <div className="prf-section-header">
                <span>Medical Information <span className="prf-optional">(Optional)</span></span>
              </div>

              <div className="prl-float">
                <textarea name="medicalConditions" placeholder=" " value={formData.medicalConditions} onChange={handleChange} rows={3} />
                <label>Known Medical Conditions</label>
              </div>
              <div className="prl-float">
                <textarea name="allergies" placeholder=" " value={formData.allergies} onChange={handleChange} rows={2} />
                <label>Allergies</label>
              </div>

              {/* ── Section 5: NID Verification ── */}
              <div className="prf-section-header">
                <span>NID Verification</span>
              </div>

              <div className="prl-float">
                <input
                  type="text"
                  name="nidNumber"
                  placeholder=" "
                  value={formData.nidNumber}
                  onChange={handleNIDChange}
                  maxLength={10}
                  inputMode="numeric"
                  required
                  style={{
                    borderColor: nidError
                      ? '#ef4444'
                      : nidVerified
                      ? '#10b981'
                      : undefined,
                  }}
                />
                <label>NID Number *</label>
                {nidError && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                    {nidError}
                  </span>
                )}
                {!nidError && formData.nidNumber.length === 10 && !nidVerified && (
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                    ✓ Format valid — will be verified on submit
                  </span>
                )}
              </div>

              <div className="upload-grid">
                {/* Front */}
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.3rem', display: 'block' }}>Front Side *</label>
                  {frontPreview ? (
                    <div className="image-preview">
                      <img src={frontPreview} alt="NID Front" />
                      <button type="button" className="remove-btn"
                        onClick={() => { setFormData(f => ({ ...f, nidFront: null })); setFrontPreview(null); }}>✕</button>
                    </div>
                  ) : (
                    <label className="upload-area">
                      <input type="file" accept="image/*" onChange={e => handleNIDImage(e, 'front')} hidden />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '0.75rem' }}>
                        <div style={{ width: 32, height: 32, background: '#6dbc95', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>+</div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Click to upload</span>
                      </div>
                    </label>
                  )}
                </div>
                {/* Back */}
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.3rem', display: 'block' }}>Back Side *</label>
                  {backPreview ? (
                    <div className="image-preview">
                      <img src={backPreview} alt="NID Back" />
                      <button type="button" className="remove-btn"
                        onClick={() => { setFormData(f => ({ ...f, nidBack: null })); setBackPreview(null); }}>✕</button>
                    </div>
                  ) : (
                    <label className="upload-area">
                      <input type="file" accept="image/*" onChange={e => handleNIDImage(e, 'back')} hidden />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: '0.75rem' }}>
                        <div style={{ width: 32, height: 32, background: '#6dbc95', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>+</div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Click to upload</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <div className="info-box">
                <span>ℹ️</span>
                <p>Your NID will be used for identity verification and kept secure.</p>
              </div>

              {error && <p className="error-message">{error}</p>}

              {nidVerified && !isSubmitting && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: '#f0fdf4', border: '1px solid #86efac',
                  borderRadius: '8px', padding: '0.6rem 1rem',
                  marginBottom: '1rem', color: '#15803d', fontSize: '0.9rem', fontWeight: 600
                }}>
                  ✅ NID Verified with DoNIDCR
                </div>
              )}

              <button
                type="submit"
                className="prf-submit-btn"
                disabled={isSubmitting || nidVerifying || !!nidError}
              >
                {nidVerifying
                  ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                      <span className="nid-spinner" /> 🔄 Verifying NID with DoNIDCR...
                    </span>
                  : isSubmitting
                  ? 'Submitting...'
                  : 'Complete Registration'
                }
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientRegistrationForm;
