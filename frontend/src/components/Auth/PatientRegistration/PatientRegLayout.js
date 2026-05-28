import { Link } from 'react-router-dom';
import '../AuthPage.css';
import './PatientRegLayout.css';

const STEPS = [
  { num: 1, label: 'Personal Details' },
  { num: 2, label: 'Address Information' },
  { num: 3, label: 'Emergency Contact' },
  { num: 4, label: 'Medical Information' },
  { num: 5, label: 'NID Verification' },
];

const LEFT_CONTENT = {
  1: { emoji: '👤', title: 'Personal\nDetails', desc: 'Tell us a bit about yourself.' },
  2: { emoji: '📍', title: 'Your\nAddress', desc: 'Where are you located in Nepal?' },
  3: { emoji: '🆘', title: 'Emergency\nContact', desc: 'Who should we reach in an emergency?' },
  4: { emoji: '🩺', title: 'Medical\nHistory', desc: 'Help us understand your health background.' },
  5: { emoji: '🪪', title: 'NID\nVerification', desc: 'Verify your identity with your National ID.' },
};

const PatientRegLayout = ({ step, title, subtitle, children }) => {
  const left = LEFT_CONTENT[step] || LEFT_CONTENT[1];

  return (
    <div className="prl-page">
      <div className="prl-card">

        {/* ── Teal left panel ── */}
        <div className="prl-left">
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '3rem', textAlign: 'center' }}>
            Create Account
          </h1>

          {/* Vertical Stepper */}
          <div style={{ width: '100%', maxWidth: '280px' }}>
            {STEPS.map((s, i) => (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {/* Circle */}
                  <div style={{
                    width: 50,
                    height: 50,
                    minWidth: 50,
                    borderRadius: '50%',
                    background: s.num < step ? '#fff' : s.num === step ? '#fff' : 'rgba(255,255,255,0.3)',
                    color: s.num === step ? '#6dbc95' : s.num < step ? '#10b981' : 'rgba(255,255,255,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    transition: 'all 0.3s',
                  }}>
                    {s.num < step ? '✓' : s.num}
                  </div>
                  {/* Label */}
                  <div style={{
                    fontSize: '1.05rem',
                    fontWeight: s.num === step ? 700 : 500,
                    color: s.num === step ? '#fff' : s.num < step ? '#fff' : 'rgba(255,255,255,0.6)',
                    transition: 'all 0.3s',
                  }}>
                    {s.label}
                  </div>
                </div>
                {/* Vertical Line */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    width: 3,
                    height: 50,
                    background: s.num < step ? '#fff' : 'rgba(255,255,255,0.25)',
                    marginLeft: '23.5px',
                    transition: 'background 0.3s',
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── White right panel ── */}
        <div className="prl-right" style={{ paddingTop: '120px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          <div className="prl-form-wrapper" style={{ marginTop: '0' }}>
            <h2 className="prl-title">{title}</h2>
            {subtitle && <p className="prl-subtitle">{subtitle}</p>}
            {children}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientRegLayout;
