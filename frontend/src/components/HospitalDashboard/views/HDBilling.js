import { useState, useEffect, useCallback } from 'react';

const DollarSVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const ClockSVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
const ActivitySVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>);

export default function HDBilling({ userId, API }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('today');

  const fetchBilling = useCallback(async () => {
    if (!userId) return; setLoading(true);
    try {
      let url = `${API}/appointments?userId=${userId}&status=completed`;
      if (period === 'today') url += `&date=${new Date().toISOString().split('T')[0]}`;
      const res = await fetch(url); const data = await res.json();
      if (data.success) setAppointments(data.appointments);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [userId, period, API]);

  useEffect(() => { fetchBilling(); }, [fetchBilling]);

  const totalRevenue = appointments.filter(a => a.paymentStatus === 'paid').reduce((s, a) => s + (a.consultationFee || 0), 0);
  const pendingPayment = appointments.filter(a => a.paymentStatus === 'pending').reduce((s, a) => s + (a.consultationFee || 0), 0);
  const payBadge = s => s === 'paid' ? 'confirmed' : s === 'refunded' ? 'cancelled' : 'pending';

  return (
    <div>
      <div className="hd-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="hd-stat-card"><div className="hd-stat-icon green"><DollarSVG /></div><div><div className="hd-stat-value">NPR {totalRevenue.toLocaleString()}</div><div className="hd-stat-label">Collected</div></div></div>
        <div className="hd-stat-card"><div className="hd-stat-icon orange"><ClockSVG /></div><div><div className="hd-stat-value">NPR {pendingPayment.toLocaleString()}</div><div className="hd-stat-label">Pending</div></div></div>
        <div className="hd-stat-card"><div className="hd-stat-icon blue"><ActivitySVG /></div><div><div className="hd-stat-value">{appointments.length}</div><div className="hd-stat-label">Transactions</div></div></div>
      </div>

      <div className="hd-card">
        <div className="hd-card-header">
          <h3>Billing &amp; Transactions</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['today','all'].map(p => <button key={p} className={`hd-btn hd-btn-sm ${period === p ? 'hd-btn-primary' : 'hd-btn-secondary'}`} onClick={() => setPeriod(p)}>{p === 'today' ? 'Today' : 'All Time'}</button>)}
          </div>
        </div>
        <div style={{ margin: '1rem 1.25rem', padding: '0.75rem 1rem', background: '#fffaf0', border: '1px solid #fbd38d', borderRadius: '8px', fontSize: '0.82rem', color: '#744210' }}>
          To receive Khalti/eSewa payouts, configure your merchant credentials in <strong>Hospital Profile → Payment Settings</strong>.
        </div>
        <div className="hd-table-wrap">
          {loading ? <div className="hd-loading">Loading...</div> : appointments.length === 0 ? (
            <div className="hd-empty"><div className="hd-empty-icon"><DollarSVG /></div><p>No billing records found</p></div>
          ) : (
            <table className="hd-table">
              <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Fee (NPR)</th><th>Method</th><th>Payment</th></tr></thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a._id}>
                    <td style={{ fontWeight: 600 }}>{a.patientName}</td>
                    <td style={{ fontSize: '0.82rem', color: '#6b8f95' }}>{a.doctorName}</td>
                    <td style={{ fontSize: '0.82rem' }}>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 700, color: '#00a896' }}>NPR {(a.consultationFee || 0).toLocaleString()}</td>
                    <td style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{a.paymentMethod || 'cash'}</td>
                    <td><span className={`hd-badge hd-badge-${payBadge(a.paymentStatus)}`}>{a.paymentStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
