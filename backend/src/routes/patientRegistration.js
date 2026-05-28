const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const PatientRegistration = require('../models/PatientRegistration');
const User = require('../models/User');
const uploadConfigs = require('../config/multer');

// Create patient registration with file uploads
router.post('/register', uploadConfigs.patientUploads, async (req, res) => {
  try {
    const {
      pendingToken,
      userId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      city,
      district,
      province,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      medicalConditions,
      allergies,
      nidNumber
    } = req.body;

    console.log('Received registration data:', { userId, firstName, lastName, dateOfBirth, gender, nidNumber });
    console.log('Uploaded files:', req.files);

    // Validate NID format — must be exactly 10 digits
    if (!nidNumber || !/^\d{10}$/.test(nidNumber)) {
      return res.status(400).json({ error: 'NID must be exactly 10 digits.' });
    }

    // Mock DoNIDCR API verification (simulates ~1.2s network round-trip)
    console.log(`Sending request to mock DoNIDCR API for NID: ${nidNumber}...`);
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Blacklisted NIDs — use these to demo a failed verification
    const blacklistedNumbers = [
      '0000000000', '1111111111', '2222222222', '3333333333', '4444444444',
      '5555555555', '6666666666', '7777777777', '8888888888', '9999999999',
      '1234567890'
    ];
    if (blacklistedNumbers.includes(nidNumber)) {
      return res.status(422).json({
        verified: false,
        error: 'NID Verification Failed: No records found in National Registry.'
      });
    }

    // Get file paths from uploaded files
    const profilePhoto = req.files?.profilePhoto?.[0]?.path || null;
    const nidFrontImage = req.files?.nidFront?.[0]?.path || null;
    const nidBackImage = req.files?.nidBack?.[0]?.path || null;

    // ── Resolve the User ID ──
    // If a pendingToken is provided, decode it and create the User now (first-time registration).
    // If a userId is provided directly (e.g. re-submission), use that existing User.
    let resolvedUserId = userId || null;
    let authToken = null;

    if (pendingToken) {
      let payload;
      try {
        payload = jwt.verify(pendingToken, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(400).json({ error: 'Registration session expired. Please sign up again.' });
      }

      if (!payload.pending) {
        return res.status(400).json({ error: 'Invalid registration token.' });
      }

      // Check if user already exists (idempotent — handles double-submit)
      const existingUser = payload.email
        ? await User.findOne({ email: payload.email })
        : await User.findOne({ phone: payload.phone });

      if (existingUser) {
        resolvedUserId = existingUser._id;
      } else {
        // Create the User for the first time
        const newUser = new User({
          firstName: payload.firstName || firstName,
          lastName: payload.lastName || lastName,
          email: payload.email || email || undefined,
          phone: payload.phone || phone || undefined,
          password: payload.password,
          role: payload.role || 'patient',
          authMethod: payload.email ? 'email' : 'phone',
          isEmailVerified: !!payload.email,
          isPhoneVerified: !!payload.phone,
          status: 'active',
          nidNumber,
          nidFrontImage,
          nidBackImage,
        });
        await newUser.save();
        resolvedUserId = newUser._id;

        // Issue a real JWT now that the User exists
        authToken = jwt.sign(
          { userId: newUser._id, role: newUser.role },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );
      }
    } else if (resolvedUserId) {
      // Existing user re-submitting — update NID info
      await User.findByIdAndUpdate(resolvedUserId, { nidNumber, nidFrontImage, nidBackImage });
    }

    // Create new patient registration
    const registration = new PatientRegistration({
      userId: resolvedUserId,
      firstName: firstName || req.body.firstName,
      lastName: lastName || req.body.lastName,
      email: email || req.body.email,
      phone: phone || req.body.phone,
      profilePhoto,
      dateOfBirth,
      gender,
      bloodGroup,
      address: { street: address, city, district, province },
      emergencyContact: {
        name: emergencyContactName,
        phone: emergencyContactPhone,
        relation: emergencyContactRelation
      },
      medicalConditions,
      allergies,
      nidNumber,
      nidFrontImage,
      nidBackImage,
      status: 'approved'
    });

    await registration.save();
    console.log('Registration saved:', registration._id);

    res.status(201).json({
      success: true,
      message: 'Patient registration submitted successfully',
      authToken,   // null if user already existed; frontend uses this to log in
      userId: resolvedUserId,
      registration: {
        id: registration._id,
        status: registration.status,
        files: { profilePhoto, nidFrontImage, nidBackImage }
      }
    });
  } catch (error) {
    console.error('Patient registration error:', error);
    res.status(500).json({ error: 'Registration failed', message: error.message });
  }
});

// Get patient registration by userId
router.get('/user/:userId', async (req, res) => {
  try {
    const registration = await PatientRegistration.findOne({ userId: req.params.userId });
    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    res.json({ success: true, registration });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get registration', message: error.message });
  }
});

// Get all pending registrations (for admin)
router.get('/pending', async (req, res) => {
  try {
    const registrations = await PatientRegistration.find({ status: 'pending' })
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, registrations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get registrations', message: error.message });
  }
});

// Update registration status (for admin approval)
router.put('/status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const registration = await PatientRegistration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    // If approved, update user status to active
    if (status === 'approved' && registration.userId) {
      await User.findByIdAndUpdate(registration.userId, { status: 'active' });
    }

    res.json({ success: true, registration });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status', message: error.message });
  }
});

// Update patient profile by userId
router.put('/profile/:userId', uploadConfigs.patientUploads, async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      firstName, lastName, email, phone,
      gender, dateOfBirth, bloodGroup,
      address, city, district, province,
      emergencyContactName, emergencyContactPhone, emergencyContactRelation,
      medicalConditions, allergies,
      nidNumber,
    } = req.body;

    const update = {
      firstName, lastName, email, phone,
      gender, dateOfBirth, bloodGroup,
      address: { street: address, city, district, province },
      emergencyContact: { name: emergencyContactName, phone: emergencyContactPhone, relation: emergencyContactRelation },
      medicalConditions, allergies,
      nidNumber,
      updatedAt: Date.now(),
    };

    if (req.files?.profilePhoto?.[0]) update.profilePhoto = req.files.profilePhoto[0].path;
    if (req.files?.nidFront?.[0]) update.nidFrontImage = req.files.nidFront[0].path;
    if (req.files?.nidBack?.[0]) update.nidBackImage = req.files.nidBack[0].path;

    // Remove undefined keys so we don't overwrite with empty strings unintentionally
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);

    let registration = await PatientRegistration.findOneAndUpdate(
      { userId },
      { $set: update },
      { new: true }
    );

    if (!registration) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    res.json({ success: true, profile: registration });
  } catch (error) {
    console.error('Error updating patient profile:', error);
    res.status(500).json({ error: 'Failed to update profile', message: error.message });
  }
});

// Get patient profile by userId
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find by userId without status restriction so receptionist can view any patient
    let patientProfile = await PatientRegistration.findOne({ userId })
      .populate('userId', 'firstName lastName email phone')
      .lean();

    // Fallback: try by registration _id
    if (!patientProfile) {
      patientProfile = await PatientRegistration.findOne({ _id: userId })
        .populate('userId', 'firstName lastName email phone')
        .lean();
    }

    if (!patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    res.json({ success: true, profile: patientProfile });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({ error: 'Failed to fetch patient profile', message: error.message });
  }
});

// Check registration status by userId
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // First try to find by userId
    let registration = await PatientRegistration.findOne({ userId })
      .populate('userId', 'firstName lastName email phone');

    // If not found, try to find by registration _id (in case userId is actually registration ID)
    if (!registration) {
      registration = await PatientRegistration.findById(userId)
        .populate('userId', 'firstName lastName email phone');
    }

    if (!registration) {
      return res.json({ 
        success: true, 
        hasRegistration: false, 
        message: 'No registration found. Please complete your registration.' 
      });
    }

    res.json({ 
      success: true, 
      hasRegistration: true, 
      status: registration.status,
      registration: registration
    });
  } catch (error) {
    console.error('Error checking registration status:', error);
    res.status(500).json({ error: 'Failed to check registration status', message: error.message });
  }
});

// Temporary debug endpoint
router.get('/debug/all', async (req, res) => {
  try {
    const registrations = await PatientRegistration.find({})
      .populate('userId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      count: registrations.length,
      registrations: registrations.map(reg => ({
        id: reg._id,
        userId: reg.userId?._id,
        userEmail: reg.userId?.email,
        firstName: reg.firstName,
        lastName: reg.lastName,
        email: reg.email,
        status: reg.status,
        createdAt: reg.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching all registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations', message: error.message });
  }
});

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', service: 'patient' }));

// Get patient count
router.get('/count', async (req, res) => {
  try {
    const total = await PatientRegistration.countDocuments();
    const approved = await PatientRegistration.countDocuments({ status: 'approved' });
    res.json({ success: true, counts: { total, approved } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get count', message: error.message });
  }
});

// Add dependent to patient
router.post('/dependents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const dependentData = req.body;

    // Find patient by userId
    const patient = await PatientRegistration.findOne({ userId });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Add dependent to the dependents array
    patient.dependents.push({
      ...dependentData,
      addedAt: new Date()
    });

    await patient.save();

    res.json({ 
      success: true, 
      message: 'Dependent added successfully',
      dependent: patient.dependents[patient.dependents.length - 1]
    });
  } catch (error) {
    console.error('Error adding dependent:', error);
    res.status(500).json({ error: 'Failed to add dependent', message: error.message });
  }
});

// Get all dependents for a patient
router.get('/dependents/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find patient by userId
    const patient = await PatientRegistration.findOne({ userId });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ 
      success: true, 
      dependents: patient.dependents || []
    });
  } catch (error) {
    console.error('Error fetching dependents:', error);
    res.status(500).json({ error: 'Failed to fetch dependents', message: error.message });
  }
});

// Delete a dependent
router.delete('/dependents/:userId/:dependentId', async (req, res) => {
  try {
    const { userId, dependentId } = req.params;

    // Find patient by userId
    const patient = await PatientRegistration.findOne({ userId });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Remove dependent from array
    patient.dependents = patient.dependents.filter(
      dep => dep._id.toString() !== dependentId
    );

    await patient.save();

    res.json({ 
      success: true, 
      message: 'Dependent removed successfully'
    });
  } catch (error) {
    console.error('Error removing dependent:', error);
    res.status(500).json({ error: 'Failed to remove dependent', message: error.message });
  }
});

module.exports = router;
