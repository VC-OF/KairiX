import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  GripVertical,
  LayoutPanelLeft,
  Target,
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';

type DependencyType = 'blocks' | 'blocked-by' | 'depends-on' | 'related-to' | 'parent-child';

const DEP_CONFIGS: Record<DependencyType, { label: string; color: string; dotColor: string; activeClass: string }> = {
  'blocks':       { label: 'Blocks',      color: '#ef4444', dotColor: 'bg-rose-500',   activeClass: 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30 shadow-sm' },
  'blocked-by':   { label: 'Blocked By',  color: '#f97316', dotColor: 'bg-orange-500', activeClass: 'bg-orange-50 dark:bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-500/30 shadow-sm' },
  'depends-on':   { label: 'Depends On',  color: '#3b82f6', dotColor: 'bg-blue-500',   activeClass: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 shadow-sm' },
  'related-to':   { label: 'Related',     color: '#a855f7', dotColor: 'bg-purple-500', activeClass: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30 shadow-sm' },
  'parent-child': { label: 'Parent',      color: '#94a3b8', dotColor: 'bg-slate-400',  activeClass: 'bg-slate-100 dark:bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-500/30 shadow-sm' },
};

const LEGEND = Object.entries(DEP_CONFIGS).slice(0, 4) as [DependencyType, typeof DEP_CONFIGS[DependencyType]][];

export const DependencyWorkspace: React.FC = () => {
  const {
    tasks, dependencies, criticalPath, dependencyEvents, aiInsights,
    fetchDependencies, addDependency, deleteDependency,
    fetchCriticalPath, fetchDependencyEvents, fetchAIInsights,
    project, setActiveView, users, theme,
  } = useStore();

  // ── Graph state ────────────────────────────────────────────────────────────
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedDepType, setSelectedDepType] = useState<DependencyType>('blocks');
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<Array<Record<string, { x: number; y: number }>>>([]);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'backlog' | 'in-progress' | 'completed'>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'critical'>('graph');
  const [validationError, setValidationError] = useState<string | null>(null);

  // ── Resizable panel state ──────────────────────────────────────────────────
  const [leftWidth, setLeftWidth] = useState(260);        // px – left sidebar
  const [rightWidth, setRightWidth] = useState(300);      // px – right inspector
  const isDraggingLeft = useRef(false);
  const isDraggingRight = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // ── Fetch on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (project.id && project.id !== 'project-1') {
      fetchDependencies();
      fetchCriticalPath();
      fetchDependencyEvents();
      fetchAIInsights();
    }
  }, [project.id]);

  useEffect(() => {
    if (tasks.length > 0 && Object.keys(positions).length === 0) triggerAutoLayout();
  }, [tasks, dependencies]);

  // ── Resizable panel drag handlers ──────────────────────────────────────────
  const handleLeftDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeft.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  const handleRightDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRight.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (isDraggingLeft.current) {
        const newWidth = Math.max(160, Math.min(480, e.clientX - rect.left));
        setLeftWidth(newWidth);
      }
      if (isDraggingRight.current) {
        const newWidth = Math.max(220, Math.min(520, rect.right - e.clientX));
        setRightWidth(newWidth);
      }
    };
    const onMouseUp = () => {
      isDraggingLeft.current = false;
      isDraggingRight.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // ── Layout algorithm ───────────────────────────────────────────────────────
  const triggerAutoLayout = () => {
    if (tasks.length === 0) return;
    if (Object.keys(positions).length > 0) setHistory(prev => [...prev, positions]);

    const levels: Record<string, number> = {};
    tasks.forEach(t => { levels[t.id] = 0; });
    for (let pass = 0; pass < 8; pass++) {
      dependencies.forEach(d => {
        const src = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
        const tgt = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
        if (src && tgt && levels[src] !== undefined && levels[tgt] !== undefined) {
          if (levels[tgt] <= levels[src]) levels[tgt] = levels[src] + 1;
        }
      });
    }
    const groups: Record<number, string[]> = {};
    Object.entries(levels).forEach(([id, lvl]) => {
      if (!groups[lvl]) groups[lvl] = [];
      groups[lvl].push(id);
    });
    const newPos: Record<string, { x: number; y: number }> = {};
    Object.entries(groups).forEach(([lvlStr, ids]) => {
      const lvl = parseInt(lvlStr);
      const x = 80 + lvl * 300;
      const totalH = (ids.length - 1) * 150;
      const startY = 160 - totalH / 2;
      ids.forEach((id, i) => { newPos[id] = { x, y: startY + i * 150 }; });
    });
    setPositions(newPos);
    setPan({ x: 60, y: 160 });
    setZoom(0.9);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      setPositions(history[history.length - 1]);
      setHistory(prev => prev.slice(0, -1));
    }
  };

  // ── Node drag ──────────────────────────────────────────────────────────────
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectSource) return;
    setDraggedNode(nodeId);
    setHistory(prev => [...prev, positions]);
    const pos = positions[nodeId] || { x: 0, y: 0 };
    setDragOffset({ x: e.clientX / zoom - pos.x, y: e.clientY / zoom - pos.y });
  };

  // ── Canvas events ──────────────────────────────────────────────────────────
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (draggedNode) {
      const x = e.clientX / zoom - dragOffset.x;
      const y = e.clientY / zoom - dragOffset.y;
      setPositions(prev => ({ ...prev, [draggedNode]: { x: Math.round(x / 10) * 10, y: Math.round(y / 10) * 10 } }));
    } else if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (connectSource && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({ x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom });
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'SVG') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = 1.12;
    setZoom(prev => e.deltaY < 0 ? Math.min(prev * factor, 3) : Math.max(prev / factor, 0.25));
  };

  // ── Connections ────────────────────────────────────────────────────────────
  const handleStartConnect = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setConnectSource(nodeId);
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setMousePos({ x: (e.clientX - rect.left - pan.x) / zoom, y: (e.clientY - rect.top - pan.y) / zoom });
    }
  };

  const handleEndConnect = async (targetId: string) => {
    if (!connectSource) return;
    if (connectSource === targetId) { setConnectSource(null); return; }
    try {
      setValidationError(null);
      await addDependency(connectSource, targetId, selectedDepType);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to add dependency.');
      setTimeout(() => setValidationError(null), 5000);
    } finally {
      setConnectSource(null);
    }
  };

  // ── Edge path ──────────────────────────────────────────────────────────────
  const NODE_W = 240, NODE_H = 96;
  const calculateEdgePath = (srcId: string, tgtId: string) => {
    const s = positions[srcId] || { x: 0, y: 0 };
    const t = positions[tgtId] || { x: 0, y: 0 };
    const sX = s.x + NODE_W, sY = s.y + NODE_H / 2;
    const tX = t.x, tY = t.y + NODE_H / 2;
    const ctrl = Math.abs(tX - sX) * 0.45;
    return `M ${sX} ${sY} C ${sX + ctrl} ${sY}, ${tX - ctrl} ${tY}, ${tX} ${tY}`;
  };

  // ── Status coloring ────────────────────────────────────────────────────────
  const getStatusConfig = (task: any) => {
    const isBlocked = dependencies.some(d => {
      const tgt = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
      const src = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
      if (d.dependencyType === 'blocks' && tgt === task.id) {
        const blocker = tasks.find(t => t.id === src);
        return blocker && blocker.status !== 'completed';
      }
      if ((d.dependencyType === 'depends-on' || d.dependencyType === 'blocked-by') && src === task.id) {
        const blocker = tasks.find(t => t.id === tgt);
        return blocker && blocker.status !== 'completed';
      }
      return false;
    });

    if (task.status === 'completed') return {
      ring: 'ring-emerald-500/30 dark:ring-emerald-500/60',
      glow: 'shadow-[0_0_18px_rgba(16,185,129,0.05)] dark:shadow-[0_0_18px_rgba(16,185,129,0.2)]',
      bg: 'bg-emerald-50/60 dark:bg-emerald-950/30',
      dot: 'bg-emerald-500 dark:bg-emerald-400',
      label: 'completed',
      text: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-755 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/25',
    };
    if (isBlocked) return {
      ring: 'ring-rose-500/30 dark:ring-rose-500/60',
      glow: 'shadow-[0_0_18px_rgba(239,68,68,0.05)] dark:shadow-[0_0_18px_rgba(239,68,68,0.2)]',
      bg: 'bg-rose-50/60 dark:bg-rose-950/25',
      dot: 'bg-rose-500 dark:bg-rose-400',
      label: 'blocked',
      text: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-500/25',
    };
    if (task.status === 'in-progress') return {
      ring: 'ring-blue-500/30 dark:ring-blue-500/60',
      glow: 'shadow-[0_0_18px_rgba(59,130,246,0.05)] dark:shadow-[0_0_18px_rgba(59,130,246,0.15)]',
      bg: 'bg-blue-50/60 dark:bg-blue-950/20',
      dot: 'bg-blue-500 dark:bg-blue-400',
      label: 'active',
      text: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-500/25',
    };
    return {
      ring: 'ring-amber-500/20 dark:ring-amber-500/40',
      glow: 'shadow-[0_0_12px_rgba(245,158,11,0.02)] dark:shadow-[0_0_12px_rgba(245,158,11,0.1)]',
      bg: 'bg-amber-50/60 dark:bg-amber-950/10',
      dot: 'bg-amber-500 dark:bg-amber-400',
      label: 'to-do',
      text: 'text-amber-650 dark:text-amber-400',
      badge: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-500/25',
    };
  };

  // ── Risk ───────────────────────────────────────────────────────────────────
  const getDelayRisk = (taskId: string) => {
    const isCritical = criticalPath.includes(taskId);
    const taskObj = tasks.find(t => t.id === taskId);
    if (!taskObj || taskObj.status === 'completed') return { level: 'Low', cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20' };
    const blockers = dependencies.filter(d => {
      const tgt = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
      const src = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
      return d.dependencyType === 'blocks' ? tgt === taskId : src === taskId;
    }).map(d => {
      const tgt = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
      const src = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
      return d.dependencyType === 'blocks' ? src : tgt;
    });
    const overdue = blockers.some(bid => {
      const b = tasks.find(t => t.id === bid);
      return b && b.status !== 'completed' && (b.status === 'stuck' || (b.dueDate && new Date(b.dueDate) < new Date()));
    });
    if (isCritical && overdue) return { level: 'CRITICAL', cls: 'text-red-650 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/30 animate-pulse' };
    if (overdue || isCritical) return { level: 'HIGH RISK', cls: 'text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/20' };
    return { level: 'Medium', cls: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20' };
  };

  // ── Filtered tasks ─────────────────────────────────────────────────────────
  const filteredTasks = tasks.filter(t => {
    const q = searchQuery.toLowerCase();
    const matchQ = t.title.toLowerCase().includes(q) || (t.id || '').toLowerCase().includes(q);
    if (!matchQ) return false;
    if (statusTab === 'backlog') return t.status === 'pending';
    if (statusTab === 'in-progress') return t.status === 'in-progress';
    if (statusTab === 'completed') return t.status === 'completed';
    return true;
  });


  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const selectedTaskCfg = selectedTask ? getStatusConfig(selectedTask) : null;

  const getRelatedDeps = (side: 'incoming' | 'outgoing') =>
    selectedTaskId ? dependencies.filter(d => {
      const tgt = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
      const src = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
      if (d.dependencyType === 'blocks') return side === 'incoming' ? tgt === selectedTaskId : src === selectedTaskId;
      if (d.dependencyType === 'depends-on' || d.dependencyType === 'blocked-by')
        return side === 'incoming' ? src === selectedTaskId : tgt === selectedTaskId;
      return side === 'incoming' ? tgt === selectedTaskId : src === selectedTaskId;
    }).map(d => {
      if (d.dependencyType === 'depends-on' || d.dependencyType === 'blocked-by') {
        return { ...d, sourceTaskId: d.targetTaskId, targetTaskId: d.sourceTaskId };
      }
      return d;
    }) : [];

  const incomingDeps = getRelatedDeps('incoming');
  const outgoingDeps = getRelatedDeps('outgoing');

  const Divider = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent) => void }) => (
    <div
      onMouseDown={onMouseDown}
      className="w-1.5 shrink-0 cursor-col-resize group relative flex items-center justify-center bg-gray-200/50 dark:bg-white/[0.04] hover:bg-indigo-500/50 dark:hover:bg-indigo-500/50 transition-all z-30"
    >
      <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize" />
      <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <GripVertical size={12} className="text-indigo-600 dark:text-indigo-400" />
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#080b12] text-gray-900 dark:text-gray-100 overflow-hidden relative transition-colors duration-300" ref={containerRef}>

      {/* ══════════════════════════════ HEADER ══════════════════════════════ */}
      <div className="h-[52px] shrink-0 border-b border-gray-200 dark:border-white/[0.05] bg-white/95 dark:bg-[#080b12]/95 backdrop-blur-md flex items-center justify-between px-4 gap-3 z-20 transition-colors duration-300">
        {/* Left: title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shrink-0">
            <Network size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Dependency Map</span>
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">Enterprise</span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-600 leading-none font-medium hidden md:block">
              Visualize · Map · Forecast
            </p>
          </div>
        </div>

        {/* Center: view mode toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/[0.06] rounded-xl p-0.5 gap-0.5">
          {[
            { id: 'graph', label: 'Graph', icon: LayoutPanelLeft },
            { id: 'critical', label: 'Critical Path', icon: Target },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === id
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/[0.04]'
              }`}
            >
              <Icon size={12} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/25 bg-indigo-50 dark:bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-600/20 hover:border-indigo-300 dark:hover:border-indigo-500/40 text-xs font-bold transition-all"
          >
            <Sparkles size={12} className="animate-pulse-glow" />
            <span className="hidden sm:inline">AI Insights</span>
          </button>
          <button
            onClick={triggerAutoLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-900/40"
          >
            <Maximize2 size={12} />
            <span className="hidden sm:inline">Auto Layout</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════ ERROR BANNER ═══════════════════════════ */}
      {validationError && (
        <div className="shrink-0 bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-700/40 text-rose-800 dark:text-rose-200 px-4 py-2 flex items-center gap-2.5 z-30 text-xs font-semibold backdrop-blur">
          <AlertCircle size={14} className="text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="flex-1">{validationError}</span>
          <button onClick={() => setValidationError(null)} className="hover:bg-gray-100 dark:hover:text-white p-0.5 rounded">
            <X size={13} />
          </button>
        </div>
      )}

      {/* ═══════════════════════════ MAIN BODY ═══════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ─────────────────── LEFT SIDEBAR ─────────────────── */}
        <aside
          className="shrink-0 flex flex-col bg-white dark:bg-[#0c1018] border-r border-gray-200 dark:border-white/[0.05] overflow-hidden transition-colors duration-300"
          style={{ width: leftWidth }}
        >
          {/* Sidebar search + filters */}
          <div className="px-3 pt-3 pb-2 border-b border-gray-100 dark:border-white/[0.04] shrink-0">
            <div className="relative mb-2.5">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600" />
              <input
                type="text"
                placeholder="Search tasks…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/[0.06] rounded-xl pl-7 pr-3 py-1.5 text-[11px] text-gray-800 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white dark:focus:bg-black/50 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'backlog', label: 'Todo' },
                { key: 'in-progress', label: 'Active' },
                { key: 'completed', label: 'Done' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatusTab(key as any)}
                  className={`py-1 rounded-lg text-[10px] font-bold transition-all ${
                    statusTab === key
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-black/20 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Task count */}
          <div className="px-3 py-1.5 shrink-0">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-400 dark:text-gray-700">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Task list */}
          <div className="flex-1 overflow-y-auto px-2 pb-3 custom-scrollbar space-y-1">
            {filteredTasks.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-8 h-8 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-150 dark:border-white/[0.05] flex items-center justify-center mx-auto mb-2">
                  <Search size={13} className="text-gray-400 dark:text-gray-700" />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-600">No tasks found</p>
              </div>
            ) : filteredTasks.map(t => {
              const cfg = getStatusConfig(t);
              const isSelected = selectedTaskId === t.id;
              const hasPos = !!positions[t.id];
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    if (!positions[t.id]) setPositions(prev => ({ ...prev, [t.id]: { x: 120 - pan.x / zoom, y: 140 - pan.y / zoom } }));
                  }}
                  className={`rounded-xl border p-2.5 cursor-pointer transition-all group ${
                    isSelected
                      ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950/30 shadow-lg shadow-indigo-950/20'
                      : 'border-gray-200 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100/50 dark:hover:bg-white/[0.04] hover:border-gray-200 dark:hover:border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${cfg.badge}`}>{cfg.label}</span>
                    {!hasPos && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setPositions(prev => ({ ...prev, [t.id]: { x: 120 - pan.x / zoom, y: 140 - pan.y / zoom } }));
                        }}
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/20 transition-colors"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-gray-300 line-clamp-2 leading-snug group-hover:text-white transition-colors">{t.title}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Calendar size={9} className="text-gray-700 shrink-0" />
                    <span className="text-[9px] text-gray-600">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No date'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Left resize divider */}
        <Divider onMouseDown={handleLeftDividerMouseDown} />

        {/* ─────────────────── CANVAS ─────────────────── */}
        <div
          ref={canvasRef}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={() => { setDraggedNode(null); setIsPanning(false); }}
          onMouseDown={handleCanvasMouseDown}
          onWheel={handleWheel}
          className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-[#080b12] cursor-grab active:cursor-grabbing select-none transition-colors duration-300"
        >
          {/* Grid background */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: viewMode === 'critical' ? 0.15 : 0.22 }}>
            <svg width="100%" height="100%">
              <defs>
                <pattern id="dot-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                  <circle cx="14" cy="14" r="0.8" fill={theme === 'light' ? '#cbd5e1' : '#4f5e7a'} />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dot-grid)" />
            </svg>
          </div>

          {/* Critical path mode tinted overlay */}
          {viewMode === 'critical' && (
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-indigo-500/5 dark:from-rose-950/20 dark:to-indigo-950/20 pointer-events-none" />
          )}

          {/* ── Transformed canvas content ── */}
          <div
            style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', transition: isPanning ? 'none' : 'transform 0.04s ease-out' }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* SVG edges */}
            <svg className="absolute inset-0 overflow-visible z-0">
              <defs>
                {Object.entries(DEP_CONFIGS).map(([type, cfg]) => (
                  <marker key={type} id={`arrow-${type}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={cfg.color} />
                  </marker>
                ))}
                <filter id="glow-red">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {dependencies.map(d => {
                const src = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
                const tgt = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
                if (!positions[src] || !positions[tgt]) return null;

                const isCriticalEdge = criticalPath.includes(src) && criticalPath.includes(tgt);
                if (viewMode === 'critical' && !isCriticalEdge) return null;

                const cfg = DEP_CONFIGS[d.dependencyType as DependencyType] || DEP_CONFIGS['related-to'];
                const path = calculateEdgePath(src, tgt);
                const strokeColor = viewMode === 'critical' ? '#f43f5e' : cfg.color;
                const strokeW = (viewMode === 'critical' ? 3 : 2) * (isCriticalEdge ? 1.3 : 1);
                const isDashed = d.dependencyType === 'related-to' || d.dependencyType === 'parent-child';

                return (
                  <g key={d._id} className="pointer-events-auto group/edge">
                    {/* Fat transparent hit area */}
                    <path d={path} fill="none" stroke="transparent" strokeWidth="16"
                      onClick={() => { if (window.confirm('Remove this dependency?')) deleteDependency(d._id); }}
                      className="cursor-pointer"
                    />
                    {/* Glow under */}
                    <path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeW + 3}
                      strokeOpacity={0.15} strokeDasharray={isDashed ? '6,5' : undefined}
                    />
                    {/* Main stroke */}
                    <path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeW}
                      strokeDasharray={isDashed ? '6,5' : undefined}
                      markerEnd={`url(#arrow-${d.dependencyType})`}
                      style={{ filter: isCriticalEdge ? 'url(#glow-red)' : undefined }}
                      className="group-hover/edge:opacity-60 transition-opacity"
                    />
                  </g>
                );
              })}

              {/* Live connection preview */}
              {connectSource && positions[connectSource] && (
                <g>
                  <path
                    d={`M ${positions[connectSource].x + NODE_W} ${positions[connectSource].y + NODE_H / 2} L ${mousePos.x} ${mousePos.y}`}
                    fill="none" stroke={DEP_CONFIGS[selectedDepType].color} strokeWidth="2" strokeDasharray="6,4"
                    className="animate-pulse"
                  />
                  <circle cx={mousePos.x} cy={mousePos.y} r="5" fill={DEP_CONFIGS[selectedDepType].color} opacity={0.8} />
                </g>
              )}
            </svg>

            {/* Node cards */}
            <div className="absolute inset-0 z-10">
              {tasks.map(t => {
                const pos = positions[t.id];
                if (!pos) return null;
                const isSelected = selectedTaskId === t.id;
                const cfg = getStatusConfig(t);
                const isOnCritical = criticalPath.includes(t.id);
                const dimmed = viewMode === 'critical' && !isOnCritical;
                const assigneeUser = t.assignees?.length ? users.find(u => u.id === t.assignees[0]) : undefined;

                return (
                  <div
                    key={t.id}
                    onMouseDown={e => handleNodeMouseDown(e, t.id)}
                    onClick={e => { e.stopPropagation(); setSelectedTaskId(t.id); }}
                    onMouseUp={() => handleEndConnect(t.id)}
                    className={`absolute rounded-2xl border pointer-events-auto cursor-grab active:cursor-grabbing group select-none transition-all duration-200
                      ${cfg.bg} ${cfg.glow} ${cfg.ring} ring-1 border-gray-200/40 dark:border-white/[0.08]
                      ${isSelected ? 'ring-2 ring-indigo-500/70 !shadow-[0_0_24px_rgba(99,102,241,0.3)]' : ''}
                      ${dimmed ? 'opacity-20 scale-95' : 'opacity-100'}
                    `}
                    style={{ left: pos.x, top: pos.y, width: NODE_W, height: NODE_H, backdropFilter: 'blur(8px)', backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(10,13,22,0.88)' }}
                  >
                    {/* Critical path badge */}
                    {isOnCritical && (
                      <div className="absolute -top-2.5 left-3 px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-600/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-[8px] font-black uppercase tracking-wider">
                        Critical
                      </div>
                    )}

                    {/* Input handle */}
                    <div
                      onMouseUp={() => handleEndConnect(t.id)}
                      className="absolute -left-2 top-[40px] w-4 h-4 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#080b12] flex items-center justify-center hover:bg-indigo-500 hover:border-white transition-all cursor-crosshair opacity-0 group-hover:opacity-100 z-20"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                    </div>

                    {/* Output handle */}
                    <div
                      onMouseDown={e => handleStartConnect(e, t.id)}
                      className="absolute -right-2 top-[40px] w-4 h-4 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#080b12] flex items-center justify-center hover:bg-indigo-500 hover:border-white transition-all cursor-crosshair opacity-0 group-hover:opacity-100 z-20"
                    >
                      <Plus size={8} className="text-gray-400" />
                    </div>

                    {/* Card content */}
                    <div className="px-3 pt-3 pb-2 h-full flex flex-col">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${cfg.badge} uppercase tracking-wide`}>{cfg.label}</span>
                        <div className="flex items-center gap-1">
                          {cfg.label === 'blocked' ? <Lock size={9} className="text-rose-650 dark:text-rose-400" /> : <Unlock size={9} className="text-gray-400 dark:text-gray-600" />}
                        </div>
                      </div>
                      <h3 className="text-[11px] font-bold text-gray-800 dark:text-gray-200 line-clamp-2 leading-tight flex-1 group-hover:text-gray-950 dark:group-hover:text-white transition-colors">
                        {t.title}
                      </h3>
                      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-150 dark:border-white/[0.05]">
                        <span className="text-[8px] text-gray-500 dark:text-gray-650 flex items-center gap-1">
                          <Calendar size={9} />
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '—'}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] font-mono text-gray-655 dark:text-gray-400 bg-gray-100 dark:bg-black/30 px-1.5 py-0.5 rounded">{t.estimatedHours || '?'}h</span>
                          {assigneeUser
                            ? <Avatar user={assigneeUser} size="xs" />
                            : <div className="w-4 h-4 rounded-full bg-gray-150 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-[8px] text-gray-500">?</div>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── HUD overlays ── */}

          {/* Link type toolbar */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/90 dark:bg-[#0c1018]/90 backdrop-blur-xl border border-gray-200 dark:border-white/[0.07] rounded-2xl px-3 py-2 shadow-2xl transition-colors duration-300">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-650 dark:text-indigo-400 shrink-0">Link:</span>
            <div className="flex gap-0.5">
              {(Object.entries(DEP_CONFIGS) as [DependencyType, typeof DEP_CONFIGS[DependencyType]][]).map(([type, cfg]) => (
                <button
                  key={type}
                  onClick={() => setSelectedDepType(type)}
                  title={cfg.label}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                    selectedDepType === type ? cfg.activeClass : 'text-gray-500 hover:text-gray-850 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.04] border-transparent'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotColor}`} />
                  <span className="hidden lg:inline">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-white/95 dark:bg-[#0c1018]/95 backdrop-blur-xl border border-gray-200 dark:border-white/[0.07] rounded-2xl p-2.5 shadow-2xl transition-colors duration-300">
            <button onClick={() => setZoom(z => Math.max(z - 0.15, 0.25))} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" title="Zoom Out">
              <ZoomOut size={13} />
            </button>
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-20 sm:w-24 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-650 transition-all hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none"
            />
            <span className="text-[10px] font-mono font-black text-gray-650 dark:text-gray-500 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(z + 0.15, 3))} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" title="Zoom In">
              <ZoomIn size={13} />
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-white/[0.06] mx-0.5" />
            <button onClick={() => { setZoom(0.9); setPan({ x: 60, y: 160 }); }} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors" title="Reset view">
              <Maximize2 size={13} />
            </button>
            <button onClick={handleUndo} disabled={history.length === 0} className={`p-1.5 rounded-xl transition-colors ${history.length > 0 ? 'hover:bg-gray-100 dark:hover:bg-white/[0.06] text-gray-500 hover:text-gray-900 dark:hover:text-white' : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'}`} title="Undo drag">
              <Undo2 size={13} />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-3 z-10 flex items-center gap-3 bg-white/90 dark:bg-[#0c1018]/85 backdrop-blur-xl border border-gray-200 dark:border-white/[0.06] rounded-2xl px-3 py-1.5 shadow-xl transition-colors duration-300">
            {LEGEND.map(([type, cfg]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-4 h-px rounded-full" style={{ backgroundColor: cfg.color, boxShadow: `0 0 4px ${cfg.color}` }} />
                <span className="text-[8.5px] text-gray-500 dark:text-gray-600 font-bold uppercase tracking-wide hidden sm:inline">{cfg.label}</span>
              </div>
            ))}
          </div>

          {/* Minimap */}
          <div className="absolute bottom-16 right-4 w-28 h-20 bg-white/95 dark:bg-[#0c1018]/90 border border-gray-200 dark:border-white/[0.07] rounded-2xl overflow-hidden shadow-2xl p-1 z-10 opacity-60 pointer-events-none transition-colors duration-300">
            <div className="w-full h-full relative rounded-xl overflow-hidden">
              {tasks.map(t => {
                const pos = positions[t.id];
                if (!pos) return null;
                const cfg = getStatusConfig(t);
                return (
                  <div key={t.id} className={`absolute w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                    style={{ left: `${Math.max(2, Math.min(93, pos.x / 18 + 16))}%`, top: `${Math.max(2, Math.min(93, pos.y / 12 + 25))}%` }}
                  />
                );
              })}
            </div>
          </div>

          {/* Critical path legend overlay */}
          {viewMode === 'critical' && (
            <div className="absolute top-3 right-3 z-10 bg-rose-50/90 dark:bg-rose-950/40 backdrop-blur border border-rose-200 dark:border-rose-700/30 rounded-2xl px-3 py-2 text-[10px] text-rose-800 dark:text-rose-300 shadow-xl transition-colors duration-300">
              <p className="font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target size={11} /> Critical Path Mode
              </p>
              <p className="text-rose-650/80 dark:text-rose-500/70 mt-0.5 font-medium">{criticalPath.length} tasks on critical chain</p>
            </div>
          )}
        </div>

        {/* Right resize divider (only when inspector open) */}
        {selectedTask && <Divider onMouseDown={handleRightDividerMouseDown} />}

        {/* ─────────────────── RIGHT INSPECTOR ─────────────────── */}
        {selectedTask && (
          <aside
            className="shrink-0 flex flex-col bg-white dark:bg-[#0c1018] border-l border-gray-200 dark:border-white/[0.05] overflow-hidden transition-colors duration-300"
            style={{ width: rightWidth }}
          >
            {/* Inspector header */}
            <div className="px-4 py-3.5 border-b border-gray-200 dark:border-white/[0.05] flex items-start gap-2.5 shrink-0 transition-colors duration-300">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${selectedTaskCfg?.dot}`} />
                  <span className={`text-[9px] font-black uppercase tracking-wider ${selectedTaskCfg?.text}`}>{selectedTaskCfg?.label}</span>
                </div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white line-clamp-2 leading-tight">{selectedTask.title}</h2>
              </div>
              <button
                onClick={() => setSelectedTaskId(null)}
                className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-150 dark:hover:bg-white/[0.06] transition-colors shrink-0 mt-0.5"
              >
                <X size={14} />
              </button>
            </div>

            {/* Scrollable inspector body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-3 space-y-3">

                {/* Status + risk cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.05] rounded-xl transition-colors duration-300">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-600 mb-1.5">Status</p>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${selectedTaskCfg?.dot}`} />
                      <span className="text-[11px] font-black text-gray-800 dark:text-gray-200 capitalize">{selectedTaskCfg?.label}</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.05] rounded-xl transition-colors duration-300">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-550 dark:text-gray-600 mb-1.5">Delay Risk</p>
                    <span className={`inline-flex text-[9px] font-black uppercase px-1.5 py-0.5 rounded-lg ${getDelayRisk(selectedTask.id).cls}`}>
                      {getDelayRisk(selectedTask.id).level}
                    </span>
                  </div>
                </div>

                {/* Blocked warning */}
                {selectedTaskCfg?.label === 'blocked' && (
                  <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-xl p-3 flex items-start gap-2.5">
                    <AlertCircle size={13} className="text-rose-650 dark:text-rose-450 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[9px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-0.5">Blocked</p>
                      <p className="text-[10px] text-rose-800/80 dark:text-rose-300/80 leading-relaxed">
                        {incomingDeps.length} upstream task{incomingDeps.length !== 1 ? 's' : ''} must complete first.
                      </p>
                    </div>
                  </div>
                )}

                {/* Incoming deps */}
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-550 dark:text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400 flex items-center justify-center text-[8px] font-black">{incomingDeps.length}</span>
                    Incoming Blockers
                  </p>
                  {incomingDeps.length === 0
                    ? <p className="text-[10px] text-gray-405 dark:text-gray-700 italic pl-1">None assigned</p>
                    : incomingDeps.map(d => {
                      const src = d.sourceTaskId?._id || d.sourceTaskId?.id || d.sourceTaskId;
                      const bTask = tasks.find(tk => tk.id === src);
                      if (!bTask) return null;
                      return (
                        <div key={d._id} className="flex items-center justify-between gap-2 p-2.5 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.04] hover:border-rose-500/25 rounded-xl transition-all group/dep mb-1">
                          <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate">{bTask.title}</p>
                          <button onClick={() => deleteDependency(d._id)} className="p-1 rounded-lg text-gray-400 hover:text-rose-600 dark:text-gray-605 dark:hover:text-rose-400 opacity-0 group-hover/dep:opacity-100 transition-all shrink-0">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      );
                    })
                  }
                </div>

                {/* Outgoing deps */}
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-555 dark:text-gray-600 mb-1.5 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 flex items-center justify-center text-[8px] font-black">{outgoingDeps.length}</span>
                    Blocking Downstream
                  </p>
                  {outgoingDeps.length === 0
                    ? <p className="text-[10px] text-gray-405 dark:text-gray-700 italic pl-1">No downstream tasks</p>
                    : outgoingDeps.map(d => {
                      const tgt = d.targetTaskId?._id || d.targetTaskId?.id || d.targetTaskId;
                      const depTask = tasks.find(tk => tk.id === tgt);
                      if (!depTask) return null;
                      return (
                        <div key={d._id} className="flex items-center justify-between gap-2 p-2.5 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.04] hover:border-indigo-500/25 rounded-xl transition-all group/dep mb-1">
                          <p className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate">{depTask.title}</p>
                          <button onClick={() => deleteDependency(d._id)} className="p-1 rounded-lg text-gray-400 hover:text-rose-650 dark:text-gray-605 dark:hover:text-rose-400 opacity-0 group-hover/dep:opacity-100 transition-all shrink-0">
                            <Trash2 size={10} />
                          </button>
                        </div>
                      );
                    })
                  }
                </div>

                {/* Event log */}
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-600 mb-1.5">Event Log</p>
                  {dependencyEvents.length === 0
                    ? <p className="text-[10px] text-gray-405 dark:text-gray-700 italic pl-1 py-2">No events yet</p>
                    : dependencyEvents.slice(0, 8).map(e => (
                      <div key={e._id} className="flex gap-2 p-2.5 bg-gray-50/30 dark:bg-black/15 border border-gray-200/40 dark:border-white/[0.03] rounded-xl mb-1 transition-colors duration-300">
                        <Clock size={9} className="text-indigo-600 dark:text-indigo-500 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[9px] text-gray-600 dark:text-gray-400 font-medium leading-snug truncate">{e.details}</p>
                          <span className="text-[8px] text-gray-400 dark:text-gray-700">
                            {e.userId?.name || 'User'} · {new Date(e.createdAt || e.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* Footer action */}
            <div className="p-3 border-t border-gray-200 dark:border-white/[0.05] shrink-0 transition-colors duration-300">
              <button
                onClick={() => { setSelectedTaskId(null); setActiveView('board'); }}
                className="w-full py-2 px-3 rounded-xl border border-gray-200 dark:border-white/[0.07] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:border-gray-300 dark:hover:border-white/[0.12] text-[11px] font-bold transition-all"
              >
                Open in Kanban Board
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ═══════════════════════ AI MODAL ══════════════════════════════════ */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#0c1018] border border-gray-200 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl transition-colors duration-300">

            {/* Modal header */}
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/30 dark:from-indigo-950/60 dark:to-purple-950/30 border-b border-gray-200 dark:border-white/[0.07] flex items-center justify-between transition-colors duration-300">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 text-indigo-650 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/25">
                  <Sparkles size={15} className="text-indigo-650 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">AI Workflow Intelligence</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Predictive bottleneck and risk analysis</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="p-1.5 rounded-xl text-gray-550 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
                <X size={15} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto custom-scrollbar">

              {/* Critical path summary */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-205 dark:border-indigo-800/30 rounded-2xl transition-colors duration-300">
                <h4 className="font-black text-[10px] uppercase tracking-widest text-indigo-650 dark:text-indigo-400 flex items-center gap-1.5 mb-2">
                  <GitBranch size={11} /> Delivery Timeline
                </h4>
                <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed">
                  Critical path spans <span className="font-black text-gray-900 dark:text-white">{criticalPath.length} tasks</span> with an estimated{' '}
                  <span className="font-black text-gray-900 dark:text-white">{criticalPath.length * 8}h</span> of cumulative workload. Any delay in this chain will cascade downstream.
                </p>
              </div>

              {/* Grid: bottlenecks + delays */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.05] rounded-2xl space-y-2 transition-colors duration-300">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-amber-605 dark:text-amber-400 flex items-center gap-1.5">
                    <AlertCircle size={10} /> Bottlenecks
                  </h4>
                  {aiInsights.bottlenecks?.length > 0 ? aiInsights.bottlenecks.map((b: any) => (
                    <div key={b.taskId} className="p-2 bg-white dark:bg-black/30 border border-gray-200/50 dark:border-white/[0.04] rounded-xl transition-colors duration-300">
                      <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200 leading-tight mb-0.5">{b.title}</p>
                      <p className="text-[8px] text-amber-650 dark:text-amber-500 font-bold">Blocks {b.blockingCount} downstream</p>
                    </div>
                  )) : <p className="text-[10px] text-gray-400 dark:text-gray-600 italic">No bottlenecks detected</p>}
                </div>

                <div className="p-3 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.05] rounded-2xl space-y-2 transition-colors duration-300">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <Clock size={10} /> Delay Risk
                  </h4>
                  {aiInsights.delays?.length > 0 ? aiInsights.delays.map((d: any) => (
                    <div key={d.taskId} className="p-2 bg-white dark:bg-black/30 border border-gray-200/50 dark:border-white/[0.04] rounded-xl transition-colors duration-300">
                      <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200 leading-tight mb-0.5">{d.title}</p>
                      <p className="text-[8px] text-rose-600 dark:text-rose-400 font-semibold line-clamp-2">{d.reason}</p>
                    </div>
                  )) : <p className="text-[10px] text-gray-400 dark:text-gray-600 italic">No cascading delays</p>}
                </div>
              </div>

              {/* Suggestions */}
              <div className="p-3 bg-gray-50/50 dark:bg-black/20 border border-gray-200 dark:border-white/[0.05] rounded-2xl space-y-2 transition-colors duration-300">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-650 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles size={10} /> Recommendations
                </h4>
                {aiInsights.suggestions?.length > 0 ? aiInsights.suggestions.map((s: any, i: number) => (
                  <div key={i} className="p-2 bg-white dark:bg-black/30 border border-gray-200/50 dark:border-white/[0.04] rounded-xl flex items-start gap-2 transition-colors duration-300">
                    <ChevronRight size={10} className="text-indigo-650 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-gray-700 dark:text-gray-300 leading-relaxed">{s.message}</p>
                  </div>
                )) : <p className="text-[10px] text-gray-400 dark:text-gray-600 italic">All task allocations are optimal</p>}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 dark:border-white/[0.07] bg-gray-50 dark:bg-black/20 flex justify-end transition-colors duration-300">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-900/40"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
