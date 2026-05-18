const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const TaskDependency = require('../models/TaskDependency');
const DependencyEvent = require('../models/DependencyEvent');
const TimeLog = require('../models/TimeLog');
const DailyLog = require('../models/DailyLog');
const TaskComment = require('../models/TaskComment');
const File = require('../models/File');
const Folder = require('../models/Folder');
const fs = require('fs');
const path = require('path');
const { authenticateToken, requireGlobalRole, hasProjectAccess, requireProjectRole } = require('../middleware/auth');
const router = express.Router();

/**
 * POST /api/projects
 * Create a new project (Admin and User roles can create)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, visibility, priority } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    // Only admin and user roles can create projects
    if (req.user.globalRole === 'executive') {
      return res.status(403).json({ message: 'Executives cannot create projects' });
    }

    const project = new Project({
      name,
      description: description || '',
      visibility: visibility || 'public',
      priority: priority || 'medium',
      createdBy: req.user.userId,
      members: [{
        userId: req.user.userId,
        role: 'ProjectManager'
      }]
    });

    await project.save();
    await project.populate('members.userId', 'name email avatar globalRole');

    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/projects
 * Get all projects (Admin), or only assigned projects (User/Executive)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { includeArchived } = req.query;
    let query = {};

    if (includeArchived !== 'true') {
      query.status = 'active';
    }

    // Apply visibility restrictions for non-admins
    if (req.user.globalRole !== 'admin' && req.user.globalRole !== 'executive') {
      query['members.userId'] = req.user.userId;
      // In a more complex scenario, we might allow viewing 'public' projects even if not a member,
      // but for now, we follow the current "assigned only" rule for users.
    }

    let projects = await Project.find(query)
      .populate('createdBy', 'name email avatar')
      .populate('members.userId', 'name email avatar globalRole');

    // Filter out admin-only projects for non-admins (extra safety)
    if (req.user.globalRole !== 'admin' && req.user.globalRole !== 'executive') {
      projects = projects.filter(p => p.visibility !== 'admin-only');
    }

    res.json(projects);
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/projects/:projectId
 * Get project by ID (Admin, Executive, or project members)
 */
router.get('/:projectId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    // Extra safety: non-admins cannot see admin-only projects even if by ID (unless assigned?)
    if (req.user.globalRole !== 'admin' && req.user.globalRole !== 'executive' && req.project.visibility === 'admin-only') {
      return res.status(403).json({ message: 'Access denied: Admin-only project' });
    }

    await req.project.populate('createdBy', 'name email avatar');
    await req.project.populate('members.userId', 'name email avatar globalRole');
    res.json(req.project);
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/projects/:projectId
 * Update project (ProjectManager only)
 */
router.put('/:projectId',
  authenticateToken,
  hasProjectAccess('projectId'),
  requireProjectRole('ProjectManager'),
  async (req, res) => {
    try {
      const { name, description, status, visibility, priority, isLocked } = req.body;

      // Check if project is locked
      if (req.project.isLocked && req.user.globalRole !== 'admin' && isLocked !== false) {
        return res.status(403).json({ message: 'Project is locked and cannot be modified' });
      }

      if (name) req.project.name = name;
      if (description !== undefined) req.project.description = description;
      if (status) req.project.status = status;
      if (visibility) req.project.visibility = visibility;
      if (priority) req.project.priority = priority;
      if (isLocked !== undefined) req.project.isLocked = isLocked;

      await req.project.save();
      await req.project.populate('members.userId', 'name email avatar globalRole');

      const io = req.app.get('io');
      if (io) {
        io.to(`project:${req.project._id}`).emit('project-updated', req.project);
      }

      res.json(req.project);
    } catch (err) {
      console.error('Update project error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * DELETE /api/projects/:projectId
 * Delete project (ProjectManager only)
 */
router.delete('/:projectId',
  authenticateToken,
  hasProjectAccess('projectId'),
  requireProjectRole('ProjectManager'),
  async (req, res) => {
    try {
      const projectId = req.project._id;
      
      // Fetch tasks of this project to delete their comments
      const tasks = await Task.find({ projectId });
      const taskIds = tasks.map(t => t._id);

      // Perform cascading deletions of all project-related entities in parallel
      await Promise.all([
        Project.findByIdAndDelete(projectId),
        Task.deleteMany({ projectId }),
        TaskDependency.deleteMany({ projectId }),
        DependencyEvent.deleteMany({ projectId }),
        TimeLog.deleteMany({ projectId }),
        DailyLog.deleteMany({ projectId }),
        File.deleteMany({ projectId }),
        Folder.deleteMany({ projectId }),
        TaskComment.deleteMany({ taskId: { $in: taskIds } })
      ]);

      // Clean up local uploads directory for the project
      try {
        const uploadDir = path.join(__dirname, '../uploads', projectId.toString());
        if (fs.existsSync(uploadDir)) {
          fs.rmSync(uploadDir, { recursive: true, force: true });
        }
      } catch (fileErr) {
        console.error('Failed to clean up uploads directory for project:', fileErr);
      }

      const io = req.app.get('io');
      if (io) {
        io.to(`project:${req.project._id}`).emit('project-deleted', req.project._id.toString());
      }
      res.json({ message: 'Project and all related data deleted successfully' });
    } catch (err) {
      console.error('Delete project error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * POST /api/projects/:projectId/members
 * Add member to project (Admin or ProjectManager)
 */
router.post('/:projectId/members',
  authenticateToken,
  async (req, res) => {
    try {
      const { userId, role } = req.body;

      if (!userId || !role) {
        return res.status(400).json({ message: 'User ID and role are required' });
      }

      if (!['ProjectManager', 'TeamLead', 'TeamMember'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      // Find the project
      const project = await Project.findById(req.params.projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Allow admin/executive globally; otherwise check project role
      const isGlobalAdmin = req.user.globalRole === 'admin' || req.user.globalRole === 'executive';
      if (!isGlobalAdmin) {
        const member = project.members.find(m => m.userId.toString() === req.user.userId);
        if (!member || member.role !== 'ProjectManager') {
          return res.status(403).json({ message: 'Only Project Managers can add members' });
        }
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if already a member
      const existingMember = project.members.find(m => m.userId.toString() === userId);
      if (existingMember) {
        return res.status(409).json({ message: 'User is already a member of this project' });
      }

      // 1.4 Member Assignment Validation
      // Check if user is already in a high priority project
      const busyProjects = await Project.find({
        'members.userId': userId,
        status: 'active',
        priority: 'high',
        _id: { $ne: req.params.projectId }
      });

      if (busyProjects.length > 0 && !req.body.force) {
        return res.status(200).json({
          warning: true,
          message: `User is already allocated to high-priority project(s): ${busyProjects.map(p => p.name).join(', ')}. Proceed anyway?`,
          code: 'USER_BUSY'
        });
      }

      // Add member
      project.members.push({ userId, role });
      await project.save();
      await project.populate('members.userId', 'name email avatar globalRole');

      const io = req.app.get('io');
      if (io) {
        io.to(`project:${project._id}`).emit('project-updated', project);
        io.to(`user:${userId}`).emit('project-added', project);
      }

      res.status(201).json(project);
    } catch (err) {
      console.error('Add member error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  }
);

/**
 * PUT /api/projects/:projectId/members/:memberId
 * Update member role (ProjectManager only)
 */
router.put('/:projectId/members/:memberId',
  authenticateToken,
  hasProjectAccess('projectId'),
  requireProjectRole('ProjectManager'),
  async (req, res) => {
    try {
      const { role } = req.body;
      const { memberId } = req.params;

      if (!role) {
        return res.status(400).json({ message: 'Role is required' });
      }

      if (!['ProjectManager', 'TeamLead', 'TeamMember'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const member = req.project.members.find(m => m.userId.toString() === memberId);
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      member.role = role;
      await req.project.save();
      await req.project.populate('members.userId', 'name email avatar globalRole');

      const io = req.app.get('io');
      if (io) {
        io.to(`project:${req.project._id}`).emit('project-updated', req.project);
      }

      res.json(req.project);
    } catch (err) {
      console.error('Update member error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

/**
 * DELETE /api/projects/:projectId/members/:memberId
 * Remove member from project (ProjectManager only)
 */
router.delete('/:projectId/members/:memberId',
  authenticateToken,
  hasProjectAccess('projectId'),
  requireProjectRole('ProjectManager'),
  async (req, res) => {
    try {
      const { memberId } = req.params;

      // Prevent removing the last ProjectManager
      const projectManagers = req.project.members.filter(m => m.role === 'ProjectManager');
      const memberToRemove = req.project.members.find(m => m.userId.toString() === memberId);

      if (memberToRemove && memberToRemove.role === 'ProjectManager' && projectManagers.length === 1) {
        return res.status(400).json({ message: 'Cannot remove the only ProjectManager' });
      }

      req.project.members = req.project.members.filter(m => m.userId.toString() !== memberId);
      await req.project.save();
      await req.project.populate('members.userId', 'name email avatar globalRole');

      const io = req.app.get('io');
      if (io) {
        io.to(`project:${req.project._id}`).emit('project-updated', req.project);
        io.to(`user:${memberId}`).emit('project-removed', req.project._id.toString());
      }

      res.json(req.project);
    } catch (err) {
      console.error('Remove member error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
