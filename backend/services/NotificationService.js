const Notification = require('../models/Notification');

class NotificationService {
  /**
   * Create a notification and optionally emit it via Socket.io
   * @param {object} io - Socket.io server instance (optional)
   */
  async createNotification(userId, title, message, type = 'info', data = {}, io = null) {
    try {
      const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        data,
        read: false
      });

      // Emit real-time notification to the user's personal room
      if (io) {
        io.to(`user:${userId}`).emit('notification', notification);
      }

      return notification;
    } catch (err) {
      console.error('Create notification error:', err);
    }
  }

  async notifyTaskAssignment(task, assignerName, exceptUserId, io = null) {
    const title = 'New Task Assigned';
    const message = `${assignerName} assigned you a new task: ${task.title}`;

    for (const assigneeId of task.assignees) {
      if (assigneeId.toString() === exceptUserId?.toString()) continue;
      await this.createNotification(
        assigneeId, title, message, 'task',
        { taskId: task._id, projectId: task.projectId },
        io
      );
    }
  }

  async notifyTaskComment(task, commenterName, comment, exceptUserId, io = null) {
    const title = 'New Comment';
    const message = `${commenterName} commented on task: ${task.title}`;

    // Notify all assignees and the creator, except the commenter
    const recipients = new Set([
      ...task.assignees.map(id => id.toString()),
      task.createdBy.toString()
    ]);

    for (const recipientId of recipients) {
      if (recipientId === exceptUserId?.toString()) continue;
      await this.createNotification(
        recipientId, title, message, 'comment',
        { taskId: task._id, projectId: task.projectId },
        io
      );
    }
  }

  async notifyTaskStatusChange(task, changerName, oldStatus, newStatus, io = null) {
    const title = 'Task Status Updated';
    const message = `${changerName} moved "${task.title}" from ${oldStatus} to ${newStatus}`;

    const recipients = new Set([
      ...task.assignees.map(id => id.toString()),
      task.createdBy.toString()
    ]);

    for (const recipientId of recipients) {
      await this.createNotification(
        recipientId, title, message, 'task',
        { taskId: task._id, projectId: task.projectId },
        io
      );
    }
  }
}

module.exports = new NotificationService();
