const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const { createNotification } = require('./notifications');
const { authMiddleware } = require('../middleware/auth');

// Create new prescription
router.post('/create', async (req, res) => {
  try {
    const {
      patientId: rawPatientId,
      doctorId: rawDoctorId,
      appointmentId,
      medicines,
      diagnosis,
      chiefComplaints,
      notes,
      followUpDate,
      tests,
      doctorName,
      patientName
    } = req.body;

    // Resolve hospitalId, and authoritative patientId/doctorId from the appointment.
    // The frontend may send patientId as a populated object { _id, firstName, lastName }
    // or doctorId as the User._id rather than DoctorRegistration._id — use the
    // appointment record as the single source of truth for all IDs.
    let hospitalId = null;
    let hospitalName = null;
    let resolvedPatientId = null;
    let resolvedDoctorId = null;

    if (appointmentId && mongoose.Types.ObjectId.isValid(appointmentId)) {
      const apt = await Appointment.findById(appointmentId).lean();
      if (apt) {
        hospitalId = apt.hospitalId || null;
        hospitalName = apt.hospital || null;
        // patientId on the appointment is always a clean ObjectId
        resolvedPatientId = apt.patientId || null;
        // doctorId on the appointment is the DoctorRegistration._id
        resolvedDoctorId = apt.doctorId || null;
      }
    }

    // Fall back to what the frontend sent if appointment lookup failed
    if (!resolvedPatientId) {
      const pid = rawPatientId?._id || rawPatientId;
      resolvedPatientId = pid && mongoose.Types.ObjectId.isValid(pid) ? pid : null;
    }
    if (!resolvedDoctorId) {
      const did = rawDoctorId?._id || rawDoctorId;
      resolvedDoctorId = did && mongoose.Types.ObjectId.isValid(did) ? did : null;
    }

    // doctorId is required; patientId is optional (walk-in patients may not have an account)
    if (!resolvedDoctorId) {
      return res.status(400).json({ error: 'Could not resolve doctor ID. Ensure the appointment exists.' });
    }

    // Normalize medicine fields: doctor sends { name, strength, timing, duration }
    // but model stores { name, dosage, frequency, duration }
    const normalizedMedicines = (medicines || []).map(m => ({
      name: m.name,
      dosage: m.dosage || m.strength || '',
      frequency: m.frequency || m.timing || '',
      duration: m.duration || '',
      instructions: m.instructions || '',
      quantity: m.quantity || null,
    }));

    // Normalize followUpDate: convert relative strings like "1 Week" to actual dates
    let resolvedFollowUpDate = null;
    if (followUpDate) {
      const relativeMap = {
        '1 week':   7, '2 weeks': 14, '1 month':  30,
        '3 months': 90, '6 months': 180, '1 year': 365,
      };
      const key = followUpDate.toLowerCase().trim();
      if (relativeMap[key]) {
        const d = new Date();
        d.setDate(d.getDate() + relativeMap[key]);
        resolvedFollowUpDate = d;
      } else {
        const parsed = new Date(followUpDate);
        resolvedFollowUpDate = isNaN(parsed.getTime()) ? null : parsed;
      }
    }

    const prescription = new Prescription({
      patientId: resolvedPatientId,
      doctorId: resolvedDoctorId,
      appointmentId,
      medicines: normalizedMedicines,
      diagnosis,
      chiefComplaints,
      notes,
      followUpDate: resolvedFollowUpDate,
      tests,
      doctorName,
      patientName,
      hospitalId,
      hospitalName,
      checkupDate: new Date()
    });

    await prescription.save();

    // Notify patient that prescription has been issued
    if (resolvedPatientId) {
      await createNotification({
        userId: resolvedPatientId,
        type: 'prescription_issued',
        title: '📄 Digital Prescription Issued',
        detail: `Your digital prescription from ${doctorName || 'your doctor'} has been uploaded. You can now present this directly at the hospital pharmacy.`,
        prescriptionId: prescription._id,
      });

      if (followUpDate) {
        const followUpStr = new Date(followUpDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        await createNotification({
          userId: resolvedPatientId,
          type: 'follow_up_reminder',
          title: '📅 Follow-Up Reminder',
          detail: `Time for a check-up? ${doctorName || 'Your doctor'} recommended a follow-up visit around ${followUpStr}. Tap to check their active schedule.`,
          prescriptionId: prescription._id,
        });
      }
    }

    // Notify pharmacist(s) at the same hospital
    if (hospitalId) {
      const StaffMember = require('../models/StaffMember');
      const pharmacists = await StaffMember.find({
        hospitalId,
        role: 'pharmacist',
        status: 'active',
        userId: { $ne: null }
      }).lean();

      for (const ph of pharmacists) {
        if (ph.userId) {
          await createNotification({
            userId: ph.userId,
            type: 'prescription_issued',
            title: '💊 New Prescription Ready',
            detail: `Token #${req.body.tokenNumber || '—'} — ${patientName || 'A patient'} has been prescribed by ${doctorName || 'a doctor'}. Please prepare the medicines.`,
            prescriptionId: prescription._id,
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      prescription: {
        id: prescription._id,
        checkupDate: prescription.checkupDate,
        diagnosis: prescription.diagnosis
      }
    });
  } catch (error) {
    console.error('Prescription creation error:', error);
    res.status(500).json({ error: 'Failed to create prescription', message: error.message });
  }
});

// Get all prescriptions (for pharmacist), optionally filtered by hospitalId or hospital name
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const { hospitalId, hospital } = req.query;
    let query = {};

    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      // Filter directly by hospitalId stored on the prescription
      query.hospitalId = hospitalId;
    } else if (hospital) {
      query.hospitalName = new RegExp(hospital, 'i');
    }

    const prescriptions = await Prescription.find(query)
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, prescriptions });
  } catch (error) {
    console.error('Error fetching all prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions', message: error.message });
  }
});

// Mark prescription as dispensed — also deducts stock for each medicine
router.put('/:prescriptionId/dispense', async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.prescriptionId,
      { status: 'dispensed', dispensedAt: new Date() },
      { new: true }
    );
    if (!prescription) return res.status(404).json({ error: 'Prescription not found' });

    // Deduct stock for each medicine in the prescription
    const Medicine = require('../models/Medicine');
    const meds = prescription.medicines || [];
    await Promise.all(meds.map(async (m) => {
      const qty = Number(m.quantity) || 1;
      if (!m.name) return;
      // Match by exact name first, then partial
      let inv = await Medicine.findOne({ medicine_name: new RegExp(`^${m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
      if (!inv) {
        inv = await Medicine.findOne({ medicine_name: new RegExp(m.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') });
      }
      if (inv) {
        // Never go below 0
        const deduct = Math.min(qty, inv.stock_quantity);
        await Medicine.findByIdAndUpdate(inv._id, { $inc: { stock_quantity: -deduct } });
      }
    }));

    res.json({ success: true, prescription });
  } catch (error) {
    res.status(500).json({ error: 'Failed to dispense prescription', message: error.message });
  }
});

// Get all prescriptions for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;

    const prescriptions = await Prescription.find({ patientId })
      .sort({ checkupDate: -1 })
      .populate('doctorId', 'firstName lastName');

    console.log('Found prescriptions for patient:', prescriptions.length);

    res.json({ success: true, prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions', message: error.message });
  }
});

// Get prescriptions for a patient by doctor
router.get('/patient/:patientId/doctor/:doctorId', async (req, res) => {
  try {
    const { patientId, doctorId } = req.params;

    const prescriptions = await Prescription.find({ patientId, doctorId })
      .sort({ checkupDate: -1 })
      .populate('doctorId', 'firstName lastName');

    console.log('Found prescriptions for patient by doctor:', prescriptions.length);

    res.json({ success: true, prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions', message: error.message });
  }
});

// Get single prescription
router.get('/:prescriptionId', async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName');

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json({ success: true, prescription });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    res.status(500).json({ error: 'Failed to fetch prescription', message: error.message });
  }
});

// Update prescription
router.put('/:prescriptionId', async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const { medicines, diagnosis, notes, followUpDate, tests } = req.body;

    const prescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      {
        medicines,
        diagnosis,
        notes,
        followUpDate,
        tests
      },
      { new: true }
    );

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json({ success: true, message: 'Prescription updated successfully', prescription });
  } catch (error) {
    console.error('Error updating prescription:', error);
    res.status(500).json({ error: 'Failed to update prescription', message: error.message });
  }
});

// Delete prescription
router.delete('/:prescriptionId', async (req, res) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findByIdAndDelete(prescriptionId);

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json({ success: true, message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error('Error deleting prescription:', error);
    res.status(500).json({ error: 'Failed to delete prescription', message: error.message });
  }
});

module.exports = router;

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'prescriptions' }));

// Get prescription count for a patient
router.get('/count/patient/:patientId', async (req, res) => {
  try {
    const Prescription = require('../models/Prescription');
    const count = await Prescription.countDocuments({ patientId: req.params.patientId });
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get count', message: error.message });
  }
});
