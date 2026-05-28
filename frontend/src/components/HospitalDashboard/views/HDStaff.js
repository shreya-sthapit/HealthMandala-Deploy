import { useState, useEffect, useCallback } from 'react';

const ROLES = ['receptionist','pharmacist'];
const ROLE_LABELS = { receptionist: 'Receptionist', pharmacist: 'Pharmacist' };

const UsersSVG = () => (<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);

export default function HDStaff({ userId, API }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editStaff, setEditStaff] = useState(null);
  const [viewStaff, setViewStaff] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'receptionist' });
  const [saving, setSaving] = useState(false);

  const fetchStaff = useCallback(async () => {
    if (!userId) return; setLoading(true);
    try { const res = await fetch(`${API}/staff?userId=${userId}`); const data = await res.json(); if (data.success) setStaff(data.staff); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, [userId, API]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const openAdd = () => { setEditStaff(null); setForm({ name: '', email: '', phone: '', role: 'receptionist' }); setShowModal(true); };
  const openEdit = (s) => { setEditStaff(s); setForm({ name: s.name || '', email: s.email || '', phone: s.phone || '', role: s.role || 'receptionist' }); setShowModal(true); };

  const saveStaff = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const url = editStaff ? `${API}/staff/${editStaff._id}` : `${API}/staff`;
      const method = editStaff ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, userId }) });
      const data = await res.json();
      if (data.success) { 
        setShowModal(false); 
        // Force immediate refresh
        await fetchStaff();
      }
      else alert(data.error || 'Failed to save');
    } catch (e) { alert('Error saving staff'); } finally { setSaving(false); }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm('Remove this staff member?')) return;
    try { 
      const res = await fetch(`${API}/staff/${id}?userId=${userId}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        alert(data.message || 'Staff member removed successfully');
        // Force immediate refresh
        await fetchStaff();
      } else {
        alert(data.error || 'Failed to remove staff');
      }
    } catch (e) { 
      console.error('Error deleting staff:', e);
      alert('Error deleting staff. Please try again.'); 
    }
  };

  const filtered = staff.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));

  const thStyle = (left = false) => ({ padding: '0.65rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: '#a8c5c9', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: left ? 'left' : 'center' });
  const tdStyle = (left = false) => ({ padding: '0.85rem 1rem', verticalAlign: 'middle', textAlign: left ? 'left' : 'center' });

  return (
    <div>
      {/* Toolbar */}
      <div className="hd-card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a8c5c9', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="hd-search" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem', width: '100%', margin: 0 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#a8c5c9', fontWeight: 500, background: '#f0f4f5', padding: '0.25rem 0.75rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>{staff.length} staff</span>
          <button className="hd-btn hd-btn-primary" onClick={openAdd}>+ Add Staff</button>
        </div>
      </div>

      {loading ? <div className="hd-loading">Loading...</div> : staff.length === 0 ? (
        <div className="hd-card"><div className="hd-empty"><div className="hd-empty-icon"><UsersSVG /></div><p>No staff members added yet.</p></div></div>
      ) : (
        <div className="hd-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fdfc', borderBottom: '1.5px solid #e2f0ef' }}>
                <th style={thStyle(true)}>Staff</th>
                <th style={thStyle()}>Role</th>
                <th style={thStyle()}>Phone</th>
                <th style={thStyle()}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx, arr) => {
                const initials = s.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'S';
                return (
                  <tr key={s._id}
                    style={{ borderBottom: idx < arr.length - 1 ? '1px solid #f0f4f5' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fdfc'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={tdStyle(true)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg, #8b5cf6, #0284c7)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{initials}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#1a2e35' }}>{s.name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#a8c5c9', marginTop: '0.1rem' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...tdStyle(), fontSize: '0.82rem', color: '#6b8f95' }}>{ROLE_LABELS[s.role] || s.role}</td>
                    <td style={{ ...tdStyle(), fontSize: '0.82rem', color: '#6b8f95' }}>{s.phone || '—'}</td>
                    <td style={tdStyle()}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => setViewStaff(s)}>View</button>
                        <button className="hd-btn hd-btn-secondary hd-btn-sm" onClick={() => openEdit(s)}>Edit</button>
                        <button className="hd-btn hd-btn-sm" style={{ background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca' }} onClick={() => deleteStaff(s._id)}>Remove</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View Modal */}
      {viewStaff && (
        <div className="hd-modal-overlay" onClick={() => setViewStaff(null)}>
          <div className="hd-modal" style={{ maxWidth: '400px', borderRadius: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem 1.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a2e35', margin: 0 }}>{viewStaff.name}</h3>
                <p style={{ fontSize: '0.78rem', color: '#a8c5c9', margin: '0.2rem 0 0' }}>{ROLE_LABELS[viewStaff.role] || viewStaff.role}</p>
              </div>
              <button onClick={() => setViewStaff(null)} style={{ background: '#f0f4f5', border: 'none', borderRadius: '10px', width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem', color: '#6b8f95', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ padding: '1.25rem 1.75rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[['Email', viewStaff.email], ['Phone', viewStaff.phone]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid #f5f5f5', paddingBottom: '0.5rem' }}>
                  <span style={{ color: '#a8c5c9', fontWeight: 500 }}>{label}</span>
                  <span style={{ color: '#1a2e35', fontWeight: 600 }}>{val || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="hd-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="hd-modal" style={{ maxWidth: '520px', borderRadius: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem 1.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a2e35', margin: 0 }}>{editStaff ? 'Edit Staff Member' : 'Add Staff Member'}</h3>
                <p style={{ fontSize: '0.78rem', color: '#a8c5c9', margin: '0.2rem 0 0' }}>{editStaff ? 'Update staff details' : 'Fill in the details to add a new staff member'}</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#f0f4f5', border: 'none', borderRadius: '10px', width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem', color: '#6b8f95', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <form onSubmit={saveStaff}>
              <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="hd-form-group" style={{ margin: 0 }}>
                    <label>Full Name *</label>
                    <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ram Sharma" />
                  </div>
                  <div className="hd-form-group" style={{ margin: 0 }}>
                    <label>Role *</label>
                    <select required className="hd-select" style={{ width: '100%' }} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="hd-form-group" style={{ margin: 0 }}>
                    <label>Email *</label>
                    <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="staff@hospital.com" />
                  </div>
                  <div className="hd-form-group" style={{ margin: 0 }}>
                    <label>Phone *</label>
                    <input required value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="98XXXXXXXX" />
                  </div>
                </div>
              </div>
              <div style={{ padding: '1rem 1.75rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #f0f4f5' }}>
                <button type="button" className="hd-btn hd-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="hd-btn hd-btn-primary" disabled={saving} style={{ minWidth: '110px' }}>{saving ? 'Saving...' : editStaff ? 'Update Staff' : 'Add Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
