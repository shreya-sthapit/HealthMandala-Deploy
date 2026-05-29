import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import './Doctors.css';

const FindDoctors = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data as fallback
  const mockDoctors = [
    { id: 1, name: 'Dr. Anita Sharma', specialty: 'Cardiologist', rating: 4.9, patients: '1.2k', experience: '15 yrs', fee: 1500, available: true },
    { id: 2, name: 'Dr. Rajesh Patel', specialty: 'Neurologist', rating: 4.8, patients: '980', experience: '12 yrs', fee: 1200, available: true },
    { id: 3, name: 'Dr. Priya Thapa', specialty: 'Pediatrician', rating: 4.9, patients: '1.5k', experience: '10 yrs', fee: 1000, available: false },
    { id: 4, name: 'Dr. Suman Gurung', specialty: 'Orthopedic', rating: 4.7, patients: '850', experience: '8 yrs', fee: 1100, available: true },
    { id: 5, name: 'Dr. Maya Shrestha', specialty: 'Dermatologist', rating: 4.8, patients: '1.1k', experience: '11 yrs', fee: 1300, available: true },
    { id: 6, name: 'Dr. Bikash Adhikari', specialty: 'Cardiologist', rating: 4.6, patients: '720', experience: '7 yrs', fee: 900, available: true }
  ];

  // Fetch approved doctors from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_BASE_URL + '/api/doctor/approved');
        const data = await response.json();
        
        if (data.success && data.doctors && data.doctors.length > 0) {
          console.log('Fetched real doctors:', data.doctors.length);
          setDoctors(data.doctors);
        } else {
          console.log('No approved doctors found, using mock data');
          setDoctors(mockDoctors);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        console.log('Using mock data due to error');
        setDoctors(mockDoctors);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const specialties = ['Cardiologist', 'Neurologist', 'Pediatrician', 'Orthopedic', 'Dermatologist', 'Ophthalmologist', 'Dentist', 'Gynecologist'];

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = !specialty || doc.specialty === specialty;
    return matchesSearch && matchesSpecialty;
  });

  if (loading) {
    return (
      <div className="doctors-container">
        <nav className="top-navbar">
          <Link to="/home" className="logo">
            <img src="/logo.png" alt="HealthMandala" />
            <span>HealthMandala</span>
          </Link>
        </nav>
        <div className="doctors-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading doctors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="doctors-container">
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

      <div className="doctors-content">
        <div className="page-header">
          <Link to="/home" className="back-btn">← Back to Home</Link>
          <h1>Find Doctors</h1>
        </div>

        <div className="doctors-filters">
          <input
            type="text"
            className="search-input"
            placeholder="Search doctors by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="filter-select"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          >
            <option value="">All Specialties</option>
            {specialties.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div className="doctors-grid">
          {filteredDoctors.map((doctor) => (
            <Link to={`/doctor/${doctor.id}`} key={doctor.id} className="doctor-card-full">
              <div className="doctor-card-header">
                <div className="doctor-avatar-large">
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
                <div className="doctor-card-info">
                  <h3>{doctor.name}</h3>
                  <p className="specialty">{doctor.specialty}</p>
                  <p className="experience">{doctor.experience} experience</p>
                </div>
              </div>
              <div className="doctor-card-stats">
                <div className="stat">
                  <div className="value rating">{doctor.rating}</div>
                  <div className="label">Rating</div>
                </div>
                <div className="stat">
                  <div className="value">{doctor.patients}</div>
                  <div className="label">Patients</div>
                </div>
                <div className="stat">
                  <div className="value">{doctor.experience}</div>
                  <div className="label">Experience</div>
                </div>
              </div>
              <div className="doctor-card-footer">
                <div className="consultation-fee">
                  Rs. {doctor.fee} <span>/ visit</span>
                </div>
                <Link 
                  to="/find-doctors" 
                  state={{ preSelectedDoctor: doctor }}
                  className="book-btn-small"
                  style={{ textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                >
                  Book Now
                </Link>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FindDoctors;
