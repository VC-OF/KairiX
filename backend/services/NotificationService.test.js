const notificationService = require('./NotificationService');
const Notification = require('../models/Notification');

jest.mock('../models/Notification');

describe('NotificationService', () => {
  let mockIo, mockSocketRoom;

  beforeEach(() => {
    mockSocketRoom = {
      emit: jest.fn()
    };
    mockIo = {
      to: jest.fn().mockReturnValue(mockSocketRoom)
    };
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('should create notification in database and return it', async () => {
      const mockCreatedNotification = {
        _id: 'notif123',
        userId: 'user123',
        title: 'Test Title',
        message: 'Test Message',
        type: 'info',
        data: { test: true },
        read: false
      };
      Notification.create.mockResolvedValue(mockCreatedNotification);

      const result = await notificationService.createNotification(
        'user123', 'Test Title', 'Test Message', 'info', { test: true }
      );

      expect(Notification.create).toHaveBeenCalledWith({
        userId: 'user123',
        title: 'Test Title',
        message: 'Test Message',
        type: 'info',
        data: { test: true },
        read: false
      });
      expect(result).toEqual(mockCreatedNotification);
      expect(mockIo.to).not.toHaveBeenCalled();
    });

    it('should emit socket event if io instance is provided', async () => {
      const mockCreatedNotification = {
        _id: 'notif123',
        userId: 'user123',
        title: 'Test Title',
        message: 'Test Message',
        type: 'info',
        data: {},
        read: false
      };
      Notification.create.mockResolvedValue(mockCreatedNotification);

      await notificationService.createNotification(
        'user123', 'Test Title', 'Test Message', 'info', {}, mockIo
      );

      expect(mockIo.to).toHaveBeenCalledWith('user:user123');
      expect(mockSocketRoom.emit).toHaveBeenCalledWith('notification', mockCreatedNotification);
    });
  });

  describe('notifyTaskAssignment', () => {
    it('should call createNotification for each assignee except the excluder', async () => {
      const mockTask = {
        _id: 'task123',
        title: 'Complete Unit Tests',
        projectId: 'project123',
        assignees: ['user1', 'user2', 'user3']
      };

      const spyCreate = jest.spyOn(notificationService, 'createNotification').mockResolvedValue({});

      await notificationService.notifyTaskAssignment(mockTask, 'Admin Assigner', 'user2', mockIo);

      expect(spyCreate).toHaveBeenCalledTimes(2);
      expect(spyCreate).toHaveBeenCalledWith(
        'user1', 'New Task Assigned', 'Admin Assigner assigned you a new task: Complete Unit Tests', 'task',
        { taskId: 'task123', projectId: 'project123' }, mockIo
      );
      expect(spyCreate).toHaveBeenCalledWith(
        'user3', 'New Task Assigned', 'Admin Assigner assigned you a new task: Complete Unit Tests', 'task',
        { taskId: 'task123', projectId: 'project123' }, mockIo
      );
      expect(spyCreate).not.toHaveBeenCalledWith('user2', expect.any(String), expect.any(String), expect.any(String), expect.any(Object), expect.any(Object));

      spyCreate.mockRestore();
    });
  });

  describe('notifyTaskComment', () => {
    it('should notify all assignees and task creator, excluding the commenter', async () => {
      const mockTask = {
        _id: 'task123',
        title: 'Review PR',
        projectId: 'project123',
        createdBy: 'creatorUser',
        assignees: ['user1', 'user2']
      };

      const spyCreate = jest.spyOn(notificationService, 'createNotification').mockResolvedValue({});

      await notificationService.notifyTaskComment(mockTask, 'Commenter Guy', 'Nice job', 'user1', mockIo);

      // Recipients should be user2 and creatorUser (user1 is excluded since user1 is commenter)
      expect(spyCreate).toHaveBeenCalledTimes(2);
      expect(spyCreate).toHaveBeenCalledWith(
        'user2', 'New Comment', 'Commenter Guy commented on task: Review PR', 'comment',
        { taskId: 'task123', projectId: 'project123' }, mockIo
      );
      expect(spyCreate).toHaveBeenCalledWith(
        'creatorUser', 'New Comment', 'Commenter Guy commented on task: Review PR', 'comment',
        { taskId: 'task123', projectId: 'project123' }, mockIo
      );

      spyCreate.mockRestore();
    });
  });

  describe('notifyTaskStatusChange', () => {
    it('should notify assignees and creator about status updates', async () => {
      const mockTask = {
        _id: 'task123',
        title: 'Deploy to Cloud',
        projectId: 'project123',
        createdBy: 'creatorUser',
        assignees: ['assignee1']
      };

      const spyCreate = jest.spyOn(notificationService, 'createNotification').mockResolvedValue({});

      await notificationService.notifyTaskStatusChange(mockTask, 'Lead dev', 'in-progress', 'completed', mockIo);

      expect(spyCreate).toHaveBeenCalledTimes(2);
      expect(spyCreate).toHaveBeenCalledWith(
        'assignee1', 'Task Status Updated', 'Lead dev moved "Deploy to Cloud" from in-progress to completed', 'task',
        { taskId: 'task123', projectId: 'project123' }, mockIo
      );
      expect(spyCreate).toHaveBeenCalledWith(
        'creatorUser', 'Task Status Updated', 'Lead dev moved "Deploy to Cloud" from in-progress to completed', 'task',
        { taskId: 'task123', projectId: 'project123' }, mockIo
      );

      spyCreate.mockRestore();
    });
  });
});
