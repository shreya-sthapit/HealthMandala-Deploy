import { useState, useEffect, useCallback } from 'react';

export default function HDPatients({ userId, API }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchPatients = useCallback(async () => {
    if (!userId) return; setLoading(true);
    try {
      let url = `${API}/patients?userId=${userId}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await fetch(url); const data = await res.json();
      if (data.success) setPatients(data.patients);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [userId, search, API]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  return (
    <div>
      <div className="hd-card">
        <div className="hd-card-header">
          <h3>Patient Registry</h3>
          <span style={{ fontSize: '0.8rem', color: '#6b8f95' }}>{patients.length} patients</span>
        </div>
        <div className="hd-card-body" style={{ paddingBottom: 0 }}>
          <div className="hd-filter-bar">
            <input className="hd-search" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="hd-table-wrap">
          {loading ? <div className="hd-loading">Loading...</div> : patients.length === 0 ? (
            <div className="hd-empty"><p>No patients found</p></div>
          ) : (
            <table className="hd-table">
              <thead><tr><th>#</th><th>Patient Name</th><th>Phone</th><th>Email</th><th>Last Visit</th><th>Last Doctor</th></tr></thead>
              <tbody>
                {patients.map((p, i) => (
                  <tr key={i}>
                    <td style={{ color: '#6b8f95', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e6f7f5', color: '#00a896', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>{p.name?.[0]?.toUpperCase() || '?'}</div>
                        <span style={{ fontWeight: 600 }}>{p.name}</span>
                      </div>
                    </td>
                    <td>{p.phone || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: '#6b8f95' }}>{p.email || '—'}</td>
                    <td style={{ fontSize: '0.82rem' }}>{p.lastVisit ? new Date(p.lastVisit).toLocaleDateString() : '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: '#6b8f95' }}>{p.lastDoctor || '—'}</td>
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
