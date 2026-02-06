/**
 * RPG Persistence Manager
 * Handles persistent storage for all game entities: inventory, NPCs, buildings, ships, staff, etc.
 * Integrates with vector memory for semantic tracking of entity changes.
 */

import { execute, queryOne, queryAll } from '../db/init.js';
import { v4 as uuid } from 'uuid';

class RPGPersistenceManager {
  constructor(sessionId, memoryManager = null) {
    this.sessionId = sessionId;
    this.memoryManager = memoryManager;
  }

  /**
   * Initialize persistence tables for all RPG entities
   */
  static async initializeTables() {
    // Character Inventory Table
    execute(`
      CREATE TABLE IF NOT EXISTS character_inventory (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        character_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        item_type TEXT DEFAULT 'item',
        description TEXT,
        quantity INTEGER DEFAULT 1,
        properties TEXT DEFAULT '{}',
        location TEXT DEFAULT 'inventory',
        created_at INTEGER DEFAULT 0,
        updated_at INTEGER DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // NPCs Table  
    execute(`
      CREATE TABLE IF NOT EXISTS session_npcs (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        npc_name TEXT NOT NULL,
        npc_type TEXT DEFAULT 'humanoid',
        description TEXT,
        location TEXT NOT NULL,
        disposition TEXT DEFAULT 'neutral',
        stats TEXT DEFAULT '{}',
        inventory TEXT DEFAULT '[]',
        dialogue_history TEXT DEFAULT '[]',
        relationship_data TEXT DEFAULT '{}',
        status TEXT DEFAULT 'alive',
        notes TEXT DEFAULT '',
        created_at INTEGER DEFAULT 0,
        updated_at INTEGER DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Buildings/Structures Table
    execute(`
      CREATE TABLE IF NOT EXISTS session_buildings (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        building_name TEXT NOT NULL,
        building_type TEXT DEFAULT 'structure',
        location TEXT NOT NULL,
        description TEXT,
        size TEXT DEFAULT 'medium',
        condition TEXT DEFAULT 'good',
        owner TEXT,
        properties TEXT DEFAULT '{}',
        rooms TEXT DEFAULT '[]',
        inventory TEXT DEFAULT '[]',
        staff TEXT DEFAULT '[]',
        created_at INTEGER DEFAULT 0,
        updated_at INTEGER DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Ships/Vehicles Table
    execute(`
      CREATE TABLE IF NOT EXISTS session_vehicles (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        vehicle_name TEXT NOT NULL,
        vehicle_type TEXT DEFAULT 'ship',
        location TEXT NOT NULL,
        description TEXT,
        size TEXT DEFAULT 'medium',
        condition TEXT DEFAULT 'good',
        crew_capacity INTEGER DEFAULT 10,
        cargo_capacity INTEGER DEFAULT 100,
        speed INTEGER DEFAULT 5,
        properties TEXT DEFAULT '{}',
        crew TEXT DEFAULT '[]',
        cargo TEXT DEFAULT '[]',
        upgrades TEXT DEFAULT '[]',
        created_at INTEGER DEFAULT 0,
        updated_at INTEGER DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // Staff/Crew Table (for buildings and vehicles)
    execute(`
      CREATE TABLE IF NOT EXISTS session_staff (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        staff_type TEXT DEFAULT 'worker',
        assigned_to TEXT,
        assigned_type TEXT,
        role TEXT DEFAULT 'general',
        skill_level INTEGER DEFAULT 1,
        wages INTEGER DEFAULT 10,
        description TEXT,
        properties TEXT DEFAULT '{}',
        status TEXT DEFAULT 'active',
        created_at INTEGER DEFAULT 0,
        updated_at INTEGER DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    // World Locations/Areas Table
    execute(`
      CREATE TABLE IF NOT EXISTS session_locations (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        location_name TEXT NOT NULL,
        location_type TEXT DEFAULT 'area',
        description TEXT,
        parent_location TEXT,
        connections TEXT DEFAULT '[]',
        npcs TEXT DEFAULT '[]',
        buildings TEXT DEFAULT '[]',
        items TEXT DEFAULT '[]',
        properties TEXT DEFAULT '{}',
        discovered_at INTEGER DEFAULT 0,
        last_visited INTEGER DEFAULT 0,
        FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    console.log('🏗️ RPG persistence tables initialized');
  }

  // ==================== INVENTORY MANAGEMENT ====================

  /**
   * Add item to character inventory
   */
  async addInventoryItem(characterId, itemData) {
    const itemId = uuid();
    const now = Date.now();
    
    const item = {
      id: itemId,
      session_id: this.sessionId,
      character_id: characterId,
      item_id: itemData.item_id || itemId,
      item_name: itemData.name,
      item_type: itemData.type || 'item',
      description: itemData.description || '',
      quantity: itemData.quantity || 1,
      properties: JSON.stringify(itemData.properties || {}),
      location: itemData.location || 'inventory',
      created_at: now,
      updated_at: now
    };

    execute(`
      INSERT INTO character_inventory 
      (id, session_id, character_id, item_id, item_name, item_type, description, 
       quantity, properties, location, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(item));

    // Record in memory system
    if (this.memoryManager) {
      await this.memoryManager.recordEvent('inventory_add', {
        characterId,
        itemName: item.item_name,
        itemType: item.item_type,
        quantity: item.quantity,
        location: 'inventory'
      }, 0.4);
    }

    console.log(`📦 Added ${item.item_name} to ${characterId} inventory`);
    return item;
  }

  /**
   * Remove item from inventory
   */
  async removeInventoryItem(characterId, itemName, quantity = 1) {
    const item = queryOne(`
      SELECT * FROM character_inventory 
      WHERE session_id = ? AND character_id = ? AND item_name = ?
      ORDER BY created_at DESC LIMIT 1
    `, [this.sessionId, characterId, itemName]);

    if (!item) {
      throw new Error(`Item ${itemName} not found in inventory`);
    }

    if (item.quantity <= quantity) {
      // Remove completely
      execute(`
        DELETE FROM character_inventory 
        WHERE id = ?
      `, [item.id]);
    } else {
      // Reduce quantity
      execute(`
        UPDATE character_inventory 
        SET quantity = quantity - ?, updated_at = ?
        WHERE id = ?
      `, [quantity, Date.now(), item.id]);
    }

    // Record in memory system
    if (this.memoryManager) {
      await this.memoryManager.recordEvent('inventory_remove', {
        characterId,
        itemName,
        quantity,
        reason: 'used/consumed'
      }, 0.4);
    }

    console.log(`📦 Removed ${quantity}x ${itemName} from ${characterId} inventory`);
    return true;
  }

  /**
   * Get character's complete inventory
   */
  getCharacterInventory(characterId) {
    return queryAll(`
      SELECT * FROM character_inventory 
      WHERE session_id = ? AND character_id = ?
      ORDER BY item_type, item_name
    `, [this.sessionId, characterId]);
  }

  /**
   * Update item properties/description
   */
  async updateInventoryItem(characterId, itemName, updates) {
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(updates), Date.now(), this.sessionId, characterId, itemName];
    
    execute(`
      UPDATE character_inventory 
      SET ${setClause}, updated_at = ?
      WHERE session_id = ? AND character_id = ? AND item_name = ?
    `, values);

    // Record in memory
    if (this.memoryManager) {
      await this.memoryManager.recordEvent('inventory_update', {
        characterId,
        itemName,
        changes: updates
      }, 0.3);
    }

    return true;
  }

  // ==================== NPC MANAGEMENT ====================

  /**
   * Create/register an NPC
   */
  async createNPC(npcData) {
    const npcId = uuid();
    const now = Date.now();

    const npc = {
      id: npcId,
      session_id: this.sessionId,
      npc_name: npcData.name,
      npc_type: npcData.type || 'humanoid',
      description: npcData.description || '',
      location: npcData.location,
      disposition: npcData.disposition || 'neutral',
      stats: JSON.stringify(npcData.stats || {}),
      inventory: JSON.stringify(npcData.inventory || []),
      dialogue_history: JSON.stringify([]),
      relationship_data: JSON.stringify({}),
      status: npcData.status || 'alive',
      notes: npcData.notes || '',
      created_at: now,
      updated_at: now
    };

    execute(`
      INSERT INTO session_npcs 
      (id, session_id, npc_name, npc_type, description, location, disposition, 
       stats, inventory, dialogue_history, relationship_data, status, notes, 
       created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(npc));

    // Record in memory
    if (this.memoryManager) {
      await this.memoryManager.recordEvent('npc_created', {
        npcName: npc.npc_name,
        npcType: npc.npc_type,
        location: npc.location,
        disposition: npc.disposition
      }, 0.6);
    }

    console.log(`👤 Created NPC: ${npc.npc_name} at ${npc.location}`);
    return npc;
  }

  /**
   * Update NPC data (location, status, etc.)
   */
  async updateNPC(npcName, updates) {
    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(updates), Date.now(), this.sessionId, npcName];
    
    execute(`
      UPDATE session_npcs 
      SET ${setClause}, updated_at = ?
      WHERE session_id = ? AND npc_name = ?
    `, values);

    // Record significant changes in memory
    if (this.memoryManager && (updates.location || updates.status || updates.disposition)) {
      await this.memoryManager.recordEvent('npc_updated', {
        npcName,
        changes: updates
      }, 0.5);
    }

    return true;
  }

  /**
   * Get all NPCs in a location
   */
  getNPCsByLocation(location) {
    return queryAll(`
      SELECT * FROM session_npcs 
      WHERE session_id = ? AND location = ? AND status != 'dead'
      ORDER BY npc_name
    `, [this.sessionId, location]);
  }

  /**
   * Get specific NPC data
   */
  getNPC(npcName) {
    return queryOne(`
      SELECT * FROM session_npcs 
      WHERE session_id = ? AND npc_name = ?
    `, [this.sessionId, npcName]);
  }

  // ==================== BUILDING MANAGEMENT ====================

  /**
   * Create a building/structure
   */
  async createBuilding(buildingData) {
    const buildingId = uuid();
    const now = Date.now();

    const building = {
      id: buildingId,
      session_id: this.sessionId,
      building_name: buildingData.name,
      building_type: buildingData.type || 'structure',
      location: buildingData.location,
      description: buildingData.description || '',
      size: buildingData.size || 'medium',
      condition: buildingData.condition || 'good',
      owner: buildingData.owner || null,
      properties: JSON.stringify(buildingData.properties || {}),
      rooms: JSON.stringify(buildingData.rooms || []),
      inventory: JSON.stringify(buildingData.inventory || []),
      staff: JSON.stringify(buildingData.staff || []),
      created_at: now,
      updated_at: now
    };

    execute(`
      INSERT INTO session_buildings 
      (id, session_id, building_name, building_type, location, description, 
       size, condition, owner, properties, rooms, inventory, staff, 
       created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(building));

    // Record in memory
    if (this.memoryManager) {
      await this.memoryManager.recordEvent('building_created', {
        buildingName: building.building_name,
        buildingType: building.building_type,
        location: building.location,
        size: building.size
      }, 0.7);
    }

    console.log(`🏗️ Created building: ${building.building_name} at ${building.location}`);
    return building;
  }

  /**
   * Get buildings by location
   */
  getBuildingsByLocation(location) {
    return queryAll(`
      SELECT * FROM session_buildings 
      WHERE session_id = ? AND location = ?
      ORDER BY building_name
    `, [this.sessionId, location]);
  }

  // ==================== VEHICLE/SHIP MANAGEMENT ====================

  /**
   * Create a ship/vehicle
   */
  async createVehicle(vehicleData) {
    const vehicleId = uuid();
    const now = Date.now();

    const vehicle = {
      id: vehicleId,
      session_id: this.sessionId,
      vehicle_name: vehicleData.name,
      vehicle_type: vehicleData.type || 'ship',
      location: vehicleData.location,
      description: vehicleData.description || '',
      size: vehicleData.size || 'medium',
      condition: vehicleData.condition || 'good',
      crew_capacity: vehicleData.crewCapacity || 10,
      cargo_capacity: vehicleData.cargoCapacity || 100,
      speed: vehicleData.speed || 5,
      properties: JSON.stringify(vehicleData.properties || {}),
      crew: JSON.stringify(vehicleData.crew || []),
      cargo: JSON.stringify(vehicleData.cargo || []),
      upgrades: JSON.stringify(vehicleData.upgrades || []),
      created_at: now,
      updated_at: now
    };

    execute(`
      INSERT INTO session_vehicles 
      (id, session_id, vehicle_name, vehicle_type, location, description, 
       size, condition, crew_capacity, cargo_capacity, speed, properties, 
       crew, cargo, upgrades, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(vehicle));

    // Record in memory
    if (this.memoryManager) {
      await this.memoryManager.recordEvent('vehicle_created', {
        vehicleName: vehicle.vehicle_name,
        vehicleType: vehicle.vehicle_type,
        location: vehicle.location
      }, 0.7);
    }

    console.log(`🚢 Created vehicle: ${vehicle.vehicle_name} at ${vehicle.location}`);
    return vehicle;
  }

  // ==================== STAFF MANAGEMENT ====================

  /**
   * Hire staff for buildings/vehicles
   */
  async hireStaff(staffData) {
    const staffId = uuid();
    const now = Date.now();

    const staff = {
      id: staffId,
      session_id: this.sessionId,
      staff_name: staffData.name,
      staff_type: staffData.type || 'worker',
      assigned_to: staffData.assignedTo || null,
      assigned_type: staffData.assignedType || null,
      role: staffData.role || 'general',
      skill_level: staffData.skillLevel || 1,
      wages: staffData.wages || 10,
      description: staffData.description || '',
      properties: JSON.stringify(staffData.properties || {}),
      status: staffData.status || 'active',
      created_at: now,
      updated_at: now
    };

    execute(`
      INSERT INTO session_staff 
      (id, session_id, staff_name, staff_type, assigned_to, assigned_type, 
       role, skill_level, wages, description, properties, status, 
       created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(staff));

    // Record in memory
    if (this.memoryManager) {
      await this.memoryManager.recordEvent('staff_hired', {
        staffName: staff.staff_name,
        role: staff.role,
        assignedTo: staff.assigned_to
      }, 0.5);
    }

    console.log(`👷 Hired staff: ${staff.staff_name} as ${staff.role}`);
    return staff;
  }

  // ==================== LOCATION MANAGEMENT ====================

  /**
   * Register/discover a new location
   */
  async discoverLocation(locationData) {
    const locationId = uuid();
    const now = Date.now();

    const location = {
      id: locationId,
      session_id: this.sessionId,
      location_name: locationData.name,
      location_type: locationData.type || 'area',
      description: locationData.description || '',
      parent_location: locationData.parentLocation || null,
      connections: JSON.stringify(locationData.connections || []),
      npcs: JSON.stringify([]),
      buildings: JSON.stringify([]),
      items: JSON.stringify([]),
      properties: JSON.stringify(locationData.properties || {}),
      discovered_at: now,
      last_visited: now
    };

    execute(`
      INSERT INTO session_locations 
      (id, session_id, location_name, location_type, description, 
       parent_location, connections, npcs, buildings, items, properties, 
       discovered_at, last_visited)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(location));

    // Record in memory
    if (this.memoryManager) {
      await this.memoryManager.recordEvent('location_discovered', {
        locationName: location.location_name,
        locationType: location.location_type,
        discoveredAt: now
      }, 0.6);
    }

    console.log(`🗺️ Discovered location: ${location.location_name}`);
    return location;
  }

  // ==================== CONTEXT BUILDING FOR GM ====================

  /**
   * Build comprehensive context for GM prompts
   * Includes all persistent entities in current location
   */
  buildLocationContext(currentLocation) {
    const context = {
      npcs: this.getNPCsByLocation(currentLocation),
      buildings: this.getBuildingsByLocation(currentLocation),
      vehicles: queryAll(`
        SELECT * FROM session_vehicles 
        WHERE session_id = ? AND location = ?
      `, [this.sessionId, currentLocation]),
      staff: queryAll(`
        SELECT * FROM session_staff 
        WHERE session_id = ? AND status = 'active'
      `, [this.sessionId]),
      location: queryOne(`
        SELECT * FROM session_locations 
        WHERE session_id = ? AND location_name = ?
      `, [this.sessionId, currentLocation])
    };

    return context;
  }

  /**
   * Get entity by name (searches across all types)
   */
  findEntity(entityName) {
    // Try NPCs first
    let entity = this.getNPC(entityName);
    if (entity) return { type: 'npc', data: entity };

    // Try buildings
    entity = queryOne(`
      SELECT * FROM session_buildings 
      WHERE session_id = ? AND building_name = ?
    `, [this.sessionId, entityName]);
    if (entity) return { type: 'building', data: entity };

    // Try vehicles
    entity = queryOne(`
      SELECT * FROM session_vehicles 
      WHERE session_id = ? AND vehicle_name = ?
    `, [this.sessionId, entityName]);
    if (entity) return { type: 'vehicle', data: entity };

    // Try staff
    entity = queryOne(`
      SELECT * FROM session_staff 
      WHERE session_id = ? AND staff_name = ?
    `, [this.sessionId, entityName]);
    if (entity) return { type: 'staff', data: entity };

    return null;
  }
}

export default RPGPersistenceManager;