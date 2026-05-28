import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userContact = location.state?.contact || 'your phone';
  const firstName = location.state?.firstName || '';
  const lastName = location.state?.lastName || '';
  const password = location.state?.password || '';
  const role = location.state?.role || 'patient';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:5001/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber: userContact }),
      });

      const data = await response.json();

      if (data.success) {
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
      } else {
        setError(data.message || 'Failed to resend OTP');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5001/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phoneNumber: userContact, 
          code: otpValue 
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Phone verified — get a pending token (no User created yet)
        try {
          const registerResponse = await fetch('http://localhost:5001/api/auth/register/phone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, phone: userContact, password, role }),
          });
          const registerData = await registerResponse.json();

          if (registerData.success) {
            // Store pending token — User will be created when registration form is submitted
            if (registerData.pendingToken) {
              sessionStorage.setItem('pendingToken', registerData.pendingToken);
            }
            const redirectPath = role === 'doctor' ? '/doctor-register/personal' : '/register';
            navigate(redirectPath, {
              state: {
                role,
                pendingToken: registerData.pendingToken,
                firstName,
                lastName,
                phone: userContact
              }
            });
          } else {
            setError(registerData.error || 'Registration failed. Please try again.');
          }
        } catch (regErr) {
          console.error('Registration error:', regErr);
          setError('Failed to complete registration. Please try again.');
        }
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <img src="/logo.png" alt="HealthMandala" />
            <span>HealthMandala</span>
          </Link>
          <h2>Verify Your Phone</h2>
          <p>We've sent a 6-digit code to {userContact}</p>
        </div>

        <form className="auth-form" onSubmit={handleVerify}>
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="otp-input"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="otp-timer">
            {canResend ? (
              <button type="button" className="resend-btn" onClick={handleResend} disabled={isResending}>
                {isResending ? 'Sending...' : 'Resend Code'}
              </button>
            ) : (
              <p>Resend code in <span className="timer">{timer}s</span></p>
            )}
          </div>

          <button type="submit" className="auth-submit" disabled={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <p className="auth-footer">
          Wrong number? <Link to="/signup">Go back</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOTP;
