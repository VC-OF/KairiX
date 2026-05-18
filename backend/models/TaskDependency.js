const mongoose = require('mongoose');

const TaskDependencySchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sourceTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  targetTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  dependencyType: { type: String, enum: ['blocks', 'blocked-by', 'depends-on', 'related-to', 'parent-child'], required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

TaskDependencySchema.index({ projectId: 1 });
TaskDependencySchema.index({ sourceTaskId: 1 });
TaskDependencySchema.index({ targetTaskId: 1 });

module.exports = mongoose.model('TaskDependency', TaskDependencySchema);
