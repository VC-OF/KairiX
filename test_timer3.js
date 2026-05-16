async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'Admin@123' })
    });
    const data = await res.json();
    const token = data.token;
    console.log('Login successful');
    
    // get tasks
    const tasksRes = await fetch(`http://localhost:5000/api/tasks/project-1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const tasksData = await tasksRes.json();
    const task = tasksData.tasks[0];
    console.log('Task found:', task._id);
    
    // try start timer with empty projectId
    const startRes = await fetch('http://localhost:5000/api/time-logs/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        taskId: task._id,
        projectId: '',
        workDate: '2026-05-14'
      })
    });
    const startData = await startRes.json();
    console.log('STATUS:', startRes.status);
    console.log('RESPONSE:', startData);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
test();
