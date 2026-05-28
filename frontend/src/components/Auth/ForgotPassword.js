import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [resendTimer, setResendTimer] = useState(30);

  const handleOtpChange = (index, value) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    console.log('Sending OTP to:', email);
    setStep(2);
    // Start resend timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    console.log('Verifying OTP:', otp.join(''));
    setStep(3);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert('Passwords do not match!');
      return;
    }
    console.log('Resetting password');
    setStep(4);
  };

  const handleResendOtp = () => {
    setResendTimer(30);
    console.log('Resending OTP');
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <div className="forgot-header">
          <Link to="/" className="logo">
            <img src="/logo.png" alt="HealthMandala" />
            <span>HealthMandala</span>
          </Link>
          
          {step === 1 && (
            <>
              <h2>Forgot Password?</h2>
              <p>Enter your email to receive a verification code</p>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Verify OTP</h2>
              <p>Enter the 6-digit code sent to {email}</p>
            </>
          )}
          {step === 3 && (
            <>
              <h2>Reset Password</h2>
              <p>Create a new password for your account</p>
            </>
          )}
          {step === 4 && (
            <>
              <div className="success-icon">✓</div>
              <h2>Password Reset!</h2>
              <p>Your password has been successfully reset</p>
            </>
          )}
        </div>

        {step < 4 && (
          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === 1 && (
          <form className="forgot-form" onSubmit={handleSendOtp}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            <button type="submit" className="forgot-submit">Send Verification Code</button>
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
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  required
                />
              ))}
            </div>
            <p className="resend-text">
              Didn't receive code?{' '}
              <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0}>
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
              </button>
            </p>
            <button type="submit" className="forgot-submit">Verify Code</button>
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
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="Confirm new password"
                required
              />
            </div>
            <button type="submit" className="forgot-submit">Reset Password</button>
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
