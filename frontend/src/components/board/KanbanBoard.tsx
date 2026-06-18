import React, { useState, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { } from '@dnd-kit/sortable';
import { Task, TaskStatus, useStore } from '../../store/useStore';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from '../tasks/TaskCard';
import { TaskForm } from '../tasks/TaskForm';
import { TaskDetail } from '../tasks/TaskDetail';
import { Button } from '../ui/Button';
import { Plus, Search, SlidersHorizontal, X, LayoutGrid, List } from 'lucide-react';
import { AvatarGroup } from '../ui/Avatar';
import { format, parseISO } from 'date-fns';

const STATUSES: TaskStatus[] = ['pending', 'in-progress', 'stuck', 'completed'];

export const KanbanBoard: React.FC = () => {
  const {
    tasks,
    moveTask,
    currentUser,
    users,
    searchQuery,
    setSearchQuery,
    searchTasks,
    filterStatus,
    setFilterStatus,
    filterAssignee,
    setFilterAssignee,
    project,
    taskPage,
    totalTasks,
    taskLimit,
    setTaskPage,
    fetchTasks
  } = useStore();
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);

  React.useEffect(() => {
    if (sessionStorage.getItem('openAddTaskModal') === 'true') {
      setShowAddTask(true);
      sessionStorage.removeItem('openAddTaskModal');
    }
  }, []);

  const canManageTasks =
    currentUser?.role === 'admin' ||
    (currentUser as any)?.projectRole === 'ProjectManager' ||
    (currentUser as any)?.projectRole === 'TeamLead';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const getFilteredTasks = () => {
    return tasks.filter((task) => {
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.tags || []).some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
      const matchesAssignee =
        filterAssignee === 'all' || (task.assignees || []).includes(filterAssignee);

      return matchesSearch && matchesStatus && matchesAssignee;
    });
  };

  const filteredTasks = getFilteredTasks();

  const getTasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((t) => t.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (_event: DragOverEvent) => { };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // If over a column (status)
    if (STATUSES.includes(overId as TaskStatus)) {
      moveTask(taskId, overId as TaskStatus);
      return;
    }

    // If over another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      moveTask(taskId, overTask.status);
    }
  };

  const hasActiveFilters =
    searchQuery || filterStatus !== 'all' || filterAssignee !== 'all';

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      searchTasks(value);
    }, 400);
  };

  const clearFilters = () => {
    setSearchQuery('');
    searchTasks('');
    setFilterStatus('all');
    setFilterAssignee('all');
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search tasks (backend search)..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          size="sm"
          icon={<SlidersHorizontal size={14} />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
          {hasActiveFilters && (
            <span className="ml-1 bg-white/30 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {[searchQuery ? 1 : 0, filterStatus !== 'all' ? 1 : 0, filterAssignee !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={clearFilters}>
            Clear
          </Button>
        )}

        {/* View Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 ml-2">
          <button
            onClick={() => setViewMode('board')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            title="Board View"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            title="List View"
          >
            <List size={16} />
          </button>
        </div>

        <div className="flex-1" />

        {canManageTasks && (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setShowAddTask(true)}
          >
            Add Task
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex-wrap transition-colors">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="stuck">Stuck</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">Assignee:</label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
            >
              <option value="all">All Members</option>
              {users.filter(u => (project.members || []).includes(u.id)).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-400 ml-auto">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
      )}

      {/* Main View Area */}
      {viewMode === 'board' ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 overflow-y-auto lg:overflow-hidden min-h-0">
            {STATUSES.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={getTasksByStatus(status)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && (
              <div className="rotate-3 scale-105 opacity-90">
                <TaskCard task={activeTask} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto overflow-y-auto flex-1 pb-12">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm z-10">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Task Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Priority</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">Assignees</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right">Work Done</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 text-right">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-40">
                        <Search size={40} />
                        <p className="text-sm font-medium">No tasks found matching your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="group hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer border-l-2 border-l-transparent hover:border-l-indigo-500"
                      onClick={() => { setSelectedTaskForDetail(task); setShowDetail(true); }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{task.title}</span>
                          <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 uppercase">{task.id.slice(-6)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight
                          ${task.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                            task.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                              task.status === 'stuck' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' :
                                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                        `}>
                          <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' :
                              task.status === 'in-progress' ? 'bg-blue-500' :
                                task.status === 'stuck' ? 'bg-rose-500' :
                                  'bg-gray-400'
                            }`} />
                          {task.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase
                          ${task.priority === 'high' ? 'text-rose-500' :
                            task.priority === 'medium' ? 'text-amber-500' :
                              'text-slate-400'}
                        `}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <AvatarGroup users={users.filter(u => (task.assignees || []).includes(u.id))} size="xs" max={3} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            {task.actualWorkedHours?.toFixed(1) || 0}h
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            of {task.estimatedHours || 0}h
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {task.dueDate ? format(parseISO(task.dueDate), 'MMM d, yyyy') : '—'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalTasks > taskLimit && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <button
            disabled={taskPage === 1}
            onClick={() => {
              setTaskPage(taskPage - 1);
              fetchTasks(project.id, taskPage - 1);
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-black uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-700 dark:text-gray-200"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-bold">
            Page {taskPage} of {Math.ceil(totalTasks / taskLimit)}
          </span>
          <button
            disabled={taskPage >= Math.ceil(totalTasks / taskLimit)}
            onClick={() => {
              setTaskPage(taskPage + 1);
              fetchTasks(project.id, taskPage + 1);
            }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs font-black uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all text-gray-700 dark:text-gray-200"
          >
            Next
          </button>
        </div>
      )}

      {showAddTask && (
        <TaskForm isOpen={showAddTask} onClose={() => setShowAddTask(false)} />
      )}

      {showDetail && selectedTaskForDetail && (
        <TaskDetail
          isOpen={showDetail}
          onClose={() => { setShowDetail(false); setSelectedTaskForDetail(null); }}
          task={selectedTaskForDetail}
          onEdit={() => { setShowDetail(false); setShowAddTask(true); }}
        />
      )}
    </div>
  );
};
