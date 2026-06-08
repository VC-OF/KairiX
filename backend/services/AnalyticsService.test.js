const analyticsService = require('./AnalyticsService');
const Task = require('../models/Task');
const TimeLog = require('../models/TimeLog');
const User = require('../models/User');
const DailyReport = require('../models/DailyReport');

jest.mock('../models/Task');
jest.mock('../models/TimeLog');
jest.mock('../models/User');
jest.mock('../models/DailyReport');

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProjectAnalytics', () => {
    it('should aggregate task metrics for a project', async () => {
      const mockTasks = [
        { status: 'pending', estimatedHours: 5, actualWorkedHours: 1 },
        { status: 'in-progress', estimatedHours: 10, actualWorkedHours: 4 },
        { status: 'completed', estimatedHours: 2, actualWorkedHours: 2 },
        { status: 'completed', estimatedHours: 0, actualWorkedHours: 0 }
      ];
      Task.find.mockResolvedValue(mockTasks);

      const result = await analyticsService.getProjectAnalytics('project123');

      expect(Task.find).toHaveBeenCalledWith({ projectId: 'project123' });
      expect(result).toEqual({
        totalEstimated: 17,
        totalActual: 7,
        taskStatus: {
          pending: 1,
          'in-progress': 1,
          stuck: 0,
          completed: 2
        },
        burnDownData: []
      });
    });
  });

  describe('getTeamProductivity', () => {
    it('should calculate active work hours grouped by team members', async () => {
      const mockLogs = [
        { userId: { name: 'John' }, duration: 3600 }, // 1 hour
        { userId: { name: 'Jane' }, duration: 7200 }, // 2 hours
        { userId: { name: 'John' }, duration: 1800 }  // 0.5 hours
      ];
      
      const mockFindChain = {
        populate: jest.fn().mockResolvedValue(mockLogs)
      };
      TimeLog.find.mockReturnValue(mockFindChain);

      const startDate = '2026-05-01';
      const endDate = '2026-05-31';
      const result = await analyticsService.getTeamProductivity('project123', startDate, endDate);

      expect(TimeLog.find).toHaveBeenCalledWith({
        projectId: 'project123',
        workDate: { $gte: startDate, $lte: endDate }
      });
      expect(mockFindChain.populate).toHaveBeenCalledWith('userId', 'name');
      expect(result).toEqual([
        { name: 'John', hours: 1.5 },
        { name: 'Jane', hours: 2 }
      ]);
    });
  });

  describe('getDailyHours', () => {
    it('should get sum of hours for past N days', async () => {
      TimeLog.find.mockResolvedValue([
        { duration: 3600 }, // 1 hour
        { duration: 1800 }  // 0.5 hours
      ]);

      const result = await analyticsService.getDailyHours('project123', 3);

      expect(TimeLog.find).toHaveBeenCalledTimes(3);
      expect(result.length).toBe(3);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('date');
      expect(result[0].hours).toBe(1.5);
    });
  });

  describe('getComprehensiveMemberStats', () => {
    it('should calculate detailed stats and efficiency for project members', async () => {
      const mockLogs = [
        {
          userId: { _id: { toString: () => 'userJohn' }, name: 'John', email: 'john@k.io', avatar: 'J' },
          duration: 36000 // 10 hours
        }
      ];

      const mockTasks = [
        {
          status: 'completed',
          assignees: [{ _id: { toString: () => 'userJohn' }, name: 'John' }]
        },
        {
          status: 'completed',
          assignees: [{ _id: { toString: () => 'userJohn' }, name: 'John' }]
        },
        {
          status: 'pending',
          dueDate: new Date(Date.now() - 86400000), // Overdue yesterday
          assignees: [{ _id: { toString: () => 'userJohn' }, name: 'John' }]
        }
      ];

      const mockLogsFindChain = {
        populate: jest.fn().mockResolvedValue(mockLogs)
      };
      TimeLog.find.mockReturnValue(mockLogsFindChain);

      const mockTasksFindChain = {
        populate: jest.fn().mockResolvedValue(mockTasks)
      };
      Task.find.mockReturnValue(mockTasksFindChain);

      const result = await analyticsService.getComprehensiveMemberStats('proj123', '2026-05-01', '2026-05-31');

      expect(result.memberStats[0]).toEqual({
        id: 'userJohn',
        name: 'John',
        email: 'john@k.io',
        avatar: 'J',
        totalHours: 10,
        tasksCompleted: 2,
        pendingTasks: 1,
        overdueTasks: 1,
        efficiency: 2, // (2 tasks / 10 hours) * 10 = 2
        taskDetails: {}
      });

      expect(result.highlights.mostHours).toEqual({ name: 'John', value: 10 });
      expect(result.highlights.mostTasks).toEqual({ name: 'John', value: 2 });
    });
  });

  describe('getTaskTimeStats', () => {
    it('should calculate worked vs estimated hours per task', async () => {
      const mockTasks = [
        { _id: 'task1', title: 'Task One', status: 'completed', estimatedHours: 4 }
      ];
      Task.find.mockResolvedValue(mockTasks);
      TimeLog.find.mockResolvedValue([
        { duration: 7200 } // 2 hours
      ]);

      const result = await analyticsService.getTaskTimeStats('project123');

      expect(Task.find).toHaveBeenCalledWith({ projectId: 'project123' });
      expect(TimeLog.find).toHaveBeenCalledWith({ taskId: 'task1' });
      expect(result).toEqual([
        {
          id: 'task1',
          title: 'Task One',
          status: 'completed',
          cumulativeHours: 2,
          estimatedHours: 4
        }
      ]);
    });
  });

  describe('generateDailyReports', () => {
    it('should aggregate yesterday\'s timelogs for each user and create/update daily reports', async () => {
      const mockUsers = [
        { _id: 'user1' }
      ];
      User.find.mockResolvedValue(mockUsers);

      const mockLogs = [
        { userId: 'user1', taskId: 't1', projectId: 'p1', duration: 7200 }, // 2 hours
        { userId: 'user1', taskId: 't2', projectId: 'p1', duration: 3600 }  // 1 hour
      ];
      TimeLog.find.mockResolvedValue(mockLogs);

      await analyticsService.generateDailyReports();

      expect(User.find).toHaveBeenCalled();
      expect(TimeLog.find).toHaveBeenCalledWith({ userId: 'user1', workDate: expect.any(String) });
      expect(DailyReport.findOneAndUpdate).toHaveBeenCalledWith(
        { userId: 'user1', date: expect.any(String) },
        {
          totalDuration: 10800,
          taskSummary: [
            { taskId: 't1', duration: 7200 },
            { taskId: 't2', duration: 3600 }
          ],
          projectBreakdown: [
            { projectId: 'p1', duration: 10800 }
          ],
          productivityScore: expect.any(Number) // 10800 / 28800 * 100 = 37.5
        },
        { upsert: true, new: true }
      );
    });
  });
});
