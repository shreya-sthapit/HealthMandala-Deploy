import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
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

// Maps a staff role to the correct dashboard route
const getDashboardRoute = (role, staffRole) => {
  if (role === 'doctor') return '/doctor-dashboard';
  if (role === 'hospital_admin' || role === 'admin') return '/hospital-dashboard';
  // For role === 'staff', use the specific staffRole from the StaffMember record
  const staffDashboards = {
    receptionist: '/receptionist-dashboard',
    pharmacist: '/pharmacist-dashboard',
    nurse: '/receptionist-dashboard',
    lab_technician: '/receptionist-dashboard',
  };
  return staffDashboards[staffRole] || staffDashboards[role] || '/hospital-dashboard';
};

const DoctorAuth = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({ email: '', phone: '', password: '' });
  const [loginMethod, setLoginMethod] = useState('email');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const body = { password: loginData.password };
      if (loginMethod === 'email') body.email = loginData.email;
      else body.phone = `+977${loginData.phone}`;

      const res = await fetch(API_BASE_URL + '/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.success) {
        const allowedRoles = ['doctor', 'staff', 'hospital_admin', 'admin'];
        if (!allowedRoles.includes(data.user.role)) {
          setError('This login is for doctors and hospital staff only.');
          setLoading(false);
          return;
        }

        localStorage.setItem('token', data.token);
        let enrichedUser = { ...data.user };
        let finalRole = data.user.role;

        // For staff, fetch their specific role (receptionist/pharmacist/etc.)
        if (data.user.role === 'staff') {
          try {
            const staffRes = await fetch(
        `${API_BASE_URL}/api/hospital-dashboard/staff/by-user/${data.user.id}`,
              { headers: { Authorization: `Bearer ${data.token}` } }
            );
            const staffData = await staffRes.json();
            if (staffData.success && staffData.staff) {
              enrichedUser.hospitalId = staffData.staff.hospitalId;
              enrichedUser.hospitalName = staffData.staff.currentHospital?.[0] || '';
              enrichedUser.staffRole = staffData.staff.role;
              finalRole = staffData.staff.role; // e.g. 'receptionist'
            }
          } catch { /* enrichment failed — proceed with base role */ }
        }

        localStorage.setItem('user', JSON.stringify(enrichedUser));
        localStorage.setItem('userRole', finalRole);

        navigate(getDashboardRoute(data.user.role, finalRole));
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch { setError('Unable to connect to server.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="ap-page">
      <div className="ap-card">

        {/* ── Teal left panel ── */}
        <div className="ap-overlay-panel" style={{ left: 0, borderRadius: '20px 0 0 20px' }}>
          <div className="ap-overlay-left" style={{ opacity: 1, transform: 'translateX(0)', pointerEvents: 'all' }}>
            <h2>Welcome Back!</h2>
            <p>Sign in to access your dashboard and manage your daily tasks.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%', maxWidth: '220px' }}>
              {['Manage appointments', 'View patient records', 'Update your schedule'].map(item => (
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
          <h2>Staff Sign In</h2>
          <p style={{ color: '#64748b', fontSize: '0.84rem', marginBottom: '1rem', width: '100%', maxWidth: 420 }}>
            For doctors, receptionists, pharmacists &amp; other hospital staff.
          </p>

          <div className="ap-method-toggle">
            <button className={loginMethod === 'email' ? 'active' : ''} onClick={() => setLoginMethod('email')}>Email</button>
            <button className={loginMethod === 'phone' ? 'active' : ''} onClick={() => setLoginMethod('phone')}>Phone</button>
          </div>

          <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 420 }}>
            {loginMethod === 'email' ? (
              <div className="ap-float">
                <input type="email" placeholder=" " value={loginData.email}
                  onChange={e => { setLoginData({ ...loginData, email: e.target.value }); setError(''); }} required />
                <label>Email</label>
              </div>
            ) : (
              <div className="ap-phone-row">
                <span className="ap-cc">+977</span>
                <div className="ap-float" style={{ flex: 1, marginBottom: 0 }}>
                  <input type="tel" placeholder=" " value={loginData.phone}
                    onChange={e => { setLoginData({ ...loginData, phone: e.target.value.replace(/\D/g, '') }); setError(''); }} required />
                  <label>Phone number</label>
                </div>
              </div>
            )}

            <div className="ap-float">
              <input type={showPwd ? 'text' : 'password'} placeholder=" "
                value={loginData.password}
                onChange={e => { setLoginData({ ...loginData, password: e.target.value }); setError(''); }}
                required
                style={{ paddingRight: '3rem' }} />
              <label>Password</label>
              <button type="button" className="ap-eye" onClick={() => setShowPwd(v => !v)}>
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
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
              Are you a Patient? <Link to="/login">Sign in here</Link>
            </p>
          </form>
        </div>

      </div>
    </div>
  );
};

export default DoctorAuth;
