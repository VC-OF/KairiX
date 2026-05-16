const express = require('express');
const TaskComment = require('../models/TaskComment');
const Task = require('../models/Task');
const { authenticateToken } = require('../middleware/auth');
const notificationService = require('../services/NotificationService');
const router = express.Router();

// Get comments for a task
router.get('/:taskId/comments', authenticateToken, async (req, res) => {
  try {
    const comments = await TaskComment.find({ taskId: req.params.taskId })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to a task
router.post('/:taskId/comments', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });

    const comment = await TaskComment.create({
      taskId: req.params.taskId,
      userId: req.user.userId,
      content,
    });
    await comment.populate('userId', 'name email avatar');

    // Notification and Real-time
    const io = req.app.get('io');
    const task = await Task.findById(req.params.taskId);
    if (task) {
      await notificationService.notifyTaskComment(task, req.user.name || 'A team member', content, req.user.userId, io);
      
      if (io) {
        io.to(`project:${task.projectId}`).emit('comment-added', { taskId: task._id, comment });
      }
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
