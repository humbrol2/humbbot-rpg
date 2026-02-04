/**
 * Character management routes
 */

import { v4 as uuid } from 'uuid';
import { getDb } from '../db/init.js';
import { generateBackstory } from '../services/llm.js';

export default async function characterRoutes(fastify) {

  // List characters (optionally by world)
  fastify.get('/', async (request, reply) => {
    const db = getDb();
    const { world_id } = request.query;

    let query = 'SELECT * FROM characters';
    const params = [];

    if (world_id) {
      query += ' WHERE world_id = ?';
      params.push(world_id);
    }

    query += ' ORDER BY updated_at DESC';

    const characters = db.prepare(query).all(...params);
    return characters.map(c => ({
      ...c,
      attributes: JSON.parse(c.attributes || '{}'),
      skills: JSON.parse(c.skills || '{}'),
      inventory: JSON.parse(c.inventory || '[]')
    }));
  });

  // Get single character
  fastify.get('/:id', async (request, reply) => {
    const db = getDb();
    const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(request.params.id);

    if (!character) {
      return reply.status(404).send({ error: 'Character not found' });
    }

    return {
      ...character,
      attributes: JSON.parse(character.attributes || '{}'),
      skills: JSON.parse(character.skills || '{}'),
      inventory: JSON.parse(character.inventory || '[]')
    };
  });

  // Create character
  fastify.post('/', async (request, reply) => {
    const db = getDb();
    const {
      world_id,
      player_id,
      name,
      class: charClass,
      level = 1,
      attributes = {},
      skills = {},
      inventory = [],
      backstory,
      notes
    } = request.body;

    if (!world_id || !name) {
      return reply.status(400).send({ error: 'world_id and name are required' });
    }

    // Verify world exists
    const world = db.prepare('SELECT id FROM worlds WHERE id = ?').get(world_id);
    if (!world) {
      return reply.status(400).send({ error: 'World not found' });
    }

    const id = uuid();
    const stmt = db.prepare(`
      INSERT INTO characters (id, world_id, player_id, name, class, level, attributes, skills, inventory, backstory, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      world_id,
      player_id || null,
      name,
      charClass || null,
      level,
      JSON.stringify(attributes),
      JSON.stringify(skills),
      JSON.stringify(inventory),
      backstory || null,
      notes || null
    );

    return { id, world_id, name, class: charClass, level, attributes, skills };
  });

  // Update character
  fastify.put('/:id', async (request, reply) => {
    const db = getDb();
    const updates = request.body;
    const id = request.params.id;

    // Build dynamic update
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (['attributes', 'skills', 'inventory'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(JSON.stringify(value));
      } else if (['name', 'class', 'level', 'xp', 'backstory', 'notes', 'player_id'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return reply.status(400).send({ error: 'No valid fields to update' });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const stmt = db.prepare(`UPDATE characters SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return reply.status(404).send({ error: 'Character not found' });
    }

    return { success: true };
  });

  // Delete character
  fastify.delete('/:id', async (request, reply) => {
    const db = getDb();
    const result = db.prepare('DELETE FROM characters WHERE id = ?').run(request.params.id);

    if (result.changes === 0) {
      return reply.status(404).send({ error: 'Character not found' });
    }

    return { success: true };
  });

  // Generate backstory suggestions
  fastify.post('/:id/backstory/generate', async (request, reply) => {
    const db = getDb();
    const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(request.params.id);

    if (!character) {
      return reply.status(404).send({ error: 'Character not found' });
    }

    const world = db.prepare('SELECT * FROM worlds WHERE id = ?').get(character.world_id);
    const concept = request.body.concept || `${character.name}, a ${character.class}`;

    try {
      const suggestions = await generateBackstory(
        { ...world, config: JSON.parse(world.config || '{}') },
        concept
      );
      return { suggestions };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to generate backstory', details: error.message });
    }
  });
}
