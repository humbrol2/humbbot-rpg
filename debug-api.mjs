#!/usr/bin/env node

const SERVER_URL = 'http://localhost:3001';

async function debugAPIResponses() {
  console.log('🐛 Debugging API Responses');

  try {
    // 1. Create world and check full response
    console.log('\\n🌍 Creating world...');
    const worldResponse = await fetch(`${SERVER_URL}/api/worlds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Debug World',
        setting: 'fantasy',
        description: 'Test world',
        rules: 'Test rules'
      })
    });
    
    const worldText = await worldResponse.text();
    console.log('World response:', worldText);
    
    let world;
    try {
      world = JSON.parse(worldText);
      console.log('World parsed:', world);
    } catch (e) {
      console.error('Failed to parse world response');
      return;
    }

    // 2. Create character and check response
    console.log('\\n👤 Creating character...');
    const characterResponse = await fetch(`${SERVER_URL}/api/characters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Debug Hero',
        race: 'Human', 
        class: 'Fighter',
        world_id: world.id
      })
    });
    
    const characterText = await characterResponse.text();
    console.log('Character response:', characterText);
    
    let character;
    try {
      character = JSON.parse(characterText);
      console.log('Character parsed:', character);
    } catch (e) {
      console.error('Failed to parse character response');
      return;
    }

    // 3. Create enhanced session and check response
    console.log('\\n🎮 Creating enhanced session...');
    const sessionResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        worldId: world.id,
        characterIds: [character.id],
        memoryEnabled: true
      })
    });
    
    const sessionText = await sessionResponse.text();
    console.log('Session response status:', sessionResponse.status);
    console.log('Session response:', sessionText);
    
    let session;
    try {
      session = JSON.parse(sessionText);
      console.log('Session parsed:', session);
    } catch (e) {
      console.error('Failed to parse session response');
      return;
    }

    // 4. Test action endpoint
    console.log('\\n⚔️ Testing action endpoint...');
    const actionResponse = await fetch(`${SERVER_URL}/api/enhanced-sessions/${session.id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'I look around the starting area',
        characterId: character.id
      })
    });
    
    console.log('Action response status:', actionResponse.status);
    const actionText = await actionResponse.text();
    console.log('Action response:', actionText);

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugAPIResponses();