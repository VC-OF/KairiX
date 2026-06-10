import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import {
  Search, LayoutDashboard, Kanban, Users, TrendingUp, BookOpen,
  Clock, FileText, Network, Calendar, User, ArrowRight, Hash,
  Command,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResultGroup = {
  label: string;
  items: ResultItem[];
};

type ResultItem = {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action: () => void;
};

const VIEW_NAV: ResultItem[] = [
  { id: 'v-dash', icon: <LayoutDashboard size={15} />, title: 'Dashboard', subtitle: 'Project overview', action: () => {} },
  { id: 'v-board', icon: <Kanban size={15} />, title: 'Kanban Board', subtitle: 'Task management', action: () => {} },
  { id: 'v-analytics', icon: <TrendingUp size={15} />, title: 'Analytics', subtitle: 'Productivity stats', action: () => {} },
  { id: 'v-members', icon: <Users size={15} />, title: 'Team Members', subtitle: 'Manage team', action: () => {} },
  { id: 'v-logs', icon: <BookOpen size={15} />, title: 'Daily Logs', subtitle: 'Status updates', action: () => {} },
  { id: 'v-tracker', icon: <Clock size={15} />, title: 'Time Tracker', subtitle: 'Track work sessions', action: () => {} },
  { id: 'v-files', icon: <FileText size={15} />, title: 'Files & Docs', subtitle: 'Project documents', action: () => {} },
  { id: 'v-dependency', icon: <Network size={15} />, title: 'Dependency Map', subtitle: 'Task relationships', action: () => {} },
  { id: 'v-calendar', icon: <Calendar size={15} />, title: 'Calendar View', subtitle: 'Work hours calendar', action: () => {} },
  { id: 'v-profile', icon: <User size={15} />, title: 'My Profile', subtitle: 'Account settings', action: () => {} },
];

const VIEW_MAP: Record<string, string> = {
  'v-dash': 'dashboard', 'v-board': 'board', 'v-analytics': 'analytics',
  'v-members': 'members', 'v-logs': 'logs', 'v-tracker': 'tracker',
  'v-files': 'files', 'v-dependency': 'dependency', 'v-calendar': 'calendar',
  'v-profile': 'profile',
};

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-indigo-200/80 dark:bg-indigo-500/40 text-inherit rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const { tasks, users, projects, setActiveView, setSelectedTaskId, setProject } = useStore();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build result groups
  const buildGroups = useCallback((): ResultGroup[] => {
    const q = query.trim().toLowerCase();
    const groups: ResultGroup[] = [];

    // Navigation
    const navItems = VIEW_NAV.map(item => ({
      ...item,
      action: () => { setActiveView(VIEW_MAP[item.id] as any); onClose(); },
    })).filter(item =>
      !q || item.title.toLowerCase().includes(q) || (item.subtitle || '').toLowerCase().includes(q)
    );
    if (navItems.length) groups.push({ label: 'Navigate', items: navItems.slice(0, 5) });

    // Tasks
    const taskItems: ResultItem[] = tasks
      .filter(t => !q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
      .slice(0, 6)
      .map(t => ({
        id: `task-${t.id}`,
        icon: <Hash size={15} className="text-indigo-400" />,
        title: t.title,
        subtitle: `${t.status} · ${t.priority} priority`,
        action: () => { setSelectedTaskId(t.id); setActiveView('board'); onClose(); },
      }));
    if (taskItems.length) groups.push({ label: 'Tasks', items: taskItems });

    // Members
    const memberItems: ResultItem[] = users
      .filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 4)
      .map(u => ({
        id: `user-${u.id}`,
        icon: <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white" style={{ background: u.color }}>{u.avatar?.slice(0, 2)}</div>,
        title: u.name,
        subtitle: u.email,
        action: () => { setActiveView('members'); onClose(); },
      }));
    if (memberItems.length) groups.push({ label: 'Members', items: memberItems });

    // Projects
    const projItems: ResultItem[] = projects
      .filter(p => !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
      .slice(0, 4)
      .map(p => ({
        id: `proj-${p.id}`,
        icon: <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" />,
        title: p.name,
        subtitle: p.description || p.status,
        action: () => { setProject(p); onClose(); },
      }));
    if (projItems.length) groups.push({ label: 'Projects', items: projItems });

    return groups;
  }, [query, tasks, users, projects, setActiveView, setSelectedTaskId, setProject, onClose]);

  const groups = buildGroups();
  const allItems = groups.flatMap(g => g.items);

  useEffect(() => { setActiveIndex(0); }, [query]);
  useEffect(() => { if (isOpen) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(''); } }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allItems.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter') { e.preventDefault(); allItems[activeIndex]?.action(); }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, allItems, activeIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  let globalIdx = -1;

  return (
    <div className="fixed inset-0 z-[9998] flex items-start justify-center pt-[15vh] px-4" role="dialog" aria-modal="true" aria-label="Command Palette">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white/95 dark:bg-[#0f1322]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-700/40 overflow-hidden flex flex-col animate-scale-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, members, navigate…"
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 text-sm font-medium placeholder-gray-400 outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto max-h-[420px] py-2 custom-scrollbar">
          {groups.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-gray-400">
              <Command size={32} className="opacity-30" />
              <p className="text-sm font-medium">No results found</p>
            </div>
          )}
          {groups.map(group => (
            <div key={group.label}>
              <p className="px-5 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{group.label}</p>
              {group.items.map(item => {
                globalIdx++;
                const idx = globalIdx;
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={item.id}
                    data-idx={idx}
                    onClick={item.action}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'}`}>{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>
                        {highlight(item.title, query.trim())}
                      </p>
                      {item.subtitle && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.subtitle}</p>
                      )}
                    </div>
                    {isActive && <ArrowRight size={14} className="text-indigo-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-5 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40">
          {[['↑↓', 'navigate'], ['↵', 'select'], ['esc', 'close']].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5 text-[10px] text-gray-400">
              <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 font-mono text-[9px] text-gray-500">{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
