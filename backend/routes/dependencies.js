const express = require('express');
const TaskDependency = require('../models/TaskDependency');
const DependencyEvent = require('../models/DependencyEvent');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { authenticateToken, hasProjectAccess } = require('../middleware/auth');
const router = express.Router();

// Helper: Get directed dependency edge for schedule flow (cycle detection and CPM)
function getDirectedEdge(d) {
  if (!d || !d.sourceTaskId || !d.targetTaskId) return null;
  const src = (d.sourceTaskId._id || d.sourceTaskId.id || d.sourceTaskId).toString();
  const tgt = (d.targetTaskId._id || d.targetTaskId.id || d.targetTaskId).toString();
  
  if (d.dependencyType === 'blocks') {
    return { from: src, to: tgt };
  } else if (d.dependencyType === 'depends-on' || d.dependencyType === 'blocked-by') {
    return { from: tgt, to: src };
  }
  // related-to and parent-child do not form scheduling edges
  return null;
}

// Helper: DFS cycle detection
function detectCycle(sourceId, targetId, dependencyType, existingDependencies) {
  const proposedEdge = getDirectedEdge({ sourceTaskId: sourceId, targetTaskId: targetId, dependencyType });
  if (!proposedEdge) return false; // Non-blocking links cannot form cycles

  if (proposedEdge.from === proposedEdge.to) return true;

  // Build adjacency list
  const adj = new Map();
  const nodes = new Set();
  
  existingDependencies.forEach(d => {
    const edge = getDirectedEdge(d);
    if (edge) {
      nodes.add(edge.from);
      nodes.add(edge.to);
      if (!adj.has(edge.from)) adj.set(edge.from, []);
      adj.get(edge.from).push(edge.to);
    }
  });

  // Add the proposed new edge (from -> to)
  nodes.add(proposedEdge.from);
  nodes.add(proposedEdge.to);
  if (!adj.has(proposedEdge.from)) adj.set(proposedEdge.from, []);
  adj.get(proposedEdge.from).push(proposedEdge.to);

  const visited = new Set();
  const recStack = new Set();

  function dfs(node) {
    if (recStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recStack.add(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true;
    }

    recStack.delete(node);
    return false;
  }

  // Run DFS from each node in the graph
  for (const node of nodes) {
    if (dfs(node)) return true;
  }

  return false;
}

// 1. GET all dependencies and tasks in a project
router.get('/:projectId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const dependencies = await TaskDependency.find({ projectId: req.project._id })
      .populate('sourceTaskId', 'title status priority assignees estimatedHours dueDate')
      .populate('targetTaskId', 'title status priority assignees estimatedHours dueDate')
      .populate('createdBy', 'name email avatar');

    const tasks = await Task.find({ projectId: req.project._id })
      .populate('createdBy', 'name email avatar')
      .populate('assignees', 'name email avatar');

    res.json({ dependencies, tasks });
  } catch (err) {
    console.error('Fetch dependencies error:', err);
    res.status(500).json({ message: 'Server error fetching dependencies' });
  }
});

// 2. POST create a new dependency relation
router.post('/:projectId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const { sourceTaskId, targetTaskId, dependencyType } = req.body;

    if (!sourceTaskId || !targetTaskId || !dependencyType) {
      return res.status(400).json({ message: 'Source task, target task, and dependency type are required' });
    }

    if (sourceTaskId.toString() === targetTaskId.toString()) {
      return res.status(400).json({ message: 'Self-dependency is not permitted.' });
    }

    // Check if tasks exist in this project
    const [sourceTask, targetTask] = await Promise.all([
      Task.findOne({ _id: sourceTaskId, projectId: req.project._id }),
      Task.findOne({ _id: targetTaskId, projectId: req.project._id })
    ]);

    if (!sourceTask || !targetTask) {
      return res.status(404).json({ message: 'One or both tasks not found in this project' });
    }

    // Check for existing duplicate dependency
    const existingDup = await TaskDependency.findOne({
      projectId: req.project._id,
      sourceTaskId,
      targetTaskId,
      dependencyType
    });

    if (existingDup) {
      return res.status(409).json({ message: 'This dependency relationship already exists' });
    }

    // Fetch existing dependencies in project for cycle detection
    const currentDependencies = await TaskDependency.find({ projectId: req.project._id });

    // Cycle detection check
    const isCyclic = detectCycle(sourceTaskId, targetTaskId, dependencyType, currentDependencies);
    if (isCyclic) {
      return res.status(400).json({ message: 'Circular dependency detected! This connection would create a closed loop.' });
    }

    const dependency = new TaskDependency({
      projectId: req.project._id,
      sourceTaskId,
      targetTaskId,
      dependencyType,
      createdBy: req.user.userId
    });

    await dependency.save();
    await dependency.populate('sourceTaskId', 'title status priority assignees estimatedHours dueDate');
    await dependency.populate('targetTaskId', 'title status priority assignees estimatedHours dueDate');
    await dependency.populate('createdBy', 'name email avatar');

    // Create Audit Log Event
    const event = new DependencyEvent({
      projectId: req.project._id,
      dependencyId: dependency._id,
      action: 'created',
      userId: req.user.userId,
      details: `Created dependency: Task "${sourceTask.title}" now ${dependencyType.replace('-', ' ')} Task "${targetTask.title}"`
    });
    await event.save();

    // Check if incomplete task is blocking a dependent task that user tries to complete
    // Handled in state, but we log the resolved state triggers
    
    // Broadcast websocket real-time sync
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.project._id}`).emit('dependency-created', dependency);
    }

    res.status(201).json(dependency);
  } catch (err) {
    console.error('Create dependency error:', err);
    res.status(500).json({ message: 'Server error creating dependency', error: err.message });
  }
});

// 3. DELETE a dependency relationship
router.delete('/:projectId/:dependencyId', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const dependency = await TaskDependency.findOne({ _id: req.params.dependencyId, projectId: req.project._id })
      .populate('sourceTaskId', 'title')
      .populate('targetTaskId', 'title');

    if (!dependency) {
      return res.status(404).json({ message: 'Dependency relationship not found' });
    }

    await TaskDependency.findByIdAndDelete(dependency._id);

    // Create Audit Log Event
    const event = new DependencyEvent({
      projectId: req.project._id,
      dependencyId: dependency._id,
      action: 'removed',
      userId: req.user.userId,
      details: `Removed dependency relationship: Task "${dependency.sourceTaskId?.title || 'Unknown'}" no longer linked with Task "${dependency.targetTaskId?.title || 'Unknown'}"`
    });
    await event.save();

    // Broadcast websocket real-time sync
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.project._id}`).emit('dependency-deleted', req.params.dependencyId);
    }

    res.json({ message: 'Dependency relationship removed successfully', id: req.params.dependencyId });
  } catch (err) {
    console.error('Delete dependency error:', err);
    res.status(500).json({ message: 'Server error deleting dependency' });
  }
});

// 4. POST bulk remap dependencies for a task
router.post('/:projectId/bulk-remap', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const { taskId, dependencies } = req.body; // dependencies: Array of { targetTaskId, dependencyType }

    if (!taskId || !Array.isArray(dependencies)) {
      return res.status(400).json({ message: 'Task ID and dependencies array are required' });
    }

    const task = await Task.findOne({ _id: taskId, projectId: req.project._id });
    if (!task) {
      return res.status(404).json({ message: 'Target task not found' });
    }

    // Load other project dependencies (excluding current ones of this task to prevent false loops)
    const otherDeps = await TaskDependency.find({
      projectId: req.project._id,
      sourceTaskId: { $ne: taskId }
    });

    // Validate proposed relationships for cycles
    for (const d of dependencies) {
      if (d.targetTaskId.toString() === taskId.toString()) {
        return res.status(400).json({ message: 'Self-dependency is not permitted.' });
      }
      const isCyclic = detectCycle(taskId, d.targetTaskId, d.dependencyType, otherDeps);
      if (isCyclic) {
        return res.status(400).json({ message: `Circular dependency detected for link ${taskId} -> ${d.targetTaskId}` });
      }
    }

    // Delete existing dependencies where this task is source
    await TaskDependency.deleteMany({ projectId: req.project._id, sourceTaskId: taskId });

    // Create new dependencies
    const createdDeps = [];
    for (const d of dependencies) {
      const dep = new TaskDependency({
        projectId: req.project._id,
        sourceTaskId: taskId,
        targetTaskId: d.targetTaskId,
        dependencyType: d.dependencyType,
        createdBy: req.user.userId
      });
      await dep.save();
      createdDeps.push(dep);
    }

    // Log the bulk action
    const event = new DependencyEvent({
      projectId: req.project._id,
      action: 'remapped',
      userId: req.user.userId,
      details: `Bulk remapped dependencies for Task "${task.title}". Configured ${dependencies.length} new connections.`
    });
    await event.save();

    // Broadcast reload event
    const io = req.app.get('io');
    if (io) {
      io.to(`project:${req.project._id}`).emit('dependencies-reload');
    }

    res.json({ message: 'Task dependencies successfully remapped', dependencies: createdDeps });
  } catch (err) {
    console.error('Bulk remap error:', err);
    res.status(500).json({ message: 'Server error remapping dependencies' });
  }
});

// 5. GET Critical Path calculation
router.get('/:projectId/critical-path', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.project._id });
    const dependencies = await TaskDependency.find({ projectId: req.project._id });

    if (tasks.length === 0) {
      return res.json({ criticalPath: [], warning: 'No tasks in this project' });
    }

    // 1. Build Adjacency list and find indegrees for Topological Sort
    const adj = new Map();
    const indegree = new Map();
    const taskMap = new Map();

    tasks.forEach(t => {
      taskMap.set(t._id.toString(), t);
      adj.set(t._id.toString(), []);
      indegree.set(t._id.toString(), 0);
    });

    dependencies.forEach(d => {
      const edge = getDirectedEdge(d);
      if (edge && adj.has(edge.from) && adj.has(edge.to)) {
        adj.get(edge.from).push(edge.to);
        indegree.set(edge.to, indegree.get(edge.to) + 1);
      }
    });

    // 2. Kahn's algorithm for topological sorting and cycle detection
    const queue = [];
    const topoOrder = [];

    indegree.forEach((deg, nodeId) => {
      if (deg === 0) queue.push(nodeId);
    });

    while (queue.length > 0) {
      const u = queue.shift();
      topoOrder.push(u);

      const neighbors = adj.get(u) || [];
      neighbors.forEach(v => {
        indegree.set(v, indegree.get(v) - 1);
        if (indegree.get(v) === 0) queue.push(v);
      });
    }

    // If topological sort doesn't contain all tasks, there is a cycle
    if (topoOrder.length !== tasks.length) {
      return res.status(400).json({
        criticalPath: [],
        error: 'Circular dependency detected. Critical Path method is invalid in cyclic dependency flows.'
      });
    }

    // 3. Forward Pass: Calculate Early Start (ES) and Early Finish (EF)
    const ES = new Map();
    const EF = new Map();

    topoOrder.forEach(uId => {
      const task = taskMap.get(uId);
      const duration = task.estimatedHours || 8; // default to 8 hours (1 workspace day)
      
      // ES is max EF of all predecessors
      let maxPredecessorEF = 0;
      dependencies.forEach(d => {
        const edge = getDirectedEdge(d);
        if (edge && edge.to === uId) {
          const predEF = EF.get(edge.from) || 0;
          if (predEF > maxPredecessorEF) maxPredecessorEF = predEF;
        }
      });

      ES.set(uId, maxPredecessorEF);
      EF.set(uId, maxPredecessorEF + duration);
    });

    // Find project maximum duration
    let maxProjectEF = 0;
    EF.forEach(ef => {
      if (ef > maxProjectEF) maxProjectEF = ef;
    });

    // 4. Backward Pass: Calculate Late Finish (LF) and Late Start (LS)
    const LS = new Map();
    const LF = new Map();

    // Work backwards through topological order
    for (let i = topoOrder.length - 1; i >= 0; i--) {
      const uId = topoOrder[i];
      const task = taskMap.get(uId);
      const duration = task.estimatedHours || 8;

      // Find successors
      const successors = adj.get(uId) || [];

      let minSuccessorLS = maxProjectEF;
      if (successors.length > 0) {
        successors.forEach(vId => {
          const succLS = LS.get(vId) ?? maxProjectEF;
          if (succLS < minSuccessorLS) minSuccessorLS = succLS;
        });
      }

      LF.set(uId, minSuccessorLS);
      LS.set(uId, minSuccessorLS - duration);
    }

    // 5. Calculate Slack and identify Critical Path nodes (slack is 0)
    const criticalPath = [];
    const tasksMetrics = [];

    tasks.forEach(t => {
      const idStr = t._id.toString();
      const esVal = ES.get(idStr) || 0;
      const efVal = EF.get(idStr) || 0;
      const lsVal = LS.get(idStr) || 0;
      const lfVal = LF.get(idStr) || 0;
      const slack = lsVal - esVal;

      tasksMetrics.push({
        taskId: idStr,
        title: t.title,
        status: t.status,
        duration: t.estimatedHours || 8,
        earlyStart: esVal,
        earlyFinish: efVal,
        lateStart: lsVal,
        lateFinish: lfVal,
        slack
      });

      if (Math.abs(slack) < 0.01) {
        criticalPath.push(idStr);
      }
    });

    res.json({
      criticalPath,
      projectDurationHours: maxProjectEF,
      metrics: tasksMetrics
    });
  } catch (err) {
    console.error('Critical path error:', err);
    res.status(500).json({ message: 'Server error calculating critical path' });
  }
});

// 6. GET all dependency audit events
router.get('/:projectId/events', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const events = await DependencyEvent.find({ projectId: req.project._id })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(events);
  } catch (err) {
    console.error('Fetch events error:', err);
    res.status(500).json({ message: 'Server error fetching events' });
  }
});

// 7. GET AI Heuristic Insights
router.get('/:projectId/ai-insights', authenticateToken, hasProjectAccess('projectId'), async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.project._id }).populate('assignees', 'name');
    const dependencies = await TaskDependency.find({ projectId: req.project._id });

    // Heuristics analyses:
    const bottlenecks = [];
    const delays = [];
    const suggestions = [];

    // Map outgoing edges count
    const outgoingCount = new Map();
    const incomingCount = new Map();
    tasks.forEach(t => {
      outgoingCount.set(t._id.toString(), 0);
      incomingCount.set(t._id.toString(), 0);
    });

    dependencies.forEach(d => {
      const edge = getDirectedEdge(d);
      if (edge) {
        const source = edge.from;
        const target = edge.to;
        if (outgoingCount.has(source)) outgoingCount.set(source, outgoingCount.get(source) + 1);
        if (incomingCount.has(target)) incomingCount.set(target, incomingCount.get(target) + 1);
      }
    });

    // 1. Detect Bottlenecks (nodes blocking multiple tasks)
    tasks.forEach(t => {
      const idStr = t._id.toString();
      const count = outgoingCount.get(idStr) || 0;
      if (count >= 2 && t.status !== 'completed') {
        bottlenecks.push({
          taskId: idStr,
          title: t.title,
          status: t.status,
          blockingCount: count,
          severity: count >= 4 ? 'high' : 'medium'
        });
      }
    });

    // 2. Predict Schedule Delays
    tasks.forEach(t => {
      const idStr = t._id.toString();
      const isBlocked = (incomingCount.get(idStr) || 0) > 0 && t.status !== 'completed';
      
      // Overdue blockers causing cascading delays
      if (isBlocked) {
        // Find blocker tasks
        const blockers = dependencies.filter(d => {
          const edge = getDirectedEdge(d);
          return edge && edge.to === idStr;
        });
        let blockedByNames = [];
        let hasOverdueBlocker = false;

        blockers.forEach(b => {
          const edge = getDirectedEdge(b);
          const blockerTask = tasks.find(tk => tk._id.toString() === edge.from);
          if (blockerTask && blockerTask.status !== 'completed') {
            blockedByNames.push(blockerTask.title);
            if (blockerTask.dueDate && new Date(blockerTask.dueDate) < new Date()) {
              hasOverdueBlocker = true;
            }
          }
        });

        if (hasOverdueBlocker) {
          delays.push({
            taskId: idStr,
            title: t.title,
            blockedBy: blockedByNames,
            reason: 'Critical Blocker Overdue: A task preceding this one has missed its due date, causing a cascading delay risk.',
            riskLevel: 'high'
          });
        }
      }
    });

    // 3. Formulate Optimization Suggestions
    bottlenecks.forEach(b => {
      const assigneesCount = tasks.find(tk => tk._id.toString() === b.taskId)?.assignees?.length || 0;
      if (assigneesCount <= 1) {
        suggestions.push({
          type: 'allocation',
          taskId: b.taskId,
          title: b.title,
          message: `Allocate more resources to bottleneck task "${b.title}" which is currently blocking ${b.blockingCount} dependent downstream tasks.`
        });
      }
    });

    // Loop detection warnings
    res.json({
      bottlenecks,
      delays,
      suggestions,
      computedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('AI insights error:', err);
    res.status(500).json({ message: 'Server error generating AI insights' });
  }
});

module.exports = router;
