const express = require('express');
const SystemSettings = require('../models/SystemSettings');
const { authenticateToken, requireGlobalRole } = require('../middleware/auth');
const router = express.Router();

const VALID_THEMES = ['default', 'ocean', 'forest', 'royal', 'sunset', 'crimson'];

/**
 * GET /api/settings
 * Fetch global system settings (requires authentication)
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
 * PUT /api/settings
 * Update global system settings (requires Global Admin)
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
