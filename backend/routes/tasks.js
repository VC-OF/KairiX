const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { authenticateToken, hasProjectAccess, requireProjectRole } = require('../middleware/auth');
const notificationService = require('../services/NotificationService');
const router = express.Router();

/**
 * @openapi
 * /api/tasks/{projectId}:
 *   post:
 *     summary: Create a new task in a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *               dueDate:
 *                 type: string
 *               assignees:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Bad request
 *       403:
 *         description: Forbidden
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
 * @openapi
 * /api/tasks/{projectId}:
 *   get:
 *     summary: Get all tasks for a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tasks with pagination
 *       403:
 *         description: Forbidden
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
 * @openapi
 * /api/tasks/{projectId}/{taskId}:
 *   get:
 *     summary: Get a specific task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task details
 *       404:
 *         description: Task not found
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
 * @openapi
 * /api/tasks/{projectId}/{taskId}:
 *   put:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
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

      // Check if user is assigned to the task
      const isAssigned = (task.assignedTo?.toString() === req.user.userId) ||
        (task.assignees && task.assignees.some(id => id.toString() === req.user.userId));

      const isAdminOrManager = req.user.globalRole === 'admin' ||
        req.user.globalRole === 'executive' ||
        req.projectRole === 'ProjectManager';

      if (!isAdminOrManager && !isAssigned) {
        // Allow project members to update status in Kanban
        const isOnlyStatusUpdate = Object.keys(req.body).length === 1 && req.body.status !== undefined;
        if (!isOnlyStatusUpdate) {
          return res.status(403).json({ message: 'You do not have permission to edit this task' });
        }
      }

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
 * @openapi
 * /api/tasks/{projectId}/{taskId}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
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

// ─────────────────────────────────────────────────────────────────────────────
// SUBTASKS (Checklists)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/tasks/:projectId/:taskId/subtasks
 * Add a subtask to a task (any project member)
 */
router.post('/:projectId/:taskId/subtasks',
  hasProjectAccess('projectId'),
  async (req, res) => {
    try {
      const { title } = req.body;
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ message: 'Subtask title is required' });
      }
      if (title.trim().length > 200) {
        return res.status(400).json({ message: 'Subtask title must not exceed 200 characters' });
      }

      const task = await Task.findById(req.params.taskId);
      if (!task || task.projectId.toString() !== req.project._id.toString()) {
        return res.status(404).json({ message: 'Task not found' });
      }

      task.subtasks.push({ title: title.trim(), createdBy: req.user.userId });
      await task.save();

      const io = req.app.get('io');
      if (io) io.to(`project:${req.project._id}`).emit('task-updated', task);

      res.status(201).json(task.subtasks[task.subtasks.length - 1]);
    } catch (err) {
      console.error('Add subtask error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * PUT /api/tasks/:projectId/:taskId/subtasks/:subtaskId
 * Toggle or rename a subtask
 */
router.put('/:projectId/:taskId/subtasks/:subtaskId',
  hasProjectAccess('projectId'),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task || task.projectId.toString() !== req.project._id.toString()) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const subtask = task.subtasks.id(req.params.subtaskId);
      if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

      if (typeof req.body.completed === 'boolean') subtask.completed = req.body.completed;
      if (req.body.title && typeof req.body.title === 'string') {
        subtask.title = req.body.title.trim().slice(0, 200);
      }

      await task.save();

      const io = req.app.get('io');
      if (io) io.to(`project:${req.project._id}`).emit('task-updated', task);

      res.json(subtask);
    } catch (err) {
      console.error('Update subtask error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * DELETE /api/tasks/:projectId/:taskId/subtasks/:subtaskId
 * Remove a subtask (ProjectManager or TeamLead)
 */
router.delete('/:projectId/:taskId/subtasks/:subtaskId',
  hasProjectAccess('projectId'),
  requireProjectRole('ProjectManager', 'TeamLead'),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task || task.projectId.toString() !== req.project._id.toString()) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const subtask = task.subtasks.id(req.params.subtaskId);
      if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

      subtask.deleteOne();
      await task.save();

      const io = req.app.get('io');
      if (io) io.to(`project:${req.project._id}`).emit('task-updated', task);

      res.json({ message: 'Subtask deleted' });
    } catch (err) {
      console.error('Delete subtask error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// WATCHERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/tasks/:projectId/:taskId/watch
 * Watch a task (authenticated project member)
 */
router.post('/:projectId/:taskId/watch',
  hasProjectAccess('projectId'),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task || task.projectId.toString() !== req.project._id.toString()) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const userId = req.user.userId;
      const mongoose = require('mongoose');
      const userOid = new mongoose.Types.ObjectId(userId);

      if (!task.watchers.some(w => w.toString() === userId)) {
        task.watchers.push(userOid);
        await task.save();
      }

      res.json({ watching: true, watcherCount: task.watchers.length });
    } catch (err) {
      console.error('Watch task error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * DELETE /api/tasks/:projectId/:taskId/watch
 * Unwatch a task
 */
router.delete('/:projectId/:taskId/watch',
  hasProjectAccess('projectId'),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task || task.projectId.toString() !== req.project._id.toString()) {
        return res.status(404).json({ message: 'Task not found' });
      }

      task.watchers = task.watchers.filter(w => w.toString() !== req.user.userId);
      await task.save();

      res.json({ watching: false, watcherCount: task.watchers.length });
    } catch (err) {
      console.error('Unwatch task error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;

