const express = require('express');
const router = express.Router();
const timeTrackingService = require('../services/TimeTrackingService');
const { authenticateToken } = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');

// Helper to check if user has access to a project
async function hasProjectAccess(req, projectId) {
  if (req.user.globalRole === 'admin' || req.user.globalRole === 'executive') {
    return true;
  }
  const project = await Project.findById(projectId);
  if (!project) return false;
  return project.members.some(m => m.userId.toString() === req.user.userId);
}

// Helper to check if user has access to a task's project
async function hasTaskAccess(req, taskId) {
  const task = await Task.findById(taskId);
  if (!task) return false;
  return hasProjectAccess(req, task.projectId);
}

// Helper to get all project IDs the user has access to
async function getUserProjectIds(req) {
  if (req.user.globalRole === 'admin' || req.user.globalRole === 'executive') {
    return null; // Admin/Exec has access to everything
  }
  const projects = await Project.find({ 'members.userId': req.user.userId });
  return projects.map(p => p._id);
}

// Start timer
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { taskId, projectId, workDate } = req.body;
    
    // Check access to task/project
    const allowed = taskId ? await hasTaskAccess(req, taskId) : await hasProjectAccess(req, projectId);
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    const log = await timeTrackingService.startTimer(req.user.userId, taskId, projectId, workDate);
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Pause timer
router.post('/pause', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.body;
    
    const allowed = await hasTaskAccess(req, taskId);
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    const log = await timeTrackingService.pauseTimer(req.user.userId, taskId);
    if (!log) return res.status(404).json({ message: 'No active timer found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Resume timer
router.post('/resume', authenticateToken, async (req, res) => {
  try {
    const { taskId, projectId } = req.body;
    
    const allowed = taskId ? await hasTaskAccess(req, taskId) : await hasProjectAccess(req, projectId);
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    const log = await timeTrackingService.resumeTimer(req.user.userId, taskId, projectId);
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Stop timer
router.post('/stop', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.body;
    
    const allowed = await hasTaskAccess(req, taskId);
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    const log = await timeTrackingService.stopTimer(req.user.userId, taskId);
    if (!log) return res.status(404).json({ message: 'No active timer found' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add manual log
router.post('/manual', authenticateToken, async (req, res) => {
  try {
    const { taskId, projectId, startTime, endTime, description, isBillable } = req.body;
    
    const allowed = taskId ? await hasTaskAccess(req, taskId) : await hasProjectAccess(req, projectId);
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    const log = await timeTrackingService.addManualLog(req.user.userId, taskId, projectId, {
      startTime, endTime, description, isBillable
    });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get task logs
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const allowed = await hasTaskAccess(req, req.params.taskId);
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    const logs = await timeTrackingService.getTaskTimeLogs(req.params.taskId);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user today stats
router.get('/stats/today', authenticateToken, async (req, res) => {
  try {
    const stats = await timeTrackingService.getUserTodayStats(req.user.userId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get calendar data - time logs for a date range, optionally filtered by user
router.get('/calendar-data', authenticateToken, async (req, res) => {
  try {
    const { projectId, startDate, endDate, userId } = req.query;
    
    if (projectId) {
      const allowed = await hasProjectAccess(req, projectId);
      if (!allowed) {
        return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
      }
    }

    const query = {};
    if (projectId) {
      query.projectId = projectId;
    } else {
      const allowedProjectIds = await getUserProjectIds(req);
      if (allowedProjectIds) {
        query.projectId = { $in: allowedProjectIds };
      }
    }

    if (userId) query.userId = userId;
    if (startDate && endDate) {
      query.workDate = { $gte: startDate, $lte: endDate };
    }
    
    const TimeLog = require('../models/TimeLog');
    const logs = await TimeLog.find(query)
      .populate('userId', 'name email avatar')
      .populate('taskId', 'title status priority tags')
      .sort({ startTime: 1 });
    
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user's active or paused timer
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const TimeLog = require('../models/TimeLog');
    const log = await TimeLog.findOne({ 
      userId: req.user.userId, 
      status: { $in: ['active', 'paused'] } 
    })
    .populate('taskId', 'title status priority')
    .sort({ updatedAt: -1 });

    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all active timers for a project
router.get('/active-timers', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.query;
    
    if (projectId) {
      const allowed = await hasProjectAccess(req, projectId);
      if (!allowed) {
        return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
      }
    }

    const query = { status: 'active' };
    if (projectId) {
      query.projectId = projectId;
    } else {
      const allowedProjectIds = await getUserProjectIds(req);
      if (allowedProjectIds) {
        query.projectId = { $in: allowedProjectIds };
      }
    }
    
    const TimeLog = require('../models/TimeLog');
    const activeTimers = await TimeLog.find(query)
      .populate('userId', 'name email avatar')
      .populate('taskId', 'title status priority');
    
    res.json(activeTimers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get task timer status
router.get('/status/:taskId', authenticateToken, async (req, res) => {
  try {
    const allowed = await hasTaskAccess(req, req.params.taskId);
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied: You are not a member of this project' });
    }

    const log = await timeTrackingService.getTaskTimerStatus(req.user.userId, req.params.taskId);
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
