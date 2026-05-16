const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireGlobalRole } = require('../middleware/auth');
const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only for others, or self)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, email, globalRole, status, bio, avatar } = req.body;
    
    // Check if updating self or is admin
    if (req.user.userId !== req.params.id && req.user.globalRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }

    const updateData = { name, email, bio, avatar };
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

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireGlobalRole('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
