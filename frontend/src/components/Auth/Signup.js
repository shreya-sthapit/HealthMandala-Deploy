import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebase.ts';
import './SignupNew.css';

const Signup = () => {
  console.log('🔴 SIGNUP COMPONENT LOADED - VERSION 2');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Only allow patient registration
  const lockedRole = 'patient';

  const [authMethod, setAuthMethod] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupEmail, setPopupEmail] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+977',
    password: '',
    confirmPassword: '',
    role: lockedRole || ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    navigate('/verify-email', {
      state: {
        email: popupEmail,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        role: formData.role
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Block doctor registration
    if (formData.role === 'doctor') {
      setError('Doctor self-registration is no longer available. Please contact your hospital administrator.');
      return;
    }

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (authMethod === 'email') {
      setIsLoading(true);
      try {
        // Create user with Firebase
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // Send email verification
        await sendEmailVerification(userCredential.user);

        console.log('User created:', userCredential.user.uid);
        console.log('Verification email sent to:', formData.email);

        // Show popup
        setPopupEmail(formData.email);
        setShowPopup(true);
      } catch (err) {
        console.error('Signup error:', err);
        switch (err.code) {
          case 'auth/email-already-in-use':
            setError('This email is already registered. Please login instead.');
            break;
          case 'auth/invalid-email':
            setError('Please enter a valid email address.');
            break;
          case 'auth/weak-password':
            setError('Password is too weak. Please use a stronger password.');
            break;
          default:
            setError('Failed to create account. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Phone authentication with Twilio
      setIsLoading(true);
      try {
        const phoneNumber = `+977${formData.phone}`;
        
        // Call backend to send OTP via Twilio
        const response = await fetch('http://localhost:5001/api/otp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber }),
        });

        const data = await response.json();

        if (data.success) {
          // Navigate to OTP verification page
          navigate('/verify-otp', {
            state: {
              contact: phoneNumber,
              method: authMethod,
              firstName: formData.firstName,
              lastName: formData.lastName,
              password: formData.password,
              role: formData.role
            }
          });
        } else {
          setError(data.message || 'Failed to send OTP. Please try again.');
        }
      } catch (err) {
        console.error('Phone signup error:', err);
        setError('Failed to send OTP. Please check your phone number and try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="signup-container">
      {/* Email Sent Popup */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-modal">
            <div className="popup-icon success">✓</div>
            <h3>Verification Email Sent!</h3>
            <p>We've sent a verification link to:</p>
            <p className="popup-email">{popupEmail}</p>
            <p className="popup-note">Please check your inbox and click the link to verify your email address.</p>
            <button className="popup-btn" onClick={handlePopupClose}>
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="signup-split">
        {/* Left Panel */}
        <div className="signup-left">
          <div className="left-content">
            <h1>Hello, Explorer!</h1>
            <p>Enter your personal details and start your journey with us for better healthcare</p>
            <button className="signin-btn" onClick={() => navigate('/login')}>
              SIGN IN
            </button>
          </div>
        </div>

        {/* Right Panel */}
        <div className="signup-right">
          <div style={{ height: '200px', backgroundColor: 'red', width: '100%' }}>SPACER TEST</div>
          <div className="signup-form-wrapper">
            <h2>Create Account</h2>

            <div className="auth-toggle">
              <button
                className={`toggle-btn ${authMethod === 'email' ? 'active' : ''}`}
                onClick={() => setAuthMethod('email')}
              >
                Email
              </button>
              <button
                className={`toggle-btn ${authMethod === 'phone' ? 'active' : ''}`}
                onClick={() => setAuthMethod('phone')}
              >
                Phone
              </button>
            </div>

            <form className="signup-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              {authMethod === 'email' ? (
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              ) : (
                <div className="phone-input-group">
                  <span className="country-code">+977</span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  👁
                </button>
              </div>

              <div className="password-field">
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  👁
                </button>
              </div>

              {error && <p className="error-message">{error}</p>}

              <button type="submit" className="signup-submit" disabled={isLoading}>
                {isLoading ? 'CREATING...' : 'SIGN UP'}
              </button>
            </form>

            <p className="doctor-link">
              Are you a Doctor? <Link to="/doctor-login">Sign in here</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
