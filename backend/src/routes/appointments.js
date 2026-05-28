const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { createNotification } = require('./notifications');
const { authMiddleware } = require('../middleware/auth');

// Create new appointment
router.post('/book', async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      patientName,
      patientPhone,
      patientEmail,
      patientAge,
      patientDOB,
      patientGender,
      patientAddress,
      isForDependent,
      dependentRelationship,
      doctorName,
      doctorSpecialization,
      doctorExperience,
      doctorNMCNumber,
      doctorQualification,
      doctorCurrentlyPracticeAt,
      hospital,
      appointmentDate,
      appointmentDay,
      tokenNumber,
      appointmentTime,
      appointmentType,
      reasonForVisit,
      consultationFee,
    } = req.body;

    console.log('Booking appointment request body:', req.body);
    console.log('Booking appointment:', { patientName, doctorName, appointmentDate, tokenNumber, hospital });

    // Validate required fields
    if (!patientName || !doctorName || !appointmentDate || tokenNumber === undefined) {
      console.error('Missing required fields:', { patientName, doctorName, appointmentDate, tokenNumber });
      return res.status(400).json({ 
        error: 'Missing required fields: patientName, doctorName, appointmentDate, tokenNumber' 
      });
    }

    // Check if token is already booked for this doctor on this date
    // Parse date as UTC to avoid timezone issues
    const [aptYear, aptMonth, aptDay] = appointmentDate.split('-').map(Number);
    const aptDateUTC = new Date(Date.UTC(aptYear, aptMonth - 1, aptDay));

    // Idempotency: if a Khalti pidx was provided, reject duplicate saves
    if (req.body.khaltiPidx) {
      const duplicate = await Appointment.findOne({ khaltiPidx: req.body.khaltiPidx });
      if (duplicate) {
        console.log('Duplicate appointment detected for pidx:', req.body.khaltiPidx);
        return res.status(200).json({
          success: true,
          message: 'Appointment already booked (duplicate request ignored)',
          appointment: {
            id: duplicate._id,
            appointmentDate: duplicate.appointmentDate,
            tokenNumber: duplicate.tokenNumber,
            doctorName: duplicate.doctorName,
            hospital: duplicate.hospital,
            status: duplicate.status
          }
        });
      }
    }

    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: aptDateUTC,
      tokenNumber,
      status: { $in: ['pending', 'confirmed', 'checked_in', 'prescribed'] }
    });

    if (existingAppointment) {
      return res.status(400).json({ 
        error: 'This token is already booked. Please select another date or try again.' 
      });
    }

    // Find hospitalId by hospital name
    let hospitalId = null;
    if (hospital) {
      const HospitalPartner = require('../models/HospitalPartner');
      // Handle hospital as string or array
      const hospitalName = Array.isArray(hospital) ? hospital[0] : hospital;
      const hospitalDoc = await HospitalPartner.findOne({ 
        hospitalName: new RegExp(`^${String(hospitalName).trim()}$`, 'i') 
      });
      if (hospitalDoc) {
        hospitalId = hospitalDoc._id;
        console.log('Found hospital:', { name: hospitalDoc.hospitalName, id: hospitalId });
      } else {
        console.log('Hospital not found:', hospital);
      }
    }

    // Create new appointment
    const appointment = new Appointment({
      patientId: patientId && mongoose.Types.ObjectId.isValid(patientId) ? patientId : null,
      doctorId: doctorId && mongoose.Types.ObjectId.isValid(doctorId) ? doctorId : null,
      // Patient details
      patientName,
      patientPhone: patientPhone || '',
      patientEmail: patientEmail || '',
      patientAge: patientAge || null,
      patientDOB: (patientDOB && patientDOB !== '' && !isNaN(new Date(patientDOB))) ? new Date(patientDOB) : null,
      patientGender: patientGender || null,
      patientAddress: patientAddress || '',
      isForDependent: isForDependent || false,
      dependentRelationship: dependentRelationship || '',
      // Doctor details
      doctorName,
      doctorSpecialization: doctorSpecialization || '',
      doctorExperience: doctorExperience || '',
      doctorNMCNumber: doctorNMCNumber || '',
      doctorQualification: doctorQualification || '',
      doctorCurrentlyPracticeAt: doctorCurrentlyPracticeAt || '',
      hospital: Array.isArray(hospital) ? hospital[0] : (hospital || ''),
      hospitalId: hospitalId,
      // Appointment details
      appointmentDate: aptDateUTC,
      appointmentDay: appointmentDay || '',
      tokenNumber,
      appointmentTime: appointmentTime || null,
      appointmentType: appointmentType || 'consultation',
      reasonForVisit: reasonForVisit || 'General consultation',
      consultationFee: consultationFee || 0,
      // Auto-confirm when payment is already paid (Khalti flow); walk-ins stay pending until check-in
      status: req.body.paymentStatus === 'paid' ? 'confirmed' : 'pending',
      paymentMethod: req.body.paymentMethod || 'khalti',
      paymentStatus: req.body.paymentStatus || 'pending',
      khaltiPidx: req.body.khaltiPidx || null,
      khaltiTransactionId: req.body.khaltiTransactionId || null,
    });

    await appointment.save();
    console.log('Appointment saved:', { id: appointment._id, hospital: appointment.hospital, hospitalId: appointment.hospitalId });

    // Create booking confirmation notification for the patient
    if (appointment.patientId) {
      const aptDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timeStr = appointment.appointmentTime
        ? ` at ${(() => { const [h, m] = appointment.appointmentTime.split(':').map(Number); const p = h >= 12 ? 'PM' : 'AM'; const h12 = h % 12 || 12; return `${h12}:${String(m).padStart(2,'0')} ${p}`; })()}`
        : '';
      await createNotification({
        userId: appointment.patientId,
        type: 'booking_confirmed',
        title: '🎉 Appointment Confirmed',
        detail: `Your token is #${appointment.tokenNumber} for ${appointment.doctorName} (${appointment.doctorSpecialization || 'Consultation'}) at ${appointment.hospital} on ${aptDate}${timeStr}. Tap to view your digital patient card.`,
        appointmentId: appointment._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: {
        id: appointment._id,
        appointmentDate: appointment.appointmentDate,
        tokenNumber: appointment.tokenNumber,
        doctorName: appointment.doctorName,
        hospital: appointment.hospital,
        status: appointment.status
      }
    });
  } catch (error) {
    console.error('Appointment booking error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Failed to book appointment', 
      message: error.message,
      details: error.toString()
    });
  }
});

// Get appointments for a patient by name/phone (fallback)
router.get('/patient-by-info/:patientName/:patientPhone?', async (req, res) => {
  try {
    const { patientName, patientPhone } = req.params;
    
    const query = { patientName };
    if (patientPhone && patientPhone !== 'undefined') {
      query.patientPhone = patientPhone;
    }

    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: -1 });
    
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get appointments', message: error.message });
  }
});

// Get appointments for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // If patientId is null or invalid, return empty array
    if (!patientId || patientId === 'null' || patientId === 'undefined') {
      return res.json({ success: true, appointments: [] });
    }

    // Check if patientId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.json({ success: true, appointments: [] });
    }

    const appointments = await Appointment.find({ patientId })
      .sort({ appointmentDate: -1 })
      .populate('doctorId', 'firstName lastName');
    
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get appointments', message: error.message });
  }
});

// Get appointments for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Check if doctorId is valid
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.json({ success: true, appointments: [] });
    }

    // Appointments store the DoctorRegistration._id as doctorId.
    // The dashboard passes the User._id from localStorage.
    // Resolve: if no appointments found by direct match, look up the
    // DoctorRegistration whose userId matches and retry with its _id.
    let appointments = await Appointment.find({ doctorId })
      .sort({ appointmentDate: 1 })
      .populate('patientId', 'firstName lastName');

    if (appointments.length === 0) {
      const DoctorRegistration = require('../models/DoctorRegistration');
      const docReg = await DoctorRegistration.findOne({ userId: doctorId });
      if (docReg) {
        appointments = await Appointment.find({ doctorId: docReg._id })
          .sort({ appointmentDate: 1 })
          .populate('patientId', 'firstName lastName');
      }
    }
    
    res.json({ success: true, appointments });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: 'Failed to get appointments', message: error.message });
  }
});

// Get appointments for a doctor by name (fallback)
router.get('/doctor-by-name/:doctorName', async (req, res) => {
  try {
    const { doctorName } = req.params;
    
    console.log('Fetching appointments for doctor name:', doctorName);
    
    const appointments = await Appointment.find({ 
      doctorName: new RegExp(doctorName, 'i') // Case-insensitive search
    })
      .sort({ appointmentDate: 1 })
      .populate('patientId', 'firstName lastName');
    
    console.log('Found appointments by name:', appointments.length);
    
    res.json({ success: true, appointments });
  } catch (error) {
    console.error('Error fetching doctor appointments by name:', error);
    res.status(500).json({ error: 'Failed to get appointments', message: error.message });
  }
});

// Update appointment status
router.put('/status/:id', async (req, res) => {
  try {
    const { status, doctorNotes } = req.body;
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        ...(doctorNotes && { doctorNotes })
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Broadcast real-time update to all connected doctor dashboards
    const broadcast = req.app.get('broadcast');
    if (broadcast) {
      broadcast({
        type: 'appointment_update',
        appointmentId: appointment._id,
        status: appointment.status,
        doctorId: appointment.doctorId,
      });
    }

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment', message: error.message });
  }
});

// Cancel appointment
router.put('/cancel/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Notify patient of cancellation
    if (appointment.patientId) {
      const aptDate = new Date(appointment.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      await createNotification({
        userId: appointment.patientId,
        type: 'emergency_cancellation',
        title: '🚨 Appointment Cancelled',
        detail: `${appointment.doctorName} is unavailable on ${aptDate}. Tap here to reschedule your booking for free or claim an instant refund.`,
        appointmentId: appointment._id,
      });
    }

    res.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel appointment', message: error.message });
  }
});

// Doctor submits prescription → status becomes 'prescribed'
router.put('/complete/:id', async (req, res) => {
  try {
    const { doctorNotes } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'prescribed', ...(doctorNotes && { doctorNotes }) },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment', message: error.message });
  }
});

// Get single appointment by ID (used by pharmacist to fetch token number)
router.get('/by-id/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get appointment', message: error.message });
  }
});

// Pharmacist collects payment → status becomes 'completed'
router.put('/complete-billing/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', paymentStatus: 'paid' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete billing', message: error.message });
  }
});

// Get all appointments (for admin/receptionist), filterable by status, date, hospitalId, hospital name
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const { status, date, hospitalId, hospital } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: startDate, $lte: endDate };
    }
    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      query.hospitalId = hospitalId;
    } else if (hospital) {
      query.hospital = new RegExp(hospital, 'i');
    }

    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: -1, appointmentTime: 1 })
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName');
    
    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get appointments', message: error.message });
  }
});

// Get available time slots for a doctor on a specific date
router.get('/available-slots/:doctorId/:date', async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    
    // Get booked appointments for this doctor on this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: new Date(date),
      status: { $in: ['pending', 'confirmed', 'checked_in', 'prescribed'] }
    }).select('appointmentTime');

    const bookedTimes = bookedAppointments.map(apt => apt.appointmentTime);
    
    // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
    const allSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));
    
    res.json({ success: true, availableSlots });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get available slots', message: error.message });
  }
});

// Get available tokens for a doctor on a specific date
router.get('/available-tokens/:doctorId/:date', async (req, res) => {
  try {
    const { doctorId, date } = req.params;
    const DoctorRegistration = require('../models/DoctorRegistration');
    
    // Try finding by _id first (used by booking page), then fall back to userId
    let doctor = null;
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      doctor = await DoctorRegistration.findById(doctorId);
      if (!doctor) {
        doctor = await DoctorRegistration.findOne({ userId: doctorId });
      }
    }
    
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    // Get the day of week for the requested date (parse as UTC to avoid timezone shift)
    const [year, month, day] = date.split('-').map(Number);
    const requestDate = new Date(Date.UTC(year, month - 1, day));
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[requestDate.getUTCDay()];
    
    // Find the schedule for this day
    let daySchedule = null;
    if (doctor.schedule && doctor.schedule.length > 0) {
      daySchedule = doctor.schedule.find(s => s.day === dayName && s.active);
    }
    
    if (!daySchedule) {
      return res.json({ 
        success: true, 
        availableTokens: 0, 
        totalTokens: 0,
        message: 'Doctor not available on this day'
      });
    }
    
    // Calculate total tokens based on working hours (30 min per patient)
    const startTime = daySchedule.start; // e.g., "09:00"
    const endTime = daySchedule.end; // e.g., "17:00"
    const lunchStart = doctor.lunchBreak?.start || '13:00';
    const lunchEnd = doctor.lunchBreak?.end || '14:00';
    
    const timeToMinutes = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const startMinutes = timeToMinutes(startTime);
    let endMinutes = timeToMinutes(endTime);
    
    // Handle edge case: if end time is before start time (e.g., 05:00 instead of 17:00)
    // Assume it's meant to be PM (add 12 hours)
    if (endMinutes < startMinutes && endMinutes < 12 * 60) {
      console.log(`⚠️  WARNING: End time (${endTime}) is before start time (${startTime})`);
      console.log(`   Assuming ${endTime} means ${endMinutes / 60 + 12}:${(endMinutes % 60).toString().padStart(2, '0')} (PM)`);
      endMinutes += 12 * 60; // Add 12 hours to convert to PM
    }
    
    const workMinutes = endMinutes - startMinutes;
    const lunchMinutes = timeToMinutes(lunchEnd) - timeToMinutes(lunchStart);
    const effectiveMinutes = Math.max(0, workMinutes - lunchMinutes);
    const totalTokens = Math.floor(effectiveMinutes / 30); // 30 min per patient
    
    console.log(`Token calculation for ${dayName}:`, {
      startTime,
      endTime,
      startMinutes,
      endMinutes,
      workMinutes,
      lunchMinutes,
      effectiveMinutes,
      totalTokens
    });
    
    // Get booked tokens for this date
    const [tYear, tMonth, tDay] = date.split('-').map(Number);
    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: {
        $gte: new Date(Date.UTC(tYear, tMonth - 1, tDay, 0, 0, 0)),
        $lt: new Date(Date.UTC(tYear, tMonth - 1, tDay, 23, 59, 59))
      },
      status: { $in: ['pending', 'confirmed', 'checked_in', 'prescribed'] }
    }).select('tokenNumber');
    
    const bookedTokens = bookedAppointments.length;
    const availableTokens = totalTokens - bookedTokens;
    
    // Get list of booked token numbers
    const bookedTokenNumbers = bookedAppointments.map(apt => apt.tokenNumber).sort((a, b) => a - b);
    
    res.json({ 
      success: true, 
      availableTokens: Math.max(0, availableTokens),
      totalTokens,
      bookedTokens,
      bookedTokenNumbers,
      workingHours: `${startTime} - ${endTime}`,
      lunchBreak: `${lunchStart} - ${lunchEnd}`
    });
  } catch (error) {
    console.error('Error getting available tokens:', error);
    res.status(500).json({ error: 'Failed to get available tokens', message: error.message });
  }
});

// Get patients for a doctor (from confirmed appointments)
router.get('/doctor-patients/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const PatientRegistration = require('../models/PatientRegistration');
    const User = require('../models/User');
    
    console.log('Fetching patients for doctorId:', doctorId);
    
    // Get doctor info to search by name as fallback
    let doctorName = null;
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      const doctor = await User.findById(doctorId);
      if (doctor) {
        doctorName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
        console.log('Doctor name:', doctorName);
      }
    }
    
    // Build query to find appointments by doctorId OR doctor name
    const query = {
      status: { $in: ['confirmed', 'checked_in', 'completed'] },
      $or: []
    };
    
    if (mongoose.Types.ObjectId.isValid(doctorId)) {
      query.$or.push({ doctorId: doctorId });
    }
    
    if (doctorName) {
      query.$or.push({ doctorName: new RegExp(doctorName, 'i') });
    }
    
    // If no valid search criteria, return empty
    if (query.$or.length === 0) {
      return res.json({ success: true, patients: [] });
    }
    
    // Get all confirmed appointments for this doctor
    const appointments = await Appointment.find(query).sort({ appointmentDate: -1 });
    
    console.log('Found confirmed appointments:', appointments.length);
    console.log('Appointments:', JSON.stringify(appointments.map(a => ({
      id: a._id,
      patientName: a.patientName,
      patientId: a.patientId,
      status: a.status,
      date: a.appointmentDate
    }))));
    
    if (appointments.length === 0) {
      return res.json({ success: true, patients: [] });
    }
    
    // Get unique patient IDs (filter out null/undefined)
    const patientIds = [...new Set(appointments.map(apt => apt.patientId).filter(id => id && mongoose.Types.ObjectId.isValid(id)))];
    
    // Get unique patient names for fallback
    const patientNames = [...new Set(appointments.map(apt => apt.patientName).filter(name => name))];
    
    console.log('Patient IDs:', patientIds);
    console.log('Patient names:', patientNames);
    
    // Fetch patient details by userId
    let patients = [];
    if (patientIds.length > 0) {
      patients = await PatientRegistration.find({
        userId: { $in: patientIds }
      }).populate('userId', 'firstName lastName email phone');
      console.log('Found patients by ID:', patients.length);
    }
    
    // Also try to find patients by matching names (fallback)
    if (patientNames.length > 0) {
      for (const name of patientNames) {
        const parts = name.trim().split(/\s+/);
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ');
        
        console.log(`Searching for patient: firstName="${firstName}", lastName="${lastName}"`);
        
        const patientsByName = await PatientRegistration.find({
          $or: [
            { firstName: new RegExp(`^${firstName}$`, 'i'), lastName: new RegExp(`^${lastName}$`, 'i') },
            { firstName: new RegExp(`^${firstName}$`, 'i') }
          ]
        }).populate('userId', 'firstName lastName email phone');
        
        console.log(`Found ${patientsByName.length} patients matching "${name}"`);
        
        // Merge with existing patients (avoid duplicates)
        const existingIds = new Set(patients.map(p => p._id.toString()));
        patientsByName.forEach(p => {
          if (!existingIds.has(p._id.toString())) {
            patients.push(p);
            existingIds.add(p._id.toString());
          }
        });
      }
    }
    
    console.log('Total patients found:', patients.length);
    
    // Build patient data with visit counts and last visit
    const patientData = patients.map(patient => {
      // Match appointments by patientId OR by patient name
      const patientFullName = `${patient.firstName || patient.userId?.firstName || ''} ${patient.lastName || patient.userId?.lastName || ''}`.trim();
      
      console.log(`Matching appointments for patient: ${patientFullName}`);
      
      const patientAppointments = appointments.filter(apt => {
        const matchById = apt.patientId && patient.userId && apt.patientId.toString() === patient.userId._id.toString();
        const matchByName = apt.patientName && patientFullName && 
          (apt.patientName.toLowerCase().trim() === patientFullName.toLowerCase().trim() ||
           apt.patientName.toLowerCase().includes(patientFullName.toLowerCase()));
        
        console.log(`  Checking appointment: ${apt.patientName}, matchById: ${matchById}, matchByName: ${matchByName}`);
        
        return matchById || matchByName;
      });
      
      console.log(`  Found ${patientAppointments.length} appointments for ${patientFullName}`);
      
      const lastAppointment = patientAppointments[0];
      
      // Calculate age from date of birth
      let age = null;
      if (patient.dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(patient.dateOfBirth);
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }
      
      return {
        id: patient._id,
        userId: patient.userId?._id,
        name: patientFullName,
        firstName: patient.firstName || patient.userId?.firstName,
        lastName: patient.lastName || patient.userId?.lastName,
        age,
        gender: patient.gender,
        phone: patient.phone || patient.userId?.phone,
        email: patient.email || patient.userId?.email,
        bloodGroup: patient.bloodGroup,
        profilePhoto: patient.profilePhoto,
        medicalConditions: patient.medicalConditions,
        allergies: patient.allergies,
        visits: patientAppointments.length,
        lastVisit: lastAppointment ? lastAppointment.appointmentDate : null,
        lastVisitReason: lastAppointment ? lastAppointment.reasonForVisit : null
      };
    });
    
    res.json({ success: true, patients: patientData });
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ error: 'Failed to get patients', message: error.message });
  }
});

module.exports = router;
// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'appointments' }));

// Get appointment statistics for a doctor
router.get('/stats/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const total = await Appointment.countDocuments({ doctorId });
    const confirmed = await Appointment.countDocuments({ doctorId, status: 'confirmed' });
    const pending = await Appointment.countDocuments({ doctorId, status: 'pending' });
    const cancelled = await Appointment.countDocuments({ doctorId, status: 'cancelled' });
    res.json({ success: true, stats: { total, confirmed, pending, cancelled } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats', message: error.message });
  }
});
