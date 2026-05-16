const express = require('express');
const DailyLog = require('../models/DailyLog');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get logs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, page = 1, limit = 50 } = req.query;
    const query = projectId ? { projectId } : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      DailyLog.find(query)
        .populate('userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DailyLog.countDocuments(query)
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create log
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, content, completedTasks, blockers, projectId } = req.body;
    const log = await DailyLog.create({
      projectId: projectId || req.body.projectId,
      date,
      userId: req.user.userId,
      content: content || '',
      completedTasks: completedTasks || [],
      blockers: blockers || '',
    });
    await log.populate('userId', 'name email avatar');
    res.status(201).json(log);
  } catch (err) {
    console.error('Create log error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update log
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { content, completedTasks, blockers } = req.body;
    const log = await DailyLog.findByIdAndUpdate(
      req.params.id,
      { content, completedTasks, blockers },
      { new: true }
    ).populate('userId', 'name email avatar');
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete log
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await DailyLog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Log deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
