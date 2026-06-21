const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

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
const settingsRoutes = require('./routes/settings');
const { authenticateToken, requireGlobalRole } = require('./middleware/auth');
const cron = require('node-cron');
const analyticsService = require('./services/AnalyticsService');
const SystemSettings = require('./models/SystemSettings');
const { setupSwagger } = require('./swagger');

const app = express();
const http = require('http').createServer(app);
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

const io = require('socket.io')(http, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projectflow?directConnection=true';

// Middleware
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
// Explicitly handle OPTIONS preflight for all routes before any other middleware
app.options(/.*/, cors(corsOptions));
app.use(helmet({
  xXssProtection: false,
  frameguard: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // needed for Vite dev HMR in dev
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", ...allowedOrigins, "ws:", "wss:"],
      frameSrc: ["'self'"],
      frameAncestors: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
}));

// Strip deprecated headers to satisfy compliance audits
app.use((req, res, next) => {
  res.removeHeader('X-XSS-Protection');
  res.removeHeader('X-Frame-Options');
  next();
});
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Rate Limiting — skip OPTIONS preflight requests so CORS headers are always returned
const skipPreflight = (req) => req.method === 'OPTIONS';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  skip: skipPreflight,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' }
});

// Auth limiter removed for unlimited login attempts
// const authLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 10,
//   skip: skipPreflight,
//   message: { message: 'Too many authentication attempts, please try again after an hour' }
// });

app.use('/api/', generalLimiter);
// app.use('/api/auth/login', authLimiter);
// app.use('/api/auth/signup', authLimiter);

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

// Cron Job for recurring tasks (runs at 1am daily)
cron.schedule('0 1 * * *', async () => {
  console.log('Running recurring tasks cron...');
  try {
    const Task = require('./models/Task');
    const now = new Date();
    const dueTasks = await Task.find({
      'recurrence.enabled': true,
      'recurrence.nextDue': { $lte: now }
    });

    for (const task of dueTasks) {
      // Create a new pending task as a copy
      const newTask = new Task({
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        createdBy: task.createdBy,
        assignees: task.assignees,
        assignedTo: task.assignedTo,
        priority: task.priority,
        tags: task.tags,
        estimatedHours: task.estimatedHours,
        status: 'pending',
        recurrence: { enabled: false },
      });
      await newTask.save();

      // Update nextDue on original
      const freq = task.recurrence.frequency;
      const nextDue = new Date(task.recurrence.nextDue);
      if (freq === 'daily') nextDue.setDate(nextDue.getDate() + 1);
      if (freq === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
      if (freq === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
      task.recurrence.nextDue = nextDue;
      await task.save();

      console.log(`Created recurring task: ${task.title}`);
    }
  } catch (err) {
    console.error('Recurring tasks cron error:', err);
  }
});

// Swagger Setup
setupSwagger(app);

// ... (Routes) ...
app.use('/api/auth', authRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/tasks', authenticateToken, commentRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/time-logs', authenticateToken, timeLogRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/users', authenticateToken, userRoutes);        // Fix #1: was missing auth
app.use('/api/logs', authenticateToken, logRoutes);           // Fix #1: was missing auth
app.use('/api/files', authenticateToken, fileRoutes);
app.use('/api/dependencies', authenticateToken, dependencyRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes); // Fix #5: was missing auth

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(distPath));

  app.use((req, res, next) => {
    // Exclude API routes from wildcard redirect
    if (!req.path.startsWith('/api/')) {
      return res.sendFile(path.resolve(distPath, 'index.html'));
    }
    next();
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
    // Seed global settings if not present
    const settingsCount = await SystemSettings.countDocuments();
    if (settingsCount === 0) {
      await SystemSettings.create({ team_lead_enabled: true });
      console.log('Seeded default system settings');
    }

    // Migrate any existing users from @KairiX.io / @projectflow.io to @oryfolks.com
    const usersToUpdate = await User.find({ email: /@(KairiX\.io|projectflow\.io)$/i });
    for (let u of usersToUpdate) {
      try {
        const targetEmail = u.email.replace(/@(KairiX\.io|projectflow\.io)/i, '@oryfolks.com');
        // Check if a user with the target email already exists
        const exists = await User.findOne({ email: targetEmail });
        if (exists) {
          console.warn(`Cannot migrate ${u.email} to ${targetEmail} because that email already exists.`);
          continue;
        }
        u.email = targetEmail;
        await u.save();
        console.log(`Migrated email for user ${u.name} to ${u.email}`);
      } catch (err) {
        console.error(`Error migrating email for user ${u.name}:`, err);
      }
    }

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    console.log('Seeding database...');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@oryfolks.com',
      password: 'Admin@123',
      globalRole: 'admin',
      avatar: 'AU',
      status: 'active'
    });

    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@oryfolks.com',
      password: 'John@123',
      globalRole: 'user',
      avatar: 'JD',
      status: 'active'
    });

    console.log('Database seeded successfully (users only)');

    console.log('Database seeded successfully');
    console.log('Test credentials:');
    console.log('  Admin: admin@oryfolks.com / Admin@123');
    console.log('  User: john@oryfolks.com / John@123');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}
