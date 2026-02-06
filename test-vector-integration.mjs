#!/usr/bin/env node

/**
 * Test Vector Memory Integration in HumbBot RPG
 * Validates the enhanced memory system with vector search capabilities
 */

import EnhancedRPGMemoryManager from './server/services/enhanced-memory.js';
import VectorMemoryEnhancer from './server/services/vector-memory.js';

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

async function testVectorMemorySystem() {
  log('blue', '🧪', 'Testing Vector Memory Integration in HumbBot RPG');
  
  const testWorldId = 'test-vector-world';
  const testSessionId = 'test-session-001';
  
  try {
    // 1. Test Vector Memory Enhancer
    log('cyan', '🔧', 'Testing VectorMemoryEnhancer...');
    
    const vectorMemory = new VectorMemoryEnhancer({
      vectorStorePath: `./data/test-vector-memory`,
      embeddingServiceUrl: 'http://127.0.0.1:8082/v1/embeddings'
    });
    
    await vectorMemory.initialize();
    log('green', '✓', 'Vector memory initialized');
    
    // Test event storage
    const events = [
      {
        id: 'combat-001',
        type: 'combat',
        data: {
          participants: ['Sir Gareth', 'Orc Warrior'],
          outcome: 'victory',
          casualties: ['Orc Warrior'],
          location: 'Dark Forest'
        }
      },
      {
        id: 'dialogue-001', 
        type: 'dialogue',
        data: {
          speaker: 'Village Elder',
          content: 'Beware the dark creatures in the forest, brave adventurer!',
          location: 'Village Square'
        }
      },
      {
        id: 'quest-001',
        type: 'quest',
        data: {
          questId: 'Clear the Forest',
          action: 'accepted quest',
          newStatus: 'active',
          location: 'Village Square'
        }
      }
    ];
    
    for (const event of events) {
      const eventText = vectorMemory.formatEventForVector(event.type, event.data);
      const stored = await vectorMemory.storeEvent(event.id, event.data, eventText);
      if (stored) {
        log('green', '✓', `Stored event: ${event.id}`);
      } else {
        log('red', '✗', `Failed to store event: ${event.id}`);
      }
    }
    
    // Test semantic search
    const searchQueries = [
      'fighting orcs in the forest',
      'village elder warning',
      'quest about clearing forest'
    ];
    
    for (const query of searchQueries) {
      const results = await vectorMemory.semanticSearch(query, 3);
      log('cyan', '🔍', `Search "${query}" found ${results.length} results`);
      
      if (results.length > 0) {
        const topResult = results[0];
        log('white', '  →', `Best match: ${topResult.eventId} (similarity: ${(topResult.similarity * 100).toFixed(1)}%)`);
      }
    }
    
    // 2. Test Enhanced Memory Manager
    log('cyan', '🔧', 'Testing Enhanced RPG Memory Manager...');
    
    const enhancedMemory = new EnhancedRPGMemoryManager(testWorldId, testSessionId);
    await enhancedMemory.initialize();
    log('green', '✓', 'Enhanced memory manager initialized');
    
    // Record some RPG events
    const rpgEvents = [
      { type: 'combat', data: { participants: ['Hero', 'Dragon'], outcome: 'victory', casualties: ['Dragon'], location: 'Dragon Lair' }, significance: 0.9 },
      { type: 'dialogue', data: { speaker: 'Princess', content: 'Thank you for saving me!', location: 'Dragon Lair' }, significance: 0.7 },
      { type: 'quest', data: { questId: 'Rescue Princess', action: 'completed', newStatus: 'completed', location: 'Dragon Lair' }, significance: 0.9 },
      { type: 'travel', data: { from: 'Dragon Lair', to: 'Royal Castle', method: 'on foot' }, significance: 0.4 }
    ];
    
    const eventIds = [];
    for (const event of rpgEvents) {
      const eventId = await enhancedMemory.recordEvent(event.type, event.data, event.significance);
      eventIds.push(eventId);
      log('green', '✓', `Recorded ${event.type} event: ${eventId}`);
    }
    
    // Test enhanced memory retrieval
    const testContext = {
      location: 'Royal Castle',
      characters: ['Hero', 'Princess'],
      recentActions: ['celebrate', 'feast']
    };
    
    const relevantMemories = await enhancedMemory.getRelevantMemories(testContext);
    log('cyan', '🔍', `Enhanced search found ${relevantMemories.length} relevant memories`);
    
    // Test memory context building
    const memoryContext = await enhancedMemory.buildMemoryContext(
      { location: 'Royal Castle', recentActions: ['celebrate'] },
      [{ name: 'Hero' }, { name: 'Princess' }]
    );
    
    log('white', '📝', 'Generated memory context:');
    console.log('\\n' + memoryContext + '\\n');
    
    // Test natural language search
    const naturalQueries = [
      'dragon fight',
      'princess rescue',
      'castle celebration'
    ];
    
    for (const query of naturalQueries) {
      const searchResults = await enhancedMemory.searchMemories(query, 3);
      log('cyan', '🔍', `Natural search "${query}" found ${searchResults.length} results`);
      
      if (searchResults.length > 0) {
        const best = searchResults[0];
        log('white', '  →', `Best: ${best.type} event (${(best.similarity * 100).toFixed(1)}% match)`);
      }
    }
    
    // Test debug functionality
    const debugResults = await enhancedMemory.debugMemorySearch('heroic battle');
    log('yellow', '🐛', `Debug search found: ${debugResults.traditional.length} traditional, ${debugResults.vector.length} vector`);
    
    // Get system stats
    const stats = await enhancedMemory.getStats();
    log('blue', '📊', 'System Statistics:');
    console.log(JSON.stringify(stats, null, 2));
    
    // Test compression
    await enhancedMemory.compressMemory();
    log('green', '✓', 'Memory compression completed');
    
    log('green', '🎉', 'All vector memory tests passed!');
    
    return {
      success: true,
      vectorEvents: events.length,
      enhancedEvents: rpgEvents.length,
      relevantMemories: relevantMemories.length,
      stats
    };
    
  } catch (error) {
    log('red', '❌', `Test failed: ${error.message}`);
    console.error(error);
    return { success: false, error: error.message };
  }
}

// Test specific RPG scenarios
async function testRPGScenarios() {
  log('blue', '🎮', 'Testing RPG-specific scenarios...');
  
  const memory = new EnhancedRPGMemoryManager('fantasy-world', 'scenario-test');
  await memory.initialize();
  
  // Scenario 1: Epic battle sequence
  await memory.recordCombat(['Hero', 'Wizard'], 'victory', ['Evil Sorcerer']);
  await memory.recordDialogue('Hero', 'The realm is safe once more!', { 'Wizard': 'relieved' });
  await memory.recordQuestProgress('Save the Realm', 'completed quest', 'completed');
  
  // Scenario 2: Character development
  await memory.recordCharacterDevelopment('Hero', 'level_up', { level: 10, newAbility: 'Dragon Slayer' });
  
  // Scenario 3: Location exploration
  await memory.recordLocationChange('Battlefield', 'Victory Celebration', 'triumphant march');
  
  // Test contextual retrieval
  const battleContext = {
    location: 'Victory Celebration',
    characters: ['Hero', 'Wizard'],
    recentActions: ['celebrate victory', 'receive honors']
  };
  
  const battleMemories = await memory.getRelevantMemories(battleContext);
  log('cyan', '🔍', `Battle scenario retrieved ${battleMemories.length} relevant memories`);
  
  // Test semantic relationships
  const queries = [
    'epic battle against evil',
    'hero becoming stronger',
    'celebration after victory'
  ];
  
  for (const query of queries) {
    const results = await memory.searchMemories(query, 2);
    log('white', '  ◦', `"${query}" → ${results.length} matches`);
  }
  
  log('green', '✓', 'RPG scenario tests completed');
}

// Main test execution
async function runAllTests() {
  const startTime = Date.now();
  
  try {
    // Check if embedding service is available
    log('yellow', '🔌', 'Checking embedding service availability...');
    try {
      const response = await fetch('http://127.0.0.1:8082/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'nomic-embed-text',
          input: 'test connection'
        })
      });
      
      if (response.ok) {
        log('green', '✓', 'Embedding service is available');
      } else {
        throw new Error(`Service responded with ${response.status}`);
      }
    } catch (error) {
      log('red', '❌', 'Embedding service not available. Start local embedding server on port 8082');
      log('yellow', '💡', 'Try running: llamacpp-server --model nomic-embed-text --port 8082');
      process.exit(1);
    }
    
    // Run main tests
    const mainResults = await testVectorMemorySystem();
    
    if (mainResults.success) {
      await testRPGScenarios();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      log('green', '🎉', `All tests completed successfully in ${duration}s`);
      
      // Summary
      log('blue', '📋', 'Test Summary:');
      console.log(`  • Vector events stored: ${mainResults.vectorEvents}`);
      console.log(`  • Enhanced events recorded: ${mainResults.enhancedEvents}`); 
      console.log(`  • Relevant memories found: ${mainResults.relevantMemories}`);
      console.log(`  • Traditional memory size: ${mainResults.stats.traditional.hotMemorySize}`);
      console.log(`  • Vector memory size: ${mainResults.stats.vector.totalEvents}`);
      
    } else {
      log('red', '💥', 'Tests failed - check error messages above');
      process.exit(1);
    }
    
  } catch (error) {
    log('red', '💥', `Test execution failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}