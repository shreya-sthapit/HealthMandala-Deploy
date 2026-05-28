const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    // booking_confirmed, payment_failed, reminder_24h, reminder_12h, reminder_2h,
    // schedule_delay, emergency_cancellation, prescription_issued,
    // lab_report_ready, follow_up_reminder
    required: true,
  },
  title: { type: String, required: true },
  detail: { type: String, default: '' },
  // Optional deep-link data
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null },
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', default: null },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema, 'Notifications');
