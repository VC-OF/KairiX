const mongoose = require('mongoose');

const DependencyEventSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  dependencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaskDependency' },
  action: { type: String, enum: ['created', 'removed', 'blocked', 'resolved', 'remapped'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  details: { type: String, default: '' },
}, { timestamps: true });

DependencyEventSchema.index({ projectId: 1 });

module.exports = mongoose.model('DependencyEvent', DependencyEventSchema);
