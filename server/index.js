import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import worldRoutes from './routes/worlds.js';
import characterRoutes from './routes/characters.js';
import sessionRoutes from './routes/sessions.js';
import llmRoutes from './routes/llm.js';
import { initDatabase } from './db/init.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
  logger: true
});

// Config - loaded from environment or config file
const config = {
  port: process.env.PORT || 3001,
  host: process.env.HOST || '0.0.0.0',
  llmBaseUrl: process.env.LLM_BASE_URL || 'http://127.0.0.1:8080/v1',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173'
};

async function start() {
  try {
    // Initialize database
    await initDatabase();

    // Register plugins
    await fastify.register(cors, {
      origin: config.corsOrigin
    });

    await fastify.register(websocket);

    // Serve static files (for production)
    await fastify.register(fastifyStatic, {
      root: join(__dirname, '../client/dist'),
      prefix: '/'
    });

    // Register routes
    await fastify.register(worldRoutes, { prefix: '/api/worlds' });
    await fastify.register(characterRoutes, { prefix: '/api/characters' });
    await fastify.register(sessionRoutes, { prefix: '/api/sessions' });
    await fastify.register(llmRoutes, { prefix: '/api/llm' });

    // Health check
    fastify.get('/api/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Start server
    await fastify.listen({ port: config.port, host: config.host });
    console.log(`🎲 HumbBot RPG server running on http://${config.host}:${config.port}`);

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
