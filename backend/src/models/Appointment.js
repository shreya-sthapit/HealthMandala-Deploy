const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Patient Information
  patientName: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String
  },
  patientEmail: String,
  patientAge: Number,
  patientDOB: Date,
  patientGender: String,
  patientAddress: String,
  // Doctor Information
  doctorName: {
    type: String,
    required: true
  },
  doctorSpecialization: String,
  doctorExperience: String,
  doctorNMCNumber: String,
  doctorQualification: String,
  doctorCurrentlyPracticeAt: String,
  hospital: String,
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HospitalPartner'
  },
  // Appointment Details
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentDay: String,
  tokenNumber: {
    type: Number,
    required: true
  },
  appointmentTime: {
    type: String
  },
  appointmentType: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup'],
    default: 'consultation'
  },
  // Reason for visit
  reasonForVisit: {
    type: String,
    default: 'General consultation'
  },
  // Dependent booking flag
  isForDependent: {
    type: Boolean,
    default: false
  },
  dependentRelationship: {
    type: String,
    default: ''
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked_in', 'prescribed', 'completed', 'cancelled', 'rejected', 'no-show'],
    default: 'pending'
  },
  doctorConfirmed: {
    type: Boolean,
    default: false
  },
  doctorConfirmedAt: Date,
  // Payment
  consultationFee: {
    type: Number,
    default: 0
  },
  paymentMethod: {
    type: String,
    enum: ['esewa', 'khalti', 'card', 'cash'],
    default: 'esewa'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  // Khalti payment reference — used for idempotency (prevents duplicate saves)
  khaltiPidx: {
    type: String,
    sparse: true,   // allows null but enforces uniqueness when set
    unique: true,
  },
  khaltiTransactionId: {
    type: String,
  },
  // Notes
  doctorNotes: String,
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ hospital: 1, appointmentDate: 1 });
appointmentSchema.index({ hospitalId: 1, appointmentDate: 1 });

// Virtual: appointment status label
appointmentSchema.virtual('statusLabel').get(function() {
  const labels = { pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Cancelled', completed: 'Completed', rejected: 'Rejected' };
  return labels[this.status] || this.status;
});

module.exports = mongoose.model('Appointment', appointmentSchema, 'Appointments');
