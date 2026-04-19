import React from 'react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { Calendar, Clock, Edit2, Trash2, CheckCircle, Circle, AlertTriangle } from 'lucide-react';

const priorityConfig = {
  High:   { badge: 'badge-high',   dot: 'bg-red-500',    bar: 'bg-red-500' },
  Medium: { badge: 'badge-medium', dot: 'bg-amber-500',  bar: 'bg-amber-500' },
  Low:    { badge: 'badge-low',    dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
};

const formatDueDate = (dueDate) => {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  if (isToday(date)) return `Today at ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow at ${format(date, 'h:mm a')}`;
  return format(date, 'MMM d, yyyy · h:mm a');
};

const TaskCard = ({ task, onEdit, onDelete, onToggle }) => {
  const p = priorityConfig[task.priority] || priorityConfig.Medium;
  const dueStr = formatDueDate(task.dueDate);
  const isCompleted = task.status === 'Completed';
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && !isCompleted;

  return (
    <div
      className={`card p-4 hover:shadow-md transition-all duration-200 animate-fade-in group
        ${isCompleted ? 'opacity-75' : ''}
        ${isOverdue ? 'border-red-300 dark:border-red-800' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task)}
          className={`mt-0.5 flex-shrink-0 transition-all duration-200 hover:scale-110
            ${isCompleted ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600 hover:text-primary-500'}`}
          title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
        >
          {isCompleted
            ? <CheckCircle size={20} className="fill-emerald-500 text-white" />
            : <Circle size={20} />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className={`font-semibold text-sm leading-snug truncate
              ${isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}
            >
              {task.title}
            </h3>
            <span className={p.badge}>{task.priority}</span>
            <span className={`badge ${isCompleted ? 'badge-completed' : 'badge-pending'}`}>
              {task.status}
            </span>
          </div>

          {task.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          {dueStr && (
            <div className={`flex items-center gap-1 text-xs font-medium
              ${isOverdue
                ? 'text-red-500 dark:text-red-400'
                : 'text-slate-500 dark:text-slate-400'}`}
            >
              {isOverdue
                ? <AlertTriangle size={12} className="flex-shrink-0" />
                : <Calendar size={12} className="flex-shrink-0" />
              }
              <span>{isOverdue ? `Overdue · ${dueStr}` : dueStr}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all"
            title="Edit task"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
            title="Delete task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Priority bar */}
      <div className="mt-3 h-0.5 rounded-full bg-slate-100 dark:bg-slate-700">
        <div className={`h-full rounded-full ${p.bar}`}
          style={{ width: task.priority === 'High' ? '100%' : task.priority === 'Medium' ? '60%' : '30%' }}
        />
      </div>
    </div>
  );
};

export default TaskCard;
