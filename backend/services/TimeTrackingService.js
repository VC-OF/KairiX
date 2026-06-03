const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');
const DailyReport = require('../models/DailyReport');

class TimeTrackingService {
  async startTimer(userId, taskId, projectId, workDate = null) {
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');
    
    const isAssigned = (task.assignedTo && task.assignedTo.toString() === userId) || 
                       (task.assignees && task.assignees.some(id => id.toString() === userId));
    if (!isAssigned) throw new Error('Only assigned members can start the task timer');

    // Check if there's an already active timer for this user
    const activeLog = await TimeLog.findOne({ userId, status: 'active' });
    if (activeLog) {
      // Stop the previous active log
      await this.stopTimer(userId, activeLog.taskId);
    }

    const now = new Date();
    const dateToUse = workDate || now.toISOString().split('T')[0];
    const projectToUse = projectId || task.projectId;

    const log = await TimeLog.create({
      taskId,
      projectId: projectToUse,
      userId,
      startTime: now,
      workDate: dateToUse,
      status: 'active'
    });

    return log;
  }

  async pauseTimer(userId, taskId) {
    const log = await TimeLog.findOne({ userId, taskId, status: 'active' });
    if (!log) return null;

    const endTime = new Date();
    const duration = Math.floor((endTime - log.startTime) / 1000);

    log.endTime = endTime;
    log.duration = duration;
    log.status = 'paused';
    await log.save();

    return log;
  }

  async resumeTimer(userId, taskId, projectId) {
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');
    
    const isAssigned = (task.assignedTo && task.assignedTo.toString() === userId) || 
                       (task.assignees && task.assignees.some(id => id.toString() === userId));
    if (!isAssigned) throw new Error('Only assigned members can resume the task timer');

    // Check for active timer
    const activeLog = await TimeLog.findOne({ userId, status: 'active' });
    if (activeLog) {
      await this.stopTimer(userId, activeLog.taskId);
    }

    // Find the last paused log to get the workDate
    const lastLog = await TimeLog.findOne({ userId, taskId, status: 'paused' }).sort({ createdAt: -1 });
    const workDate = lastLog ? lastLog.workDate : new Date().toISOString().split('T')[0];
    const projectToUse = projectId || task.projectId;

    const now = new Date();
    const log = await TimeLog.create({
      taskId,
      projectId: projectToUse,
      userId,
      startTime: now,
      workDate,
      status: 'active'
    });

    return log;
  }

  async stopTimer(userId, taskId) {
    // Find active log
    const activeLog = await TimeLog.findOne({ userId, taskId, status: 'active' });
    if (activeLog) {
      const endTime = new Date();
      const duration = Math.floor((endTime - activeLog.startTime) / 1000);
      activeLog.endTime = endTime;
      activeLog.duration = duration;
      activeLog.status = 'completed';
      await activeLog.save();
    }

    // Also mark any paused logs for this task as completed
    await TimeLog.updateMany(
      { userId, taskId, status: 'paused' },
      { $set: { status: 'completed' } }
    );

    // Update actual worked hours in Task
    const allLogsForTask = await TimeLog.find({ taskId, status: 'completed' });
    const totalDurationSeconds = allLogsForTask.reduce((acc, l) => acc + (l.duration || 0), 0);
    
    await Task.findByIdAndUpdate(taskId, {
      actualWorkedHours: totalDurationSeconds / 3600
    });

    // Update Daily Report
    // Use the workDate from the log if found, otherwise today
    const lastLog = await TimeLog.findOne({ userId, taskId }).sort({ createdAt: -1 });
    const workDate = lastLog ? lastLog.workDate : new Date().toISOString().split('T')[0];
    await this.updateDailyReport(userId, workDate);

    return activeLog || { status: 'completed' };
  }

  async updateDailyReport(userId, date) {
    const logs = await TimeLog.find({ userId, workDate: date, status: 'completed' });
    
    let totalDuration = 0;
    const taskSummaryMap = new Map();
    const projectBreakdownMap = new Map();

    for (const log of logs) {
      totalDuration += log.duration;
      
      // Task Summary
      if (!taskSummaryMap.has(log.taskId.toString())) {
        const task = await Task.findById(log.taskId);
        taskSummaryMap.set(log.taskId.toString(), {
          taskId: log.taskId,
          duration: 0,
          taskTitle: task ? task.title : 'Unknown Task'
        });
      }
      taskSummaryMap.get(log.taskId.toString()).duration += log.duration;

      // Project Breakdown
      if (!projectBreakdownMap.has(log.projectId.toString())) {
        projectBreakdownMap.set(log.projectId.toString(), {
          projectId: log.projectId,
          duration: 0
        });
      }
      projectBreakdownMap.get(log.projectId.toString()).duration += log.duration;
    }

    const taskSummary = Array.from(taskSummaryMap.values());
    const projectBreakdown = Array.from(projectBreakdownMap.values());

    await DailyReport.findOneAndUpdate(
      { userId, date },
      {
        totalDuration,
        taskSummary,
        projectBreakdown
      },
      { upsert: true, new: true }
    );
  }

  async addManualLog(userId, taskId, projectId, data) {
    const task = await Task.findById(taskId);
    if (!task) throw new Error('Task not found');
    
    const isAssigned = (task.assignedTo && task.assignedTo.toString() === userId) || 
                       (task.assignees && task.assignees.some(id => id.toString() === userId));
    if (!isAssigned) throw new Error('Only assigned members can log time for this task');

    const { startTime, endTime, description, isBillable } = data;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = Math.floor((end - start) / 1000);
    const workDate = start.toISOString().split('T')[0];
    const projectToUse = projectId || task.projectId;

    const log = await TimeLog.create({
      taskId,
      projectId: projectToUse,
      userId,
      startTime: start,
      endTime: end,
      duration,
      workDate,
      description,
      isBillable,
      status: 'completed'
    });

    // Update actual worked hours in Task
    await Task.findByIdAndUpdate(taskId, {
      $inc: { actualWorkedHours: duration / 3600 }
    });

    // Update Daily Report
    await this.updateDailyReport(userId, workDate);

    return log;
  }

  async getTaskTimerStatus(userId, taskId) {
    const today = new Date().toISOString().split('T')[0];
    
    // Find all logs for this user & task today, OR any active log (which could have started yesterday)
    const logs = await TimeLog.find({ 
      userId, 
      taskId,
      $or: [
        { workDate: today },
        { status: 'active' }
      ]
    });
    
    let totalDuration = 0;
    let status = 'idle';
    let startTime = null;

    logs.forEach(log => {
      if (log.status === 'active') {
        status = 'active';
        startTime = log.startTime;
      } else if (log.status === 'paused') {
        if (log.workDate === today) {
          totalDuration += log.duration;
        }
      } else {
        if (log.workDate === today) {
          totalDuration += log.duration;
        }
      }
    });

    return { status, startTime, accumulatedTime: totalDuration };
  }

  async getTaskTimeLogs(taskId) {
    return await TimeLog.find({ taskId }).populate('userId', 'name avatar').sort({ startTime: -1 });
  }

  async getUserTodayStats(userId) {
    const today = new Date().toISOString().split('T')[0];
    const logs = await TimeLog.find({ userId, workDate: today });
    
    let totalSeconds = 0;
    logs.forEach(log => {
      if (log.status === 'active') {
        totalSeconds += Math.floor((new Date() - log.startTime) / 1000);
      } else {
        totalSeconds += log.duration;
      }
    });

    return {
      totalHours: totalSeconds / 3600,
      logCount: logs.length
    };
  }
}

module.exports = new TimeTrackingService();
