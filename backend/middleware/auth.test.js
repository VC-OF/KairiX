const jwt = require('jsonwebtoken');
const { 
  authenticateToken, 
  requireGlobalRole, 
  hasProjectAccess, 
  requireProjectRole, 
  JWT_SECRET 
} = require('./auth');
const Project = require('../models/Project');

jest.mock('jsonwebtoken');
jest.mock('../models/Project');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 when no token is provided', () => {
      authenticateToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid or expired', () => {
      req.headers['authorization'] = 'Bearer invalid_token';
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      authenticateToken(req, res, next);
      expect(jwt.verify).toHaveBeenCalledWith('invalid_token', JWT_SECRET, expect.any(Function));
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should set req.user and call next when token is valid', () => {
      const mockUser = { userId: '123', email: 'john@kairix.io', globalRole: 'user' };
      req.headers['authorization'] = 'Bearer valid_token';
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, mockUser);
      });

      authenticateToken(req, res, next);
      expect(jwt.verify).toHaveBeenCalledWith('valid_token', JWT_SECRET, expect.any(Function));
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('requireGlobalRole', () => {
    it('should return 401 when req.user is missing', () => {
      const middleware = requireGlobalRole('admin');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user does not have matching role', () => {
      req.user = { globalRole: 'user' };
      const middleware = requireGlobalRole('admin', 'executive');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient global role permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next when user has a matching role', () => {
      req.user = { globalRole: 'executive' };
      const middleware = requireGlobalRole('admin', 'executive');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('hasProjectAccess', () => {
    const validProjectId = '507f1f77bcf86cd799439011';

    it('should return 401 when req.user is missing', async () => {
      const middleware = hasProjectAccess();
      await middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 400 when Project ID is missing', async () => {
      req.user = { userId: 'user123', globalRole: 'user' };
      const middleware = hasProjectAccess();
      await middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Project ID required' });
    });

    it('should return 400 when Project ID is invalid format', async () => {
      req.user = { userId: 'user123', globalRole: 'user' };
      req.params.projectId = 'invalid-format-id';
      const middleware = hasProjectAccess();
      await middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Project ID format' });
    });

    it('should return 404 when project not found', async () => {
      req.user = { userId: 'user123', globalRole: 'user' };
      req.params.projectId = validProjectId;
      Project.findById.mockResolvedValue(null);

      const middleware = hasProjectAccess();
      await middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Project not found' });
    });

    it('should allow access and set properties for admin or executive global roles', async () => {
      req.user = { userId: 'admin123', globalRole: 'admin' };
      req.params.projectId = validProjectId;
      const mockProject = { _id: validProjectId, name: 'Test Project' };
      Project.findById.mockResolvedValue(mockProject);

      const middleware = hasProjectAccess();
      await middleware(req, res, next);

      expect(req.project).toEqual(mockProject);
      expect(req.projectRole).toBe('admin');
      expect(next).toHaveBeenCalled();
    });

    it('should deny access if normal user is not a member of the project', async () => {
      req.user = { userId: 'user123', globalRole: 'user' };
      req.params.projectId = validProjectId;
      const mockProject = {
        _id: validProjectId,
        name: 'Test Project',
        members: [{ userId: 'user999', role: 'TeamMember' }]
      };
      Project.findById.mockResolvedValue(mockProject);

      const middleware = hasProjectAccess();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Access denied: Not a member of this project' });
    });

    it('should allow access and set project role if user is a member of the project', async () => {
      req.user = { userId: 'user123', globalRole: 'user' };
      req.params.projectId = validProjectId;
      const mockProject = {
        _id: validProjectId,
        name: 'Test Project',
        members: [{ userId: { toString: () => 'user123' }, role: 'TeamLead' }]
      };
      Project.findById.mockResolvedValue(mockProject);

      const middleware = hasProjectAccess();
      await middleware(req, res, next);

      expect(req.project).toEqual(mockProject);
      expect(req.projectRole).toBe('TeamLead');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireProjectRole', () => {
    it('should allow access for global admin even if projectRole doesn\'t match', () => {
      req.user = { globalRole: 'admin' };
      req.projectRole = 'TeamMember';
      const middleware = requireProjectRole('ProjectManager', 'TeamLead');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access if projectRole is missing or does not match', () => {
      req.user = { globalRole: 'user' };
      req.projectRole = 'TeamMember';
      const middleware = requireProjectRole('ProjectManager', 'TeamLead');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Insufficient project role permissions' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access if projectRole matches', () => {
      req.user = { globalRole: 'user' };
      req.projectRole = 'TeamLead';
      const middleware = requireProjectRole('ProjectManager', 'TeamLead');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
