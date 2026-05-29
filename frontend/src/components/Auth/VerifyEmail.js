import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import './AuthPage.css';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || '';
  const firstName = location.state?.firstName || '';
  const lastName = location.state?.lastName || '';
  const role = location.state?.role || 'patient';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the 6-digit code.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(API_BASE_URL + '/api/auth/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (data.success) {
        // Store pending token only — no real User exists yet.
        // The patient registration form will create the User.
        if (data.pendingToken) {
          sessionStorage.setItem('pendingToken', data.pendingToken);
        }
        const redirectPath = data.user?.role === 'doctor' ? '/doctor-dashboard' : '/register';
        navigate(redirectPath, {
          state: { pendingToken: data.pendingToken, firstName, lastName, email, role }
        });
      } else {
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch { setError('Could not connect to server. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true); setResendMsg('');
    try {
      const res = await fetch(API_BASE_URL + '/api/auth/resend-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) { setResendMsg('New OTP sent!'); setCountdown(60); setCanResend(false); setOtp(['','','','','','']); inputRefs.current[0]?.focus(); }
      else setResendMsg(data.error || 'Failed to resend.');
    } catch { setResendMsg('Failed to resend. Check your connection.'); }
    finally { setResending(false); }
  };

  return (
    <div className="ap-page">
      <div className="ap-card" style={{ minHeight: 'auto' }}>
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 4%', background: '#fff', borderRadius: 20 }}>
          <div style={{ width: '100%', maxWidth: 420 }}>

            {/* Icon */}
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#00a896,#028090)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.8rem' }}>
              ✉️
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', textAlign: 'center', marginBottom: '0.4rem' }}>
              Check Your Email
            </h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.88rem', marginBottom: '0.25rem' }}>
              {firstName ? `Hi ${firstName}! We` : 'We'}'ve sent a 6-digit code to
            </p>
            <p style={{ textAlign: 'center', color: '#00a896', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1.75rem' }}>
              {email}
            </p>

            {/* OTP inputs */}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginBottom: '1.25rem' }} onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  style={{
                    width: 52, height: 58, textAlign: 'center', fontSize: '1.5rem', fontWeight: 700,
                    border: `2px solid ${digit ? '#00a896' : '#e2e8f0'}`,
                    borderRadius: 10, outline: 'none', background: digit ? '#f0fdfa' : '#fff',
                    color: '#1e293b', transition: 'border-color 0.2s',
                  }}
                />
              ))}
            </div>

            {error && (
              <div className="ap-error" style={{ marginBottom: '1rem' }}>{error}</div>
            )}

            <button
              className="ap-submit"
              onClick={handleVerify}
              disabled={loading || otp.join('').length < 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <p style={{ color: '#64748b', fontSize: '0.84rem', marginBottom: '0.4rem' }}>Didn't receive the code?</p>
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  style={{ background: 'none', border: 'none', color: '#00a896', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  {resending ? 'Sending...' : 'Resend Code'}
                </button>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: '0.84rem' }}>Resend in {countdown}s</p>
              )}
              {resendMsg && <p style={{ color: '#00a896', fontSize: '0.82rem', marginTop: '0.4rem' }}>{resendMsg}</p>}
            </div>

            <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.82rem', color: '#64748b' }}>
              Wrong email? <Link to="/login" style={{ color: '#00a896', fontWeight: 700, textDecoration: 'none' }}>Go back</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
