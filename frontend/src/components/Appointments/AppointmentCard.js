import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import './AppointmentCard.css';
import '../Booking/Booking.css';

const AppointmentCard = ({ appointment, onClose }) => {
  const cardRef = useRef(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [patient, setPatient] = useState({
    name: appointment.patientName || 'Patient',
    id: '',
    age: '',
    gender: '',
    phone: '',
  });

  // Build patient ID from stored user data
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const patientId = `MC-${(userData.id || '000000').slice(-6).toUpperCase()}`;

    // Try to fetch full profile for age/gender
    const fetchProfile = async () => {
      try {
        if (userData.id) {
          const res = await fetch(`/api/patient/profile/${userData.id}`);
          const data = await res.json();
          if (data.success && data.profile) {
            const p = data.profile;
            const dob = p.dateOfBirth;
            let age = '';
            if (dob) {
              const diff = Date.now() - new Date(dob).getTime();
              age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
            }
            setPatient({
              name: appointment.patientName || `${p.firstName} ${p.lastName}`,
              id: patientId,
              age,
              gender: p.gender || '',
              phone: p.mobileNumber || userData.phone || '',
            });
            return;
          }
        }
      } catch (_) { /* fall through */ }

      setPatient({
        name: appointment.patientName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Patient',
        id: patientId,
        age: '',
        gender: '',
        phone: userData.phone || '',
      });
    };

    fetchProfile();
  }, [appointment.patientName]);

  // Generate QR code once patient ID is ready
  useEffect(() => {
    if (!patient.id) return;
    const qrData = JSON.stringify({
      patientId: patient.id,
      appointmentId: appointment._id || appointment.id,
      doctorName: appointment.doctorName,
      date: appointment.appointmentDate,
      time: appointment.appointmentTime,
      tokenNumber: appointment.tokenNumber,
      paymentStatus: appointment.paymentStatus,
      hospital: appointment.hospitalName,
    });
    QRCode.toDataURL(qrData, { width: 200, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } })
      .then(setQrCodeUrl)
      .catch(console.error);
  }, [patient.id, appointment]);

  const formatDate = () => {
    if (!appointment.appointmentDate) return '';
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const d = new Date(appointment.appointmentDate);
    return `${monthNames[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const getTimeSlot = () => {
    if (!appointment.appointmentTime) return '';
    const start = formatTime(appointment.appointmentTime);
    const [h, m] = appointment.appointmentTime.split(':');
    const endMin = (parseInt(m) + 10) % 60;
    const endHour = parseInt(h) + Math.floor((parseInt(m) + 10) / 60);
    const end = formatTime(`${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`);
    return `${start} - ${end}`;
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `appointment-card-${patient.id}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download card. Please try again.');
    }
  };

  const paymentMethod = appointment.paymentMethod || 'cash';
  const txnId = appointment.khaltiTransactionId
    ? `KHL-${appointment.khaltiTransactionId.slice(-8).toUpperCase()}`
    : appointment.transactionId
    ? `TXN-${appointment.transactionId.slice(-8).toUpperCase()}`
    : '';

  return (
    <div
      className="appointment-card-overlay"
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)', display: 'flex',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 1000, padding: '1rem', backdropFilter: 'blur(5px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#f8fafc', borderRadius: '20px',
          maxWidth: '580px', width: '100%', maxHeight: '90vh',
          overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
          position: 'relative', padding: '1.5rem',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            width: '36px', height: '36px', borderRadius: '50%',
            border: 'none', background: 'rgba(0,0,0,0.1)',
            color: '#1f2937', fontSize: '1.4rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, lineHeight: 1,
          }}
        >×</button>

        {/* Title */}
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: '#1a2e35', fontSize: '1.3rem', paddingRight: '2rem' }}>
          Your Appointment Card
        </h2>
        <p style={{ textAlign: 'center', marginBottom: '1.25rem', color: '#64748b', fontSize: '0.88rem' }}>
          Show this card at the hospital reception
        </p>

        {/* ── The Card (same design as BookingConfirmed) ── */}
        <div ref={cardRef} className="digital-patient-card">

          {/* Hospital Header */}
          <div className="card-hospital-header">
            <div className="hospital-logo-section">
              <div className="hospital-logo-circle">
                <span style={{ fontSize: '1.1rem' }}>🏥</span>
              </div>
              <div className="hospital-info">
                <div className="hospital-name">
                  {appointment.hospitalName || 'HEALTHMANDALA HOSPITAL'}
                </div>
                <div className="hospital-location" style={{ color: '#ffffff' }}>
                  Nepal
                </div>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="card-patient-info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>PATIENT:</span>
                <span style={{ fontWeight: 700, color: '#0f4c75', textTransform: 'uppercase' }}>{patient.name}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>AGE/SEX:</span>
                <span style={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>
                  {patient.age ? `${patient.age} Y` : '—'} / {patient.gender ? patient.gender.charAt(0).toUpperCase() : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>PATIENT ID (MRN):</span>
                <span style={{ fontWeight: 700, color: '#0f4c75', fontFamily: 'Courier New, monospace', letterSpacing: '1px' }}>{patient.id}</span>
              </div>
              {patient.phone && (
                <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>PHONE:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{patient.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code + Appointment Details side by side */}
          <div className="card-middle-section">
            {/* QR Code */}
            <div className="card-qr-section">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="QR Code" className="qr-code-image" />
              ) : (
                <div className="qr-code-placeholder">
                  <div className="qr-loading">Generating<br />QR...</div>
                </div>
              )}
              <div className="qr-instruction">Scan at Reception</div>
            </div>

            {/* Appointment Details */}
            <div className="card-appointment-details">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>TOKEN NO:</span>
                  <span style={{ fontWeight: 800, color: '#0f4c75', fontFamily: 'Courier New, monospace', fontSize: '1rem' }}>#{appointment.tokenNumber || '—'}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>DEPT:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>{appointment.doctorSpecialization || 'General'}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>DOCTOR:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>{appointment.doctorName}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>DATE:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>{formatDate()}</span>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>TIME:</span>
                  <span style={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>{getTimeSlot() || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Footer */}
          <div className="card-payment-footer">
            <div className="payment-status-badge">
              <span className="status-icon">✓</span>
              <span className="status-text">{appointment.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}</span>
            </div>
            <div className="payment-gateway">
              <div className="gateway-label">GATEWAY</div>
              <div className="gateway-value">{paymentMethod === 'khalti' ? 'Khalti' : 'Cash'}</div>
            </div>
            {txnId && (
              <div className="transaction-id">
                <div className="txn-label">TXN ID</div>
                <div className="txn-value">{txnId}</div>
              </div>
            )}
          </div>
        </div>

        {/* Download Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
          <button onClick={downloadCard} className="download-card-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Card
          </button>
        </div>

        {/* Notes */}
        <div className="card-notes" style={{ marginTop: '1rem' }}>
          <div className="note-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Please arrive 15 minutes before your appointment time</span>
          </div>
          <div className="note-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            <span>Save this card offline for easy access at the hospital</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCard;
