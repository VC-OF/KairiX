const express = require('express');
const router = express.Router();
const analyticsService = require('../services/AnalyticsService');
const { authenticateToken, hasProjectAccess } = require('../middleware/auth');

// Project-level analytics (task counts, estimated vs actual)
router.get('/project/:projectId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const stats = await analyticsService.getProjectAnalytics(req.params.projectId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Team productivity (hours per member) over a date range
router.get('/productivity/:projectId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await analyticsService.getTeamProductivity(req.params.projectId, startDate, endDate);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Daily hours worked by the whole team over the last N days (for the area chart)
router.get('/daily-hours/:projectId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await analyticsService.getDailyHours(req.params.projectId, parseInt(days));
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Comprehensive member stats (Time, Tasks, Efficiency, Highlights)
router.get('/comprehensive/:projectId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const stats = await analyticsService.getComprehensiveMemberStats(req.params.projectId, startDate, endDate);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Task specific time tracking stats
router.get('/tasks/:projectId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const stats = await analyticsService.getTaskTimeStats(req.params.projectId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
