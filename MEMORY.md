# 🧠 HumbBot RPG Memory Architecture

*Advanced memory system for persistent, context-aware AI Game Masters*

## Overview

HumbBot RPG implements a sophisticated 4-tier memory architecture inspired by patterns from the [Moltbook](https://moltbook.com) AI agent community. This system enables true persistence across sessions, where NPCs remember past interactions, consequences unfold naturally, and relationships evolve over time.

## Memory Philosophy: "ClawMark" Approach

**Memory isn't about capacity — it's about curation.**

Following the ClawMark philosophy discovered in the Moltbook community, our system doesn't just accumulate all information. Instead, it:

1. **Intentionally forgets** low-significance events
2. **Actively curates** important memories  
3. **Frequency-boosts** repeatedly-accessed information
4. **Compresses gracefully** when context limits approach

*"The sharpest claw is the one that knows when to let go."*

## 4-Tier Memory Decay System

### HOT Memory (0-2 hours)
- **Storage**: In-memory HashMap for instant access
- **Contents**: Immediate actions, current dialogue, active combat
- **Significance**: All events (0.1-1.0)
- **Access Pattern**: Sub-second retrieval for GM prompts

### WARM Memory (2 hours - 1 day)  
- **Storage**: JSON files with rapid disk access
- **Contents**: Session events, character interactions, location changes
- **Significance**: Medium+ events (0.3-1.0)
- **Access Pattern**: Quick loading for scene context

### COOL Memory (1 day - 1 week)
- **Storage**: Compressed JSON with metadata indexing
- **Contents**: Story beats, quest progress, relationship changes
- **Significance**: Important events (0.5-1.0)  
- **Access Pattern**: Selective loading based on relevance

### COLD Memory (1 week - 1 month)
- **Storage**: Highly compressed summaries with references
- **Contents**: Major character developments, world-changing events
- **Significance**: Critical events (0.7-1.0)
- **Access Pattern**: Background context and continuity checks

### ARCHIVED Memory (1+ month)
- **Storage**: Ultra-compressed event summaries
- **Contents**: Legendary moments, core personality traits
- **Significance**: Epic events (0.9-1.0)
- **Access Pattern**: Deep lore and character essence

## Context Window Management

### Proactive Compression Strategy
```
Context Usage Monitoring:
├── < 50%:  Normal operation
├── 50-70%: Write key points after exchanges  
├── 70-85%: Active flushing - write everything important NOW
├── > 85%:  Emergency stop - full context summary immediately
└── > 90%:  Automatic memory compression triggered
```

### Memory Budget Allocation
```
Total Context Budget: 4000 tokens
├── System Prompt:    1000 tokens (setting + constraints)
├── Scene Context:    800 tokens  (current location + NPCs)
├── Character State:  600 tokens  (stats + relationships)  
├── Memory Context:   1200 tokens (relevant past events)
├── Action Buffer:    400 tokens  (recent player actions)
└── Reserve:          0 tokens    (compression buffer)
```

## Event Significance Scoring

Events are scored (0.0-1.0) for retention priority:

### High Significance (0.8-1.0)
- Character deaths/resurrections
- Major quest completions
- World-changing events
- Epic combat victories
- Relationship breakthroughs

### Medium Significance (0.5-0.7)  
- Combat encounters with stakes
- Important NPC dialogues
- Location discoveries
- Skill developments
- Meaningful choices

### Low Significance (0.1-0.4)
- Casual conversations
- Routine actions
- Travel between known locations
- Minor purchases
- Basic skill checks

### Frequency Boosting
Repeatedly accessed memories get retention boosts:
- 5+ accesses: +0.2 significance
- 10+ accesses: +0.4 significance  
- 20+ accesses: +0.6 significance (permanent retention)

## Relationship Tracking

### Dynamic NPC Memory
Each NPC maintains relationship vectors with every character:

```json
{
  "characterName": {
    "trust": 0.7,
    "respect": 0.4, 
    "affection": 0.2,
    "fear": -0.1,
    "lastInteraction": 1672531200000,
    "interactionCount": 12,
    "keyMemories": [
      "Saved me from bandits",
      "Always keeps promises",
      "Refused to lie to authorities"
    ]
  }
}
```

### Relationship Evolution
- **Positive actions**: Increase trust, respect, affection
- **Negative actions**: Increase fear, decrease trust
- **Consistent behavior**: Reinforces relationship patterns
- **Betrayals**: Dramatic relationship shifts with high memory significance

## Memory-Guided Prompt Engineering

### Relevance Scoring Algorithm
```javascript
function calculateRelevance(event, currentContext) {
  let score = 0.1; // Base relevance
  
  // Location relevance (+0.3)
  if (event.location === currentContext.location) score += 0.3;
  
  // Character relevance (+0.2 per shared character)
  const sharedChars = getSharedCharacters(event, currentContext);
  score += sharedChars.length * 0.2;
  
  // Action type relevance (+0.25)  
  if (areActionsRelated(event.type, currentContext.actionType)) score += 0.25;
  
  // Temporal relevance (decay over time)
  const ageHours = (Date.now() - event.timestamp) / (1000 * 60 * 60);
  const recencyBoost = Math.max(0.1, 1 - (ageHours / 168)); // Week decay
  
  return Math.min(score * recencyBoost, 1.0);
}
```

### Context Selection Strategy
1. **Score all events** by relevance to current situation
2. **Sort by** relevance × significance × recency  
3. **Select events** that fit within token budget
4. **Format for prompt** with appropriate detail level
5. **Track access** for future relevance scoring

## Implementation Details

### File Structure
```
data/memory/[worldId]/[sessionId]/
├── hot.json              # In-memory events (last 2h)
├── warm.json             # Recent events (2h-1d)
├── cool.json             # Story events (1d-1w)  
├── cold.json             # Major events (1w-1m)
├── archive-[date].json   # Compressed summaries
├── relationships.json    # NPC relationship data
└── metadata.json         # Session statistics
```

### Memory Compression Process
1. **Age Analysis**: Categorize events by time and significance
2. **Relevance Check**: Test recent access patterns
3. **Compression Decision**: Move to appropriate tier or archive
4. **Summary Generation**: Create compressed representations
5. **Reference Tracking**: Maintain links to detailed versions
6. **Cleanup**: Remove redundant or superseded events

### Performance Optimizations
- **Hot memory** kept in RAM for instant access
- **Lazy loading** of older memory tiers
- **Relevance indexing** for faster context selection
- **Batch operations** for memory management
- **Background compression** during idle periods

## Benefits for Gameplay

### For Players
- **True Persistence**: NPCs remember your past actions and conversations
- **Meaningful Consequences**: Early decisions ripple through the entire campaign
- **Rich Relationships**: Trust and reputation build naturally over time  
- **Living World**: Places and people evolve based on your impact
- **Seamless Sessions**: Pick up exactly where you left off, even months later

### For Game Masters (AI)
- **Full Context**: Complete awareness of player history and relationships
- **Consistent Characters**: NPCs maintain personality across all encounters
- **Natural Continuity**: Stories build organically on established events
- **Intelligent Detail**: More detail for important moments, less for routine actions
- **Adaptive Responses**: Reactions based on relationship history and past events

## Future Enhancements

### Planned Features
- **Cross-Character Memory**: Characters remember interactions with each other
- **World Event Tracking**: Global events that affect all characters
- **Memory Visualization**: Debug tools to inspect the memory architecture
- **Backup/Restore**: Memory state snapshots for campaign management
- **Memory Analytics**: Insights into player behavior and story patterns

### Research Areas
- **Emotional Memory**: Tracking emotional significance of events
- **Causal Chains**: Understanding how events connect and influence each other
- **Memory Conflicts**: Resolving inconsistencies in remembered events
- **Collaborative Memory**: Multiple characters sharing and building memories together

---

*This memory system ensures that your adventures truly matter, creating persistent, evolving relationships in a living world that remembers every choice you make.*