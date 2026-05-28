import { useState, useEffect } from 'react';
import API_BASE_URL from '../../config/api';
import './MedicalRecords.css';

// ── Nepali calendar conversion (approximate) ──────────────────────────────────
const toNepaliDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return { bs: dateStr, ad: dateStr };
  const bsMonths = ['Baisakh','Jestha','Ashadh','Shrawan','Bhadra','Ashwin','Kartik','Mangsir','Poush','Magh','Falgun','Chaitra'];
  const adMonth = d.getMonth();
  const bsMonthIndex = (adMonth + 8) % 12;
  const bsYear = d.getFullYear() + (adMonth >= 4 ? 57 : 56);
  const bsDay = d.getDate();
  const adFormatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return {
    bs: `${bsMonths[bsMonthIndex]} ${bsDay}, ${bsYear}`,
    ad: adFormatted,
  };
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const FileIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const PillIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 20H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H20a2 2 0 0 1 2 2v3"/>
    <circle cx="18" cy="18" r="4"/>
    <path d="m15.5 15.5 5 5"/>
  </svg>
);

// ── Prescription Detail Modal ─────────────────────────────────────────────────
function PrescriptionModal({ record, onClose }) {
  if (!record) return null;
  const meds = record.medicines || [];
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
              Prescription — {record.doctorName || 'Doctor'}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              {record.hospitalName || 'Hospital'} · {toNepaliDate(record.checkupDate || record.createdAt).ad}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}>✕</button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem' }}>
          {/* Diagnosis */}
          {record.diagnosis && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Diagnosis</div>
              <div style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 600 }}>{record.diagnosis}</div>
            </div>
          )}

          {/* Chief Complaints */}
          {record.chiefComplaints && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Chief Complaints</div>
              <div style={{ fontSize: '0.85rem', color: '#374151' }}>{record.chiefComplaints}</div>
            </div>
          )}

          {/* Medicines */}
          {meds.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                Medicines ({meds.length})
              </div>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                {meds.map((m, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem', padding: '0.6rem 0.75rem', borderBottom: i < meds.length - 1 ? '1px solid #f1f5f9' : 'none', fontSize: '0.82rem' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{m.name}</div>
                    <div style={{ color: '#64748b' }}>{m.dosage || m.strength || '—'}</div>
                    <div style={{ color: '#64748b' }}>{m.frequency || m.timing || '—'}</div>
                    <div style={{ color: '#64748b' }}>{m.duration || '—'}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.5rem', padding: '0.3rem 0.75rem', fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                <span>Medicine</span><span>Strength</span><span>Frequency</span><span>Duration</span>
              </div>
            </div>
          )}

          {/* Doctor's Notes */}
          {record.notes && (
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '0.75rem', fontSize: '0.82rem', color: '#166534' }}>
              <strong>Doctor's Notes:</strong> {record.notes}
            </div>
          )}

          {/* Follow-up */}
          {record.followUpDate && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#0369a1', background: '#e0f2fe', borderRadius: 8, padding: '0.6rem 0.75rem' }}>
              📅 Follow-up recommended: {toNepaliDate(record.followUpDate).ad}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Group records by hospital ─────────────────────────────────────────────────
const groupByHospital = (records) => {
  const groups = {};
  records.forEach((r) => {
    const key = r.hospitalName || 'Unknown Hospital';
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  Object.keys(groups).forEach((h) => {
    groups[h].sort((a, b) => new Date(b.checkupDate || b.createdAt) - new Date(a.checkupDate || a.createdAt));
  });
  return groups;
};

// ── Component ─────────────────────────────────────────────────────────────────
const MedicalRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const patientId = user.id;
        if (!patientId) { setLoading(false); return; }

        const res = await fetch(`${API_BASE_URL}/api/prescriptions/patient/${patientId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await res.json();
        if (data.success) {
          setRecords(data.prescriptions || []);
        }
      } catch {
        // graceful — show empty state
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const filtered = records.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.diagnosis || '').toLowerCase().includes(q) ||
      (r.doctorName || '').toLowerCase().includes(q) ||
      (r.hospitalName || '').toLowerCase().includes(q) ||
      (r.patientName || '').toLowerCase().includes(q)
    );
  });

  const grouped = groupByHospital(filtered);
  const hospitalNames = Object.keys(grouped).sort();

  return (
    <div className="records-container">
      <div className="records-content">

        {/* Page Header */}
        <div className="mr-page-header">
          <div>
            <h1>Medical Records</h1>
            <p className="mr-page-sub">Your prescriptions, organized by facility</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mr-toolbar">
          <div className="mr-search-wrap">
            <span className="mr-search-icon"><SearchIcon /></span>
            <input
              className="mr-search-input"
              type="text"
              placeholder="Search by doctor, diagnosis, or hospital…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="mr-empty">
            <div className="mr-empty-icon">⏳</div>
            <h3>Loading records…</h3>
          </div>
        ) : records.length === 0 ? (
          <div className="mr-empty">
            <div className="mr-empty-icon">🗂️</div>
            <h3>No records yet</h3>
            <p>Your prescriptions will appear here after a doctor visit.</p>
          </div>
        ) : hospitalNames.length === 0 ? (
          <div className="mr-empty">
            <div className="mr-empty-icon">🔍</div>
            <h3>No records found</h3>
            <p>Try adjusting your search.</p>
          </div>
        ) : (
          hospitalNames.map((hospital) => (
            <div key={hospital} className="mr-hospital-group">
              <div className="mr-hospital-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                {hospital}
              </div>

              <div className="mr-records-list">
                {grouped[hospital].map((record) => {
                  const dates = toNepaliDate(record.checkupDate || record.createdAt);
                  const medCount = (record.medicines || []).length;
                  return (
                    <div
                      key={record._id}
                      className="mr-record-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelected(record)}
                    >
                      {/* Left: icon + title */}
                      <div className="mr-row-left">
                        <div className="mr-file-icon">
                          <FileIcon />
                        </div>
                        <div className="mr-row-info">
                          <span className="mr-row-title">
                            {record.diagnosis ? `Prescription — ${record.diagnosis}` : 'Prescription'}
                          </span>
                          <span
                            className="mr-type-badge"
                            style={{ background: '#dbeafe', color: '#1d4ed8', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <PillIcon /> {medCount} medicine{medCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Center: doctor */}
                      <div className="mr-row-center">
                        <span className="mr-row-hospital">{record.hospitalName || hospital}</span>
                        <span className="mr-row-doctor">{record.doctorName || '—'}</span>
                      </div>

                      {/* Right: date */}
                      <div className="mr-row-right">
                        <div className="mr-row-dates">
                          <span className="mr-date-bs">
                            <CalendarIcon /> {dates.bs}
                          </span>
                          <span className="mr-date-ad">{dates.ad}</span>
                        </div>
                        <button
                          className="mr-download-btn"
                          title="View details"
                          onClick={e => { e.stopPropagation(); setSelected(record); }}
                          aria-label="View prescription details"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {selected && <PrescriptionModal record={selected} onClose={() => setSelected(null)} />}
    </div>
  );
};

export default MedicalRecords;
