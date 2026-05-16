const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');
const DailyReport = require('../models/DailyReport');
const User = require('../models/User');

class AnalyticsService {
  async getProjectAnalytics(projectId) {
    const tasks = await Task.find({ projectId });
    
    const stats = {
      totalEstimated: 0,
      totalActual: 0,
      taskStatus: {
        pending: 0,
        'in-progress': 0,
        stuck: 0,
        completed: 0
      },
      burnDownData: [] // To be populated
    };

    tasks.forEach(task => {
      stats.totalEstimated += task.estimatedHours || 0;
      stats.totalActual += task.actualWorkedHours || 0;
      stats.taskStatus[task.status]++;
    });

    return stats;
  }

  async getTeamProductivity(projectId, startDate, endDate) {
    const logs = await TimeLog.find({
      projectId,
      workDate: { $gte: startDate, $lte: endDate }
    }).populate('userId', 'name');

    const productivity = {};
    logs.forEach(log => {
      const userName = log.userId.name;
      if (!productivity[userName]) productivity[userName] = 0;
      productivity[userName] += log.duration / 3600;
    });

    return Object.entries(productivity).map(([name, hours]) => ({ name, hours }));
  }

  async getDailyHours(projectId, days = 7) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

      const logs = await TimeLog.find({
        projectId,
        workDate: dateStr,
        status: 'completed'
      });

      const totalSeconds = logs.reduce((sum, l) => sum + (l.duration || 0), 0);
      result.push({ name: dayLabel, date: dateStr, hours: parseFloat((totalSeconds / 3600).toFixed(2)) });
    }
    return result;
  }

  async getComprehensiveMemberStats(projectId, startDate, endDate) {
    // 1. Fetch data
    const logs = await TimeLog.find({
      projectId,
      workDate: { $gte: startDate, $lte: endDate }
    }).populate('userId', 'name email avatar');

    const tasks = await Task.find({ projectId }).populate('assignees', 'name');

    const userStats = {};

    // 2. Process Logs (Time)
    logs.forEach(log => {
      const userId = log.userId._id.toString();
      if (!userStats[userId]) {
        userStats[userId] = {
          id: userId,
          name: log.userId.name,
          email: log.userId.email,
          avatar: log.userId.avatar,
          totalHours: 0,
          tasksCompleted: 0,
          pendingTasks: 0,
          overdueTasks: 0,
          efficiency: 0,
          taskDetails: {}
        };
      }
      const hours = (log.duration || 0) / 3600;
      userStats[userId].totalHours += hours;
    });

    // 3. Process Tasks (Completion & Efficiency)
    const today = new Date();
    tasks.forEach(task => {
      task.assignees.forEach(assignee => {
        const userId = assignee._id.toString();
        if (!userStats[userId]) {
          // Initialize if not in logs but assigned to tasks
          userStats[userId] = {
            id: userId,
            name: assignee.name,
            totalHours: 0,
            tasksCompleted: 0,
            pendingTasks: 0,
            overdueTasks: 0,
            efficiency: 0,
            taskDetails: {}
          };
        }

        if (task.status === 'completed') {
          userStats[userId].tasksCompleted++;
        } else {
          userStats[userId].pendingTasks++;
          if (task.dueDate && new Date(task.dueDate) < today) {
            userStats[userId].overdueTasks++;
          }
        }
      });
    });

    // 4. Calculate Efficiency & Finalize
    const statsArray = Object.values(userStats).map(stat => {
      // Efficiency = Tasks completed per 10 hours worked (normalized)
      stat.efficiency = stat.totalHours > 0 
        ? parseFloat(((stat.tasksCompleted / stat.totalHours) * 10).toFixed(1)) 
        : 0;
      
      stat.totalHours = parseFloat(stat.totalHours.toFixed(2));
      return stat;
    });

    // 5. Highlights
    const mostHours = [...statsArray].sort((a, b) => b.totalHours - a.totalHours)[0];
    const mostTasks = [...statsArray].sort((a, b) => b.tasksCompleted - a.tasksCompleted)[0];

    return {
      memberStats: statsArray,
      highlights: {
        mostHours: mostHours ? { name: mostHours.name, value: mostHours.totalHours } : null,
        mostTasks: mostTasks ? { name: mostTasks.name, value: mostTasks.tasksCompleted } : null
      }
    };
  }

  async getTaskTimeStats(projectId) {
    const tasks = await Task.find({ projectId });
    const taskStats = await Promise.all(tasks.map(async task => {
      const logs = await TimeLog.find({ taskId: task._id });
      const totalSeconds = logs.reduce((sum, l) => sum + (l.duration || 0), 0);
      return {
        id: task._id,
        title: task.title,
        status: task.status,
        cumulativeHours: parseFloat((totalSeconds / 3600).toFixed(2)),
        estimatedHours: task.estimatedHours || 0
      };
    }));

    return taskStats.sort((a, b) => b.cumulativeHours - a.cumulativeHours);
  }

  async generateDailyReports() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const users = await User.find();
    
    for (const user of users) {
      const logs = await TimeLog.find({ userId: user._id, workDate: yesterday });
      if (logs.length === 0) continue;

      let totalDuration = 0;
      const taskMap = {};
      const projectMap = {};

      logs.forEach(log => {
        totalDuration += log.duration;
        
        if (!taskMap[log.taskId]) taskMap[log.taskId] = 0;
        taskMap[log.taskId] += log.duration;

        if (!projectMap[log.projectId]) projectMap[log.projectId] = 0;
        projectMap[log.projectId] += log.duration;
      });

      await DailyReport.findOneAndUpdate(
        { userId: user._id, date: yesterday },
        {
          totalDuration,
          taskSummary: Object.entries(taskMap).map(([taskId, duration]) => ({ taskId, duration })),
          projectBreakdown: Object.entries(projectMap).map(([projectId, duration]) => ({ projectId, duration })),
          productivityScore: Math.min(100, (totalDuration / 28800) * 100) // 8 hours as baseline
        },
        { upsert: true, new: true }
      );
    }
  }
}

module.exports = new AnalyticsService();
