import { useState, useEffect } from 'react';

const CATEGORIES = [
  { id: 'all',          label: 'All' },
  { id: 'appointment',  label: 'Appointment Requests' },
  { id: 'cancellation', label: 'Doctor Cancellations' },
  { id: 'leave',        label: 'Doctor Leave Alerts' },
];

const CalSVG    = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const UserSVG   = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const ClockSVG  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const CheckSVG  = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);

const TYPE_META = {
  appointment:  { icon: <CalSVG />,   color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Appointment Request' },
  cancellation: { icon: <UserSVG />,  color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe', label: 'Doctor Cancellation'  },
  leave:        { icon: <ClockSVG />, color: '#0284c7', bg: '#eff6ff', border: '#bfdbfe', label: 'Doctor Leave Alert'   },
};

function buildNotifications(stats, appointments) {
  const notifs = [];
  const now = new Date();

  // Appointment requests
  if (stats?.pendingRequests > 0) {
    notifs.push({
      id: 'pending-req',
      type: 'appointment',
      title: 'Pending Appointment Requests',
      detail: `${stats.pendingRequests} appointment${stats.pendingRequests > 1 ? 's' : ''} awaiting your approval.`,
      time: now,
      read: false,
    });
  }

  // Doctor cancellations — appointments cancelled by doctor
  const cancellations = appointments.filter(a => a.status === 'cancelled' && a.cancelledBy === 'doctor');
  cancellations.forEach(a => {
    notifs.push({
      id: `cancel-${a._id}`,
      type: 'cancellation',
      title: 'Doctor Cancelled Appointment',
      detail: `Dr. ${a.doctorName} cancelled appointment for ${a.patientName}.`,
      time: new Date(a.updatedAt || now),
      read: false,
    });
  });

  // Doctor leave alerts
  if (stats?.doctorsOnLeave > 0) {
    notifs.push({
      id: 'leave-alert',
      type: 'leave',
      title: 'Doctor Leave Alert',
      detail: `${stats.doctorsOnLeave} doctor${stats.doctorsOnLeave > 1 ? 's are' : ' is'} on leave today. Affected appointments may need rescheduling.`,
      time: now,
      read: false,
    });
  }

  // Always show today's schedule summary
  notifs.push({
    id: 'daily-summary',
    type: 'appointment',
    title: "Today's Schedule",
    detail: `${stats?.todayAppointments || 0} appointments scheduled for today.`,
    time: now,
    read: true,
  });

  return notifs.sort((a, b) => b.time - a.time);
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function HDNotifications({ userId, stats, API }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());

  useEffect(() => {
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    fetch(`${API}/appointments?userId=${userId}&date=${today}`)
      .then(r => r.json())
      .then(d => {
        const apts = d.success ? d.appointments : [];
        setNotifications(buildNotifications(stats, apts));
      })
      .catch(() => setNotifications(buildNotifications(stats, [])));
  }, [userId, stats, API]);

  const markRead = (id) => setReadIds(prev => new Set([...prev, id]));
  const markAllRead = () => setReadIds(new Set(notifications.map(n => n.id)));

  const filtered = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === activeFilter);

  const unreadCount = notifications.filter(n => !n.read && !readIds.has(n.id)).length;

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {unreadCount > 0 && (
            <span style={{ background: 'linear-gradient(135deg, #00c9b1, #0284c7)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{ background: 'none', border: 'none', color: '#00a896', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <CheckSVG /> Mark all as read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveFilter(c.id)}
            style={{
              padding: '0.35rem 0.9rem',
              borderRadius: '20px',
              border: activeFilter === c.id ? 'none' : '1.5px solid #e2f0ef',
              background: activeFilter === c.id ? 'linear-gradient(135deg, #00c9b1, #0284c7)' : '#fff',
              color: activeFilter === c.id ? '#fff' : '#6b8f95',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#a8c5c9', fontSize: '0.9rem' }}>
            No notifications in this category
          </div>
        ) : (
          filtered.map(n => {
            const meta = TYPE_META[n.type];
            const isRead = n.read || readIds.has(n.id);
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '1rem 1.25rem',
                  borderRadius: '14px',
                  border: `1.5px solid ${isRead ? '#e2f0ef' : meta.border}`,
                  background: isRead ? '#fafafa' : meta.bg,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                  background: isRead ? '#f0f4f5' : meta.bg,
                  border: `1.5px solid ${isRead ? '#e2f0ef' : meta.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isRead ? '#a8c5c9' : meta.color,
                }}>
                  {meta.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ fontWeight: isRead ? 500 : 700, fontSize: '0.88rem', color: isRead ? '#6b8f95' : '#1a2e35' }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#a8c5c9', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {timeAgo(n.time)}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#6b8f95', marginTop: '0.2rem', lineHeight: 1.5 }}>
                    {n.detail}
                  </div>
                  <div style={{
                    display: 'inline-block', marginTop: '0.4rem',
                    fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem',
                    borderRadius: '8px', background: isRead ? '#f0f4f5' : meta.bg,
                    color: isRead ? '#a8c5c9' : meta.color,
                    border: `1px solid ${isRead ? '#e2f0ef' : meta.border}`,
                  }}>
                    {meta.label}
                  </div>
                </div>

                {/* Unread dot */}
                {!isRead && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 8, height: 8, borderRadius: '50%',
                    background: meta.color,
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
