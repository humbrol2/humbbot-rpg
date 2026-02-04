/**
 * Game session routes
 */

import { v4 as uuid } from 'uuid';
import { queryAll, queryOne, execute } from '../db/init.js';
import { generateGMResponse } from '../services/llm.js';

export default async function sessionRoutes(fastify) {

  // List sessions (optionally by world)
  fastify.get('/', async (request, reply) => {
    const { world_id } = request.query;

    let sql = 'SELECT * FROM sessions';
    const params = [];

    if (world_id) {
      sql += ' WHERE world_id = ?';
      params.push(world_id);
    }

    sql += ' ORDER BY updated_at DESC';

    const sessions = queryAll(sql, params);
    return sessions.map(s => ({
      ...s,
      state: JSON.parse(s.state || '{}')
    }));
  });

  // Get single session with history
  fastify.get('/:id', async (request, reply) => {
    const session = queryOne('SELECT * FROM sessions WHERE id = ?', [request.params.id]);

    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    // Get history
    const history = queryAll(
      `SELECT role, content, metadata, created_at 
       FROM session_history 
       WHERE session_id = ? 
       ORDER BY created_at ASC`,
      [request.params.id]
    );

    // Get participants
    const participants = queryAll(
      `SELECT c.* FROM characters c
       JOIN session_participants sp ON c.id = sp.character_id
       WHERE sp.session_id = ?`,
      [request.params.id]
    );

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
    const { world_id, name, character_ids = [] } = request.body;

    if (!world_id) {
      return reply.status(400).send({ error: 'world_id is required' });
    }

    // Verify world exists
    const world = queryOne('SELECT * FROM worlds WHERE id = ?', [world_id]);
    if (!world) {
      return reply.status(400).send({ error: 'World not found' });
    }

    const id = uuid();
    const sessionName = name || `Session ${new Date().toLocaleDateString()}`;
    const now = new Date().toISOString();

    execute(
      `INSERT INTO sessions (id, world_id, name, current_scene, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, world_id, sessionName, 'The adventure begins...', now, now]
    );

    // Add participants
    for (const charId of character_ids) {
      execute(
        `INSERT INTO session_participants (session_id, character_id, joined_at)
         VALUES (?, ?, ?)`,
        [id, charId, now]
      );
    }

    return { id, world_id, name: sessionName };
  });

  // Add character to session
  fastify.post('/:id/characters', async (request, reply) => {
    const { character_id } = request.body;

    if (!character_id) {
      return reply.status(400).send({ error: 'character_id is required' });
    }

    try {
      const now = new Date().toISOString();
      execute(
        `INSERT INTO session_participants (session_id, character_id, joined_at)
         VALUES (?, ?, ?)`,
        [request.params.id, character_id, now]
      );

      return { success: true };
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to add character' });
    }
  });

  // Send action (play the game!)
  fastify.post('/:id/action', async (request, reply) => {
    const { character_id, action } = request.body;

    if (!action) {
      return reply.status(400).send({ error: 'action is required' });
    }

    // Get session with world
    const session = queryOne('SELECT * FROM sessions WHERE id = ?', [request.params.id]);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    const world = queryOne('SELECT * FROM worlds WHERE id = ?', [session.world_id]);

    // Get recent history
    const recentHistory = queryAll(
      `SELECT role, content FROM session_history 
       WHERE session_id = ? 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [request.params.id]
    ).reverse();

    // Get characters
    const characters = queryAll(
      `SELECT c.* FROM characters c
       JOIN session_participants sp ON c.id = sp.character_id
       WHERE sp.session_id = ?`,
      [request.params.id]
    );

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
      const now = new Date().toISOString();
      execute(
        `INSERT INTO session_history (session_id, role, content, created_at)
         VALUES (?, ?, ?, ?)`,
        [request.params.id, 'user', playerAction, now]
      );
      execute(
        `INSERT INTO session_history (session_id, role, content, created_at)
         VALUES (?, ?, ?, ?)`,
        [request.params.id, 'assistant', gmResponse, now]
      );

      // Update session timestamp
      execute(
        'UPDATE sessions SET updated_at = ? WHERE id = ?',
        [now, request.params.id]
      );

      return {
        action: playerAction,
        response: gmResponse,
        timestamp: now
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
    const result = execute('DELETE FROM sessions WHERE id = ?', [request.params.id]);

    if (result.changes === 0) {
      return reply.status(404).send({ error: 'Session not found' });
    }

    return { success: true };
  });
}
