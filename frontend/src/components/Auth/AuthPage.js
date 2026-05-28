import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './AuthPage.css';

// Standard SVG eye icons
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

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const lockedRole = searchParams.get('role') || 'patient';
  const redirectTo = searchParams.get('redirect') || '/';

  // If already logged in as patient, redirect away from auth page
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token && role === 'patient') navigate(redirectTo, { replace: true });
  }, []); // eslint-disable-line

  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup'
  const [isAnimating, setIsAnimating] = useState(false);
  const [exitDir, setExitDir] = useState(''); // 'to-signup' | 'to-signin'

  // Sign In state
  const [loginData, setLoginData] = useState({ email: '', phone: '', password: '' });
  const [loginMethod, setLoginMethod] = useState('email');
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Sign Up state
  const [signupData, setSignupData] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: ''
  });
  const [signupMethod, setSignupMethod] = useState('email');
  const [showSignupPwd, setShowSignupPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [popupEmail, setPopupEmail] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Password requirement visibility: 'unmet' | 'met' | 'hidden'
  const [pwdReqs, setPwdReqs] = useState({ length: 'unmet', number: 'unmet', special: 'unmet' });
  const pwdTimers = { length: null, number: null, special: null };

  useEffect(() => {
    const p = signupData.password;
    const checks = {
      length:  p.length >= 6,
      number:  /[0-9]/.test(p),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
    };
    setPwdReqs(prev => {
      const next = { ...prev };
      Object.keys(checks).forEach(key => {
        if (checks[key] && prev[key] === 'unmet') {
          next[key] = 'met'; // show green tick
          setTimeout(() => {
            setPwdReqs(r => ({ ...r, [key]: 'hidden' }));
          }, 800); // disappear after 800ms
        } else if (!checks[key] && prev[key] === 'hidden') {
          next[key] = 'unmet'; // reappear if user deletes
        }
      });
      return next;
    });
  }, [signupData.password]); // eslint-disable-line

  // Sync mode from URL
  useEffect(() => {
    setMode(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  }, [searchParams]);

  const switchMode = (newMode) => {
    if (newMode === mode || isAnimating) return;
    const dir = newMode === 'signup' ? 'to-signup' : 'to-signin';
    setExitDir(dir);
    setIsAnimating(true);
    setLoginError('');
    setSignupError('');
    setTimeout(() => {
      setMode(newMode);
      setExitDir('');
      setIsAnimating(false);
    }, 500);
  };

  // ── Login ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const body = { password: loginData.password };
      if (loginMethod === 'email') body.email = loginData.email;
      else body.phone = `+977${loginData.phone}`;

      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        // Patient-only login — reject doctors
        if (data.user.role === 'doctor') {
          setLoginError('Invalid credentials.');
          return;
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.user.role);
        if (data.user.role === 'admin') navigate('/admin');
        else navigate(redirectTo); // go to intended page or landing
      } else {
        setLoginError(data.error || 'Login failed. Please try again.');
        setLoginAttempts(a => a + 1);
      }
    } catch {
      setLoginError('Unable to connect to server. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Signup ──
  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupError('');
    if (signupData.password !== signupData.confirmPassword) {
      setSignupError('Passwords do not match'); return;
    }
    if (signupData.password.length < 6) {
      setSignupError('Password must be at least 6 characters'); return;
    }
    if (!/[0-9]/.test(signupData.password)) {
      setSignupError('Password must contain at least one number'); return;
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(signupData.password)) {
      setSignupError('Password must contain at least one special character'); return;
    }
    setSignupLoading(true);
    try {
      if (signupMethod === 'email') {
        // Send OTP to email
        const res = await fetch('http://localhost:5001/api/auth/send-email-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: signupData.firstName,
            lastName: signupData.lastName,
            email: signupData.email,
            password: signupData.password,
            role: lockedRole,
          }),
        });
        const data = await res.json();
        if (data.success) {
          navigate('/verify-email', {
            state: {
              email: signupData.email,
              firstName: signupData.firstName,
              lastName: signupData.lastName,
              role: lockedRole,
            }
          });
        } else {
          setSignupError(data.error || 'Failed to send OTP.');
        }
      } else {
        const phone = `+977${signupData.phone}`;
        const res = await fetch('http://localhost:5001/api/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone }),
        });
        const data = await res.json();
        if (data.success) {
          navigate('/verify-otp', {
            state: { contact: phone, method: signupMethod, firstName: signupData.firstName, lastName: signupData.lastName, password: signupData.password, role: lockedRole }
          });
        } else {
          setSignupError(data.message || 'Failed to send OTP.');
        }
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setSignupError('Email already registered. Please sign in.');
      else if (err.code === 'auth/invalid-email') setSignupError('Invalid email address.');
      else setSignupError('Failed to create account. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    navigate('/verify-email', {
      state: { email: popupEmail, firstName: signupData.firstName }
    });
  };

  const isSignup = mode === 'signup';

  return (
    <div className="ap-page">
      {/* Email popup */}
      {showPopup && (
        <div className="ap-popup-overlay">
          <div className="ap-popup">
            <div className="ap-popup-icon">✓</div>
            <h3>Verification Email Sent!</h3>
            <p>We've sent a link to <strong>{popupEmail}</strong></p>
            <p className="ap-popup-note">Check your inbox and click the link to verify your email.</p>
            <button className="ap-popup-btn" onClick={handlePopupClose}>Continue</button>
          </div>
        </div>
      )}

      <div className={`ap-card ${isSignup ? 'ap-signup-active' : ''} ${exitDir ? `ap-exit-${exitDir}` : ''}`}>

        {/* ── Colored overlay panel ── */}
        <div className="ap-overlay-panel">
          {/* Sign-in side of overlay (shown when signup is active) */}
          <div className="ap-overlay-left">
            <h2>Hello, Explorer!</h2>
            <p>Enter your personal details and start your journey with us for better healthcare</p>
            <button className="ap-overlay-btn" onClick={() => switchMode('signin')}>SIGN IN</button>
          </div>
          {/* Sign-up side of overlay (shown when signin is active) */}
          <div className="ap-overlay-right">
            <h2>Welcome Back!</h2>
            <p>To keep connected with us please login with your personal info</p>
            <button className="ap-overlay-btn" onClick={() => switchMode('signup')}>SIGN UP</button>
          </div>
        </div>

        {/* ── Sign In form panel ── */}
        <div className="ap-form-panel ap-signin-panel">
          <h2>Sign In</h2>

          <div className="ap-method-toggle">
            <button className={loginMethod === 'email' ? 'active' : ''} onClick={() => setLoginMethod('email')}>Email</button>
            <button className={loginMethod === 'phone' ? 'active' : ''} onClick={() => setLoginMethod('phone')}>Phone</button>
          </div>

          <form onSubmit={handleLogin}>
            {loginMethod === 'email' ? (
              <div className="ap-float">
                <input type="email" name="email" placeholder=" " value={loginData.email}
                  onChange={e => setLoginData({ ...loginData, email: e.target.value })} required />
                <label>Email</label>
              </div>
            ) : (
              <div className="ap-phone-row">
                <span className="ap-cc">+977</span>
                <div className="ap-float" style={{ flex: 1, marginBottom: 0 }}>
                  <input type="tel" name="phone" placeholder=" " value={loginData.phone}
                    onChange={e => setLoginData({ ...loginData, phone: e.target.value.replace(/\D/g, '') })} required />
                  <label>Phone number</label>
                </div>
              </div>
            )}
            <div className="ap-float">
              <input type={showLoginPwd ? 'text' : 'password'} placeholder=" "
                value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} required style={{ paddingRight: '3rem' }} />
              <label>Password</label>
              <button type="button" className="ap-eye" onClick={() => setShowLoginPwd(v => !v)}>
                {showLoginPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <div className="ap-forgot"><Link to="/forgot-password">Forgot your password?</Link></div>
            {loginError && <p className="ap-error">{loginError}</p>}
            <button type="submit" className="ap-submit" disabled={loginLoading}>
              {loginLoading ? 'Signing in...' : 'SIGN IN'}
            </button>
            <p className="ap-role-link">Are you a Doctor? <Link to="/doctor-auth">Sign in here</Link></p>
          </form>
        </div>

        {/* ── Sign Up form panel ── */}
        <div className="ap-form-panel ap-signup-panel" style={{ paddingTop: '120px' }}>
          <h2>Create Account</h2>

          <div className="ap-method-toggle">
            <button className={signupMethod === 'email' ? 'active' : ''} onClick={() => setSignupMethod('email')}>Email</button>
            <button className={signupMethod === 'phone' ? 'active' : ''} onClick={() => setSignupMethod('phone')}>Phone</button>
          </div>

          <form onSubmit={handleSignup}>
            <div className="ap-row">
              <div className="ap-float">
                <input type="text" placeholder=" " value={signupData.firstName}
                  onChange={e => setSignupData({ ...signupData, firstName: e.target.value })} required />
                <label>First Name</label>
              </div>
              <div className="ap-float">
                <input type="text" placeholder=" " value={signupData.lastName}
                  onChange={e => setSignupData({ ...signupData, lastName: e.target.value })} required />
                <label>Last Name</label>
              </div>
            </div>
            {signupMethod === 'email' ? (
              <div className="ap-float">
                <input type="email" placeholder=" " value={signupData.email}
                  onChange={e => setSignupData({ ...signupData, email: e.target.value })} required />
                <label>Email</label>
              </div>
            ) : (
              <div className="ap-phone-row">
                <span className="ap-cc">+977</span>
                <div className="ap-float" style={{ flex: 1, marginBottom: 0 }}>
                  <input type="tel" placeholder=" " value={signupData.phone}
                    onChange={e => setSignupData({ ...signupData, phone: e.target.value.replace(/\D/g, '') })} required />
                  <label>Phone number</label>
                </div>
              </div>
            )}
            <div className="ap-float">
              <input type={showSignupPwd ? 'text' : 'password'} placeholder=" "
                value={signupData.password} onChange={e => setSignupData({ ...signupData, password: e.target.value })} required style={{ paddingRight: '3rem' }} />
              <label>Password</label>
              <button type="button" className="ap-eye" onClick={() => setShowSignupPwd(v => !v)}>
                {showSignupPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {signupData.password && (pwdReqs.length !== 'hidden' || pwdReqs.number !== 'hidden' || pwdReqs.special !== 'hidden') && (
              <div style={{ fontSize: '0.75rem', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {pwdReqs.length !== 'hidden' && (
                  <span style={{
                    color: pwdReqs.length === 'met' ? '#059669' : '#dc2626',
                    transition: 'opacity 0.3s, color 0.3s',
                    opacity: pwdReqs.length === 'met' ? 0.7 : 1,
                  }}>
                    {pwdReqs.length === 'met' ? '✓' : '✗'} At least 6 characters
                  </span>
                )}
                {pwdReqs.number !== 'hidden' && (
                  <span style={{
                    color: pwdReqs.number === 'met' ? '#059669' : '#dc2626',
                    transition: 'opacity 0.3s, color 0.3s',
                    opacity: pwdReqs.number === 'met' ? 0.7 : 1,
                  }}>
                    {pwdReqs.number === 'met' ? '✓' : '✗'} At least one number
                  </span>
                )}
                {pwdReqs.special !== 'hidden' && (
                  <span style={{
                    color: pwdReqs.special === 'met' ? '#059669' : '#dc2626',
                    transition: 'opacity 0.3s, color 0.3s',
                    opacity: pwdReqs.special === 'met' ? 0.7 : 1,
                  }}>
                    {pwdReqs.special === 'met' ? '✓' : '✗'} At least one special character
                  </span>
                )}
              </div>
            )}
            <div className="ap-float">
              <input type={showConfirmPwd ? 'text' : 'password'} placeholder=" "
                value={signupData.confirmPassword} onChange={e => setSignupData({ ...signupData, confirmPassword: e.target.value })} required style={{ paddingRight: '3rem' }} />
              <label>Confirm Password</label>
              <button type="button" className="ap-eye" onClick={() => setShowConfirmPwd(v => !v)}>
                {showConfirmPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {signupError && <p className="ap-error">{signupError}</p>}
            <button type="submit" className="ap-submit" disabled={signupLoading}>
              {signupLoading ? 'Creating...' : 'SIGN UP'}
            </button>
            <p className="ap-role-link">Are you a Doctor? <Link to="/doctor-auth">Sign in here</Link></p>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
