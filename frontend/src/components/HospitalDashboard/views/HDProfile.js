import { useState, useEffect } from 'react';
import API_BASE_URL from '../../../config/api';

const SaveSVG  = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>);
const CheckSVG = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);

const FACILITY_CATEGORIES = [
  'Private Hospital', 'Teaching Hospital', 'Government Hospital',
  'Community / Non-Profit Hospital', 'Specialized Clinic',
  'Diagnostic & Lab Center', 'Polyclinic',
  'Ayurveda and Alternative Medicine Center', 'Other',
];

const EMPTY = {
  // Facility & Legal
  hospitalName: '', facilityCategory: '', dohsLicenseNumber: '', panVatNumber: '',
  // Contact
  hospitalPhone: '', officialEmail: '',
  // Admin Contact
  adminName: '', adminPhone: '',
  // Location
  province: '', district: '', palika: '',
  // Basic
  estimatedDoctors: '',
  // Extended
  website: '', googleMapsUrl: '',
  opdTimings: { open: '08:00', close: '17:00' },
  // Payment
  khaltiMerchantId: '', esewaId: '',
  // Logo
  logoUrl: '',
};

export default function HDProfile({ userId, hospital, API, onRefresh }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    if (!hospital) return;
    setForm({
      hospitalName:      hospital.hospitalName      || '',
      facilityCategory:  hospital.facilityCategory  || '',
      dohsLicenseNumber: hospital.dohsLicenseNumber || '',
      panVatNumber:      hospital.panVatNumber      || '',
      hospitalPhone:     hospital.hospitalPhone     || '',
      officialEmail:     hospital.officialEmail     || '',
      adminName:         hospital.adminName         || '',
      adminPhone:        hospital.adminPhone        || '',
      province:          hospital.province          || '',
      district:          hospital.district          || '',
      palika:            hospital.palika            || '',
      estimatedDoctors:  hospital.estimatedDoctors  || '',
      website:           hospital.website           || '',
      googleMapsUrl:     hospital.googleMapsUrl     || '',
      opdTimings:        hospital.opdTimings        || { open: '08:00', close: '17:00' },
      khaltiMerchantId:  hospital.khaltiMerchantId  || '',
      esewaId:           hospital.esewaId           || '',
      logoUrl:           hospital.logoUrl           || '',
    });
    setLogoPreview(hospital.logoUrl ? `${API_BASE_URL}${hospital.logoUrl}` : null);
  }, [hospital]);

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('userId', userId);

      const res = await fetch(`${API}/profile/logo`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setLogoPreview(`${API_BASE_URL}${data.logoUrl}`);
        set('logoUrl', data.logoUrl);
        onRefresh();
        alert('Hospital image uploaded successfully!');
      } else {
        alert(data.error || 'Failed to upload image');
      }
    } catch (err) {
      alert('Error uploading image');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res  = await fetch(`${API}/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, userId }) });
      const data = await res.json();
      if (data.success) { setSaved(true); onRefresh(); setTimeout(() => setSaved(false), 3000); }
      else alert(data.error || 'Failed to save');
    } catch { alert('Error saving profile'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <form onSubmit={save}>
        <div className="hd-two-col" style={{ alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Hospital Image */}
            <div className="hd-card">
              <div className="hd-card-header"><h3>Hospital Image</h3></div>
              <div className="hd-card-body">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  {logoPreview ? (
                    <div style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '250px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e0e0e0' }}>
                      <img src={logoPreview} alt="Hospital Image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ width: '100%', maxWidth: '400px', height: '250px', borderRadius: '8px', border: '2px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                      <span>No image uploaded</span>
                    </div>
                  )}
                  <label className="hd-btn hd-btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} disabled={uploading} />
                    {uploading ? 'Uploading...' : logoPreview ? 'Change Image' : 'Upload Image'}
                  </label>
                  <p style={{ fontSize: '0.85rem', color: '#666', textAlign: 'center', margin: 0 }}>
                    Recommended: Rectangle image (16:10 ratio), max 10MB (JPG, PNG, GIF, WebP)
                  </p>
                </div>
              </div>
            </div>

            {/* Facility & Legal */}
            <div className="hd-card">
              <div className="hd-card-header"><h3>Facility &amp; Legal Identity</h3></div>
              <div className="hd-card-body">
                <div className="hd-form-group">
                  <label>Official Hospital Name</label>
                  <input value={form.hospitalName} onChange={e => set('hospitalName', e.target.value)} placeholder="e.g. Kathmandu Medical Center" />
                </div>
                <div className="hd-form-group">
                  <label>Facility Category</label>
                  <select className="hd-select" style={{ width: '100%' }} value={form.facilityCategory} onChange={e => set('facilityCategory', e.target.value)}>
                    <option value="">Select category</option>
                    {FACILITY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="hd-form-row">
                  <div className="hd-form-group">
                    <label>MoHP / DoHS License Number</label>
                    <input value={form.dohsLicenseNumber} onChange={e => set('dohsLicenseNumber', e.target.value)} placeholder="DOHS-XXXX-XXXX" />
                  </div>
                  <div className="hd-form-group">
                    <label>PAN / VAT Number</label>
                    <input value={form.panVatNumber} onChange={e => set('panVatNumber', e.target.value)} placeholder="XXXXXXXXX" />
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="hd-card">
              <div className="hd-card-header"><h3>Basic Information</h3></div>
              <div className="hd-card-body">
                <div className="hd-form-group">
                  <label>Estimated Number of Doctors</label>
                  <input type="number" min="1" value={form.estimatedDoctors} onChange={e => set('estimatedDoctors', e.target.value)} placeholder="e.g. 25" />
                </div>
              </div>
            </div>

          </div>

          {/* ── Right column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Contact */}
            <div className="hd-card">
              <div className="hd-card-header"><h3>Contact Information</h3></div>
              <div className="hd-card-body">
                <div className="hd-form-group">
                  <label>Hospital Phone Number</label>
                  <input value={form.hospitalPhone} onChange={e => set('hospitalPhone', e.target.value)} placeholder="+977-1-XXXXXXX" />
                </div>
                <div className="hd-form-group">
                  <label>Official Designate Email</label>
                  <input type="email" value={form.officialEmail} onChange={e => set('officialEmail', e.target.value)} placeholder="info@hospital.com.np" />
                </div>
                <div className="hd-form-group">
                  <label>Website</label>
                  <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://hospital.com.np" />
                </div>
              </div>
            </div>

            {/* Admin Contact */}
            <div className="hd-card">
              <div className="hd-card-header"><h3>Administrative Contact</h3></div>
              <div className="hd-card-body">
                <div className="hd-form-group">
                  <label>Admin Name</label>
                  <input value={form.adminName} onChange={e => set('adminName', e.target.value)} placeholder="Full name" />
                </div>
                <div className="hd-form-group">
                  <label>Admin Phone Number</label>
                  <input value={form.adminPhone} onChange={e => set('adminPhone', e.target.value)} placeholder="98XXXXXXXX" />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="hd-card">
              <div className="hd-card-header"><h3>Location</h3></div>
              <div className="hd-card-body">
                <div className="hd-form-group">
                  <label>Province</label>
                  <input value={form.province} onChange={e => set('province', e.target.value)} placeholder="Bagmati Province" />
                </div>
                <div className="hd-form-row">
                  <div className="hd-form-group">
                    <label>District</label>
                    <input value={form.district} onChange={e => set('district', e.target.value)} placeholder="Kathmandu" />
                  </div>
                  <div className="hd-form-group">
                    <label>Local Level (Palika)</label>
                    <input value={form.palika} onChange={e => set('palika', e.target.value)} placeholder="Kathmandu Metropolitan" />
                  </div>
                </div>
                <div className="hd-form-group">
                  <label>Google Maps Link</label>
                  <input value={form.googleMapsUrl} onChange={e => set('googleMapsUrl', e.target.value)} placeholder="https://maps.google.com/..." />
                </div>
                {form.googleMapsUrl && (
                  <a href={form.googleMapsUrl} target="_blank" rel="noreferrer" className="hd-btn hd-btn-secondary hd-btn-sm" style={{ display: 'inline-flex', marginTop: '0.25rem' }}>Preview Map</a>
                )}
              </div>
            </div>

          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', marginBottom: '3rem', gap: '0.75rem', alignItems: 'center' }}>
          {saved && <span style={{ color: '#00a896', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}><CheckSVG /> Saved successfully!</span>}
          <button type="submit" className="hd-btn hd-btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <SaveSVG /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
