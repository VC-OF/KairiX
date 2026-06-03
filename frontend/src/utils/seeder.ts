import { api } from './api';

export async function seedPremiumDemoData(store: any): Promise<void> {
  store.setState({ isLoading: true });

  try {
    // 1. Fetch existing users to assign tasks
    const users = await store.getState().fetchUsers();
    if (!users || users.length === 0) {
      throw new Error('No users available to assign mock data.');
    }

    const admin = users.find((u: any) => u.role === 'admin') || users[0];
    const jane = users.find((u: any) => u.name.toLowerCase().includes('jane')) || users[Math.min(1, users.length - 1)];
    const john = users.find((u: any) => u.name.toLowerCase().includes('john')) || users[Math.min(2, users.length - 1)];

    // 2. Create the Premium Project
    await store.getState().addProject({
      name: 'Apollo Enterprise release (Demo)',
      description: 'Next-gen white-labeled real-time SaaS platform featuring visual workflow charts, multiplayer sync nodes, and predictive risk analysis.',
      status: 'active',
      visibility: 'public',
      priority: 'high',
      isLocked: false,
    });

    // Refresh projects to get our new project
    const projects = await store.getState().fetchProjects();
    const premiumProject = projects.find((p: any) => p.name.includes('Apollo'));
    if (!premiumProject) {
      throw new Error('Failed to create the Apollo demo project.');
    }

    // Set as active project
    await store.getState().setProject(premiumProject);
    const projectId = premiumProject.id;

    // Add Jane and John to the project members list if not already
    try {
      await store.getState().addMemberToProject(projectId, jane.id);
      await store.getState().addMemberToProject(projectId, john.id);
    } catch { /* ignore if already member */ }

    // 3. Definition of Premium Tasks
    const mockTasks = [
      {
        title: 'Core Architecture & HSL Accents Setup',
        description: 'Set up Express server, MongoDB schemas, JWT multi-tenant auth middleware, and global CSS design variables.',
        priority: 'high' as const,
        assignees: [admin.id],
        dueDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['infra', 'auth'],
        status: 'completed' as const,
        estimatedHours: 16,
        actualWorkedHours: 14,
      },
      {
        title: 'Design System & Glassmorphic Interface',
        description: 'Design and polish the premium dark glass panels, harmony layout widgets, and active light/dark theme variables.',
        priority: 'medium' as const,
        assignees: [jane.id],
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['ui', 'ux'],
        status: 'completed' as const,
        estimatedHours: 12,
        actualWorkedHours: 11,
      },
      {
        title: 'Multiplayer Socket Sync Engine',
        description: 'Integrate full-duplex socket connections for real-time task movement, updates, and collaborative activity indicators.',
        priority: 'high' as const,
        assignees: [john.id],
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['socket', 'sync'],
        status: 'in-progress' as const,
        estimatedHours: 20,
        actualWorkedHours: 16,
      },
      {
        title: 'Interactive guided Onboarding Tour',
        description: 'Build an elegant step-by-step guided onboarding card walkthrough to introduce visiting clients to core widgets.',
        priority: 'medium' as const,
        assignees: [jane.id],
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['ui', 'onboarding'],
        status: 'in-progress' as const,
        estimatedHours: 18,
        actualWorkedHours: 10,
      },
      {
        title: 'Cascading Delay Risk Predictor AI',
        description: 'Construct the advanced algorithm to parse dependency flows, calculate timelines, and predict bottleneck risks in real time.',
        priority: 'high' as const,
        assignees: [admin.id],
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['algorithm', 'ai'],
        status: 'stuck' as const,
        estimatedHours: 24,
        actualWorkedHours: 22,
      },
      {
        title: 'White-Labeled Branding accent palette',
        description: 'Expose a setting palette inside project options to customize brand logos and propagate accent color variables globally.',
        priority: 'low' as const,
        assignees: [jane.id],
        dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['settings', 'white-label'],
        status: 'pending' as const,
        estimatedHours: 10,
        actualWorkedHours: 0,
      },
      {
        title: 'Client Presentation & Delivery Portal',
        description: 'Prepare the ultimate white-glove client demonstration space showcasing modern collaboration interfaces and tools.',
        priority: 'high' as const,
        assignees: [john.id],
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['demo', 'client'],
        status: 'pending' as const,
        estimatedHours: 8,
        actualWorkedHours: 0,
      },
    ];

    // 4. Create tasks sequentially and update their estimated/actual times
    for (const t of mockTasks) {
      await store.getState().addTask({
        title: t.title,
        description: t.description,
        assignees: t.assignees,
        priority: t.priority,
        dueDate: t.dueDate,
        tags: t.tags,
        status: t.status,
      });

      // Refetch tasks to find the created task ID
      await store.getState().fetchTasks(projectId);
      const created = store.getState().tasks.find((tk: any) => tk.title === t.title);

      if (created) {
        // Update estimated and actual worked hours
        await store.getState().updateTask(created.id, {
          estimatedHours: t.estimatedHours,
          actualWorkedHours: t.actualWorkedHours,
        });

        // Add manual time logs so analytics charts compile beautifully
        if (t.actualWorkedHours > 0) {
          const hoursLog = Math.floor(t.actualWorkedHours);
          try {
            await api.post('/time-logs/manual', {
              taskId: created.id,
              projectId,
              startTime: new Date(Date.now() - 24 * 60 * 60 * 1000 - hoursLog * 60 * 60 * 1000).toISOString(),
              endTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              description: `Time spent completing work item: "${t.title}"`,
              isBillable: true,
            });
          } catch (e) {
            console.error('Failed to write time log:', e);
          }
        }
      }
    }

    // Refresh tasks once more to have correct data
    await store.getState().fetchTasks(projectId);
    const dbTasks = store.getState().tasks;

    const findTask = (title: string) => dbTasks.find((t: any) => t.title.includes(title));

    const t1 = findTask('Core Architecture');
    const t2 = findTask('Design System');
    const t3 = findTask('Multiplayer Socket');
    const t4 = findTask('Interactive guided');
    const t5 = findTask('Cascading Delay');
    const t6 = findTask('White-Labeled');
    const t7 = findTask('Client Presentation');

    // 5. Seed Dependency Map edges
    if (t1 && t3) await store.getState().addDependency(t1.id, t3.id, 'blocks');
    if (t2 && t4) await store.getState().addDependency(t2.id, t4.id, 'blocks');
    if (t3 && t5) await store.getState().addDependency(t3.id, t5.id, 'blocks');
    if (t4 && t6) await store.getState().addDependency(t4.id, t6.id, 'blocks');
    if (t5 && t7) await store.getState().addDependency(t5.id, t7.id, 'blocks');

    // 6. Seed Daily Logs (status reports)
    const logsList = [
      {
        content: 'Fleshed out express schema structures, CORS layers, and initialized database models with a successful seeding task verification. Active server is solid.',
        completedTasks: t1 ? [t1.id] : [],
        blockers: 'None',
      },
      {
        content: 'Completed the elegant design tokens mapping under index.css. Glassmorphism cards, micro-actions, and responsive light/dark templates are completed.',
        completedTasks: t2 ? [t2.id] : [],
        blockers: 'Need Socket engine definitions to start tour interactions.',
      },
      {
        content: 'Established room subscriptions inside Socket.io. Handling real-time Kanban moves. Stalling on auth token syncing during multiplayer load tests.',
        completedTasks: [],
        blockers: 'Auth socket latency spikes.',
      },
    ];

    for (const log of logsList) {
      try {
        await store.getState().addLog({
          date: new Date().toISOString().split('T')[0],
          content: log.content,
          completedTasks: log.completedTasks,
          blockers: log.blockers,
        });
      } catch (e) {
        console.error('Failed to create daily log:', e);
      }
    }

    // Set white label project color color to 'emerald' or 'indigo' initially
    await store.getState().updateProject({
      color: 'indigo',
    });

    // 7. Full refetch to load all data into dashboard and dependencies
    await store.getState().fetchData();
  } catch (err) {
    console.error('Failed to seed Premium demo project:', err);
  } finally {
    store.setState({ isLoading: false });
  }
}
