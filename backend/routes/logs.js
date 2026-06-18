const express = require('express');
const DailyLog = require('../models/DailyLog');
const DailyLogComment = require('../models/DailyLogComment');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const notificationService = require('../services/NotificationService');
const router = express.Router();

// Helper to notify mentioned users
async function notifyMentionedUsers(text, authorUser, logId, projectId, io, isComment = false) {
  if (!text) return;
  
  const regex = /(?:^|[^a-zA-Z0-9_])(?:@|u\/)([a-zA-Z0-9_]+)/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1].toLowerCase());
  }
  
  if (matches.length === 0) return;
  const uniqueMatches = [...new Set(matches)];
  
  const activeUsers = await User.find({ status: 'active' });
  const authorUserIdStr = authorUser._id.toString();
  const mentionedUsers = activeUsers.filter(u => {
    const username = u.name.toLowerCase().replace(/\s+/g, '_');
    return uniqueMatches.includes(username) && u._id.toString() !== authorUserIdStr;
  });
  
  if (mentionedUsers.length === 0) return;
  
  const authorName = authorUser.name || 'A user';
  const title = 'You were mentioned';
  const type = 'mention';
  const message = isComment 
    ? `${authorName} mentioned you in a log comment.` 
    : `${authorName} mentioned you in a daily log.`;
  
  for (const user of mentionedUsers) {
    await notificationService.createNotification(
      user._id,
      title,
      message,
      type,
      { view: 'logs', projectId: projectId ? projectId.toString() : null, logId: logId ? logId.toString() : null },
      io
    );
  }
}


// Helper to build recursive threaded comment tree
function buildCommentTree(comments, currentUserId) {
  const commentsMap = {};
  const rootComments = [];

  comments.forEach(c => {
    let userVote = null;
    if (c.upvotedBy && c.upvotedBy.some(id => id.toString() === currentUserId)) {
      userVote = 'up';
    } else if (c.downvotedBy && c.downvotedBy.some(id => id.toString() === currentUserId)) {
      userVote = 'down';
    }

    commentsMap[c._id.toString()] = {
      id: c._id.toString(),
      userId: c.userId ? (c.userId._id || c.userId).toString() : '',
      userName: c.userId ? c.userId.name : 'Unknown User',
      userRole: c.userId ? (c.userId.globalRole || c.userId.role || 'user') : 'user',
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      score: c.score !== undefined ? c.score : 1,
      userVote,
      replies: []
    };
  });

  comments.forEach(c => {
    const node = commentsMap[c._id.toString()];
    if (c.parentId) {
      const parentNode = commentsMap[c.parentId.toString()];
      if (parentNode) {
        parentNode.replies.push(node);
      } else {
        rootComments.push(node);
      }
    } else {
      rootComments.push(node);
    }
  });

  return rootComments;
}

/**
 * @openapi
 * /api/logs:
 *   get:
 *     summary: Get daily logs feed
 *     tags: [Daily Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of daily logs with pagination
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, page = 1, limit = 50 } = req.query;
    const query = projectId ? { projectId } : {};

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      DailyLog.find(query)
        .populate('userId', 'name email avatar globalRole')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      DailyLog.countDocuments(query)
    ]);

    const logsWithThreads = await Promise.all(logs.map(async (log) => {
      const comments = await DailyLogComment.find({ logId: log._id })
        .populate('userId', 'name email avatar globalRole')
        .sort({ createdAt: 1 });

      const rootComments = buildCommentTree(comments, req.user.userId);

      let logUserVote = null;
      if (log.upvotedBy && log.upvotedBy.some(id => id.toString() === req.user.userId)) {
        logUserVote = 'up';
      } else if (log.downvotedBy && log.downvotedBy.some(id => id.toString() === req.user.userId)) {
        logUserVote = 'down';
      }

      return {
        ...log.toObject(),
        id: log._id.toString(),
        thread: {
          score: log.score !== undefined ? log.score : 1,
          userVote: logUserVote,
          comments: rootComments
        }
      };
    }));

    res.json({
      logs: logsWithThreads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @openapi
 * /api/logs:
 *   post:
 *     summary: Create a daily status update log
 *     tags: [Daily Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date]
 *             properties:
 *               date:
 *                 type: string
 *               content:
 *                 type: string
 *               projectId:
 *                 type: string
 *               completedTasks:
 *                 type: array
 *                 items:
 *                   type: string
 *               blockers:
 *                 type: string
 *     responses:
 *       201:
 *         description: Daily log created successfully
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { date, content, completedTasks, blockers, projectId } = req.body;
    const log = await DailyLog.create({
      projectId: projectId || req.body.projectId,
      date,
      userId: req.user.userId,
      content: content || '',
      completedTasks: completedTasks || [],
      blockers: blockers || '',
      score: 1,
      upvotedBy: [req.user.userId], // Creator auto-upvotes their log
      downvotedBy: []
    });
    await log.populate('userId', 'name email avatar globalRole');

    const newLog = {
      ...log.toObject(),
      id: log._id.toString(),
      thread: {
        score: 1,
        userVote: 'up',
        comments: []
      }
    };

    const io = req.app.get('io');
    if (io && log.projectId) {
      io.to(`project:${log.projectId}`).emit('log-added', {
        ...newLog,
        thread: { score: 1, userVote: null, comments: [] }
      });
    }

    // Trigger mention notifications
    await notifyMentionedUsers(
      (log.content || '') + ' ' + (log.blockers || ''),
      log.userId,
      log._id,
      log.projectId,
      io,
      false
    );

    res.status(201).json(newLog);
  } catch (err) {
    console.error('Create log error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @openapi
 * /api/logs/{id}:
 *   put:
 *     summary: Update a daily log
 *     tags: [Daily Logs]
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
 *               content:
 *                 type: string
 *               completedTasks:
 *                 type: array
 *                 items:
 *                   type: string
 *               blockers:
 *                 type: string
 *     responses:
 *       200:
 *         description: Log updated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Log not found
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { content, completedTasks, blockers } = req.body;
    const log = await DailyLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });

    if (log.userId.toString() !== req.user.userId && req.user.globalRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this log' });
    }

    log.content = content !== undefined ? content : log.content;
    log.completedTasks = completedTasks !== undefined ? completedTasks : log.completedTasks;
    log.blockers = blockers !== undefined ? blockers : log.blockers;
    await log.save();

    await log.populate('userId', 'name email avatar globalRole');

    const comments = await DailyLogComment.find({ logId: log._id })
      .populate('userId', 'name email avatar globalRole')
      .sort({ createdAt: 1 });

    const rootComments = buildCommentTree(comments, req.user.userId);

    let logUserVote = null;
    if (log.upvotedBy && log.upvotedBy.some(id => id.toString() === req.user.userId)) {
      logUserVote = 'up';
    } else if (log.downvotedBy && log.downvotedBy.some(id => id.toString() === req.user.userId)) {
      logUserVote = 'down';
    }

    const updatedLog = {
      ...log.toObject(),
      id: log._id.toString(),
      thread: {
        score: log.score !== undefined ? log.score : 1,
        userVote: logUserVote,
        comments: rootComments
      }
    };

    const io = req.app.get('io');
    if (io && log.projectId) {
      io.to(`project:${log.projectId}`).emit('log-updated', {
        logId: log._id.toString(),
        content: log.content,
        completedTasks: log.completedTasks,
        blockers: log.blockers
      });
    }

    // Trigger mention notifications
    await notifyMentionedUsers(
      (log.content || '') + ' ' + (log.blockers || ''),
      log.userId,
      log._id,
      log.projectId,
      io,
      false
    );

    res.json(updatedLog);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete log
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const log = await DailyLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });

    if (log.userId.toString() !== req.user.userId && req.user.globalRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this log' });
    }

    const projectId = log.projectId;
    await DailyLog.findByIdAndDelete(req.params.id);
    await DailyLogComment.deleteMany({ logId: req.params.id });

    const io = req.app.get('io');
    if (io && projectId) {
      io.to(`project:${projectId}`).emit('log-deleted', req.params.id);
    }

    res.json({ message: 'Log deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on a log post
router.post('/:id/vote', authenticateToken, async (req, res) => {
  try {
    const { direction } = req.body; // 'up' or 'down'
    const log = await DailyLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });

    const userIdStr = req.user.userId;
    let upvoted = log.upvotedBy.map(id => id.toString());
    let downvoted = log.downvotedBy.map(id => id.toString());

    if (direction === 'up') {
      if (upvoted.includes(userIdStr)) {
        // Toggle off upvote
        upvoted = upvoted.filter(id => id !== userIdStr);
      } else {
        // Upvote
        upvoted.push(userIdStr);
        downvoted = downvoted.filter(id => id !== userIdStr);
      }
    } else if (direction === 'down') {
      if (downvoted.includes(userIdStr)) {
        // Toggle off downvote
        downvoted = downvoted.filter(id => id !== userIdStr);
      } else {
        // Downvote
        downvoted.push(userIdStr);
        upvoted = upvoted.filter(id => id !== userIdStr);
      }
    }

    log.upvotedBy = upvoted;
    log.downvotedBy = downvoted;
    log.score = upvoted.length - downvoted.length;
    await log.save();

    const io = req.app.get('io');
    if (io && log.projectId) {
      io.to(`project:${log.projectId}`).emit('log-voted', {
        logId: log._id.toString(),
        score: log.score,
        upvotedBy: log.upvotedBy,
        downvotedBy: log.downvotedBy
      });
    }

    res.json({
      score: log.score,
      userVote: upvoted.includes(userIdStr) ? 'up' : (downvoted.includes(userIdStr) ? 'down' : null)
    });
  } catch (err) {
    console.error('Vote log error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment or reply to a log
router.post('/:logId/comments', authenticateToken, async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const logId = req.params.logId;

    const comment = await DailyLogComment.create({
      logId,
      parentId: parentId || null,
      userId: req.user.userId,
      content,
      score: 1,
      upvotedBy: [req.user.userId],
      downvotedBy: []
    });

    await comment.populate('userId', 'name email avatar globalRole');

    const newComment = {
      id: comment._id.toString(),
      userId: comment.userId._id.toString(),
      userName: comment.userId.name,
      userRole: comment.userId.globalRole || 'user',
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      score: comment.score,
      userVote: 'up',
      replies: []
    };

    const io = req.app.get('io');
    const log = await DailyLog.findById(logId);
    if (io && log && log.projectId) {
      io.to(`project:${log.projectId}`).emit('log-comment-added', {
        logId: logId,
        comment: { ...newComment, userVote: null },
        parentId: parentId || null
      });
    }

    // Trigger mention notifications
    if (log) {
      await notifyMentionedUsers(
        comment.content,
        comment.userId,
        logId,
        log.projectId,
        io,
        true
      );
    }

    res.status(201).json(newComment);
  } catch (err) {
    console.error('Add log comment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on a comment
router.post('/:logId/comments/:commentId/vote', authenticateToken, async (req, res) => {
  try {
    const { direction } = req.body; // 'up' or 'down'
    const comment = await DailyLogComment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const userIdStr = req.user.userId;
    let upvoted = comment.upvotedBy.map(id => id.toString());
    let downvoted = comment.downvotedBy.map(id => id.toString());

    if (direction === 'up') {
      if (upvoted.includes(userIdStr)) {
        upvoted = upvoted.filter(id => id !== userIdStr);
      } else {
        upvoted.push(userIdStr);
        downvoted = downvoted.filter(id => id !== userIdStr);
      }
    } else if (direction === 'down') {
      if (downvoted.includes(userIdStr)) {
        downvoted = downvoted.filter(id => id !== userIdStr);
      } else {
        downvoted.push(userIdStr);
        upvoted = upvoted.filter(id => id !== userIdStr);
      }
    }

    comment.upvotedBy = upvoted;
    comment.downvotedBy = downvoted;
    comment.score = upvoted.length - downvoted.length;
    await comment.save();

    const io = req.app.get('io');
    const log = await DailyLog.findById(logId);
    if (io && log && log.projectId) {
      io.to(`project:${log.projectId}`).emit('log-comment-voted', {
        logId: logId,
        commentId: comment._id.toString(),
        score: comment.score,
        upvotedBy: comment.upvotedBy,
        downvotedBy: comment.downvotedBy
      });
    }

    res.json({
      commentId: comment._id.toString(),
      score: comment.score,
      userVote: upvoted.includes(userIdStr) ? 'up' : (downvoted.includes(userIdStr) ? 'down' : null)
    });
  } catch (err) {
    console.error('Vote log comment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
