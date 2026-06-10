const express = require('express');
const SystemSettings = require('../models/SystemSettings');
const { authenticateToken, requireGlobalRole } = require('../middleware/auth');
const router = express.Router();

const VALID_THEMES = ['default', 'ocean', 'forest', 'royal', 'sunset', 'crimson'];

/**
 * @openapi
 * /api/settings:
 *   get:
 *     summary: Fetch global system settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Global system settings
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings({ team_lead_enabled: true, default_theme: 'default' });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error('Fetch settings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @openapi
 * /api/settings:
 *   put:
 *     summary: Update global system settings (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               team_lead_enabled:
 *                 type: boolean
 *               default_theme:
 *                 type: string
 *                 enum: [default, ocean, forest, royal, sunset, crimson]
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.put('/', authenticateToken, requireGlobalRole('admin'), async (req, res) => {
  try {
    const { team_lead_enabled, default_theme } = req.body;

    if (team_lead_enabled === undefined && default_theme === undefined) {
      return res.status(400).json({ message: 'At least one setting is required' });
    }

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings({});
    }

    if (team_lead_enabled !== undefined) {
      settings.team_lead_enabled = team_lead_enabled;
    }

    if (default_theme !== undefined) {
      if (!VALID_THEMES.includes(default_theme)) {
        return res.status(400).json({ message: 'Invalid theme value' });
      }
      settings.default_theme = default_theme;
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
