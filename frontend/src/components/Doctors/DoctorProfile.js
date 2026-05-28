import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import './Doctors.css';

const DoctorProfile = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch doctor data based on ID
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        setLoading(true);
        
        // First get all approved doctors
        const response = await fetch('http://localhost:5001/api/doctor/approved');
        const data = await response.json();
        
        if (data.success && data.doctors) {
          // Find the doctor with matching ID
          const foundDoctor = data.doctors.find(doc => doc.id === id);
          
          if (foundDoctor) {
            // Transform the data to match the component's expected format
            setDoctor({
              id: foundDoctor.id,
              name: foundDoctor.name,
              specialty: foundDoctor.specialty,
              qualifications: `${foundDoctor.experience} experience`,
              rating: foundDoctor.rating,
              reviews: Math.floor(foundDoctor.rating * 50), // Generate review count
              patients: foundDoctor.patients,
              experience: foundDoctor.experience,
              fee: foundDoctor.fee,
              hospital: foundDoctor.hospital,
              profilePhoto: foundDoctor.profilePhoto,
              schedule: foundDoctor.schedule, // Add full schedule
              lunchBreak: foundDoctor.lunchBreak,
              leaves: foundDoctor.leaves,
              about: `${foundDoctor.name} is a highly experienced ${foundDoctor.specialty.toLowerCase()} with ${foundDoctor.experience} of practice. Currently practicing at ${foundDoctor.hospital}.`,
              services: ['Consultation', 'Diagnosis', 'Treatment', 'Follow-up Care'],
              workingHours: (() => {
                // Use schedule array if available, otherwise fall back to availableDays
                if (foundDoctor.schedule && foundDoctor.schedule.length > 0) {
                  return foundDoctor.schedule
                    .filter(s => s.active)
                    .map(s => ({
                      day: s.day,
                      time: `${s.start} - ${s.end}`
                    }));
                } else if (foundDoctor.availableDays && foundDoctor.availableDays.length > 0) {
                  return foundDoctor.availableDays.map(day => ({
                    day: day,
                    time: `${foundDoctor.availableTimeStart} - ${foundDoctor.availableTimeEnd}`
                  }));
                }
                return [];
              })(),
              address: foundDoctor.address,
              reviews_list: [
                { id: 1, name: 'Patient A.', rating: 5, text: 'Excellent doctor! Very professional and caring.', date: '2 weeks ago' },
                { id: 2, name: 'Patient B.', rating: 5, text: `Dr. ${foundDoctor.name.split(' ')[1]} is very knowledgeable. Highly recommend!`, date: '1 month ago' },
                { id: 3, name: 'Patient C.', rating: 4, text: 'Good experience overall. Great consultation.', date: '1 month ago' }
              ]
            });
          } else {
            setError('Doctor not found');
          }
        } else {
          setError('Failed to load doctor information');
        }
      } catch (error) {
        console.error('Error fetching doctor profile:', error);
        setError('Failed to load doctor information');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDoctorProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="profile-container">
        <nav className="top-navbar">
          <Link to="/home" className="logo">
            <img src="/logo.png" alt="HealthMandala" />
            <span>HealthMandala</span>
          </Link>
        </nav>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading doctor profile...</p>
        </div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="profile-container">
        <nav className="top-navbar">
          <Link to="/home" className="logo">
            <img src="/logo.png" alt="HealthMandala" />
            <span>HealthMandala</span>
          </Link>
        </nav>
        <div className="error-state">
          <p>{error || 'Doctor not found'}</p>
          <Link to="/find-doctors" className="btn-primary">Back to Doctors</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <nav className="top-navbar">
        <Link to="/home" className="logo">
          <img src="/logo.png" alt="HealthMandala" />
          <span>HealthMandala</span>
        </Link>
        <div className="nav-right">
          <div className="nav-icons">
            <button className="nav-icon" title="Notifications">N</button>
            <Link to="/profile" className="user-menu">
              <div className="user-avatar">
                {JSON.parse(localStorage.getItem('user') || '{}').firstName?.[0] || 'U'}
                {JSON.parse(localStorage.getItem('user') || '{}').lastName?.[0] || ''}
              </div>
            </Link>
          </div>
        </div>
      </nav>

      <div className="profile-content">
        <div className="page-header">
          <Link to="/find-doctors" className="back-btn">← Back to Doctors</Link>
        </div>

        <div className="profile-layout">
          <div className="profile-main">
            {/* Header Card */}
            <div className="profile-header-card">
              <div className="profile-header">
                <div className="profile-avatar">
                  {doctor.profilePhoto ? (
                    <img 
                      src={`http://localhost:5001/${doctor.profilePhoto}`} 
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
                <div className="profile-info">
                  <h1>{doctor.name}</h1>
                  <p className="specialty">{doctor.specialty}</p>
                  <p className="qualifications">{doctor.qualifications}</p>
                  <div className="profile-badges">
                    <span className="badge verified">Verified</span>
                    <span className="badge">HealthMandala Clinic</span>
                  </div>
                </div>
              </div>
              <div className="profile-stats">
                <div className="profile-stat">
                  <div className="value rating">{doctor.rating}</div>
                  <div className="label">{doctor.reviews} Reviews</div>
                </div>
                <div className="profile-stat">
                  <div className="value">{doctor.patients}</div>
                  <div className="label">Patients</div>
                </div>
                <div className="profile-stat">
                  <div className="value">{doctor.experience}</div>
                  <div className="label">Experience</div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="profile-section">
              <h2>About</h2>
              <p>{doctor.about}</p>
            </div>

            {/* Services */}
            <div className="profile-section">
              <h2>Services</h2>
              <div className="services-list">
                {doctor.services.map((service, index) => (
                  <span key={index} className="service-tag">{service}</span>
                ))}
              </div>
            </div>

            {/* Working Hours */}
            <div className="profile-section">
              <h2>Working Hours</h2>
              <div className="working-hours">
                {doctor.workingHours.map((item, index) => (
                  <div key={index} className="hour-row">
                    <span className="day">{item.day}</span>
                    <span className={`time ${item.time === 'Closed' ? 'closed' : ''}`}>
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="profile-section">
              <h2>Patient Reviews</h2>
              <div className="reviews-list">
                {doctor.reviews_list.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <span className="reviewer-name">{review.name}</span>
                      <span className="review-rating">
                        {review.rating}/5
                      </span>
                    </div>
                    <p className="review-text">{review.text}</p>
                    <span className="review-date">{review.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="booking-sidebar">
            <h3>Book Appointment</h3>
            <div className="fee-display">
              <div className="amount">Rs. {doctor.fee}</div>
              <div className="label">Consultation Fee</div>
            </div>
            <div className="availability-info">
              <h4>Available Days</h4>
              <div className="next-available">
                {doctor.workingHours && doctor.workingHours.length > 0 ? (
                  <div className="availability-schedule">
                    {doctor.workingHours.map((schedule, index) => (
                      <div key={index} className="schedule-item">
                        <span className="schedule-day">{schedule.day}</span>
                        <span className="schedule-time">{schedule.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span>Schedule not available</span>
                )}
              </div>
            </div>
            <Link 
              to="/book-appointment" 
              state={{ preSelectedDoctor: {
                id: doctor.id,
                name: doctor.name,
                specialty: doctor.specialty,
                specialtyId: doctor.specialty.toLowerCase().replace(/\s+/g, ''),
                rating: doctor.rating,
                patients: doctor.patients,
                experience: doctor.experience,
                fee: doctor.fee,
                hospital: doctor.hospital,
                profilePhoto: doctor.profilePhoto,
                schedule: doctor.schedule,
                lunchBreak: doctor.lunchBreak,
                leaves: doctor.leaves
              }}}
              className="book-btn" 
              style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              Book Appointment
            </Link>
            <div className="contact-options">
              <button className="contact-btn">Call Clinic</button>
              <button className="contact-btn">Send Message</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
