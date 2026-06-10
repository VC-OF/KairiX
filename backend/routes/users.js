const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const { authenticateToken, requireGlobalRole } = require('../middleware/auth');
const router = express.Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       500:
 *         description: Server error
 */
// Get all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Update a user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               globalRole:
 *                 type: string
 *               status:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatar:
 *                 type: string
 *               jobTitle:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
// Update user (admin only for others, or self)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, email, globalRole, status, bio, avatar, jobTitle } = req.body;
    
    // Check if updating self or is admin
    if (req.user.userId !== req.params.id && req.user.globalRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    const updateData = { name, email, bio, avatar, jobTitle };
    if (req.user.globalRole === 'admin') {
      if (globalRole) updateData.globalRole = globalRole;
      if (status) updateData.status = status;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
// Delete user (admin only)
router.delete('/:id', authenticateToken, requireGlobalRole('admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Pull user from all projects' members list and unassign from all tasks in parallel
    await Promise.all([
      User.findByIdAndDelete(userId),
      Project.updateMany({}, { $pull: { members: { userId } } }),
      Task.updateMany({ assignedTo: userId }, { $set: { assignedTo: null } }),
      Task.updateMany({}, { $pull: { assignees: userId } })
    ]);

    res.json({ message: 'User and their project assignments deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
