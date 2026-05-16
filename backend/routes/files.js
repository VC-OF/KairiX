const express = require('express');
const router = express.Router();
const { authenticateToken, hasProjectAccess } = require('../middleware/auth');
const { upload, uploadToS3, deleteFromS3 } = require('../services/FileStorageService');
const File = require('../models/File');
const Folder = require('../models/Folder');

// Get all files and folders in a project/folder
router.get('/:projectId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { folderId = null, search = '' } = req.query;

    const query = { projectId, isDeleted: false };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    } else {
      query.folderId = folderId === 'null' ? null : folderId;
    }

    const [files, folders] = await Promise.all([
      File.find(query).populate('uploadedBy', 'name avatar').sort({ createdAt: -1 }),
      search ? [] : Folder.find({ projectId, parentId: folderId === 'null' ? null : folderId }).sort({ name: 1 })
    ]);

    res.json({ files, folders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a folder
router.post('/:projectId/folders', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const { name, parentId = null } = req.body;
    const folder = await Folder.create({
      name,
      projectId: req.params.projectId,
      parentId,
      createdBy: req.user.userId
    });
    res.status(201).json(folder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upload files
router.post('/:projectId/upload', authenticateToken, hasProjectAccess('projectId'), upload.array('files'), async (req, res) => {
  try {
    const { projectId } = req.params;
    let { folderId = null } = req.body;
    
    if (folderId === 'null' || folderId === '' || folderId === 'undefined') {
      folderId = null;
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files were uploaded' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const { key, url } = await uploadToS3(file, projectId);
      return File.create({
        name: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        key,
        url,
        projectId,
        folderId,
        uploadedBy: req.user.userId
      });
    });

    const savedFiles = await Promise.all(uploadPromises);
    res.status(201).json(savedFiles);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Rename file
router.put('/:projectId/files/:fileId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const { name } = req.body;
    const file = await File.findByIdAndUpdate(req.params.fileId, { name }, { new: true });
    res.json(file);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete file (Soft delete)
router.delete('/:projectId/files/:fileId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const file = await File.findById(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    file.isDeleted = true;
    file.deletedBy = req.user.userId;
    await file.save();

    // Optionally delete from S3 here if hard delete is preferred
    // await deleteFromS3(file.key);

    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete folder and its contents recursively (Simplified)
router.delete('/:projectId/folders/:folderId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const { folderId } = req.params;
    
    // Mark files in folder as deleted
    await File.updateMany({ folderId }, { isDeleted: true, deletedBy: req.user.userId });
    
    // Delete the folder itself
    await Folder.findByIdAndDelete(folderId);
    
    // Note: A production app would recursively handle nested folders here
    
    res.json({ message: 'Folder deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
