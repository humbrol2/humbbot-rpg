/**
 * World management routes
 */

import { v4 as uuid } from 'uuid';
import { getDb } from '../db/init.js';

export default async function worldRoutes(fastify) {
  
  // List all worlds
  fastify.get('/', async (request, reply) => {
    const db = getDb();
    const worlds = db.prepare('SELECT * FROM worlds ORDER BY updated_at DESC').all();
    return worlds.map(w => ({
      ...w,
      config: JSON.parse(w.config || '{}')
    }));
  });

  // Get single world
  fastify.get('/:id', async (request, reply) => {
    const db = getDb();
    const world = db.prepare('SELECT * FROM worlds WHERE id = ?').get(request.params.id);
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
    const db = getDb();
    const { name, setting, description, config = {} } = request.body;

    if (!name || !setting) {
      return reply.status(400).send({ error: 'Name and setting are required' });
    }

    const id = uuid();
    const stmt = db.prepare(`
      INSERT INTO worlds (id, name, setting, description, config)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, name, setting, description || '', JSON.stringify(config));

    return { id, name, setting, description, config };
  });

  // Update world
  fastify.put('/:id', async (request, reply) => {
    const db = getDb();
    const { name, setting, description, config } = request.body;

    const stmt = db.prepare(`
      UPDATE worlds 
      SET name = COALESCE(?, name),
          setting = COALESCE(?, setting),
          description = COALESCE(?, description),
          config = COALESCE(?, config),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      name || null,
      setting || null,
      description || null,
      config ? JSON.stringify(config) : null,
      request.params.id
    );

    if (result.changes === 0) {
      return reply.status(404).send({ error: 'World not found' });
    }

    return { success: true };
  });

  // Delete world
  fastify.delete('/:id', async (request, reply) => {
    const db = getDb();
    const result = db.prepare('DELETE FROM worlds WHERE id = ?').run(request.params.id);

    if (result.changes === 0) {
      return reply.status(404).send({ error: 'World not found' });
    }

    return { success: true };
  });
}
