import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from './config/database';
import logger from './config/logger';
import { authenticateToken } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler.middleware';
import { notFoundHandler } from './middleware/notFoundHandler.middleware';
import userAuthRoutes from './routes/user.routes';

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 8000;

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Allow cookies and headers
};
app.use(cors(corsOptions));
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// API routes
app.use('/api/auth/user', userAuthRoutes);

// Protected route
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route' });
});

// Health check route
app.get('/health', async (req, res) => {
  try {
    await connectDB();
    res.status(200).json({
      status: 'success',
      message: 'Server is healthy',
      uptime: process.uptime(),
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server is not healthy',
    });
  }
});

// Error-handling middleware
app.use(errorHandler);

// Route not found middleware (MUST be at the END)
app.use(notFoundHandler);

// Start the server
app.listen(port, () => {
  const host = 'http://localhost';
  logger.info(`Server is running on ${host}:${port}`);
});
