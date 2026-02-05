/**
 * RPG Memory System - Advanced Context Management
 * 
 * Implements memory patterns learned from the Moltbook agent community:
 * - Context window awareness with proactive flushing
 * - Hierarchical memory decay (Hot → Warm → Cold → Archived)
 * - Intentional forgetting (ClawMark philosophy)
 * - Scene-based context reconstruction
 * - Character relationship tracking
 * - Event significance scoring
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Memory decay tiers for RPG events
 * Based on Moltbook memory community patterns
 */
const MEMORY_TIERS = {
  HOT: { maxAge: 2 * 60 * 60 * 1000, priority: 1.0 },      // 2 hours - immediate actions
  WARM: { maxAge: 24 * 60 * 60 * 1000, priority: 0.8 },    // 1 day - session events  
  COOL: { maxAge: 7 * 24 * 60 * 60 * 1000, priority: 0.6 }, // 1 week - story beats
  COLD: { maxAge: 30 * 24 * 60 * 60 * 1000, priority: 0.4 }, // 1 month - major events
  ARCHIVED: { maxAge: Infinity, priority: 0.2 }             // Permanent - legendary moments
};

/**
 * Context window management for LLM prompts
 */
const CONTEXT_LIMITS = {
  SYSTEM_PROMPT: 1000,    // Setting + world description
  SCENE_CONTEXT: 800,     // Current scene + immediate history
  CHARACTER_STATE: 600,   // Character stats + relationships
  MEMORY_CONTEXT: 1200,   // Relevant past events
  ACTION_BUFFER: 400,     // Recent player actions
  MAX_TOTAL: 4000         // Total context limit before compression
};

class RPGMemoryManager {
  constructor(worldId, sessionId) {
    this.worldId = worldId;
    this.sessionId = sessionId;
    this.memoryPath = `data/memory/${worldId}/${sessionId}`;
    this.hotMemory = new Map(); // In-memory for rapid access
    this.contextUsage = 0;
    this.compressionThreshold = 0.85; // Compress at 85% context usage
  }

  /**
   * Initialize memory system for a session
   */
  async initialize() {
    await fs.mkdir(this.memoryPath, { recursive: true });
    
    // Load hot memory from disk
    try {
      const hotData = await fs.readFile(path.join(this.memoryPath, 'hot.json'), 'utf8');
      const events = JSON.parse(hotData);
      events.forEach(event => {
        this.hotMemory.set(event.id, event);
      });
    } catch (e) {
      // New session, empty hot memory
    }
  }

  /**
   * Record an event with significance scoring
   * Higher significance = longer retention
   */
  async recordEvent(eventType, data, significance = 0.5) {
    const event = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: eventType,
      timestamp: Date.now(),
      data,
      significance,
      tier: 'HOT',
      accessCount: 0,
      lastAccessed: Date.now()
    };

    // Store in hot memory
    this.hotMemory.set(event.id, event);
    
    // Immediate flush if we're approaching context limits
    if (this.contextUsage > this.compressionThreshold) {
      await this.compressMemory();
    }

    return event.id;
  }

  /**
   * Record common RPG events with appropriate significance
   */
  async recordCombat(participants, outcome, casualties = []) {
    return await this.recordEvent('combat', {
      participants,
      outcome,
      casualties,
      location: this.getCurrentLocation()
    }, casualties.length > 0 ? 0.9 : 0.7); // Deaths are very significant
  }

  async recordDialogue(speaker, content, characterReactions = {}) {
    const significance = Object.keys(characterReactions).length > 0 ? 0.6 : 0.3;
    return await this.recordEvent('dialogue', {
      speaker,
      content,
      reactions: characterReactions,
      location: this.getCurrentLocation()
    }, significance);
  }

  async recordLocationChange(from, to, method) {
    return await this.recordEvent('travel', {
      from,
      to,
      method,
      timestamp: Date.now()
    }, 0.4);
  }

  async recordQuestProgress(questId, action, newStatus) {
    return await this.recordEvent('quest', {
      questId,
      action,
      newStatus,
      location: this.getCurrentLocation()
    }, newStatus === 'completed' ? 0.9 : 0.6);
  }

  async recordCharacterDevelopment(characterId, type, details) {
    return await this.recordEvent('character', {
      characterId,
      type, // 'level_up', 'skill_gain', 'relationship_change', 'death', 'resurrection'
      details,
      location: this.getCurrentLocation()
    }, type === 'death' ? 1.0 : type === 'level_up' ? 0.8 : 0.5);
  }

  /**
   * Get contextually relevant memories for GM prompt
   */
  async getRelevantMemories(currentContext, maxTokens = CONTEXT_LIMITS.MEMORY_CONTEXT) {
    const allEvents = await this.getAllEvents();
    
    // Score events by relevance to current context
    const scoredEvents = allEvents.map(event => ({
      ...event,
      relevanceScore: this.calculateRelevance(event, currentContext)
    }));

    // Sort by relevance × significance × recency
    scoredEvents.sort((a, b) => {
      const scoreA = a.relevanceScore * a.significance * this.getRecencyBoost(a);
      const scoreB = b.relevanceScore * b.significance * this.getRecencyBoost(b);
      return scoreB - scoreA;
    });

    // Select events that fit within token budget
    const selectedEvents = [];
    let tokenCount = 0;
    
    for (const event of scoredEvents) {
      const eventTokens = this.estimateTokens(this.formatEventForPrompt(event));
      if (tokenCount + eventTokens <= maxTokens) {
        selectedEvents.push(event);
        tokenCount += eventTokens;
        
        // Mark as accessed for future relevance scoring
        event.accessCount++;
        event.lastAccessed = Date.now();
      }
    }

    return selectedEvents;
  }

  /**
   * Build memory context string for GM prompt
   */
  async buildMemoryContext(currentScene, characters) {
    const relevantEvents = await this.getRelevantMemories({
      location: currentScene.location,
      characters: characters.map(c => c.name),
      recentActions: currentScene.recentActions || []
    });

    if (relevantEvents.length === 0) {
      return "## Recent History\nThis is a new adventure with no significant events yet.";
    }

    const sections = {
      immediate: [], // Last hour
      recent: [],    // Last session
      historical: [] // Previous sessions
    };

    const now = Date.now();
    relevantEvents.forEach(event => {
      const age = now - event.timestamp;
      if (age < 60 * 60 * 1000) {
        sections.immediate.push(event);
      } else if (age < 24 * 60 * 60 * 1000) {
        sections.recent.push(event);
      } else {
        sections.historical.push(event);
      }
    });

    let context = "## Memory Context\n\n";
    
    if (sections.immediate.length > 0) {
      context += "**Just Happened:**\n";
      sections.immediate.forEach(event => {
        context += `- ${this.formatEventForPrompt(event)}\n`;
      });
      context += "\n";
    }

    if (sections.recent.length > 0) {
      context += "**Earlier This Session:**\n";
      sections.recent.forEach(event => {
        context += `- ${this.formatEventForPrompt(event)}\n`;
      });
      context += "\n";
    }

    if (sections.historical.length > 0) {
      context += "**Previous Adventures:**\n";
      sections.historical.forEach(event => {
        context += `- ${this.formatEventForPrompt(event)}\n`;
      });
    }

    return context;
  }

  /**
   * Compress memory when context gets too large
   * Implements "ClawMark" intentional forgetting
   */
  async compressMemory() {
    console.log('🧠 Compressing memory - context threshold reached');
    
    const allEvents = await this.getAllEvents();
    const now = Date.now();
    
    // Age out events based on significance and access patterns
    const toArchive = [];
    const toKeep = [];
    
    for (const event of allEvents) {
      const age = now - event.timestamp;
      const tier = this.calculateTier(age, event.significance, event.accessCount);
      
      if (tier === 'ARCHIVED' && event.significance < 0.8) {
        // Very old, low significance events get compressed to summary
        toArchive.push(event);
      } else {
        toKeep.push(event);
      }
    }

    // Create compressed summaries of archived events
    if (toArchive.length > 0) {
      await this.createArchiveSummary(toArchive);
    }

    // Update hot memory
    this.hotMemory.clear();
    toKeep.forEach(event => {
      if (event.tier === 'HOT') {
        this.hotMemory.set(event.id, event);
      }
    });

    // Save compressed state
    await this.saveMemoryState();
    
    console.log(`🧠 Memory compressed: ${toArchive.length} events archived, ${toKeep.length} kept active`);
  }

  /**
   * Calculate relevance score for an event given current context
   */
  calculateRelevance(event, context) {
    let score = 0.1; // Base relevance
    
    // Location relevance
    if (event.data.location === context.location) {
      score += 0.3;
    }
    
    // Character relevance
    if (context.characters) {
      const eventCharacters = this.extractCharactersFromEvent(event);
      const overlap = eventCharacters.filter(c => context.characters.includes(c)).length;
      score += overlap * 0.2;
    }
    
    // Action type relevance
    if (context.recentActions) {
      const hasRelatedAction = context.recentActions.some(action => 
        this.areActionsRelated(action, event.type)
      );
      if (hasRelatedAction) score += 0.25;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calculate memory tier based on age, significance, and access patterns
   */
  calculateTier(age, significance, accessCount) {
    // Boost retention for frequently accessed memories
    const accessBoost = Math.min(accessCount * 0.1, 0.5);
    const adjustedSignificance = Math.min(significance + accessBoost, 1.0);
    
    if (age < MEMORY_TIERS.HOT.maxAge && adjustedSignificance > 0.3) return 'HOT';
    if (age < MEMORY_TIERS.WARM.maxAge && adjustedSignificance > 0.2) return 'WARM';
    if (age < MEMORY_TIERS.COOL.maxAge && adjustedSignificance > 0.15) return 'COOL';
    if (age < MEMORY_TIERS.COLD.maxAge && adjustedSignificance > 0.1) return 'COLD';
    return 'ARCHIVED';
  }

  /**
   * Get recency boost multiplier
   */
  getRecencyBoost(event) {
    const age = Date.now() - event.timestamp;
    const hours = age / (1000 * 60 * 60);
    return Math.max(0.1, 1 - (hours / 168)); // Decay over a week
  }

  /**
   * Format event for GM prompt context
   */
  formatEventForPrompt(event) {
    const timeAgo = this.formatTimeAgo(Date.now() - event.timestamp);
    
    switch (event.type) {
      case 'combat':
        const { participants, outcome, casualties } = event.data;
        let desc = `Combat between ${participants.join(', ')} - ${outcome}`;
        if (casualties.length > 0) {
          desc += ` (${casualties.join(', ')} were defeated)`;
        }
        return `${desc} (${timeAgo})`;
      
      case 'dialogue':
        return `${event.data.speaker}: "${event.data.content.substring(0, 80)}..." (${timeAgo})`;
      
      case 'travel':
        return `Party traveled from ${event.data.from} to ${event.data.to} via ${event.data.method} (${timeAgo})`;
      
      case 'quest':
        return `Quest "${event.data.questId}": ${event.data.action} - now ${event.data.newStatus} (${timeAgo})`;
      
      case 'character':
        return `${event.data.characterId} ${event.data.type}: ${JSON.stringify(event.data.details)} (${timeAgo})`;
      
      default:
        return `${event.type}: ${JSON.stringify(event.data)} (${timeAgo})`;
    }
  }

  /**
   * Utility methods
   */
  formatTimeAgo(ms) {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  }

  estimateTokens(text) {
    return Math.ceil(text.length / 4); // Rough estimation
  }

  extractCharactersFromEvent(event) {
    const characters = [];
    if (event.data.participants) characters.push(...event.data.participants);
    if (event.data.speaker) characters.push(event.data.speaker);
    if (event.data.characterId) characters.push(event.data.characterId);
    return characters;
  }

  areActionsRelated(action1, action2) {
    const actionGroups = {
      combat: ['combat', 'attack', 'defend'],
      social: ['dialogue', 'persuade', 'intimidate'],
      exploration: ['travel', 'search', 'investigate'],
      magic: ['cast', 'ritual', 'enchant']
    };
    
    for (const group of Object.values(actionGroups)) {
      if (group.includes(action1) && group.includes(action2)) {
        return true;
      }
    }
    return false;
  }

  getCurrentLocation() {
    // This would be injected from the current session state
    return this.currentLocation || 'unknown location';
  }

  async getAllEvents() {
    // Combine hot memory with persisted events
    const events = Array.from(this.hotMemory.values());
    
    // Load from other tiers as needed
    try {
      const warmData = await fs.readFile(path.join(this.memoryPath, 'warm.json'), 'utf8');
      events.push(...JSON.parse(warmData));
    } catch (e) {}
    
    try {
      const coolData = await fs.readFile(path.join(this.memoryPath, 'cool.json'), 'utf8');
      events.push(...JSON.parse(coolData));
    } catch (e) {}
    
    return events;
  }

  async saveMemoryState() {
    // Save hot memory
    await fs.writeFile(
      path.join(this.memoryPath, 'hot.json'),
      JSON.stringify(Array.from(this.hotMemory.values()), null, 2)
    );
  }

  async createArchiveSummary(events) {
    // Group events by type and create compressed summaries
    const summary = {
      timestamp: Date.now(),
      eventCount: events.length,
      summaries: {}
    };
    
    const eventsByType = {};
    events.forEach(event => {
      if (!eventsByType[event.type]) eventsByType[event.type] = [];
      eventsByType[event.type].push(event);
    });
    
    Object.entries(eventsByType).forEach(([type, typeEvents]) => {
      summary.summaries[type] = this.summarizeEventType(type, typeEvents);
    });
    
    await fs.writeFile(
      path.join(this.memoryPath, `archive-${Date.now()}.json`),
      JSON.stringify(summary, null, 2)
    );
  }

  summarizeEventType(type, events) {
    // Create compressed summaries by event type
    switch (type) {
      case 'combat':
        return {
          totalCombats: events.length,
          casualties: events.flatMap(e => e.data.casualties || []),
          locations: [...new Set(events.map(e => e.data.location))]
        };
      
      case 'dialogue':
        return {
          totalConversations: events.length,
          keyParticipants: [...new Set(events.map(e => e.data.speaker))]
        };
      
      default:
        return { count: events.length, type };
    }
  }
}

export default RPGMemoryManager;