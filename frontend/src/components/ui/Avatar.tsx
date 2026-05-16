import React from 'react';
import { User } from '../../store/useStore';

interface AvatarProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const sizeClasses = {
  xxs: 'w-4 h-4 text-[8px]',
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export const Avatar: React.FC<AvatarProps> = ({ user, size = 'md', showTooltip = false }) => {
  const isImage = user.avatar && (user.avatar.startsWith('http') || user.avatar.startsWith('data:image'));

  return (
    <div className="relative group">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white dark:ring-gray-800 shadow-sm flex-shrink-0 transition-all overflow-hidden`}
        style={{ backgroundColor: user.color }}
      >
        {isImage ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <span className="truncate px-1">{user.avatar?.substring(0, 3)}</span>
        )}
      </div>
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
          {user.name}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

interface AvatarGroupProps {
  users: User[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ users, max = 3, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((user) => (
        <Avatar key={user.id} user={user} size={size} showTooltip />
      ))}
      {overflow > 0 && (
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white bg-gray-400 dark:bg-gray-600 ring-2 ring-white dark:ring-gray-800 text-xs transition-all`}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};
