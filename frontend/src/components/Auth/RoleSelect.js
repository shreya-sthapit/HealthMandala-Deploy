import { Link, useNavigate } from 'react-router-dom';
import './RoleSelect.css';

const RoleSelect = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/nid-registration', { state: { role: 'patient' } });
  };

  return (
    <div className="role-container">
      <div className="role-card">
        <div className="role-header">
          <Link to="/" className="logo">
            <img src="/logo.png" alt="HealthMandala" />
            <span>HealthMandala</span>
          </Link>
          <h2>Patient Registration</h2>
          <p>Create your account to book appointments and manage your health</p>
        </div>

        <div className="role-options">
          <div
            className="role-option patient selected"
            onClick={handleContinue}
          >
            <div className="role-icon">P</div>
            <h3>Patient</h3>
            <p>Book appointments, view medical records, and manage your health</p>
          </div>
        </div>

        <button
          className="role-submit"
          onClick={handleContinue}
        >
          Continue as Patient
        </button>
      </div>
    </div>
  );
};

export default RoleSelect;
