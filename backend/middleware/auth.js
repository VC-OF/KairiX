const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const SystemSettings = require('../models/SystemSettings');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

/**
 * JWT Authentication Middleware
 * Verifies the JWT token and attaches user data to req.user
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  if (!token && req.cookies) {
    token = req.cookies.token;
  }
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

/**
 * Global Role Authorization Middleware
 * Checks if user has the required global role(s)
 */
function requireGlobalRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.globalRole)) {
      return res.status(403).json({ message: 'Insufficient global role permissions' });
    }
    
    next();
  };
}

/**
 * Project Access Middleware
 * Checks if user has access to the project and stores their project role
 */
function hasProjectAccess(projectIdParam = 'projectId') {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const projectId = req.params[projectIdParam] || req.body[projectIdParam];
      if (!projectId) {
        return res.status(400).json({ message: 'Project ID required' });
      }

      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ message: 'Invalid Project ID format' });
      }

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Get global system settings for team lead feature
      const settings = await SystemSettings.findOne();
      const teamLeadEnabled = settings ? settings.team_lead_enabled : true;

      // Admin and Executive roles have access to all projects
      if (req.user.globalRole === 'admin' || req.user.globalRole === 'executive') {
        req.project = project;
        req.projectRole = req.user.globalRole;
        return next();
      }

      // Check if user is a member of the project
      const member = project.members.find(m => m.userId.toString() === req.user.userId);
      if (!member) {
        return res.status(403).json({ message: 'Access denied: Not a member of this project' });
      }

      req.project = project;
      
      // Compute effective project role
      let role = member.role;
      if (role === 'TeamLead') {
        req.projectRole = teamLeadEnabled ? 'ProjectManager' : 'TeamMember';
      } else {
        req.projectRole = role;
      }
      
      next();
    } catch (err) {
      console.error('Project access error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  };
}

/**
 * Project Role Authorization Middleware
 * Checks if user's project role has the required permissions
 */
function requireProjectRole(...roles) {
  return (req, res, next) => {
    if (req.user && req.user.globalRole === 'admin') {
      return next();
    }
    if (!req.projectRole || !roles.includes(req.projectRole)) {
      return res.status(403).json({ message: 'Insufficient project role permissions' });
    }
    next();
  };
}

module.exports = { 
  authenticateToken, 
  requireGlobalRole, 
  hasProjectAccess,
  requireProjectRole,
  JWT_SECRET
};
