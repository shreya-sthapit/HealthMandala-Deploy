import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppointmentCard from './AppointmentCard';
import PrescriptionModal from './PrescriptionModal';
import './Appointments.css';
import { requireApproval } from '../../utils/approvalCheck';

// ── Icons ─────────────────────────────────────────────────────────────────────
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const HospitalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const TicketIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return {
    day: date.getDate(),
    month: monthNames[date.getMonth()],
    weekday: dayNames[date.getDay()],
    year: date.getFullYear(),
  };
};

const getStatusFromDate = (appointment) => {
  const appointmentDate = new Date(appointment.appointmentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  appointmentDate.setHours(0, 0, 0, 0);

  if (appointment.status === 'cancelled' || appointment.status === 'rejected') return 'cancelled';
  if (appointment.status === 'completed') return 'completed';
  // prescribed = doctor done but pharmacist not yet — still show as upcoming on patient side
  if (appointment.status === 'prescribed') return 'upcoming';
  if (appointmentDate < today) return 'completed';
  return 'upcoming';
};

const statusLabel = (status) => {
  const map = {
    'pending':    'Confirmed',
    'confirmed':  'Confirmed',
    'checked_in': 'Checked In',
    'prescribed': 'With Pharmacist',
    'completed':  'Completed',
    'cancelled':  'Cancelled',
    'rejected':   'Rejected',
  };
  return map[status] || status.charAt(0).toUpperCase() + status.slice(1);
};

// ── Component ─────────────────────────────────────────────────────────────────
const MyAppointments = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);

  useEffect(() => { fetchAppointments(); }, []);

  const fetchAppointments = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      let response;

      if (userData.id && userData.id !== 'null' && userData.id !== 'undefined') {
        response = await fetch(`http://localhost:5001/api/appointments/patient/${userData.id}`);
      } else if (userData.firstName && userData.lastName) {
        const patientName = `${userData.firstName} ${userData.lastName}`;
        const patientPhone = userData.phone || 'undefined';
        response = await fetch(
          `http://localhost:5001/api/appointments/patient-by-info/${encodeURIComponent(patientName)}/${encodeURIComponent(patientPhone)}`
        );
      } else {
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) setAppointments(data.appointments);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const approved = await requireApproval(userData.id, 'patient');
    if (!approved) return;
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;

    try {
      const response = await fetch(`http://localhost:5001/api/appointments/cancel/${appointmentId}`, { method: 'PUT' });
      const data = await response.json();
      if (data.success) fetchAppointments();
      else alert('Failed to cancel appointment');
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel appointment');
    }
  };

  const handleProtectedAction = async (action) => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const approved = await requireApproval(userData.id, 'patient');
    if (approved) action();
  };

  // Split into upcoming vs past (completed + cancelled)
  const upcomingList = appointments.filter(apt => getStatusFromDate(apt) === 'upcoming');
  const pastList     = appointments.filter(apt => getStatusFromDate(apt) !== 'upcoming');
  const displayList  = activeTab === 'upcoming' ? upcomingList : pastList;

  const upcomingCount = upcomingList.length;
  const pastCount     = pastList.length;

  return (
    <div className="appointments-container">
      <div className="appointments-content">

        {/* Page Header */}
        <div className="apt-page-header">
          <div>
            <h1>My Appointments</h1>
            <p className="apt-page-sub">Track your upcoming visits and past consultations</p>
          </div>
          <Link to="/find-doctors" className="apt-book-btn">+ Book Appointment</Link>
        </div>

        {/* Segmented Control */}
        <div className="apt-segment-wrap">
          <div className="apt-segment">
            <button
              className={`apt-seg-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Appointments
              {upcomingCount > 0 && <span className="apt-seg-count">{upcomingCount}</span>}
            </button>
            <button
              className={`apt-seg-btn ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past Consultations
              {pastCount > 0 && <span className="apt-seg-count past">{pastCount}</span>}
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="apt-loading">
            <div className="apt-spinner" />
            <p>Loading appointments…</p>
          </div>
        ) : displayList.length > 0 ? (
          <div className="apt-list">
            {displayList.map((apt) => {
              const fd     = formatDate(apt.appointmentDate);
              const status = getStatusFromDate(apt);
              const isUpcoming   = status === 'upcoming';
              const isCompleted  = status === 'completed';
              const isCancelled  = status === 'cancelled';

              return (
                <div key={apt._id} className={`apt-card ${status}`}>

                  {/* Status dot + label */}
                  <div className="apt-card-status-row">
                    <span className={`apt-status-dot ${status}`} />
                    <span className={`apt-status-label ${status}`}>{statusLabel(apt.status)}</span>
                    {apt.tokenNumber && isUpcoming && (
                      <span className="apt-token">
                        <TicketIcon /> Token #{apt.tokenNumber}
                      </span>
                    )}
                  </div>

                  {/* Main body */}
                  <div className="apt-card-body">

                    {/* Date box */}
                    <div className={`apt-date-box ${isCancelled ? 'muted' : ''}`}>
                      <span className="apt-date-month">{fd.month}</span>
                      <span className="apt-date-day">{fd.day}</span>
                      <span className="apt-date-weekday">{fd.weekday}</span>
                    </div>

                    {/* Info */}
                    <div className="apt-info">
                      <h3 className={`apt-doctor-name ${isCancelled ? 'muted-text' : ''}`}>
                        {apt.doctorName}
                      </h3>
                      <p className="apt-specialty">{apt.doctorSpecialization}</p>

                      <div className="apt-meta">
                        {apt.hospitalName && (
                          <span className="apt-meta-item">
                            <HospitalIcon /> {apt.hospitalName}
                          </span>
                        )}
                        <span className="apt-meta-item">
                          <CalendarIcon /> {fd.weekday}, {fd.month} {fd.day}, {fd.year}
                        </span>
                        {apt.appointmentTime && (
                          <span className="apt-meta-item">
                            <ClockIcon /> {apt.appointmentTime}
                          </span>
                        )}
                        {apt.consultationFee && (
                          <span className="apt-meta-item fee">Rs. {apt.consultationFee}</span>
                        )}
                      </div>

                      {apt.reasonForVisit && (
                        <p className="apt-reason">Reason: {apt.reasonForVisit}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="apt-actions">
                      {isUpcoming && (
                        <>
                          <button
                            className="apt-btn-primary"
                            onClick={() => handleProtectedAction(() => {
                              setSelectedAppointment(apt);
                              setShowCard(true);
                            })}
                          >
                            🎫 View Digital Card
                          </button>
                          <button
                            className="apt-btn-ghost danger"
                            onClick={() => cancelAppointment(apt._id)}
                          >
                            Cancel Booking
                          </button>
                        </>
                      )}
                      {isCompleted && (
                        <>
                          <button
                            className="apt-btn-primary"
                            onClick={() => handleProtectedAction(() => {
                              setSelectedAppointment(apt);
                              setShowCard(true);
                            })}
                          >
                            🎫 View Digital Card
                          </button>
                          <button
                            className="apt-btn-secondary"
                            onClick={() => handleProtectedAction(() => {
                              setSelectedAppointment(apt);
                              setShowPrescription(true);
                            })}
                          >
                            View Details
                          </button>
                        </>
                      )}
                      {isCancelled && (
                        <Link to="/find-doctors" className="apt-btn-primary">
                          Book Again
                        </Link>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="apt-empty">
            <div className="apt-empty-icon">
              {activeTab === 'upcoming' ? '📅' : '🗂️'}
            </div>
            <h3>No {activeTab === 'upcoming' ? 'upcoming appointments' : 'past consultations'}</h3>
            <p>
              {activeTab === 'upcoming'
                ? "You don't have any upcoming appointments scheduled."
                : "Your past consultations will appear here."}
            </p>
            {activeTab === 'upcoming' && (
              <Link to="/find-doctors" className="apt-btn-primary">Book Appointment</Link>
            )}
          </div>
        )}
      </div>

      {showCard && selectedAppointment && (
        <AppointmentCard
          appointment={selectedAppointment}
          onClose={() => { setShowCard(false); setSelectedAppointment(null); }}
        />
      )}

      {showPrescription && selectedAppointment && (
        <PrescriptionModal
          appointment={selectedAppointment}
          onClose={() => { setShowPrescription(false); setSelectedAppointment(null); }}
        />
      )}
    </div>
  );
};

export default MyAppointments;
