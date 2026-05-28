import { useState, useEffect, useCallback } from 'react';

const STATUSES = [
  { value: 'all',          label: 'All Status' },
  { value: 'pending',      label: 'Pending' },
  { value: 'checked-in',   label: 'Checked-In' },
  { value: 'rescheduled',  label: 'Rescheduled' },
  { value: 'cancelled',    label: 'Cancelled' },
];

const PrinterSVG = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>);
const CheckSVG = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);

export default function HDAppointments({ userId, hospital, API, defaultView = 'appointments' }) {
  const resolveView = (dv) => dv === 'walkin' ? 'walkin' : dv === 'calendar' ? 'calendar' : 'list';
  const [view, setView] = useState(resolveView(defaultView));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [showWalkIn, setShowWalkIn] = useState(defaultView === 'walkin');
  const [doctors, setDoctors] = useState([]);
  const [walkIn, setWalkIn] = useState({ patientName: '', patientPhone: '', doctorId: '', doctorName: '', appointmentDate: '', appointmentTime: '', reasonForVisit: '', consultationFee: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const v = resolveView(defaultView);
    setView(v);
    setShowWalkIn(v === 'walkin');
  }, [defaultView]);

  const fetchAppointments = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      let url = `${API}/appointments?userId=${userId}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (dateFilter) url += `&date=${dateFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setAppointments(data.appointments);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [userId, statusFilter, dateFilter, search, API]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API}/doctors?userId=${userId}`).then(r => r.json()).then(d => { if (d.success) setDoctors(d.doctors); }).catch(() => {});
  }, [userId, API]);

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API}/appointments/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, userId }) });
      fetchAppointments();
    } catch (e) { console.error(e); }
  };

  const submitWalkIn = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API}/appointments/walk-in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...walkIn, userId }) });
      const data = await res.json();
      if (data.success) {
        alert(`Walk-in booked! Token #${data.appointment.tokenNumber}`);
        setWalkIn({ patientName: '', patientPhone: '', doctorId: '', doctorName: '', appointmentDate: '', appointmentTime: '', reasonForVisit: '', consultationFee: '' });
        setShowWalkIn(false);
        fetchAppointments();
      } else { alert(data.error || 'Failed to book'); }
    } catch (e) { alert('Error booking walk-in'); }
    finally { setSaving(false); }
  };

  const printToken = (apt) => {
    const w = window.open('', '_blank', 'width=400,height=500');
    w.document.write(`<html><head><title>Token #${apt.tokenNumber}</title><style>body{font-family:sans-serif;text-align:center;padding:2rem}.token{font-size:4rem;font-weight:900;color:#00a896;border:4px solid #00a896;border-radius:50%;width:120px;height:120px;display:flex;align-items:center;justify-content:center;margin:1rem auto}h2{color:#1a202c}p{color:#718096;margin:0.3rem 0}</style></head><body><h2>${hospital?.hospitalName || 'Hospital'}</h2><div class="token">${apt.tokenNumber}</div><h3>${apt.patientName}</h3><p>Doctor: ${apt.doctorName}</p><p>Date: ${new Date(apt.appointmentDate).toLocaleDateString()}</p><p>Time: ${apt.appointmentTime || 'As per queue'}</p><p style="margin-top:1rem;font-size:0.8rem">Please arrive 15 minutes early</p><script>window.print()</script></body></html>`);
  };

  const statusBadge = s => ({
    pending: 'pending', confirmed: 'confirmed', checked_in: 'confirmed',
    prescribed: 'confirmed', completed: 'completed',
    cancelled: 'cancelled', 'no-show': 'cancelled'
  }[s] || 'pending');

  const calendarDays = {};
  appointments.forEach(a => {
    const d = new Date(a.appointmentDate).toDateString();
    if (!calendarDays[d]) calendarDays[d] = [];
    calendarDays[d].push(a);
  });

  return (
    <div>
      {(view === 'walkin' || showWalkIn) && (
        <div className="hd-card" style={{ marginBottom: '1.25rem' }}>
          <div className="hd-card-body">
            <form onSubmit={submitWalkIn}>
              <div className="hd-form-row">
                <div className="hd-form-group"><label>Patient Name *</label><input required value={walkIn.patientName} onChange={e => setWalkIn(p => ({ ...p, patientName: e.target.value }))} placeholder="Full name" /></div>
                <div className="hd-form-group"><label>Phone Number</label><input value={walkIn.patientPhone} onChange={e => setWalkIn(p => ({ ...p, patientPhone: e.target.value }))} placeholder="98XXXXXXXX" /></div>
              </div>
              <div className="hd-form-row">
                <div className="hd-form-group">
                  <label>Doctor *</label>
                  <select required value={walkIn.doctorId} onChange={e => { const d = doctors.find(x => x._id === e.target.value); setWalkIn(p => ({ ...p, doctorId: e.target.value, doctorName: d ? `Dr. ${d.firstName} ${d.lastName}` : '', consultationFee: d?.consultationFee || '' })); }}>
                    <option value="">Select doctor</option>
                    {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName} — {d.specialization}</option>)}
                  </select>
                </div>
                <div className="hd-form-group"><label>Consultation Fee (NPR)</label><input type="number" value={walkIn.consultationFee} onChange={e => setWalkIn(p => ({ ...p, consultationFee: e.target.value }))} placeholder="500" /></div>
              </div>
              <div className="hd-form-row">
                <div className="hd-form-group"><label>Date *</label><input required type="date" value={walkIn.appointmentDate} onChange={e => setWalkIn(p => ({ ...p, appointmentDate: e.target.value }))} /></div>
                <div className="hd-form-group"><label>Time</label><input type="time" value={walkIn.appointmentTime} onChange={e => setWalkIn(p => ({ ...p, appointmentTime: e.target.value }))} /></div>
              </div>
              <div className="hd-form-group"><label>Reason for Visit *</label><input required value={walkIn.reasonForVisit} onChange={e => setWalkIn(p => ({ ...p, reasonForVisit: e.target.value }))} placeholder="Chief complaint" /></div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="hd-btn hd-btn-secondary" onClick={() => { setShowWalkIn(false); setView('list'); }}>Cancel</button>
                <button type="submit" className="hd-btn hd-btn-primary" disabled={saving}>{saving ? 'Booking...' : 'Book & Print Token'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {view === 'calendar' && (
        <div className="hd-card">
          <div className="hd-card-header"><h3>Appointment Calendar</h3></div>
          <div className="hd-card-body">
            {Object.keys(calendarDays).length === 0 ? (
              <div className="hd-empty"><p>No appointments found</p></div>
            ) : Object.entries(calendarDays).sort().map(([day, apts]) => (
              <div key={day} style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 700, color: '#2d3748', marginBottom: '0.5rem', fontSize: '0.9rem' }}>{day}</div>
                {apts.map(a => (
                  <div key={a._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', background: '#f7fafc', borderRadius: '8px', marginBottom: '0.4rem' }}>
                    <span className="hd-token">#{a.tokenNumber}</span>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.patientName}</div><div style={{ fontSize: '0.75rem', color: '#718096' }}>{a.doctorName} · {a.appointmentTime || 'TBD'}</div></div>
                    <span className={`hd-badge hd-badge-${statusBadge(a.status)}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="hd-card">
          <div className="hd-card-body" style={{ paddingBottom: 0 }}>
            <div className="hd-filter-bar">
              <input className="hd-search" placeholder="Search patient or doctor..." value={search} onChange={e => setSearch(e.target.value)} />
              <select className="hd-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <input className="hd-select" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
              {dateFilter && <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => setDateFilter('')}>× Clear</button>}
            </div>
          </div>
          <div className="hd-table-wrap">
            {loading ? <div className="hd-loading">Loading...</div> : appointments.length === 0 ? (
              <div className="hd-empty"><p>No appointments found</p></div>
            ) : (
              <table className="hd-table">
                <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a._id}>
                      <td><span className="hd-token">#{a.tokenNumber}</span></td>
                      <td><div style={{ fontWeight: 600 }}>{a.patientName}</div><div style={{ fontSize: '0.75rem', color: '#718096' }}>{a.patientPhone}</div></td>
                      <td><div style={{ fontSize: '0.85rem' }}>{a.doctorName}</div><div style={{ fontSize: '0.72rem', color: '#718096' }}>{a.doctorSpecialization}</div></td>
                      <td style={{ fontSize: '0.82rem' }}>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                      <td style={{ fontSize: '0.82rem' }}>{a.appointmentTime || '—'}</td>
                      <td><span className={`hd-badge hd-badge-${statusBadge(a.status)}`}>{a.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {(a.status === 'pending' || a.status === 'confirmed') && <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => updateStatus(a._id, 'completed')}><CheckSVG /> Done</button>}
                          {a.status !== 'cancelled' && a.status !== 'completed' && <button className="hd-btn hd-btn-danger hd-btn-sm" onClick={() => updateStatus(a._id, 'cancelled')}>×</button>}
                          <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => printToken(a)}><PrinterSVG /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
