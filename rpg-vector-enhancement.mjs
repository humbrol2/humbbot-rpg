#!/usr/bin/env node

/**
 * HumbBot RPG Vector Memory Enhancement
 * 
 * Adds semantic memory to the RPG for character persistence,
 * NPC relationships, and world state continuity.
 */

import { EnhancedMemorySystem } from './enhanced-memory-system.mjs';

class RPGVectorMemory {
    constructor() {
        this.memorySystem = new EnhancedMemorySystem();
        this.currentSession = null;
        this.characters = new Map();
    }
    
    async initializeSession(sessionId, worldType = 'fantasy') {
        this.currentSession = sessionId;
        console.log(`🎮 Initializing RPG memory for session: ${sessionId} (${worldType})`);
        
        // Index any existing session memories
        await this.memorySystem.indexExistingMemories();
        
        // Load world context
        await this.loadWorldContext(worldType);
        
        return sessionId;
    }
    
    async loadWorldContext(worldType) {
        const worldKnowledge = {
            fantasy: [
                'Magic requires study and practice. Spells can fail if not properly learned.',
                'The kingdom has complex politics between nobles, merchants, and common folk.',
                'Ancient ruins often contain both treasures and dangerous guardians.',
                'Dragons are intelligent and remember interactions for centuries.'
            ],
            scifi: [
                'Quantum drives require rare crystals and proper navigation computers.',
                'AI regulations vary between corporate sectors and independent stations.',
                'Alien contact protocols exist but enforcement is inconsistent.',
                'Corporate factions control trade but pirates operate in outer systems.'
            ],
            modern: [
                'Technology is contemporary with smartphones and social media.',
                'Urban areas have economic disparity and various social dynamics.',
                'Government surveillance capabilities are extensive but not omnipresent.',
                'Social movements can form quickly through digital organizing.'
            ]
        };
        
        const knowledge = worldKnowledge[worldType] || worldKnowledge.fantasy;
        
        for (const fact of knowledge) {
            await this.memorySystem.addMemory(
                fact,
                `world_${worldType}`,
                'world_knowledge'
            );
        }
        
        console.log(`📚 Loaded ${knowledge.length} world knowledge entries`);
    }
    
    async addCharacterAction(characterId, action, context = {}) {
        const {
            location = 'unknown location',
            npcs = [],
            outcome = 'unknown',
            emotions = []
        } = context;
        
        const actionMemory = `
Character ${characterId} performed action: ${action}
Location: ${location}
NPCs present: ${npcs.join(', ') || 'none'}
Outcome: ${outcome}
Character's emotional state: ${emotions.join(', ') || 'neutral'}
Session: ${this.currentSession}
        `.trim();
        
        return await this.memorySystem.addMemory(
            actionMemory,
            `character_${characterId}`,
            'character_action'
        );
    }
    
    async addNPCInteraction(npcId, characterId, interaction, sentiment = 'neutral') {
        const interactionMemory = `
NPC ${npcId} interacted with character ${characterId}
Interaction: ${interaction}
NPC's attitude: ${sentiment}
Session: ${this.currentSession}
Context: NPC remembers this interaction for future reference
        `.trim();
        
        return await this.memorySystem.addMemory(
            interactionMemory,
            `npc_${npcId}`,
            'npc_memory'
        );
    }
    
    async addWorldEvent(event, location, impact = 'minor') {
        const eventMemory = `
World event occurred: ${event}
Location: ${location}
Impact level: ${impact}
Session: ${this.currentSession}
Context: This event affects the world state and may influence future interactions
        `.trim();
        
        return await this.memorySystem.addMemory(
            eventMemory,
            `world_events`,
            'world_event'
        );
    }
    
    async getCharacterHistory(characterId, limit = 5) {
        const query = `character ${characterId} action`;
        return await this.memorySystem.memory_search(query, {
            maxResults: limit,
            minScore: 0.5
        });
    }
    
    async getNPCMemoryOfCharacter(npcId, characterId) {
        const query = `NPC ${npcId} character ${characterId} interaction`;
        const interactions = await this.memorySystem.memory_search(query, {
            maxResults: 10,
            minScore: 0.4
        });
        
        // Analyze relationship sentiment
        let sentiment = 'neutral';
        if (interactions.length > 0) {
            const sentiments = interactions.map(i => this.extractSentiment(i.content));
            const positive = sentiments.filter(s => s === 'positive').length;
            const negative = sentiments.filter(s => s === 'negative').length;
            
            if (positive > negative) sentiment = 'positive';
            else if (negative > positive) sentiment = 'negative';
        }
        
        return {
            npcId,
            characterId,
            interactions,
            overallSentiment: sentiment,
            interactionCount: interactions.length
        };
    }
    
    extractSentiment(content) {
        const contentLower = content.toLowerCase();
        
        const positiveWords = ['friendly', 'helpful', 'grateful', 'pleased', 'happy'];
        const negativeWords = ['hostile', 'angry', 'suspicious', 'annoyed', 'upset'];
        
        const positiveCount = positiveWords.reduce((count, word) => 
            count + (contentLower.includes(word) ? 1 : 0), 0);
        const negativeCount = negativeWords.reduce((count, word) => 
            count + (contentLower.includes(word) ? 1 : 0), 0);
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }
    
    async getLocationContext(location, situation = '') {
        const query = `location ${location} ${situation} event`;
        const locationHistory = await this.memorySystem.memory_search(query, {
            maxResults: 5,
            minScore: 0.3
        });
        
        return {
            location,
            recentEvents: locationHistory,
            currentState: this.deriveLocationState(locationHistory)
        };
    }
    
    deriveLocationState(events) {
        if (events.length === 0) return 'normal';
        
        const recentContent = events.map(e => e.content.toLowerCase()).join(' ');
        
        if (recentContent.includes('danger') || recentContent.includes('attack')) return 'dangerous';
        if (recentContent.includes('peaceful') || recentContent.includes('safe')) return 'peaceful';
        if (recentContent.includes('busy') || recentContent.includes('crowded')) return 'active';
        if (recentContent.includes('empty') || recentContent.includes('quiet')) return 'quiet';
        
        return 'normal';
    }
    
    async generateGMPrompt(characterId, currentSituation, location) {
        console.log(`🧠 Generating GM context for ${characterId} in ${location}`);
        
        // Gather relevant context
        const [characterHistory, locationContext, worldContext] = await Promise.all([
            this.getCharacterHistory(characterId, 3),
            this.getLocationContext(location, currentSituation),
            this.memorySystem.memory_search(`${location} world knowledge`, { maxResults: 3 })
        ]);
        
        // Build GM context prompt
        let gmPrompt = `GM Context for ${characterId} in ${location}:\n\n`;
        
        gmPrompt += `Current Situation: ${currentSituation}\n\n`;
        
        if (characterHistory.length > 0) {
            gmPrompt += `Character Background:\n`;
            characterHistory.forEach(memory => {
                const action = this.extractAction(memory.content);
                gmPrompt += `- ${action}\n`;
            });
            gmPrompt += '\n';
        }
        
        if (locationContext.recentEvents.length > 0) {
            gmPrompt += `Location History (${location}):\n`;
            locationContext.recentEvents.forEach(event => {
                const eventDesc = this.extractEvent(event.content);
                gmPrompt += `- ${eventDesc}\n`;
            });
            gmPrompt += `Current state: ${locationContext.currentState}\n\n`;
        }
        
        if (worldContext.length > 0) {
            gmPrompt += `World Knowledge:\n`;
            worldContext.forEach(knowledge => {
                gmPrompt += `- ${knowledge.content.substring(0, 100)}\n`;
            });
            gmPrompt += '\n';
        }
        
        gmPrompt += `Please respond to ${characterId}'s situation considering this context.`;
        
        return {
            prompt: gmPrompt,
            characterHistory,
            locationContext,
            worldContext,
            sessionId: this.currentSession
        };
    }
    
    extractAction(memoryContent) {
        const lines = memoryContent.split('\n');
        for (const line of lines) {
            if (line.startsWith('Character') && line.includes('performed action:')) {
                return line.split('performed action: ')[1] || line;
            }
        }
        return memoryContent.substring(0, 80) + '...';
    }
    
    extractEvent(memoryContent) {
        const lines = memoryContent.split('\n');
        for (const line of lines) {
            if (line.startsWith('World event occurred:')) {
                return line.split('World event occurred: ')[1] || line;
            }
        }
        return memoryContent.substring(0, 80) + '...';
    }
    
    async getSessionSummary() {
        const sessionMemories = await this.memorySystem.memory_search(`session ${this.currentSession}`, {
            maxResults: 20,
            minScore: 0.2
        });
        
        const summary = {
            sessionId: this.currentSession,
            totalEvents: sessionMemories.length,
            characterActions: sessionMemories.filter(m => m.type === 'character_action').length,
            npcInteractions: sessionMemories.filter(m => m.type === 'npc_memory').length,
            worldEvents: sessionMemories.filter(m => m.type === 'world_event').length,
            timeline: sessionMemories.map(memory => ({
                timestamp: memory.timestamp,
                type: memory.type,
                summary: this.summarizeMemory(memory.content)
            })).sort((a, b) => a.timestamp - b.timestamp)
        };
        
        return summary;
    }
    
    summarizeMemory(content) {
        const firstLine = content.split('\n')[0];
        return firstLine.length > 60 ? firstLine.substring(0, 60) + '...' : firstLine;
    }
}

export { RPGVectorMemory };

// Test the RPG memory system
if (import.meta.url === `file://${process.argv[1]}`) {
    async function testRPGMemory() {
        console.log('🎮 Testing RPG Vector Memory');
        console.log('=' .repeat(35));
        
        const rpgMemory = new RPGVectorMemory();
        
        try {
            // Initialize session
            await rpgMemory.initializeSession('test_session_001', 'fantasy');
            
            // Add character action
            await rpgMemory.addCharacterAction(
                'Kira_Shadowbane',
                'picked the lock on the ancient chest',
                {
                    location: 'forgotten temple chamber',
                    npcs: ['Temple Spirit'],
                    outcome: 'found ancient artifact',
                    emotions: ['curious', 'cautious']
                }
            );
            
            // Add NPC interaction
            await rpgMemory.addNPCInteraction(
                'Temple_Spirit',
                'Kira_Shadowbane',
                'The spirit acknowledged Kira with respect after seeing her careful approach',
                'positive'
            );
            
            // Add world event
            await rpgMemory.addWorldEvent(
                'Ancient artifact discovered in forgotten temple',
                'forgotten temple chamber',
                'significant'
            );
            
            // Test GM prompt generation
            const gmContext = await rpgMemory.generateGMPrompt(
                'Kira_Shadowbane',
                'examining the ancient artifact',
                'forgotten temple chamber'
            );
            
            console.log('\\n🧠 Generated GM Prompt:');
            console.log(gmContext.prompt);
            
            // Test NPC memory
            const npcMemory = await rpgMemory.getNPCMemoryOfCharacter('Temple_Spirit', 'Kira_Shadowbane');
            console.log('\\n👥 NPC Memory Analysis:');
            console.log(`- Interactions: ${npcMemory.interactionCount}`);
            console.log(`- Overall sentiment: ${npcMemory.overallSentiment}`);
            
            // Get session summary
            const summary = await rpgMemory.getSessionSummary();
            console.log('\\n📊 Session Summary:');
            console.log(`- Character actions: ${summary.characterActions}`);
            console.log(`- NPC interactions: ${summary.npcInteractions}`);
            console.log(`- World events: ${summary.worldEvents}`);
            
            console.log('\\n🎉 RPG vector memory system working!');
            
        } catch (error) {
            console.error('❌ RPG test failed:', error.message);
        }
    }
    
    testRPGMemory();
}