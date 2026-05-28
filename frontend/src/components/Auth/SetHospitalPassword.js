import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

export default function SetHospitalPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [pageStatus, setPageStatus] = useState('idle');
  const [hospitalName, setHospitalName] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setPageStatus('error'); return; }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setHospitalName(payload.hospitalName || '');
      setAdminFirstName(payload.adminName?.split(' ')[0] || 'Admin');
      if (payload.exp && Date.now() / 1000 > payload.exp) setPageStatus('expired');
    } catch {
      setPageStatus('error');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5001/api/partner/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.user.role);
        setPageStatus('success');
        setTimeout(() => navigate('/hospital-dashboard'), 1500);
      } else {
        if (data.error?.toLowerCase().includes('expired')) setPageStatus('expired');
        else setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Status screens ──
  if (pageStatus === 'success') {
    return (
      <div className="ap-page">
        <div className="ap-card" style={{ maxWidth: 480, height: 'auto', padding: '3rem 2rem', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div className="ap-popup-icon" style={{ margin: '0 auto 1.25rem' }}>✓</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>You're all set!</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Redirecting to your hospital dashboard...</p>
        </div>
      </div>
    );
  }

  if (pageStatus === 'expired' || pageStatus === 'error') {
    return (
      <div className="ap-page">
        <div className="ap-card" style={{ maxWidth: 480, height: 'auto', padding: '3rem 2rem', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{pageStatus === 'expired' ? '⏰' : '❌'}</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.75rem' }}>
            {pageStatus === 'expired' ? 'Link Expired' : 'Invalid Link'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {pageStatus === 'expired'
              ? 'This link has expired (valid for 48 hours). Please contact the HealthMandala admin to resend the invite.'
              : 'This link is invalid or has already been used. Please contact support.'}
          </p>
          <a href="mailto:info.healthmandala@gmail.com" className="ap-submit" style={{ textDecoration: 'none', display: 'block' }}>
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  // ── Main form ──
  return (
    <div className="ap-page">
      <div className="ap-card">

        {/* ── Teal LEFT panel ── */}
        <div className="ap-overlay-panel" style={{ left: '0', borderRadius: '20px 0 0 20px' }}>
          <div className="ap-overlay-left" style={{ opacity: 1, transform: 'translateX(0)', pointerEvents: 'all' }}>
            <h2>Welcome to<br />HealthMandala!</h2>
            <p>Your hospital partner portal is ready. Manage appointments, doctors, and patients — all in one place.</p>
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

        {/* ── White RIGHT form panel ── */}
        <div className="ap-form-panel ap-signup-panel" style={{ opacity: 1, transform: 'translateX(0)', pointerEvents: 'all', justifyContent: 'center', paddingTop: '3rem', paddingBottom: '3rem' }}>
          <h2>Set Your Password</h2>

          {hospitalName && (
            <p style={{ color: '#6dbc95', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.25rem', width: '100%', maxWidth: 420 }}>
              {hospitalName}
            </p>
          )}
          <p style={{ color: '#64748b', fontSize: '0.84rem', marginBottom: '1.2rem', width: '100%', maxWidth: 420 }}>
            Hi {adminFirstName}, create a secure password for your admin account.
          </p>

          <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 420 }}>
            {/* New Password */}
            <div className="ap-float">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder=" "
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                required
                style={{ paddingRight: '3rem' }}
              />
              <label>New Password</label>
              <button type="button" className="ap-eye" onClick={() => setShowPw(v => !v)}>
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div style={{ marginBottom: '0.7rem', marginTop: '-0.3rem' }}>
                <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: '2px',
                    transition: 'width 0.3s, background 0.3s',
                    width: password.length < 8 ? '33%' : password.length < 12 ? '66%' : '100%',
                    background: password.length < 8 ? '#ef4444' : password.length < 12 ? '#f59e0b' : '#6dbc95'
                  }} />
                </div>
                <span style={{ fontSize: '0.7rem', color: password.length < 8 ? '#ef4444' : password.length < 12 ? '#f59e0b' : '#6dbc95', fontWeight: 600 }}>
                  {password.length < 8 ? 'Too short' : password.length < 12 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}

            {/* Confirm Password */}
            <div className="ap-float">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder=" "
                value={confirm}
                onChange={e => { setConfirm(e.target.value); setError(''); }}
                required
                style={{ paddingRight: '3rem' }}
              />
              <label>Confirm Password</label>
              <button type="button" className="ap-eye" onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {error && <p className="ap-error">{error}</p>}

            <button type="submit" className="ap-submit" disabled={submitting}>
              {submitting ? 'Setting password...' : 'SET PASSWORD & OPEN DASHBOARD'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
