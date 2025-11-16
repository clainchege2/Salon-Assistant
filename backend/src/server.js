require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const { securityHeaders, apiLimiter, sanitizeInput } = require('./middleware/security');

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Input sanitization
app.use(sanitizeInput);

// Rate limiting
app.use('/api/', apiLimiter);

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/bookings', require('./routes/bookings'));
app.use('/api/v1/clients', require('./routes/clients'));
app.use('/api/v1/services', require('./routes/services'));
app.use('/api/v1/communications', require('./routes/communications'));
app.use('/api/v1/marketing', require('./routes/marketing'));
app.use('/api/v1/materials', require('./routes/materials'));
app.use('/api/v1/barcodes', require('./routes/barcodes'));
app.use('/api/v1/messages', require('./routes/messages'));
app.use('/api/v1/tenants', require('./routes/tenants'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/analytics', require('./routes/analytics'));

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HairVia API Server',
    version: 'v1',
    endpoints: {
      auth: '/api/v1/auth',
      bookings: '/api/v1/bookings',
      clients: '/api/v1/clients',
      services: '/api/v1/services',
      communications: '/api/v1/communications',
      marketing: '/api/v1/marketing',
      materials: '/api/v1/materials',
      barcodes: '/api/v1/barcodes',
      messages: '/api/v1/messages',
      tenants: '/api/v1/tenants',
      admin: '/api/v1/admin'
    },
    health: '/health',
    timestamp: new Date()
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = app;
