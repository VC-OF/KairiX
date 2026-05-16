const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { 
      type: String, 
      enum: ['ProjectManager', 'TeamLead', 'TeamMember'], 
      required: true 
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  visibility: { 
    type: String, 
    enum: ['public', 'restricted', 'admin-only'], 
    default: 'public' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'medium' 
  },
  isLocked: { type: Boolean, default: false },
  progress: { type: Number, default: 0 }, // percent complete (0-100)
}, { timestamps: true });

// Index for efficient queries
ProjectSchema.index({ createdBy: 1 });
ProjectSchema.index({ 'members.userId': 1 });

module.exports = mongoose.model('Project', ProjectSchema);
