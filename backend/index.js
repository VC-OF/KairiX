const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

// Validate critical environment variables
function validateEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ CRITICAL ERROR: Missing environment variables: ${missing.join(', ')}`);
    console.error('The server cannot start without these. Please check your .env file.');
    process.exit(1);
  }
}
validateEnv();

const User = require('./models/User');
const Task = require('./models/Task');
const DailyLog = require('./models/DailyLog');
const Project = require('./models/Project');
const TaskComment = require('./models/TaskComment');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const timeLogRoutes = require('./routes/timeLogs');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');
const commentRoutes = require('./routes/comments');
const logRoutes = require('./routes/logs');
const fileRoutes = require('./routes/files');
const dependencyRoutes = require('./routes/dependencies');
const { authenticateToken, requireGlobalRole } = require('./middleware/auth');
const cron = require('node-cron');
const analyticsService = require('./services/AnalyticsService');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/KairiX?directConnection=true';

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : '*';
app.use(cors({
  origin: true, // Allow all origins for now to unblock
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development convenience
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: 'Too many authentication attempts, please try again after an hour' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Socket.io integration
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./middleware/auth');

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a project room for project-scoped events
  socket.on('join-project', (projectId) => {
    socket.join(`project:${projectId}`);
  });

  // Join a personal user room for direct notifications
  // The client sends their JWT token so we can identify the user
  socket.on('join-user', (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.join(`user:${decoded.userId}`);
      console.log(`User ${decoded.userId} joined personal room`);
    } catch (err) {
      console.warn('Invalid token in join-user event');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Pass io to app
app.set('io', io);

// Cron Job for daily reports (runs at midnight)
cron.schedule('0 0 * * *', () => {
  console.log('Running daily aggregation cron job...');
  analyticsService.generateDailyReports();
});

// ... (Routes) ...
app.use('/api/auth', authRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/time-logs', authenticateToken, timeLogRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', commentRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/dependencies', authenticateToken, dependencyRoutes);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));

  app.get('*', (req, res) => {
    // Exclude API routes from wildcard redirect
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.resolve(distPath, 'index.html'));
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Connect to MongoDB then start server
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    await seedDatabase();
    http.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));

/**
 * Seed database with initial data
 */
async function seedDatabase() {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    console.log('Seeding database...');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@KairiX.io',
      password: 'Admin@123',
      globalRole: 'admin',
      avatar: 'AU',
      status: 'active'
    });

    const executive = await User.create({
      name: 'Executive User',
      email: 'executive@KairiX.io',
      password: 'Executive@123',
      globalRole: 'executive',
      avatar: 'EU',
      status: 'active'
    });

    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@KairiX.io',
      password: 'John@123',
      globalRole: 'user',
      avatar: 'JD',
      status: 'active'
    });

    const user2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@KairiX.io',
      password: 'Jane@123',
      globalRole: 'user',
      avatar: 'JS',
      status: 'active'
    });

    const user3 = await User.create({
      name: 'Mike Johnson',
      email: 'mike@KairiX.io',
      password: 'Mike@123',
      globalRole: 'user',
      avatar: 'MJ',
      status: 'active'
    });

    const project1 = await Project.create({
      name: 'Main Workspace',
      description: 'Central hub for core team operations.',
      createdBy: admin._id,
      members: [
        { userId: admin._id, role: 'ProjectManager' },
        { userId: user1._id, role: 'TeamLead' },
        { userId: user2._id, role: 'TeamMember' }
      ],
      status: 'active'
    });

    const project2 = await Project.create({
      name: 'Future Initiatives',
      description: 'Exploratory projects and long-term research.',
      createdBy: user1._id,
      members: [
        { userId: user1._id, role: 'ProjectManager' },
        { userId: user2._id, role: 'TeamLead' },
        { userId: user3._id, role: 'TeamMember' }
      ],
      status: 'active'
    });

    await Task.create([
      {
        projectId: project1._id,
        title: 'Setup authentication',
        description: 'Implement JWT based authentication',
        createdBy: admin._id,
        assignedTo: user1._id,
        assignees: [user1._id],
        status: 'in-progress',
        priority: 'high',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        tags: ['backend', 'security']
      },
      {
        projectId: project1._id,
        title: 'Create user dashboard',
        description: 'Design and implement user dashboard UI',
        createdBy: admin._id,
        assignedTo: user2._id,
        assignees: [user2._id],
        status: 'pending',
        priority: 'medium',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        tags: ['frontend', 'ui']
      },
      {
        projectId: project2._id,
        title: 'Research new technologies',
        description: 'Evaluate and document new technologies',
        createdBy: user1._id,
        assignedTo: user3._id,
        assignees: [user3._id],
        status: 'pending',
        priority: 'low',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        tags: ['research']
      }
    ]);

    console.log('Database seeded successfully');
    console.log('Test credentials:');
    console.log('  Admin: admin@KairiX.io / Admin@123');
    console.log('  Executive: executive@KairiX.io / Executive@123');
    console.log('  User: john@KairiX.io / John@123');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}
