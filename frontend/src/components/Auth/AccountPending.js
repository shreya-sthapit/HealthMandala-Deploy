import { Link } from 'react-router-dom';
import './AccountPending.css';

const AccountPending = () => {
  return (
    <div className="pending-container">
      <div className="pending-card">
        <div className="pending-header">
          <Link to="/" className="pending-logo">
            <img src="/logo.png" alt="HealthMandala" />
            <span>HealthMandala</span>
          </Link>
        </div>

        <div className="pending-content">
          <div className="pending-icon">
            <div className="clock-icon">
              <div className="clock-face">
                <div className="clock-hand hour"></div>
                <div className="clock-hand minute"></div>
              </div>
            </div>
          </div>

          <h2>Account Under Review</h2>
          <p className="pending-message">
            Thank you for registering with HealthMandala. Your account is currently 
            being reviewed by our admin team.
          </p>

          <div className="pending-info">
            <div className="info-item">
              <div className="info-icon">1</div>
              <div className="info-text">
                <h4>Verification in Progress</h4>
                <p>Our team is verifying your NID and account details</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">2</div>
              <div className="info-text">
                <h4>Email Notification</h4>
                <p>You'll receive an email once your account is approved</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">3</div>
              <div className="info-text">
                <h4>Usually Takes 24-48 Hours</h4>
                <p>Most accounts are verified within 1-2 business days</p>
              </div>
            </div>
          </div>

          <div className="pending-status">
            <div className="status-bar">
              <div className="status-progress"></div>
            </div>
            <span>Verification in progress...</span>
          </div>

          <div className="pending-actions">
            <Link to="/" className="btn-home">
              Back to Home
            </Link>
            <a href="mailto:support@healthmandala.com" className="btn-contact">
              Contact Support
            </a>
          </div>

          <p className="pending-note">
            Have questions? Email us at <a href="mailto:support@healthmandala.com">support@healthmandala.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountPending;
