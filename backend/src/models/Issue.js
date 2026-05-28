const mongoose = require('mongoose');

// Auto-generate a readable issue ID: ISS-YYYYMMDD-XXXXX
function generateIssueId() {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `ISS-${ymd}-${rand}`;
}

const issueSchema = new mongoose.Schema({
  issueId: {
    type: String,
    unique: true,
    default: generateIssueId,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  userName: { type: String },
  userEmail: { type: String },

  priority: {
    type: String,
    enum: ['urgent', 'normal'],
    required: true,
    default: 'normal',
  },
  category: {
    type: String,
    enum: ['appointment', 'payment', 'prescription', 'account', 'technical', 'other'],
    default: 'other',
  },
  subject: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },

  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved'],
    default: 'open',
  },

  // Admin response fields
  adminNote: { type: String, default: '' },       // what admin did / resolution details
  resolvedBy: { type: String, default: '' },       // admin name
  resolvedAt: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

issueSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

issueSchema.index({ status: 1, createdAt: -1 });
issueSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Issue', issueSchema, 'Issues');
