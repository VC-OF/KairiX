const mongoose = require('mongoose');

const TimeLogSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // in seconds
  workDate: { type: String, required: true }, // YYYY-MM-DD
  description: { type: String, default: '' },
  isBillable: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'paused', 'completed'], default: 'completed' },
}, { timestamps: true });

// Index for efficient aggregation
TimeLogSchema.index({ userId: 1, workDate: 1 });
TimeLogSchema.index({ taskId: 1 });
TimeLogSchema.index({ projectId: 1 });

// User can now have multiple active logs

module.exports = mongoose.model('TimeLog', TimeLogSchema);
