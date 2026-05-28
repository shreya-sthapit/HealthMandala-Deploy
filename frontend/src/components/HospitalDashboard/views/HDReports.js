import { useState, useEffect, useCallback } from 'react';

const CalSVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>);
const DollarSVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const CheckSVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const ActivitySVG = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>);

export default function HDReports({ userId, API }) {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('week');

  const fetchReports = useCallback(async () => {
    if (!userId) return; setLoading(true);
    try { const res = await fetch(`${API}/reports?userId=${userId}&period=${period}`); const data = await res.json(); if (data.success) setReports(data.reports); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, [userId, period, API]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const statusColors = { confirmed: '#00a896', completed: '#4299e1', cancelled: '#e53e3e', pending: '#ed8936' };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {[['week','Last 7 Days'],['month','Last Month'],['year','Last Year']].map(([v, l]) => (
          <button key={v} className={`hd-btn hd-btn-sm ${period === v ? 'hd-btn-primary' : 'hd-btn-secondary'}`} onClick={() => setPeriod(v)}>{l}</button>
        ))}
      </div>

      {loading ? <div className="hd-loading">Loading reports...</div> : !reports ? (
        <div className="hd-card"><div className="hd-empty"><div className="hd-empty-icon"><ActivitySVG /></div><p>No data available</p></div></div>
      ) : (
        <>
          <div className="hd-stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="hd-stat-card"><div className="hd-stat-icon teal"><CalSVG /></div><div><div className="hd-stat-value">{reports.totalAppointments}</div><div className="hd-stat-label">Total Appointments</div></div></div>
            <div className="hd-stat-card"><div className="hd-stat-icon green"><DollarSVG /></div><div><div className="hd-stat-value">NPR {reports.totalRevenue.toLocaleString()}</div><div className="hd-stat-label">Revenue Collected</div></div></div>
            <div className="hd-stat-card"><div className="hd-stat-icon blue"><CheckSVG /></div><div><div className="hd-stat-value">{reports.statusBreakdown?.completed || 0}</div><div className="hd-stat-label">Completed</div></div></div>
            <div className="hd-stat-card"><div className="hd-stat-icon red"><ActivitySVG /></div><div><div className="hd-stat-value">{reports.statusBreakdown?.cancelled || 0}</div><div className="hd-stat-label">Cancelled</div></div></div>
          </div>

          <div className="hd-two-col">
            <div className="hd-card">
              <div className="hd-card-header"><h3>Status Breakdown</h3></div>
              <div className="hd-card-body">
                {Object.entries(reports.statusBreakdown || {}).map(([status, count]) => {
                  const pct = reports.totalAppointments > 0 ? Math.round((count / reports.totalAppointments) * 100) : 0;
                  return (
                    <div key={status} style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{status}</span>
                        <span style={{ color: '#6b8f95' }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', background: '#f0f4f8', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: statusColors[status] || '#a0aec0', borderRadius: '3px', transition: 'width 0.5s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="hd-card">
              <div className="hd-card-header"><h3>Doctor Performance</h3></div>
              <div className="hd-table-wrap">
                {!reports.doctorStats?.length ? <div className="hd-empty"><p>No data</p></div> : (
                  <table className="hd-table">
                    <thead><tr><th>Doctor</th><th>Specialization</th><th>Appointments</th><th>Revenue</th></tr></thead>
                    <tbody>
                      {reports.doctorStats.map((d, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{d.name}</td>
                          <td style={{ fontSize: '0.78rem', color: '#6b8f95' }}>{d.specialization || '—'}</td>
                          <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontWeight: 700 }}>{d.count}</span>{i === 0 && <span style={{ fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>Top</span>}</div></td>
                          <td style={{ fontWeight: 600, color: '#00a896' }}>NPR {d.revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
