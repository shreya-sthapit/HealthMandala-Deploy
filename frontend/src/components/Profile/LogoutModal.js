import './LogoutModal.css';

// ── Logout icon ───────────────────────────────────────────────────────────────
const LogoutIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const LogoutModal = ({ onCancel, onConfirm }) => {
  return (
    <div
      className="lm-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lm-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="lm-modal">

        {/* Icon */}
        <div className="lm-icon-wrap">
          <LogoutIcon />
        </div>

        {/* Text */}
        <h2 className="lm-title" id="lm-title">Log Out of Your Account?</h2>
        <p className="lm-desc">
          Are you sure you want to log out?
        </p>

        {/* Actions */}
        <div className="lm-actions">
          <button className="lm-btn lm-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="lm-btn lm-confirm" onClick={onConfirm}>
            Yes, Log Out
          </button>
        </div>

      </div>
    </div>
  );
};

export default LogoutModal;
