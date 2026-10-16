const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');

// Public cache diagnostic & stats endpoints
router.get('/cache/stats', taskController.getCacheStats);
router.post('/cache/flush', taskController.flushCache);

// Protected Task Routes
router.use(authMiddleware);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
