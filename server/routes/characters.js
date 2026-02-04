/**
 * Character management routes
 */

import { v4 as uuid } from 'uuid';
import { queryAll, queryOne, execute } from '../db/init.js';
import { generateBackstory } from '../services/llm.js';

export default async function characterRoutes(fastify) {

  // List characters (optionally by world)
  fastify.get('/', async (request, reply) => {
    const { world_id } = request.query;

    let sql = 'SELECT * FROM characters';
    const params = [];

    if (world_id) {
      sql += ' WHERE world_id = ?';
      params.push(world_id);
    }

    sql += ' ORDER BY updated_at DESC';

    const characters = queryAll(sql, params);
    return characters.map(c => ({
      ...c,
      attributes: JSON.parse(c.attributes || '{}'),
      skills: JSON.parse(c.skills || '{}'),
      inventory: JSON.parse(c.inventory || '[]')
    }));
  });

  // Get single character
  fastify.get('/:id', async (request, reply) => {
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [request.params.id]);

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
    const world = queryOne('SELECT id FROM worlds WHERE id = ?', [world_id]);
    if (!world) {
      return reply.status(400).send({ error: 'World not found' });
    }

    const id = uuid();
    const now = new Date().toISOString();

    execute(
      `INSERT INTO characters (id, world_id, player_id, name, class, level, attributes, skills, inventory, backstory, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        notes || null,
        now,
        now
      ]
    );

    return { id, world_id, name, class: charClass, level, attributes, skills };
  });

  // Update character
  fastify.put('/:id', async (request, reply) => {
    const updates = request.body;
    const id = request.params.id;
    const now = new Date().toISOString();

    // Check exists
    const existing = queryOne('SELECT id FROM characters WHERE id = ?', [id]);
    if (!existing) {
      return reply.status(404).send({ error: 'Character not found' });
    }

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

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    execute(`UPDATE characters SET ${fields.join(', ')} WHERE id = ?`, values);

    return { success: true };
  });

  // Delete character
  fastify.delete('/:id', async (request, reply) => {
    const result = execute('DELETE FROM characters WHERE id = ?', [request.params.id]);

    if (result.changes === 0) {
      return reply.status(404).send({ error: 'Character not found' });
    }

    return { success: true };
  });

  // Generate backstory suggestions
  fastify.post('/:id/backstory/generate', async (request, reply) => {
    const character = queryOne('SELECT * FROM characters WHERE id = ?', [request.params.id]);

    if (!character) {
      return reply.status(404).send({ error: 'Character not found' });
    }

    const world = queryOne('SELECT * FROM worlds WHERE id = ?', [character.world_id]);
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
