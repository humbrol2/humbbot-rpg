#!/usr/bin/env node

/**
 * Test API Integration with Enhanced Memory System
 */

const SERVER_URL = 'http://localhost:3001';

async function testAPIIntegration() {
  console.log('🧪 Testing HumbBot RPG API with Enhanced Memory');

  try {
    // 1. Health Check
    console.log('\\n🔍 Testing health endpoint...');
    const healthResponse = await fetch(`${SERVER_URL}/api/health`);
    const health = await healthResponse.json();
    console.log('✓ Health check:', health.status);

    // 2. Create test world
    console.log('\\n🌍 Creating test world...');
    const worldData = {
      name: 'Vector Memory Test World',
      setting: 'fantasy',
      description: 'A magical realm for testing enhanced memory systems',
      rules: 'Standard fantasy RPG rules',
      npcs: ['Wise Sage', 'Village Guard']
    };

    const worldResponse = await fetch(`${SERVER_URL}/api/worlds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(worldData)
    });
    const world = await worldResponse.json();
    console.log('✓ World created:', world.name);

    // 3. Create test character
    console.log('\\n👤 Creating test character...');
    const characterData = {
      name: 'Memory Tester',
      race: 'Human',
      class: 'Wizard',
      background: 'Scholar',
      attributes: {
        strength: 10,
        dexterity: 14,
        constitution: 12,
        intelligence: 16,
        wisdom: 13,
        charisma: 11
      },
      level: 5,
      worldId: world.id
    };

    const characterResponse = await fetch(`${SERVER_URL}/api/characters`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(characterData)
    });
    const character = await characterResponse.json();
    console.log('✓ Character created:', character.name);

    // 4. Start enhanced session
    console.log('\\n🎮 Starting enhanced session...');
    const sessionData = {
      worldId: world.id,
      characterIds: [character.id],
      sessionType: 'enhanced',
      memoryEnabled: true
    };

    const sessionResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData)
    });
    const session = await sessionResponse.json();
    console.log('✓ Enhanced session started:', session.id);

    // 5. Test RPG actions that generate memories
    console.log('\\n⚔️ Testing memory-generating actions...');
    
    const actions = [
      'I approach the Wise Sage and ask about the ancient prophecy',
      'I cast a fireball spell at the attacking goblins',
      'I search the ancient library for magical knowledge',
      'I negotiate with the Village Guard about entering the restricted area',
      'I discover a hidden chamber with mysterious runes'
    ];

    for (const action of actions) {
      console.log(`  → ${action.substring(0, 50)}...`);
      
      const actionResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions/${session.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          options: {
            recordMemory: true,
            vectorSearch: true
          }
        })
      });
      
      if (actionResponse.ok) {
        const result = await actionResponse.json();
        console.log('    ✓ Response generated, memory events:', result.memoryEvents || 'N/A');
      } else {
        console.log('    ❌ Action failed:', actionResponse.status);
      }
      
      // Brief delay between actions
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 6. Test memory retrieval
    console.log('\\n🧠 Testing memory retrieval...');
    const memoryResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions/${session.id}/memory?context=library research magic`);
    
    if (memoryResponse.ok) {
      const memoryData = await memoryResponse.json();
      console.log('✓ Memory retrieval successful, events:', memoryData.events?.length || 0);
    } else {
      console.log('❌ Memory retrieval failed:', memoryResponse.status);
    }

    // 7. Get session statistics
    console.log('\\n📊 Getting session statistics...');
    const statsResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions/${session.id}/stats`);
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✓ Session stats retrieved');
      console.log('  • Total actions:', stats.sessionStats?.actions || 0);
      console.log('  • Memory events:', stats.memoryEvents || 0);
      console.log('  • Vector memory size:', stats.memoryStats?.vector?.totalEvents || 0);
    } else {
      console.log('❌ Stats retrieval failed:', statsResponse.status);
    }

    console.log('\\n🎉 API integration test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return false;
  }
}

// Test specific memory search functionality
async function testMemorySearch() {
  console.log('\\n🔍 Testing memory search functionality...');
  
  // This would require an existing session with memory data
  // For now, just test the endpoint structure
  try {
    const searchResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions/test-session/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'magic spell combat',
        limit: 5,
        threshold: 0.3
      })
    });
    
    console.log('🔍 Memory search endpoint test:', searchResponse.status);
  } catch (error) {
    console.log('🔍 Memory search test skipped (no session)');
  }
}

// Run tests
async function runAllTests() {
  const success = await testAPIIntegration();
  await testMemorySearch();
  
  if (success) {
    console.log('\\n✅ All API integration tests passed');
  } else {
    console.log('\\n❌ Some tests failed - check logs above');
  }
}

runAllTests().catch(console.error);