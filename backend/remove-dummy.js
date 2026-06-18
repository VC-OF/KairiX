const mongoose = require('mongoose');
const Project = require('./models/Project');
const Task = require('./models/Task');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/projectflow?directConnection=true';

async function removeDummyData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Remove specific dummy projects
    const dummyProjectNames = ['Main Workspace', 'Future Initiatives', 'Apollo Enterprise release (Demo)'];
    
    for (const name of dummyProjectNames) {
      const projects = await Project.find({ name });
      for (const p of projects) {
        await Task.deleteMany({ projectId: p._id });
        await Project.deleteOne({ _id: p._id });
        console.log(`Deleted project "${name}" and its tasks.`);
      }
    }
    
    console.log('Dummy data removed.');
  } catch (err) {
    console.error('Error removing dummy data:', err);
  } finally {
    mongoose.disconnect();
  }
}

removeDummyData();
