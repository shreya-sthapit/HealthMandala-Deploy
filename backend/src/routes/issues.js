const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const { createNotification } = require('./notifications');

// ── POST /api/issues — patient raises a new issue ─────────────────────────
router.post('/', async (req, res) => {
  try {
    const { userId, userName, userEmail, priority, category, subject, description } = req.body;

    if (!userId || !subject?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'userId, subject and description are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId.' });
    }

    const issue = new Issue({ userId, userName, userEmail, priority, category, subject, description });
    await issue.save();

    // Notify the patient that their issue was received
    await createNotification({
      userId,
      type: 'issue_raised',
      title: '🎫 Issue Submitted',
      detail: `Your issue "${subject}" has been submitted (ID: ${issue.issueId}). Our team will review it shortly.`,
    });

    res.status(201).json({ success: true, issue });
  } catch (err) {
    console.error('Issue create error:', err);
    res.status(500).json({ error: 'Failed to create issue', message: err.message });
  }
});

// ── GET /api/issues/user/:userId — patient views their own issues ──────────
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId.' });
    }
    const issues = await Issue.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, issues });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issues', message: err.message });
  }
});

// ── GET /api/issues — super admin: list all issues (with optional filters) ─
router.get('/', async (req, res) => {
  try {
    const { status, priority } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const issues = await Issue.find(query).sort({ createdAt: -1 });
    res.json({ success: true, issues });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issues', message: err.message });
  }
});

// ── GET /api/issues/:id — get single issue by _id or issueId ─────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issue = mongoose.Types.ObjectId.isValid(id)
      ? await Issue.findById(id)
      : await Issue.findOne({ issueId: id });

    if (!issue) return res.status(404).json({ error: 'Issue not found.' });
    res.json({ success: true, issue });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issue', message: err.message });
  }
});

// ── PUT /api/issues/:id — super admin updates status / adds note ──────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote, resolvedBy } = req.body;

    const issue = mongoose.Types.ObjectId.isValid(id)
      ? await Issue.findById(id)
      : await Issue.findOne({ issueId: id });

    if (!issue) return res.status(404).json({ error: 'Issue not found.' });

    if (status) issue.status = status;
    if (adminNote !== undefined) issue.adminNote = adminNote;
    if (resolvedBy) issue.resolvedBy = resolvedBy;
    if (status === 'resolved' && !issue.resolvedAt) issue.resolvedAt = new Date();

    await issue.save();

    // Notify the patient about the status change
    const statusMessages = {
      in_progress: `Your issue (${issue.issueId}) is now being worked on by our support team.`,
      resolved: `Your issue (${issue.issueId}) has been resolved. ${adminNote ? `Resolution: ${adminNote}` : ''}`,
    };
    if (statusMessages[status] && issue.userId) {
      const titles = { in_progress: '🔧 Issue In Progress', resolved: '✅ Issue Resolved' };
      await createNotification({
        userId: issue.userId,
        type: 'issue_update',
        title: titles[status] || '📋 Issue Updated',
        detail: statusMessages[status],
      });
    }

    res.json({ success: true, issue });
  } catch (err) {
    console.error('Issue update error:', err);
    res.status(500).json({ error: 'Failed to update issue', message: err.message });
  }
});

module.exports = router;
