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
import settingsRoutes from './routes/settings.routes.js';
import devRoutes from './routes/dev.routes.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
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

  // Development helper: log incoming Authorization header for debugging Swagger UI auth
  if ((process.env.NODE_ENV || 'development') === 'development') {
    app.use((req, res, next) => {
      try {
        const auth = req.headers.authorization || req.headers.Authorization || null;
        if (auth) console.log('[DEV] Authorization header:', auth);
        else console.log('[DEV] Authorization header: <missing> ', req.method, req.path);
      } catch (e) {
        // ignore logging errors
      }
      next();
    });
  }

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'zorvyn-api' });
  });

  // Root page for humans/browsers: show backend running message
  app.get('/', (req, res) => {
    res.send(
      `
      <html>
        <head><title>Zorvyn API</title></head>
        <body style="font-family:system-ui,Segoe UI,Roboto,'Helvetica Neue',Arial">
          <h1>Backend is running</h1>
          <p>Service: zorvyn-api</p>
          <p>Interactive docs: <a href="/docs">/docs</a></p>
        </body>
      </html>
      `
    );
  });

  // avoid 404 noise for favicon requests
  app.get('/favicon.ico', (req, res) => res.status(204).end());

  // Swagger/OpenAPI setup (generated from JSDoc in routes)
  const swaggerOptions = {
    definition: {
      openapi: '3.0.3',
      info: { title: 'Zorvyn API', version: '1.0.0' },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: {
          User: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string', format: 'email' },
              name: { type: 'string' },
              role: { type: 'string' },
              status: { type: 'string' },
            },
            example: {
              id: '605c9b8f1c4ae23f8c1a7b2d',
              email: 'admin@example.com',
              name: 'Admin',
              role: 'admin',
              status: 'active',
            },
          },
          AuthResponse: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              user: { $ref: '#/components/schemas/User' },
            },
            example: {
              token: 'eyJ...exampletoken',
              user: { $ref: '#/components/schemas/User' },
            },
          },
          Transaction: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              amount: { type: 'number' },
              type: { type: 'string' },
              category: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              notes: { type: 'string' },
            },
            example: {
              id: '607d1a3e8f1b2c0012345678',
              amount: 120.5,
              type: 'expense',
              category: 'food',
              date: new Date().toISOString(),
              notes: 'Lunch with client',
            },
          },
          TransactionList: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: '#/components/schemas/Transaction' } },
              page: { type: 'integer' },
              totalPages: { type: 'integer' },
            },
          },
          RolesResponse: {
            type: 'object',
            properties: {
              roles: {
                type: 'array',
                items: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' } } },
              },
            },
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    apis: ['./src/routes/*.js'],
  };
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  // small script to inject dev tokens into Swagger UI and add quick-authorize UI
  app.get('/docs-inject.js', (req, res) => {
    res.type('application/javascript');
    res.send(`(function(){
  // only run in browsers
  if (typeof window === 'undefined') return;

  function createUI(tokens){
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.right = '12px';
    container.style.bottom = '12px';
    container.style.zIndex = 99999;
    container.style.background = 'rgba(255,255,255,0.95)';
    container.style.border = '1px solid #ddd';
    container.style.padding = '8px';
    container.style.borderRadius = '6px';
    container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)';

    const select = document.createElement('select');
    for (const k of Object.keys(tokens)){
      const opt = document.createElement('option');
      opt.value = k; opt.text = k;
      select.appendChild(opt);
    }

    const authBtn = document.createElement('button');
    authBtn.textContent = 'Authorize';
    authBtn.style.marginLeft = '8px';

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    clearBtn.style.marginLeft = '6px';

    container.appendChild(select);
    container.appendChild(authBtn);
    container.appendChild(clearBtn);
    document.body.appendChild(container);

    authBtn.addEventListener('click', function(){
      const role = select.value;
      const token = tokens[role];
      if (!token) return alert('No token for ' + role);
      try {
        const toObj = {};
        // prefer raw token (no Bearer prefix) — swagger-ui may add the scheme
        toObj['bearerAuth'] = { value: token };

        // try common authorize patterns for different swagger-ui versions
        if (window.ui && window.ui.authActions && typeof window.ui.authActions.authorize === 'function'){
          // try object form
          window.ui.authActions.authorize(toObj);
          // fallback: try simple token
          try { window.ui.authActions.authorize({ bearerAuth: token }); } catch (e) {}
          alert('Authorized as ' + role);
        } else if (window.ui && window.ui.auth && typeof window.ui.auth === 'function'){
          try { window.ui.auth(toObj); } catch (e) { window.ui.auth(token); }
          alert('Authorized as ' + role);
        } else {
          alert('Swagger UI not ready yet. Try again in a second.');
        }
      } catch (e){
        console.error(e);
        alert('Authorize failed: ' + e.message);
      }
    });

    clearBtn.addEventListener('click', function(){
      if (window.ui && window.ui.authActions && typeof window.ui.authActions.logout === 'function'){
        window.ui.authActions.logout();
        alert('Cleared authorization');
      } else {
        alert('Could not clear authorization');
      }
    });
  }

  // fetch dev tokens endpoint and build UI
  fetch('/dev/tokens').then(r=>r.json()).then(data=>{
    if (Object.keys(data).length) createUI(data);
  }).catch(()=>{});
})();`);
  });
  // expose raw spec for easier verification / client generation
  app.get('/docs.json', (req, res) => res.json(swaggerSpec));
  app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      swaggerOptions: {
        persistAuthorization: true,
      },
      customJs: '/docs-inject.js',
    })
  );

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/me', meRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/roles', rolesRoutes);
  app.use(settingsRoutes);
  // mount dev-only helpers only in development
  if ((process.env.NODE_ENV || 'development') === 'development') {
    app.use(devRoutes);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
