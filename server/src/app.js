import express from 'express';
import cors from 'cors';
import { createAuthRouter } from './routes/authRoutes.js';
import { createTaskRouter } from './routes/taskRoutes.js';
import { authMiddleware } from './middleware/auth.js';

export function createApp({ store, jwtSecret, clientOrigin = 'http://localhost:5173' }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: clientOrigin }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', createAuthRouter({ store, jwtSecret }));
  app.use('/api/tasks', authMiddleware(jwtSecret), createTaskRouter({ store }));

  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

  app.use((error, _req, res, _next) => {
    const status = Number.isInteger(error.status) ? error.status : 500;
    const message = status >= 500 ? 'Internal server error' : error.message;
    res.status(status).json({ error: message });
  });

  return app;
}
