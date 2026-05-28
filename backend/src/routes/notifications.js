const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// ── Helper: create a notification (also exported for use in other routes) ──
async function createNotification({ userId, type, title, detail, appointmentId, prescriptionId }) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;
  try {
    const notif = new Notification({
      userId,
      type,
      title,
      detail: detail || '',
      appointmentId: appointmentId || null,
      prescriptionId: prescriptionId || null,
    });
    await notif.save();
    return notif;
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

// GET /api/notifications/:userId — fetch all notifications for a patient
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId, read: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications', message: err.message });
  }
});

// PUT /api/notifications/:id/mark-read — mark a single notification as read
router.put('/:id/mark-read', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    res.json({ success: true, notification: notif });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification as read', message: err.message });
  }
});

// PUT /api/notifications/:userId/mark-all-read — mark all as read for a user
router.put('/:userId/mark-all-read', async (req, res) => {
  try {
    const result = await Notification.updateMany({ userId: req.params.userId, read: false }, { read: true });
    res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read', message: err.message });
  }
});

module.exports = router;
module.exports.createNotification = createNotification;
