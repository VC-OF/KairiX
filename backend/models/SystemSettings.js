const mongoose = require('mongoose');

const VALID_THEMES = ['default', 'ocean', 'forest', 'royal', 'sunset', 'crimson'];

const SystemSettingsSchema = new mongoose.Schema({
  team_lead_enabled: { type: Boolean, default: true },
  default_theme: { type: String, enum: VALID_THEMES, default: 'default' },
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
