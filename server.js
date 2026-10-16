require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 5003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task_manager_p9';

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health & Status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Practical 9: Server-Side Caching & Response Time Measurement Server Active',
    student: {
      name: 'Daksh Karangiya',
      rollNumber: '24CS038',
      subject: 'ITUE301: Advance Web Development Framework',
      practical: 'Practical - 9'
    },
    databaseStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    cacheEngine: 'node-cache (In-Memory)',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start MongoDB and Server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('----------------------------------------------------');
    console.log('MongoDB Connected Successfully to:', MONGO_URI);
    console.log('Practical 9: Server-Side Caching (node-cache)');
    console.log('Student: Daksh Karangiya | Roll: 24CS038');
    console.log('----------------------------------------------------');
    app.listen(PORT, () => {
      console.log(`Server is running at: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
