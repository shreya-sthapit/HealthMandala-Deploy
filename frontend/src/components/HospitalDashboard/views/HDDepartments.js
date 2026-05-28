import { useState, useEffect, useCallback } from 'react';

const DEPT_PRESETS = [
  'Ayurveda Physician (Traditional Medicine Specialist)',
  'Cardiologist (Heart Specialist)',
  'Dental Surgeon (Teeth & Oral Specialist)',
  'Dermatologist (Skin & Hair Specialist)',
  'Endocrinologist (Diabetes & Hormone Specialist)',
  'Gastroenterologist (Stomach & Liver Specialist)',
  'General Physician (Internal Medicine & Fever)',
  'General Practitioner (Family Doctor)',
  'General Surgeon (General Operations)',
  'Gynecologist & Obstetrician (Women\'s Health & Pregnancy)',
  'Nephrologist (Kidney Specialist)',
  'Neurologist (Brain & Nerve Specialist)',
  'Neurosurgeon (Brain & Spine Surgeon)',
  'Oncologist (Cancer Specialist)',
  'Ophthalmologist (Eye Specialist)',
  'Orthopedic Surgeon (Bone & Joint Specialist)',
  'Otolaryngologist (ENT - Ear, Nose & Throat Specialist)',
  'Pediatrician (Child & Newborn Specialist)',
  'Physiotherapist (Physical Rehab Specialist)',
  'Psychiatrist (Mental Health & Counseling Specialist)',
  'Pulmonologist (Chest & Lung Specialist)',
  'Radiologist (X-Ray & Ultrasound Specialist)',
  'Rheumatologist (Arthritis & Joint Pain Specialist)',
  'Urologist (Urinary & Kidney Stone Specialist)',
];

// Simple icon map per department
const DEPT_ICONS = {
  'Cardiologist (Heart Specialist)': '🫀',
  'Dermatologist (Skin & Hair Specialist)': '🧴',
  'Endocrinologist (Diabetes & Hormone Specialist)': '🩸',
  'Gastroenterologist (Stomach & Liver Specialist)': '🫁',
  'General Physician (Internal Medicine & Fever)': '🩺',
  'General Practitioner (Family Doctor)': '👨‍⚕️',
  'General Surgeon (General Operations)': '🔪',
  "Gynecologist & Obstetrician (Women's Health & Pregnancy)": '🌸',
  'Nephrologist (Kidney Specialist)': '🫘',
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
  'Rheumatologist (Arthritis & Joint Pain Specialist)': '🦵',
  'Urologist (Urinary & Kidney Stone Specialist)': '💧',
  'Dental Surgeon (Teeth & Oral Specialist)': '🦷',
  'Ayurveda Physician (Traditional Medicine Specialist)': '🌿',
};

export default function HDDepartments({ userId, API, onDeptClick }) {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', customName: '' });
  const [saving, setSaving] = useState(false);

  const fetchDepts = useCallback(async () => {
    if (!userId) return; setLoading(true);
    try { const res = await fetch(`${API}/departments?userId=${userId}`); const data = await res.json(); if (data.success) setDepartments(data.departments); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, [userId, API]);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  const openAdd = () => { setForm({ name: '', customName: '' }); setShowModal(true); };

  const saveDept = async (e) => {
    e.preventDefault(); setSaving(true);
    const duplicate = departments.some(d => d.name.toLowerCase() === form.name.toLowerCase());
    if (duplicate) { alert(`${form.name} is already added.`); setSaving(false); return; }
    try {
      const res = await fetch(`${API}/departments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, userId }) });
      const data = await res.json();
      if (data.success) { setShowModal(false); fetchDepts(); }
      else alert(data.error || 'Failed to save');
    } catch (e) { alert('Error saving department'); } finally { setSaving(false); }
  };

  const deleteDept = async (id) => {
    if (!window.confirm('Remove this department?')) return;
    try { await fetch(`${API}/departments/${id}`, { method: 'DELETE' }); fetchDepts(); } catch (e) { alert('Error deleting'); }
  };

  const filtered = departments.filter(d => d.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* Toolbar */}
      <div className="hd-card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
          <svg style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#a8c5c9', pointerEvents: 'none' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="hd-search" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '2.25rem', width: '100%', margin: 0 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#a8c5c9', fontWeight: 500, background: '#f0f4f5', padding: '0.25rem 0.75rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>
            {departments.length} department{departments.length !== 1 ? 's' : ''}
          </span>
          <button className="hd-btn hd-btn-primary" onClick={openAdd}>+ Add Department</button>
        </div>
      </div>

      {loading ? <div className="hd-loading">Loading...</div> : departments.length === 0 ? (
        <div className="hd-card"><div className="hd-empty"><p>No departments set up yet.</p></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
          {[...filtered].sort((a, b) => a.name.localeCompare(b.name)).map(dept => {
            const icon = DEPT_ICONS[dept.name] || '🏥';
            return (
              <div key={dept._id} style={{ background: '#fff', border: '1.5px solid #e2f0ef', borderRadius: '16px', padding: '1.25rem 1rem', textAlign: 'center', position: 'relative', transition: 'all 0.2s', cursor: 'pointer' }}
                onClick={() => { if (onDeptClick) { const main = dept.name.split('(')[0].trim(); onDeptClick(main); } }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,168,150,0.12)'; e.currentTarget.style.borderColor = '#b2ece6'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2f0ef'; }}
              >
                {/* Remove button */}
                <button
                  onClick={e => { e.stopPropagation(); deleteDept(dept._id); }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: '1rem', lineHeight: 1, padding: '2px 5px', borderRadius: '6px' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseLeave={e => e.currentTarget.style.color = '#d1d5db'}
                  title="Remove department"
                >×</button>

                {/* Icon box */}
                <div style={{ width: 56, height: 56, borderRadius: '14px', background: '#f0fdf9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', margin: '0 auto 0.75rem' }}>
                  {icon}
                </div>

                {/* Name — split main title from subtitle in brackets */}
                {(() => {
                  const match = dept.name.match(/^([^(]+)\s*(\(.*\))?$/);
                  const main = match?.[1]?.trim() || dept.name;
                  const sub = match?.[2]?.trim();
                  return (
                    <>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1a2e35', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 1.3 }}>
                        {main}
                      </div>
                      {sub && (
                        <div style={{ fontSize: '0.72rem', fontWeight: 400, color: '#6b8f95', marginTop: '0.25rem', lineHeight: 1.3 }}>
                          {sub}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Doctor count */}
                <div style={{ fontSize: '0.75rem', color: '#00a896', fontWeight: 600, marginTop: '0.5rem' }}>
                  {dept.doctors?.length || 0} Doctor{(dept.doctors?.length || 0) !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="hd-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="hd-modal" style={{ maxWidth: '420px', borderRadius: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem 1.75rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a2e35', margin: 0 }}>Add Department</h3>
                <p style={{ fontSize: '0.78rem', color: '#a8c5c9', margin: '0.2rem 0 0' }}>Select from the list or type a custom name</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: '#f0f4f5', border: 'none', borderRadius: '10px', width: 32, height: 32, cursor: 'pointer', fontSize: '1.1rem', color: '#6b8f95', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <form onSubmit={saveDept}>
              <div style={{ padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="hd-form-group" style={{ margin: 0 }}>
                  <label>Department Name *</label>
                  <select
                    className="hd-select"
                    style={{ width: '100%' }}
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required
                  >
                    <option value="">Select a department</option>
                    {DEPT_PRESETS.map(d => {
                      const added = departments.some(existing => existing.name.toLowerCase() === d.toLowerCase());
                      return <option key={d} value={d} disabled={added}>{d}{added ? ' (already added)' : ''}</option>;
                    })}
                  </select>
                </div>
              </div>
              <div style={{ padding: '1rem 1.75rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #f0f4f5' }}>
                <button type="button" className="hd-btn hd-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="hd-btn hd-btn-primary" disabled={saving} style={{ minWidth: '130px' }}>{saving ? 'Adding...' : 'Add Department'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
