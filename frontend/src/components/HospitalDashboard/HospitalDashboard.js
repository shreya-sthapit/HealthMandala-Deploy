import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './HospitalDashboard.css';

import HDOverview from './views/HDOverview';
import HDAppointments from './views/HDAppointments';
import HDDoctors from './views/HDDoctors';
import HDDepartments from './views/HDDepartments';
import HDPatients from './views/HDPatients';
import HDBilling from './views/HDBilling';
import HDStaff from './views/HDStaff';
import HDProfile from './views/HDProfile';
import HDReports from './views/HDReports';
import HDNotifications from './views/HDNotifications';

const API = '/api/hospital-dashboard';

const NAV = [
  { section: 'Overview' },
  { id: 'overview',       label: 'Dashboard',        icon: <DashIcon /> },
  { id: 'notifications',  label: 'Notifications',    icon: <BellIcon />, badge: 'notif' },
  { section: 'Scheduling' },
  { id: 'appointments', label: 'Appointments',      icon: <CalIcon />,  badge: 'pending' },
  { id: 'walkin',       label: 'Walk-in Entry',     icon: <WalkIcon /> },
  { id: 'calendar',     label: 'Calendar',          icon: <GridIcon /> },
  { section: 'Doctor & Staff Management' },
  { id: 'doctors',      label: 'Doctors',           icon: <DocIcon /> },
  { id: 'staff',        label: 'Staffs',            icon: <StaffIcon /> },
  { id: 'departments',  label: 'Departments',       icon: <DeptIcon /> },
  { section: 'Patients' },
  { id: 'patients',     label: 'Patient Registry',  icon: <PatIcon /> },
  { section: 'Finance' },
  { id: 'billing',      label: 'Billing & Payouts', icon: <BillIcon /> },
  { section: 'Facility' },
  { id: 'profile',      label: 'Hospital Profile',  icon: <ProfIcon /> },
  { section: 'Analytics' },
  { id: 'reports',      label: 'Reports',           icon: <RepIcon /> },
];

const SIDEBAR_W = 240;
const NOTCH_SIZE = 28;
const BG = '#f9fdfc';

export default function HospitalDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [doctorSpecFilter, setDoctorSpecFilter] = useState('');
  const [stats, setStats] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notchTop, setNotchTop] = useState(null);
  const activeRef = useRef(null);
  const notchTopRef = useRef(null);
  const notchBottomRef = useRef(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id;

  // Update notch position directly via DOM ref — no React re-render lag
  const updateNotch = useCallback(() => {
    if (activeRef.current && notchTopRef.current && notchBottomRef.current) {
      const rect = activeRef.current.getBoundingClientRect();
      notchTopRef.current.style.top = `${rect.top - NOTCH_SIZE}px`;
      notchBottomRef.current.style.top = `${rect.top + PILL_H}px`;
    }
  }, []);

  useEffect(() => {
    updateNotch();
    const onScroll = () => requestAnimationFrame(updateNotch);
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [activeTab, loading, updateNotch]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API}/stats?userId=${userId}`);
      const data = await res.json();
      if (data.success) { setStats(data.stats); setHospital(data.hospital); }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [userId]);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!localStorage.getItem('token') || (role !== 'hospital_admin' && role !== 'admin')) {
      navigate('/hospital/login'); return;
    }
    fetchStats();
  }, [fetchStats, navigate]);

  const handleLogout = () => { localStorage.clear(); navigate('/hospital/login'); };

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'HA';
  const tabLabel = NAV.find(n => n.id === activeTab)?.label || 'Dashboard';

  const renderView = () => {
    const props = { userId, hospital, stats, API, onRefresh: fetchStats };
    switch (activeTab) {
      case 'overview':     return <HDOverview {...props} onTabChange={setActiveTab} />;
      case 'notifications': return <HDNotifications {...props} />;
      case 'appointments':
      case 'walkin':
      case 'calendar':     return <HDAppointments {...props} defaultView={activeTab} />;
      case 'doctors':      return <HDDoctors {...props} initialSpecFilter={doctorSpecFilter} onSpecFilterUsed={() => setDoctorSpecFilter('')} />;
      case 'departments':  return <HDDepartments {...props} onDeptClick={spec => { setDoctorSpecFilter(spec); setActiveTab('doctors'); }} />;
      case 'patients':     return <HDPatients {...props} />;
      case 'billing':      return <HDBilling {...props} />;
      case 'profile':      return <HDProfile {...props} />;
      case 'staff':        return <HDStaff {...props} />;
      case 'reports':      return <HDReports {...props} />;
      default:             return <HDOverview {...props} onTabChange={setActiveTab} />;
    }
  };

  // Pill height (matches padding in CSS)
  const PILL_H = 42;

  return (
    <div className="hospital-dashboard hd-admin">
      {/* Fixed notches — updated via DOM ref, no React re-render */}
      <div ref={notchTopRef} style={{
        position: 'fixed',
        left: SIDEBAR_W - NOTCH_SIZE,
        top: -999,
        width: NOTCH_SIZE,
        height: NOTCH_SIZE,
        background: 'transparent',
        borderBottomRightRadius: NOTCH_SIZE,
        boxShadow: `${NOTCH_SIZE * 0.4}px ${NOTCH_SIZE * 0.4}px 0 ${NOTCH_SIZE * 0.4}px ${BG}`,
        zIndex: 201,
        pointerEvents: 'none'
      }} />
      <div ref={notchBottomRef} style={{
        position: 'fixed',
        left: SIDEBAR_W - NOTCH_SIZE,
        top: -999,
        width: NOTCH_SIZE,
        height: NOTCH_SIZE,
        background: 'transparent',
        borderTopRightRadius: NOTCH_SIZE,
        boxShadow: `${NOTCH_SIZE * 0.4}px -${NOTCH_SIZE * 0.4}px 0 ${NOTCH_SIZE * 0.4}px ${BG}`,
        zIndex: 201,
        pointerEvents: 'none'
      }} />

      {/* ── Sidebar ── */}
      <aside className="hd-sidebar">
        <div className="hd-sidebar-header">
          <div className="hd-hospital-badge">Admin Portal</div>
        </div>

        <nav className="hd-nav">
          {NAV.map((item, i) =>
            item.section ? (
              <div key={i} className="hd-nav-section">{item.section}</div>
            ) : (
              <button
                key={item.id}
                ref={activeTab === item.id ? activeRef : null}
                className={`hd-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="hd-nav-icon">{item.icon}</span>
                {item.label}
                {item.badge === 'pending' && stats?.pendingRequests > 0 && (
                  <span className="hd-nav-badge">{stats.pendingRequests}</span>
                )}
                {item.badge === 'notif' && (stats?.pendingRequests > 0 || stats?.doctorsOnLeave > 0) && (
                  <span className="hd-nav-badge">{(stats?.pendingRequests || 0) + (stats?.doctorsOnLeave || 0)}</span>
                )}
              </button>
            )
          )}
        </nav>

        <div className="hd-sidebar-footer">
          <div className="hd-admin-info">
            <div className="hd-admin-avatar">{initials}</div>
            <div>
              <div className="hd-admin-name">{user.firstName} {user.lastName}</div>
              <div className="hd-admin-role">Hospital Admin</div>
            </div>
          </div>
          <button className="hd-logout-btn" onClick={handleLogout}>
            <LogoutIcon /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="hd-main">
        <div className="hd-topbar">
          <div className="hd-topbar-title">
            <h2>{tabLabel}</h2>
            <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="hd-topbar-actions">
            {activeTab !== 'walkin' && (
              <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => setActiveTab('walkin')}>+ Walk-in</button>
            )}
            {activeTab !== 'doctors' && (
              <button className="hd-btn hd-btn-primary hd-btn-sm" onClick={() => setActiveTab('doctors')}>+ Add Doctor</button>
            )}
          </div>
        </div>

        {loading ? <div className="hd-loading">Loading...</div> : renderView()}

        <div className="hd-footer">
          © {new Date().getFullYear()} HealthMandala. All rights reserved.
        </div>

      </main>
    </div>
  );
}

/* ── SVG Icons ── */
function DashIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>; }
function CalIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function WalkIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7l-2 5h4l-2 5"/><path d="M10 12l-2 5"/><path d="M14 12l2 5"/></svg>; }
function GridIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>; }
function DocIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function DeptIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function PatIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function BillIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>; }
function ProfIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>; }
function StaffIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/><line x1="20" y1="8" x2="20" y2="14"/></svg>; }
function RepIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>; }
function LogoutIcon(){ return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function BellIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
