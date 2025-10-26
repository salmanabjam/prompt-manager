import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import prisma from './lib/prisma';
import { initializeUploadDirs } from './lib/fileStorage';
import promptRoutes from './api/routes/prompts';
import tagRoutes from './api/routes/tags';
import versionRoutes from './api/routes/versions';
import executionRoutes from './api/routes/executions';
import searchRoutes from './api/routes/search';
import settingsRoutes from './api/routes/settings';
import { imageRoutes } from './api/routes/images';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3456;

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// CORS for Tauri frontend
fastify.register(cors, {
  origin: ['tauri://localhost', 'http://localhost:1420', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Rate limiting
fastify.register(rateLimit, {
  max: 500,
  timeWindow: '1 minute',
});

// Multipart support for file uploads
fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Serve static files from uploads directory
fastify.register(fastifyStatic, {
  root: path.join(process.cwd(), 'uploads'),
  prefix: '/uploads/',
  decorateReply: false,
});

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
fastify.register(promptRoutes, { prefix: '/api/prompts' });
fastify.register(tagRoutes, { prefix: '/api/tags' });
fastify.register(versionRoutes, { prefix: '/api/versions' });
fastify.register(executionRoutes, { prefix: '/api/executions' });
fastify.register(searchRoutes, { prefix: '/api/search' });
fastify.register(settingsRoutes, { prefix: '/api/settings' });
fastify.register(imageRoutes, { prefix: '/api' });

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  await fastify.close();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start server
const start = async () => {
  try {
    // Initialize upload directories
    await initializeUploadDirs();
    
    await fastify.listen({ port: PORT, host: '127.0.0.1' });
    console.log(`🚀 Server listening on http://127.0.0.1:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export default fastify;
