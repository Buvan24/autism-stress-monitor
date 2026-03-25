const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/captures', express.static(path.join(__dirname, '../captures')));

// Routes
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/students',  require('./routes/studentRoutes'));
app.use('/api/detection', require('./routes/detectionRoutes'));
app.use('/api/stresslogs',require('./routes/stressLogRoutes'));
app.use('/api/alerts',    require('./routes/alertRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running', db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' });
});

// Connect MongoDB Atlas
console.log('🔄 Connecting to MongoDB Atlas...');
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Atlas Connected! Database: autism_stress_db');
    await require('./utils/seedData')();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📊 Dashboard at http://localhost:3000`);
      console.log(`🔑 Login: admin / admin123`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.log('👉 Check your internet connection and MongoDB Atlas URL');
    process.exit(1);
  });
