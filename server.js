import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path'; // path is already imported at the top

import bookRoutes from './routes/bookRoutes.js';
import prisma from './lib/prisma.js'; // Assuming you have a standard prisma client setup
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import contentRoutes from './routes/content.routes.js';
import audioRoutes from './routes/audioRoutes.js';
import adminRoutes from './routes/admin.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Add timeout configurations
app.use(express.urlencoded({ extended: true }));

// Set server timeout for long-running requests (like audio uploads)
app.use((req, res, next) => {
  // Set timeout for all requests to 5 minutes
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000); // 5 minutes
  next();
});

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Range'
  ],
  exposedHeaders: [
    'Content-Range',
    'Accept-Ranges',
    'Content-Length',
    'Content-Type'
  ]
};

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(morgan('combined'));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Handle preflight requests

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL database');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

connectDatabase();

// --- START: Static File Serving ---

// IMPORTANT: We REMOVE the general 'app.use('/uploads', ...)' block.
// Book images/files are now served from Cloudinary.

// Additional static route for audio files (Kept if needed for local audio streaming)
app.use("/uploads/audio", (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range, Content-Range, Accept-Ranges');
  res.header('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
  next();
}, express.static(path.join(__dirname, "uploads", "audio"), {
  setHeaders: (res, path) => {
    if (path.endsWith('.mp3') || path.endsWith('.wav') || path.endsWith('.ogg') || path.endsWith('.m4a')) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Type', 'audio/mpeg');
    }
  }
}));

// --- END: Static File Serving ---

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Talenta API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR HANDLER:', err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Talenta Backend Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown (Standard)
// ...