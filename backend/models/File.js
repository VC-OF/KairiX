const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true }, // in bytes
  key: { type: String, required: true }, // S3 key or file path
  url: { type: String, required: true }, // S3 URL
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

FileSchema.index({ projectId: 1, folderId: 1, isDeleted: 1 });
FileSchema.index({ name: 'text' }); // For search

module.exports = mongoose.model('File', FileSchema);
