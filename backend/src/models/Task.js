const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title must be at most 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description must be at most 500 characters'],
    default: '',
  },
  dueDate: {
    type: Date,
    default: null,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending',
  },
  completedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Compound index for user + creation date (efficient queries)
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, priority: 1 });

// Auto-set completedAt when status changes to Completed
taskSchema.pre('save', function () {
  if (this.isModified('status')) {
    this.completedAt = this.status === 'Completed' ? new Date() : null;
  }
});

taskSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();
  if (update.status === 'Completed') {
    update.completedAt = new Date();
  } else if (update.status === 'Pending') {
    update.completedAt = null;
  }
});

module.exports = mongoose.model('Task', taskSchema);
