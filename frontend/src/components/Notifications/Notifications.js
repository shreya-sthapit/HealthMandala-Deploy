import { useState, useEffect } from 'react';
import API_BASE_URL from '../../config/api';
import './Notifications.css';

// ── Helpers ──────────────────────────────────────────────────────────────────
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

// ── Icons ────────────────────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const DocumentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────────
const Notifications = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real notifications from backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (!userData.id) {
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/notifications/${userData.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.notifications) {
          // Map backend notifications to UI format
          const mapped = data.notifications.map(n => ({
            id: n._id,
            type: (n.type === 'prescription_issued' || n.type === 'follow_up_reminder' || n.type === 'lab_report_ready') ? 'report' : 'appointment',
            title: n.title,
            detail: n.detail,
            read: n.read,
            createdAt: n.createdAt,
            appointmentId: n.appointmentId,
            prescriptionId: n.prescriptionId,
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!userData.id) return;

      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/notifications/${userData.id}/mark-all-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const markRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/api/notifications/${id}/mark-read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const filtered = notifications.filter(n => {
    if (activeTab === 'appointments') return n.type === 'appointment';
    if (activeTab === 'reports') return n.type === 'report';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notif-page">
      <div className="notif-content">

        {/* Page Header */}
        <div className="notif-page-header">
          <h1>Notifications</h1>
          {unreadCount > 0 && (
            <span className="notif-unread-count">{unreadCount} unread</span>
          )}
        </div>

        {/* Tabs + Mark all read */}
        <div className="notif-tabs-row">
          <div className="notif-tabs">
            {['all', 'appointments', 'reports'].map(tab => (
              <button
                key={tab}
                className={`notif-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'all' ? 'All' : tab === 'appointments' ? 'Appointments' : 'Medical Reports'}
                {tab === 'all' && unreadCount > 0 && (
                  <span className="notif-tab-badge">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
          {unreadCount > 0 && (
            <button className="notif-mark-all-btn" onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>

        {/* Notification Feed */}
        {loading ? (
          <div className="notif-empty">
            <p>Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="notif-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p>No notifications here</p>
          </div>
        ) : (
          <div className="notif-feed">
            {filtered.map(notif => (
              <div
                key={notif.id}
                className={`notif-card ${!notif.read ? 'unread' : ''}`}
                onClick={() => markRead(notif.id)}
              >
                {/* Icon */}
                <div className={`notif-icon-wrap ${notif.type}`}>
                  {notif.type === 'appointment' ? <CalendarIcon /> : <DocumentIcon />}
                </div>

                {/* Text */}
                <div className="notif-text">
                  <div className="notif-card-title">{notif.title}</div>
                  <div className="notif-card-detail">{notif.detail}</div>
                </div>

                {/* Right side */}
                <div className="notif-right">
                  <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                  {!notif.read && <span className="notif-dot" />}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Notifications;
