/**
 * LLM utility routes
 */

import { checkHealth, generateWorldContent } from '../services/llm.js';
import { queryOne } from '../db/init.js';

export default async function llmRoutes(fastify) {

  // Check LLM health
  fastify.get('/health', async (request, reply) => {
    const health = await checkHealth();
    if (!health.available) {
      return reply.status(503).send(health);
    }
    return health;
  });

  // Generate world content
  fastify.post('/generate/:type', async (request, reply) => {
    const { world_id, prompt } = request.body;
    const { type } = request.params;

    if (!['location', 'npc', 'lore', 'quest'].includes(type)) {
      return reply.status(400).send({ error: 'Invalid content type' });
    }

    if (!world_id || !prompt) {
      return reply.status(400).send({ error: 'world_id and prompt are required' });
    }

    const world = queryOne('SELECT * FROM worlds WHERE id = ?', [world_id]);

    if (!world) {
      return reply.status(404).send({ error: 'World not found' });
    }

    try {
      const worldContext = {
        ...world,
        config: JSON.parse(world.config || '{}')
      };

      const content = await generateWorldContent(worldContext, type, prompt);
      return { type, content };
    } catch (error) {
      return reply.status(500).send({ 
        error: 'Generation failed', 
        details: error.message 
      });
    }
  });
}
