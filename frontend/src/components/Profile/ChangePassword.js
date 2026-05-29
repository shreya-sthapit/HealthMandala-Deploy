import { useState } from 'react';
import API_BASE_URL from '../../config/api';
import './ChangePassword.css';

// ── Eye icons ─────────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const pwdChecks = (pwd) => ({
  length:  pwd.length >= 8,
  number:  /[0-9]/.test(pwd),
  upper:   /[A-Z]/.test(pwd),
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
});

// ── Component ─────────────────────────────────────────────────────────────────
const ChangePassword = () => {
  const [passwords, setPasswords] = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd] = useState({ current: false, newPwd: false, confirm: false });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const checks = pwdChecks(passwords.newPwd);

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    if (!passwords.current) { setError('Please enter your current password.'); return; }
    if (passwords.newPwd !== passwords.confirm) { setError('New passwords do not match.'); return; }
    if (!checks.length) { setError('Password must be at least 8 characters.'); return; }
    if (!checks.number) { setError('Password must include at least one number.'); return; }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user.id || user._id;
    if (!userId) { setError('Session expired. Please log in again.'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          userId,
          currentPassword: passwords.current,
          newPassword: passwords.newPwd,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setPasswords({ current: '', newPwd: '', confirm: '' });
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(data.error || 'Failed to update password. Please try again.');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'current', label: 'Current Password',     placeholder: 'Enter current password' },
    { key: 'newPwd',  label: 'New Password',          placeholder: 'Enter new password' },
    { key: 'confirm', label: 'Confirm New Password',  placeholder: 'Re-enter new password' },
  ];

  return (
    <div className="cp-page">
      <div className="cp-content">

        <div className="cp-page-header">
          <h1>Change Password</h1>
          <p className="cp-page-sub">Keep your account secure with a strong password</p>
        </div>

        <div className="cp-card">
          {error   && <div className="cp-error-msg">{error}</div>}
          {success && <div className="cp-success-msg">Password updated successfully.</div>}

          {fields.map(({ key, label, placeholder }) => (
            <div className="cp-field-group" key={key}>
              <label className="cp-field-label">{label}</label>
              <div className="cp-input-wrap">
                <input
                  className="cp-input"
                  type={showPwd[key] ? 'text' : 'password'}
                  placeholder={placeholder}
                  value={passwords[key]}
                  onChange={(e) => { setPasswords({ ...passwords, [key]: e.target.value }); setError(''); }}
                />
                <button
                  type="button"
                  className="cp-eye-btn"
                  onClick={() => setShowPwd((v) => ({ ...v, [key]: !v[key] }))}
                  aria-label="Toggle visibility"
                >
                  {showPwd[key] ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          ))}

          {/* Dynamic rules — only shown while typing new password */}
          {passwords.newPwd && (
            <div className="cp-rules">
              {[
                { key: 'length',  text: 'Minimum 8 characters' },
                { key: 'number',  text: 'Includes a number' },
                { key: 'upper',   text: 'Includes an uppercase letter' },
                { key: 'special', text: 'Includes a special character' },
              ].map(({ key, text }) => (
                <span key={key} className={`cp-rule ${checks[key] ? 'met' : ''}`}>
                  {checks[key] ? '✓' : '○'} {text}
                </span>
              ))}
            </div>
          )}

          <button className="cp-submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ChangePassword;
