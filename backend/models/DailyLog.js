const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  date: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  completedTasks: [{ type: String }],
  blockers: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);
