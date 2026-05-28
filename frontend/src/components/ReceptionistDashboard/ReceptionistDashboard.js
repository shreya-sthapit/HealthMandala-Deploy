import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../HospitalDashboard/HospitalDashboard.css';
import '../Booking/Booking.css';
import '../Doctors/SelectDoctor.css';
import LogoutModal from '../Profile/LogoutModal';

const API = 'http://localhost:5001/api';
const ALLOWED = ['receptionist', 'staff', 'hospital_admin', 'admin'];

// ── Week helpers ──────────────────────────────────────────────────────────────
const toYMD = (d) => d.toISOString().split('T')[0];

const getWeekDays = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7)); // Mon of this week
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
};

const TODAY = toYMD(new Date());

const fmt12h = (t) => {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return t;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

/* ── Icons ── */
const DashIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const QueueIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const WalkIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><path d="M12 7l-2 5h4l-2 5"/><path d="M10 12l-2 5"/><path d="M14 12l2 5"/></svg>;
const CalIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const PatIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const UserIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const LogoutIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

const NAV = [
  { section: 'Appointments' },
  { id: 'queue',        label: "Today's Queue",    icon: <QueueIcon /> },
  { id: 'walkin',       label: 'Walk-in Entry',    icon: <WalkIcon /> },
  { id: 'appointments', label: 'All Appointments', icon: <CalIcon /> },
  { section: 'Patients' },
  { id: 'patients',     label: 'Patient Registry', icon: <PatIcon /> },
];

const STATUS_LABEL = {
  pending: 'Booked', confirmed: 'Booked', checked_in: 'Checked In',
  prescribed: 'Prescribed', completed: 'Completed',
  cancelled: 'Cancelled', 'no-show': 'No Show',
};
const STATUS_CSS = {
  pending: 'hd-badge-pending', confirmed: 'hd-badge-pending',
  checked_in: 'hd-badge-confirmed', prescribed: 'hd-badge-confirmed',
  completed: 'hd-badge-completed', cancelled: 'hd-badge-cancelled', 'no-show': 'hd-badge-cancelled',
};
function statusBadge(s) {
  return <span className={`hd-badge ${STATUS_CSS[s] || 'hd-badge-pending'}`}>{STATUS_LABEL[s] || s}</span>;
}

/* ── Overview ── */
function OverviewView({ appointments, loading, onStatusUpdate }) {
  const today = appointments.filter(a => (a.appointmentDate || '').startsWith(TODAY));
  const stats = [
    { label: "Today's Total",   value: today.length,                                                                         color: 'teal',   icon: '📋' },
    { label: 'Not Yet Arrived', value: today.filter(a => a.status === 'pending' || a.status === 'confirmed').length,        color: 'orange', icon: '⏳' },
    { label: 'Checked In',      value: today.filter(a => a.status === 'checked_in').length,                                 color: 'green',  icon: '✅' },
    { label: 'Completed',       value: today.filter(a => a.status === 'completed' || a.status === 'prescribed').length,     color: 'blue',   icon: '🏁' },
  ];
  return (
    <>
      <div className="hd-stats-grid">
        {stats.map(s => (
          <div className="hd-stat-card" key={s.label}>
            <div className={`hd-stat-icon ${s.color}`}>{s.icon}</div>
            <div><div className="hd-stat-value">{s.value}</div><div className="hd-stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>
      <div className="hd-card">
        <div className="hd-card-header"><h3>Today's Appointments — sorted by token</h3></div>
        <div className="hd-table-wrap">
          {loading ? <div className="hd-loading">Loading…</div>
          : today.length === 0 ? <div className="hd-empty"><div className="hd-empty-icon">📅</div><p>No appointments today</p></div>
          : (
            <table className="hd-table">
              <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {[...today].sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0)).map(a => (
                  <tr key={a._id}>
                    <td><div className="hd-token">{a.tokenNumber || '—'}</div></td>
                    <td>{a.patientName || '—'}</td>
                    <td>{a.doctorName || '—'}</td>
                    <td>{fmt12h(a.appointmentTime)}</td>
                    <td>{statusBadge(a.status)}</td>
                    <td>
                      {(a.status === 'pending' || a.status === 'confirmed') && (
                        <button className="hd-btn hd-btn-primary hd-btn-sm" onClick={() => onStatusUpdate(a._id, 'checked_in')}>
                          Check-In Patient
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Queue (today only, doctor filter, new button styles) ── */
function QueueView({ appointments, loading, onStatusUpdate }) {
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');

  // Only today's appointments
  const todayApts = appointments
    .filter(a => (a.appointmentDate || '').startsWith(TODAY))
    .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

  // Build doctor list from today's appointments (on-duty = has appt today)
  const todayDoctors = [...new Map(
    todayApts
      .filter(a => a.doctorName)
      .map(a => [a.doctorName, { name: a.doctorName, specialty: a.doctorSpecialization || '' }])
  ).values()];

  // Apply filters
  const filtered = todayApts.filter(a => {
    const matchSearch = !search.trim() || (a.patientName || '').toLowerCase().includes(search.toLowerCase());
    const matchDoctor = !doctorFilter || a.doctorName === doctorFilter;
    return matchSearch && matchDoctor;
  });

  const btnBase = 'padding: 0.45rem 1.1rem; border-radius: 999px; font-weight: 700; font-size: 0.82rem; cursor: pointer; border: none; transition: box-shadow 0.2s, filter 0.2s;';

  return (
    <div className="hd-card">

      <div className="hd-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.75rem' }}>
        <h3>Appointment Queue</h3>
        {/* Filters row */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
          {/* Doctor dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={doctorFilter}
              onChange={e => setDoctorFilter(e.target.value)}
              style={{ padding: '0.5rem 2.25rem 0.5rem 0.85rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.85rem', color: '#1a2e35', background: 'white', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', minWidth: '220px', height: '38px' }}
            >
              <option value="">All Doctors</option>
              {todayDoctors.map(d => (
                <option key={d.name} value={d.name}>
                  {d.specialty ? `${d.specialty} - ${d.name}` : d.name}
                </option>
              ))}
            </select>
            <svg style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {/* Search */}
          <input
            className="hd-search"
            placeholder="Search patient name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 260 }}
          />
        </div>
      </div>

      <div className="hd-table-wrap">
        {loading
          ? <div className="hd-loading">Loading…</div>
          : filtered.length === 0
            ? <div className="hd-empty"><div className="hd-empty-icon">🏥</div><p>No appointments for today</p></div>
            : (
              <table className="hd-table">
                <thead>
                  <tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a._id}>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#1a2e35' }}>
                          {a.tokenNumber || '—'}
                        </span>
                      </td>
                      <td>
                        <strong>{a.patientName || '—'}</strong><br />
                        <span style={{ fontSize: '0.75rem', color: '#718096' }}>{a.patientPhone || ''}</span>
                      </td>
                      <td>{a.doctorName || '—'}</td>
                      <td>{fmt12h(a.appointmentTime)}</td>
                      <td>{statusBadge(a.status)}</td>
                      <td style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {(a.status === 'pending' || a.status === 'confirmed') && (
                          <>
                            <button className="q-btn-primary" onClick={() => onStatusUpdate(a._id, 'checked_in')}>
                              Check-In Patient
                            </button>
                            <button className="q-btn-danger" onClick={() => onStatusUpdate(a._id, 'no-show')}>
                              No Show
                            </button>
                          </>
                        )}
                        {a.status === 'checked_in' && (
                          <button className="q-btn-complete" onClick={() => onStatusUpdate(a._id, 'completed')}>
                            Consultation Completed
                          </button>
                        )}
                        {a.status === 'prescribed' && (
                          <span className="hd-badge hd-badge-confirmed">With Pharmacist</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        }
      </div>
    </div>
  );
}
/* ── Walk-in (multi-step) ── */
const DEPT_ICONS_REC = {
  'Cardiologist (Heart Specialist)': '🫀',
  'Dermatologist (Skin & Hair Specialist)': '🧴',
  'Endocrinologist (Diabetes & Hormone Specialist)': '🩸',
  'General Physician (Internal Medicine & Fever)': '🩺',
  'General Practitioner (Family Doctor)': '👨‍⚕️',
  'General Surgeon (General Operations)': '🔪',
  "Gynecologist & Obstetrician (Women's Health & Pregnancy)": '🌸',
  'Neurologist (Brain & Nerve Specialist)': '🧠',
  'Neurosurgeon (Brain & Spine Surgeon)': '🧬',
  'Oncologist (Cancer Specialist)': '🎗️',
  'Ophthalmologist (Eye Specialist)': '👁️',
  'Orthopedic Surgeon (Bone & Joint Specialist)': '🦴',
  'Otolaryngologist (ENT - Ear, Nose & Throat Specialist)': '👂',
  'Pediatrician (Child & Newborn Specialist)': '👶',
  'Physiotherapist (Physical Rehab Specialist)': '🏃',
  'Psychiatrist (Mental Health & Counseling Specialist)': '🧘',
  'Pulmonologist (Chest & Lung Specialist)': '🫁',
  'Radiologist (X-Ray & Ultrasound Specialist)': '🔬',
  'Urologist (Urinary & Kidney Stone Specialist)': '💧',
  'Dental Surgeon (Teeth & Oral Specialist)': '🦷',
  'Ayurveda Physician (Traditional Medicine Specialist)': '🌿',
};

function WalkinView({ onRefresh }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const hospitalName = user.hospitalName || '';

  // Steps: 1=department, 2=doctor, 3=slot, 4=patient form
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 — departments
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deptSearch, setDeptSearch] = useState('');

  // Step 2 — doctors
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorSpecFilter, setDoctorSpecFilter] = useState('');
  const [bookedSlotsMap, setBookedSlotsMap] = useState({});

  // Step 3 — date + slots
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Step 4 — patient form
  const [patientForm, setPatientForm] = useState({
    name: '', age: '', dob: '', gender: '', phone: '', address: '',
  });

  // Fetch departments on mount
  useEffect(() => {
    if (!hospitalName) return;
    setLoadingDepts(true);
    fetch(`${API}/hospital-dashboard/departments/public/${encodeURIComponent(hospitalName)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setDepartments(d.departments || []); })
      .catch(() => {})
      .finally(() => setLoadingDepts(false));
  }, [hospitalName]);

  // Fetch all approved doctors when dept selected
  useEffect(() => {
    if (!selectedDept) return;
    setLoadingDoctors(true);
    fetch(`${API}/doctor/approved`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.doctors) {
          const deptDoctorIds = (selectedDept.doctors || []).map(doc =>
            String(doc._id || doc.id || doc)
          );
          // Always filter strictly to department doctors — never show all
          const filtered = deptDoctorIds.length > 0
            ? d.doctors.filter(doc => deptDoctorIds.includes(String(doc.id || doc._id)))
            : [];
          setDoctors(filtered);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDoctors(false));
  }, [selectedDept]);

  // Fetch slots when doctor or date changes
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) { setSlots([]); return; }
    setLoadingSlots(true);
    setSelectedSlot(null);
    const docHospital = Array.isArray(selectedDoctor.hospital)
      ? selectedDoctor.hospital[0]
      : (selectedDoctor.hospital || hospitalName);
    const doctorId = selectedDoctor._id || selectedDoctor.id;
    fetch(`${API}/doctor/slots/${doctorId}?date=${selectedDate}&hospitalName=${encodeURIComponent(docHospital)}`)
      .then(r => r.json())
      .then(d => { if (d.success) setSlots(d.slots || []); })
      .catch(() => {})
      .finally(() => setLoadingSlots(false));
  }, [selectedDoctor, selectedDate, hospitalName]);

  const getTimeSlots = (doc, date) => {
    const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
    let start = doc.availableTimeStart || '09:00';
    let end = doc.availableTimeEnd || '17:00';
    let breakStart = null; let breakEnd = null; let hasBreak = false;
    let daySchedule = null;
    if (doc.hospitalSchedules?.length > 0) {
      const hs = doc.hospitalSchedules[0];
      if (hs.schedule) daySchedule = hs.schedule.find(s => s.day === dayName && s.active);
    }
    if (!daySchedule && doc.schedule) daySchedule = doc.schedule.find(s => s.day === dayName && s.active);
    if (daySchedule) {
      start = daySchedule.start; end = daySchedule.end;
      if (daySchedule.hasBreak && daySchedule.breakStart && daySchedule.breakEnd) {
        hasBreak = true; breakStart = daySchedule.breakStart; breakEnd = daySchedule.breakEnd;
      }
    }
    const toMin = t => { const [h,m] = t.split(':').map(Number); return h*60+m; };
    const toStr = m => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
    const startMin = toMin(start), endMin = toMin(end);
    const bsMin = hasBreak ? toMin(breakStart) : null, beMin = hasBreak ? toMin(breakEnd) : null;
    const interval = doc.consultationDuration || 10;
    const result = [];
    for (let m = startMin; m < endMin; m += interval) {
      if (hasBreak && m >= bsMin && m < beMin) continue;
      result.push(toStr(m));
    }
    return result;
  };

  const fetchCardBookedSlots = async (doctorId, dateStr, hosp) => {
    const key = `${doctorId}_${dateStr}`;
    if (bookedSlotsMap[key] !== undefined) return;
    try {
      const res = await fetch(`${API}/doctor/slots/${doctorId}?date=${dateStr}&hospitalName=${encodeURIComponent(hosp || '')}`);
      const data = await res.json();
      if (data.success && data.slots) {
        const booked = new Set(data.slots.filter(s => s.isBooked).map(s => s.time));
        setBookedSlotsMap(prev => ({ ...prev, [key]: booked }));
      }
    } catch { /* silent */ }
  };

  const isCardSlotBooked = (doctorId, dateStr, slotTime) => {
    return bookedSlotsMap[`${doctorId}_${dateStr}`]?.has(slotTime) ?? false;
  };

  const getNextDates = (doc) => {
    const days = getAvailableDays(doc);
    if (!days.length) return [];
    const FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const results = [];
    for (let i = 0; i < 14 && results.length < 3; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      if (days.includes(FULL[d.getDay()])) results.push(d);
    }
    return results;
  };

  const getNextAvailableTime = (doc) => {
    const dates = getNextDates(doc);
    if (!dates.length) return null;
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const todayStr = new Date().toISOString().split('T')[0];
    const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    const docId = doc.id || doc._id;
    const hosp = Array.isArray(doc.hospital) ? doc.hospital[0] : (doc.hospital || '');
    for (const date of dates) {
      const slots = getTimeSlots(doc, date);
      const dateIso = date.toISOString().split('T')[0];
      const isToday = dateIso === todayStr;
      const bookedSet = bookedSlotsMap[`${docId}_${dateIso}`];
      for (const slot of slots) {
        if (isToday) { const [h,m] = slot.split(':').map(Number); if (h*60+m <= nowMin) continue; }
        if (bookedSet?.has(slot)) continue;
        const [h,m] = slot.split(':').map(Number);
        const period = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `${MONTHS[date.getMonth()]} ${date.getDate()} at ${h12}:${String(m).padStart(2,'0')} ${period}`;
      }
    }
    return null;
  };

  const formatTime12h = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const handleBookSlot = (doc, date, time) => {
    const photoPath = doc.profilePhoto?.replace(/\\/g, '/').replace(/^backend\//, '') || null;
    setSelectedDoctor({ ...doc, profilePhoto: photoPath });
    setSelectedDate(date.toISOString().split('T')[0]);
    setSelectedSlot(time);
    setStep(4);
  };

  const handleSelectDept = (dept) => {
    setSelectedDept(dept);
    setSelectedDoctor(null);
    setDoctors([]);
    setSlots([]);
    setSelectedSlot(null);
    setMsg(null);
    setStep(2);
  };

  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setSlots([]);
    setSelectedSlot(null);
    setMsg(null);
    setStep(3);
  };

  const handleSelectSlot = (slot) => {
    if (slot.isBooked) return;
    setSelectedSlot(slot.time);
    setMsg(null);
    setStep(4);
  };

  const handleCollectPayment = async () => {
    if (!patientForm.name.trim() || !patientForm.phone.trim()) {
      setMsg({ type: 'error', text: 'Patient name and phone are required.' });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      const doctorId = selectedDoctor._id || selectedDoctor.id;
      // Count existing appointments for this doctor on this date to get token
      const [yr, mo, dy] = selectedDate.split('-').map(Number);
      const aptDateUTC = new Date(Date.UTC(yr, mo - 1, dy));
      // Use the slot index as token number
      const slotIndex = slots.findIndex(s => s.time === selectedSlot);
      const tokenNumber = slotIndex !== -1 ? slotIndex + 1 : 1;

      const res = await fetch(`${API}/appointments/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          patientName: patientForm.name,
          patientPhone: patientForm.phone,
          patientAge: patientForm.age ? Number(patientForm.age) : undefined,
          patientDOB: patientForm.dob || undefined,
          patientGender: patientForm.gender || undefined,
          patientAddress: patientForm.address || undefined,
          doctorId,
          doctorName: selectedDoctor.name,
          doctorSpecialization: selectedDoctor.specialty,
          hospital: hospitalName,
          appointmentDate: selectedDate,
          appointmentTime: selectedSlot,
          tokenNumber,
          appointmentType: 'consultation',
          paymentMethod: 'cash',
          paymentStatus: 'paid',
          status: 'confirmed',
        }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        setMsg({ type: 'success', text: `Walk-in booked! Token #${tokenNumber} — ${selectedSlot} with ${selectedDoctor.name}.` });
        // Reset all state
        setStep(1);
        setSelectedDept(null);
        setSelectedDoctor(null);
        setSlots([]);
        setSelectedSlot(null);
        setSelectedDate(TODAY);
        setPatientForm({ name: '', age: '', dob: '', gender: '', phone: '', address: '' });
        onRefresh();
      } else {
        setMsg({ type: 'error', text: data.error || data.message || 'Failed to book appointment.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const fmt12 = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  };

  // Build 7 dates starting from today (today + 6 days ahead)
  const getWeekDates = () => {
    const today = new Date(); today.setHours(0,0,0,0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d;
    });
  };

  // Format a local Date to YYYY-MM-DD without UTC conversion
  const toLocalYMD = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getAvailableDays = (doc) => {
    if (doc?.hospitalSchedules?.length > 0) {
      const hs = doc.hospitalSchedules[0];
      if (hs.schedule?.length > 0) return hs.schedule.filter(s => s.active).map(s => s.day);
    }
    return doc?.schedule?.filter(s => s.active).map(s => s.day) || doc?.availableDays || [];
  };

  return (
    <div style={{ width: '100%' }}>
      {/* ── Stepper ── */}
      <div style={{ display: 'flex', alignItems: 'center', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
        {[
          { n: 1, desc: 'Select Department' },
          { n: 2, desc: 'Select the doctor' },
          { n: 3, desc: 'Select Appointment time' },
          { n: 4, desc: 'Patient Details' },
        ].map(({ n, desc }, i, arr) => (
          <>
            <div key={n} className={`stepper-step${step === n ? ' active' : ''}`}>
              <div className="step-label">
                <div className="step-title">STEP {n}</div>
                <div className="step-desc">{desc}</div>
              </div>
            </div>
            {i < arr.length - 1 && <div key={`line-${n}`} style={{ flex: 1, height: 2, background: '#e2e8f0', margin: '0 1rem' }} />}
          </>
        ))}
      </div>

      {/* Global message */}
      {msg && (
        <div className={`hd-notif-item${msg.type === 'error' ? ' error' : ''}`} style={{ marginBottom: '1rem' }}>
          <span className="hd-notif-text">{msg.text}</span>
          {msg.type === 'success' && (
            <button className="hd-btn hd-btn-primary hd-btn-sm" style={{ marginLeft: '1rem' }} onClick={() => setMsg(null)}>
              New Walk-in
            </button>
          )}
        </div>
      )}

      {/* ── STEP 1: Department ── */}
      {step === 1 && (
        <div className="booking-main">
          {/* Header + search — exact match of UI 2 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#065f46', fontWeight: 700, margin: 0, flexShrink: 0 }}>
              Departments available at <strong>{hospitalName}</strong>
            </h2>
            <div style={{ position: 'relative', width: '260px', flexShrink: 0 }}>
              <svg style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#a0aec0' }}
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by name..."
                value={deptSearch}
                onChange={e => setDeptSearch(e.target.value)}
                style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.75rem', border: '1.5px solid #dce3ef', borderRadius: '999px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', color: '#4a5568', background: '#ffffff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              />
            </div>
          </div>
          <div className="department-selection">
            {loadingDepts ? (
              <div className="loading-state"><div className="loading-spinner" /><p>Loading departments…</p></div>
            ) : departments.length === 0 ? (
              <div className="no-departments"><p>No departments found for this hospital.</p></div>
            ) : (
              <div className="department-grid">
                {departments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase())).length > 0
                  ? departments.filter(d => d.name.toLowerCase().includes(deptSearch.toLowerCase())).map(dept => {
                      const icon = DEPT_ICONS_REC[dept.name] || '🏥';
                      const match = dept.name.match(/^([^(]+)\s*(\(.*\))?$/);
                      const main = match?.[1]?.trim() || dept.name;
                      const sub = match?.[2]?.trim();
                      return (
                        <div key={dept._id} className="department-card-new" style={{ cursor: 'pointer' }} onClick={() => handleSelectDept(dept)}>
                          <div className="dept-icon-container"><div className="dept-icon">{icon}</div></div>
                          <h3 className="dept-name">{main}</h3>
                          {sub && <p className="dept-subtitle">{sub}</p>}
                        </div>
                      );
                    })
                  : <div className="no-departments" style={{ gridColumn: '1 / -1' }}><p>No departments match "<strong>{deptSearch}</strong>".</p></div>
                }
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 2: Doctor (full doctor-row UI matching patient side) ── */}
      {step === 2 && (
        <>
          {/* Filter bar — same padding as stepper so they align */}
          <div className="filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1.25rem 1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', margin: '0 0 2rem 0', gap: '1rem', width: '100%', boxSizing: 'border-box' }}>
            <div className="filter-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => { setStep(1); setSelectedDept(null); setDoctors([]); }}>← Back</button>
              <label style={{ fontWeight: 600, color: '#1a2e35', whiteSpace: 'nowrap', fontSize: '0.95rem' }}>Department:</label>
              <select
                value={selectedDept?._id || ''}
                onChange={e => {
                  const dept = departments.find(d => d._id === e.target.value);
                  if (dept) handleSelectDept(dept);
                }}
                style={{ padding: '0.6rem 2.5rem 0.6rem 1rem', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', color: '#1a2e35', background: 'white', minWidth: '220px', height: '44px' }}>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="filter-right">
              <div className="search-box">
                <svg className="search-icon-left" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Search by name..." value={doctorSearch} onChange={e => setDoctorSearch(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Doctor list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
            {loadingDoctors ? (
              <div className="loading-state"><div className="loading-spinner" /><p>Loading doctors…</p></div>
            ) : (() => {
              const displayed = doctors.filter(doc =>
                (!doctorSearch || doc.name.toLowerCase().includes(doctorSearch.toLowerCase()))
              );
              if (displayed.length === 0) return <div className="empty-state"><p>No doctors found for this department.</p></div>;
              return displayed.map(doc => {
                const photoPath = doc.profilePhoto?.replace(/\\/g, '/').replace(/^backend\//, '');
                const dates = getNextDates(doc);
                const nextAvailable = getNextAvailableTime(doc);
                const docId = doc.id || doc._id;
                const hosp = Array.isArray(doc.hospital) ? doc.hospital[0] : (doc.hospital || hospitalName);
                return (
                  <div key={docId} style={{ background: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', overflow: 'hidden', padding: '1.5rem', gap: '1.5rem' }}>
                    {/* Left: photo + details */}
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.25rem', minWidth: '340px', flexShrink: 0 }}>
                      <div style={{ width: '160px', height: '160px', borderRadius: '16px', overflow: 'hidden', flexShrink: 0, background: 'var(--primary-color, #00a896)' }}>
                        {photoPath
                          ? <img src={`http://localhost:5001/${photoPath}`} alt={doc.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          : null}
                        <div style={{ display: photoPath ? 'none' : 'flex', width: '100%', height: '100%', background: 'linear-gradient(135deg,#00c9b1,#0284c7)', color: 'white', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', fontWeight: 700 }}>
                          {doc.name.split(' ')[1]?.[0] || 'D'}
                        </div>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1a2e35', marginBottom: '0.6rem' }}>{doc.name}</h3>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.35rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-color,#00a896)', flexShrink: 0 }} />{doc.specialty}
                        </p>
                        {doc.experience && <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.35rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-color,#00a896)', flexShrink: 0 }} />Experience: {doc.experience}
                        </p>}
                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#10b981', fontWeight: 500, marginBottom: '0.75rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                          Next Available: {nextAvailable || 'Contact clinic directly'}
                        </p>
                      </div>
                    </div>
                    {/* Right: schedule */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {dates.length === 0 ? (
                        <div style={{ color: '#94a3b8', fontSize: '0.9rem', padding: '1rem 0' }}>No availability set.</div>
                      ) : (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '80px 180px 1fr', gap: '1.5rem', fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', paddingBottom: '0.4rem', borderBottom: '1px solid #e2e8f0', marginBottom: '0.2rem' }}>
                            <span>Date</span><span>Dr. Available Time</span><span>Available Slots</span>
                          </div>
                          {dates.map((date, di) => {
                            const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][date.getDay()];
                            let daySchedule = null;
                            if (doc.hospitalSchedules?.length > 0) daySchedule = doc.hospitalSchedules[0].schedule?.find(s => s.day === dayName && s.active);
                            if (!daySchedule && doc.schedule) daySchedule = doc.schedule.find(s => s.day === dayName && s.active);
                            const timeRange = daySchedule
                              ? `${formatTime12h(daySchedule.start)} - ${formatTime12h(daySchedule.end)}`
                              : `${formatTime12h(doc.availableTimeStart || '09:00')} - ${formatTime12h(doc.availableTimeEnd || '17:00')}`;
                            const slotList = getTimeSlots(doc, date);
                            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            const dateIso = date.toISOString().split('T')[0];
                            fetchCardBookedSlots(docId, dateIso, hosp);
                            const todayIso = new Date().toISOString().split('T')[0];
                            const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
                            const isToday = dateIso === todayIso;
                            const displaySlots = slotList.slice(0, 3).map(s => {
                              const isBooked = isCardSlotBooked(docId, dateIso, s);
                              const isPast = isToday && (() => { const [h,m] = s.split(':').map(Number); return h*60+m <= nowMin; })();
                              return { slot: s, disabled: isBooked || isPast };
                            });
                            const remaining = slotList.slice(3).filter(s => {
                              if (isCardSlotBooked(docId, dateIso, s)) return false;
                              if (isToday) { const [h,m] = s.split(':').map(Number); if (h*60+m <= nowMin) return false; }
                              return true;
                            }).length;
                            return (
                              <div key={di} style={{ display: 'grid', gridTemplateColumns: '80px 160px 1fr', gap: '1rem', alignItems: 'center', padding: '0.4rem 0', borderBottom: di < dates.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 700 }}>{dateStr}</span>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{timeRange}</span>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'nowrap', alignItems: 'center' }}>
                                  {displaySlots.map(({ slot: st, disabled }) => (
                                    <button key={st} disabled={disabled} onClick={() => !disabled && handleBookSlot(doc, date, st)}
                                      style={{ padding: '0.6rem 0', width: '90px', background: disabled ? '#f1f5f9' : '#f8f9fa', color: disabled ? '#b0bec5' : '#475569', border: '2px solid transparent', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, whiteSpace: 'nowrap' }}>
                                      {formatTime12h(st)}
                                    </button>
                                  ))}
                                  {remaining > 0 && <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '0.25rem', flexShrink: 0, whiteSpace: 'nowrap' }}>+{remaining} more</span>}
                                </div>
                              </div>
                            );
                          })}
                          <button onClick={() => { setSelectedDoctor(doc); setSelectedDate(TODAY); setStep(3); }}
                            style={{ marginTop: '0.5rem', padding: '0.5rem 1.5rem', background: 'var(--primary-color,#00a896)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', width: '100%' }}>
                            Check Other Schedule Time to take appointment →
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </>
      )}

      {/* ── STEP 3: Date + Slot ── */}
      {step === 3 && (
        <>
          <div className="booking-page-header" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => { setStep(2); setSelectedDoctor(null); }}>← Back</button>
              <h2>Book Appointment With {selectedDoctor?.name}</h2>
            </div>
          </div>
          <div className="booking-content-wrapper">
            {/* Left: doctor info panel */}
            <div className="doctor-details-panel">
              <div className="doctor-profile">
                <div className="doctor-avatar-circle">
                  {selectedDoctor?.profilePhoto
                    ? <img src={`http://localhost:5001/${selectedDoctor.profilePhoto.replace(/\\/g, '/').replace(/^backend\//, '')}`} alt={selectedDoctor.name} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                    : null}
                  <div className="avatar-circle-fallback" style={{ display: selectedDoctor?.profilePhoto ? 'none' : 'flex' }}>
                    {selectedDoctor?.name?.split(' ').find(w => w !== 'Dr.')?.[0] || 'D'}
                  </div>
                </div>
                <div className="doctor-info">
                  <h3>{selectedDoctor?.name}</h3>
                  <p className="specialty">{selectedDoctor?.specialty}</p>
                </div>
              </div>
              <div className="doctor-details-list">
                {selectedDoctor?.experience && <div className="detail-item"><span className="label">Experience</span><span className="value">{selectedDoctor.experience}</span></div>}
                {selectedDoctor?.nmcNumber && <div className="detail-item"><span className="label">NMC Number</span><span className="value">{selectedDoctor.nmcNumber}</span></div>}
                {selectedDoctor?.qualification && <div className="detail-item"><span className="label">Qualification</span><span className="value">{selectedDoctor.qualification}</span></div>}
                <div className="detail-item"><span className="label">Consultation Fee</span><span className="value fee-value">Rs. {selectedDoctor?.fee || 0}</span></div>
              </div>
            </div>
            {/* Right: date + slots */}
            <div className="slots-selection-panel">
              <div className="selection-section">
                <h3>Select Date</h3>
                <div className="week-calendar">
                  {getWeekDates().map((date, i) => {
                    const DAY_NAMES = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
                    const FULL_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                    const dateStr = toLocalYMD(date);
                    const isSelected = selectedDate === dateStr;
                    const isPast = date < new Date(new Date().setHours(0,0,0,0));
                    const availDays = getAvailableDays(selectedDoctor);
                    const isAvail = availDays.includes(FULL_DAYS[date.getDay()]) && !isPast;
                    return (
                      <div
                        key={i}
                        className={`date-box${isSelected ? ' selected' : ''}${!isAvail ? ' disabled' : ''}`}
                        onClick={() => !isPast && setSelectedDate(dateStr)}
                      >
                        <span className="date-day">{DAY_NAMES[date.getDay()]}</span>
                        <span className="date-num">{date.getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="selection-section">
                <h3>Select Time</h3>
                {loadingSlots ? (
                  <div className="loading-state"><div className="spinner" /><p>Loading available times…</p></div>
                ) : slots.length === 0 ? (
                  <div className="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e0" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <p>Doctor not available on this date</p>
                  </div>
                ) : (() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
                  const isToday = selectedDate === todayStr;
                  const morning = [], afternoon = [], evening = [];
                  slots.forEach((s, idx) => {
                    const [h, m] = s.time.split(':').map(Number);
                    const isPast = isToday && h * 60 + m <= nowMin;
                    const entry = { time: s.time, isBooked: s.isBooked, isPast, idx };
                    if (h >= 5 && h < 12) morning.push(entry);
                    else if (h >= 12 && h < 17) afternoon.push(entry);
                    else evening.push(entry);
                  });
                  const renderGroup = (label, group) => group.length === 0 ? null : (
                    <div className="time-slot-group" key={label}>
                      <h4 className="time-group-heading">{label}</h4>
                      <div className="time-slots">
                        {group.map(({ time, isBooked, isPast, idx }) => (
                          <button
                            key={time}
                            type="button"
                            className={`time-slot${selectedSlot === time ? ' selected' : ''}${isBooked || isPast ? ' booked' : ''}`}
                            disabled={isBooked || isPast}
                            onClick={() => { if (!isBooked && !isPast) { setSelectedSlot(time); setStep(4); } }}
                          >
                            {fmt12(time)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                  return <div className="time-slots-grouped">{renderGroup('Morning', morning)}{renderGroup('Afternoon', afternoon)}{renderGroup('Evening', evening)}</div>;
                })()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 4: Patient Details ── */}
      {step === 4 && (
        <div className="step4-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => { setStep(3); setSelectedSlot(null); }}>← Back</button>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#1a2e35' }}>Patient Details</h2>
          </div>
          <div className="step4-layout">
            {/* Left: doctor + booking summary */}
            <div className="step4-left">
              <div className="step4-doctor-card">
                <div className="step4-doctor-header">
                  <div className="step4-doctor-avatar">
                    {selectedDoctor?.profilePhoto
                      ? <img src={`http://localhost:5001/${selectedDoctor.profilePhoto.replace(/\\/g, '/').replace(/^backend\//, '')}`} alt={selectedDoctor.name} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                      : null}
                    <div className="step4-avatar-fallback" style={{ display: selectedDoctor?.profilePhoto ? 'none' : 'flex' }}>
                      {selectedDoctor?.name?.split(' ').find(w => w !== 'Dr.')?.[0] || 'D'}
                    </div>
                  </div>
                  <div className="step4-doctor-info">
                    <h3>{selectedDoctor?.name}</h3>
                    <p className="step4-specialty">{selectedDoctor?.specialty}</p>
                    {selectedDoctor?.experience && <p className="step4-detail">Experience: {selectedDoctor.experience}</p>}
                    {selectedDoctor?.nmcNumber && <p className="step4-detail">NMC: {selectedDoctor.nmcNumber}</p>}
                    {selectedDoctor?.qualification && <p className="step4-detail">Qualification: {selectedDoctor.qualification}</p>}
                  </div>
                </div>
                <p className="step4-hospital">Department: {selectedDept?.name}</p>
              </div>
              <div className="step4-booking-grid">
                <div className="step4-grid-item">
                  <div className="step4-grid-label">Date</div>
                  <div className="step4-grid-value">{selectedDate}</div>
                </div>
                <div className="step4-grid-item">
                  <div className="step4-grid-label">Consultation Time</div>
                  <div className="step4-grid-value">{fmt12(selectedSlot)}</div>
                </div>
                <div className="step4-grid-item">
                  <div className="step4-grid-label">Consultation Fee</div>
                  <div className="step4-grid-value">Rs. {selectedDoctor?.fee || 0}</div>
                </div>
                <div className="step4-grid-item">
                  <div className="step4-grid-label">Token No.</div>
                  <div className="step4-grid-value">#{slots.findIndex(s => s.time === selectedSlot) + 1}</div>
                </div>
              </div>
            </div>
            {/* Right: patient form */}
            <div className="step4-right">
              <div className="step4-dependent-section">
                <div className="step4-dependent-header">
                  <div><h2>Patient Information</h2><p>Fill in the walk-in patient's details</p></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '0.4rem' }}>Full Name *</label>
                      <input className="step4-search-input" style={{ width: '100%' }} required value={patientForm.name} onChange={e => setPatientForm(f => ({ ...f, name: e.target.value }))} placeholder="Patient full name" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '0.4rem' }}>Age</label>
                      <input className="step4-search-input" style={{ width: '100%' }} type="number" min="0" max="150" value={patientForm.age} onChange={e => setPatientForm(f => ({ ...f, age: e.target.value }))} placeholder="Age" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '0.4rem' }}>Date of Birth</label>
                      <input className="step4-search-input" style={{ width: '100%' }} type="date" value={patientForm.dob} onChange={e => setPatientForm(f => ({ ...f, dob: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '0.4rem' }}>Gender</label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <select style={{ width: '100%', padding: '0.75rem 2.5rem 0.75rem 1rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', background: 'white', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }} value={patientForm.gender} onChange={e => setPatientForm(f => ({ ...f, gender: e.target.value }))}>
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <svg style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '0.4rem' }}>Mobile Number *</label>
                    <input className="step4-search-input" style={{ width: '100%' }} required value={patientForm.phone} onChange={e => setPatientForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone number" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: '0.4rem' }}>Address</label>
                    <input className="step4-search-input" style={{ width: '100%' }} value={patientForm.address} onChange={e => setPatientForm(f => ({ ...f, address: e.target.value }))} placeholder="Patient address" />
                  </div>
                  <button
                    className="book-btn"
                    disabled={submitting}
                    onClick={handleCollectPayment}
                    style={{ marginTop: '0.5rem' }}
                  >
                    {submitting ? 'Processing…' : '💳 Collect Payment & Confirm Appointment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── All Appointments ── */
function AppointmentsView({ appointments, loading }) {
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = appointments.filter(a => {
    const dateOk = !dateFilter || (a.appointmentDate || '').startsWith(dateFilter);
    const statusOk = !statusFilter || a.status === statusFilter;
    return dateOk && statusOk;
  });

  return (
    <>
      <div className="hd-card">
        <div className="hd-card-header"><h3>All Appointments</h3></div>
        <div className="hd-card-body" style={{ paddingBottom: 0 }}>
          <div className="hd-filter-bar">
            <input type="date" className="hd-search" style={{ flex: '0 0 auto', width: 'auto' }} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            <select className="hd-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="confirmed">Booked (Paid)</option>
              <option value="checked_in">Checked In</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
            {(dateFilter || statusFilter) && (
              <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => { setDateFilter(''); setStatusFilter(''); }}>Clear</button>
            )}
          </div>
        </div>
        <div className="hd-table-wrap">
          {loading ? (
            <div className="hd-loading">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="hd-empty"><div className="hd-empty-icon">📋</div><p>No appointments found</p></div>
          ) : (
            <table className="hd-table">
              <thead>
                <tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a._id}>
                    <td><div className="hd-token">{a.tokenNumber || '—'}</div></td>
                    <td>{a.patientName || a.patient?.name || '—'}</td>
                    <td>{a.doctorName || a.doctor?.name || '—'}</td>
                    <td>{a.appointmentDate ? a.appointmentDate.split('T')[0] : '—'}</td>
                    <td>{fmt12h(a.appointmentTime)}</td>
                    <td>{statusBadge(a.status)}</td>
                    <td><button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => setSelected(a)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <div className="hd-modal-overlay" onClick={() => setSelected(null)}>
          <div className="hd-modal" onClick={e => e.stopPropagation()}>
            <div className="hd-modal-header">
              <h3>Appointment Details</h3>
              <button className="hd-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="hd-modal-body">
              {[
                ['Token',   selected.tokenNumber || '—'],
                ['Patient', selected.patientName || selected.patient?.name || '—'],
                ['Doctor',  selected.doctorName  || selected.doctor?.name  || '—'],
                ['Date',    selected.appointmentDate ? selected.appointmentDate.split('T')[0] : '—'],
                ['Time',    fmt12h(selected.appointmentTime)],
                ['Status',  selected.status],
                ['Payment', selected.paymentStatus || '—'],
                ['Reason',  selected.reason || selected.notes || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f0fafa', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--hd-muted)', fontWeight: 600 }}>{k}</span>
                  <span style={{ color: 'var(--hd-text)' }}>{k === 'Status' ? statusBadge(v) : v}</span>
                </div>
              ))}
            </div>
            <div className="hd-modal-footer">
              <button className="hd-btn hd-btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Patients ── */
function PatientsView({ appointments, loading }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const patients = Object.values(
    appointments.reduce((acc, a) => {
      const name = a.patientName || a.patient?.name || 'Unknown';
      if (!acc[name]) acc[name] = { name, count: 0, last: a, all: [] };
      acc[name].count++;
      acc[name].all.push(a);
      if (new Date(a.appointmentDate) > new Date(acc[name].last.appointmentDate)) acc[name].last = a;
      return acc;
    }, {})
  ).filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const handleView = async (p) => {
    setSelected(p);
    setProfile(null);
    const patientId = p.last.patientId?._id || p.last.patientId;
    if (!patientId) return;
    setLoadingProfile(true);
    try {
      const res = await fetch(`${API}/patient/profile/${patientId}`);
      const data = await res.json();
      console.log('Patient profile response:', data);
      console.log('Profile address:', data?.profile?.address);
      if (data.success && data.profile) setProfile(data.profile);
    } catch (e) {
      console.error('Profile fetch error:', e);
    }
    finally { setLoadingProfile(false); }
  };

  return (
    <>
      <div className="hd-card">
        <div className="hd-card-header"><h3>Patient Registry</h3></div>
        <div className="hd-card-body" style={{ paddingBottom: 0 }}>
          <div className="hd-filter-bar">
            <input className="hd-search" placeholder="Search by patient name…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="hd-table-wrap">
          {loading ? (
            <div className="hd-loading">Loading…</div>
          ) : patients.length === 0 ? (
            <div className="hd-empty"><div className="hd-empty-icon">👥</div><p>No patients found</p></div>
          ) : (
            <table className="hd-table">
              <thead>
                <tr><th>Patient Name</th><th>Total Visits</th><th>Last Doctor</th><th>Last Date</th><th>Last Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.name}>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.count}</td>
                    <td>{p.last.doctorName || p.last.doctor?.name || '—'}</td>
                    <td>{p.last.appointmentDate ? p.last.appointmentDate.split('T')[0] : '—'}</td>
                    <td>{statusBadge(p.last.status)}</td>
                    <td>
                      <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => handleView(p)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Patient detail modal */}
      {selected && (
        <div className="hd-modal-overlay" onClick={() => setSelected(null)}>
          <div className="hd-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="hd-modal-header">
              <h3>Patient Details — {selected.name}</h3>
              <button className="hd-modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="hd-modal-body">
              {loadingProfile && <div className="hd-loading" style={{ padding: '1rem 0' }}>Loading profile…</div>}
              {(() => {
                const apt = selected.last;
                // Calculate age from DOB
                const dob = profile?.dateOfBirth || apt.patientDOB;
                const dobDisplay = dob ? new Date(dob).toLocaleDateString() : 'N/A';
                const calcAge = (() => {
                  if (!dob) return profile?.age || apt.patientAge || 'N/A';
                  const today = new Date();
                  const birth = new Date(dob);
                  let age = today.getFullYear() - birth.getFullYear();
                  const m = today.getMonth() - birth.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
                  return age;
                })();
                const gender = profile?.gender || apt.patientGender || 'N/A';
                // phone: PatientRegistration.phone may be empty; fall back to populated User.phone
                const rawPhone = profile?.phone?.trim() || profile?.userId?.phone?.trim() || apt.patientPhone?.trim();
                const phone = rawPhone || 'N/A';
                // address is a nested object on PatientRegistration
                const address = (() => {
                  if (!profile) return apt.patientAddress?.trim() || 'N/A';
                  const a = profile.address;
                  console.log('Address object:', a, typeof a);
                  if (!a || typeof a !== 'object') return apt.patientAddress?.trim() || 'N/A';
                  const { street, city, district, province } = a;
                  console.log('Address parts:', { street, city, district, province });
                  const parts = [street, city, district, province].filter(v => typeof v === 'string' && v.trim() !== '');
                  return parts.length > 0 ? parts.join(', ') : (apt.patientAddress?.trim() || 'N/A');
                })();
                return [
                  ['Name',          selected.name],
                  ['Age',           calcAge],
                  ['Date of Birth', dobDisplay],
                  ['Gender',        gender],
                  ['Mobile Number', phone],
                  ['Address',       address],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f0fafa', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--hd-muted)', fontWeight: 600 }}>{k}</span>
                    <span style={{ color: 'var(--hd-text)' }}>{String(v)}</span>
                  </div>
                ));
              })()}
              {/* Visit history */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#2d3748', marginBottom: '0.5rem' }}>Visit History</div>
                <table className="hd-table" style={{ fontSize: '0.8rem' }}>
                  <thead><tr><th>Date</th><th>Doctor</th><th>Time</th><th>Status</th></tr></thead>
                  <tbody>
                    {[...selected.all].sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)).map(a => (
                      <tr key={a._id}>
                        <td>{a.appointmentDate ? a.appointmentDate.split('T')[0] : '—'}</td>
                        <td>{a.doctorName || '—'}</td>
                        <td>{fmt12h(a.appointmentTime)}</td>
                        <td>{statusBadge(a.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="hd-modal-footer">
              <button className="hd-btn hd-btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Main Dashboard ── */
export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState('queue');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'RC';

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    if (!token || !ALLOWED.includes(role)) {
      navigate('/hospital/login');
    }
  }, [navigate]);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      // Build query params — filter by hospital if available
      const params = new URLSearchParams();
      if (user.hospitalId) params.set('hospitalId', user.hospitalId);
      else if (user.hospitalName) params.set('hospital', user.hospitalName);

      const res = await fetch(`${API}/appointments/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();
      if (data.success) setAppointments(data.appointments || []);
    } catch { /* graceful */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await fetch(`${API}/appointments/status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ status }),
      });
      fetchAppointments();
    } catch { /* graceful */ }
  };

  const handleLogout = () => setShowLogout(true);
  const confirmLogout = () => { localStorage.clear(); navigate('/hospital/login'); };
  const tabLabel = NAV.find(n => n.id === activeTab)?.label || 'Dashboard';

  const renderView = () => {
    const props = { appointments, loading, onStatusUpdate: handleStatusUpdate, onRefresh: fetchAppointments };
    switch (activeTab) {
      case 'queue':        return <QueueView {...props} />;
      case 'walkin':       return <WalkinView onRefresh={fetchAppointments} />;
      case 'appointments': return <AppointmentsView {...props} />;
      case 'patients':     return <PatientsView {...props} />;
      default:             return <QueueView {...props} />;
    }
  };

  return (
    <div className="hospital-dashboard">
      <style>{`
        .q-btn-primary {
          padding: 0.45rem 1.1rem;
          border-radius: 999px;
          border: none;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          background: linear-gradient(135deg, #00c9b1, #00a896);
          color: #fff;
          box-shadow: 0 2px 8px rgba(0,168,150,0.25);
          transition: box-shadow 0.2s, filter 0.2s;
        }
        .q-btn-primary:hover {
          box-shadow: 0 4px 18px rgba(0,168,150,0.55);
          filter: brightness(1.05);
        }
        .q-btn-danger {
          padding: 0.45rem 1.1rem;
          border-radius: 999px;
          border: 1.5px solid #fca5a5;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          background: #fff;
          color: #ef4444;
          box-shadow: none;
          transition: box-shadow 0.2s;
        }
        .q-btn-danger:hover {
          box-shadow: 0 2px 10px rgba(239,68,68,0.25);
        }
        .q-btn-complete {
          padding: 0.45rem 1.1rem;
          border-radius: 999px;
          border: 1.5px solid #a7f3d0;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          background: #f0fdf9;
          color: #059669;
          box-shadow: none;
          transition: box-shadow 0.2s;
        }
        .q-btn-complete:hover {
          box-shadow: 0 2px 10px rgba(5,150,105,0.25);
        }
      `}</style>
      <aside className="hd-sidebar">
        <div className="hd-sidebar-header">
          {user.hospitalName && (
            <div className="hd-hospital-name" style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: '0.35rem', letterSpacing: '0.01em' }}>{user.hospitalName}</div>
          )}
          <div className="hd-hospital-badge">Receptionist Portal</div>
        </div>
        <nav className="hd-nav">
          {NAV.map((item, i) =>
            item.section ? (
              <div key={i} className="hd-nav-section">{item.section}</div>
            ) : (
              <button
                key={item.id}
                className={`hd-nav-item${activeTab === item.id ? ' active' : ''}`}
                style={activeTab === item.id ? { background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, borderRadius: 10, width: '100%', marginRight: 0 } : {}}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="hd-nav-icon">{item.icon}</span>
                {item.label}
              </button>
            )
          )}
        </nav>
        <div className="hd-sidebar-footer">
          <div className="hd-admin-info">
            <div className="hd-admin-avatar">{initials}</div>
            <div>
              <div className="hd-admin-name">{user.firstName} {user.lastName}</div>
              <div className="hd-admin-role">{user.email || 'Receptionist'}</div>
            </div>
          </div>
          <button className="hd-logout-btn" onClick={handleLogout}><LogoutIcon /> Log Out</button>
        </div>
      </aside>

      <main className="hd-main">
        <div className="hd-topbar">
          <div className="hd-topbar-title">
            <h2>{tabLabel}</h2>
            <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="hd-topbar-actions">
            {activeTab !== 'walkin' && (
              <button className="q-btn-primary" style={{ fontSize: '0.9rem', padding: '0.55rem 1.25rem' }} onClick={() => setActiveTab('walkin')}>
                + Walk-in
              </button>
            )}
          </div>
        </div>

        {renderView()}

        <div className="hd-footer">© {new Date().getFullYear()} HealthMandala. All rights reserved.</div>
      </main>

      {showLogout && (
        <LogoutModal
          onCancel={() => setShowLogout(false)}
          onConfirm={confirmLogout}
        />
      )}
    </div>
  );
}
