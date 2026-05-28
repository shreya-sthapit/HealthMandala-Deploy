import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roleHint = searchParams.get('role') || ''; // 'patient' | 'doctor' | ''
  const [authMethod, setAuthMethod] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    countryCode: '+977',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginData = {
        password: formData.password
      };

      if (authMethod === 'email') {
        loginData.email = formData.email;
      } else {
        loginData.phone = `+977${formData.phone}`;
      }

      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.user.role); // Store role for profile access

        // Redirect based on role (ignore pending status)
        if (data.user.role === 'doctor') {
          navigate('/doctor-dashboard');
        } else if (data.user.role === 'admin') {
          navigate('/admin');
        } else if (data.user.role === 'hospital_admin') {
          navigate('/hospital-dashboard');
        } else {
          navigate('/'); // patient → landing page
        }
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-split">
        {/* Left Panel */}
        <div className="auth-left">
          <div className="auth-brand">
            <img src="/logo.png" alt="HealthMandala" className="auth-brand-logo" />
            <span>HealthMandala</span>
          </div>
          <div className="auth-left-content">
            <h1>Your Health,<br/>Our Priority</h1>
            <p>Book appointments with top doctors in Nepal — fast, simple, and secure.</p>
            <div className="auth-features">
              <div className="auth-feature-item">
                <svg className="auth-feature-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Book appointments with verified doctors instantly</span>
              </div>
              <div className="auth-feature-item">
                <svg className="auth-feature-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Access top hospitals across Nepal</span>
              </div>
              <div className="auth-feature-item">
                <svg className="auth-feature-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Secure & private health records</span>
              </div>
            </div>
          </div>
          <div className="auth-illustration">
            <img src="/Middle Image.png" alt="Healthcare" />
          </div>
        </div>

        {/* Right Panel */}
        <div className="auth-right" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="auth-card" style={{ display: 'flex', alignItems: 'center', minHeight: 'auto', padding: '0 2.5rem' }}>
            <div className="auth-content-wrapper" style={{ width: '100%', padding: '4rem 0' }}>
              <div className="auth-header">
                <h2>{roleHint === 'doctor' ? 'Doctor Login' : 'Patient Login'}</h2>
                <p>{roleHint === 'doctor' ? 'Access your doctor dashboard' : 'Login to manage your appointments'}</p>
                {roleHint === 'doctor' && (
                  <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '6px' }}>
                    Not a doctor? <a href="/login?role=patient" style={{ color: 'var(--primary-color)' }}>Patient Login</a>
                  </p>
                )}
              </div>

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

        <form className="auth-form" onSubmit={handleSubmit}>
          {authMethod === 'email' ? (
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Phone Number</label>
              <div className="phone-input-group">
                <span className="country-code">+977</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="123-456-7890"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
