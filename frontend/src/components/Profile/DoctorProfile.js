import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorProfile.css';

const Field = ({ label, value }) => (
  <div className="dp-field">
    <span className="dp-field-label">{label}</span>
    <span className="dp-field-value">{value || '—'}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div className="dp-section">
    <h3 className="dp-section-title">{title}</h3>
    <div className="dp-fields-grid">{children}</div>
  </div>
);

const DoctorProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.id) { setError('User not found.'); setLoading(false); return; }
    fetch(`/api/doctor/profile/${userData.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setProfile(data.profile);
        else setError('Could not load profile.');
      })
      .catch(() => setError('Could not connect to server.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="dp-page">
      <div className="dp-loading"><div className="dp-spinner" /><p>Loading profile…</p></div>
    </div>
  );

  if (error) return (
    <div className="dp-page">
      <div className="dp-error">{error}</div>
    </div>
  );

  const p = profile;
  const initials = `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase();
  const avatarSrc = p.profilePhoto ? `/${p.profilePhoto}` : null;

  return (
    <div className="dp-page">
      <div className="dp-content">

        <div className="dp-page-header">
          <h1>My Profile</h1>
          <p className="dp-page-sub">Your professional information as registered by your hospital</p>
        </div>

        <div className="dp-layout">

          {/* ── Left sidebar ── */}
          <div className="dp-sidebar">
            <div className="dp-avatar-wrap">
              {avatarSrc
                ? <img src={avatarSrc} alt="Profile" className="dp-avatar-img" />
                : <div className="dp-avatar-initials">{initials}</div>
              }
            </div>

            <div className="dp-name-block">
              <div className="dp-full-name">Dr. {p.firstName} {p.lastName}</div>
              <div className="dp-specialization">{p.specialization || 'Doctor'}</div>
            </div>

            {p.currentHospital?.length > 0 && (
              <div className="dp-hospital-list">
                {p.currentHospital.map(h => (
                  <div key={h} className="dp-hospital-badge">🏥 {h}</div>
                ))}
              </div>
            )}

            <div className="dp-status-badge" data-status={p.status}>
              {p.status === 'approved' ? '✓ Verified' : p.status}
            </div>

            <button className="dp-back-btn" onClick={() => navigate('/doctor-dashboard')}>
              ← Back to Dashboard
            </button>
          </div>

          {/* ── Main content ── */}
          <div className="dp-main">

            <Section title="Personal Information">
              <Field label="First Name" value={p.firstName} />
              <Field label="Last Name" value={p.lastName} />
              <Field label="Email" value={p.email} />
              <Field label="Phone" value={p.phone} />
              <Field label="Gender" value={p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : null} />
              <Field label="Date of Birth" value={p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
            </Section>

            <Section title="Professional Information">
              <Field label="Specialization" value={p.specialization} />
              <Field label="NMC Number" value={p.nmcNumber} />
              <Field label="Qualification" value={p.qualification} />
              <Field label="Experience" value={p.experienceYears != null ? `${p.experienceYears} years` : null} />
              <Field label="Consultation Fee" value={p.consultationFee != null ? `NPR ${p.consultationFee}` : null} />
              <Field label="Appointment Duration" value={p.consultationDuration != null ? `${p.consultationDuration} min` : null} />
            </Section>

            {p.bio && (
              <div className="dp-section">
                <h3 className="dp-section-title">Bio</h3>
                <p className="dp-bio">{p.bio}</p>
              </div>
            )}

            {p.address && (p.address.street || p.address.city) && (
              <Section title="Address">
                <Field label="Street" value={p.address.street} />
                <Field label="City" value={p.address.city} />
                <Field label="District" value={p.address.district} />
                <Field label="Province" value={p.address.province} />
              </Section>
            )}

            {p.signature && (
              <div className="dp-section">
                <h3 className="dp-section-title">Digital Signature</h3>
                <div className="dp-signature-wrap">
                  <img src={p.signature} alt="Digital Signature" className="dp-signature-img" />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
