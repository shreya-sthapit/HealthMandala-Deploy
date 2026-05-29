import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import API_BASE_URL from '../../config/api';
import './Booking.css';

const BookingConfirmed = () => {
  const location = useLocation();
  const booking = location.state?.booking;
  const appointmentId = location.state?.appointmentId;
  const paymentStatus = location.state?.paymentStatus || 'pending';
  const paymentMethod = location.state?.paymentMethod || 'cash';
  const cardRef = useRef(null);

  const [patient, setPatient] = useState({
    name: 'Loading...',
    id: 'MC-000000',
    age: '',
    gender: '',
    phone: '',
    address: ''
  });

  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [transactionId, setTransactionId] = useState('');

  useEffect(() => {
    // If the booking was for a dependent, use their data directly from bookingState
    if (booking?.activePatient?.isDependent) {
      const ap = booking.activePatient;
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setPatient({
        name: ap.name || 'Patient',
        id: `MC-${(userData.id || '000000').slice(-6).toUpperCase()}`,
        age: ap.age || '',
        gender: ap.gender || '',
        phone: ap.phone || '',
        address: ''
      });
      generateTransactionId();
    } else {
      fetchPatientProfile();
      generateTransactionId();
    }
  }, []);

  // Regenerate QR code once patient data is loaded
  useEffect(() => {
    if (patient.id !== 'MC-000000') {
      generateQRCode();
    }
  }, [patient.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateTransactionId = () => {
    // Generate transaction ID based on payment method
    const timestamp = Date.now().toString();
    if (paymentMethod === 'khalti') {
      setTransactionId(`KHL-TEST-${timestamp.slice(-8)}`);
    } else {
      setTransactionId(`TXN-${timestamp.slice(-8)}`);
    }
  };

  const generateQRCode = async () => {
    try {
      const qrData = JSON.stringify({
        patientId: patient.id,
        appointmentId: appointmentId || `APT-${Date.now()}`,
        doctorName: booking?.doctor?.name,
        date: booking?.date?.full,
        time: booking?.appointmentTime,
        tokenNumber: booking?.tokenNumber,
        paymentStatus: paymentStatus,
        hospital: Array.isArray(booking?.doctor?.hospital) ? booking.doctor.hospital[0] : booking?.doctor?.hospital
      });
      
      const url = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const fetchPatientProfile = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (userData.id) {
        const response = await fetch(`${API_BASE_URL}/api/patient/profile/${userData.id}`);
        const data = await response.json();
        
        if (data.success && data.profile) {
          const profile = data.profile;
          setPatient({
            name: `${profile.firstName} ${profile.lastName}`,
            id: `MC-${userData.id.slice(-6).toUpperCase()}`,
            age: profile.age || calculateAge(profile.dateOfBirth),
            gender: profile.gender || 'Not specified',
            phone: profile.mobileNumber || userData.phone || '',
            address: `${profile.district || ''}, ${profile.municipality || ''}`.trim() || 'Not specified'
          });
        } else {
          setPatient({
            name: userData.firstName && userData.lastName 
              ? `${userData.firstName} ${userData.lastName}` 
              : 'Patient',
            id: `MC-${userData.id?.slice(-6).toUpperCase() || '000000'}`,
            age: '',
            gender: '',
            phone: userData.phone || '',
            address: ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching patient profile:', error);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getTimeSlot = () => {
    if (!booking?.appointmentTime) return '';
    const startTime = formatTime(booking.appointmentTime);
    // Add 10 minutes for end time
    const [hours, minutes] = booking.appointmentTime.split(':');
    const endMinutes = (parseInt(minutes) + 10) % 60;
    const endHours = parseInt(hours) + Math.floor((parseInt(minutes) + 10) / 60);
    const endTime = formatTime(`${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`);
    return `${startTime} - ${endTime}`;
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const link = document.createElement('a');
      link.download = `appointment-card-${patient.id}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error downloading card:', error);
      alert('Failed to download card. Please try again.');
    }
  };

  const formatDate = () => {
    if (!booking?.date) return '';
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const date = new Date(booking.date.full);
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  return (
    <div className="booking-container">
      <div className="booking-content" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        
        {/* Digital Patient Card */}
        {booking && (
          <div className="digital-patient-card-wrapper">
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1a2e35', fontSize: '1.5rem' }}>
              Your Appointment Card
            </h2>
            <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#64748b' }}>
              Show this card at the hospital reception
            </p>

            {/* The Card */}
            <div ref={cardRef} className="digital-patient-card">
              {/* Hospital Header */}
              <div className="card-hospital-header">
                <div className="hospital-logo-section">
                  <div className="hospital-logo-circle">
                    <span style={{ fontSize: '1.5rem' }}>🏥</span>
                  </div>
                  <div className="hospital-info">
                    <div className="hospital-name">
                      {Array.isArray(booking.doctor?.hospital) ? booking.doctor.hospital[0] : booking.doctor?.hospital || 'NEPAL MEDICITI HOSPITAL'}
                    </div>
                    <div className="hospital-location" style={{ color: '#ffffff' }}>
                      Nakhu, Lalitpur
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
                    <span style={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>{patient.age ? `${patient.age} Y` : '—'} / {patient.gender ? patient.gender.charAt(0).toUpperCase() : 'M'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>PATIENT ID (MRN):</span>
                    <span style={{ fontWeight: 700, color: '#0f4c75', fontFamily: 'Courier New, monospace', letterSpacing: '1px' }}>{patient.id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>PHONE:</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{patient.phone || '98XXXXXXXX'}</span>
                  </div>
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
                      <div className="qr-loading">Generating<br/>QR...</div>
                    </div>
                  )}
                  <div className="qr-instruction">Scan at Reception</div>
                </div>

                {/* Appointment Details */}
                <div className="card-appointment-details">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>TOKEN NO:</span>
                      <span style={{ fontWeight: 800, color: '#0f4c75', fontFamily: 'Courier New, monospace', fontSize: '1rem' }}>#{booking.tokenNumber || '00'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>DEPT:</span>
                      <span style={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>{booking.doctor?.specialty || 'General'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>DOCTOR:</span>
                      <span style={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>{booking.doctor?.name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>DATE:</span>
                      <span style={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>{formatDate()}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', fontSize: '0.82rem' }}>
                      <span style={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>TIME:</span>
                      <span style={{ fontWeight: 600, color: '#1e293b', textTransform: 'uppercase' }}>{getTimeSlot()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Status Footer */}
              <div className="card-payment-footer">
                <div className="payment-status-badge">
                  <span className="status-icon">✓</span>
                  <span className="status-text">PAID</span>
                </div>
                <div className="payment-gateway">
                  <div className="gateway-label">GATEWAY</div>
                  <div className="gateway-value">{paymentMethod === 'khalti' ? 'Khalti' : 'Cash'}</div>
                </div>
                {transactionId && (
                  <div className="transaction-id">
                    <div className="txn-label">TXN ID</div>
                    <div className="txn-value">{transactionId}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Download Button */}
            <div className="card-actions-section">
              <button onClick={downloadCard} className="download-card-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Card
              </button>
            </div>

            {/* Important Notes */}
            <div className="card-notes">
              <div className="note-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>Please arrive 15 minutes before your appointment time</span>
              </div>
              <div className="note-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
                <span>Save this card offline for easy access at the hospital</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'center' }}>
          <Link to="/home" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            border: '2px solid #e2e8f0',
            background: '#ffffff',
            color: '#475569',
            fontWeight: 600,
            fontSize: '0.9rem',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}>← Back to Home</Link>
          <Link to="/my-appointments" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.75rem 1.5rem',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00a896, #028090)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.9rem',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
          }}>View My Appointments →</Link>
        </div>

        {/* Footer spacer */}
        <div style={{ height: '3rem' }} />
      </div>
    </div>
  );
};

export default BookingConfirmed;
