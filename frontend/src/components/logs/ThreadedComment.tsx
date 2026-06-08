import React, { useState } from 'react';
import { ArrowBigUp, ArrowBigDown, MessageSquare, Award, Share2, CornerDownRight } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

export interface Reply {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  content: string;
  createdAt: string;
  score: number;
  userVote: 'up' | 'down' | null;
  replies: Reply[];
}

interface ThreadedCommentProps {
  comment: Reply;
  onAddReply: (commentId: string, content: string) => void;
  onVote: (commentId: string, direction: 'up' | 'down') => void;
  depth: number;
}

export const ThreadedComment: React.FC<ThreadedCommentProps> = ({
  comment,
  onAddReply,
  onVote,
  depth = 0
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [hoveredLine, setHoveredLine] = useState(false);

  const handleVoteClick = (direction: 'up' | 'down') => {
    onVote(comment.id, direction);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddReply(comment.id, replyText);
    setReplyText('');
    setShowReplyForm(false);
  };

  const handleLineMouseEnter = () => setHoveredLine(true);
  const handleLineMouseLeave = () => setHoveredLine(false);

  // Format date like Reddit: "2h ago" or "3d ago"
  const timeFormatted = (() => {
    try {
      return formatDistanceToNow(parseISO(comment.createdAt)) + ' ago';
    } catch {
      return 'just now';
    }
  })();

  const usernameHandle = `u/${comment.userName.toLowerCase().replace(/\s+/g, '_')}`;

  return (
    <div className="flex flex-col relative select-none animate-fade-in mt-3.5">
      {/* Visual Thread Guide connector - recursive indentation offset */}
      {depth > 0 && (
        <div 
          onMouseEnter={handleLineMouseEnter}
          onMouseLeave={handleLineMouseLeave}
          className={`absolute top-0 bottom-0 w-[2.5px] transition-colors duration-300 cursor-pointer ${
            hoveredLine 
              ? 'bg-indigo-500 dark:bg-indigo-400' 
              : 'bg-gray-150 dark:bg-gray-800'
          }`}
          style={{ left: `-${22}px` }}
          title="Highlight sub-thread"
        />
      )}

      {/* Main Reply Box */}
      <div 
        className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-300 ${
          hoveredLine 
            ? 'bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-500/20 dark:border-indigo-500/10' 
            : 'bg-white/40 dark:bg-obsidian-950/20 border-gray-100 dark:border-gray-850 hover:border-gray-200 dark:hover:border-gray-800'
        }`}
      >
        {/* Left Side: Vote Rail */}
        <div className="flex flex-col items-center gap-1.5 shrink-0 bg-gray-50/50 dark:bg-black/10 px-1 py-2 rounded-xl border border-gray-100/50 dark:border-gray-800/30">
          <button 
            onClick={() => handleVoteClick('up')}
            className={`transition-all duration-150 active:scale-125 cursor-pointer ${
              comment.userVote === 'up' 
                ? 'text-[#ff4500]' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <ArrowBigUp size={16} fill={comment.userVote === 'up' ? 'currentColor' : 'none'} />
          </button>
          
          <span className={`text-[10px] font-black leading-none ${
            comment.userVote === 'up' 
              ? 'text-[#ff4500]' 
              : comment.userVote === 'down' 
                ? 'text-[#7193ff]' 
                : 'text-gray-500 dark:text-gray-400'
          }`}>
            {comment.score}
          </span>
          
          <button 
            onClick={() => handleVoteClick('down')}
            className={`transition-all duration-150 active:scale-125 cursor-pointer ${
              comment.userVote === 'down' 
                ? 'text-[#7193ff]' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            <ArrowBigDown size={16} fill={comment.userVote === 'down' ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Right Side: Header & Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] mb-1.5 leading-none">
            <span className="font-extrabold text-gray-800 dark:text-gray-200 hover:underline cursor-pointer">
              {usernameHandle}
            </span>
            {comment.userRole && (
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                comment.userRole === 'admin' 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-650 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30' 
                  : 'bg-gray-150 dark:bg-gray-850 text-gray-500 dark:text-gray-400'
              }`}>
                {comment.userRole}
              </span>
            )}
            <span className="text-gray-400 dark:text-gray-500 font-bold">•</span>
            <span className="text-gray-400 dark:text-gray-500 font-bold">{timeFormatted}</span>
          </div>

          {/* Content */}
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
            {comment.content}
          </p>

          {/* Action Footer */}
          <div className="flex items-center gap-3.5 mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-850 text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
            <button 
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors cursor-pointer"
            >
              <MessageSquare size={12} />
              <span>Reply</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-amber-500 transition-colors cursor-pointer hidden sm:flex">
              <Award size={12} />
              <span>Award</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-teal-500 transition-colors cursor-pointer hidden sm:flex">
              <Share2 size={12} />
              <span>Share</span>
            </button>
          </div>

          {/* Inline Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} className="mt-3.5 animate-slide-in-right">
              <div className="flex items-start gap-2 bg-gray-50/50 dark:bg-black/20 p-2 border border-gray-100 dark:border-gray-850 rounded-xl">
                <CornerDownRight size={14} className="text-gray-400 mt-2 shrink-0" />
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${usernameHandle}...`}
                  rows={2}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700 rounded-lg p-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none min-h-[50px] transition-all"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-2.5 py-1.5 rounded-lg text-[9px] font-black text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850 uppercase tracking-widest cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  Submit
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Recursive Render of Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-6 border-l border-transparent space-y-3">
          {comment.replies.map((reply) => (
            <ThreadedComment
              key={reply.id}
              comment={reply}
              onAddReply={onAddReply}
              onVote={onVote}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
