import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PatientDetailModal from './PatientDetailModal';
import './DoctorPatients.css';

const DoctorPatients = ({ embedded = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Fetching patients for doctor:', userData);
      
      if (userData.id) {
        const response = await fetch(`http://localhost:5001/api/appointments/doctor-patients/${userData.id}`);
        const data = await response.json();
        console.log('Patients response:', data);
        
        if (data.success) {
          setPatients(data.patients);
        }
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.phone && p.phone.includes(searchTerm))
  );

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.lastVisit) - new Date(a.lastVisit);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'visits') {
      return b.visits - a.visits;
    }
    return 0;
  });

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="doctor-patients">
      {!embedded && (
        <nav className="top-navbar">
          <Link to="/doctor-dashboard" className="logo">
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
      )}

      <div className="patients-content">
        {!embedded && (
          <div className="page-header">
            <Link to="/doctor-dashboard" className="back-btn">← Back to Dashboard</Link>
            <h1>My Patients</h1>
          </div>
        )}

        <div className="patients-toolbar">
          <div className="search-box">
            <span>Search</span>
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Sort by: Recent</option>
            <option value="name">Sort by: Name</option>
            <option value="visits">Sort by: Visits</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-state">Loading patients...</div>
        ) : sortedPatients.length === 0 ? (
          <div className="patients-empty-state">
            <p>No patients found. Patients will appear here once they have completed appointments.</p>
          </div>
        ) : (
          <div className="patients-grid">
            {sortedPatients.map((patient) => (
                <div key={patient.id} className="patient-card">
                  <div className="patient-card-header">
                    {patient.profilePhoto ? (
                      <img 
                        src={`http://localhost:5001${patient.profilePhoto}`} 
                        alt={patient.name}
                        className="avatar-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="avatar" style={{ display: patient.profilePhoto ? 'none' : 'flex' }}>
                      {patient.firstName?.[0] || 'P'}
                    </div>
                    <div className="info">
                      <h3>{patient.name}</h3>
                      <p>
                        {patient.age ? `${patient.age} yrs` : 'Age N/A'}
                        {patient.gender ? `, ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}` : ''}
                      </p>
                      {patient.bloodGroup && (
                        <span className="blood-group">{patient.bloodGroup}</span>
                      )}
                    </div>
                  </div>
                  <div className="patient-card-body">
                    <div className="patient-stat">
                      <div className="value">{patient.visits}</div>
                      <div className="label">Total Visits</div>
                    </div>
                    <div className="patient-stat">
                      <div className="value">{formatDate(patient.lastVisit)}</div>
                      <div className="label">Last Visit</div>
                    </div>
                  </div>
                  {patient.medicalConditions && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
                      Condition: <strong style={{ color: 'var(--text-dark)' }}>{patient.medicalConditions}</strong>
                    </p>
                  )}
                  {patient.lastVisitReason && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '1rem' }}>
                      Last Visit: <strong style={{ color: 'var(--text-dark)' }}>{patient.lastVisitReason}</strong>
                    </p>
                  )}
                  <div className="patient-card-footer">
                    <button className="btn secondary">View Records</button>
                    <button 
                      className="btn primary"
                      onClick={() => setSelectedPatient(patient)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
            ))}
          </div>
        )}
      </div>

      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
        />
      )}
    </div>
  );
};

export default DoctorPatients;
