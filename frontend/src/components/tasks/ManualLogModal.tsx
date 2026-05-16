import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Clock, Calendar, AlignLeft } from 'lucide-react';
import { api } from '../../utils/api';

interface ManualLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  projectId: string;
  onSuccess: () => void;
}

export const ManualLogModal: React.FC<ManualLogModalProps> = ({ isOpen, onClose, taskId, projectId, onSuccess }) => {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) return;

    setLoading(true);
    try {
      await api.post('/time-logs/manual', {
        taskId,
        projectId,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        description,
        isBillable
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding manual log:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Manual Work Log" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5">
            <Calendar size={12} />
            Start Time
          </label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5">
            <Clock size={12} />
            End Time
          </label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1.5">
            <AlignLeft size={12} />
            Work Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on?"
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all min-h-[80px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="billable" 
            checked={isBillable} 
            onChange={(e) => setIsBillable(e.target.checked)}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="billable" className="text-xs font-bold text-gray-600 dark:text-gray-400">
            This work is billable
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" className="flex-1" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Log'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
