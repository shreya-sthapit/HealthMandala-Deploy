import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DoctorSchedule.css';

const to12h = (time24) => {
  if (!time24) return { hour: '9', minute: '00', period: 'AM' };
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return { hour: String(hour), minute: String(m).padStart(2, '0'), period };
};

const to24h = (hour, minute, period) => {
  let h = parseInt(hour);
  if (period === 'AM' && h === 12) h = 0;
  if (period === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${minute}`;
};

// Format a 24h time string to readable 12h display
const formatTime = (time24) => {
  if (!time24) return '—';
  const { hour, minute, period } = to12h(time24);
  return `${hour}:${minute} ${period}`;
};

const HOURS = ['1','2','3','4','5','6','7','8','9','10','11','12'];
const MINUTES = ['00','15','30','45'];

const DEFAULT_SCHEDULE = () => [
  { day: 'Monday',    start: '09:00', end: '17:00', active: true  },
  { day: 'Tuesday',   start: '09:00', end: '17:00', active: true  },
  { day: 'Wednesday', start: '09:00', end: '17:00', active: true  },
  { day: 'Thursday',  start: '09:00', end: '17:00', active: true  },
  { day: 'Friday',    start: '09:00', end: '17:00', active: true  },
  { day: 'Saturday',  start: '09:00', end: '17:00', active: true  },
  { day: 'Sunday',    start: '09:00', end: '17:00', active: false }
];

const TimePicker = ({ value, onChange }) => {
  const parsed = to12h(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [period, setPeriod] = useState(parsed.period);

  useEffect(() => {
    const p = to12h(value);
    setHour(p.hour); setMinute(p.minute); setPeriod(p.period);
  }, [value]);

  const emit = (h, m, p) => onChange(to24h(h, m, p));

  return (
    <div className="time-picker">
      <select value={hour} onChange={e => { setHour(e.target.value); emit(e.target.value, minute, period); }}>
        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
      </select>
      <span className="time-colon">:</span>
      <select value={minute} onChange={e => { setMinute(e.target.value); emit(hour, e.target.value, period); }}>
        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <div className="period-toggle">
        <button type="button" className={period === 'AM' ? 'active' : ''} onClick={() => { setPeriod('AM'); emit(hour, minute, 'AM'); }}>AM</button>
        <button type="button" className={period === 'PM' ? 'active' : ''} onClick={() => { setPeriod('PM'); emit(hour, minute, 'PM'); }}>PM</button>
      </div>
    </div>
  );
};

const DoctorSchedule = ({ embedded = false }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [activeHospital, setActiveHospital] = useState('');
  const [hospitalSchedules, setHospitalSchedules] = useState({});
  const [consultationFee, setConsultationFee] = useState(1500);
  const [leaves, setLeaves] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [newLeave, setNewLeave] = useState({ startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUserId(userData.id);
    if (userData.id) fetchDoctorSchedule(userData.id);
  }, []);

  const fetchDoctorSchedule = async (uid) => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5001/api/doctor/profile/${uid}`);
      const data = await res.json();
      if (data.success && data.profile) {
        const profile = data.profile;
        const hospitalList = Array.isArray(profile.currentHospital) && profile.currentHospital.length > 0
          ? profile.currentHospital
          : ['General'];
        setHospitals(hospitalList);
        setActiveHospital(hospitalList[0]);
        if (profile.consultationFee) setConsultationFee(profile.consultationFee);
        if (profile.leaves) setLeaves(profile.leaves);

        // Build per-hospital schedule map
        const map = {};
        hospitalList.forEach(h => {
          // Prefer per-hospital saved schedule
          const saved = profile.hospitalSchedules?.find(hs => hs.hospital === h);

          // lunchBreak: per-hospital → top-level → null (no hardcoded default)
          const lunchBreak = saved?.lunchBreak?.start
            ? saved.lunchBreak
            : (profile.lunchBreak?.start ? profile.lunchBreak : null);

          // consultationDuration: top-level is the authoritative value (set by hospital admin)
          // hospitalSchedules[].consultationDuration can be stale — ignore it
          const consultationDuration =
            (profile.consultationDuration != null && profile.consultationDuration !== 0)
              ? profile.consultationDuration
              : null;

          map[h] = {
            schedule: saved?.schedule?.length > 0 ? saved.schedule : DEFAULT_SCHEDULE(),
            lunchBreak,
            consultationDuration,
            maxPatientsPerDay: saved?.maxPatientsPerDay || profile.maxPatientsPerDay || null,
          };
        });
        setHospitalSchedules(map);
      }
    } catch (err) {
      setMessage('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const current = hospitalSchedules[activeHospital] || {
    schedule: DEFAULT_SCHEDULE(),
    lunchBreak: null,
    consultationDuration: null,
    maxPatientsPerDay: null,
  };

  const updateCurrent = (patch) => {
    setHospitalSchedules(prev => ({
      ...prev,
      [activeHospital]: { ...prev[activeHospital], ...patch }
    }));
  };

  const toggleDay = (index) => {
    const s = [...current.schedule];
    s[index] = { ...s[index], active: !s[index].active };
    updateCurrent({ schedule: s });
  };

  const updateTime = (index, field, value) => {
    const s = [...current.schedule];
    s[index] = { ...s[index], [field]: value };
    updateCurrent({ schedule: s });
  };

  const handleSaveSchedule = async () => {
    if (!userId) { setMessage('User not found. Please login again.'); return; }
    try {
      setSaving(true); setMessage('');
      const res = await fetch(`http://localhost:5001/api/doctor/schedule/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hospital: activeHospital,
          schedule: current.schedule,
          lunchBreak: current.lunchBreak,
          consultationDuration: current.consultationDuration,
          consultationFee,
          maxPatientsPerDay: current.maxPatientsPerDay,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Schedule saved for ${activeHospital}!`);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.error || 'Failed to save schedule');
      }
    } catch {
      setMessage('Failed to save schedule. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLeave = async () => {
    if (!newLeave.startDate || !newLeave.endDate || !newLeave.reason) {
      alert('Please fill all leave details'); return;
    }
    try {
      const res = await fetch(`http://localhost:5001/api/doctor/leave/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave),
      });
      const data = await res.json();
      if (data.success) {
        setLeaves(data.leaves);
        setShowLeaveModal(false);
        setNewLeave({ startDate: '', endDate: '', reason: '' });
        setMessage('Leave added successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else alert(data.error || 'Failed to add leave');
    } catch { alert('Failed to add leave.'); }
  };

  const handleRemoveLeave = async (leaveId) => {
    if (!window.confirm('Remove this leave?')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/doctor/leave/${userId}/${leaveId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setLeaves(data.leaves);
        setMessage('Leave removed!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch { alert('Failed to remove leave.'); }
  };

  if (loading) return (
    <div className="doctor-schedule">
      <div className="schedule-content"><div className="loading-state">Loading schedule...</div></div>
    </div>
  );

  return (
    <div className="doctor-schedule">
      <div className="schedule-content">
        {!embedded && (
          <div className="page-header">
            <Link to="/doctor-dashboard" className="back-btn">← Back to Dashboard</Link>
            <h1>My Schedule</h1>
          </div>
        )}

        {/* Hospital tabs */}
        {hospitals.length > 1 && (
          <div className="schedule-meta-row">
            <div className="hospital-tabs">
              {hospitals.map(h => (
                <button
                  key={h}
                  className={`hospital-tab ${activeHospital === h ? 'active' : ''}`}
                  onClick={() => setActiveHospital(h)}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="duration-info">
              <span className="duration-label">Duration per patient:</span>
              <span className="duration-value">
                {current.consultationDuration != null ? `${current.consultationDuration} min` : '—'}
              </span>
            </div>
          </div>
        )}

        {/* Duration per patient - aligned with hospital info */}
        <div className="schedule-meta-row">
            <div className="hospital-single-label">
              <span>🏥 {activeHospital}</span>
            </div>
            <div className="duration-info">
              <span className="duration-label">Duration per patient:</span>
              <span className="duration-value">
                {current.consultationDuration != null ? `${current.consultationDuration} min` : '—'}
              </span>
            </div>
          </div>

        {message && (
          <div className={`message ${message.includes('success') || message.includes('saved') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Full width working hours table */}
        <div className="schedule-card schedule-full-width">
          <h2>Working Hours</h2>
          <div className="hours-table">
            <div className="hours-table-header">
              <div className="col-day">Day</div>
              <div className="col-schedule">Schedule</div>
              <div className="col-break">Break Time</div>
            </div>
            {current.schedule.map((item) => (
              <div key={item.day} className="hours-table-row">
                <div className="col-day">
                  <span className="day-name">{item.day}</span>
                </div>
                <div className="col-schedule">
                  {item.active ? (
                    <div className="schedule-time-range">
                      <span className="schedule-time-display">{formatTime(item.start)}</span>
                      <span className="to-label">to</span>
                      <span className="schedule-time-display">{formatTime(item.end)}</span>
                    </div>
                  ) : (
                    <span className="off-label">Off</span>
                  )}
                </div>
                <div className="col-break">
                  {item.active ? (
                    <div className="break-time-range">
                      {item.hasBreak && item.breakStart && item.breakEnd ? (
                        // Per-day break stored on the schedule entry itself
                        <span className="schedule-break-display">
                          {formatTime(item.breakStart)} - {formatTime(item.breakEnd)}
                        </span>
                      ) : current.lunchBreak?.start && current.lunchBreak?.end ? (
                        // Fall back to the global lunch break for this hospital
                        <span className="schedule-break-display">
                          {formatTime(current.lunchBreak.start)} - {formatTime(current.lunchBreak.end)}
                        </span>
                      ) : (
                        <span className="break-off">—</span>
                      )}
                    </div>
                  ) : (
                    <span className="break-off">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Leave</h2>
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={newLeave.startDate} onChange={e => setNewLeave({ ...newLeave, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={newLeave.endDate} onChange={e => setNewLeave({ ...newLeave, endDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Reason</label>
              <input type="text" placeholder="e.g., Vacation, Conference" value={newLeave.reason} onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowLeaveModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleAddLeave}>Add Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorSchedule;
