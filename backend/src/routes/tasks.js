const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All task routes require authentication
router.use(authMiddleware);

const createValidation = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
  body('status').optional().isIn(['Pending', 'Completed']).withMessage('Invalid status'),
  body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid date format'),
];

const updateValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority'),
  body('status').optional().isIn(['Pending', 'Completed']).withMessage('Invalid status'),
  body('dueDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid date format'),
];

// GET /api/tasks — get all tasks with optional filters
router.get('/', async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const filter = { userId: req.user._id };

    if (status && ['Pending', 'Completed'].includes(status)) filter.status = status;
    if (priority && ['Low', 'Medium', 'High'].includes(priority)) filter.priority = priority;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ tasks, count: tasks.length });
  } catch (err) {
    console.error('Fetch tasks error:', err);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
});

// POST /api/tasks — create task
router.post('/', createValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, dueDate, priority, status } = req.body;
    const task = await Task.create({
      userId: req.user._id,
      title,
      description: description || '',
      dueDate: dueDate || null,
      priority: priority || 'Medium',
      status: status || 'Pending',
    });

    res.status(201).json({ message: 'Task created', task });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ message: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id — update task
router.put('/:id', updateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, description, dueDate, priority, status } = req.body;
    const updateData = {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(dueDate !== undefined && { dueDate: dueDate || null }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && {
        status,
        completedAt: status === 'Completed' ? new Date() : null,
      }),
    };

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      updateData,
      { returnDocument: 'after', runValidators: true }
    );

    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task updated', task });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id — delete task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

// GET /api/tasks/analytics — aggregated stats
router.get('/analytics', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Last 7 days daily stats
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyStats = await Task.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Last 4 weeks
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(now.getDate() - 27);

    const weeklyStats = await Task.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: fourWeeksAgo },
        },
      },
      {
        $group: {
          _id: { $isoWeek: '$createdAt' },
          year: { $first: { $isoWeekYear: '$createdAt' } },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
        },
      },
      { $sort: { year: 1, _id: 1 } },
    ]);

    // Last 6 months
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyStats = await Task.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' },
          },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Priority breakdown
    const priorityStats = await Task.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    // Status summary
    const statusStats = await Task.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalTasks = await Task.countDocuments({ userId });
    const completedTasks = await Task.countDocuments({ userId, status: 'Completed' });
    const overdueTasks = await Task.countDocuments({
      userId,
      status: 'Pending',
      dueDate: { $lt: now, $ne: null },
    });

    res.json({
      summary: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      dailyStats,
      weeklyStats,
      monthlyStats,
      priorityStats,
      statusStats,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

module.exports = router;
