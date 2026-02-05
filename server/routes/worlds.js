/**
 * World management routes
 */

import { v4 as uuid } from 'uuid';
import { queryAll, queryOne, execute } from '../db/init.js';

export default async function worldRoutes(fastify) {
  
  // List all worlds
  fastify.get('/', async (request, reply) => {
    const worlds = queryAll('SELECT * FROM worlds ORDER BY updated_at DESC');
    return worlds.map(w => ({
      ...w,
      config: JSON.parse(w.config || '{}')
    }));
  });

  // Get single world
  fastify.get('/:id', async (request, reply) => {
    const world = queryOne('SELECT * FROM worlds WHERE id = ?', [request.params.id]);
    if (!world) {
      return reply.status(404).send({ error: 'World not found' });
    }
    return {
      ...world,
      config: JSON.parse(world.config || '{}')
    };
  });

  // Create world
  fastify.post('/', async (request, reply) => {
    const { name, setting, description, config = {} } = request.body;

    if (!name || !setting) {
      return reply.status(400).send({ error: 'Name and setting are required' });
    }

    const id = uuid();
    const now = new Date().toISOString();
    
    execute(
      `INSERT INTO worlds (id, name, setting, description, config, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, setting, description || '', JSON.stringify(config), now, now]
    );

    return { id, name, setting, description, config, created_at: now, updated_at: now };
  });

  // Update world
  fastify.put('/:id', async (request, reply) => {
    const { name, setting, description, config } = request.body;
    const now = new Date().toISOString();

    // Check if world exists
    const existing = queryOne('SELECT id FROM worlds WHERE id = ?', [request.params.id]);
    if (!existing) {
      return reply.status(404).send({ error: 'World not found' });
    }

    // Build update dynamically
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (setting !== undefined) { updates.push('setting = ?'); params.push(setting); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (config !== undefined) { updates.push('config = ?'); params.push(JSON.stringify(config)); }
    
    updates.push('updated_at = ?');
    params.push(now);
    params.push(request.params.id);

    execute(`UPDATE worlds SET ${updates.join(', ')} WHERE id = ?`, params);

    return { success: true };
  });

  // Delete world
  fastify.delete('/:id', async (request, reply) => {
    const result = execute('DELETE FROM worlds WHERE id = ?', [request.params.id]);

    if (result.changes === 0) {
      return reply.status(404).send({ error: 'World not found' });
    }

    return { success: true };
  });
}
