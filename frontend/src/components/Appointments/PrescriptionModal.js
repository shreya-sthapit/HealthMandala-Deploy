import { useState, useEffect } from 'react';
import './PrescriptionModal.css';

const PrescriptionModal = ({ appointment, onClose }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`http://localhost:5001/api/prescriptions/patient/${userData.id}`);
      const data = await response.json();
      if (data.success) {
        setPrescriptions(data.prescriptions);
        if (data.prescriptions.length > 0) setSelected(data.prescriptions[0]);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  return (
    <div className="presc-overlay" onClick={onClose}>
      <div className="presc-modal" onClick={e => e.stopPropagation()}>
        <div className="presc-header">
          <div>
            <h2>My Prescriptions</h2>
            <p>{appointment.doctorName} — {appointment.doctorSpecialization}</p>
          </div>
          <button className="presc-close" onClick={onClose}>✕</button>
        </div>

        <div className="presc-body">
          {loading ? (
            <div className="presc-loading">Loading prescriptions...</div>
          ) : prescriptions.length === 0 ? (
            <div className="presc-empty">
              <p>No prescriptions found for your account.</p>
            </div>
          ) : (
            <div className="presc-layout">
              {/* Left: list by date */}
              <div className="presc-list">
                <h3>Checkup History</h3>
                {prescriptions.map(p => (
                  <div
                    key={p._id}
                    className={`presc-list-item ${selected?._id === p._id ? 'active' : ''}`}
                    onClick={() => setSelected(p)}
                  >
                    <div className="presc-list-date">{formatDate(p.checkupDate)}</div>
                    <div className="presc-list-info">
                      <strong>{p.diagnosis || 'General Checkup'}</strong>
                      <span>{p.doctorName}</span>
                      <span>{p.medicines?.length || 0} medicine(s)</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: detail */}
              {selected && (
                <div className="presc-detail">
                  <div className="presc-detail-header">
                    <h3>Prescription Detail</h3>
                    <span className="presc-detail-date">{formatDate(selected.checkupDate)}</span>
                  </div>

                  <div className="presc-section">
                    <label>Doctor</label>
                    <p>{selected.doctorName}</p>
                  </div>

                  {selected.diagnosis && (
                    <div className="presc-section">
                      <label>Diagnosis</label>
                      <p>{selected.diagnosis}</p>
                    </div>
                  )}

                  <div className="presc-section">
                    <label>Medicines</label>
                    <div className="presc-medicines">
                      {selected.medicines?.map((med, i) => (
                        <div key={i} className="presc-medicine-row">
                          <div className="med-name">{med.name} <span className="med-dosage">{med.dosage}</span></div>
                          <div className="med-info">
                            {med.frequency} · {med.duration}
                            {med.instructions && <span className="med-instruction"> · {med.instructions}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selected.notes && (
                    <div className="presc-section">
                      <label>Doctor's Notes</label>
                      <p>{selected.notes}</p>
                    </div>
                  )}

                  {selected.followUpDate && (
                    <div className="presc-section">
                      <label>Follow-up Date</label>
                      <p>{formatDate(selected.followUpDate)}</p>
                    </div>
                  )}

                  {selected.tests?.length > 0 && (
                    <div className="presc-section">
                      <label>Recommended Tests</label>
                      <ul className="presc-tests">
                        {selected.tests.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal;
