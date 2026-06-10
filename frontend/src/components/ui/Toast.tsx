import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
  error: <XCircle size={18} className="text-rose-500 shrink-0" />,
  warning: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
  info: <Info size={18} className="text-indigo-500 shrink-0" />,
};

const STYLES: Record<ToastType, string> = {
  success: 'border-emerald-500/20 bg-emerald-50/95 dark:bg-[#0f1f14]/95',
  error: 'border-rose-500/20 bg-rose-50/95 dark:bg-[#1f0f0f]/95',
  warning: 'border-amber-500/20 bg-amber-50/95 dark:bg-[#1f1a0f]/95',
  info: 'border-indigo-500/20 bg-indigo-50/95 dark:bg-[#0f1323]/95',
};

const TITLE_STYLES: Record<ToastType, string> = {
  success: 'text-emerald-800 dark:text-emerald-200',
  error: 'text-rose-800 dark:text-rose-200',
  warning: 'text-amber-800 dark:text-amber-200',
  info: 'text-indigo-800 dark:text-indigo-200',
};

const MSG_STYLES: Record<ToastType, string> = {
  success: 'text-emerald-700 dark:text-emerald-300',
  error: 'text-rose-700 dark:text-rose-300',
  warning: 'text-amber-700 dark:text-amber-300',
  info: 'text-indigo-700 dark:text-indigo-300',
};

const PROGRESS_COLORS: Record<ToastType, string> = {
  success: 'bg-emerald-500',
  error: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-indigo-500',
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const duration = toast.duration ?? 4000;

  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3.5 rounded-2xl border shadow-xl backdrop-blur-md w-80 max-w-[90vw] overflow-hidden animate-slide-in-right ${STYLES[toast.type]}`}
      role="alert"
    >
      {ICONS[toast.type]}
      <div className="flex-1 min-w-0 pt-px">
        <p className={`text-sm font-bold leading-snug ${TITLE_STYLES[toast.type]}`}>{toast.title}</p>
        {toast.message && (
          <p className={`text-xs mt-0.5 leading-relaxed ${MSG_STYLES[toast.type]}`}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-0.5 ${PROGRESS_COLORS[toast.type]} animate-toast-progress`}
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = toast.duration ?? 4000;
    setToasts(prev => [...prev.slice(-4), { ...toast, id, duration }]); // max 5 toasts
    const timer = setTimeout(() => removeToast(id), duration);
    timersRef.current.set(id, timer);
  }, [removeToast]);

  const success = useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast({ type: 'error', title, message }), [addToast]);
  const warning = useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message }), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast portal — fixed bottom-right */}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
      >
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
