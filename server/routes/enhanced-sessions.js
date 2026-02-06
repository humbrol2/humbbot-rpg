/**
 * Enhanced Game session routes with memory integration
 */

import { v4 as uuid } from 'uuid'
import { queryAll, queryOne, execute } from '../db/init.js'
import { generateGMResponse } from '../services/llm.js'
import { EnhancedSessionManager } from '../services/session-manager.js'

const activeSessions = new Map() // Store active enhanced session managers

export default async function enhancedSessionRoutes(fastify) {

  // Create new enhanced session
  fastify.post('/', async (request, reply) => {
    const { worldId, characterIds = [], sessionType = 'enhanced', memoryEnabled = true } = request.body

    if (!worldId) {
      return reply.status(400).send({ error: 'World ID is required' })
    }

    try {
      // Verify world exists
      const world = queryOne('SELECT * FROM worlds WHERE id = ?', [worldId])
      if (!world) {
        return reply.status(404).send({ error: 'World not found' })
      }

      // Create session
      const sessionId = uuid()
      const now = Date.now()
      
      execute(
        `INSERT INTO sessions (id, world_id, name, state, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          worldId,
          `Enhanced Session ${new Date().toLocaleDateString()}`,
          JSON.stringify({
            sessionType,
            memoryEnabled,
            created: now,
            characters: [],
            currentScene: {
              name: 'The Beginning',
              location: 'starting area',
              description: 'The adventure is about to begin...',
              npcs: [],
              threats: [],
              opportunities: []
            },
            messageHistory: [],
            recentHistory: [],
            relationships: {},
            questLog: [],
            gameState: {
              timeOfDay: 'morning',
              weather: 'clear',
              season: 'spring'
            },
            sessionStats: {
              startTime: now,
              actions: 0,
              scenes: 1,
              memoryEvents: 0
            }
          }),
          now,
          now
        ]
      )

      // Add characters to session
      for (const characterId of characterIds) {
        // Verify character exists
        const character = queryOne('SELECT * FROM characters WHERE id = ?', [characterId])
        if (character) {
          execute(
            `INSERT INTO session_participants (session_id, character_id, joined_at)
             VALUES (?, ?, ?)`,
            [sessionId, characterId, now]
          )
        }
      }

      // Initialize enhanced session manager
      if (memoryEnabled) {
        const sessionManager = new EnhancedSessionManager(worldId, sessionId)
        await sessionManager.initialize(world)
        activeSessions.set(sessionId, sessionManager)
      }

      return {
        id: sessionId,
        worldId,
        characterIds,
        sessionType,
        memoryEnabled,
        status: 'active',
        created: now
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to create session', details: error.message })
    }
  })

  // Get session with enhanced data
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params
    
    try {
      // Get basic session data
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [id])
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      // Get participants (characters)
      const characters = queryAll(
        `SELECT c.*, sp.joined_at 
         FROM characters c
         JOIN session_participants sp ON c.id = sp.character_id
         WHERE sp.session_id = ?`,
        [id]
      )

      // Parse session state
      const sessionState = JSON.parse(session.state || '{}')

      // Get or create enhanced session manager
      let sessionManager = activeSessions.get(id)
      if (!sessionManager) {
        sessionManager = new EnhancedSessionManager(session.world_id, id)
        await sessionManager.initialize()
        activeSessions.set(id, sessionManager)
      }

      return {
        ...session,
        characters: characters.map(char => ({
          ...char,
          attributes: JSON.parse(char.attributes || '{}')
        })),
        state: sessionState,
        currentScene: sessionState.currentScene || {
          name: 'The Beginning',
          location: 'starting area',
          description: 'The adventure is about to begin...'
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to load session' })
    }
  })

  // Get session message history
  fastify.get('/:id/messages', async (request, reply) => {
    const { id } = request.params
    const { limit = 50 } = request.query

    try {
      const messages = queryAll(
        `SELECT role, content, metadata, created_at as timestamp
         FROM session_history 
         WHERE session_id = ? 
         ORDER BY created_at DESC
         LIMIT ?`,
        [id, parseInt(limit)]
      ).reverse() // Reverse to get chronological order

      return messages.map(msg => ({
        ...msg,
        metadata: JSON.parse(msg.metadata || '{}'),
        id: `${msg.timestamp}-${msg.role}`
      }))
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to load messages' })
    }
  })

  // Get session memory data
  fastify.get('/:id/memory', async (request, reply) => {
    const { id } = request.params

    try {
      let sessionManager = activeSessions.get(id)
      if (!sessionManager) {
        // Get session data to initialize manager
        const session = queryOne('SELECT * FROM sessions WHERE id = ?', [id])
        if (!session) {
          return reply.status(404).send({ error: 'Session not found' })
        }

        sessionManager = new EnhancedSessionManager(session.world_id, id)
        await sessionManager.initialize()
        activeSessions.set(id, sessionManager)
      }

      // Get all memory events
      const allEvents = await sessionManager.memory.getAllEvents()
      
      // Get relationship data from session state
      const session = queryOne('SELECT state FROM sessions WHERE id = ?', [id])
      const sessionState = JSON.parse(session?.state || '{}')
      const relationships = sessionState.relationships || {}

      return {
        events: allEvents,
        relationships,
        tiers: {
          hot: allEvents.filter(e => sessionManager.memory.getMemoryTier ? sessionManager.memory.getMemoryTier(e) === 'hot' : false).length,
          warm: allEvents.filter(e => sessionManager.memory.getMemoryTier ? sessionManager.memory.getMemoryTier(e) === 'warm' : false).length,
          cool: allEvents.filter(e => sessionManager.memory.getMemoryTier ? sessionManager.memory.getMemoryTier(e) === 'cool' : false).length,
          cold: allEvents.filter(e => sessionManager.memory.getMemoryTier ? sessionManager.memory.getMemoryTier(e) === 'cold' : false).length
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to load memory data' })
    }
  })

  // Process player action with enhanced memory
  fastify.post('/:id/action', async (request, reply) => {
    const { id } = request.params
    const { action, characterId, sceneType = 'story', importance = 0.5 } = request.body

    if (!action?.trim()) {
      return reply.status(400).send({ error: 'Action is required' })
    }

    try {
      // Get session and world data
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [id])
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      const world = queryOne('SELECT * FROM worlds WHERE id = ?', [session.world_id])
      if (!world) {
        return reply.status(404).send({ error: 'World not found' })
      }

      // Get or create enhanced session manager
      let sessionManager = activeSessions.get(id)
      if (!sessionManager) {
        sessionManager = new EnhancedSessionManager(session.world_id, id)
        await sessionManager.initialize()
        activeSessions.set(id, sessionManager)
      }

      // Process the action with memory integration
      const result = await sessionManager.processPlayerAction(world, action, {
        sceneType,
        importance,
        style: 'balanced'
      })

      // Record action in database
      execute(
        `INSERT INTO session_history (id, session_id, role, content, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuid(),
          id,
          'player',
          action,
          JSON.stringify({ characterId, sceneType, importance }),
          Date.now()
        ]
      )

      // Record GM response in database
      execute(
        `INSERT INTO session_history (id, session_id, role, content, metadata, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          uuid(),
          id,
          'gm',
          result.response,
          JSON.stringify({ 
            sceneType: result.sceneType,
            importance: result.importance,
            memoryEvents: result.memoryEvents,
            contextUsage: result.contextUsage
          }),
          Date.now()
        ]
      )

      // Update session state
      const currentState = JSON.parse(session.state || '{}')
      const updatedState = {
        ...currentState,
        ...sessionManager.session,
        lastAction: Date.now()
      }

      execute(
        'UPDATE sessions SET state = ?, updated_at = ? WHERE id = ?',
        [JSON.stringify(updatedState), Date.now(), id]
      )

      return {
        response: result.response,
        sceneType: result.sceneType,
        importance: result.importance,
        memoryEvents: result.memoryEvents,
        contextUsage: result.contextUsage,
        sessionUpdate: {
          currentScene: sessionManager.session.currentScene,
          relationships: sessionManager.session.relationships
        }
      }

    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ 
        error: 'Failed to process action',
        details: error.message 
      })
    }
  })

  // Update scene data
  fastify.patch('/:id/scene', async (request, reply) => {
    const { id } = request.params
    const sceneUpdates = request.body

    try {
      const session = queryOne('SELECT state FROM sessions WHERE id = ?', [id])
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      const currentState = JSON.parse(session.state || '{}')
      const updatedState = {
        ...currentState,
        currentScene: {
          ...currentState.currentScene,
          ...sceneUpdates
        }
      }

      execute(
        'UPDATE sessions SET state = ?, updated_at = ? WHERE id = ?',
        [JSON.stringify(updatedState), Date.now(), id]
      )

      return { success: true, scene: updatedState.currentScene }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to update scene' })
    }
  })

  // Session cleanup endpoint
  fastify.delete('/:id/cleanup', async (request, reply) => {
    const { id } = request.params

    try {
      // Remove from active sessions
      if (activeSessions.has(id)) {
        const sessionManager = activeSessions.get(id)
        await sessionManager.saveSession()
        activeSessions.delete(id)
      }

      return { success: true }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to cleanup session' })
    }
  })

  // Get session status
  fastify.get('/:id/status', async (request, reply) => {
    const { id } = request.params

    try {
      let sessionManager = activeSessions.get(id)
      if (!sessionManager) {
        return { active: false }
      }

      const status = sessionManager.getSessionStatus()
      return { active: true, ...status }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to get session status' })
    }
  })

  // Get session statistics (enhanced version)
  fastify.get('/:id/stats', async (request, reply) => {
    const { id } = request.params

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [id])
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      let sessionManager = activeSessions.get(id)
      if (!sessionManager) {
        sessionManager = new EnhancedSessionManager(session.world_id, id)
        await sessionManager.initialize()
        activeSessions.set(id, sessionManager)
      }

      const memoryStats = await sessionManager.memory.getStats()
      const sessionStatus = sessionManager.getSessionStatus()

      return {
        sessionStats: sessionStatus.sessionStats,
        memoryEvents: sessionStatus.memoryStatus,
        memoryStats: memoryStats,
        performance: {
          contextUsage: sessionManager.contextUsage,
          lastMemoryFlush: sessionManager.lastMemoryFlush
        }
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Failed to get session statistics' })
    }
  })

  // Search memory with natural language queries
  fastify.post('/:id/search', async (request, reply) => {
    const { id } = request.params
    const { query, limit = 10, threshold = 0.3 } = request.body

    if (!query?.trim()) {
      return reply.status(400).send({ error: 'Search query is required' })
    }

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [id])
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      let sessionManager = activeSessions.get(id)
      if (!sessionManager) {
        sessionManager = new EnhancedSessionManager(session.world_id, id)
        await sessionManager.initialize()
        activeSessions.set(id, sessionManager)
      }

      // Use the enhanced memory search
      const results = await sessionManager.memory.searchMemories(query, limit);

      return {
        query,
        results,
        total: results.length,
        threshold
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Memory search failed', details: error.message })
    }
  })

  // Debug memory search (combining traditional + vector)
  fastify.post('/:id/debug-search', async (request, reply) => {
    const { id } = request.params
    const { query } = request.body

    if (!query?.trim()) {
      return reply.status(400).send({ error: 'Search query is required' })
    }

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [id])
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' })
      }

      let sessionManager = activeSessions.get(id)
      if (!sessionManager) {
        sessionManager = new EnhancedSessionManager(session.world_id, id)
        await sessionManager.initialize()
        activeSessions.set(id, sessionManager)
      }

      const debugResults = await sessionManager.memory.debugMemorySearch(query);

      return {
        query,
        traditional: debugResults.traditional,
        vector: debugResults.vector,
        hybridMode: sessionManager.memory.hybridMode
      }
    } catch (error) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Debug search failed', details: error.message })
    }
  })
}