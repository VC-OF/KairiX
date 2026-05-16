const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import Models
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const DailyLog = require('./models/DailyLog');
const TaskComment = require('./models/TaskComment');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projectflow?directConnection=true';

async function runAudit() {
  console.log('🚀 Starting Database Audit...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const report = {
      timestamp: new Date().toISOString(),
      summary: {},
      rbacAudit: {},
      integrityIssues: [],
      dataAnomalies: []
    };

    // 1. Inventory Summary
    console.log('📊 Gathering inventory summary...');
    report.summary.collections = {
      users: await User.countDocuments(),
      projects: await Project.countDocuments(),
      tasks: await Task.countDocuments(),
      dailyLogs: await DailyLog.countDocuments(),
      comments: await TaskComment.countDocuments()
    };

    // 2. RBAC Audit
    console.log('🔐 Auditing RBAC...');
    report.rbacAudit.admins = await User.find({ globalRole: 'admin' }).select('name email status');
    report.rbacAudit.executives = await User.find({ globalRole: 'executive' }).select('name email status');
    
    // Find projects without managers
    const projectsWithoutManagers = await Project.find({
      'members.role': { $ne: 'ProjectManager' }
    }).select('name');
    if (projectsWithoutManagers.length > 0) {
      report.integrityIssues.push({
        type: 'PROJECTS_WITHOUT_MANAGER',
        count: projectsWithoutManagers.length,
        items: projectsWithoutManagers
      });
    }

    // 3. Integrity Checks (Orphaned Data)
    console.log('🔗 Checking data integrity...');
    
    // Orphaned Tasks (no project)
    const orphanedTasks = await Task.aggregate([
      {
        $lookup: {
          from: 'projects',
          localField: 'projectId',
          foreignField: '_id',
          as: 'project'
        }
      },
      { $match: { project: { $size: 0 } } }
    ]);
    if (orphanedTasks.length > 0) {
      report.integrityIssues.push({
        type: 'ORPHANED_TASKS',
        count: orphanedTasks.length,
        items: orphanedTasks.map(t => ({ id: t._id, title: t.title }))
      });
    }

    // Invalid Member References
    const invalidMembers = await Project.aggregate([
      { $unwind: '$members' },
      {
        $lookup: {
          from: 'users',
          localField: 'members.userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $match: { user: { $size: 0 } } }
    ]);
    if (invalidMembers.length > 0) {
      report.integrityIssues.push({
        type: 'INVALID_PROJECT_MEMBERS',
        count: invalidMembers.length,
        items: invalidMembers.map(m => ({ projectId: m._id, projectName: m.name, userId: m.members.userId }))
      });
    }

    // 4. Data Anomalies
    console.log('🔍 Detecting anomalies...');
    
    // Overdue Pending Tasks
    const overduePending = await Task.find({
      dueDate: { $lt: new Date() },
      status: 'pending'
    }).select('title dueDate');
    if (overduePending.length > 0) {
      report.dataAnomalies.push({
        type: 'OVERDUE_PENDING_TASKS',
        count: overduePending.length,
        items: overduePending
      });
    }

    // Desynced Assignees
    const allTasks = await Task.find().select('title assignedTo assignees');
    const desyncedAssignees = allTasks.filter(t => {
      if (!t.assignees || t.assignees.length === 0) return false;
      if (!t.assignedTo) return true; // Has assignees but no primary assignedTo
      return !t.assignees.some(a => a.toString() === t.assignedTo.toString());
    });
    
    if (desyncedAssignees.length > 0) {
      report.dataAnomalies.push({
        type: 'DESYNCED_TASK_ASSIGNMENT',
        count: desyncedAssignees.length,
        items: desyncedAssignees.map(t => ({ id: t._id, title: t.title, assignedTo: t.assignedTo, assignees: t.assignees }))
      });
    }

    // Save report
    const outputPath = path.join(__dirname, 'audit-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    
    console.log('\n✨ Audit Complete!');
    console.log(`📄 Report saved to: ${outputPath}`);
    
    // Display quick summary
    console.log('\n--- Quick Summary ---');
    console.log(`Total Users: ${report.summary.collections.users}`);
    console.log(`Total Projects: ${report.summary.collections.projects}`);
    console.log(`Total Tasks: ${report.summary.collections.tasks}`);
    console.log(`Integrity Issues Found: ${report.integrityIssues.length}`);
    console.log(`Data Anomalies Detected: ${report.dataAnomalies.length}`);
    console.log('----------------------\n');

  } catch (err) {
    console.error('❌ Audit Failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runAudit();
