const mongoose = require('mongoose');
const TimeLog = require('./backend/models/TimeLog');
const Task = require('./backend/models/Task');
require('dotenv').config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kairix');
  console.log('Connected.');
  
  const tasks = await Task.find().limit(1);
  if (tasks.length === 0) {
    console.log('No tasks found');
    return;
  }
  const task = tasks[0];
  console.log('Task projectId:', task.projectId);
  
  process.exit(0);
}
run();
