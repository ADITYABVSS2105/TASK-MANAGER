import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import VoiceInput from './VoiceInput';

const TaskModal = ({ isOpen, onClose, onSave, initialTask = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'Medium',
    status: 'Pending',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialTask) {
      // dueDate from MongoDB is a full ISO string like "2024-12-31T12:00:00.000Z"
      // We convert to local datetime-local format "YYYY-MM-DDTHH:mm"
      let dueDateLocal = '';
      if (initialTask.dueDate) {
        const d = new Date(initialTask.dueDate);
        const offset = d.getTimezoneOffset() * 60000;
        dueDateLocal = new Date(d - offset).toISOString().substring(0, 16);
      }
      setFormData({
        title: initialTask.title,
        description: initialTask.description || '',
        dueDate: dueDateLocal,
        priority: initialTask.priority,
        status: initialTask.status,
      });
    } else {
      setFormData({ title: '', description: '', dueDate: '', priority: 'Medium', status: 'Pending' });
    }
    setSaving(false);
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch {
      // Error toasted by useTasks hook
    } finally {
      setSaving(false);
    }
  };

  const handleVoiceParsed = (parsed) => {
    setFormData(prev => ({ ...prev, ...parsed }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {initialTask ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {!initialTask && (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Try adding via voice:</p>
            <VoiceInput onParsed={handleVoiceParsed} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="E.g., Team meeting"
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input-field min-h-[80px]"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Due Date</label>
              <input
                type="datetime-local"
                className="input-field"
                value={formData.dueDate}
                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input-field"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {initialTask && (
            <div>
              <label className="label">Status</label>
              <select
                className="input-field"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} disabled={saving} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving...' : initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
