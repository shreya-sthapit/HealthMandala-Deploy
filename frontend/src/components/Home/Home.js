import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import './Home.css';
import { requireApproval } from '../../utils/approvalCheck';

const Home = () => {
  const [user, setUser] = useState({ firstName: 'User', lastName: '' });
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [topDoctors, setTopDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.firstName) setUser(userData);
    if (userData.id) fetchDashboardData(userData.id);
  }, []);

  const fetchDashboardData = async (userId) => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [appointmentsRes, doctorsRes] = await Promise.all([
        fetchUpcomingAppointments(userId),
        fetchApprovedDoctors()
      ]);

      // Process appointments
      if (appointmentsRes.success) {
        setUpcomingAppointments(appointmentsRes.appointments || []);
      }

      // Process doctors and generate specialties
      if (doctorsRes.success) {
        const doctors = doctorsRes.doctors || [];
        setTopDoctors(doctors.slice(0, 3)); // Top 3 doctors
        
        // Generate specialties from doctors data
        const specialtyCount = {};
        doctors.forEach(doctor => {
          const specialty = doctor.specialty;
          specialtyCount[specialty] = (specialtyCount[specialty] || 0) + 1;
        });
        
        const specialtiesData = Object.entries(specialtyCount)
          .map(([name, count]) => ({
            name,
            doctors: `${count} Doctor${count !== 1 ? 's' : ''}`
          }))
          .slice(0, 6); // Top 6 specialties
        
        setSpecialties(specialtiesData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingAppointments = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/patient/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        // Filter for upcoming appointments and format them
        const now = new Date();
        const upcoming = data.appointments
          .filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate >= now && apt.status !== 'cancelled';
          })
          .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
          .slice(0, 3) // Show only next 3 appointments
          .map(apt => ({
            id: apt._id,
            doctor: apt.doctorName,
            specialty: apt.doctorSpecialization,
            date: formatDate(apt.appointmentDate),
            time: apt.appointmentTime,
            initials: getInitials(apt.doctorName),
            status: apt.status,
            paymentStatus: apt.paymentStatus
          }));
        
        return { success: true, appointments: upcoming };
      }
      return { success: false, appointments: [] };
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return { success: false, appointments: [] };
    }
  };

  const fetchApprovedDoctors = async () => {
    try {
      const response = await fetch(API_BASE_URL + '/api/doctor/approved');
      return await response.json();
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return { success: false, doctors: [] };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[1][0] + (parts[2] ? parts[2][0] : '');
    }
    return parts[0][0];
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/appointments/cancel/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        // Refresh appointments after cancellation
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        fetchDashboardData(userData.id);
        alert('Appointment cancelled successfully');
      } else {
        alert(data.error || 'Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    }
  };

  const refreshDashboard = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    fetchDashboardData(userData.id);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    
    // Redirect to landing page
    navigate('/');
  };

  const handleProtectedAction = async (e, action) => {
    e.preventDefault();
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const approved = await requireApproval(userData.id, 'patient');
    if (approved) {
      action();
    }
  };

  return (
    <div className="home-container">
      {/* Top Navbar */}
      <nav className="top-navbar">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="HealthMandala" />
          <span>HealthMandala</span>
        </Link>

        <div className="nav-right">
          <div className="search-bar">
            <button>Search</button>
            <input type="text" placeholder="Search doctors, specialties..." />
          </div>
          <div className="nav-icons">
            <button className="nav-icon" title="Notifications">N</button>
            <div className="user-menu-container" ref={dropdownRef}>
              <button 
                className="user-menu"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <Link to="/profile" onClick={() => setShowUserMenu(false)}>
                    Profile
                  </Link>
                  <button onClick={handleLogout} className="logout-btn">
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="home-content">
        {/* Quick Actions */}
        <section className="quick-actions">
          <a 
            href="/find-doctors" 
            className="action-card"
            onClick={(e) => handleProtectedAction(e, () => navigate('/find-doctors'))}
          >
            <div className="action-icon blue">+</div>
            <div>
              <h3>Book Appointment</h3>
              <p>Schedule a visit</p>
            </div>
          </a>
          <a 
            href="/my-appointments" 
            className="action-card"
            onClick={(e) => handleProtectedAction(e, () => navigate('/my-appointments'))}
          >
            <div className="action-icon green">A</div>
            <div>
              <h3>My Appointments</h3>
              <p>View all bookings</p>
            </div>
          </a>
          <a 
            href="/find-doctors" 
            className="action-card"
            onClick={(e) => handleProtectedAction(e, () => navigate('/find-doctors'))}
          >
            <div className="action-icon orange">D</div>
            <div>
              <h3>Find Doctors</h3>
              <p>Browse specialists</p>
            </div>
          </a>
          <a 
            href="/medical-records" 
            className="action-card"
            onClick={(e) => handleProtectedAction(e, () => navigate('/medical-records'))}
          >
            <div className="action-icon purple">R</div>
            <div>
              <h3>Medical Records</h3>
              <p>View history</p>
            </div>
          </a>
        </section>

        {/* Upcoming Appointments */}
        <section className="appointments-section">
          <div className="section-header">
            <h2>Upcoming Appointments</h2>
            <a 
              href="/my-appointments"
              onClick={(e) => handleProtectedAction(e, () => navigate('/my-appointments'))}
            >
              View All
            </a>
          </div>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading appointments...</p>
            </div>
          ) : upcomingAppointments.length > 0 ? (
            <div className="appointments-list">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="appointment-card">
                  <div className="appointment-info">
                    <div className="doctor-avatar">{apt.initials}</div>
                    <div className="appointment-details">
                      <h3>{apt.doctor}</h3>
                      <p className="specialty">{apt.specialty}</p>
                      <div className="appointment-meta">
                        <span>{apt.date}</span>
                        <span>{apt.time}</span>
                        <span className={`status ${apt.status}`}>{apt.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="appointment-actions">
                    <button 
                      className="btn-sm btn-cancel"
                      onClick={async () => {
                        const userData = JSON.parse(localStorage.getItem('user') || '{}');
                        const approved = await requireApproval(userData.id, 'patient');
                        if (approved) {
                          handleCancelAppointment(apt.id);
                        }
                      }}
                    >
                      Cancel
                    </button>
                    <a 
                      href="/find-doctors"
                      className="btn-sm btn-reschedule"
                      style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                      onClick={(e) => handleProtectedAction(e, () => navigate('/find-doctors'))}
                    >
                      Reschedule
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-appointments">
              <p>No upcoming appointments</p>
              <a 
                href="/find-doctors" 
                className="btn btn-primary"
                onClick={(e) => handleProtectedAction(e, () => navigate('/find-doctors'))}
              >
                Book Now
              </a>
            </div>
          )}
        </section>

        {/* Popular Specialties */}
        <section className="specialties-section">
          <div className="section-header">
            <h2>Popular Specialties</h2>
            <a 
              href="/find-doctors"
              onClick={(e) => handleProtectedAction(e, () => navigate('/find-doctors'))}
            >
              View All
            </a>
          </div>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading specialties...</p>
            </div>
          ) : (
            <div className="specialties-grid">
              {specialties.map((spec, index) => (
                <a 
                  href={`/find-doctors?specialty=${spec.name}`} 
                  key={index} 
                  className="specialty-card"
                  onClick={(e) => handleProtectedAction(e, () => navigate(`/find-doctors?specialty=${spec.name}`))}
                >
                  <div className="specialty-icon">{spec.name[0]}</div>
                  <h4>{spec.name}</h4>
                  <p>{spec.doctors}</p>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Top Doctors */}
        <section className="doctors-section">
          <div className="section-header">
            <h2>Top Rated Doctors</h2>
            <a 
              href="/find-doctors"
              onClick={(e) => handleProtectedAction(e, () => navigate('/find-doctors'))}
            >
              View All
            </a>
          </div>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading doctors...</p>
            </div>
          ) : (
            <div className="doctors-grid">
              {topDoctors.map((doctor) => (
                <a 
                  href={`/doctor/${doctor.id}`} 
                  key={doctor.id} 
                  className="doctor-card"
                  onClick={(e) => handleProtectedAction(e, () => navigate(`/doctor/${doctor.id}`))}
                >
                  <div className="doctor-avatar">
                    {doctor.profilePhoto ? (
                      <img 
                        src={`/${doctor.profilePhoto}`} 
                        alt={doctor.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="avatar-fallback" style={{ display: doctor.profilePhoto ? 'none' : 'flex' }}>
                      {doctor.name.split(' ')[1][0]}
                    </div>
                  </div>
                  <div className="doctor-info">
                    <h3>{doctor.name}</h3>
                    <p className="specialty">{doctor.specialty}</p>
                    <div className="doctor-stats">
                      <span className="rating">{doctor.rating.toFixed(1)} rating</span>
                      <span>{doctor.patients} patients</span>
                      <span>{doctor.experience}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;
