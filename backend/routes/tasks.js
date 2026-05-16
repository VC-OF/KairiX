const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { authenticateToken, hasProjectAccess, requireProjectRole } = require('../middleware/auth');
const notificationService = require('../services/NotificationService');
const router = express.Router();

/**
 * POST /api/tasks/:projectId
 * Create a task (ProjectManager, TeamLead can create)
 */
router.post('/:projectId', 
  hasProjectAccess('projectId'),
  async (req, res) => {
    try {
      const { title, description, assignees, assignedTo, priority, dueDate, tags, status } = req.body;

      if (!title) {
        return res.status(400).json({ message: 'Task title is required' });
      }

      const task = new Task({
        projectId: req.project._id,
        title,
        description: description || '',
        createdBy: req.user.userId,
        assignedTo: (assignees && assignees.length > 0) ? assignees[0] : (assignedTo || null),
        assignees: assignees || (assignedTo ? [assignedTo] : []),
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        tags: tags || [],
        status: status || 'pending',
      });

      await task.save();
      await task.populate('createdBy', 'name email avatar');
      await task.populate('assignees', 'name email avatar');
      
      // Real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(`project:${req.project._id}`).emit('task-created', task);
      }

      // Notifications (pass io for real-time delivery)
      await notificationService.notifyTaskAssignment(task, req.user.name || 'A team member', req.user.userId, io);

      res.status(201).json(task);
    } catch (err) {
      console.error('Create task error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * GET /api/tasks/:projectId
 * Get all tasks for a project (any project member)
 */
router.get('/:projectId', 
  hasProjectAccess('projectId'),
  async (req, res) => {
    try {
      const { status, assignedTo, search, page = 1, limit = 50 } = req.query;
      const query = { projectId: req.project._id };

      if (status) query.status = status;
      if (assignedTo) query.assignees = assignedTo;
      if (search) query.title = { $regex: search, $options: 'i' };

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [tasks, total] = await Promise.all([
        Task.find(query)
          .populate('createdBy', 'name email avatar')
          .populate('assignedTo', 'name email avatar')
          .populate('assignees', 'name email avatar')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Task.countDocuments(query)
      ]);

      res.json({
        tasks,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (err) {
      console.error('Get tasks error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * GET /api/tasks/:projectId/:taskId
 * Get a specific task
 */
router.get('/:projectId/:taskId', 
  hasProjectAccess('projectId'),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId)
        .populate('createdBy', 'name email avatar')
        .populate('assignees', 'name email avatar');

      if (!task || task.projectId.toString() !== req.project._id.toString()) {
        return res.status(404).json({ message: 'Task not found' });
      }

      res.json(task);
    } catch (err) {
      console.error('Get task error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * PUT /api/tasks/:projectId/:taskId
 * Update a task
 * - ProjectManager & TeamLead: can update any task
 * - TeamMember: can only update their own tasks and only status
 */
router.put('/:projectId/:taskId', 
  hasProjectAccess('projectId'),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);

      if (!task || task.projectId.toString() !== req.project._id.toString()) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const { title, description, status, priority, assignees, assignedTo, dueDate, tags } = req.body;
      const oldStatus = task.status;

      // All roles with project access can update; TeamMember limited to own tasks / status only
      if (req.projectRole === 'TeamMember') {
        if (task.assignedTo?.toString() !== req.user.userId) {
          return res.status(403).json({ message: 'Can only update your own tasks' });
        }
        if (status) task.status = status;
      } else {
        if (title) task.title = title;
        if (description !== undefined) task.description = description;
        if (status) task.status = status;
        if (priority) task.priority = priority;
        if (assignees !== undefined) {
          task.assignees = assignees || [];
          task.assignedTo = (assignees && assignees.length > 0) ? assignees[0] : null;
        } else if (assignedTo !== undefined) {
          task.assignedTo = assignedTo || null;
          task.assignees = assignedTo ? [assignedTo] : [];
        }
        if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;
        if (tags) task.tags = tags;
      }

      await task.save();
      await task.populate('createdBy', 'name email avatar');
      await task.populate('assignees', 'name email avatar');

      // Real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(`project:${req.project._id}`).emit('task-updated', task);
      }

      // Notify on status change
      if (status && status !== oldStatus) {
        const changerName = req.user.name || 'A team member';
        await notificationService.notifyTaskStatusChange(task, changerName, oldStatus, status, io);
      }

      res.json(task);
    } catch (err) {
      console.error('Update task error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * DELETE /api/tasks/:projectId/:taskId
 * Delete a task (ProjectManager only)
 */
router.delete('/:projectId/:taskId', 
  hasProjectAccess('projectId'),
  requireProjectRole('ProjectManager'),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);

      if (!task || task.projectId.toString() !== req.project._id.toString()) {
        return res.status(404).json({ message: 'Task not found' });
      }

      await Task.findByIdAndDelete(req.params.taskId);

      // Real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(`project:${req.project._id}`).emit('task-deleted', req.params.taskId);
      }

      res.json({ message: 'Task deleted successfully' });
    } catch (err) {
      console.error('Delete task error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
