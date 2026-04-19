import React, { useState, useEffect, useRef } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { Plus, Search, CheckSquare } from 'lucide-react';

const Dashboard = () => {
  const { tasks, loading, fetchTasks, createTask, updateTask, deleteTask, toggleStatus } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '' });

  // Debounce search — use a ref to avoid fetchTasks reference causing infinite loop
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTasks(filtersRef.current);
    }, 300);
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.status, filters.priority]);

  const handleSave = async (taskData) => {
    if (editingTask) {
      await updateTask(editingTask._id, taskData);
    } else {
      await createTask(taskData);
    }
    // Refresh list to stay in sync with backend
    fetchTasks(filtersRef.current);
  };

  const openNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Tasks</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your daily goals and stay organized.</p>
        </div>
        <button onClick={openNewTask} className="btn-primary w-full sm:w-auto">
          <Plus size={18} />
          Add Task
        </button>
      </div>

      <div className="card p-4 mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search tasks..."
            className="input-field pl-10"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="input-field w-auto"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            className="input-field w-auto"
            value={filters.priority}
            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
          >
            <option value="">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {loading && !(tasks?.length) ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : tasks?.length === 0 ? (
        <div className="text-center py-16 card bg-slate-50/50 dark:bg-slate-800/50 border-dashed">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <CheckSquare size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">No tasks found</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {filters.search || filters.status || filters.priority
              ? "Try adjusting your filters or search terms."
              : "You're all caught up! Enjoy your day or add a new task."}
          </p>
          {!(filters.search || filters.status || filters.priority) && (
            <button onClick={openNewTask} className="btn-secondary mt-4">
              Create your first task
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tasks?.map(task => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={openEditTask}
              onDelete={deleteTask}
              onToggle={toggleStatus}
            />
          ))}
        </div>
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialTask={editingTask}
      />
    </div>
  );
};

export default Dashboard;
