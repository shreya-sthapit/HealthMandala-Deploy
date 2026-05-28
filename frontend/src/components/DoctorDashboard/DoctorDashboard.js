import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientDetailModal from './PatientDetailModal';
import DoctorSchedule from './DoctorSchedule';
import LogoutModal from '../Profile/LogoutModal';
import '../Profile/DoctorProfile.css';
import './DoctorDashboard.css';

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const QueueIcon   = () => <Icon d="M3 12h18M3 6h18M3 18h18" />;
const CalIcon     = () => <Icon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />;
const SettingsIcon= () => <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />;
const PlusIcon    = () => <Icon d="M12 5v14M5 12h14" />;
const TrashIcon   = () => <Icon d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" size={16} />;
const ClockIcon   = () => <Icon d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 6v6l4 2" size={16} />;
const CheckIcon   = () => <Icon d="M20 6L9 17l-5-5" size={16} />;

// ── Helpers ───────────────────────────────────────────────────────────────────
const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// ── MedicineSearch — inventory-backed combobox ────────────────────────────────
function MedicineSearch({ value, onChange }) {
  const [query, setQuery]       = useState(value || '');
  const [results, setResults]   = useState([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const debounceRef             = useRef(null);
  const wrapRef                 = useRef(null);

  // Sync external value changes (e.g. reset on patient change)
  useEffect(() => { setQuery(value || ''); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = (q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `http://localhost:5001/api/inventory?search=${encodeURIComponent(q)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        const data = await res.json();
        if (data.success) { setResults(data.medicines || []); setOpen(true); }
      } catch { /* silent */ }
      finally { setLoading(false); }
    }, 250);
  };

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q);   // keep parent in sync while typing
    search(q);
  };

  const handleSelect = (med) => {
    setQuery(med.medicine_name);
    onChange(med.medicine_name);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', flex: 1 }}>
      <input
        className="dd-rx-input"
        placeholder="Search medicine…"
        value={query}
        onChange={handleInput}
        onFocus={() => query.trim() && results.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {loading && (
        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', color: '#94a3b8' }}>…</span>
      )}
      {open && results.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10)', margin: '2px 0 0', padding: 0,
          listStyle: 'none', maxHeight: 220, overflowY: 'auto',
        }}>
          {results.map((med) => (
            <li
              key={med._id}
              onMouseDown={() => handleSelect(med)}
              style={{
                padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.83rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid #f1f5f9',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0fafa'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              <span style={{ fontWeight: 500, color: '#1a2e35' }}>{med.medicine_name}</span>
              <span style={{
                fontSize: '0.72rem', fontWeight: 600,
                color: med.stock_quantity > 0 ? '#059669' : '#dc2626',
                background: med.stock_quantity > 0 ? '#d1fae5' : '#fee2e2',
                borderRadius: 20, padding: '0.1rem 0.5rem', whiteSpace: 'nowrap',
              }}>
                {med.stock_quantity > 0 ? `${med.stock_quantity} in stock` : 'Out of stock'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const STATUS_META = {
  active:    { label: 'In Room',   color: '#16a34a', bg: '#dcfce7', dot: '#16a34a' },
  waiting:   { label: 'Waiting',   color: '#d97706', bg: '#fef3c7', dot: '#d97706' },
  upcoming:  { label: 'Upcoming',  color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
  completed: { label: 'Done',      color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2', dot: '#dc2626' },
};

const queueStatus = (apt) => {
  if (apt.status === 'completed' || apt.status === 'prescribed') return 'completed';
  if (apt.status === 'cancelled') return 'cancelled';
  if (apt.status === 'in-progress') return 'active';
  if (apt.status === 'checked_in') return 'waiting';
  // confirmed/pending = booked but not yet arrived — show as upcoming (greyed out)
  return 'upcoming';
};

const FOLLOW_UP_OPTIONS = ['1 Week', '2 Weeks', '1 Month', '3 Months', 'Custom Date'];

const FREQ_OPTIONS = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
  'Every 8 hours', 'Every 12 hours', 'As needed', 'Before meals', 'After meals', 'At bedtime'];
const DURATION_OPTIONS = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '3 months', 'Ongoing'];
const STRENGTH_OPTIONS = ['50mg', '100mg', '200mg', '250mg', '500mg', '1g', '5ml', '10ml', '15ml'];

// ── Sub-view: Live Queue ──────────────────────────────────────────────────────
const LiveQueue = ({ doctorId, doctorName }) => {
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyPatient, setHistoryPatient] = useState(null);
  const wsRef = useRef(null);

  // Consultation pad state
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', strength: '', timing: '', duration: '' }]);
  const [advice, setAdvice] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [customFollowUp, setCustomFollowUp] = useState('');

  const fetchQueue = useCallback(async () => {
    if (!doctorId) return;
    try {
      const res = await fetch(`http://localhost:5001/api/appointments/doctor/${doctorId}`);
      const data = await res.json();
      if (data.success) {
        const t = today();
        const todayApts = (data.appointments || [])
          .filter(a => {
            const d = new Date(a.appointmentDate);
            d.setHours(0, 0, 0, 0);
            // Only show checked_in patients in the active queue; completed/cancelled are shown as done
            return d.getTime() === t.getTime() && a.status !== 'cancelled';
          })
          .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
        setQueue(todayApts);
        // Auto-select first checked_in patient
        if (!selected) {
          const first = todayApts.find(a => a.status === 'checked_in');
          if (first) setSelected(first);
        }
      }
    } catch (e) {
      console.error('Queue fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  // WebSocket for real-time check-ins + polling fallback
  useEffect(() => {
    fetchQueue();

    // Poll every 10 seconds as a reliable fallback
    const pollInterval = setInterval(fetchQueue, 10000);

    // Also try WebSocket for instant updates
    let ws;
    try {
      ws = new WebSocket('ws://localhost:5001');
      wsRef.current = ws;
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'new_checkin' || msg.type === 'appointment_update') {
            fetchQueue();
          }
        } catch {}
      };
      ws.onerror = () => {};
    } catch {}

    return () => {
      clearInterval(pollInterval);
      wsRef.current?.close();
    };
  }, [fetchQueue]);

  // Reset pad when patient changes
  useEffect(() => {
    setChiefComplaints('');
    setDiagnosis('');
    setMedicines([{ name: '', strength: '', timing: '', duration: '' }]);
    setAdvice('');
    setFollowUp('');
    setCustomFollowUp('');
  }, [selected?._id]);

  const addMedicine = () =>
    setMedicines(m => [...m, { name: '', strength: '', timing: '', duration: '' }]);

  const removeMedicine = (i) =>
    setMedicines(m => m.filter((_, idx) => idx !== i));

  const updateMedicine = (i, field, val) =>
    setMedicines(m => m.map((med, idx) => idx === i ? { ...med, [field]: val } : med));

  const handleSubmitAndNext = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const validMeds = medicines.filter(m => m.name.trim());

      // Always create a prescription record so the pharmacist sees the visit
      await fetch('http://localhost:5001/api/prescriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selected.patientId,
          appointmentId: selected._id,
          doctorId: userData.id,
          doctorName,
          patientName: selected.patientName,
          diagnosis,
          chiefComplaints,
          medicines: validMeds,
          notes: advice,
          followUpDate: followUp === 'Custom Date' ? customFollowUp : followUp,
          tokenNumber: selected.tokenNumber,
        }),
      });

      // Mark appointment as 'prescribed' — pharmacist will finalize to 'completed'
      await fetch(`http://localhost:5001/api/appointments/complete/${selected._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorNotes: advice }),
      });

      await fetchQueue();

      // Move to next checked_in patient
      const currentIdx = queue.findIndex(a => a._id === selected._id);
      const next = queue.slice(currentIdx + 1).find(a => a.status === 'checked_in');
      setSelected(next || null);
    } catch (e) {
      console.error('Submit error', e);
    } finally {
      setSaving(false);
    }
  };

  const activeCount = queue.filter(a => a.status === 'checked_in').length;
  const doneCount   = queue.filter(a => a.status === 'prescribed' || a.status === 'completed').length;

  return (
    <div className="dd-queue-workspace">
      {/* ── Left: Queue List ── */}
      <div className="dd-queue-col">
        <div className="dd-queue-header">
          <div>
            <h2 className="dd-queue-title">Today's Queue</h2>
            <p className="dd-queue-sub">{activeCount} waiting · {doneCount} done</p>
          </div>
          <div className="dd-queue-date">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {loading ? (
          <div className="dd-queue-empty"><div className="dd-spinner" /><p>Loading queue…</p></div>
        ) : queue.length === 0 ? (
          <div className="dd-queue-empty">
            <ClockIcon />
            <p>No checked-in patients</p>
            <span>Patients appear here after the receptionist checks them in</span>
          </div>
        ) : (
          <div className="dd-queue-list">
            {queue.map((apt) => {
              const qs = queueStatus(apt);
              const meta = STATUS_META[qs];
              const isActive = selected?._id === apt._id;
              return (
                <div
                  key={apt._id}
                  className={`dd-queue-item${isActive ? ' selected' : ''}${qs === 'completed' ? ' done' : ''}${qs === 'upcoming' ? ' not-arrived' : ''}`}
                  onClick={() => qs === 'waiting' && setSelected(apt)}
                  style={{ cursor: qs === 'waiting' ? 'pointer' : 'default' }}
                >
                  <div className="dd-qi-token" style={{ background: meta.bg, color: meta.color }}>
                    #{apt.tokenNumber || '—'}
                  </div>
                  <div className="dd-qi-info">
                    <span className="dd-qi-name">{apt.patientName}</span>
                    <span className="dd-qi-reason">{apt.reasonForVisit || 'General consultation'}</span>
                  </div>
                  <div className="dd-qi-right">
                    {qs === 'completed' ? (
                      <span className="dd-qi-done"><CheckIcon /></span>
                    ) : (
                      <span className="dd-qi-badge" style={{ background: meta.bg, color: meta.color }}>
                        <span className="dd-qi-dot" style={{ background: meta.dot }} />
                        {meta.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Right: Consultation Pad ── */}
      <div className="dd-pad-col">
        {!selected ? (
          <div className="dd-pad-empty">
            <div className="dd-pad-empty-icon">👨‍⚕️</div>
            <h3>Select a patient from the queue</h3>
            <p>Click any waiting patient on the left to open their consultation pad</p>
          </div>
        ) : (
          <>
            {/* Patient Header */}
            <div className="dd-pad-header">
              <div className="dd-pad-patient">
                <div className="dd-pad-avatar">
                  {selected.patientName?.[0] || 'P'}
                </div>
                <div>
                  <div className="dd-pad-name">
                    Token #{selected.tokenNumber} — {selected.patientName}
                  </div>
                  <div className="dd-pad-meta">
                    {selected.patientAge ? `${selected.patientAge} yrs` : ''}
                    {selected.patientGender ? ` · ${selected.patientGender}` : ''}
                    {selected.appointmentTime ? ` · ${selected.appointmentTime}` : ''}
                  </div>
                </div>
              </div>
              <button
                className="dd-history-btn"
                onClick={() => { setHistoryPatient(selected); setShowHistory(true); }}
              >
                📋 Past Records
              </button>
            </div>

            {/* Vitals strip (read-only placeholder) */}
            <div className="dd-vitals-strip">
              <span className="dd-vitals-label">Vitals (from nurse)</span>
              <div className="dd-vitals-items">
                <span>BP: —</span>
                <span>Temp: —</span>
                <span>Wt: —</span>
                <span>SpO₂: —</span>
              </div>
            </div>

            {/* Block 1: Chief Complaints & Diagnosis */}
            <div className="dd-pad-block">
              <div className="dd-block-title">1. Chief Complaints &amp; Diagnosis</div>
              <textarea
                className="dd-textarea"
                placeholder="Describe symptoms… e.g. Dry cough, chest tightness for 3 days"
                rows={3}
                value={chiefComplaints}
                onChange={e => setChiefComplaints(e.target.value)}
              />
              <input
                className="dd-input"
                type="text"
                placeholder="Diagnosis… e.g. Acute Bronchitis"
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
              />
            </div>

            {/* Block 2: Prescription */}
            <div className="dd-pad-block">
              <div className="dd-block-title">2. Prescription (Rx)</div>
              <div className="dd-rx-table">
                <div className="dd-rx-head">
                  <span>Medicine Name</span>
                  <span>Timing</span>
                  <span>Duration</span>
                  <span></span>
                </div>
                {medicines.map((med, i) => (
                  <div key={i} className="dd-rx-row">
                    <MedicineSearch
                      value={med.name}
                      onChange={val => updateMedicine(i, 'name', val)}
                    />
                    <select className="dd-rx-select" value={med.timing} onChange={e => updateMedicine(i, 'timing', e.target.value)}>
                      <option value="">Select</option>
                      {FREQ_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <select className="dd-rx-select" value={med.duration} onChange={e => updateMedicine(i, 'duration', e.target.value)}>
                      <option value="">Select</option>
                      {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button className="dd-rx-del" onClick={() => removeMedicine(i)} disabled={medicines.length === 1}>
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
              <button className="dd-add-med-btn" onClick={addMedicine}>
                <PlusIcon /> Add Medicine
              </button>
            </div>

            {/* Block 3: Advice & Follow-up */}
            <div className="dd-pad-block">
              <div className="dd-block-title">3. Advice &amp; Follow-Up</div>
              <textarea
                className="dd-textarea"
                placeholder="Advice… e.g. Avoid cold drinks, steam inhalation twice a day"
                rows={2}
                value={advice}
                onChange={e => setAdvice(e.target.value)}
              />
              <div className="dd-followup-row">
                <label className="dd-followup-label">Follow-Up:</label>
                <select className="dd-rx-select" value={followUp} onChange={e => setFollowUp(e.target.value)}>
                  <option value="">No follow-up</option>
                  {FOLLOW_UP_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {followUp === 'Custom Date' && (
                  <input type="date" className="dd-input dd-date-input" value={customFollowUp} onChange={e => setCustomFollowUp(e.target.value)} />
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="dd-pad-footer">
              <button className="dd-submit-btn" onClick={handleSubmitAndNext} disabled={saving}>
                {saving ? 'Saving…' : '✓ Submit Prescription & Call Next'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Past Records Drawer */}
      {showHistory && historyPatient && (
        <PatientDetailModal
          patient={{
            ...historyPatient,
            name: historyPatient.patientName,
            userId: historyPatient.patientId,
            age: historyPatient.patientAge,
            gender: historyPatient.patientGender,
            phone: historyPatient.patientPhone,
          }}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
};

// ── Sub-view: Profile ────────────────────────────────────────────────────────
const ProfileField = ({ label, value }) => (
  <div className="dp-field">
    <span className="dp-field-label">{label}</span>
    <span className="dp-field-value">{value || '—'}</span>
  </div>
);

const ProfileSection = ({ title, children }) => (
  <div className="dp-section">
    <h3 className="dp-section-title">{title}</h3>
    <div className="dp-fields-grid">{children}</div>
  </div>
);

const ProfileView = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.id) { setError('User not found.'); setLoading(false); return; }
    fetch(`http://localhost:5001/api/doctor/profile/${userData.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setProfile(data.profile);
        else setError('Could not load profile.');
      })
      .catch(() => setError('Could not connect to server.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="dp-loading"><div className="dp-spinner" /><p>Loading profile…</p></div>
  );
  if (error) return (
    <div className="dp-error">{error}</div>
  );

  const p = profile;
  const initials = `${p.firstName?.[0] || ''}${p.lastName?.[0] || ''}`.toUpperCase();
  const avatarSrc = p.profilePhoto ? `http://localhost:5001/${p.profilePhoto}` : null;

  return (
    <div className="dp-content">
      <div className="dp-two-col">

        {/* ── Left column: photo + signature ── */}
        <div className="dp-left-col">
          <div className="dp-photo-card">
            {avatarSrc
              ? <img src={avatarSrc} alt="Profile" className="dp-avatar-sq-img" />
              : <div className="dp-avatar-sq-initials">{initials}</div>
            }
          </div>

          {p.signature && (
            <div className="dp-section dp-sig-card">
              <h3 className="dp-section-title">Digital Signature</h3>
              <div className="dp-signature-wrap">
                <img src={p.signature} alt="Digital Signature" className="dp-signature-img" />
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: personal + professional ── */}
        <div className="dp-right-col">
          <div className="dp-section">
            <h3 className="dp-section-title">Personal Information</h3>
            <div className="dp-fields-grid">
              <ProfileField label="First Name" value={p.firstName} />
              <ProfileField label="Last Name" value={p.lastName} />
              <ProfileField label="Email" value={p.email} />
              <ProfileField label="Phone" value={p.phone} />
            </div>
          </div>

          <div className="dp-section">
            <h3 className="dp-section-title">Professional Information</h3>
            <div className="dp-fields-grid">
              <ProfileField label="Specialization" value={p.specialization} />
              <ProfileField label="NMC Number" value={p.nmcNumber} />
              <ProfileField label="Qualification" value={p.qualification} />
              <ProfileField label="Experience" value={p.experienceYears != null ? `${p.experienceYears} years` : null} />
              <ProfileField label="Consultation Fee" value={p.consultationFee != null ? `NPR ${p.consultationFee}` : null} />
              <ProfileField label="Currently Practice At" value={Array.isArray(p.currentHospital) ? p.currentHospital.join(', ') : (p.currentHospital || null)} />
            </div>
          </div>

          {p.bio && (
            <div className="dp-section">
              <h3 className="dp-section-title">Bio</h3>
              <p className="dp-bio">{p.bio}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// ── Main Dashboard Shell ──────────────────────────────────────────────────────
const VIEWS = [
  { id: 'queue',    label: 'Live Queue',      Icon: QueueIcon },
  { id: 'schedule', label: 'My Schedule',     Icon: CalIcon },
  { id: 'settings', label: 'Settings',        Icon: SettingsIcon },
  { id: 'profile',  label: 'My Profile',      Icon: null },
];

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('queue');
  const [doctor, setDoctor] = useState({ name: 'Doctor', specialty: '', id: null, initials: 'DR' });
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (!userData.id) { navigate('/doctor-auth'); return; }

    const initials = `${userData.firstName?.[0] || ''}${userData.lastName?.[0] || ''}`.toUpperCase();
    setDoctor({ name: `Dr. ${userData.firstName || ''} ${userData.lastName || ''}`.trim(), specialty: '', id: userData.id, initials });

    // Fetch profile + today count
    Promise.all([
      fetch(`http://localhost:5001/api/doctor/profile/${userData.id}`).then(r => r.json()),
      fetch(`http://localhost:5001/api/appointments/doctor/${userData.id}`).then(r => r.json()),
    ]).then(([profile, apts]) => {
      if (profile.success) {
        setDoctor(d => ({ ...d, specialty: profile.profile.specialization || '' }));
      }
      if (apts.success) {
        const t = today();
        const n = (apts.appointments || []).filter(a => {
          const d = new Date(a.appointmentDate); d.setHours(0,0,0,0);
          return d.getTime() === t.getTime() && a.status !== 'cancelled';
        }).length;
        setTodayCount(n);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [navigate]);

  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  const handleChangePwd = async () => {
    setPwdError(''); setPwdSuccess('');
    if (!pwdForm.current || !pwdForm.next || !pwdForm.confirm) {
      setPwdError('All fields are required.'); return;
    }
    if (pwdForm.next.length < 6) {
      setPwdError('New password must be at least 6 characters.'); return;
    }
    if (pwdForm.next !== pwdForm.confirm) {
      setPwdError('New passwords do not match.'); return;
    }
    setPwdSaving(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch('http://localhost:5001/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id, currentPassword: pwdForm.current, newPassword: pwdForm.next }),
      });
      const data = await res.json();
      if (data.success) {
        setPwdSuccess('Password changed successfully.');
        setPwdForm({ current: '', next: '', confirm: '' });
        setTimeout(() => { setShowChangePwd(false); setPwdSuccess(''); }, 2000);
      } else {
        setPwdError(data.error || 'Failed to change password.');
      }
    } catch {
      setPwdError('Could not connect to server.');
    } finally {
      setPwdSaving(false);
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="dd-shell">
      {/* ── Top header bar ── */}
      <header className="dd-header">
        <div className="dd-header-logo" onClick={() => setActiveView('queue')} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="HealthMandala" className="dd-header-logo-img" />
          <span className="dd-header-logo-text">HealthMandala</span>
        </div>

        {/* Profile dropdown */}
        <div className="dd-header-profile" ref={dropdownRef}>
          <button
            className="dd-profile-trigger"
            onClick={() => setDropdownOpen(o => !o)}
          >
            <div className="dd-profile-avatar">{doctor.initials}</div>
            <div className="dd-profile-info">
              <span className="dd-profile-name">{loading ? '…' : doctor.name}</span>
              <span className="dd-profile-spec">{doctor.specialty || 'Doctor'}</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="dd-profile-dropdown">
              <button className="dd-dropdown-item" onClick={() => { setActiveView('schedule'); setDropdownOpen(false); }}>
                <CalIcon />
                <span>Schedule</span>
              </button>
              <button className="dd-dropdown-item" onClick={() => { setActiveView('profile'); setDropdownOpen(false); }}>
                <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                <span>Profile</span>
              </button>
              <button className="dd-dropdown-item" onClick={() => { setShowChangePwd(true); setPwdError(''); setPwdSuccess(''); setDropdownOpen(false); }}>
                <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <span>Change Password</span>
              </button>
              <div className="dd-dropdown-divider" />
              <button className="dd-dropdown-item dd-dropdown-logout" onClick={handleLogout}>
                <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="dd-main">
        {/* Top bar */}
        <div className="dd-topbar">
          <div className="dd-topbar-title">
            {VIEWS.find(v => v.id === activeView)?.label}
          </div>
          <div className="dd-topbar-right">
            <div className="dd-today-badge">
              <ClockIcon />
              <span>{todayCount} patient{todayCount !== 1 ? 's' : ''} today</span>
            </div>
            <div className="dd-topbar-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* View content */}
        <div className="dd-view-content">
          {activeView === 'queue' && (
            <LiveQueue doctorId={doctor.id} doctorName={doctor.name} />
          )}
          {activeView === 'schedule' && (
            <div className="dd-embedded-view">
              <DoctorSchedule embedded />
            </div>
          )}
          {activeView === 'profile' && (
            <ProfileView />
          )}
          {activeView === 'settings' && (
            <div className="dd-settings-view">
              <div className="dd-settings-card">
                <h2>Account</h2>
                <div className="dd-settings-actions">
                  <button className="dd-settings-action-btn" onClick={() => setActiveView('profile')}>
                    <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" size={18} />
                    <span>View Profile</span>
                    <Icon d="M9 18l6-6-6-6" size={16} />
                  </button>
                  <button className="dd-settings-action-btn" onClick={() => { setShowChangePwd(true); setPwdError(''); setPwdSuccess(''); }}>
                    <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" size={18} />
                    <span>Change Password</span>
                    <Icon d="M9 18l6-6-6-6" size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="hd-footer">© {new Date().getFullYear()} HealthMandala. All rights reserved.</div>
      </main>
      {showChangePwd && (
        <div className="dd-modal-overlay" onClick={() => setShowChangePwd(false)}>
          <div className="dd-modal" onClick={e => e.stopPropagation()}>
            <div className="dd-modal-header">
              <h3>Change Password</h3>
              <button className="dd-modal-close" onClick={() => setShowChangePwd(false)}>✕</button>
            </div>
            {pwdError && <div className="dd-modal-error">{pwdError}</div>}
            {pwdSuccess && <div className="dd-modal-success">{pwdSuccess}</div>}
            <div className="dd-modal-body">
              <div className="dd-modal-field">
                <label>Current Password</label>
                <input type="password" placeholder="Enter current password" value={pwdForm.current} onChange={e => setPwdForm({ ...pwdForm, current: e.target.value })} />
              </div>
              <div className="dd-modal-field">
                <label>New Password</label>
                <input type="password" placeholder="At least 6 characters" value={pwdForm.next} onChange={e => setPwdForm({ ...pwdForm, next: e.target.value })} />
              </div>
              <div className="dd-modal-field">
                <label>Confirm New Password</label>
                <input type="password" placeholder="Repeat new password" value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} />
              </div>
            </div>
            <div className="dd-modal-footer">
              <button className="dd-modal-cancel" onClick={() => setShowChangePwd(false)}>Cancel</button>
              <button className="dd-modal-save" onClick={handleChangePwd} disabled={pwdSaving}>
                {pwdSaving ? 'Saving…' : 'Update Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <LogoutModal
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
        />
      )}
    </div>
  );
};

export default DoctorDashboard;