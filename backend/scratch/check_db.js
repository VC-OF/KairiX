const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');
const dotenv = require('dotenv');
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projectflow?directConnection=true';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const notifs = await Notification.find().populate('userId', 'name').sort({ createdAt: -1 }).limit(10);
  console.log('NOTIFICATIONS IN DB:');
  console.log(JSON.stringify(notifs, null, 2));
  process.exit(0);
}
run();
