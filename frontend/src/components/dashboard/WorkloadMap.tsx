import React, { useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { BarChart2 } from 'lucide-react';

const STATUS_COLS = ['pending', 'in-progress', 'stuck', 'completed'] as const;

const STATUS_COLORS: Record<string, { cell: string; text: string }> = {
  pending:     { cell: 'bg-gray-100 dark:bg-gray-800',                    text: 'text-gray-600 dark:text-gray-300' },
  'in-progress':{ cell: 'bg-blue-50 dark:bg-blue-900/20',                  text: 'text-blue-700 dark:text-blue-300' },
  stuck:       { cell: 'bg-rose-50 dark:bg-rose-900/20',                   text: 'text-rose-700 dark:text-rose-300' },
  completed:   { cell: 'bg-emerald-50 dark:bg-emerald-900/20',             text: 'text-emerald-700 dark:text-emerald-300' },
};

function heatClass(count: number, max: number): string {
  if (max === 0 || count === 0) return '';
  const ratio = count / max;
  if (ratio < 0.3) return 'opacity-30';
  if (ratio < 0.6) return 'opacity-60';
  return 'opacity-100';
}

export const WorkloadMap: React.FC = () => {
  const { tasks, users, project, setFilterAssignee, setFilterStatus, setActiveView } = useStore();
  const [hovered, setHovered] = useState<string | null>(null);

  const projectMembers = useMemo(
    () => users.filter(u => project.members.includes(u.id)),
    [users, project.members]
  );

  const matrix = useMemo(() => {
    return projectMembers.map(member => {
      const row: Record<string, number> = {};
      STATUS_COLS.forEach(s => {
        row[s] = tasks.filter(t => t.status === s && (t.assignees || []).includes(member.id)).length;
      });
      return { member, counts: row };
    });
  }, [projectMembers, tasks]);

  const maxCount = useMemo(() => Math.max(...matrix.flatMap(r => Object.values(r.counts)), 1), [matrix]);

  if (projectMembers.length === 0) return null;

  const handleCellClick = (memberId: string, status: string) => {
    setFilterAssignee(memberId);
    setFilterStatus(status as any);
    setActiveView('board');
  };

  return (
    <div className="bg-white dark:bg-[#0f1623] rounded-2xl border border-gray-100 dark:border-white/8 shadow-sm p-5 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-md shadow-sky-500/20">
          <BarChart2 size={14} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Workload Balance</h3>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">Click a cell to filter Board</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[360px]">
          <thead>
            <tr>
              <th className="pb-2 pr-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 w-32">Member</th>
              {STATUS_COLS.map(s => (
                <th key={s} className="pb-2 text-center text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                  {s === 'in-progress' ? 'Active' : s.charAt(0).toUpperCase() + s.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {matrix.map(({ member, counts }) => (
              <tr key={member.id} className="group">
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
                      style={{ background: member.color }}
                    >
                      {member.avatar?.slice(0, 2)}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[80px]">{member.name.split(' ')[0]}</span>
                  </div>
                </td>
                {STATUS_COLS.map(status => {
                  const count = counts[status];
                  const key = `${member.id}-${status}`;
                  const isHovered = hovered === key;
                  return (
                    <td key={status} className="py-2 text-center">
                      <button
                        onClick={() => handleCellClick(member.id, status)}
                        onMouseEnter={() => setHovered(key)}
                        onMouseLeave={() => setHovered(null)}
                        title={`${member.name.split(' ')[0]}: ${count} ${status} task${count !== 1 ? 's' : ''} — click to filter`}
                        className={`mx-auto w-10 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                          count > 0 ? STATUS_COLORS[status].cell : 'bg-gray-50 dark:bg-gray-900/40'
                        } ${heatClass(count, maxCount)} ${isHovered ? 'scale-110 shadow-md ring-2 ring-indigo-400/30' : ''}`}
                      >
                        <span className={`text-xs font-black ${count > 0 ? STATUS_COLORS[status].text : 'text-gray-300 dark:text-gray-700'}`}>
                          {count}
                        </span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-3">
        Cell opacity indicates relative workload intensity
      </p>
    </div>
  );
};
