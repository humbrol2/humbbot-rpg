/**
 * Persistence API Routes
 * Manages inventory, NPCs, buildings, vehicles, staff for RPG sessions
 */

import { queryOne } from '../db/init.js';

export default async function persistenceRoutes(fastify) {

  // ==================== INVENTORY ENDPOINTS ====================

  // Get character inventory
  fastify.get('/sessions/:sessionId/characters/:characterId/inventory', async (request, reply) => {
    const { sessionId, characterId } = request.params;

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      // Get session manager with persistence
      const { default: EnhancedRPGMemoryManager } = await import('../services/enhanced-memory.js');
      const memoryManager = new EnhancedRPGMemoryManager(session.world_id, sessionId);
      await memoryManager.initialize();

      const inventory = memoryManager.getCharacterInventory(characterId);
      
      return {
        characterId,
        inventory: inventory.map(item => ({
          id: item.id,
          name: item.item_name,
          type: item.item_type,
          description: item.description,
          quantity: item.quantity,
          properties: JSON.parse(item.properties),
          location: item.location,
          created_at: item.created_at
        })),
        total_items: inventory.length
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get inventory', details: error.message });
    }
  });

  // Add item to inventory
  fastify.post('/sessions/:sessionId/characters/:characterId/inventory', async (request, reply) => {
    const { sessionId, characterId } = request.params;
    const { name, type, description, quantity = 1, properties = {} } = request.body;

    if (!name) {
      return reply.status(400).send({ error: 'Item name is required' });
    }

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      const { default: EnhancedRPGMemoryManager } = await import('../services/enhanced-memory.js');
      const memoryManager = new EnhancedRPGMemoryManager(session.world_id, sessionId);
      await memoryManager.initialize();

      const item = await memoryManager.addInventoryItem(characterId, {
        name,
        type,
        description,
        quantity,
        properties
      });

      return {
        success: true,
        item: {
          id: item.id,
          name: item.item_name,
          type: item.item_type,
          description: item.description,
          quantity: item.quantity,
          properties: JSON.parse(item.properties)
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to add item', details: error.message });
    }
  });

  // Remove item from inventory
  fastify.delete('/sessions/:sessionId/characters/:characterId/inventory/:itemName', async (request, reply) => {
    const { sessionId, characterId, itemName } = request.params;
    const { quantity = 1, reason = 'used' } = request.query;

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      const { default: EnhancedRPGMemoryManager } = await import('../services/enhanced-memory.js');
      const memoryManager = new EnhancedRPGMemoryManager(session.world_id, sessionId);
      await memoryManager.initialize();

      await memoryManager.removeInventoryItem(characterId, itemName, parseInt(quantity), reason);

      return { success: true, removed: { itemName, quantity: parseInt(quantity), reason } };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to remove item', details: error.message });
    }
  });

  // ==================== NPC ENDPOINTS ====================

  // Get NPCs in location
  fastify.get('/sessions/:sessionId/locations/:location/npcs', async (request, reply) => {
    const { sessionId, location } = request.params;

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      const { default: EnhancedRPGMemoryManager } = await import('../services/enhanced-memory.js');
      const memoryManager = new EnhancedRPGMemoryManager(session.world_id, sessionId);
      await memoryManager.initialize();

      const npcs = memoryManager.persistenceManager.getNPCsByLocation(location);

      return {
        location,
        npcs: npcs.map(npc => ({
          id: npc.id,
          name: npc.npc_name,
          type: npc.npc_type,
          description: npc.description,
          disposition: npc.disposition,
          status: npc.status,
          stats: JSON.parse(npc.stats),
          inventory: JSON.parse(npc.inventory)
        }))
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get NPCs', details: error.message });
    }
  });

  // Create new NPC
  fastify.post('/sessions/:sessionId/npcs', async (request, reply) => {
    const { sessionId } = request.params;
    const { name, type, description, location, disposition = 'neutral', stats = {}, inventory = [] } = request.body;

    if (!name || !location) {
      return reply.status(400).send({ error: 'NPC name and location are required' });
    }

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      const { default: EnhancedRPGMemoryManager } = await import('../services/enhanced-memory.js');
      const memoryManager = new EnhancedRPGMemoryManager(session.world_id, sessionId);
      await memoryManager.initialize();

      const npc = await memoryManager.createNPC({
        name,
        type,
        description,
        location,
        disposition,
        stats,
        inventory
      });

      return {
        success: true,
        npc: {
          id: npc.id,
          name: npc.npc_name,
          type: npc.npc_type,
          description: npc.description,
          location: npc.location,
          disposition: npc.disposition
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create NPC', details: error.message });
    }
  });

  // Update NPC
  fastify.patch('/sessions/:sessionId/npcs/:npcName', async (request, reply) => {
    const { sessionId, npcName } = request.params;
    const updates = request.body;

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      const { default: EnhancedRPGMemoryManager } = await import('../services/enhanced-memory.js');
      const memoryManager = new EnhancedRPGMemoryManager(session.world_id, sessionId);
      await memoryManager.initialize();

      await memoryManager.updateNPC(npcName, updates);

      return { success: true, updated: npcName, changes: updates };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to update NPC', details: error.message });
    }
  });

  // ==================== BUILDING ENDPOINTS ====================

  // Get buildings in location
  fastify.get('/sessions/:sessionId/locations/:location/buildings', async (request, reply) => {
    const { sessionId, location } = request.params;

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      const { default: EnhancedRPGMemoryManager } = await import('../services/enhanced-memory.js');
      const memoryManager = new EnhancedRPGMemoryManager(session.world_id, sessionId);
      await memoryManager.initialize();

      const buildings = memoryManager.persistenceManager.getBuildingsByLocation(location);

      return {
        location,
        buildings: buildings.map(building => ({
          id: building.id,
          name: building.building_name,
          type: building.building_type,
          description: building.description,
          size: building.size,
          condition: building.condition,
          owner: building.owner,
          properties: JSON.parse(building.properties)
        }))
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get buildings', details: error.message });
    }
  });

  // Create building
  fastify.post('/sessions/:sessionId/buildings', async (request, reply) => {
    const { sessionId } = request.params;
    const { name, type, description, location, size, owner, properties = {} } = request.body;

    if (!name || !location) {
      return reply.status(400).send({ error: 'Building name and location are required' });
    }

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      const { default: EnhancedRPGMemoryManager } = await import('../services/enhanced-memory.js');
      const memoryManager = new EnhancedRPGMemoryManager(session.world_id, sessionId);
      await memoryManager.initialize();

      const building = await memoryManager.createBuilding({
        name,
        type,
        description,
        location,
        size,
        owner,
        properties
      });

      return {
        success: true,
        building: {
          id: building.id,
          name: building.building_name,
          type: building.building_type,
          description: building.description,
          location: building.location,
          size: building.size,
          owner: building.owner
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to create building', details: error.message });
    }
  });

  // ==================== SEARCH/FIND ENDPOINTS ====================

  // Find any entity by name
  fastify.get('/sessions/:sessionId/find/:entityName', async (request, reply) => {
    const { sessionId, entityName } = request.params;

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      const { default: EnhancedRPGMemoryManager } = await import('../services/enhanced-memory.js');
      const memoryManager = new EnhancedRPGMemoryManager(session.world_id, sessionId);
      await memoryManager.initialize();

      const entity = memoryManager.findEntity(entityName);

      if (!entity) {
        return reply.status(404).send({ error: 'Entity not found', entityName });
      }

      return {
        found: true,
        entity: {
          type: entity.type,
          name: entityName,
          data: entity.data
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to find entity', details: error.message });
    }
  });

  // Get comprehensive location context
  fastify.get('/sessions/:sessionId/locations/:location/context', async (request, reply) => {
    const { sessionId, location } = request.params;

    try {
      const session = queryOne('SELECT * FROM sessions WHERE id = ?', [sessionId]);
      if (!session) {
        return reply.status(404).send({ error: 'Session not found' });
      }

      const { default: EnhancedRPGMemoryManager } = await import('../services/enhanced-memory.js');
      const memoryManager = new EnhancedRPGMemoryManager(session.world_id, sessionId);
      await memoryManager.initialize();

      const context = memoryManager.persistenceManager.buildLocationContext(location);

      return {
        location,
        context: {
          npcs: context.npcs.map(npc => ({
            name: npc.npc_name,
            type: npc.npc_type,
            disposition: npc.disposition,
            description: npc.description
          })),
          buildings: context.buildings.map(building => ({
            name: building.building_name,
            type: building.building_type,
            description: building.description
          })),
          vehicles: context.vehicles.map(vehicle => ({
            name: vehicle.vehicle_name,
            type: vehicle.vehicle_type,
            description: vehicle.description
          })),
          staff: context.staff.map(staff => ({
            name: staff.staff_name,
            role: staff.role,
            assignedTo: staff.assigned_to
          })),
          locationData: context.location
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: 'Failed to get location context', details: error.message });
    }
  });
}