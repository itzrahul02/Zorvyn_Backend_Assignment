import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import meRoutes from './routes/me.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import userRoutes from './routes/user.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Log environment on startup to aid debugging in dev environments
  console.log('Starting Zorvyn API; NODE_ENV=', process.env.NODE_ENV || 'development');

  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN || true,
      credentials: true,
    })
  );
  app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'zorvyn-api' });
  });

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/roles', rolesRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
