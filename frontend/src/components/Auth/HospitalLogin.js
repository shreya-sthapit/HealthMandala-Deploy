import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AuthPage.css';

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function HospitalLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(process.env.REACT_APP_API_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        const allowedRoles = ['hospital_admin', 'staff', 'doctor'];
        if (!allowedRoles.includes(data.user.role)) {
          setError('This login is for hospital staff and admins only.');
          return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);

        // Enrich user object with hospitalId + hospitalName for staff
        let enrichedUser = { ...data.user };
        try {
          if (data.user.role === 'staff') {
            const staffRes = await fetch(`/api/hospital-dashboard/staff/by-user/${data.user.id}`, {
              headers: { Authorization: `Bearer ${data.token}` }
            });
            const staffData = await staffRes.json();
            if (staffData.success && staffData.staff) {
              enrichedUser.hospitalId = staffData.staff.hospitalId;
              enrichedUser.hospitalName = staffData.staff.currentHospital?.[0] || '';
              enrichedUser.staffRole = staffData.staff.role; // receptionist / pharmacist / etc.
              // Override userRole with specific staff role for route guards
              localStorage.setItem('userRole', staffData.staff.role);
            }
          } else if (data.user.role === 'hospital_admin') {
            const adminRes = await fetch(
              `/api/hospital-dashboard/my-hospital?userId=${data.user.id}`,
              { headers: { Authorization: `Bearer ${data.token}` } }
            );
            const adminData = await adminRes.json();
            if (adminData.success && adminData.hospital) {
              enrichedUser.hospitalId = adminData.hospital._id;
              enrichedUser.hospitalName = adminData.hospital.hospitalName;
            }
          }
        } catch { /* enrichment failed — proceed with base user */ }

        localStorage.setItem('user', JSON.stringify(enrichedUser));

        // Route based on role
        const role = localStorage.getItem('userRole');
        if (role === 'receptionist') navigate('/receptionist-dashboard');
        else if (role === 'pharmacist') navigate('/pharmacist-dashboard');
        else if (role === 'doctor') navigate('/doctor-dashboard');
        else navigate('/hospital-dashboard');
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ap-page">
      <div className="ap-card">

        {/* ── Teal left panel ── */}
        <div className="ap-overlay-panel" style={{ left: 0, borderRadius: '20px 0 0 20px' }}>
          <div className="ap-overlay-left" style={{ opacity: 1, transform: 'translateX(0)', pointerEvents: 'all' }}>
            <h2>Hospital Admin Portal</h2>
            <p>Sign in to manage your hospital's appointments, doctors, and patients.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', maxWidth: '220px' }}>
              {['Manage appointments', 'Add doctors & schedules', 'Track revenue & records'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.9)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── White right form panel ── */}
        <div className="ap-form-panel ap-signup-panel" style={{ opacity: 1, transform: 'translateX(0)', pointerEvents: 'all', justifyContent: 'center', paddingTop: '3rem', paddingBottom: '3rem' }}>
          <h2>Sign In</h2>

          <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 420 }}>
            <div className="ap-float">
              <input
                type="email"
                placeholder=" "
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                required
              />
              <label>Email</label>
            </div>

            <div className="ap-float">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder=" "
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
                style={{ paddingRight: '3rem' }}
              />
              <label>Password</label>
              <button type="button" className="ap-eye" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <div className="ap-forgot">
              <Link to="/forgot-password">Forgot your password?</Link>
            </div>

            {error && <p className="ap-error">{error}</p>}

            <button type="submit" className="ap-submit" disabled={loading}>
              {loading ? 'Signing in...' : 'SIGN IN'}
            </button>

            <p className="ap-role-link" style={{ marginTop: '1rem' }}>
              Not a hospital admin? <Link to="/login">Patient / Doctor Login</Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  );
}
