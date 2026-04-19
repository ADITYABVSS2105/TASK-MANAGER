import { useState, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export const useTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  const fetchTasks = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status)   params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.search)   params.set('search', filters.search);
      const res = await api.get(`/tasks?${params.toString()}`);
      setTasks(res.data.tasks);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (taskData) => {
    try {
      const res = await api.post('/tasks', taskData);
      setTasks(prev => [res.data.task, ...prev]);
      toast.success('Task created! ✅');
      return res.data.task;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id, taskData) => {
    try {
      const res = await api.put(`/tasks/${id}`, taskData);
      setTasks(prev => prev.map(t => t._id === id ? res.data.task : t));
      toast.success('Task updated! ✏️');
      return res.data.task;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update task');
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      toast.success('Task deleted 🗑️');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task');
      throw err;
    }
  }, []);

  const toggleStatus = useCallback(async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    return updateTask(task._id, {
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: task.priority,
      status: newStatus,
    });
  }, [updateTask]);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/tasks/analytics');
      setAnalytics(res.data);
      return res.data;
    } catch (err) {
      toast.error('Failed to load analytics');
      throw err; // re-throw so callers can .catch()
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tasks,
    loading,
    analytics,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleStatus,
    fetchAnalytics,
  };
};
