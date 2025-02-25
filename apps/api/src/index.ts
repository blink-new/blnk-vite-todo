import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import * as functions from 'firebase-functions';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { config } from 'dotenv';

// Load environment variables
config();

// Create the main Hono app
const app = new Hono();

// Setup CORS middleware
app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  exposeHeaders: ['Content-Length', 'X-Request-Id'],
  credentials: true
}));

app.use('*', logger());
app.use('*', prettyJSON());

// Base routes
app.get('/', (c) => c.json({
  message: 'Welcome to the Hono API',
  version: '1.0.0'
}));

// API routes
const apiRouter = new Hono();

// Health check
apiRouter.get('/health', (c) => c.json({
  status: 'ok',
  timestamp: new Date().toISOString(),
  env: {
    nodeEnv: process.env.NODE_ENV,
    host: process.env.HOST,
    port: process.env.PORT
  }
}));

// Example data endpoint
apiRouter.get('/data', (c) => c.json({
  items: [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
    { id: 3, name: 'Item 3', value: 300 }
  ]
}));

// Mount feature routes
// We'll dynamically import route handlers to handle async Firebase initialization
const setupRoutes = async () => {
  const [
    { default: authRoutes },
    { default: itemsRoutes },
    { default: storageRoutes }
  ] = await Promise.all([
    import('./routes/auth'),
    import('./routes/items'),
    import('./routes/storage')
  ]);

  apiRouter.route('/auth', authRoutes);
  apiRouter.route('/items', itemsRoutes);
  apiRouter.route('/storage', storageRoutes);
};

// Mount all routes under /api
app.route('/api', apiRouter);

// For local development
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';
  
  // Initialize routes before starting server
  setupRoutes().then(() => {
    serve({
      fetch: app.fetch.bind(app),
      port: Number(port),
      hostname: host
    }, (info) => {
      console.log(`API running at http://${host}:${port}`);
      console.log('Environment:', {
        NODE_ENV: process.env.NODE_ENV,
        HOST: process.env.HOST,
        PORT: process.env.PORT,
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS
      });
    });
  }).catch(error => {
    console.error('Failed to start API server:', error);
    process.exit(1);
  });
}

// For Firebase Cloud Functions
export const api = functions.https.onRequest(async (req, res) => {
  // Initialize routes before handling request
  await setupRoutes();

  // Convert request to Fetch API Request
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const request = new Request(url.toString(), {
    method: req.method || 'GET',
    headers: req.headers as HeadersInit,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined
  });

  // Process with Hono
  try {
    const honoRes = await app.fetch(request);
    res.status(honoRes.status);
    honoRes.headers.forEach((value, key) => res.set(key, value));
    const body = await honoRes.text();
    res.send(body);
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});