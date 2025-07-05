import cors, { CorsOptions } from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { connectDB } from './config/database';
import logger from './config/logger';
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler.middleware';
import { notFoundHandler } from './middleware/notFoundHandler.middleware';
import OAuth from './routes/auth.routes/index';
import userAuthRoutes from './routes/index';

dotenv.config();
connectDB();

const app = express();
const port = process.env.PORT || 8000;

const allowedOrigins = ['https://flexi-web-sigma.vercel.app', 'http://localhost:3000', 'http://localhost:5173'];

const corsOptions: CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());


// Log incoming requests
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// API routes
app.use('/api', userAuthRoutes);
app.use('/auth', OAuth);


// Protected route
app.get('/protected', authenticate, (req, res) => {
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
app.use(notFoundHandler);

// // Start the server
app.listen(port, () => {
  const host = 'http://localhost';
  logger.info(`Server is running on ${host}:${port}`);
});

app.get('/', (req, res) => {
  res.send('Welcome to Flexi Backend!');
});

// initializeDatabase();

export default app;