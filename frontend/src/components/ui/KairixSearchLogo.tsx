import React from 'react';
import { Search } from 'lucide-react';

export default function KairixSearchLogo() {
  return <Search size={18} />;
}

export function KairixSearchButton({ onClick }: { onClick?: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className="p-2 rounded-xl border border-gray-200/40 dark:border-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800/45 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-all cursor-pointer shadow-sm flex items-center justify-center"
      title="Search (Ctrl+K)"
    >
      <Search size={18} />
    </button>
  );
}
