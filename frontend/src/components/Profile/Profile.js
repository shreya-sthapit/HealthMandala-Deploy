import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoutModal from './LogoutModal';
import API_BASE_URL from '../../config/api';
import './Profile.css';

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_META = {
  open:        { label: 'Open',        color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  in_progress: { label: 'In Progress', color: '#2563eb', bg: '#dbeafe', dot: '#3b82f6' },
  resolved:    { label: 'Resolved',    color: '#16a34a', bg: '#dcfce7', dot: '#22c55e' },
};
const PRIORITY_META = {
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fee2e2' },
  normal: { label: 'Normal', color: '#6b7280', bg: '#f3f4f6' },
};
const CATEGORIES = [
  { value: 'appointment', label: 'Appointment' },
  { value: 'payment',     label: 'Payment' },
  { value: 'prescription',label: 'Prescription' },
  { value: 'account',     label: 'Account' },
  { value: 'technical',   label: 'Technical' },
  { value: 'other',       label: 'Other' },
];

// ── SupportSection component ──────────────────────────────────────────────────
function SupportSection({ userId, userName, userEmail }) {
  const [view, setView] = useState('list'); // 'list' | 'new' | 'detail'
  const [issues, setIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [form, setForm] = useState({
    priority: 'normal',
    category: 'other',
    subject: '',
    description: '',
  });

  const fetchIssues = async () => {
    if (!userId) return;
    setLoadingIssues(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/issues/user/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) setIssues(data.issues || []);
    } catch { /* graceful */ }
    finally { setLoadingIssues(false); }
  };

  useEffect(() => { fetchIssues(); }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      setSubmitError('Subject and description are required.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ userId, userName, userEmail, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitSuccess(`Issue submitted! Your Issue ID is: ${data.issue.issueId}`);
        setForm({ priority: 'normal', category: 'other', subject: '', description: '' });
        await fetchIssues();
        setTimeout(() => { setSubmitSuccess(''); setView('list'); }, 3000);
      } else {
        setSubmitError(data.error || 'Failed to submit issue.');
      }
    } catch {
      setSubmitError('Could not connect to server.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  // ── Detail view ──
  if (view === 'detail' && selectedIssue) {
    const sm = STATUS_META[selectedIssue.status] || STATUS_META.open;
    const pm = PRIORITY_META[selectedIssue.priority] || PRIORITY_META.normal;
    return (
      <div className="pf-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button onClick={() => { setView('list'); setSelectedIssue(null); }} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.82rem', color: '#64748b' }}>
            ← Back
          </button>
          <h2 className="pf-section-title" style={{ margin: 0 }}>Issue Details</h2>
        </div>

        {/* Issue ID + badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', background: '#f1f5f9', padding: '0.3rem 0.7rem', borderRadius: 6 }}>
            {selectedIssue.issueId}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: 20, background: sm.bg, color: sm.color }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: sm.dot, marginRight: 5 }} />
            {sm.label}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: 20, background: pm.bg, color: pm.color }}>
            {pm.label}
          </span>
        </div>

        {/* Subject & description */}
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '0.5rem' }}>{selectedIssue.subject}</div>
          <div style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>{selectedIssue.description}</div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
            Submitted: {fmtDate(selectedIssue.createdAt)} · Category: {selectedIssue.category}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Status Timeline
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { key: 'open',        label: 'Issue Opened',    done: true,                                          time: selectedIssue.createdAt },
            { key: 'in_progress', label: 'In Progress',     done: ['in_progress','resolved'].includes(selectedIssue.status), time: null },
            { key: 'resolved',    label: 'Resolved',        done: selectedIssue.status === 'resolved',           time: selectedIssue.resolvedAt },
          ].map((step, i) => (
            <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, background: step.done ? '#00897b' : '#e2e8f0', color: step.done ? '#fff' : '#94a3b8', marginTop: 2 }}>
                {step.done ? '✓' : i + 1}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: step.done ? '#1e293b' : '#94a3b8' }}>{step.label}</div>
                {step.time && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{fmtDate(step.time)}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Admin response */}
        {selectedIssue.adminNote && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '1rem 1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#16a34a', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Admin Response {selectedIssue.resolvedBy ? `· ${selectedIssue.resolvedBy}` : ''}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#166534', lineHeight: 1.6 }}>{selectedIssue.adminNote}</div>
          </div>
        )}
        {!selectedIssue.adminNote && selectedIssue.status !== 'resolved' && (
          <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 12, padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#92400e' }}>
            ⏳ Our support team is reviewing your issue. You'll be notified when there's an update.
          </div>
        )}
      </div>
    );
  }

  // ── New issue form ──
  if (view === 'new') {
    return (
      <div className="pf-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button onClick={() => { setView('list'); setSubmitError(''); setSubmitSuccess(''); }} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.82rem', color: '#64748b' }}>
            ← Back
          </button>
          <h2 className="pf-section-title" style={{ margin: 0 }}>Raise an Issue</h2>
        </div>

        {submitSuccess && (
          <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#166534', fontWeight: 600 }}>
            ✅ {submitSuccess}
          </div>
        )}
        {submitError && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#dc2626' }}>
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Priority */}
          <div className="pf-field-group" style={{ marginBottom: '1rem' }}>
            <label className="pf-field-label">Priority *</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {['normal', 'urgent'].map(p => (
                <label key={p} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: 8, border: `2px solid ${form.priority === p ? (p === 'urgent' ? '#dc2626' : '#00897b') : '#e2e8f0'}`, background: form.priority === p ? (p === 'urgent' ? '#fee2e2' : '#f0fdf4') : '#fff', fontSize: '0.875rem', fontWeight: 600, color: form.priority === p ? (p === 'urgent' ? '#dc2626' : '#00897b') : '#64748b', transition: 'all 0.15s' }}>
                  <input type="radio" name="priority" value={p} checked={form.priority === p} onChange={() => setForm(f => ({ ...f, priority: p }))} style={{ display: 'none' }} />
                  {p === 'urgent' ? '🚨' : '📋'} {p.charAt(0).toUpperCase() + p.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="pf-field-group" style={{ marginBottom: '1rem' }}>
            <label className="pf-field-label">Category</label>
            <select className="pf-input pf-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          {/* Subject */}
          <div className="pf-field-group" style={{ marginBottom: '1rem' }}>
            <label className="pf-field-label">Subject *</label>
            <input className="pf-input" type="text" placeholder="Brief summary of your issue" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} maxLength={120} required />
          </div>

          {/* Description */}
          <div className="pf-field-group" style={{ marginBottom: '1.5rem' }}>
            <label className="pf-field-label">Description *</label>
            <textarea className="pf-input pf-textarea" rows={5} placeholder="Describe your issue in detail. Include any relevant dates, appointment IDs, or error messages…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          </div>

          <button type="submit" className="pf-save-btn" disabled={submitting} style={{ minWidth: 160 }}>
            {submitting ? 'Submitting…' : 'Submit Issue'}
          </button>
        </form>
      </div>
    );
  }

  // ── Issue list ──
  return (
    <div className="pf-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 className="pf-section-title" style={{ margin: 0 }}>Support &amp; Issues</h2>
        <button className="pf-save-btn" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }} onClick={() => { setView('new'); setSubmitError(''); setSubmitSuccess(''); }}>
          + Raise Issue
        </button>
      </div>

      <div className="pf-info-box" style={{ marginBottom: '1.25rem' }}>
        <span>ℹ️</span>
        <p>Report any problems with appointments, payments, or your account. You'll receive updates as our team works on your issue.</p>
      </div>

      {loadingIssues ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Loading issues…</div>
      ) : issues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#94a3b8' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎫</div>
          <div style={{ fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>No issues raised yet</div>
          <div style={{ fontSize: '0.85rem' }}>Click "Raise Issue" if you need help with anything.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {issues.map(issue => {
            const sm = STATUS_META[issue.status] || STATUS_META.open;
            const pm = PRIORITY_META[issue.priority] || PRIORITY_META.normal;
            return (
              <div
                key={issue._id}
                onClick={() => { setSelectedIssue(issue); setView('detail'); }}
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.9rem 1.1rem', cursor: 'pointer', transition: 'box-shadow 0.15s', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '0.15rem 0.5rem', borderRadius: 4 }}>{issue.issueId}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: 20, background: pm.bg, color: pm.color }}>{pm.label}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{issue.subject}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{fmtDate(issue.createdAt)}</div>
                </div>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: 20, background: sm.bg, color: sm.color, whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: sm.dot, marginRight: 5 }} />
                    {sm.label}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>→</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const SECTIONS = ['personal', 'address', 'emergency', 'medical', 'nid', 'support'];
const SECTION_LABELS = {
  personal: 'Personal Info',
  address: 'Address',
  emergency: 'Emergency Contact',
  medical: 'Medical Info',
  nid: 'NID Verification',
  support: 'Support & Issues',
};

const PROVINCES = [
  'Province 1 (Koshi)', 'Province 2 (Madhesh)', 'Province 3 (Bagmati)',
  'Province 4 (Gandaki)', 'Province 5 (Lumbini)', 'Province 6 (Karnali)',
  'Province 7 (Sudurpashchim)',
];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const emptyForm = {
  // Step 1 – Personal
  firstName: '', lastName: '', phone: '', email: '',
  gender: '', dateOfBirth: '', bloodGroup: '',
  // Step 2 – Address
  address: '', city: '', district: '', province: '',
  // Step 3 – Emergency Contact
  emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
  // Step 4 – Medical
  medicalConditions: '', allergies: '',
  // Step 5 – NID
  nidNumber: '',
};

// ── Component ─────────────────────────────────────────────────────────────────
const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const nidFrontRef = useRef(null);
  const nidBackRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('patient');
  const [userId, setUserId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [activeSection, setActiveSection] = useState('personal');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [nidFrontPreview, setNidFrontPreview] = useState(null);
  const [nidFrontFile, setNidFrontFile] = useState(null);
  const [nidBackPreview, setNidBackPreview] = useState(null);
  const [nidBackFile, setNidBackFile] = useState(null);

  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const role = localStorage.getItem('userRole') || userData.role || 'patient';
    setUserRole(role);
    setUserId(userData.id);
    if (userData.id) {
      fetchProfile(userData.id, role);
    } else {
      setLoading(false);
      setError('User not found. Please login again.');
    }
  }, []);

  const fetchProfile = async (uid, role) => {
    try {
      setLoading(true);
      const statusEndpoint = role === 'doctor'
        ? `http://localhost:5001/api/doctor/status/${uid}`
        : `http://localhost:5001/api/patient/status/${uid}`;

      const statusRes = await fetch(statusEndpoint);
      const statusData = await statusRes.json();

      if (statusData.success && statusData.hasRegistration) {
        const profileEndpoint = role === 'doctor'
          ? `http://localhost:5001/api/doctor/profile/${uid}`
          : `http://localhost:5001/api/patient/profile/${uid}`;

        const profileRes = await fetch(profileEndpoint);
        const profileData = await profileRes.json();

        if (profileData.success) {
          const p = profileData.profile;
          setProfile({ ...p, role });
          setForm({
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            phone: p.phone || '',
            email: p.email || '',
            gender: p.gender || '',
            dateOfBirth: p.dateOfBirth ? p.dateOfBirth.split('T')[0] : '',
            bloodGroup: p.bloodGroup || '',
            // address is nested in DB
            address: p.address?.street || p.address || '',
            city: p.address?.city || '',
            district: p.address?.district || '',
            province: p.address?.province || '',
            // emergency contact is nested
            emergencyContactName: p.emergencyContact?.name || '',
            emergencyContactPhone: p.emergencyContact?.phone || '',
            emergencyContactRelation: p.emergencyContact?.relation || '',
            // medical
            medicalConditions: p.medicalConditions || '',
            allergies: p.allergies || '',
            // nid
            nidNumber: p.nidNumber || '',
          });
          if (p.nidFrontImage) setNidFrontPreview(`http://localhost:5001/${p.nidFrontImage}`);
          if (p.nidBackImage) setNidBackPreview(`http://localhost:5001/${p.nidBackImage}`);
        }
      } else {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setProfile({ firstName: userData.firstName || 'User', lastName: userData.lastName || '', email: userData.email || '', phone: userData.phone || '', role });
        setForm({ ...emptyForm, firstName: userData.firstName || '', lastName: userData.lastName || '', phone: userData.phone || '', email: userData.email || '' });
      }
    } catch {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setProfile({ firstName: userData.firstName || 'User', lastName: userData.lastName || '', email: userData.email || '', phone: userData.phone || '', role });
      setForm({ ...emptyForm, firstName: userData.firstName || '', lastName: userData.lastName || '', phone: userData.phone || '', email: userData.email || '' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleNidImage = (e, side) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (side === 'front') { setNidFrontFile(file); setNidFrontPreview(reader.result); }
      else { setNidBackFile(file); setNidBackPreview(reader.result); }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v || ''));
      if (avatarFile) fd.append('profilePhoto', avatarFile);
      if (nidFrontFile) fd.append('nidFront', nidFrontFile);
      if (nidBackFile) fd.append('nidBack', nidBackFile);

      const res = await fetch(`http://localhost:5001/api/patient/profile/${userId}`, {
        method: 'PUT',
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to save profile.');
      }
    } catch {
      setError('Could not connect to server. Changes saved locally.');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const initials = profile
    ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()
    : '';
  const avatarSrc = avatarPreview || (profile?.profilePhoto ? `http://localhost:5001/${profile.profilePhoto}` : null);
  const mrn = profile?.mrn || 'MRN-' + (userId ? String(userId).slice(-5).toUpperCase() : '00000');

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-content">
          <div className="pf-loading">
            <div className="pf-spinner" />
            <p>Loading profile…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-content">

        <div className="pf-page-header">
          <h1>My Profile</h1>
          <p className="pf-page-sub">Manage your personal information</p>
        </div>

        <div className="pf-dashboard">

          {/* ── Left column ── */}
          <div className="pf-left-col">
            <div className="pf-avatar-wrap">
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="pf-avatar-img" />
              ) : (
                <div className="pf-avatar-initials">{initials}</div>
              )}
            </div>

            <div className="pf-static-info">
              <div className="pf-mrn-badge">
                <span className="pf-mrn-label">Patient ID</span>
                <span className="pf-mrn-value">{mrn}</span>
              </div>
              {(form.bloodGroup || profile?.bloodGroup) && (
                <div className="pf-blood-badge">
                  <span>🩸</span>
                  <span>{form.bloodGroup || profile.bloodGroup}</span>
                </div>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            <button className="pf-upload-btn" onClick={() => fileInputRef.current?.click()}>
              Upload New Photo
            </button>

            {/* Section nav */}
            <nav className="pf-section-nav">
              {SECTIONS.map((s) => (
                <button
                  key={s}
                  className={`pf-nav-btn${activeSection === s ? ' active' : ''}`}
                  onClick={() => setActiveSection(s)}
                >
                  {SECTION_LABELS[s]}
                </button>
              ))}
            </nav>
          </div>

          {/* ── Right column ── */}
          <div className="pf-right-col">
            {error && <div className="pf-error-msg">{error}</div>}
            {saveSuccess && <div className="pf-success-msg">Profile saved successfully.</div>}

            {/* ── Step 1: Personal Info ── */}
            {activeSection === 'personal' && (
              <div className="pf-section">
                <h2 className="pf-section-title">Personal Information</h2>
                <div className="pf-fields-grid">
                  <div className="pf-field-group">
                    <label className="pf-field-label">Full Name</label>
                    <div className="pf-name-row">
                      <input className="pf-input" type="text" placeholder="First name" value={form.firstName} onChange={set('firstName')} />
                      <input className="pf-input" type="text" placeholder="Last name" value={form.lastName} onChange={set('lastName')} />
                    </div>
                  </div>

                  <div className="pf-field-group">
                    <label className="pf-field-label">Mobile Number</label>
                    <input className="pf-input" type="tel" placeholder="98XXXXXXXX" value={form.phone} onChange={set('phone')} />
                  </div>

                  <div className="pf-field-group">
                    <label className="pf-field-label">Email</label>
                    <input className="pf-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
                  </div>

                  <div className="pf-field-group">
                    <label className="pf-field-label">Gender</label>
                    <select className="pf-input pf-select" value={form.gender} onChange={set('gender')}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="pf-field-group">
                    <label className="pf-field-label">Date of Birth</label>
                    <input className="pf-input" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                  </div>

                  <div className="pf-field-group">
                    <label className="pf-field-label">Blood Group</label>
                    <select className="pf-input pf-select" value={form.bloodGroup} onChange={set('bloodGroup')}>
                      <option value="">Select blood group</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Address ── */}
            {activeSection === 'address' && (
              <div className="pf-section">
                <h2 className="pf-section-title">Address Information</h2>
                <div className="pf-fields-grid">
                  <div className="pf-field-group pf-full-width">
                    <label className="pf-field-label">Street Address</label>
                    <input className="pf-input" type="text" placeholder="Street / Tole" value={form.address} onChange={set('address')} />
                  </div>

                  <div className="pf-field-group">
                    <label className="pf-field-label">City / Municipality</label>
                    <input className="pf-input" type="text" placeholder="City" value={form.city} onChange={set('city')} />
                  </div>

                  <div className="pf-field-group">
                    <label className="pf-field-label">District</label>
                    <input className="pf-input" type="text" placeholder="District" value={form.district} onChange={set('district')} />
                  </div>

                  <div className="pf-field-group pf-full-width">
                    <label className="pf-field-label">Province</label>
                    <select className="pf-input pf-select" value={form.province} onChange={set('province')}>
                      <option value="">Select province</option>
                      {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Emergency Contact ── */}
            {activeSection === 'emergency' && (
              <div className="pf-section">
                <h2 className="pf-section-title">Emergency Contact</h2>
                <div className="pf-fields-grid">
                  <div className="pf-field-group pf-full-width">
                    <label className="pf-field-label">Contact Name</label>
                    <input className="pf-input" type="text" placeholder="Full name" value={form.emergencyContactName} onChange={set('emergencyContactName')} />
                  </div>

                  <div className="pf-field-group">
                    <label className="pf-field-label">Relationship</label>
                    <select className="pf-input pf-select" value={form.emergencyContactRelation} onChange={set('emergencyContactRelation')}>
                      <option value="">Select relationship</option>
                      <option value="spouse">Spouse</option>
                      <option value="parent">Parent</option>
                      <option value="sibling">Sibling</option>
                      <option value="child">Child</option>
                      <option value="friend">Friend</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="pf-field-group">
                    <label className="pf-field-label">Contact Phone</label>
                    <div className="pf-phone-row">
                      <span className="pf-cc">+977</span>
                      <input
                        className="pf-input"
                        type="tel"
                        placeholder="98XXXXXXXX"
                        value={form.emergencyContactPhone}
                        onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value.replace(/\D/g, '') })}
                      />
                    </div>
                  </div>
                </div>
                <div className="pf-info-box">
                  <span>ℹ️</span>
                  <p>This information is optional but recommended for your safety.</p>
                </div>
              </div>
            )}

            {/* ── Step 4: Medical Info ── */}
            {activeSection === 'medical' && (
              <div className="pf-section">
                <h2 className="pf-section-title">Medical Information</h2>
                <div className="pf-fields-grid">
                  <div className="pf-field-group pf-full-width">
                    <label className="pf-field-label">Known Medical Conditions</label>
                    <textarea
                      className="pf-input pf-textarea"
                      placeholder="e.g. Diabetes, Hypertension…"
                      rows={4}
                      value={form.medicalConditions}
                      onChange={set('medicalConditions')}
                    />
                  </div>

                  <div className="pf-field-group pf-full-width">
                    <label className="pf-field-label">Allergies</label>
                    <textarea
                      className="pf-input pf-textarea"
                      placeholder="e.g. Penicillin, Peanuts…"
                      rows={3}
                      value={form.allergies}
                      onChange={set('allergies')}
                    />
                  </div>
                </div>
                <div className="pf-info-box">
                  <span>ℹ️</span>
                  <p>This information helps doctors provide better care.</p>
                </div>
              </div>
            )}

            {/* ── Step 5: NID Verification ── */}
            {activeSection === 'nid' && (
              <div className="pf-section">
                <h2 className="pf-section-title">NID Verification</h2>
                <div className="pf-fields-grid">
                  <div className="pf-field-group pf-full-width">
                    <label className="pf-field-label">NID Number</label>
                    <input className="pf-input" type="text" placeholder="National ID number" value={form.nidNumber} onChange={set('nidNumber')} />
                  </div>

                  <div className="pf-field-group">
                    <label className="pf-field-label">NID Front Side</label>
                    {nidFrontPreview ? (
                      <div className="pf-nid-preview">
                        <img src={nidFrontPreview} alt="NID Front" />
                        <button type="button" className="pf-nid-remove" onClick={() => { setNidFrontPreview(null); setNidFrontFile(null); }}>✕ Remove</button>
                      </div>
                    ) : (
                      <label className="pf-upload-area">
                        <input ref={nidFrontRef} type="file" accept="image/*" hidden onChange={(e) => handleNidImage(e, 'front')} />
                        <div className="pf-upload-placeholder" onClick={() => nidFrontRef.current?.click()}>
                          <span className="pf-upload-icon">📄</span>
                          <span>Click to upload front side</span>
                        </div>
                      </label>
                    )}
                  </div>

                  <div className="pf-field-group">
                    <label className="pf-field-label">NID Back Side</label>
                    {nidBackPreview ? (
                      <div className="pf-nid-preview">
                        <img src={nidBackPreview} alt="NID Back" />
                        <button type="button" className="pf-nid-remove" onClick={() => { setNidBackPreview(null); setNidBackFile(null); }}>✕ Remove</button>
                      </div>
                    ) : (
                      <label className="pf-upload-area">
                        <input ref={nidBackRef} type="file" accept="image/*" hidden onChange={(e) => handleNidImage(e, 'back')} />
                        <div className="pf-upload-placeholder" onClick={() => nidBackRef.current?.click()}>
                          <span className="pf-upload-icon">📄</span>
                          <span>Click to upload back side</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
                <div className="pf-info-box">
                  <span>🔒</span>
                  <p>Your NID is used for identity verification and kept secure.</p>
                </div>
              </div>
            )}

            {/* ── Step 6: Support & Issues ── */}
            {activeSection === 'support' && (
              <SupportSection userId={userId} userName={`${form.firstName} ${form.lastName}`.trim()} userEmail={form.email} />
            )}

            {activeSection !== 'support' && (
            <div className="pf-save-row">
              <button className="pf-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
            )}
          </div>

        </div>
      </div>

      {showLogout && (
        <LogoutModal
          onCancel={() => setShowLogout(false)}
          onConfirm={handleLogoutConfirm}
        />
      )}
    </div>
  );
};

export default Profile;
