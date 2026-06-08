const mongoose = require('mongoose');

const SystemSettingsSchema = new mongoose.Schema({
  team_lead_enabled: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', SystemSettingsSchema);
