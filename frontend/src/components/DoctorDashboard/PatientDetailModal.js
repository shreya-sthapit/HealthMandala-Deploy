import { useState, useEffect } from 'react';
import './PatientDetailModal.css';

const PatientDetailModal = ({ patient, onClose }) => {
  const [activeTab, setActiveTab] = useState('records'); // 'records' or 'prescription'
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showNewPrescription, setShowNewPrescription] = useState(false);
  const [newPrescription, setNewPrescription] = useState({
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: 1 }],
    diagnosis: '',
    notes: '',
    followUpDate: '',
    tests: []
  });

  useEffect(() => {
    if (activeTab === 'records') {
      fetchPrescriptions();
    }
  }, [activeTab, patient]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5001/api/prescriptions/patient/${patient.userId}`);
      const data = await response.json();
      
      if (data.success) {
        setPrescriptions(data.prescriptions);
        console.log('Fetched prescriptions:', data.prescriptions.length);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = () => {
    setNewPrescription({
      ...newPrescription,
      medicines: [
        ...newPrescription.medicines,
        { name: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: 1 }
      ]
    });
  };

  const handleRemoveMedicine = (index) => {
    setNewPrescription({
      ...newPrescription,
      medicines: newPrescription.medicines.filter((_, i) => i !== index)
    });
  };

  const handleMedicineChange = (index, field, value) => {
    const updatedMedicines = [...newPrescription.medicines];
    updatedMedicines[index][field] = value;
    setNewPrescription({
      ...newPrescription,
      medicines: updatedMedicines
    });
  };

  const handleSavePrescription = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      const prescriptionData = {
        patientId: patient.userId,
        doctorId: userData.id,
        medicines: newPrescription.medicines.filter(m => m.name), // Only save non-empty medicines
        diagnosis: newPrescription.diagnosis,
        notes: newPrescription.notes,
        followUpDate: newPrescription.followUpDate || null,
        tests: newPrescription.tests,
        doctorName: `Dr. ${userData.firstName} ${userData.lastName}`,
        patientName: patient.name
      };

      console.log('Saving prescription:', prescriptionData);

      const response = await fetch('http://localhost:5001/api/prescriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prescriptionData)
      });

      const data = await response.json();

      if (data.success) {
        alert('Prescription saved successfully!');
        setShowNewPrescription(false);
        setNewPrescription({
          medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '', quantity: 1 }],
          diagnosis: '',
          notes: '',
          followUpDate: '',
          tests: []
        });
        fetchPrescriptions();
      } else {
        alert(data.error || 'Failed to save prescription');
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      alert('Failed to save prescription');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="patient-header-info">
            {patient.profilePhoto ? (
              <img
                src={`http://localhost:5001${patient.profilePhoto}`}
                alt={patient.name}
                className="patient-modal-photo"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="patient-modal-avatar" style={{ display: patient.profilePhoto ? 'none' : 'flex' }}>
              {patient.firstName?.[0] || 'P'}
            </div>
            <div className="patient-header-details">
              <h2>{patient.name}</h2>
              <p>{patient.age ? `${patient.age} years` : 'Age N/A'} • {patient.gender || 'N/A'}</p>
              <p className="patient-contact">{patient.phone || 'N/A'}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`}
            onClick={() => setActiveTab('records')}
          >
            Old Records
          </button>
          <button
            className={`tab-btn ${activeTab === 'prescription' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescription')}
          >
            New Prescription
          </button>
        </div>

        <div className="modal-body">
          {/* Old Records Tab */}
          {activeTab === 'records' && (
            <div className="records-section">
              <div className="records-header">
                <h3>Medical History</h3>
                <p className="records-count">{prescriptions.length} prescription(s)</p>
              </div>

              {loading ? (
                <div className="loading-state">Loading prescriptions...</div>
              ) : prescriptions.length > 0 ? (
                <div className="prescriptions-list">
                  {prescriptions.map((prescription) => (
                    <div
                      key={prescription._id}
                      className={`prescription-item ${selectedPrescription?._id === prescription._id ? 'selected' : ''}`}
                      onClick={() => setSelectedPrescription(prescription)}
                    >
                      <div className="prescription-date">
                        {formatDate(prescription.checkupDate)}
                      </div>
                      <div className="prescription-info">
                        <h4>{prescription.diagnosis || 'General Checkup'}</h4>
                        <p className="doctor-name">Dr. {prescription.doctorName}</p>
                        <p className="medicines-count">
                          {prescription.medicines.length} medicine(s)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No previous prescriptions found</p>
                </div>
              )}

              {selectedPrescription && (
                <div className="prescription-detail">
                  <h3>Prescription Details</h3>
                  <div className="detail-section">
                    <label>Date:</label>
                    <p>{formatDate(selectedPrescription.checkupDate)}</p>
                  </div>
                  <div className="detail-section">
                    <label>Diagnosis:</label>
                    <p>{selectedPrescription.diagnosis || 'N/A'}</p>
                  </div>
                  <div className="detail-section">
                    <label>Medicines:</label>
                    <div className="medicines-list">
                      {selectedPrescription.medicines.map((medicine, idx) => (
                        <div key={idx} className="medicine-item">
                          <p><strong>{medicine.name}</strong> - {medicine.dosage}</p>
                          <p className="medicine-details">
                            {medicine.frequency} for {medicine.duration}
                          </p>
                          {medicine.instructions && (
                            <p className="medicine-instructions">{medicine.instructions}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  {selectedPrescription.notes && (
                    <div className="detail-section">
                      <label>Notes:</label>
                      <p>{selectedPrescription.notes}</p>
                    </div>
                  )}
                  {selectedPrescription.followUpDate && (
                    <div className="detail-section">
                      <label>Follow-up Date:</label>
                      <p>{formatDate(selectedPrescription.followUpDate)}</p>
                    </div>
                  )}
                  {selectedPrescription.tests && selectedPrescription.tests.length > 0 && (
                    <div className="detail-section">
                      <label>Recommended Tests:</label>
                      <ul>
                        {selectedPrescription.tests.map((test, idx) => (
                          <li key={idx}>{test}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* New Prescription Tab */}
          {activeTab === 'prescription' && (
            <div className="prescription-section">
              {!showNewPrescription ? (
                <div className="new-prescription-prompt">
                  <p>Create a new prescription for this patient</p>
                  <button
                    className="btn-primary"
                    onClick={() => setShowNewPrescription(true)}
                  >
                    + Add Prescription
                  </button>
                </div>
              ) : (
                <div className="prescription-form">
                  <h3>New Prescription</h3>

                  <div className="form-group">
                    <label>Diagnosis</label>
                    <input
                      type="text"
                      placeholder="Enter diagnosis"
                      value={newPrescription.diagnosis}
                      onChange={(e) =>
                        setNewPrescription({
                          ...newPrescription,
                          diagnosis: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Medicines</label>
                    <div className="medicines-form">
                      {newPrescription.medicines.map((medicine, idx) => (
                        <div key={idx} className="medicine-form-item">
                          <input
                            type="text"
                            placeholder="Medicine name"
                            value={medicine.name}
                            onChange={(e) =>
                              handleMedicineChange(idx, 'name', e.target.value)
                            }
                          />
                          <input
                            type="text"
                            placeholder="Dosage (e.g., 500mg)"
                            value={medicine.dosage}
                            onChange={(e) =>
                              handleMedicineChange(idx, 'dosage', e.target.value)
                            }
                          />
                          <input
                            type="text"
                            placeholder="Frequency (e.g., Twice daily)"
                            value={medicine.frequency}
                            onChange={(e) =>
                              handleMedicineChange(idx, 'frequency', e.target.value)
                            }
                          />
                          <input
                            type="text"
                            placeholder="Duration (e.g., 7 days)"
                            value={medicine.duration}
                            onChange={(e) =>
                              handleMedicineChange(idx, 'duration', e.target.value)
                            }
                          />
                          <input
                            type="text"
                            placeholder="Instructions (e.g., After meals)"
                            value={medicine.instructions}
                            onChange={(e) =>
                              handleMedicineChange(idx, 'instructions', e.target.value)
                            }
                          />
                          {newPrescription.medicines.length > 1 && (
                            <button
                              className="btn-remove"
                              onClick={() => handleRemoveMedicine(idx)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={handleAddMedicine}
                    >
                      + Add Medicine
                    </button>
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      placeholder="Additional notes"
                      value={newPrescription.notes}
                      onChange={(e) =>
                        setNewPrescription({
                          ...newPrescription,
                          notes: e.target.value
                        })
                      }
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Follow-up Date</label>
                    <input
                      type="date"
                      value={newPrescription.followUpDate}
                      onChange={(e) =>
                        setNewPrescription({
                          ...newPrescription,
                          followUpDate: e.target.value
                        })
                      }
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      className="btn-primary"
                      onClick={handleSavePrescription}
                    >
                      Save Prescription
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setShowNewPrescription(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetailModal;
