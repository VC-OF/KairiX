const mongoose = require('mongoose');
require('dotenv').config();

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('timelogs');
    
    console.log('Dropping index userId_1_status_1...');
    await collection.dropIndex('userId_1_status_1');
    console.log('Index dropped successfully.');
    
    process.exit(0);
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
       console.log('Index not found, ignoring.');
       process.exit(0);
    }
    console.error('Error dropping index:', err);
    process.exit(1);
  }
}

dropIndex();
