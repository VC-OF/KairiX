const express = require('express');
const TaskComment = require('../models/TaskComment');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { authenticateToken } = require('../middleware/auth');
const notificationService = require('../services/NotificationService');
const router = express.Router();

// Helper to check project membership for a task
async function checkTaskProjectAccess(req, res, taskId) {
  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404).json({ message: 'Task not found' });
    return null;
  }

  const project = await Project.findById(task.projectId);
  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return null;
  }

  // Admin and Executive roles have access to all projects
  if (req.user.globalRole === 'admin' || req.user.globalRole === 'executive') {
    return { task, project };
  }

  const isMember = project.members.some(m => m.userId.toString() === req.user.userId);
  if (!isMember) {
    res.status(403).json({ message: 'Access denied: Not a member of this project' });
    return null;
  }

  return { task, project };
}

// Get comments for a task
router.get('/:taskId/comments', authenticateToken, async (req, res) => {
  try {
    const access = await checkTaskProjectAccess(req, res, req.params.taskId);
    if (!access) return; // Response already sent

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
    const access = await checkTaskProjectAccess(req, res, req.params.taskId);
    if (!access) return; // Response already sent

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
    const { task } = access;
    const User = require('../models/User');
    const commenter = await User.findById(req.user.userId);
    const commenterName = commenter ? commenter.name : 'A team member';
    await notificationService.notifyTaskComment(task, commenterName, content, req.user.userId, io);
    
    if (io) {
      io.to(`project:${task.projectId}`).emit('comment-added', { taskId: task._id, comment });
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
