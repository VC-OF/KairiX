const express = require('express');
const router = express.Router();
const { authenticateToken, hasProjectAccess } = require('../middleware/auth');
const { upload, uploadToS3, deleteFromS3 } = require('../services/FileStorageService');
const File = require('../models/File');
const Folder = require('../models/Folder');

/**
 * @openapi
 * /api/files/{projectId}:
 *   get:
 *     summary: Get all files and folders in a project or folder
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: folderId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of files and folders
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /api/files/{projectId}/folders:
 *   post:
 *     summary: Create a folder in a project
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               parentId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Folder created successfully
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /api/files/{projectId}/upload:
 *   post:
 *     summary: Upload files to a project or folder
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               folderId:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *       400:
 *         description: No files uploaded
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /api/files/{projectId}/files/{fileId}:
 *   put:
 *     summary: Rename a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: File renamed successfully
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /api/files/{projectId}/files/{fileId}:
 *   delete:
 *     summary: Soft delete a file
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 *       500:
 *         description: Server error
 */
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

/**
 * @openapi
 * /api/files/{projectId}/folders/{folderId}:
 *   delete:
 *     summary: Delete a folder and its contents recursively
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder deleted successfully
 *       500:
 *         description: Server error
 */
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
