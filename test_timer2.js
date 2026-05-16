const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'Admin@123'
    });
    const token = res.data.token;
    console.log('Login successful');
    
    // get tasks
    const tasksRes = await axios.get(`http://localhost:5000/api/tasks/project-1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const task = tasksRes.data.tasks[0];
    console.log('Task found:', task._id);
    
    // try start timer
    const startRes = await axios.post('http://localhost:5000/api/time-logs/start', {
      taskId: task._id,
      projectId: '',
      workDate: '2026-05-14'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('SUCCESS:', startRes.data);
  } catch (err) {
    console.error('ERROR:', err.response ? err.response.data : err.message);
  }
}
test();
