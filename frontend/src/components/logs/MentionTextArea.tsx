import React, { useState, useRef, useEffect } from 'react';
import { useStore, User } from '../../store/useStore';
import { Avatar } from '../ui/Avatar';

interface MentionTextAreaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
  id?: string;
}

export const MentionTextArea: React.FC<MentionTextAreaProps> = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = '',
  autoFocus = false,
  id,
}) => {
  const { users, project } = useStore();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [atIndex, setAtIndex] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeMembers = users.filter((u) => (project.members || []).includes(u.id));

  const filteredMembers = activeMembers.filter((user) => {
    const username = user.name.toLowerCase().replace(/\s+/g, '_');
    const displayName = user.name.toLowerCase();
    return username.includes(searchQuery) || displayName.includes(searchQuery);
  });

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, filteredMembers.length]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkMentions = (val: string, cursorIndex: number) => {
    const textBeforeCursor = val.substring(0, cursorIndex);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (/\s/.test(charBeforeAt)) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        if (!/\s/.test(query)) {
          setAtIndex(lastAtIndex);
          setSearchQuery(query.toLowerCase());
          setShowSuggestions(true);
          return;
        }
      }
    }

    setShowSuggestions(false);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);
    checkMentions(val, e.target.selectionStart);
  };

  const handleSelectOrClick = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    checkMentions(target.value, target.selectionStart);
  };

  const selectUser = (user: User) => {
    const username = user.name.toLowerCase().replace(/\s+/g, '_');
    const textBeforeAt = value.substring(0, atIndex);
    const textAfterCursor = value.substring(textareaRef.current?.selectionStart || value.length);
    const newValue = `${textBeforeAt}@${username} ${textAfterCursor}`;
    onChange(newValue);

    const newCursorPos = textBeforeAt.length + username.length + 2; // +1 for @, +1 for space
    setShowSuggestions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || filteredMembers.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredMembers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedUser = filteredMembers[selectedIndex];
      if (selectedUser) {
        selectUser(selectedUser);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-full flex flex-col">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextareaChange}
        onKeyUp={handleSelectOrClick}
        onKeyDown={handleKeyDown}
        onClick={handleSelectOrClick}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        id={id}
        className={className}
      />
      {showSuggestions && filteredMembers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-2 w-full max-w-[280px] max-h-52 overflow-y-auto bg-white dark:bg-[#0c1018] border border-gray-150 dark:border-gray-850 rounded-2xl shadow-2xl z-50 p-1.5 animate-dropdown"
        >
          {filteredMembers.map((user, idx) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectUser(user)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all ${
                idx === selectedIndex
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/40'
              }`}
            >
              <Avatar user={user} size="xs" />
              <div className="flex-1 min-w-0">
                <p className={`font-bold truncate ${idx === selectedIndex ? 'text-white' : 'text-gray-900 dark:text-gray-150'}`}>
                  {user.name}
                </p>
                <p className={`text-[10px] truncate ${idx === selectedIndex ? 'text-indigo-200' : 'text-gray-450 dark:text-gray-500'}`}>
                  @{user.name.toLowerCase().replace(/\s+/g, '_')}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
