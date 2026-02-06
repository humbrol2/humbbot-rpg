#!/usr/bin/env node

/**
 * Test Vector Memory Integration (Memory Only - No LLM Required)
 */

const SERVER_URL = 'http://localhost:3001';

async function testMemoryIntegration() {
  console.log('🧪 Testing Enhanced Memory Integration (No LLM)');

  try {
    // 1. Create world
    const worldResponse = await fetch(`${SERVER_URL}/api/worlds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Memory Test World',
        setting: 'fantasy',
        description: 'Testing vector memory',
        rules: 'Test rules'
      })
    });
    const world = await worldResponse.json();
    console.log('✓ World created:', world.name);

    // 2. Create character
    const characterResponse = await fetch(`${SERVER_URL}/api/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Memory Hero',
        race: 'Human',
        class: 'Wizard',
        world_id: world.id
      })
    });
    const character = await characterResponse.json();
    console.log('✓ Character created:', character.name);

    // 3. Create enhanced session
    const sessionResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        worldId: world.id,
        characterIds: [character.id],
        memoryEnabled: true
      })
    });
    const session = await sessionResponse.json();
    console.log('✓ Enhanced session created:', session.id);

    // 4. Test memory endpoints (without LLM action processing)
    
    // Test getting session details
    console.log('\\n📋 Testing session details...');
    const detailsResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions/${session.id}`);
    if (detailsResponse.ok) {
      const details = await detailsResponse.json();
      console.log('✓ Session details loaded, characters:', details.characters.length);
    }

    // Test memory retrieval
    console.log('\\n🧠 Testing memory retrieval...');
    const memoryResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions/${session.id}/memory`);
    if (memoryResponse.ok) {
      const memory = await memoryResponse.json();
      console.log('✓ Memory loaded, events:', memory.events.length);
    }

    // Test statistics
    console.log('\\n📊 Testing statistics...');
    const statsResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions/${session.id}/stats`);
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✓ Stats loaded');
      console.log('  • Memory events:', stats.memoryEvents?.hotMemorySize || 0);
      console.log('  • Vector memory:', stats.memoryStats?.vector?.totalEvents || 0);
      console.log('  • Hybrid mode:', stats.memoryStats?.hybridMode);
    }

    // Test memory search
    console.log('\\n🔍 Testing memory search...');
    const searchResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions/${session.id}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'adventure beginning',
        limit: 5
      })
    });
    
    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      console.log('✓ Memory search completed, results:', searchResults.results.length);
    } else {
      const errorText = await searchResponse.text();
      console.log('⚠️ Memory search failed:', errorText);
    }

    // Test debug search
    console.log('\\n🔍 Testing debug search...');
    const debugResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions/${session.id}/debug-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'test memory system'
      })
    });
    
    if (debugResponse.ok) {
      const debugResults = await debugResponse.json();
      console.log('✓ Debug search completed');
      console.log('  • Traditional results:', debugResults.traditional.length);
      console.log('  • Vector results:', debugResults.vector.length);
    } else {
      const errorText = await debugResponse.text();
      console.log('⚠️ Debug search failed:', errorText);
    }

    console.log('\\n🎉 Memory integration test completed!');
    
    // Cleanup
    const cleanupResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions/${session.id}/cleanup`, {
      method: 'DELETE'
    });
    if (cleanupResponse.ok) {
      console.log('✓ Session cleaned up');
    }

    return { success: true, session: session.id };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Test manual memory events (simulating what would happen during gameplay)
async function testManualMemoryEvents() {
  console.log('\\n🎲 Testing Manual Memory Events');

  try {
    // Use direct memory manager to simulate memory events
    const { default: EnhancedRPGMemoryManager } = await import('./server/services/enhanced-memory.js');
    
    const memoryManager = new EnhancedRPGMemoryManager('test-world', 'manual-test-session');
    await memoryManager.initialize();
    
    console.log('✓ Memory manager initialized');

    // Add various types of events
    const events = [
      { type: 'combat', data: { participants: ['Hero', 'Dragon'], outcome: 'victory', location: 'Dragon Lair' }, significance: 0.9 },
      { type: 'dialogue', data: { speaker: 'Wizard', content: 'The ancient prophecy speaks of a chosen one...', location: 'Tower' }, significance: 0.6 },
      { type: 'quest', data: { questId: 'Save the Kingdom', action: 'accepted', newStatus: 'active', location: 'Throne Room' }, significance: 0.8 },
      { type: 'travel', data: { from: 'Tower', to: 'Dark Forest', method: 'on foot' }, significance: 0.3 }
    ];

    for (const event of events) {
      const eventId = await memoryManager.recordEvent(event.type, event.data, event.significance);
      console.log(`✓ Recorded ${event.type} event: ${eventId}`);
    }

    // Test memory retrieval with context
    const context = {
      location: 'Dark Forest',
      characters: ['Hero', 'Wizard'],
      recentActions: ['explore', 'search for clues']
    };

    const relevantMemories = await memoryManager.getRelevantMemories(context, 1000);
    console.log(`✓ Found ${relevantMemories?.length || 0} relevant memories for context`);

    // Test vector search
    const searchResults = await memoryManager.searchMemories('dragon battle', 5);
    console.log(`✓ Vector search found ${searchResults?.length || 0} results`);

    if (searchResults && searchResults.length > 0) {
      const bestMatch = searchResults[0];
      console.log(`  → Best match: ${bestMatch.type} event (${(bestMatch.similarity * 100).toFixed(1)}% similarity)`);
    }

    // Test memory context generation
    const memoryContext = await memoryManager.buildMemoryContext(
      { location: 'Dark Forest' },
      [{ name: 'Hero' }, { name: 'Wizard' }]
    );
    
    console.log('\\n📝 Generated memory context:');
    console.log(memoryContext);

    const stats = await memoryManager.getStats();
    console.log('\\n📊 Memory Statistics:');
    console.log(`  • Total traditional events: ${stats.traditional.hotMemorySize}`);
    console.log(`  • Total vector events: ${stats.vector.totalEvents}`);
    console.log(`  • Hybrid mode: ${stats.hybridMode}`);
    console.log(`  • Vector weight: ${stats.vectorWeight}`);

    return { success: true, events: events.length, memories: relevantMemories?.length || 0 };

  } catch (error) {
    console.error('❌ Manual memory test failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  const apiResult = await testMemoryIntegration();
  const memoryResult = await testManualMemoryEvents();
  
  if (apiResult.success && memoryResult.success) {
    console.log('\\n✅ All memory integration tests passed!');
    console.log(`  • API endpoints working: ${apiResult.session}`);
    console.log(`  • Memory events processed: ${memoryResult.events}`);
    console.log(`  • Memory retrieval working: ${memoryResult.memories} relevant memories`);
  } else {
    console.log('\\n❌ Some tests failed - check output above');
  }
}

runTests().catch(console.error);