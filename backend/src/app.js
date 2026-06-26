const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandlers');
const registerRoutes = require('./config/appRoutes');

require('dotenv').config();

const app = express();


// Security
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);

// Request parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
app.use(morgan('dev'));

// Rate limiting
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 200),
  })
);

// Connect DB
connectDB();

// API Routes
registerRoutes(app);


// Health check
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'API is running',
    data: null,
    statusCode: 200,
  });
});

// 404 + Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

