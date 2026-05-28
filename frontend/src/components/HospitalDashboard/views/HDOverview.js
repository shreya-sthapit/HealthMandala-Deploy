import { useState, useEffect } from 'react';

const CalSVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const ClockSVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const CheckSVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const UserSVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const DollarSVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>); // eslint-disable-line

export default function HDOverview({ userId, hospital, stats, API, onTabChange }) {
  const [todayApts, setTodayApts] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    fetch(`${API}/appointments?userId=${userId}&date=${today}`)
      .then(r => r.json())
      .then(d => { if (d.success) setTodayApts(d.appointments.slice(0, 8)); })
      .catch(() => {});

    const notifs = [];
    if (stats?.pendingRequests > 0)
      notifs.push({ type: 'warning', icon: <ClockSVG />, text: `${stats.pendingRequests} appointment requests need approval`, time: 'Now' });
    if (stats?.doctorsOnLeave > 0)
      notifs.push({ type: 'error', icon: <UserSVG />, text: `${stats.doctorsOnLeave} doctor(s) on leave today`, time: 'Today' });
    notifs.push({ type: 'info', icon: <CalSVG />, text: `${stats?.todayAppointments || 0} appointments scheduled for today`, time: 'Today' });
    setNotifications(notifs);
  }, [userId, stats, API]);

  const statusColor = s => ({
    confirmed: 'confirmed', checked_in: 'confirmed', prescribed: 'confirmed',
    completed: 'completed', cancelled: 'cancelled'
  }[s] || 'pending');

  const statCards = [
    { label: "Today's Appointments", value: stats?.todayAppointments ?? 0, icon: <CalSVG />, color: 'teal' },
    { label: 'Checked-In Patients',  value: stats?.checkedIn ?? 0,         icon: <CheckSVG />, color: 'green' },
    { label: 'Doctors On-Duty',      value: stats?.doctorsOnDuty ?? 0,     icon: <UserSVG />, color: 'blue' },
    { label: 'Available Slots',      value: Math.max(0, (stats?.doctorsOnDuty ?? 0) * 10 - (stats?.checkedIn ?? 0)), icon: <ClockSVG />, color: 'purple' },
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div className="hd-stats-grid">
        {statCards.map(c => (
          <div className="hd-stat-card" key={c.label}>
            <div className={`hd-stat-icon ${c.color}`}>{c.icon}</div>
            <div style={{ minWidth: 0 }}>
              <div className="hd-stat-value">{c.value}</div>
              <div className="hd-stat-label">{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="hd-two-col">
        <div className="hd-card">
          <div className="hd-card-header">
            <h3>Today's Appointments</h3>
            <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => onTabChange('appointments')}>View All →</button>
          </div>
          <div className="hd-table-wrap">
            {todayApts.length === 0 ? (
              <div className="hd-empty"><div className="hd-empty-icon"><CalSVG /></div><p>No appointments today</p></div>
            ) : (
              <table className="hd-table">
                <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th></tr></thead>
                <tbody>
                  {todayApts.map(a => (
                    <tr key={a._id}>
                      <td><span className="hd-token">#{a.tokenNumber}</span></td>
                      <td style={{ fontWeight: 600 }}>{a.patientName}</td>
                      <td style={{ fontSize: '0.8rem', color: '#6b8f95' }}>{a.doctorName}</td>
                      <td style={{ fontSize: '0.82rem' }}>{a.appointmentTime || '—'}</td>
                      <td><span className={`hd-badge hd-badge-${statusColor(a.status)}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="hd-card">
            <div className="hd-card-header">
              <h3>Notifications</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {notifications.length > 0 && <span style={{ background: 'linear-gradient(135deg, #00c9b1, #0284c7)', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '0.18rem 0.55rem', borderRadius: '20px' }}>{notifications.length} new</span>}
                <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => onTabChange('notifications')}>View All →</button>
              </div>
            </div>
            <div className="hd-card-body">
              <div className="hd-notifications">
                {notifications.map((n, i) => (
                  <div key={i} className={`hd-notif-item ${n.type}`}>
                    <span className="hd-notif-icon">{n.icon}</span>
                    <div><div className="hd-notif-text">{n.text}</div><div className="hd-notif-time">{n.time}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hd-card">
            <div className="hd-card-header"><h3>Revenue Summary</h3></div>
            <div className="hd-card-body">
              {[
                { label: 'Today', value: `NPR ${(stats?.todayRevenue ?? 0).toLocaleString()}`, teal: true },
                { label: 'This Week', value: `NPR ${(stats?.weekRevenue ?? 0).toLocaleString()}`, teal: true },
              ].map(r => (
                <div className="hd-revenue-row" key={r.label}>
                  <span style={{ color: '#6b8f95', fontSize: '0.83rem' }}>{r.label}</span>
                  <span style={{ fontWeight: 700, color: r.teal ? '#00a896' : '#1a2e35', fontSize: '0.88rem' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
