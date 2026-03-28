const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const logger = require('./config/logger');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { metricsMiddleware, metricsEndpoint } = require('./utils/metrics');
const setupSocket = require('./services/socketService');

// Routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const storyRoutes = require('./routes/stories');
const messageRoutes = require('./routes/messages');
const profileRoutes = require('./routes/profile');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Ensure directories exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(metricsMiddleware);
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.' },
});
app.use('/api/', limiter);

// Static uploads
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Metrics endpoint
app.get('/metrics', metricsEndpoint);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/profile', profileRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// Error handler
app.use(errorHandler);

// Socket.IO setup
setupSocket(io);

// Start server
const start = async () => {
  await connectDB();
  server.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  });
};

start();

module.exports = { app, server };
