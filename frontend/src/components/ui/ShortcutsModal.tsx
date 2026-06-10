import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    group: 'Global',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show this shortcuts reference' },
      { keys: ['Esc'], description: 'Close modal / palette / panel' },
    ],
  },
  {
    group: 'Navigation',
    items: [
      { keys: ['D'], description: 'Go to Dashboard' },
      { keys: ['B'], description: 'Go to Kanban Board' },
      { keys: ['M'], description: 'Go to Team Members' },
      { keys: ['A'], description: 'Go to Analytics' },
      { keys: ['L'], description: 'Go to Daily Logs' },
      { keys: ['T'], description: 'Go to Time Tracker' },
    ],
  },
  {
    group: 'Board',
    items: [
      { keys: ['N'], description: 'New task (when on Board)' },
      { keys: ['F'], description: 'Toggle filters panel' },
      { keys: ['G'], description: 'Toggle board / list view' },
    ],
  },
  {
    group: 'Task Detail',
    items: [
      { keys: ['E'], description: 'Edit focused task' },
      { keys: ['Ctrl', 'Enter'], description: 'Submit comment' },
      { keys: ['Esc'], description: 'Close task panel' },
    ],
  },
];

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[11px] font-mono font-bold text-gray-600 dark:text-gray-300 shadow-[0_1px_0_rgba(0,0,0,0.12)]">
    {children}
  </kbd>
);

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-[#0f1322] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700/60 w-full max-w-xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
            <Keyboard size={18} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Keyboard Shortcuts</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Quick reference for all KairiX shortcuts</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {SHORTCUTS.map(group => (
            <div key={group.group}>
              <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                {group.group}
              </h3>
              <div className="space-y-2">
                {group.items.map(item => (
                  <div
                    key={item.description}
                    className="flex items-center justify-between gap-3 py-1.5"
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.keys.map((key, ki) => (
                        <React.Fragment key={ki}>
                          <Kbd>{key}</Kbd>
                          {ki < item.keys.length - 1 && (
                            <span className="text-[10px] text-gray-400">+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
            Press <Kbd>?</Kbd> anywhere to toggle this panel · <Kbd>Esc</Kbd> to dismiss
          </p>
        </div>
      </div>
    </div>
  );
};
