/**
 * Vector Memory System for HumbBot RPG
 * Integrates semantic search with the existing RPG memory system
 * Based on enhanced-memory-system.mjs patterns
 */

import fs from 'fs/promises';
import path from 'path';

class VectorMemoryEnhancer {
  constructor(options = {}) {
    this.embeddingServiceUrl = options.embeddingServiceUrl || 'http://127.0.0.1:8082/v1/embeddings';
    this.vectorStorePath = options.vectorStorePath || './data/vector-memory';
    this.vectors = new Map();
    this.metadata = new Map();
    this.initialized = false;
  }

  /**
   * Initialize vector memory system
   */
  async initialize() {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.vectorStorePath, { recursive: true });
      await this.loadVectorStore();
      this.initialized = true;
      console.log('🧠 Vector memory system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize vector memory:', error.message);
      throw error;
    }
  }

  /**
   * Generate embedding for text content
   */
  async generateEmbedding(text) {
    try {
      const response = await fetch(this.embeddingServiceUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          input: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Embedding service error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('❌ Failed to generate embedding:', error.message);
      return null;
    }
  }

  /**
   * Store RPG event with vector embedding
   */
  async storeEvent(eventId, eventData, eventText) {
    if (!this.initialized) await this.initialize();

    try {
      const embedding = await this.generateEmbedding(eventText);
      if (!embedding) return false;

      this.vectors.set(eventId, embedding);
      this.metadata.set(eventId, {
        ...eventData,
        text: eventText,
        timestamp: Date.now(),
        access_count: 0
      });

      await this.saveVectorStore();
      console.log(`🧠 Stored vector memory for event: ${eventId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to store event ${eventId}:`, error.message);
      return false;
    }
  }

  /**
   * Search for semantically similar events
   */
  async semanticSearch(query, limit = 10, threshold = 0.3) {
    if (!this.initialized) await this.initialize();

    try {
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) return [];

      const similarities = [];
      
      for (const [eventId, vector] of this.vectors) {
        const similarity = this.cosineSimilarity(queryEmbedding, vector);
        if (similarity >= threshold) {
          similarities.push({
            eventId,
            similarity,
            metadata: this.metadata.get(eventId)
          });
        }
      }

      // Sort by similarity and limit results
      similarities.sort((a, b) => b.similarity - a.similarity);
      const results = similarities.slice(0, limit);

      // Update access counts
      results.forEach(result => {
        const meta = this.metadata.get(result.eventId);
        if (meta) {
          meta.access_count++;
          meta.last_accessed = Date.now();
        }
      });

      console.log(`🔍 Vector search for "${query}" found ${results.length} results`);
      return results;
    } catch (error) {
      console.error('❌ Vector search failed:', error.message);
      return [];
    }
  }

  /**
   * Get contextually relevant memories for current scene
   */
  async getContextualMemories(currentScene, characters, recentActions, limit = 8) {
    if (!this.initialized) await this.initialize();

    // Build search query from current context
    const contextParts = [];
    if (currentScene?.location) contextParts.push(`location: ${currentScene.location}`);
    if (characters?.length) contextParts.push(`characters: ${characters.map(c => c.name || c).join(', ')}`);
    if (recentActions?.length) contextParts.push(`actions: ${recentActions.join(', ')}`);
    
    const contextQuery = contextParts.join(' ');
    
    if (!contextQuery.trim()) {
      console.log('🧠 No context provided for vector search');
      return [];
    }

    const results = await this.semanticSearch(contextQuery, limit);
    
    console.log(`🧠 Found ${results.length} contextual memories for: ${contextQuery}`);
    return results.map(r => ({
      eventId: r.eventId,
      similarity: r.similarity,
      ...r.metadata
    }));
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Load vector store from disk
   */
  async loadVectorStore() {
    const vectorFile = path.join(this.vectorStorePath, 'vectors.json');
    const metadataFile = path.join(this.vectorStorePath, 'metadata.json');

    try {
      const [vectorData, metadataData] = await Promise.all([
        fs.readFile(vectorFile, 'utf8').catch(() => '{}'),
        fs.readFile(metadataFile, 'utf8').catch(() => '{}')
      ]);

      const vectors = JSON.parse(vectorData);
      const metadata = JSON.parse(metadataData);

      this.vectors.clear();
      this.metadata.clear();

      Object.entries(vectors).forEach(([id, vector]) => {
        this.vectors.set(id, vector);
      });

      Object.entries(metadata).forEach(([id, meta]) => {
        this.metadata.set(id, meta);
      });

      console.log(`🧠 Loaded ${this.vectors.size} vector memories from disk`);
    } catch (error) {
      console.log('🧠 Starting with empty vector memory store');
    }
  }

  /**
   * Save vector store to disk
   */
  async saveVectorStore() {
    const vectorFile = path.join(this.vectorStorePath, 'vectors.json');
    const metadataFile = path.join(this.vectorStorePath, 'metadata.json');

    try {
      const vectorData = Object.fromEntries(this.vectors);
      const metadataData = Object.fromEntries(this.metadata);

      await Promise.all([
        fs.writeFile(vectorFile, JSON.stringify(vectorData, null, 2)),
        fs.writeFile(metadataFile, JSON.stringify(metadataData, null, 2))
      ]);
    } catch (error) {
      console.error('❌ Failed to save vector store:', error.message);
    }
  }

  /**
   * Enhanced RPG event formatting for vector storage
   */
  formatEventForVector(eventType, eventData) {
    switch (eventType) {
      case 'combat':
        const { participants, outcome, casualties, location } = eventData;
        let text = `Combat at ${location} between ${participants?.join(', ')}. Outcome: ${outcome}.`;
        if (casualties?.length > 0) {
          text += ` Casualties: ${casualties.join(', ')}.`;
        }
        return text;

      case 'dialogue':
        const { speaker, content, reactions, location: dialogueLocation } = eventData;
        let dialogueText = `${speaker} said: "${content}" at ${dialogueLocation}.`;
        if (reactions && Object.keys(reactions).length > 0) {
          const reactionText = Object.entries(reactions)
            .map(([char, reaction]) => `${char} reacted: ${reaction}`)
            .join(', ');
          dialogueText += ` Reactions: ${reactionText}.`;
        }
        return dialogueText;

      case 'travel':
        const { from, to, method } = eventData;
        return `Party traveled from ${from} to ${to} via ${method}.`;

      case 'quest':
        const { questId, action, newStatus, location: questLocation } = eventData;
        return `Quest "${questId}" at ${questLocation}: ${action}. Status changed to ${newStatus}.`;

      case 'character':
        const { characterId, type, details, location: charLocation } = eventData;
        return `Character ${characterId} at ${charLocation}: ${type}. Details: ${JSON.stringify(details)}.`;

      default:
        return `Event type ${eventType}: ${JSON.stringify(eventData)}`;
    }
  }

  /**
   * Get vector memory statistics
   */
  getStats() {
    const stats = {
      totalEvents: this.vectors.size,
      initialized: this.initialized,
      storePath: this.vectorStorePath
    };

    if (this.metadata.size > 0) {
      const accessCounts = Array.from(this.metadata.values()).map(m => m.access_count || 0);
      stats.averageAccessCount = accessCounts.reduce((a, b) => a + b, 0) / accessCounts.length;
      stats.maxAccessCount = Math.max(...accessCounts);
    }

    return stats;
  }
}

export default VectorMemoryEnhancer;