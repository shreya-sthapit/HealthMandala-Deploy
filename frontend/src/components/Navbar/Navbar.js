import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LogoutModal from '../Profile/LogoutModal';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const dropdownRef = useRef(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Read user from localStorage on every route change
  useEffect(() => {
    const stored = localStorage.getItem('user');
    const role = localStorage.getItem('userRole');
    if (stored && (role === 'patient' || role === 'doctor')) {
      const userData = { ...JSON.parse(stored), role };
      setUser(userData);
      // Fetch notifications preview for patients
      if (role === 'patient' && userData.id) {
        fetchNotificationsPreview(userData.id);
      }
    } else {
      setUser(null);
    }
  }, [path]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotificationsPreview = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/notifications/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.notifications?.length > 0) {
        // Map backend notifications to UI format and take first 3 unread
        const unread = data.notifications
          .filter(n => !n.read)
          .slice(0, 3)
          .map(n => ({
            id: n._id,
            type: (n.type === 'prescription_issued' || n.type === 'follow_up_reminder' || n.type === 'lab_report_ready') ? 'report' : 'appointment',
            title: n.title,
            detail: n.detail,
            createdAt: n.createdAt,
          }));
        
        setNotifications(unread);
        setNotifCount(data.notifications.filter(n => !n.read).length);
      }
    } catch (err) {
      // Silent fail
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const handleLogout = () => {
    setShowDropdown(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    setUser(null);
    setShowLogoutModal(false);
    navigate('/');
  };

  // Hide navbar entirely on doctor dashboard routes — the sidebar handles all navigation
  if (path.startsWith('/doctor-dashboard') ||
      path.startsWith('/doctor-schedule') || path.startsWith('/doctor-patients')) {
    return null;
  }

  // Hide on doctor/admin dashboards and registration flows
  const hideOn = [];
  if (hideOn.some(p => path.startsWith(p))) return null;

  const isActive = (href) => path === href || path.startsWith(href + '/');

  // Redirect logged-in patients away from auth pages
  const isAuthPage = ['/login', '/signup', '/auth', '/hospital/set-password', '/doctor/set-password', '/staff/set-password'].includes(path);
  if (isAuthPage && user) return null;

  // Hospital dashboard, Receptionist & Pharmacist dashboards — clean white topbar matching reference design
  if (path.startsWith('/hospital-dashboard') || path.startsWith('/receptionist-dashboard') || path.startsWith('/pharmacist-dashboard')) {
    return (
      <nav className="global-navbar" style={{
        padding: '0 2rem',
        height: '56px',
        background: '#ffffff',
        borderBottom: '1px solid #e2f0ef',
        boxShadow: '0 2px 12px rgba(0,168,150,0.06)'
      }}>
        <Link to="/" className="global-logo" style={{ fontSize: '1.1rem', gap: '0.5rem' }}>
          <img src="/logo.png" alt="HealthMandala" style={{ height: '36px' }} />
          <span style={{ background: 'linear-gradient(135deg, #00c9b1, #0284c7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 800 }}>
            HealthMandala
          </span>
        </Link>
      </nav>
    );
  }

  // Avatar: initials from name
  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : '';

  return (
    <>
    <nav className="global-navbar">
      <Link to="/" className="global-logo">
        <img src="/logo.png" alt="HealthMandala" />
        <span>HealthMandala</span>
      </Link>

      <ul className="global-nav-links">
        <li><Link to="/find-doctors" className={isActive('/find-doctors') ? 'active' : ''}>Find Doctors</Link></li>
        <li><Link to="/hospitals" className={isActive('/hospitals') ? 'active' : ''}>Book Hospital Appointment</Link></li>
        <li><a href="/#how-it-works">How It Works</a></li>
        <li><a href="/#about">About</a></li>
      </ul>

      {user ? (
        /* ── Logged-in patient UI ── */
        <div className="gnav-user-area" ref={dropdownRef}>
          {/* Bell with Dropdown */}
          <div className="gnav-bell-wrapper" ref={notifRef}>
            <button 
              className="gnav-bell" 
              title="Notifications" 
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {notifCount > 0 && <span className="gnav-bell-badge">{notifCount}</span>}
            </button>

            {/* Dropdown */}
            {showNotifDropdown && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">
                  <span className="notif-dropdown-title">Notifications</span>
                  {notifCount > 0 && <span className="notif-dropdown-count">{notifCount}</span>}
                </div>
                
                <div className="notif-dropdown-list">
                  {notifications.length === 0 ? (
                    <div className="notif-dropdown-empty">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      <span>No new notifications</span>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className="notif-dropdown-item">
                        <div className="notif-dropdown-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </div>
                        <div className="notif-dropdown-text">
                          <div className="notif-dropdown-item-title">{notif.title}</div>
                          <div className="notif-dropdown-item-detail">{notif.detail}</div>
                        </div>
                        <span className="notif-dropdown-time">{timeAgo(notif.createdAt)}</span>
                      </div>
                    ))
                  )}
                </div>
                
                <button 
                  className="notif-dropdown-view-all"
                  onClick={() => {
                    setShowNotifDropdown(false);
                    navigate('/notifications');
                  }}
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>

          {/* Avatar + name + chevron */}
          <button className="gnav-profile-btn" onClick={() => setShowDropdown(v => !v)}>
            {user.profilePhoto ? (
              <img
                src={`/${user.profilePhoto}`}
                alt={user.firstName}
                className="gnav-avatar-img"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              className="gnav-avatar-initials"
              style={{ display: user.profilePhoto ? 'none' : 'flex' }}
            >
              {initials}
            </div>
            <span className="gnav-username">{user.firstName}</span>
            <svg className={`gnav-chevron ${showDropdown ? 'open' : ''}`} width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="gnav-dropdown">
              <div className="gnav-dropdown-header">
                <div className="gnav-dd-avatar">
                  {user.profilePhoto ? (
                    <img src={`/${user.profilePhoto}`} alt="" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <div>
                  <div className="gnav-dd-name">{user.firstName} {user.lastName}</div>
                  <div className="gnav-dd-email">{user.email}</div>
                </div>
              </div>
              <div className="gnav-dropdown-divider" />
              {user.role === 'doctor' ? (
                <>
                  <Link to="/doctor-dashboard" className="gnav-dd-item" onClick={() => setShowDropdown(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Dashboard
                  </Link>
                  <Link to="/doctor-schedule" className="gnav-dd-item" onClick={() => setShowDropdown(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    My Schedule
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/my-appointments" className="gnav-dd-item" onClick={() => setShowDropdown(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Appointments
                  </Link>
                  <Link to="/medical-records" className="gnav-dd-item" onClick={() => setShowDropdown(false)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Medical Records
                  </Link>
                </>
              )}
              <Link to="/profile" className="gnav-dd-item" onClick={() => setShowDropdown(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profile
              </Link>
              <Link to="/change-password" className="gnav-dd-item" onClick={() => setShowDropdown(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Change Password
              </Link>
              <div className="gnav-dropdown-divider" />
              <button className="gnav-dd-item gnav-dd-logout" onClick={handleLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── Guest buttons ── */
        <div className="global-nav-buttons">
          <Link to="/login?role=patient" className="btn btn-outline">Sign In</Link>
          <Link to="/signup?role=patient&mode=signup" className="btn btn-primary">Sign Up</Link>
        </div>
      )}
    </nav>

    {/* Logout confirmation modal — rendered outside <nav> so it overlays the full page */}
    {showLogoutModal && (
      <LogoutModal
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    )}
    </>
  );
};

export default Navbar;
