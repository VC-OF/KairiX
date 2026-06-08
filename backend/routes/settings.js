const express = require('express');
const SystemSettings = require('../models/SystemSettings');
const { authenticateToken, requireGlobalRole } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/settings
 * Fetch global system settings (requires authentication)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings({ team_lead_enabled: true });
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
    const { team_lead_enabled } = req.body;
    
    if (team_lead_enabled === undefined) {
      return res.status(400).json({ message: 'team_lead_enabled setting is required' });
    }

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings({ team_lead_enabled });
    } else {
      settings.team_lead_enabled = team_lead_enabled;
    }

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
