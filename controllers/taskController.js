const Task = require('../models/Task');
const cacheService = require('../services/cacheService');

// Get all tasks with caching
exports.getTasks = async (req, res, next) => {
  const start = process.hrtime.bigint();
  try {
    const userId = req.user.id;
    const cacheKey = `tasks_user_${userId}`;
    const bypassCache = req.query.noCache === 'true';

    // 1. Cache Check (if not bypassed)
    if (!bypassCache) {
      const cached = cacheService.get(cacheKey);
      if (cached.found) {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1e6;

        res.set('X-Cache', 'HIT');
        res.set('X-Response-Time-Ms', durationMs.toFixed(2));
        return res.status(200).json({
          success: true,
          source: 'CACHE_HIT',
          cacheKey,
          responseTimeMs: Number(durationMs.toFixed(2)),
          count: cached.data.length,
          tasks: cached.data
        });
      }
    }

    // 2. Cache MISS: Query MongoDB
    const tasks = await Task.find({ user: userId }).sort({ createdAt: -1 });

    // Store in cache for 60 seconds
    if (!bypassCache) {
      cacheService.set(cacheKey, tasks);
    }

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    res.set('X-Cache', bypassCache ? 'BYPASS' : 'MISS');
    res.set('X-Response-Time-Ms', durationMs.toFixed(2));
    return res.status(200).json({
      success: true,
      source: bypassCache ? 'CACHE_BYPASS' : 'CACHE_MISS',
      cacheKey,
      responseTimeMs: Number(durationMs.toFixed(2)),
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

// Supplementary Problem: Cache single task separately (GET /tasks/:id)
exports.getTaskById = async (req, res, next) => {
  const start = process.hrtime.bigint();
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const cacheKey = `task_${userId}_${taskId}`;

    const cached = cacheService.get(cacheKey);
    if (cached.found) {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;

      res.set('X-Cache', 'HIT');
      res.set('X-Response-Time-Ms', durationMs.toFixed(2));
      return res.status(200).json({
        success: true,
        source: 'CACHE_HIT',
        cacheKey,
        responseTimeMs: Number(durationMs.toFixed(2)),
        task: cached.data
      });
    }

    const task = await Task.findOne({ _id: taskId, user: userId });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    cacheService.set(cacheKey, task);

    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    res.set('X-Cache', 'MISS');
    res.set('X-Response-Time-Ms', durationMs.toFixed(2));
    return res.status(200).json({
      success: true,
      source: 'CACHE_MISS',
      cacheKey,
      responseTimeMs: Number(durationMs.toFixed(2)),
      task
    });
  } catch (error) {
    next(error);
  }
};

// Create task & Invalidate Cache
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, priority, status } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      priority: priority || 'medium',
      status: status || 'pending',
      user: req.user.id
    });

    // Invalidate user cache keys so stale data is never served
    const invalidatedKeys = cacheService.invalidateUserTasks(req.user.id);

    res.set('X-Cache', 'INVALIDATED');
    return res.status(201).json({
      success: true,
      message: 'Task created and cache invalidated.',
      invalidatedKeys,
      task
    });
  } catch (error) {
    next(error);
  }
};

// Update task & Invalidate Cache
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status } = req.body;

    const task = await Task.findOne({ _id: id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;

    await task.save();

    // Invalidate user cache keys
    const invalidatedKeys = cacheService.invalidateUserTasks(req.user.id);

    res.set('X-Cache', 'INVALIDATED');
    return res.status(200).json({
      success: true,
      message: 'Task updated and cache invalidated.',
      invalidatedKeys,
      task
    });
  } catch (error) {
    next(error);
  }
};

// Delete task & Invalidate Cache
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({ _id: id, user: req.user.id });
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Invalidate user cache keys
    const invalidatedKeys = cacheService.invalidateUserTasks(req.user.id);

    res.set('X-Cache', 'INVALIDATED');
    return res.status(200).json({
      success: true,
      message: 'Task deleted and cache invalidated.',
      invalidatedKeys
    });
  } catch (error) {
    next(error);
  }
};

// Supplementary Problem: Debug cache statistics endpoint
exports.getCacheStats = (req, res) => {
  const stats = cacheService.getStats();
  return res.status(200).json({
    success: true,
    student: {
      name: 'Daksh Karangiya',
      rollNumber: '24CS038',
      practical: 'Practical - 9'
    },
    cacheStats: stats
  });
};

// Flush all cache keys
exports.flushCache = (req, res) => {
  cacheService.flush();
  return res.status(200).json({
    success: true,
    message: 'In-memory cache completely flushed.'
  });
};
