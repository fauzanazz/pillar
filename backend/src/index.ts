import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { serve } from 'bun';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { RequestIdVariables, requestId } from 'hono/request-id';

import { env } from '@/configs';
import { rabbitmqConfig } from '@/configs';
import { rabbitMQService } from '@/lib/rabbitmq';

import { apiRouter } from './controllers/api.controller';
import { auth } from './lib';

const app = new OpenAPIHono<{
  Variables: RequestIdVariables;
}>({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json({ errors: result.error.flatten() }, 400);
    }
  },
});

// Setup App
app.use(requestId());
app.use(logger());

// Middleware for CORS
app.use(
  '/api/*',
  cors({
    credentials: true,
    origin: env.ALLOWED_ORIGINS,
  }),
);

// Routing
app.route('/api', apiRouter);
app.get('/', (c) => c.json({ message: 'Server runs successfully' }));

// Documentation
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    version: '1.0.0',
    title: 'MODYV API',
  },
  tags: [
    { name: 'health', description: 'Health Check API' },
    { name: 'contracts', description: 'Contract Management APIs' },
  ],
});
app.get(
  '/docs',
  apiReference({
    theme: 'purple',
    spec: {
      url: '/openapi.json',
    },
  }),
);

// Auth Mount
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));
app.use(
  '/api/auth/*',
  cors({
    origin: env.ALLOWED_ORIGINS,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
);

// Initialize RabbitMQ
const initializeRabbitMQ = async () => {
  try {
    console.log('Initializing RabbitMQ...');
    await rabbitmqConfig.connect();
    await rabbitMQService.initialize();
    console.log('RabbitMQ initialized successfully');
  } catch (error) {
    console.error('Failed to initialize RabbitMQ:', error);
    // Don't exit the process, just log the error
    // The application can still run without RabbitMQ for basic functionality
  }
};

// Start server
const startServer = async () => {
  // Initialize RabbitMQ in the background
  initializeRabbitMQ();

  console.log(`Server is running on port ${env.PORT}`);

  serve({
    fetch: app.fetch,
    port: env.PORT || 5001,
  });
};

startServer();
