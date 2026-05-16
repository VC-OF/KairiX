const mongoose = require('mongoose');

const DailyReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  totalDuration: { type: Number, default: 0 }, // in seconds
  taskSummary: [{
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    duration: { type: Number },
    taskTitle: { type: String }
  }],
  projectBreakdown: [{
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    duration: { type: Number }
  }],
  productivityScore: { type: Number, default: 0 },
}, { timestamps: true });

DailyReportSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyReport', DailyReportSchema);
