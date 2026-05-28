import { useEffect } from 'react';
import './DoctorProfileModal.css';

const DoctorProfileModal = ({ doctor, onClose, nextAvailable }) => {
  // Close modal on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const photoPath = doctor.profilePhoto
    ? doctor.profilePhoto.replace(/\\/g, '/').replace(/^backend\//, '')
    : null;

  const getInitial = () => {
    return doctor.name?.split(' ')[1]?.[0] || doctor.name?.[0] || 'D';
  };

  return (
    <div className="doctor-modal-overlay" onClick={onClose}>
      <div className="doctor-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>

        <div className="modal-header">
          <div className="modal-doctor-photo">
            {photoPath ? (
              <img 
                src={`http://localhost:5001/${photoPath}`} 
                alt={doctor.name}
                onError={(e) => { 
                  e.target.style.display = 'none'; 
                  e.target.nextSibling.style.display = 'flex'; 
                }}
              />
            ) : null}
            <div className="modal-photo-fallback" style={{ display: photoPath ? 'none' : 'flex' }}>
              {getInitial()}
            </div>
          </div>
          <div className="modal-doctor-info">
            <h3>{doctor.name}</h3>
            <p className="modal-specialty">{doctor.specialty}</p>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-info-row">
            <span className="info-label">NMC Number:</span>
            <span className="info-value">{doctor.nmcNumber || 'N/A'}</span>
          </div>
          
          <div className="modal-info-row">
            <span className="info-label">Qualification:</span>
            <span className="info-value">{doctor.qualification || 'Not specified'}</span>
          </div>
          
          <div className="modal-info-row">
            <span className="info-label">Experience:</span>
            <span className="info-value">{doctor.experience || 'Not specified'}</span>
          </div>
          
          <div className="modal-info-row">
            <span className="info-label">Currently Practice at:</span>
            <span className="info-value">{doctor.hospital || doctor.currentHospital?.[0] || 'Not specified'}</span>
          </div>
          
          <div className="modal-info-row highlight">
            <span className="info-label">Consultation Fee:</span>
            <span className="info-value fee">Rs. {doctor.fee || doctor.consultationFee || 'Contact clinic'}</span>
          </div>
          
          <div className="modal-info-row highlight">
            <span className="info-label">Next Available Time:</span>
            <span className="info-value available">{nextAvailable || 'Contact clinic'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfileModal;
