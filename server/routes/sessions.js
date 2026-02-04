/**
 * Game session routes
 */

import { v4 as uuid } from 'uuid';
import { getDb } from '../db/init.js';
import { generateGMResponse } from '../services/llm.js';

export default async function sessionRoutes(fastify) {

  // List sessions (optionally by world)
  fastify.get('/', async (request, reply) => {
    const db = getDb();
    const { world_id } = request.query;

    let query = 'SELECT * FROM sessions';
    const params = [];

    if (world_id) {
      query += ' WHERE world_id = ?';
      params.push(world_id);
    }

    query += ' ORDER BY updated_at DESC';

    const sessions = db.prepare(query).all(...params);
    return sessions.map(s => ({
      ...s,
      state: JSON.parse(s.state || '{}')
    }));
  });

  // Get single session with history
  fastify.get('/:id', async (request, reply) => {
    const db = getDb();
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(request.params.id);

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    // Get history
    const history = db.prepare(`
      SELECT role, content, metadata, created_at 
      FROM session_history 
      WHERE session_id = ? 
      ORDER BY created_at ASC
    `).all(request.params.id);

    // Get participants
    const participants = db.prepare(`
      SELECT c.* FROM characters c
      JOIN session_participants sp ON c.id = sp.character_id
      WHERE sp.session_id = ?
    `).all(request.params.id);

    return {
      ...session,
      state: JSON.parse(session.state || '{}'),
      history: history.map(h => ({
        ...h,
        metadata: JSON.parse(h.metadata || '{}')
      })),
      characters: participants.map(c => ({
        ...c,
        attributes: JSON.parse(c.attributes || '{}'),
        skills: JSON.parse(c.skills || '{}')
      }))
    };
  });

  // Create session
  fastify.post('/', async (request, reply) => {
    const db = getDb();
    const { world_id, name, character_ids = [] } = request.body;

    if (!world_id) {
      return reply.status(400).send({ error: 'world_id is required' });
    }

    // Verify world exists
    const world = db.prepare('SELECT * FROM worlds WHERE id = ?').get(world_id);
    if (!world) {
      return reply.status(400).send({ error: 'World not found' });
    }

    const id = uuid();
    const sessionName = name || `Session ${new Date().toLocaleDateString()}`;

    db.prepare(`
      INSERT INTO sessions (id, world_id, name, current_scene)
      VALUES (?, ?, ?, ?)
    `).run(id, world_id, sessionName, 'The adventure begins...');

    // Add participants
    if (character_ids.length > 0) {
      const addParticipant = db.prepare(`
        INSERT INTO session_participants (session_id, character_id)
        VALUES (?, ?)
      `);

      for (const charId of character_ids) {
        addParticipant.run(id, charId);
      }
    }

    return { id, world_id, name: sessionName };
  });

  // Add character to session
  fastify.post('/:id/characters', async (request, reply) => {
    const db = getDb();
    const { character_id } = request.body;

    if (!character_id) {
      return reply.status(400).send({ error: 'character_id is required' });
    }

    try {
      db.prepare(`
        INSERT INTO session_participants (session_id, character_id)
        VALUES (?, ?)
      `).run(request.params.id, character_id);

      return { success: true };
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to add character' });
    }
  });

  // Send action (play the game!)
  fastify.post('/:id/action', async (request, reply) => {
    const db = getDb();
    const { character_id, action } = request.body;

    if (!action) {
      return reply.status(400).send({ error: 'action is required' });
    }

    // Get session with world
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(request.params.id);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const world = db.prepare('SELECT * FROM worlds WHERE id = ?').get(session.world_id);

    // Get recent history
    const recentHistory = db.prepare(`
      SELECT role, content FROM session_history 
      WHERE session_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(request.params.id).reverse();

    // Get characters
    const characters = db.prepare(`
      SELECT c.* FROM characters c
      JOIN session_participants sp ON c.id = sp.character_id
      WHERE sp.session_id = ?
    `).all(request.params.id);

    // Build session context
    const sessionContext = {
      ...session,
      state: JSON.parse(session.state || '{}'),
      characters: characters.map(c => ({
        ...c,
        attributes: JSON.parse(c.attributes || '{}')
      })),
      messageHistory: recentHistory,
      recentHistory: recentHistory.map(h => `${h.role}: ${h.content}`)
    };

    // Get character name for action attribution
    let characterName = 'Player';
    if (character_id) {
      const char = characters.find(c => c.id === character_id);
      if (char) characterName = char.name;
    }

    const playerAction = `${characterName}: ${action}`;

    // Generate GM response
    try {
      const worldContext = {
        ...world,
        config: JSON.parse(world.config || '{}')
      };

      const gmResponse = await generateGMResponse(worldContext, sessionContext, playerAction);

      // Save to history
      const insertHistory = db.prepare(`
        INSERT INTO session_history (session_id, role, content)
        VALUES (?, ?, ?)
      `);

      insertHistory.run(request.params.id, 'user', playerAction);
      insertHistory.run(request.params.id, 'assistant', gmResponse);

      // Update session timestamp
      db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(request.params.id);

      return {
        action: playerAction,
        response: gmResponse,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return reply.status(500).send({ 
        error: 'Failed to generate response', 
        details: error.message 
      });
    }
  });

  // Delete session
  fastify.delete('/:id', async (request, reply) => {
    const db = getDb();
    const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(request.params.id);

    if (result.changes === 0) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    return { success: true };
  });
}
