import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import {
  Network,
  Search,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
  GitBranch,
  Calendar,
  Lock,
  Unlock,
  Undo2,
  ChevronRight,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

type DependencyType = 'blocks' | 'blocked-by' | 'depends-on' | 'related-to' | 'parent-child';

export const DependencyWorkspace: React.FC = () => {
  const {
    tasks,
    dependencies,
    criticalPath,
    dependencyEvents,
    aiInsights,
    fetchDependencies,
    addDependency,
    deleteDependency,
    fetchCriticalPath,
    fetchDependencyEvents,
    fetchAIInsights,
    project,
    setActiveView,
    users,
  } = useStore();

  // Graph state
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Connection state
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedDepType, setSelectedDepType] = useState<DependencyType>('blocks');

  // Sidebar / selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'backlog' | 'in-progress' | 'completed'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'critical'>('graph');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Undo stack
  const [history, setHistory] = useState<Array<Record<string, { x: number; y: number }>>>([]);

  // Initial fetches
  useEffect(() => {
    if (project.id && project.id !== 'project-1') {
      fetchDependencies();
      fetchCriticalPath();
      fetchDependencyEvents();
      fetchAIInsights();
    }
  }, [project.id]);

  // Initial Auto-Layout when tasks load or change
  useEffect(() => {
    if (tasks.length > 0 && Object.keys(positions).length === 0) {
      triggerAutoLayout();
    }
  }, [tasks, dependencies]);

  // Auto Layout algorithm: Topological levels
  const triggerAutoLayout = () => {
    if (tasks.length === 0) return;

    // Save history
    if (Object.keys(positions).length > 0) {
      setHistory(prev => [...prev, positions]);
    }

    const levels: Record<string, number> = {};
    tasks.forEach(t => {
      levels[t.id] = 0;
    });

    // Iteratively build hierarchical layers
    for (let pass = 0; pass < 8; pass++) {
      dependencies.forEach(d => {
        const srcId = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
        const tgtId = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
        if (srcId && tgtId && levels[srcId] !== undefined && levels[tgtId] !== undefined) {
          if (levels[tgtId] <= levels[srcId]) {
            levels[tgtId] = levels[srcId] + 1;
          }
        }
      });
    }

    // Group by level
    const levelGroups: Record<number, string[]> = {};
    Object.entries(levels).forEach(([id, lvl]) => {
      if (!levelGroups[lvl]) levelGroups[lvl] = [];
      levelGroups[lvl].push(id);
    });

    const newPositions: Record<string, { x: number; y: number }> = {};
    const hSpacing = 320;
    const vSpacing = 160;

    Object.entries(levelGroups).forEach(([lvlStr, ids]) => {
      const lvl = parseInt(lvlStr);
      const x = 80 + lvl * hSpacing;
      const totalHeight = (ids.length - 1) * vSpacing;
      const startY = 160 - totalHeight / 2;

      ids.forEach((id, index) => {
        newPositions[id] = {
          x,
          y: startY + index * vSpacing
        };
      });
    });

    setPositions(newPositions);
    // Center pan
    setPan({ x: 50, y: 150 });
    setZoom(0.9);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setPositions(prev);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  // Node Drag Handlers
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectSource) return; // Don't drag if starting connection
    setDraggedNode(nodeId);
    
    // Save to history before drag finishes
    setHistory(prev => [...prev, positions]);

    const pos = positions[nodeId] || { x: 0, y: 0 };
    setDragOffset({
      x: e.clientX / zoom - pos.x,
      y: e.clientY / zoom - pos.y
    });
  };

  // Canvas Mouse Event Handlers
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggedNode) {
      const x = e.clientX / zoom - dragOffset.x;
      const y = e.clientY / zoom - dragOffset.y;
      
      // Grid snapping (snaps to 10px grid)
      const snapX = Math.round(x / 10) * 10;
      const snapY = Math.round(y / 10) * 10;

      setPositions(prev => ({
        ...prev,
        [draggedNode]: { x: snapX, y: snapY }
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (connectSource && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggedNode(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan on background drag
    if (e.target === e.currentTarget || (e.target as HTMLElement).id === 'grid-pattern') {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 2);
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.4);
    }
    setZoom(newZoom);
  };

  // Connection Drag Triggers
  const handleStartConnect = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnectSource(nodeId);
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({
        x: (e.clientX - rect.left - pan.x) / zoom,
        y: (e.clientY - rect.top - pan.y) / zoom
      });
    }
  };

  const handleEndConnect = async (targetId: string) => {
    if (!connectSource) return;
    if (connectSource === targetId) {
      setConnectSource(null);
      return;
    }

    try {
      setValidationError(null);
      await addDependency(connectSource, targetId, selectedDepType);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to add dependency relation.');
      setTimeout(() => setValidationError(null), 6000);
    } finally {
      setConnectSource(null);
    }
  };

  // Quick helper to draw curved SVG edges
  const calculateEdgePath = (sourceId: string, targetId: string) => {
    const sPos = positions[sourceId] || { x: 0, y: 0 };
    const tPos = positions[targetId] || { x: 0, y: 0 };

    // Standard card dimensions: width=260, height=105
    const sX = sPos.x + 260; // right middle anchor
    const sY = sPos.y + 52;
    const tX = tPos.x;       // left middle anchor
    const tY = tPos.y + 52;

    const controlOffset = Math.abs(tX - sX) * 0.4;
    return `M ${sX} ${sY} C ${sX + controlOffset} ${sY}, ${tX - controlOffset} ${tY}, ${tX} ${tY}`;
  };

  const getEdgeColors = (type: DependencyType) => {
    switch (type) {
      case 'blocks':
        return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.2)' }; // Red
      case 'blocked-by':
        return { stroke: '#f97316', glow: 'rgba(249, 115, 22, 0.2)' }; // Orange
      case 'depends-on':
        return { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.2)' }; // Blue
      case 'related-to':
        return { stroke: '#a855f7', glow: 'rgba(168, 85, 247, 0.2)' }; // Purple
      case 'parent-child':
        return { stroke: '#ffffff', glow: 'rgba(255, 255, 255, 0.1)' }; // White
      default:
        return { stroke: '#94a3b8', glow: 'rgba(148, 163, 184, 0.1)' };
    }
  };

  // Node statuses & coloring
  const getStatusColor = (task: any) => {
    // Check if task is blocked by incomplete incoming dependencies
    const isBlocked = dependencies.some(d => {
      const tgtId = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
      const srcId = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
      
      if (d.dependencyType === 'blocks') {
        if (tgtId === task.id) {
          const blocker = tasks.find(t => t.id === srcId);
          return blocker && blocker.status !== 'completed';
        }
      } else if (d.dependencyType === 'depends-on' || d.dependencyType === 'blocked-by') {
        if (srcId === task.id) {
          const blocker = tasks.find(t => t.id === tgtId);
          return blocker && blocker.status !== 'completed';
        }
      }
      return false;
    });

    if (task.status === 'completed') return { border: 'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-950/20 text-emerald-300', dot: 'bg-emerald-500', name: 'completed' };
    if (isBlocked) return { border: 'border-rose-500/80 shadow-[0_0_15px_rgba(239,68,68,0.2)] bg-rose-950/20 text-rose-300 ring-2 ring-rose-500/20', dot: 'bg-rose-500', name: 'blocked' };
    if (task.status === 'in-progress') return { border: 'border-blue-500/80 shadow-[0_0_15px_rgba(59,130,246,0.15)] bg-blue-950/20 text-blue-300', dot: 'bg-blue-500', name: 'in-progress' };
    return { border: 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.1)] bg-amber-950/10 text-amber-200', dot: 'bg-amber-500', name: 'to-do' };
  };

  // Task filtering
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.id || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (statusTab === 'all') return matchesSearch;
    if (statusTab === 'backlog') return matchesSearch && t.status === 'pending';
    if (statusTab === 'in-progress') return matchesSearch && t.status === 'in-progress';
    if (statusTab === 'completed') return matchesSearch && t.status === 'completed';
    return matchesSearch;
  });

  // Selected task detail information
  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const selectedTaskStatusInfo = selectedTask ? getStatusColor(selectedTask) : null;

  // Blocker lookup
  const incomingDeps = selectedTaskId
    ? dependencies.filter(d => {
        const tgtId = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
        const srcId = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
        
        if (d.dependencyType === 'blocks') {
          return tgtId === selectedTaskId;
        } else if (d.dependencyType === 'depends-on' || d.dependencyType === 'blocked-by') {
          return srcId === selectedTaskId;
        }
        return tgtId === selectedTaskId;
      }).map(d => {
        if (d.dependencyType === 'depends-on' || d.dependencyType === 'blocked-by') {
          return {
            ...d,
            sourceTaskId: d.targetTaskId,
            targetTaskId: d.sourceTaskId
          };
        }
        return d;
      })
    : [];

  const outgoingDeps = selectedTaskId
    ? dependencies.filter(d => {
        const tgtId = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
        const srcId = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
        
        if (d.dependencyType === 'blocks') {
          return srcId === selectedTaskId;
        } else if (d.dependencyType === 'depends-on' || d.dependencyType === 'blocked-by') {
          return tgtId === selectedTaskId;
        }
        return srcId === selectedTaskId;
      }).map(d => {
        if (d.dependencyType === 'depends-on' || d.dependencyType === 'blocked-by') {
          return {
            ...d,
            sourceTaskId: d.targetTaskId,
            targetTaskId: d.sourceTaskId
          };
        }
        return d;
      })
    : [];

  // Delay prediction math
  const getCascadingDelayRisk = (taskId: string) => {
    // If on critical path and not done, risk is high
    const isCritical = criticalPath.includes(taskId);
    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj || taskObj.status === 'completed') return { level: 'Low', color: 'text-emerald-400 bg-emerald-950/30' };

    // Check if any blocker is stuck or overdue
    const blockers = dependencies.filter(d => {
      const tgtId = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
      const srcId = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
      
      if (d.dependencyType === 'blocks') {
        return tgtId === taskId;
      } else if (d.dependencyType === 'depends-on' || d.dependencyType === 'blocked-by') {
        return srcId === taskId;
      }
      return false;
    }).map(d => {
      const tgtId = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
      const srcId = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
      return d.dependencyType === 'blocks' ? srcId : tgtId;
    });

    let hasOverdueBlocker = false;
    blockers.forEach(blockerId => {
      const bTask = tasks.find(tk => tk.id === blockerId);
      if (bTask && bTask.status !== 'completed') {
        if (bTask.status === 'stuck') hasOverdueBlocker = true;
        if (bTask.dueDate && new Date(bTask.dueDate) < new Date()) hasOverdueBlocker = true;
      }
    });

    if (isCritical && hasOverdueBlocker) return { level: 'CRITICAL', color: 'text-red-400 bg-red-950/50 shadow-sm animate-pulse' };
    if (hasOverdueBlocker || isCritical) return { level: 'HIGH RISK', color: 'text-rose-400 bg-rose-950/30' };
    
    return { level: 'Medium', color: 'text-amber-400 bg-amber-950/30' };
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100 overflow-hidden relative font-sans">
      
      {/* 1. Header & Actions Toolbar */}
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">
            <Network size={18} />
          </div>
          <div>
            <h1 className="text-md font-black tracking-tight flex items-center gap-2">
              Dependency Workspace 
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/30 text-indigo-400 border border-indigo-800/40 uppercase font-black tracking-tighter">Enterprise Mode</span>
            </h1>
            <p className="text-[10px] text-gray-400 leading-none">Map, optimize, and forecast project schedule blockages</p>
          </div>
        </div>

        {/* View mode buttons */}
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 shrink-0">
            {[
              { id: 'graph', label: 'Graph Workspace', icon: Network },
              { id: 'critical', label: 'Critical Path', icon: GitBranch }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === m.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/30'
                }`}
              >
                <m.icon size={13} />
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAiModal(true)}
              className="border-indigo-500/30 text-indigo-400 hover:bg-indigo-950/20 flex items-center gap-1.5"
            >
              <Sparkles size={14} className="animate-pulse" />
              AI Diagnostics
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={triggerAutoLayout}
              className="bg-indigo-600 hover:bg-indigo-700 font-bold"
            >
              <Maximize2 size={13} className="mr-1" /> Auto Layout
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Error banner */}
      {validationError && (
        <div className="bg-rose-950/90 border-b border-rose-800 text-rose-200 px-6 py-2.5 flex items-center gap-3 z-30 animate-slide-in text-xs font-semibold backdrop-blur-md shrink-0">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <p className="flex-1">{validationError}</p>
          <button onClick={() => setValidationError(null)} className="hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* 3. Main Split View Area */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* A. Task Sidebar (Drag Node Source) */}
        <aside className="w-80 border-r border-gray-800 bg-gray-950 flex flex-col shrink-0 z-10">
          <div className="p-4 border-b border-gray-800">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
              <input
                type="text"
                placeholder="Search project tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-gray-100 placeholder-gray-500"
              />
            </div>
            
            {/* Sidebar filtering tabs */}
            <div className="flex gap-1 bg-gray-900 p-0.5 rounded-lg border border-gray-800 text-[10px] font-black uppercase tracking-tight">
              {['all', 'backlog', 'in-progress', 'completed'].map(t => (
                <button
                  key={t}
                  onClick={() => setStatusTab(t as any)}
                  className={`flex-1 py-1 rounded transition-colors ${
                    statusTab === t
                      ? 'bg-gray-800 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {t.slice(0, 4)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider px-1">Tasks Available ({filteredTasks.length})</p>
            {filteredTasks.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">No matching tasks found</p>
            ) : (
              filteredTasks.map(t => {
                const statusColor = getStatusColor(t);
                const isSelected = selectedTaskId === t.id;
                
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setSelectedTaskId(t.id);
                      // If position doesn't exist, spawn at canvas view center
                      if (!positions[t.id]) {
                        setPositions(prev => ({
                          ...prev,
                          [t.id]: { x: 100 - pan.x / zoom, y: 150 - pan.y / zoom }
                        }));
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer relative group flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-950/20 shadow-md shadow-indigo-950'
                        : 'border-gray-800 hover:border-gray-700 bg-gray-900/60'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${statusColor.dot}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold text-indigo-400 font-mono tracking-tighter uppercase">{t.id}</span>
                        <span className={`text-[9px] font-bold capitalize px-1.5 py-0.5 rounded-full ${statusColor.border}`}>
                          {statusColor.name}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-200 line-clamp-1 leading-snug group-hover:text-white transition-colors">{t.title}</p>
                      
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-800/60">
                        <span className="text-[9px] text-gray-500 flex items-center gap-1 font-mono">
                          <Calendar size={10} /> {t.dueDate ? new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No date'}
                        </span>
                        
                        {/* Quick Add Node to Graph Anchor */}
                        {!positions[t.id] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPositions(prev => ({
                                ...prev,
                                [t.id]: { x: 100 - pan.x / zoom, y: 150 - pan.y / zoom }
                              }));
                            }}
                            className="p-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/20 text-[9px] font-bold uppercase transition-colors"
                          >
                            Add to canvas
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* B. Visual Graph Canvas */}
        <div
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
          className="flex-1 bg-gray-950 overflow-hidden relative cursor-grab active:cursor-grabbing select-none"
        >
          {/* SVG Background Grid */}
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <svg width="100%" height="100%" id="grid-svg">
              <defs>
                <pattern id="grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#475569" strokeWidth="0.8" />
                  <circle cx="0" cy="0" r="1.5" fill="#64748b" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>
          </div>

          {/* Scale & Position Container */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              transition: isPanning ? 'none' : 'transform 0.05s ease-out',
            }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* SVG Connector Edges Panel */}
            <svg className="absolute inset-0 overflow-visible z-0">
              <defs>
                {/* Custom arrow markers for relationship lines */}
                {['blocks', 'blocked-by', 'depends-on', 'related-to', 'parent-child'].map(type => {
                  const edgeProps = getEdgeColors(type as DependencyType);
                  return (
                    <marker
                      key={type}
                      id={`arrow-${type}`}
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={edgeProps.stroke} />
                    </marker>
                  );
                })}
              </defs>

              {/* Render Permanent Dependency Edges */}
              {dependencies.map(d => {
                const srcId = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
                const tgtId = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
                
                // Do not draw if coordinates are not set
                if (!positions[srcId] || !positions[tgtId]) return null;

                // Mode overrides: Highlight critical path in Critical Mode
                const isCritical = criticalPath.includes(srcId) && criticalPath.includes(tgtId);
                const isCriticalMode = viewMode === 'critical';
                
                if (isCriticalMode && !isCritical) return null; // hide non-critical

                const edgeColors = getEdgeColors(d.dependencyType);
                const path = calculateEdgePath(srcId, tgtId);

                return (
                  <g key={d._id} className="pointer-events-auto group/edge cursor-pointer">
                    {/* Hover detection thick background path */}
                    <path
                      d={path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="15"
                      onClick={() => {
                        if (confirm('Delete this dependency relationship?')) {
                          deleteDependency(d._id);
                        }
                      }}
                    />
                    
                    {/* Glowing outer shadow path */}
                    <path
                      d={path}
                      fill="none"
                      stroke={isCritical ? '#f43f5e' : edgeColors.stroke}
                      strokeWidth={isCritical ? 3.5 : 2}
                      strokeDasharray={d.dependencyType === 'blocked-by' ? '6,6' : d.dependencyType === 'related-to' ? '2,4' : undefined}
                      style={{
                        filter: `drop-shadow(0 0 6px ${isCritical ? '#f43f5e' : edgeColors.stroke})`,
                      }}
                      className="transition-all duration-300"
                    />

                    {/* Animated blocker node dot along line */}
                    {d.dependencyType === 'blocks' && (
                      <path
                        d={path}
                        fill="none"
                        stroke="transparent"
                        strokeWidth="2"
                      >
                        <circle cx="0" cy="0" r="3.5" fill="#f43f5e" className="shadow-lg">
                          <animateMotion dur="2.5s" repeatCount="indefinite" path={path} />
                        </circle>
                      </path>
                    )}

                    {/* Arrow marker */}
                    <path
                      d={path}
                      fill="none"
                      stroke="transparent"
                      markerEnd={(d.dependencyType === 'depends-on' || d.dependencyType === 'blocked-by') ? undefined : `url(#arrow-${d.dependencyType})`}
                      markerStart={(d.dependencyType === 'depends-on' || d.dependencyType === 'blocked-by') ? `url(#arrow-${d.dependencyType})` : undefined}
                    />
                  </g>
                );
              })}

              {/* Temporary Dragging Connection Edge */}
              {connectSource && positions[connectSource] && (
                <g>
                  <path
                    d={`M ${positions[connectSource].x + 260} ${positions[connectSource].y + 52} L ${mousePos.x} ${mousePos.y}`}
                    fill="none"
                    stroke={getEdgeColors(selectedDepType).stroke}
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    className="animate-pulse"
                  />
                  <circle cx={mousePos.x} cy={mousePos.y} r="5" fill={getEdgeColors(selectedDepType).stroke} />
                </g>
              )}
            </svg>

            {/* Interactive Graph Node Cards */}
            <div className="absolute inset-0 z-10">
              {tasks.map(t => {
                const pos = positions[t.id];
                if (!pos) return null; // skip nodes with no placement

                const isSelected = selectedTaskId === t.id;
                const statusColor = getStatusColor(t);
                const isOnCriticalPath = criticalPath.includes(t.id);
                
                // Dim non-critical tasks in Critical Path Mode
                const isCriticalMode = viewMode === 'critical';
                const opacityStyle = isCriticalMode && !isOnCriticalPath ? 'opacity-30 scale-95' : 'opacity-100';
                const assigneeUser = t.assignees && t.assignees.length > 0 ? users.find(u => u.id === t.assignees[0]) : undefined;

                return (
                  <div
                    key={t.id}
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.y}px`,
                      width: '260px',
                      height: '105px',
                    }}
                    onMouseDown={(e) => handleNodeMouseDown(e, t.id)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTaskId(t.id);
                    }}
                    onMouseUp={() => handleEndConnect(t.id)}
                    className={`absolute p-3 rounded-2xl bg-gray-900/90 backdrop-blur-md border hover:border-indigo-400/60 shadow-xl transition-all pointer-events-auto cursor-grab active:cursor-grabbing group select-none ${
                      isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-gray-800'
                    } ${statusColor.border} ${opacityStyle}`}
                  >
                    
                    {/* Critical path glowing highlight */}
                    {isOnCriticalPath && (
                      <div className="absolute -top-1.5 -left-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[7.5px] font-black uppercase tracking-widest scale-90 shadow-sm shadow-rose-950">
                        Critical Path
                      </div>
                    )}

                    {/* Node Anchor Drag handles */}
                    {/* Input Connection handle (left anchor) */}
                    <div
                      onMouseUp={() => handleEndConnect(t.id)}
                      className="absolute -left-2 top-[46px] w-4 h-4 rounded-full border border-gray-700 bg-gray-900 flex items-center justify-center hover:bg-indigo-500 hover:border-white transition-all cursor-crosshair opacity-0 group-hover:opacity-100 z-20 shadow"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 hover:bg-white" />
                    </div>

                    {/* Output Connection handle (right anchor) */}
                    <div
                      onMouseDown={(e) => handleStartConnect(e, t.id)}
                      className="absolute -right-2 top-[46px] w-4 h-4 rounded-full border border-gray-700 bg-gray-900 flex items-center justify-center hover:bg-indigo-500 hover:border-white transition-all cursor-crosshair opacity-0 group-hover:opacity-100 z-20 shadow"
                    >
                      <Plus size={8} className="text-gray-400 hover:text-white" />
                    </div>

                    {/* Node Card Core details */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[8.5px] font-bold font-mono text-indigo-400 uppercase tracking-tighter">{t.id}</span>
                      <div className="flex items-center gap-1">
                        {statusColor.name === 'blocked' ? (
                          <Lock size={9} className="text-rose-400" />
                        ) : (
                          <Unlock size={9} className="text-emerald-400" />
                        )}
                        <span className={`text-[8px] font-black capitalize px-1.5 py-0.5 rounded-full ${statusColor.border}`}>
                          {statusColor.name}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-gray-100 line-clamp-1 group-hover:text-white mb-2 leading-none">{t.title}</h3>

                    {/* Assignee & Dates footer inside Node Card */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/80">
                      <span className="text-[8px] text-gray-500 font-mono flex items-center gap-1">
                        <Calendar size={10} className="shrink-0" />
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No date'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-mono">
                          {t.estimatedHours || 8}h
                        </span>
                        {assigneeUser ? (
                          <Avatar user={assigneeUser} size="xs" />
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[8px] text-gray-400">?</div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Canvas Floating Widgets (HUD UI overlays) */}
          
          {/* Zoom & Canvas controls */}
          <div className="absolute bottom-6 right-6 bg-gray-900/90 backdrop-blur-md border border-gray-800 p-2.5 rounded-2xl flex items-center gap-2.5 shadow-2xl z-10">
            <button onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.4))} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" title="Zoom Out">
              <ZoomOut size={14} />
            </button>
            <span className="text-[10px] font-mono font-black text-gray-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" title="Zoom In">
              <ZoomIn size={14} />
            </button>
            <div className="w-[1px] h-4 bg-gray-800 mx-0.5" />
            <button onClick={() => { setZoom(0.9); setPan({ x: 50, y: 150 }); }} className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors" title="Fit Screen / Reset">
              <Maximize2 size={14} />
            </button>
            <button onClick={handleUndo} disabled={history.length === 0} className={`p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors ${history.length === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-800'}`} title="Undo drag">
              <Undo2 size={14} />
            </button>
          </div>

          {/* Connection Toolbar Type Picker */}
          <div className="absolute top-6 left-6 bg-gray-900/95 backdrop-blur-md border border-gray-800 px-4 py-2.5 rounded-2xl flex items-center gap-4 shadow-2xl z-10">
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Connect:</span>
            <div className="flex bg-gray-950 p-0.5 rounded-xl border border-gray-800">
              {[
                { id: 'blocks', label: 'Blocks', color: 'bg-rose-500 text-white' },
                { id: 'blocked-by', label: 'Blocked By', color: 'bg-orange-500 text-white' },
                { id: 'depends-on', label: 'Depends On', color: 'bg-blue-500 text-white' },
                { id: 'related-to', label: 'Related To', color: 'bg-purple-500 text-white' },
                { id: 'parent-child', label: 'Parent/Child', color: 'bg-gray-100 text-gray-900' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedDepType(opt.id as any)}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all ${
                    selectedDepType === opt.id
                      ? opt.color
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom legend overlay */}
          <div className="absolute bottom-6 left-6 bg-gray-900/80 backdrop-blur-md border border-gray-800 px-4 py-2 rounded-2xl flex items-center gap-4 shadow-xl text-[9px] font-extrabold uppercase tracking-tight text-gray-400 z-10">
            <span className="text-gray-500">Legend:</span>
            <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 bg-rose-500" /> Blocks</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 bg-orange-500" /> Blocked By</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 bg-blue-500" /> Depends On</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-0.5 bg-purple-500" /> Related To</div>
          </div>

          {/* Minimap in canvas (bottom left of canvas above legend) */}
          <div className="absolute bottom-16 left-6 w-32 h-24 bg-gray-950/90 border border-gray-800/90 rounded-2xl overflow-hidden shadow-2xl p-1 pointer-events-none z-10 opacity-70">
            <div className="w-full h-full relative bg-gray-900/50 rounded-xl overflow-hidden">
              {tasks.map(t => {
                const pos = positions[t.id];
                if (!pos) return null;
                return (
                  <div
                    key={t.id}
                    style={{
                      left: `${Math.max(0, Math.min(100, (pos.x / 20) + 20))}%`,
                      top: `${Math.max(0, Math.min(100, (pos.y / 20) + 30))}%`,
                    }}
                    className="absolute w-1.5 h-1.5 bg-indigo-500 rounded-full"
                  />
                );
              })}
            </div>
          </div>

        </div>

        {/* C. Right Drawer Inspector (Selected Task Metadata Detail) */}
        {selectedTask && (
          <aside className="w-96 border-l border-gray-800 bg-gray-950/95 backdrop-blur-md flex flex-col shrink-0 z-20 relative animate-drawer-slide-in">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black text-indigo-400 tracking-tighter uppercase font-mono">{selectedTask.id}</span>
                <h2 className="text-sm font-black text-gray-100 mt-1 line-clamp-1">{selectedTask.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-xs">
              
              {/* Task Metrics Dashboard widget */}
              <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest font-black">
                  <span>Workflow Status</span>
                  <span>Impact Metrics</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2 bg-gray-950 border border-gray-800 rounded-xl">
                    <p className="text-[8px] uppercase tracking-wider text-gray-400 font-extrabold mb-1">State</p>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${selectedTaskStatusInfo?.dot}`} />
                      <span className="font-black capitalize">{selectedTaskStatusInfo?.name}</span>
                    </div>
                  </div>

                  <div className="p-2 bg-gray-950 border border-gray-800 rounded-xl">
                    <p className="text-[8px] uppercase tracking-wider text-gray-400 font-extrabold mb-1">Delay Forecast</p>
                    <span className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase leading-none ${getCascadingDelayRisk(selectedTask.id).color}`}>
                      {getCascadingDelayRisk(selectedTask.id).level}
                    </span>
                  </div>
                </div>
              </div>

              {/* Blocker Reason Alert */}
              {selectedTaskStatusInfo?.name === 'blocked' && (
                <div className="bg-rose-950/20 border border-rose-800/40 text-rose-300 rounded-2xl p-3.5 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black uppercase tracking-wider text-[10px] text-rose-400">Dependency Warning</h4>
                    <p className="text-[11px] leading-relaxed mt-1">This task is currently marked as **blocked** because {incomingDeps.length} task(s) preceding it have not been resolved. You cannot mark it complete until all blockers are finished.</p>
                  </div>
                </div>
              )}

              {/* Incoming Blockers List */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Incoming Dependencies / Blockers ({incomingDeps.length})</h3>
                {incomingDeps.length === 0 ? (
                  <p className="text-xs text-gray-500 italic px-2">No preceding blockers are assigned to this task.</p>
                ) : (
                  <div className="space-y-1.5">
                    {incomingDeps.map(d => {
                      const srcId = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
                      const blockerTask = tasks.find(tk => tk.id === srcId);
                      if (!blockerTask) return null;

                      return (
                        <div key={d._id} className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between hover:border-gray-700 transition-colors">
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold text-rose-400 font-mono tracking-tighter uppercase">{blockerTask.id}</span>
                            <h4 className="font-bold text-gray-200 truncate leading-snug">{blockerTask.title}</h4>
                          </div>
                          
                          <button
                            onClick={() => deleteDependency(d._id)}
                            className="p-1 rounded-lg bg-gray-950 text-gray-500 hover:text-rose-400 border border-gray-800 transition-colors"
                            title="Remove dependency Link"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Outgoing Dependencies List */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Outgoing Dependencies ({outgoingDeps.length})</h3>
                {outgoingDeps.length === 0 ? (
                  <p className="text-xs text-gray-500 italic px-2">No downstream tasks are blocked by this task.</p>
                ) : (
                  <div className="space-y-1.5">
                    {outgoingDeps.map(d => {
                      const tgtId = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
                      const dependentTask = tasks.find(tk => tk.id === tgtId);
                      if (!dependentTask) return null;

                      return (
                        <div key={d._id} className="p-2.5 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-between hover:border-gray-700 transition-colors">
                          <div className="min-w-0">
                            <span className="text-[8px] font-bold text-indigo-400 font-mono tracking-tighter uppercase">{dependentTask.id}</span>
                            <h4 className="font-bold text-gray-200 truncate leading-snug">{dependentTask.title}</h4>
                          </div>
                          
                          <button
                            onClick={() => deleteDependency(d._id)}
                            className="p-1 rounded-lg bg-gray-950 text-gray-500 hover:text-rose-400 border border-gray-800 transition-colors"
                            title="Remove dependency Link"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Auditing Dependency Event History log */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Dependency Event Log</h3>
                <div className="p-3 bg-gray-900/30 border border-gray-850 rounded-2xl space-y-3 max-h-56 overflow-y-auto custom-scrollbar">
                  {dependencyEvents.length === 0 ? (
                    <p className="text-[10px] text-gray-500 italic text-center py-2">No change events logged yet.</p>
                  ) : (
                    dependencyEvents.slice(0, 10).map(e => (
                      <div key={e._id} className="flex gap-2">
                        <Clock size={11} className="text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-gray-300 font-medium">{e.details}</p>
                          <span className="text-[8px] text-gray-500">
                            {e.userId?.name || 'User'} • {new Date(e.createdAt || e.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Actions Footer inside right drawer */}
            <div className="p-4 bg-gray-950 border-t border-gray-850 space-y-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTaskId(null);
                  setActiveView('board');
                }}
                className="w-full text-center hover:bg-gray-800 border-gray-800 font-bold"
              >
                Open in Kanban Board
              </Button>
            </div>
          </aside>
        )}

      </div>

      {/* 5. AI Diagnostics Diagnostics Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl animate-modal-scale">
            
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-950/50 to-purple-950/30 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black text-gray-100 leading-none">AI Workflow Intelligence Reports</h3>
                  <p className="text-[10px] text-gray-400 mt-1">Predict bottlenecks, risks, and project timelines based on dependencies</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Report Body */}
            <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar text-xs">
              
              {/* Critical Path optimization advice */}
              <div className="p-4 bg-indigo-950/20 border border-indigo-800/40 rounded-2xl space-y-1.5">
                <h4 className="font-black text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <GitBranch size={13} />
                  Delivery Timeline Optimizations
                </h4>
                <p className="text-gray-300 leading-relaxed text-[11px]">
                  Based on CPM (Critical Path Method) diagnostics, the active project has a critical delivery sequence of **{criticalPath.length} tasks** spanning **{criticalPath.length * 8} computed workload hours**. Missing any deadline in this chain will trigger a cascading delay.
                </p>
              </div>

              {/* Grid bottleneck forecast */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Bottlenecks lists */}
                <div className="space-y-3 p-4 bg-gray-900 border border-gray-850 rounded-2xl">
                  <h4 className="font-black uppercase tracking-wider text-[10px] text-amber-400 flex items-center gap-1.5">
                    <AlertCircle size={13} />
                    Bottleneck Risk Tasks
                  </h4>
                  {aiInsights.bottlenecks && aiInsights.bottlenecks.length > 0 ? (
                    <div className="space-y-2">
                      {aiInsights.bottlenecks.map((b: any) => (
                        <div key={b.taskId} className="p-2.5 bg-gray-950 border border-gray-800 rounded-xl">
                          <p className="font-extrabold text-gray-200 text-[11px] leading-tight mb-1">{b.title}</p>
                          <p className="text-[9px] text-amber-500/80 font-black">⚠️ Blocks {b.blockingCount} downstream tasks</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 italic">No major task bottlenecks forecasted.</p>
                  )}
                </div>

                {/* Delays list */}
                <div className="space-y-3 p-4 bg-gray-900 border border-gray-850 rounded-2xl">
                  <h4 className="font-black uppercase tracking-wider text-[10px] text-rose-400 flex items-center gap-1.5">
                    <Clock size={13} />
                    Cascading Delay Forecast
                  </h4>
                  {aiInsights.delays && aiInsights.delays.length > 0 ? (
                    <div className="space-y-2">
                      {aiInsights.delays.map((d: any) => (
                        <div key={d.taskId} className="p-2.5 bg-gray-950 border border-gray-800 rounded-xl">
                          <p className="font-extrabold text-gray-200 text-[11px] leading-tight mb-1">{d.title}</p>
                          <p className="text-[9px] text-rose-500/80 font-semibold">{d.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 italic">No cascading delays forecasted yet.</p>
                  )}
                </div>

              </div>

              {/* Suggestions */}
              <div className="space-y-3 p-4 bg-gray-900 border border-gray-850 rounded-2xl">
                <h4 className="font-black uppercase tracking-wider text-[10px] text-indigo-400 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  Heuristic Recommendations
                </h4>
                {aiInsights.suggestions && aiInsights.suggestions.length > 0 ? (
                  <div className="space-y-2">
                    {aiInsights.suggestions.map((s: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-gray-950 border border-gray-800 rounded-xl flex items-start gap-2">
                        <ChevronRight size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-gray-300 leading-relaxed">{s.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 italic">All task allocations are currently optimal!</p>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-900/30 border-t border-gray-800 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setShowAiModal(false)}
                className="bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                Close Report
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
