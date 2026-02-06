/**
 * Enhanced RPG Memory Manager
 * Combines traditional memory patterns with vector semantic search
 * Integrates with existing memory.js and new vector-memory.js
 */

import RPGMemoryManager from './memory.js';
import VectorMemoryEnhancer from './vector-memory.js';

class EnhancedRPGMemoryManager extends RPGMemoryManager {
  constructor(worldId, sessionId, options = {}) {
    super(worldId, sessionId);
    
    this.vectorMemory = new VectorMemoryEnhancer({
      vectorStorePath: `data/vector-memory/${worldId}/${sessionId}`,
      embeddingServiceUrl: options.embeddingServiceUrl || 'http://127.0.0.1:8082/v1/embeddings'
    });
    
    this.hybridMode = true; // Use both traditional and vector memory
    this.vectorWeight = 0.7; // Weight for vector vs traditional search
  }

  /**
   * Initialize both memory systems
   */
  async initialize() {
    await Promise.all([
      super.initialize(),
      this.vectorMemory.initialize()
    ]);
    console.log('🧠 Enhanced RPG memory system ready');
  }

  /**
   * Enhanced event recording with vector storage
   */
  async recordEvent(eventType, data, significance = 0.5) {
    // Record in traditional memory system
    const eventId = await super.recordEvent(eventType, data, significance);
    
    // Also store in vector memory for semantic search
    if (this.vectorMemory.initialized) {
      const eventText = this.vectorMemory.formatEventForVector(eventType, data);
      await this.vectorMemory.storeEvent(eventId, {
        type: eventType,
        significance,
        timestamp: Date.now(),
        ...data
      }, eventText);
    }
    
    return eventId;
  }

  /**
   * Enhanced memory retrieval combining vector and traditional search
   */
  async getRelevantMemories(currentContext, maxTokens = 1200) {
    if (!this.hybridMode) {
      return await super.getRelevantMemories(currentContext, maxTokens);
    }

    // Get memories from both systems
    const [traditionalMemories, vectorMemories] = await Promise.all([
      super.getRelevantMemories(currentContext, Math.floor(maxTokens * (1 - this.vectorWeight))),
      this.getVectorMemories(currentContext, Math.floor(maxTokens * this.vectorWeight))
    ]);

    // Combine and deduplicate
    const combinedMemories = this.combineMemories(traditionalMemories, vectorMemories);
    
    // Sort by combined relevance score
    combinedMemories.sort((a, b) => {
      const scoreA = (a.relevanceScore || 0) * (a.significance || 0.5) * this.getRecencyBoost(a);
      const scoreB = (b.relevanceScore || 0) * (b.significance || 0.5) * this.getRecencyBoost(b);
      return scoreB - scoreA;
    });

    console.log(`🧠 Enhanced search found ${combinedMemories.length} relevant memories`);
    return combinedMemories;
  }

  /**
   * Get memories using vector semantic search
   */
  async getVectorMemories(currentContext, maxTokens) {
    try {
      const { location, characters, recentActions } = currentContext;
      
      const vectorResults = await this.vectorMemory.getContextualMemories(
        { location },
        characters,
        recentActions,
        10 // Get top 10 semantic matches
      );

      // Convert vector results to memory format
      const memories = vectorResults.map(result => ({
        id: result.eventId,
        type: result.type,
        timestamp: result.timestamp,
        data: result,
        significance: result.significance || 0.5,
        relevanceScore: result.similarity, // Use similarity as relevance
        vectorMatch: true
      }));

      // Filter by token budget
      let tokenCount = 0;
      const filteredMemories = [];
      
      for (const memory of memories) {
        const tokens = this.estimateTokens(this.formatEventForPrompt(memory));
        if (tokenCount + tokens <= maxTokens) {
          filteredMemories.push(memory);
          tokenCount += tokens;
        }
      }

      return filteredMemories;
    } catch (error) {
      console.error('❌ Vector memory search failed:', error.message);
      return [];
    }
  }

  /**
   * Combine traditional and vector memories, removing duplicates
   */
  combineMemories(traditional, vector) {
    const combined = [...traditional];
    const traditionalIds = new Set(traditional.map(m => m.id));

    // Add vector memories that aren't already in traditional results
    vector.forEach(vectorMemory => {
      if (!traditionalIds.has(vectorMemory.id)) {
        combined.push(vectorMemory);
      } else {
        // Enhance traditional memory with vector similarity score
        const existing = combined.find(m => m.id === vectorMemory.id);
        if (existing && vectorMemory.vectorMatch) {
          existing.vectorSimilarity = vectorMemory.relevanceScore;
          existing.relevanceScore = Math.max(existing.relevanceScore || 0, vectorMemory.relevanceScore);
        }
      }
    });

    return combined;
  }

  /**
   * Enhanced memory context with semantic awareness
   */
  async buildMemoryContext(currentScene, characters) {
    const relevantEvents = await this.getRelevantMemories({
      location: currentScene.location,
      characters: characters.map(c => c.name || c),
      recentActions: currentScene.recentActions || []
    });

    if (relevantEvents.length === 0) {
      return "## Recent History\\nThis is a new adventure with no significant events yet.";
    }

    // Group by relevance type
    const sections = {
      semantic: [],     // High vector similarity
      immediate: [],    // Recent traditional
      historical: []    // Older but significant
    };

    const now = Date.now();
    relevantEvents.forEach(event => {
      const age = now - event.timestamp;
      
      if (event.vectorMatch && event.relevanceScore > 0.7) {
        sections.semantic.push(event);
      } else if (age < 60 * 60 * 1000) { // Last hour
        sections.immediate.push(event);
      } else {
        sections.historical.push(event);
      }
    });

    let context = "## Enhanced Memory Context\\n\\n";
    
    if (sections.semantic.length > 0) {
      context += "**Semantically Related Events:**\\n";
      sections.semantic.forEach(event => {
        const similarity = event.vectorSimilarity || event.relevanceScore;
        context += `- ${this.formatEventForPrompt(event)} [similarity: ${(similarity * 100).toFixed(1)}%]\\n`;
      });
      context += "\\n";
    }

    if (sections.immediate.length > 0) {
      context += "**Just Happened:**\\n";
      sections.immediate.forEach(event => {
        context += `- ${this.formatEventForPrompt(event)}\\n`;
      });
      context += "\\n";
    }

    if (sections.historical.length > 0) {
      context += "**Related History:**\\n";
      sections.historical.forEach(event => {
        context += `- ${this.formatEventForPrompt(event)}\\n`;
      });
    }

    return context;
  }

  /**
   * Search memories by natural language query
   */
  async searchMemories(query, limit = 10) {
    if (!this.vectorMemory.initialized) {
      console.warn('🧠 Vector memory not available, falling back to traditional search');
      return [];
    }

    try {
      const results = await this.vectorMemory.semanticSearch(query, limit);
      
      if (!results || results.length === 0) {
        return [];
      }

      return results.map(result => ({
        eventId: result.eventId,
        similarity: result.similarity,
        text: result.metadata?.text || 'No text available',
        type: result.metadata?.type || 'unknown',
        timestamp: result.metadata?.timestamp || Date.now(),
        data: result.metadata || {}
      }));
    } catch (error) {
      console.error('❌ Search memories failed:', error.message);
      return [];
    }
  }

  /**
   * Get system statistics
   */
  async getStats() {
    const traditional = {
      hotMemorySize: this.hotMemory.size,
      currentLocation: this.getCurrentLocation(),
      contextUsage: this.contextUsage
    };

    const vector = this.vectorMemory.getStats();

    return {
      traditional,
      vector,
      hybridMode: this.hybridMode,
      vectorWeight: this.vectorWeight
    };
  }

  /**
   * Compress both memory systems
   */
  async compressMemory() {
    console.log('🧠 Compressing enhanced memory systems');
    
    // Run traditional compression
    await super.compressMemory();
    
    // Save vector memory state
    await this.vectorMemory.saveVectorStore();
    
    console.log('🧠 Enhanced memory compression complete');
  }

  /**
   * Debug method to test memory systems
   */
  async debugMemorySearch(query) {
    console.log(`\\n🔍 Debug Memory Search: \"${query}\"`);
    
    // Traditional search
    const traditional = await super.getRelevantMemories({
      location: 'debug',
      characters: ['debug'],
      recentActions: [query]
    });
    
    // Vector search  
    const vector = await this.searchMemories(query);
    
    console.log(`Traditional found: ${traditional.length} events`);
    console.log(`Vector found: ${vector.length} events`);
    
    return { traditional, vector };
  }
}

export default EnhancedRPGMemoryManager;