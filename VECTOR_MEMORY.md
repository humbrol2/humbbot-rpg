# 🧠 Vector Memory Integration

## Overview

HumbBot RPG now includes advanced vector memory capabilities that enable semantic understanding of character actions, NPC relationships, and world state persistence. This system uses local embeddings to provide intelligent context retrieval and memory management.

## 🚀 Quick Start

### 1. Start the Demo Server
```bash
node start-vector-demo-server.mjs
```

### 2. Open Demo Interface
Navigate to: **http://localhost:8888**

### 3. Test Features
- **Semantic Search**: Find memories by meaning, not just keywords
- **Character Actions**: Add character experiences with context
- **GM Context**: Generate intelligent responses based on history
- **Memory Storage**: Add new memories with automatic embedding

## 🏗️ Architecture

### Core Components

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│  SimpleVectorMemory │───▶│ Enhanced MemorySystem│───▶│  RPG Vector Memory  │
│  (Base Storage)     │    │  (OpenClaw Integration)│    │ (Character Persistence)│
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
           │                          │                          │
           ▼                          ▼                          ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Local Embeddings  │    │   Memory Search     │    │   GM Context Gen    │
│  (Nomic-Embed 8082) │    │   (Semantic)        │    │  (History-Aware)    │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘
```

### File Structure

| File | Purpose | Size |
|------|---------|------|
| `simple-vector-memory.mjs` | Core vector storage engine | 3.2KB |
| `enhanced-memory-system.mjs` | OpenClaw memory integration | 14KB |
| `rpg-vector-enhancement.mjs` | RPG-specific memory features | 14KB |
| `start-vector-demo-server.mjs` | Demo server with REST API | 10KB |
| `vector-memory-demo.html` | Interactive web interface | 17KB |

## 🎮 RPG Integration Examples

### Character Action Persistence
```javascript
import { RPGVectorMemory } from './rpg-vector-enhancement.mjs';

const rpgMemory = new RPGVectorMemory();
await rpgMemory.initializeSession('session_001', 'fantasy');

// Store character action with context
await rpgMemory.addCharacterAction('Kira_Shadowbane', 'picked ancient lock', {
    location: 'forgotten temple',
    npcs: ['Temple Guardian'],
    outcome: 'discovered treasure room',
    emotions: ['curious', 'cautious']
});
```

### NPC Relationship Tracking
```javascript
// NPCs remember player interactions
await rpgMemory.addNPCInteraction(
    'Temple_Guardian',
    'Kira_Shadowbane', 
    'Player showed respect for ancient artifacts',
    'positive'
);

// Retrieve NPC's memory of character
const npcMemory = await rpgMemory.getNPCMemoryOfCharacter('Temple_Guardian', 'Kira_Shadowbane');
console.log('Relationship sentiment:', npcMemory.overallSentiment); // 'positive'
```

### GM Context Generation
```javascript
// Generate intelligent GM responses based on history
const gmContext = await rpgMemory.generateGMPrompt(
    'Kira_Shadowbane',
    'examining mysterious artifact',
    'treasure chamber'
);

console.log(gmContext.prompt);
// Output: Contextual prompt including character background,
//         location history, and relevant world knowledge
```

## 🔍 Semantic Memory Search

### Enhanced OpenClaw Integration
```javascript
import { EnhancedMemorySystem } from './enhanced-memory-system.mjs';

const memory = new EnhancedMemorySystem();

// Drop-in replacement for memory_search
const results = await memory.memory_search('context optimization');

// Returns semantic matches with similarity scores
results.forEach(result => {
    console.log(`${result.score.toFixed(3)}: ${result.content}`);
});
```

### Search Examples
- **Query**: "context optimization" 
- **Matches**: "token compression", "memory efficiency", "hybrid systems"
- **Query**: "character development"
- **Matches**: "skill progression", "story growth", "player advancement"

## 🛠️ API Endpoints

The demo server provides REST API endpoints for testing:

### Memory Search
```http
POST /api/search
Content-Type: application/json

{
  "query": "context optimization system"
}
```

### Add Character Action
```http
POST /api/rpg/action
Content-Type: application/json

{
  "characterId": "Kira_Shadowbane",
  "action": "discovered hidden passage",
  "location": "ancient ruins",
  "worldType": "fantasy"
}
```

### Generate GM Context
```http
POST /api/rpg/context
Content-Type: application/json

{
  "characterId": "Kira_Shadowbane",
  "situation": "examining mysterious artifact",
  "location": "treasure chamber",
  "worldType": "fantasy"
}
```

### Add Memory Entry
```http
POST /api/memory/add
Content-Type: application/json

{
  "content": "Vector memory systems enable semantic understanding",
  "source": "technical_notes",
  "type": "technical"
}
```

## 🧪 Testing

### Automated Tests
```bash
# Test core vector memory
node test-simple-vector.mjs

# Test enhanced memory system
node test-enhanced-memory.mjs

# Test RPG integration
node test-rpg-vector.mjs
```

### Manual Testing via Demo
1. Start demo server: `node start-vector-demo-server.mjs`
2. Open http://localhost:8888
3. Test semantic search, character actions, GM context generation

## 🔧 Configuration

### Prerequisites
- **Local embedding service** running on port 8082 (Nomic-Embed)
- **Node.js** 18+ with ES modules support
- **No external databases** required (pure Node.js implementation)

### Memory Types
- `technical` - Technical implementations and insights
- `character_action` - Player character actions with context
- `npc_memory` - NPC interactions and relationship data
- `world_event` - World state changes and location events
- `world_knowledge` - Setting-specific lore and rules
- `general` - General-purpose memories

### World Types
- `fantasy` - Magic, kingdoms, ancient ruins
- `scifi` - Quantum drives, AI regulations, corporate factions  
- `modern` - Technology, urban environments, social dynamics

## 🌟 Key Features

### Semantic Understanding
- **Context awareness**: "optimization" matches "compression" and "efficiency"
- **Relationship discovery**: Finds related concepts across time
- **Intelligent ranking**: Most relevant results first

### Character Persistence
- **Action memory**: Characters remember what they've done
- **Emotional context**: Actions include emotional state
- **Location awareness**: Events tied to specific places
- **Session continuity**: Memories persist across game sessions

### NPC Intelligence  
- **Relationship tracking**: NPCs remember player interactions
- **Sentiment analysis**: Positive/negative/neutral relationships
- **Interaction history**: Full context of past encounters
- **Behavioral influence**: NPC responses informed by history

### World State Continuity
- **Event persistence**: World events affect future interactions
- **Location memory**: Places remember what happened there
- **Causal relationships**: Events connect meaningfully
- **Dynamic world**: State evolves based on player actions

## 📊 Performance

### Vector Search
- **Similarity accuracy**: 70%+ semantic matching
- **Search speed**: Real-time responses (<500ms)
- **Memory usage**: In-memory storage, minimal overhead
- **Fallback**: File-based search if vector system fails

### Storage
- **No external DB**: Pure Node.js implementation
- **Local embeddings**: Uses existing Nomic-Embed service
- **File backup**: Automatic persistence to markdown files
- **Scalability**: Handles thousands of memories efficiently

## 🚀 Integration Examples

### Replace Existing Memory Search
```javascript
// Before
const results = await memory_search(query);

// After  
const memory = new EnhancedMemorySystem();
const results = await memory.memory_search(query);
// Now gets semantic matches instead of keyword-only
```

### Add to Character Creation
```javascript
// Initialize RPG memory for new session
const rpgMemory = new RPGVectorMemory();
await rpgMemory.initializeSession(sessionId, worldType);

// Every character action gets semantic persistence
await rpgMemory.addCharacterAction(characterId, action, context);
```

### Enhance GM Responses
```javascript
// Before sending to LLM, get relevant context
const gmContext = await rpgMemory.generateGMPrompt(
    characterId, currentSituation, location
);

// Include in system prompt for context-aware responses
const systemPrompt = `${basePrompt}\n\n${gmContext.prompt}`;
```

## 🔮 Future Enhancements

### Planned Features
- **Automatic distillation**: Promote frequently accessed memories
- **Semantic clustering**: Group related memories automatically  
- **Cross-character relationships**: Track party dynamics
- **Temporal awareness**: Weight recent memories higher
- **Quality scoring**: Rate memory importance automatically

### Integration Opportunities  
- **OpenClaw core**: Replace built-in memory_search
- **Other RPG systems**: Extend beyond HumbBot RPG
- **Multi-modal**: Add support for image/audio memories
- **Distributed**: Share memories across multiple instances

## 🔗 Links

- **Demo Interface**: http://localhost:8888 (when server running)
- **GitHub Repository**: https://github.com/humbrol2/humbbot-rpg
- **Vector Integration Branch**: https://github.com/humbrol2/humbbot-rpg/tree/vector-memory-integration
- **Documentation**: Complete implementation guide in `vector-integration-complete.md`

---

**The vector memory system transforms HumbBot RPG from keyword-based to semantic understanding, enabling genuine AI memory that comprehends relationships and context.** 🎯