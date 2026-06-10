import React from 'react';

// ─── Base shimmer effect ─────────────────────────────────────────────────────
const shimmer = 'relative overflow-hidden bg-gray-100 dark:bg-gray-800/60 before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/40 dark:before:via-white/5 before:to-transparent';

// ─── Primitives ───────────────────────────────────────────────────────────────
export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`${shimmer} rounded-xl ${className}`} />
);

export const SkeletonCircle: React.FC<{ size?: number }> = ({ size = 10 }) => (
  <div className={`${shimmer} rounded-full shrink-0`} style={{ width: size, height: size }} />
);

export const SkeletonText: React.FC<{ width?: string; className?: string }> = ({ width = 'w-32', className = '' }) => (
  <div className={`${shimmer} h-3 rounded-full ${width} ${className}`} />
);

// ─── Dashboard skeleton ───────────────────────────────────────────────────────
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    {/* Stat cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-[#0f1623] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonCircle size={32} />
          </div>
          <SkeletonBox className="h-8 w-16" />
          <SkeletonText width="w-20" />
        </div>
      ))}
    </div>
    {/* Chart block */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white dark:bg-[#0f1623] rounded-2xl border border-gray-100 dark:border-white/8 p-5">
        <SkeletonText width="w-40" className="mb-4" />
        <SkeletonBox className="h-48 w-full" />
      </div>
      <div className="bg-white dark:bg-[#0f1623] rounded-2xl border border-gray-100 dark:border-white/8 p-5 space-y-3">
        <SkeletonText width="w-32" className="mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonCircle size={32} />
            <div className="flex-1 space-y-1.5">
              <SkeletonText width="w-full" />
              <SkeletonText width="w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Kanban skeleton ──────────────────────────────────────────────────────────
export const KanbanSkeleton: React.FC = () => (
  <div className="grid grid-cols-4 gap-4 flex-1 animate-fade-in">
    {Array.from({ length: 4 }).map((_, col) => (
      <div key={col} className="flex flex-col gap-3 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <SkeletonCircle size={12} />
          <SkeletonText width="w-24" />
          <SkeletonBox className="h-5 w-6 ml-auto rounded-full" />
        </div>
        {Array.from({ length: col === 0 ? 3 : col === 1 ? 4 : col === 2 ? 2 : 3 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-[#0f1623] rounded-xl p-4 space-y-3 border border-gray-100 dark:border-white/5">
            <SkeletonText width="w-full" />
            <SkeletonText width="w-3/4" />
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-1">
                <SkeletonCircle size={20} />
                <SkeletonCircle size={20} />
              </div>
              <SkeletonBox className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

// ─── Members skeleton ─────────────────────────────────────────────────────────
export const MembersSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonText width="w-40" className="h-5" />
        <SkeletonText width="w-56" />
      </div>
      <SkeletonBox className="h-9 w-28 rounded-xl" />
    </div>
    <SkeletonBox className="h-12 w-full rounded-2xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-[#0f1623] rounded-2xl border border-gray-100 dark:border-white/8 overflow-hidden">
          <div className="flex items-center gap-4 p-5 border-b border-gray-50 dark:border-white/5">
            <SkeletonCircle size={48} />
            <div className="flex-1 space-y-2">
              <SkeletonText width="w-32" className="h-4" />
              <SkeletonText width="w-24" />
            </div>
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <SkeletonBox key={j} className="h-14 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Analytics skeleton ───────────────────────────────────────────────────────
export const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBox key={i} className="h-24 rounded-2xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SkeletonBox className="h-64 rounded-2xl" />
      <SkeletonBox className="h-64 rounded-2xl" />
    </div>
    <SkeletonBox className="h-48 rounded-2xl" />
  </div>
);

// ─── Generic list skeleton ────────────────────────────────────────────────────
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="space-y-3 animate-fade-in">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-[#0f1623] rounded-xl border border-gray-100 dark:border-white/8">
        <SkeletonCircle size={40} />
        <div className="flex-1 space-y-2">
          <SkeletonText width="w-1/2" className="h-4" />
          <SkeletonText width="w-1/3" />
        </div>
        <SkeletonBox className="h-7 w-20 rounded-lg" />
      </div>
    ))}
  </div>
);
