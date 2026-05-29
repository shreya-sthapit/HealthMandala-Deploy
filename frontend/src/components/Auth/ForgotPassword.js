import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const startResendTimer = () => {
    setResendTimer(60);
    const timer = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // keep last digit
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  // Step 1 — send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(2);
        startResendTimer();
      } else {
        setError(data.error || 'Failed to send code. Please try again.');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const otpStr = otp.join('');
    if (otpStr.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpStr }),
      });
      const data = await res.json();
      if (data.success) {
        setResetToken(data.resetToken);
        setStep(3);
      } else {
        setError(data.error || 'Invalid code. Please try again.');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (passwords.new.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (passwords.new !== passwords.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword: passwords.new }),
      });
      const data = await res.json();
      if (data.success) {
        setStep(4);
      } else {
        setError(data.error || 'Failed to reset password. Please start over.');
      }
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setOtp(['', '', '', '', '', '']);
        startResendTimer();
      } else {
        setError(data.error || 'Failed to resend code.');
      }
    } catch {
      setError('Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <div className="forgot-header">
          <Link to="/" className="logo">
            <img src="/logo.png" alt="HealthMandala" />
            <span>HealthMandala</span>
          </Link>

          {step === 1 && (<><h2>Forgot Password?</h2><p>Enter your email to receive a verification code</p></>)}
          {step === 2 && (<><h2>Verify Code</h2><p>Enter the 6-digit code sent to <strong>{email}</strong></p></>)}
          {step === 3 && (<><h2>New Password</h2><p>Create a new password for your account</p></>)}
          {step === 4 && (<><div className="success-icon">✓</div><h2>Password Reset!</h2><p>Your password has been successfully reset</p></>)}
        </div>

        {step < 4 && (
          <div className="step-indicator">
            {[1, 2, 3].map(s => <div key={s} className={`step-dot ${step >= s ? 'active' : ''}`} />)}
          </div>
        )}

        {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form className="forgot-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="Enter your email"
                required
              />
            </div>
            <button type="submit" className="forgot-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* Step 2: Enter OTP */}
        {step === 2 && (
          <form className="forgot-form" onSubmit={handleVerifyOtp}>
            <div className="otp-inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(index, e)}
                  required
                />
              ))}
            </div>
            <p className="resend-text">
              Didn't receive code?{' '}
              <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0 || loading}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
              </button>
            </p>
            <button type="submit" className="forgot-submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form className="forgot-form" onSubmit={handleResetPassword}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwords.new}
                onChange={e => { setPasswords({ ...passwords, new: e.target.value }); setError(''); }}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={e => { setPasswords({ ...passwords, confirm: e.target.value }); setError(''); }}
                placeholder="Re-enter new password"
                required
              />
            </div>
            <button type="submit" className="forgot-submit" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <button className="forgot-submit" onClick={() => navigate('/login')}>
            Back to Login
          </button>
        )}

        {step < 4 && (
          <p className="back-to-login">
            Remember your password? <Link to="/login">Login</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
