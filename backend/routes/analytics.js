const express = require('express');
const router = express.Router();
const analyticsService = require('../services/AnalyticsService');
const { authenticateToken, hasProjectAccess } = require('../middleware/auth');

/**
 * @openapi
 * /api/analytics/project/{projectId}:
 *   get:
 *     summary: Get project-level analytics (task counts, estimates vs actuals)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Project analytics stats
 *       500:
 *         description: Server error
 */
// Project-level analytics (task counts, estimated vs actual)
router.get('/project/:projectId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const stats = await analyticsService.getProjectAnalytics(req.params.projectId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @openapi
 * /api/analytics/productivity/{projectId}:
 *   get:
 *     summary: Get team productivity (hours per member) over a date range
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Productivity statistics
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /api/analytics/daily-hours/{projectId}:
 *   get:
 *     summary: Get daily hours worked by team over the last N days
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Daily hours statistics
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /api/analytics/comprehensive/{projectId}:
 *   get:
 *     summary: Get comprehensive member stats (Time, Tasks, Efficiency, Highlights)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Comprehensive member stats
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /api/analytics/tasks/{projectId}:
 *   get:
 *     summary: Get task specific time tracking stats
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Task specific time tracking stats
 *       500:
 *         description: Server error
 */
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
