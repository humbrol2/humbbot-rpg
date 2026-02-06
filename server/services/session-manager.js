/**
 * Enhanced Session Manager with Memory Integration
 * 
 * Manages game sessions with advanced memory and context tracking:
 * - Automatic memory management
 * - Scene transition tracking
 * - Character relationship evolution
 * - Context window awareness
 * - Proactive memory compression
 */

import EnhancedRPGMemoryManager from './enhanced-memory.js';
import { generateGMResponse } from './llm.js';

export class EnhancedSessionManager {
  constructor(worldId, sessionId) {
    this.worldId = worldId;
    this.sessionId = sessionId;
    this.memory = new EnhancedRPGMemoryManager(worldId, sessionId);
    this.session = null;
    this.contextUsage = 0;
    this.lastMemoryFlush = Date.now();
  }

  /**
   * Initialize the session with memory system
   */
  async initialize(world, sessionData = null) {
    await this.memory.initialize();
    
    this.session = sessionData || {
      id: this.sessionId,
      worldId: this.worldId,
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
        startTime: Date.now(),
        actions: 0,
        scenes: 1,
        memoryEvents: 0
      }
    };

    // Record session start
    await this.memory.recordEvent('session_start', {
      world: world.name,
      setting: world.setting,
      startTime: Date.now()
    }, 0.8);

    return this.session;
  }

  /**
   * Process player action with full memory integration
   */
  async processPlayerAction(world, action, options = {}) {
    const {
      sceneType = this.detectSceneType(action),
      importance = this.calculateActionImportance(action),
      style = 'balanced'
    } = options;

    // Check if we need memory compression
    if (this.shouldCompressMemory()) {
      await this.memory.compressMemory();
    }

    // Generate GM response with memory context
    const response = await generateGMResponse(world, this.session, action, this.memory, {
      sceneType,
      importance,
      style,
      recordAction: true
    });

    // Update session state
    this.updateSessionState(action, response, sceneType);
    
    // Track character relationships from the interaction
    await this.updateRelationships(action, response);

    // Update session statistics
    this.session.sessionStats.actions++;
    this.session.sessionStats.memoryEvents = await this.getMemoryEventCount();

    return {
      response,
      sceneType,
      importance,
      memoryEvents: this.session.sessionStats.memoryEvents,
      contextUsage: this.contextUsage
    };
  }

  /**
   * Update session state based on action and response
   */
  updateSessionState(action, response, sceneType) {
    // Add to message history
    this.session.messageHistory.push(
      { role: 'user', content: action },
      { role: 'assistant', content: response }
    );

    // Add to recent history (summary format)
    const actionSummary = this.summarizeAction(action, response);
    this.session.recentHistory.push(actionSummary);
    
    // Keep recent history manageable
    if (this.session.recentHistory.length > 10) {
      this.session.recentHistory = this.session.recentHistory.slice(-8);
    }

    // Update scene if location change detected
    const locationChange = this.detectLocationChange(response);
    if (locationChange) {
      this.transitionScene(locationChange);
    }

    // Update NPCs if new characters introduced
    const newNPCs = this.extractNewNPCs(response);
    if (newNPCs.length > 0) {
      this.session.currentScene.npcs.push(...newNPCs);
    }
  }

  /**
   * Detect scene type from player action
   */
  detectSceneType(action) {
    const actionLower = action.toLowerCase();
    
    if (actionLower.match(/\b(attack|fight|shoot|cast|defend|battle)\b/)) {
      return 'combat';
    } else if (actionLower.match(/\b(say|tell|ask|speak|talk)\b/) || action.includes('"')) {
      return 'dialogue';  
    } else if (actionLower.match(/\b(go|move|travel|enter|leave|explore)\b/)) {
      return 'exploration';
    } else if (actionLower.match(/\b(search|examine|investigate|solve|puzzle)\b/)) {
      return 'puzzle';
    } else {
      return 'story';
    }
  }

  /**
   * Calculate importance of an action for memory weighting
   */
  calculateActionImportance(action) {
    let importance = 0.3; // Base importance
    
    const actionLower = action.toLowerCase();
    
    // High importance indicators
    if (actionLower.includes('kill') || actionLower.includes('die')) importance += 0.4;
    if (actionLower.includes('love') || actionLower.includes('marry')) importance += 0.3;
    if (actionLower.includes('betray') || actionLower.includes('lie')) importance += 0.3;
    if (actionLower.includes('reveal') || actionLower.includes('confess')) importance += 0.2;
    if (actionLower.includes('quest') || actionLower.includes('mission')) importance += 0.2;
    
    // Medium importance indicators  
    if (actionLower.match(/\b(give|take|steal|buy|sell)\b/)) importance += 0.1;
    if (actionLower.match(/\b(join|leave|follow)\b/)) importance += 0.15;
    
    return Math.min(importance, 1.0);
  }

  /**
   * Update character relationships based on interactions
   */
  async updateRelationships(action, response) {
    // Extract character names from action and response
    const mentionedCharacters = this.extractCharacterNames(action + ' ' + response);
    
    if (mentionedCharacters.length === 0) return;

    // Analyze sentiment of the interaction
    const sentiment = this.analyzeSentiment(action, response);
    
    for (const character of mentionedCharacters) {
      if (!this.session.relationships[character]) {
        this.session.relationships[character] = {
          trust: 0,
          respect: 0,
          affection: 0,
          fear: 0,
          lastInteraction: Date.now(),
          interactionCount: 0
        };
      }

      const relationship = this.session.relationships[character];
      
      // Update relationship based on sentiment
      if (sentiment.positive > sentiment.negative) {
        relationship.trust += 0.1;
        relationship.affection += 0.05;
      } else if (sentiment.negative > sentiment.positive) {
        relationship.trust -= 0.1;
        relationship.fear += 0.05;
      }
      
      relationship.interactionCount++;
      relationship.lastInteraction = Date.now();
      
      // Record significant relationship changes
      if (Math.abs(relationship.trust) > 0.5) {
        await this.memory.recordEvent('relationship_change', {
          character,
          relationship: { ...relationship },
          trigger: action.substring(0, 100)
        }, 0.6);
      }
    }
  }

  /**
   * Simple sentiment analysis for relationship tracking
   */
  analyzeSentiment(action, response) {
    const positiveWords = ['help', 'save', 'protect', 'friend', 'ally', 'trust', 'love', 'respect', 'honor'];
    const negativeWords = ['attack', 'hurt', 'betray', 'enemy', 'hate', 'fear', 'threaten', 'kill', 'steal'];
    
    const text = (action + ' ' + response).toLowerCase();
    
    const positive = positiveWords.filter(word => text.includes(word)).length;
    const negative = negativeWords.filter(word => text.includes(word)).length;
    
    return { positive, negative, neutral: Math.max(0, text.split(' ').length - positive - negative) };
  }

  /**
   * Scene transition management
   */
  async transitionScene(locationChange) {
    // Record the scene transition
    await this.memory.recordLocationChange(
      this.session.currentScene.location,
      locationChange.to,
      locationChange.method || 'travel'
    );

    // Update current scene
    const previousScene = { ...this.session.currentScene };
    this.session.currentScene = {
      name: locationChange.name || locationChange.to,
      location: locationChange.to,
      description: locationChange.description || 'A new location to explore.',
      npcs: [],
      threats: [],
      opportunities: [],
      previousScene: previousScene.location
    };

    this.session.sessionStats.scenes++;
  }

  /**
   * Determine if memory compression is needed
   */
  shouldCompressMemory() {
    const timeSinceLastFlush = Date.now() - this.lastMemoryFlush;
    const messageHistorySize = this.session.messageHistory.length;
    
    // Compress if it's been over an hour or message history is large
    return timeSinceLastFlush > 60 * 60 * 1000 || messageHistorySize > 50;
  }

  /**
   * Get current memory event count
   */
  async getMemoryEventCount() {
    const events = await this.memory.getAllEvents();
    return events.length;
  }

  /**
   * Utility methods
   */
  summarizeAction(action, response) {
    const actionType = this.detectSceneType(action);
    const timestamp = new Date().toLocaleTimeString();
    return `[${timestamp}] ${actionType}: ${action.substring(0, 50)}...`;
  }

  detectLocationChange(response) {
    const locationPatterns = [
      /(?:arrive|enter|reach|travel to)\s+(?:the\s+)?([^.!?]+)/i,
      /(?:you find yourself in)\s+([^.!?]+)/i,
      /(?:the scene changes to)\s+([^.!?]+)/i
    ];

    for (const pattern of locationPatterns) {
      const match = response.match(pattern);
      if (match) {
        return {
          to: match[1].trim(),
          method: 'travel'
        };
      }
    }

    return null;
  }

  extractNewNPCs(response) {
    // Simple NPC extraction - could be enhanced with NER
    const npcPatterns = [
      /(?:meet|encounter|see)\s+([A-Z][a-z]+)/g,
      /([A-Z][a-z]+)\s+(?:says|tells|asks)/g
    ];

    const npcs = [];
    for (const pattern of npcPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const name = match[1];
        if (name && !npcs.some(npc => npc.name === name)) {
          npcs.push({
            name,
            role: 'unknown',
            disposition: 'neutral',
            firstMet: Date.now()
          });
        }
      }
    }

    return npcs;
  }

  extractCharacterNames(text) {
    // Extract capitalized words that might be character names
    const words = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
    return [...new Set(words)].filter(word => 
      !['The', 'You', 'Your', 'This', 'That', 'They'].includes(word)
    );
  }

  /**
   * Get session status for debugging/monitoring
   */
  getSessionStatus() {
    return {
      sessionId: this.sessionId,
      worldId: this.worldId,
      currentScene: this.session.currentScene.name,
      location: this.session.currentScene.location,
      characters: this.session.characters.length,
      messageHistory: this.session.messageHistory.length,
      relationships: Object.keys(this.session.relationships).length,
      sessionStats: this.session.sessionStats,
      memoryStatus: {
        hotMemorySize: this.memory.hotMemory.size,
        lastCompression: this.lastMemoryFlush
      }
    };
  }

  /**
   * Save session state
   */
  async saveSession() {
    await this.memory.saveMemoryState();
    return this.session;
  }
}

export default EnhancedSessionManager;