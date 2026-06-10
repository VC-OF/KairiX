const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  completed: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const TaskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, default: '', maxlength: 5000 },
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
  tags: [{ type: String, maxlength: 50 }],
  // ── Subtasks (checklists) ──────────────────────────────────────────────────
  subtasks: [SubtaskSchema],
  // ── Watchers ──────────────────────────────────────────────────────────────
  watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // ── Recurrence ────────────────────────────────────────────────────────────
  recurrence: {
    enabled: { type: Boolean, default: false },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    nextDue: { type: Date }
  },
}, { timestamps: true });

// Index for efficient queries
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ assignees: 1 });
TaskSchema.index({ createdBy: 1 });
TaskSchema.index({ watchers: 1 });
TaskSchema.index({ 'recurrence.enabled': 1, 'recurrence.nextDue': 1 });

module.exports = mongoose.model('Task', TaskSchema);

