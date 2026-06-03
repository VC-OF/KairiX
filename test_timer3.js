async function test() {
  try {
    // 1. Login as john@projectflow.io who is assigned to Setup authentication
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'john@projectflow.io', password: 'John@123' })
    });
    
    if (!res.ok) {
      const errData = await res.json();
      console.error('Login failed:', errData);
      return;
    }
    const data = await res.json();
    const token = data.token;
    console.log('Login successful for:', data.user.email);
    
    // 2. Fetch projects to get a valid projectId
    const projectsRes = await fetch('http://localhost:5000/api/projects', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!projectsRes.ok) {
      console.error('Fetch projects failed:', projectsRes.status);
      return;
    }
    const projects = await projectsRes.json();
    if (projects.length === 0) {
      console.error('No projects found.');
      return;
    }
    const targetProject = projects[0];
    console.log('Project found:', targetProject.name, 'ID:', targetProject._id);
    
    // 3. Fetch tasks for this project
    const tasksRes = await fetch(`http://localhost:5000/api/tasks/${targetProject._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!tasksRes.ok) {
      console.error('Fetch tasks failed:', tasksRes.status);
      return;
    }
    const tasksData = await tasksRes.json();
    // Find a task assigned to the user
    const task = tasksData.tasks.find(t => t.assignees.some(a => a._id === data.user.id || a === data.user.id));
    if (!task) {
      console.error('No task assigned to this user in project.');
      return;
    }
    console.log('Task found assigned to user:', task.title, 'ID:', task._id);
    
    // 4. Try starting timer with EMPTY projectId
    console.log('\n--- Testing start timer with EMPTY projectId ---');
    const startResEmpty = await fetch('http://localhost:5000/api/time-logs/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        taskId: task._id,
        projectId: '',
        workDate: '2026-05-14'
      })
    });
    const startDataEmpty = await startResEmpty.json();
    console.log('STATUS:', startResEmpty.status);
    console.log('RESPONSE:', startDataEmpty);

    // 5. Try starting timer with CORRECT projectId
    console.log('\n--- Testing start timer with CORRECT projectId ---');
    const startResCorrect = await fetch('http://localhost:5000/api/time-logs/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        taskId: task._id,
        projectId: targetProject._id,
        workDate: '2026-05-14'
      })
    });
    const startDataCorrect = await startResCorrect.json();
    console.log('STATUS:', startResCorrect.status);
    console.log('RESPONSE:', startDataCorrect);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
test();

