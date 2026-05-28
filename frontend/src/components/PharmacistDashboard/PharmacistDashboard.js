import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../HospitalDashboard/HospitalDashboard.css';
import LogoutModal from '../Profile/LogoutModal';

const API = 'http://localhost:5001/api';
const ALLOWED = ['pharmacist', 'staff', 'hospital_admin', 'admin'];

/* ── Icons ── */
const DashIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>;
const ClockIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const CheckIcon  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const ListIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>;
const LogoutIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;

const NAV = [
  { section: 'Overview' },
  { id: 'overview',  label: 'Dashboard',              icon: <DashIcon /> },
  { section: 'Prescriptions' },
  { id: 'pending',   label: 'Incoming Prescriptions', icon: <ClockIcon /> },
  { id: 'dispensed', label: 'Dispensed',              icon: <CheckIcon /> },
  { id: 'all',       label: 'All Prescriptions',      icon: <ListIcon /> },
];

function RxStatusBadge({ status }) {
  const cls = status === 'dispensed' ? 'hd-badge-completed' : 'hd-badge-pending';
  return <span className={`hd-badge ${cls}`}>{status || 'pending'}</span>;
}

/* ── Dispense Modal ── */
function DispenseModal({ rx, onClose, onDispensed }) {
  const [inventoryData, setInventoryData] = useState(null);
  const [loadingInv, setLoadingInv]       = useState(true);
  const [toast, setToast]                 = useState(false);
  const [billing, setBilling]             = useState(false);
  // Local editable quantities — keyed by index
  const [quantities, setQuantities]       = useState({});

  const meds = rx.medicines || rx.medications || [];

  // Initialise quantities from prescription data
  useEffect(() => {
    const init = {};
    meds.forEach((m, i) => { init[i] = Number(m.quantity) || 1; });
    setQuantities(init);
  }, [rx._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch inventory cross-check when modal opens
  useEffect(() => {
    if (meds.length === 0) { setLoadingInv(false); return; }
    const payload = meds.map((m, i) => ({
      name: m.name || m.medicineName || '',
      quantity: quantities[i] ?? Number(m.quantity) ?? 1,
    }));
    fetch(`${API}/inventory/cross-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({ medicines: payload }),
    })
      .then(r => r.json())
      .then(data => { if (data.success) setInventoryData(data); })
      .catch(() => {})
      .finally(() => setLoadingInv(false));
  }, [rx._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Recompute totals locally when quantities change (no extra API call needed)
  const lineTotal = (i) => {
    const inv = inventoryData?.results?.[i];
    if (!inv?.found) return 0;
    return +(inv.unit_price * (quantities[i] ?? 1)).toFixed(2);
  };
  const grandTotal = meds.reduce((sum, _, i) => sum + lineTotal(i), 0);

  const updateQty = (i, val) => {
    const n = Math.max(1, parseInt(val) || 1);
    setQuantities(prev => ({ ...prev, [i]: n }));
  };

  const handleCollectPayment = async () => {
    setBilling(true);
    try {
      await fetch(`${API}/prescriptions/${rx._id}/dispense`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (rx.appointmentId) {
        await fetch(`${API}/appointments/complete-billing/${rx.appointmentId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
      }
      setToast(true);
      setTimeout(() => { setToast(false); onDispensed(); onClose(); }, 1800);
    } catch {
      setToast(true);
      setTimeout(() => { setToast(false); onDispensed(); onClose(); }, 1800);
    } finally {
      setBilling(false);
    }
  };

  return (
    <div className="hd-modal-overlay" onClick={onClose}>
      <div className="hd-modal" style={{ maxWidth: 860 }} onClick={e => e.stopPropagation()}>
        <div className="hd-modal-header">
          <h3>
            Prescription — Token #{rx.tokenNumber || '—'}&nbsp;
            <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--hd-muted)' }}>{rx.patientName}</span>
          </h3>
          <button className="hd-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="hd-modal-body">
          {toast && (
            <div className="hd-notif-item" style={{ marginBottom: '1rem', background: '#d1fae5', borderLeftColor: '#10b981' }}>
              <span className="hd-notif-text" style={{ color: '#065f46', fontWeight: 600 }}>✅ Payment collected — VAT bill printed!</span>
            </div>
          )}

          {/* ── Patient & Rx info ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', marginBottom: '1.25rem' }}>
            {[
              ['Patient',   rx.patientName || '—'],
              ['Token #',   rx.tokenNumber || '—'],
              ['Doctor',    rx.doctorName  || '—'],
              ['Diagnosis', rx.diagnosis   || '—'],
              ['Date',      rx.createdAt   ? rx.createdAt.split('T')[0] : '—'],
              ['Follow-up', rx.followUpDate ? rx.followUpDate.split('T')[0] : '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '0.4rem 0', borderBottom: '1px solid #f0fafa', fontSize: '0.83rem' }}>
                <div style={{ color: 'var(--hd-muted)', fontWeight: 600, fontSize: '0.7rem', marginBottom: '0.15rem' }}>{k}</div>
                <div style={{ color: 'var(--hd-text)', fontWeight: k === 'Token #' ? 700 : 400 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* ── Billing & Inventory Table ── */}
          {meds.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--hd-text)' }}>
                  Medicines &amp; Billing ({meds.length} item{meds.length !== 1 ? 's' : ''})
                </div>
                {loadingInv && <span style={{ fontSize: '0.72rem', color: 'var(--hd-muted)' }}>Checking inventory…</span>}
              </div>

              <div className="hd-table-wrap" style={{ marginBottom: '0.75rem' }}>
                <table className="hd-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Medicine</th>
                      <th>Freq.</th>
                      <th>Dur.</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Unit (NPR)</th>
                      <th style={{ textAlign: 'right' }}>Total (NPR)</th>
                      <th style={{ textAlign: 'center' }}>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {meds.map((m, i) => {
                      const inv = inventoryData?.results?.[i];
                      const qty = quantities[i] ?? 1;
                      return (
                        <tr key={i}>
                          <td style={{ color: 'var(--hd-muted)', fontWeight: 600 }}>{i + 1}</td>
                          <td><strong>{m.name || m.medicineName || '—'}</strong></td>
                          <td>{m.frequency || m.timing || '—'}</td>
                          <td>{m.duration || '—'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              value={qty}
                              onChange={e => updateQty(i, e.target.value)}
                              style={{
                                width: 56, textAlign: 'center', fontWeight: 700,
                                padding: '0.25rem 0.3rem', border: '1.5px solid #e2e8f0',
                                borderRadius: 6, fontSize: '0.83rem', fontFamily: 'inherit',
                              }}
                            />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {loadingInv ? '…' : inv?.found
                              ? `Rs. ${inv.unit_price.toFixed(2)}`
                              : <span style={{ color: 'var(--hd-muted)', fontSize: '0.72rem' }}>N/A</span>}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--hd-teal2)' }}>
                            {loadingInv ? '…' : inv?.found ? `Rs. ${lineTotal(i).toFixed(2)}` : '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {loadingInv ? (
                              <span style={{ fontSize: '0.7rem', color: 'var(--hd-muted)' }}>…</span>
                            ) : !inv?.found ? (
                              <span style={{ fontSize: '0.7rem', color: 'var(--hd-muted)' }}>Not in DB</span>
                            ) : inv.inStock ? (
                              <span style={{ background: '#d1fae5', color: '#065f46', borderRadius: 20, padding: '0.15rem 0.55rem', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                ✓ In Stock ({inv.stock_quantity})
                              </span>
                            ) : (
                              <span style={{ background: '#fee2e2', color: '#991b1b', borderRadius: 20, padding: '0.15rem 0.55rem', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                ✗ Out of Stock
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Grand Total */}
              {!loadingInv && inventoryData && (
                <div style={{
                  display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                  gap: '1rem', padding: '0.75rem 1rem',
                  background: 'linear-gradient(135deg, #f0fafa, #e6f7f5)',
                  borderRadius: 10, marginBottom: '0.75rem',
                  border: '1px solid var(--hd-border)',
                }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--hd-muted)' }}>Total Bill</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--hd-teal2)', letterSpacing: '-0.02em' }}>
                    Rs. {grandTotal.toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}

          {rx.notes && (
            <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '0.6rem 0.9rem', fontSize: '0.82rem', color: '#166534' }}>
              <strong>Doctor's Notes:</strong> {rx.notes}
            </div>
          )}
        </div>

        <div className="hd-modal-footer">
          <button className="hd-btn hd-btn-secondary" onClick={onClose}>Close</button>
          {!toast && (
            <button
              className="hd-btn hd-btn-primary"
              onClick={handleCollectPayment}
              disabled={billing || loadingInv}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
            >
              {billing ? 'Processing…' : `💳 Collect Rs. ${grandTotal.toFixed(2)} & Print VAT Bill`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Overview ── */
function OverviewView({ prescriptions, loading }) {
  const today = new Date().toISOString().split('T')[0];
  const todayRx = prescriptions.filter(p => (p.createdAt || '').startsWith(today));
  const stats = [
    { label: 'Total Rx Today',       value: todayRx.length,                                             color: 'teal',   icon: '💊' },
    { label: 'Awaiting Collection',  value: prescriptions.filter(p => p.status !== 'dispensed').length, color: 'orange', icon: '⏳' },
    { label: 'Dispensed Today',      value: todayRx.filter(p => p.status === 'dispensed').length,       color: 'green',  icon: '✅' },
    { label: 'Total Dispensed',      value: prescriptions.filter(p => p.status === 'dispensed').length, color: 'blue',   icon: '📦' },
  ];
  return (
    <>
      <div className="hd-stats-grid">
        {stats.map(s => (
          <div className="hd-stat-card" key={s.label}>
            <div className={`hd-stat-icon ${s.color}`}>{s.icon}</div>
            <div>
              <div className="hd-stat-value">{s.value}</div>
              <div className="hd-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="hd-card">
        <div className="hd-card-header"><h3>Recent Prescriptions</h3></div>
        <div className="hd-table-wrap">
          {loading ? (
            <div className="hd-loading">Loading…</div>
          ) : prescriptions.length === 0 ? (
            <div className="hd-empty"><div className="hd-empty-icon">💊</div><p>No prescriptions yet</p></div>
          ) : (
            <table className="hd-table">
              <thead>
                <tr><th>Token #</th><th>Patient</th><th>Doctor</th><th>Diagnosis</th><th>Medicines</th><th>Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {prescriptions.slice(0, 8).map(p => (
                  <tr key={p._id}>
                    <td><div className="hd-token">{p.tokenNumber || '—'}</div></td>
                    <td>{p.patientName || '—'}</td>
                    <td>{p.doctorName  || '—'}</td>
                    <td>{p.diagnosis   || '—'}</td>
                    <td>{(p.medicines || []).length}</td>
                    <td>{p.createdAt ? p.createdAt.split('T')[0] : '—'}</td>
                    <td><RxStatusBadge status={p.status} /></td>
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

/* ── Pending (Incoming Prescriptions) ── */
function PendingView({ prescriptions, loading, onRefresh }) {
  const [selected, setSelected] = useState(null);
  // Show prescriptions where appointment is 'prescribed' (doctor done, pharmacist not yet)
  const pending = prescriptions
    .filter(p => p.status !== 'dispensed')
    .sort((a, b) => (a.tokenNumber || 999) - (b.tokenNumber || 999));

  return (
    <>
      <div className="hd-card">
        <div className="hd-card-header">
          <h3>Incoming Prescriptions</h3>
          <span className="hd-badge hd-badge-pending">{pending.length} pending</span>
        </div>
        <div className="hd-table-wrap">
          {loading ? (
            <div className="hd-loading">Loading…</div>
          ) : pending.length === 0 ? (
            <div className="hd-empty"><div className="hd-empty-icon">✅</div><p>No pending prescriptions</p></div>
          ) : (
            <table className="hd-table">
              <thead>
                <tr><th>Token #</th><th>Patient</th><th>Doctor</th><th>Diagnosis</th><th>Medicines</th><th>Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {pending.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div className="hd-token" style={{ width: 44, height: 44, fontSize: '1rem' }}>
                        {p.tokenNumber || '—'}
                      </div>
                    </td>
                    <td><strong>{p.patientName || '—'}</strong></td>
                    <td>{p.doctorName || '—'}</td>
                    <td>{p.diagnosis || '—'}</td>
                    <td>{(p.medicines || []).length} item{(p.medicines || []).length !== 1 ? 's' : ''}</td>
                    <td>{p.createdAt ? p.createdAt.split('T')[0] : '—'}</td>
                    <td>
                      <button className="hd-btn hd-btn-primary hd-btn-sm" onClick={() => setSelected(p)}>
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <DispenseModal
          rx={selected}
          onClose={() => setSelected(null)}
          onDispensed={() => { setSelected(null); onRefresh(); }}
        />
      )}
    </>
  );
}

/* ── Dispensed ── */
function DispensedView({ prescriptions, loading }) {
  const dispensed = prescriptions.filter(p => p.status === 'dispensed');
  return (
    <div className="hd-card">
      <div className="hd-card-header"><h3>Dispensed Prescriptions</h3></div>
      <div className="hd-table-wrap">
        {loading ? (
          <div className="hd-loading">Loading…</div>
        ) : dispensed.length === 0 ? (
          <div className="hd-empty"><div className="hd-empty-icon">📦</div><p>Dispensed prescriptions will appear here</p></div>
        ) : (
          <table className="hd-table">
            <thead>
              <tr><th>Patient</th><th>Doctor</th><th>Diagnosis</th><th>Medicines</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {dispensed.map(p => (
                <tr key={p._id}>
                  <td>{p.patientName || p.patient?.name || '—'}</td>
                  <td>{p.doctorName  || p.doctor?.name  || '—'}</td>
                  <td>{p.diagnosis   || '—'}</td>
                  <td>{(p.medicines || p.medications || []).length}</td>
                  <td>{p.createdAt ? p.createdAt.split('T')[0] : '—'}</td>
                  <td><RxStatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── All Prescriptions ── */
function AllView({ prescriptions, loading }) {
  const [search, setSearch] = useState('');
  const filtered = prescriptions.filter(p => {
    const name = (p.patientName || p.patient?.name || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="hd-card">
      <div className="hd-card-header"><h3>All Prescriptions</h3></div>
      <div className="hd-card-body" style={{ paddingBottom: 0 }}>
        <div className="hd-filter-bar">
          <input className="hd-search" placeholder="Search by patient name…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="hd-table-wrap">
        {loading ? (
          <div className="hd-loading">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="hd-empty"><div className="hd-empty-icon">💊</div><p>No prescriptions found</p></div>
        ) : (
          <table className="hd-table">
            <thead>
              <tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Medicines</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id}>
                  <td><strong>{p.patientName || p.patient?.name || '—'}</strong></td>
                  <td>{p.doctorName || p.doctor?.name || '—'}</td>
                  <td>{p.createdAt ? p.createdAt.split('T')[0] : '—'}</td>
                  <td>{(p.medicines || p.medications || []).length}</td>
                  <td><RxStatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function PharmacistDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'PH';

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    if (!token || !ALLOWED.includes(role)) {
      navigate('/hospital/login');
    }
  }, [navigate]);

  const fetchPrescriptions = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const params = new URLSearchParams();
      if (user.hospitalId) params.set('hospitalId', user.hospitalId);
      else if (user.hospitalName) params.set('hospital', user.hospitalName);

      const res = await fetch(`${API}/prescriptions/all?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.status === 404) { setPrescriptions([]); return; }
      const data = await res.json();
      if (data.success) {
        const rxList = data.prescriptions || [];
        const enriched = await Promise.all(rxList.map(async (rx) => {
          if (rx.appointmentId) {
            try {
              const aptRes = await fetch(`${API}/appointments/by-id/${rx.appointmentId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              });
              const aptData = await aptRes.json();
              if (aptData.success && aptData.appointment) {
                return { ...rx, tokenNumber: aptData.appointment.tokenNumber, appointmentStatus: aptData.appointment.status };
              }
            } catch { /* skip enrichment */ }
          }
          return rx;
        }));
        setPrescriptions(enriched);
      } else {
        setPrescriptions([]);
      }
    } catch { setPrescriptions([]); }
    finally { if (showSpinner) setLoading(false); }
  }, []);

  useEffect(() => {
    fetchPrescriptions(true); // show spinner on first load only
    const interval = setInterval(() => fetchPrescriptions(false), 15000); // silent background poll
    return () => clearInterval(interval);
  }, [fetchPrescriptions]);

  const handleLogout = () => { localStorage.clear(); navigate('/hospital/login'); };
  const tabLabel = NAV.find(n => n.id === activeTab)?.label || 'Dashboard';

  const renderView = () => {
    const props = { prescriptions, loading, onRefresh: fetchPrescriptions };
    switch (activeTab) {
      case 'overview':  return <OverviewView {...props} />;
      case 'pending':   return <PendingView {...props} />;
      case 'dispensed': return <DispensedView {...props} />;
      case 'all':       return <AllView {...props} />;
      default:          return <OverviewView {...props} />;
    }
  };

  return (
    <div className="hospital-dashboard">
      <aside className="hd-sidebar">
        <div className="hd-sidebar-header">
          {user.hospitalName && (
            <div className="hd-hospital-name">{user.hospitalName}</div>
          )}
          <div className="hd-hospital-badge">Pharmacist Portal</div>
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
              <div className="hd-admin-role">{user.email || 'Pharmacist'}</div>
            </div>
          </div>
          <button className="hd-logout-btn" onClick={() => setShowLogout(true)}><LogoutIcon /> Log Out</button>
        </div>
      </aside>

      <main className="hd-main">
        <div className="hd-topbar">
          <div className="hd-topbar-title">
            <h2>{tabLabel}</h2>
            <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        {renderView()}

        <div className="hd-footer">© {new Date().getFullYear()} HealthMandala. All rights reserved.</div>
      </main>

      {showLogout && (
        <LogoutModal
          onCancel={() => setShowLogout(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}
