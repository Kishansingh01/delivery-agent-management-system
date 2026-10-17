import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import agentRoutes from './routes/agentRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

export const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Cache', 'X-Cache-Key'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Routes
app.use('/health', healthRoutes);
app.use('/api/agents', agentRoutes);

// Catch-all 404 for undefined routes
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
  });
});

// Error handling middleware
app.use(errorHandler);
