const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Keeping for backward compatibility if needed, but adding assignees
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['pending', 'in-progress', 'stuck', 'completed'], default: 'pending' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: { type: Date },
  startDate: { type: Date },
  endDate: { type: Date },
  estimatedHours: { type: Number, default: 0 },
  actualWorkedHours: { type: Number, default: 0 },
  tags: [String],
}, { timestamps: true });

// Index for efficient queries
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ assignees: 1 });
TaskSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Task', TaskSchema);
