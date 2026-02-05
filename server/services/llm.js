/**
 * LLM Service - Connects to llama.cpp server
 * 
 * Provides AI Game Master capabilities:
 * - Scene narration
 * - NPC dialogue
 * - Action resolution
 * - World generation
 */

import { SETTINGS, getSettingConfig } from '../../shared/settings.js';
import { AdvancedPromptBuilder } from './prompt-engineering.js';
import RPGMemoryManager from './memory.js';

const LLM_BASE_URL = process.env.LLM_BASE_URL || 'http://127.0.0.1:8080/v1';

/**
 * Check if the LLM server is available
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${LLM_BASE_URL}/models`);
    if (!response.ok) throw new Error('LLM server not responding');
    const data = await response.json();
    return {
      available: true,
      models: data.data || []
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

/**
 * Generate a chat completion from the LLM
 */
export async function chat(messages, options = {}) {
  const {
    temperature = 0.7,
    maxTokens = 1024,
    stopSequences = []
  } = options;

  const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'local-main',
      messages,
      temperature,
      max_tokens: maxTokens,
      stop: stopSequences.length ? stopSequences : undefined
    })
  });

  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Build setting-specific flavor text for the GM
 */
function buildSettingFlavor(setting) {
  const config = getSettingConfig(setting);
  const flavor = config.flavor;
  
  return `
## CRITICAL SETTING RULES - ${config.name.toUpperCase()}
You MUST strictly adhere to the ${config.name} setting. This is NOT negotiable.

**Technology Level:** ${flavor.technology}
- ONLY use technology appropriate to this setting
- NO anachronistic elements (no medieval elements in sci-fi, no futuristic tech in fantasy)

**Appropriate Locations:** ${flavor.locations.join(', ')}
**Currency:** ${flavor.currency}
**Transportation:** ${flavor.transport}
**Lighting Sources:** ${flavor.lighting}
**Materials & Aesthetics:** ${flavor.materials}

**Character Attributes for this setting:** ${config.attributes.join(', ')}
(${Object.entries(config.attributeNames).map(([k,v]) => `${k}=${v}`).join(', ')})

**Available Classes:** ${config.classes.join(', ')}
**Relevant Skills:** ${config.skills.join(', ')}

FORBIDDEN:
${setting === 'scifi' ? '- NO medieval elements (swords, taverns, cobblestone, horses, torches, castles, magic)' : ''}
${setting === 'fantasy' ? '- NO modern/futuristic elements (guns, computers, electricity, vehicles)' : ''}
${setting === 'horror' ? '- NO high fantasy magic or sci-fi tech unless specifically part of the horror' : ''}
${setting === 'post-apocalyptic' ? '- NO pristine modern conveniences, everything should be scavenged/ruined' : ''}
`;
}

/**
 * Advanced Game Master system prompt builder with memory context
 * Incorporates Moltbook memory community patterns
 */
export async function buildGMPrompt(world, session, memory = null, options = {}) {
  const { style = 'balanced', rulesStrict = false, contextBudget = 4000 } = options;
  const config = getSettingConfig(world.setting);

  const styleDescriptions = {
    serious: 'Narrate in a dramatic, immersive tone. Focus on atmosphere and tension.',
    balanced: 'Balance description with action. Be vivid but concise.',
    humorous: 'Include wit and humor while maintaining the story. Light-hearted but engaging.',
    grimdark: 'Emphasize danger, consequence, and moral ambiguity. The world is harsh.'
  };

  // Build character context with relationships
  const characterContext = session.characters?.map(c => {
    const attrs = Object.entries(c.attributes || {})
      .map(([k, v]) => `${k}:${v}`)
      .join(', ');
    
    let charDesc = `- ${c.name} (${c.class || 'Adventurer'}, Level ${c.level}) [${attrs}]`;
    
    // Add relationship context if available
    if (c.relationships && Object.keys(c.relationships).length > 0) {
      const relationships = Object.entries(c.relationships)
        .map(([target, value]) => `${target}:${value > 0 ? '+' : ''}${value}`)
        .join(', ');
      charDesc += ` {${relationships}}`;
    }
    
    // Add recent status effects or conditions
    if (c.conditions && c.conditions.length > 0) {
      charDesc += ` <${c.conditions.join(', ')}>`;
    }
    
    return charDesc;
  }).join('\n') || 'No characters yet';

  // Get memory context if memory manager available
  let memoryContext = '';
  if (memory) {
    try {
      memoryContext = await memory.buildMemoryContext(session.currentScene, session.characters || []);
    } catch (e) {
      console.warn('Failed to build memory context:', e.message);
      memoryContext = "## Recent History\n" + (session.recentHistory?.slice(-5).join('\n') || 'Session just started.');
    }
  } else {
    memoryContext = "## Recent History\n" + (session.recentHistory?.slice(-5).join('\n') || 'Session just started.');
  }

  // Current scene context with environment details
  const sceneContext = buildSceneContext(session.currentScene);

  // Construct the full prompt
  const basePrompt = `You are the Game Master for "${world.name}", a ${config.name} role-playing game.

${buildSettingFlavor(world.setting)}

## Your Role & Style
${styleDescriptions[style] || styleDescriptions.balanced}

## World Description
${world.description || `A ${config.name} world awaiting adventure.`}

${sceneContext}

## Active Characters
${characterContext}

## Game Rules & Mechanics
${rulesStrict ? 
  '- Strictly enforce game rules and character limitations' :
  '- Favor fun and narrative over strict rules when appropriate'}
- When an action has uncertain outcome, indicate a roll: [ROLL:${config.skills[0] || 'skill'}:difficulty]
- Available skills for rolls: ${config.skills.join(', ')}
- Keep responses focused (2-4 paragraphs max unless epic moment)
- End scenes with clear situation or choice for players
- NEVER control player characters - only NPCs and environment
- ALL descriptions must fit the ${config.name} setting - no anachronisms!
- Track relationship changes and mention them when relevant
- Remember character personalities and past decisions

${memoryContext}

## Context Management Notes
- This session has generated significant events that shape the ongoing story
- Character decisions have consequences that ripple through the narrative
- NPCs remember past interactions and react accordingly
- The world evolves based on player actions`;

  // Check token budget and compress if needed
  const estimatedTokens = Math.ceil(basePrompt.length / 4);
  if (estimatedTokens > contextBudget * 0.8) {
    console.log(`🧠 GM prompt approaching token limit (${estimatedTokens}/${contextBudget}), optimizing...`);
    return compressPrompt(basePrompt, contextBudget);
  }

  return basePrompt;
}

/**
 * Build detailed scene context
 */
function buildSceneContext(currentScene) {
  if (!currentScene) {
    return "## Current Scene\nThe adventure is about to begin...";
  }

  let context = `## Current Scene: ${currentScene.name || 'Untitled Scene'}
**Location:** ${currentScene.location || 'Unknown location'}`;

  if (currentScene.description) {
    context += `\n**Description:** ${currentScene.description}`;
  }

  if (currentScene.npcs && currentScene.npcs.length > 0) {
    context += `\n**NPCs Present:** ${currentScene.npcs.map(npc => 
      `${npc.name} (${npc.disposition || 'neutral'})`
    ).join(', ')}`;
  }

  if (currentScene.threats && currentScene.threats.length > 0) {
    context += `\n**Potential Threats:** ${currentScene.threats.join(', ')}`;
  }

  if (currentScene.opportunities && currentScene.opportunities.length > 0) {
    context += `\n**Opportunities:** ${currentScene.opportunities.join(', ')}`;
  }

  if (currentScene.atmosphere) {
    context += `\n**Atmosphere:** ${currentScene.atmosphere}`;
  }

  return context;
}

/**
 * Compress prompt when approaching token limits
 * Implements "ClawMark" intentional forgetting
 */
function compressPrompt(prompt, targetTokens) {
  const sections = prompt.split('\n## ');
  const priorities = {
    'Your Role & Style': 0.9,
    'World Description': 0.8,
    'Current Scene': 1.0,
    'Active Characters': 0.95,
    'Game Rules & Mechanics': 0.85,
    'Memory Context': 0.7,  // Most compressible
    'Context Management Notes': 0.3
  };

  // Compress memory context first
  const memorySection = sections.find(s => s.startsWith('Memory Context'));
  if (memorySection) {
    const lines = memorySection.split('\n');
    if (lines.length > 10) {
      // Keep only most recent and most significant events
      const compressed = lines.slice(0, 5).concat(['...', '[Earlier events available on request]', '']);
      const index = sections.indexOf(memorySection);
      sections[index] = compressed.join('\n');
    }
  }

  return sections.join('\n## ');
}

/**
 * Analyze request type for appropriate response style
 */
function analyzeRequestType(playerAction) {
  const actionLower = playerAction.toLowerCase().trim();
  
  // Quick info requests - should be brief and direct
  if (actionLower.includes('inventory') || actionLower.includes('items') || actionLower.includes('equipment')) {
    return { type: 'inventory', brief: true, maxTokens: 200 };
  }
  
  if (actionLower.includes('stats') || actionLower.includes('attributes') || actionLower.includes('health') || actionLower.includes('hp')) {
    return { type: 'stats', brief: true, maxTokens: 150 };
  }
  
  if (actionLower.includes('job board') || actionLower.includes('jobs') || actionLower.includes('work') || 
      actionLower.includes('employment') || actionLower.includes('tasks') || actionLower.includes('missions')) {
    return { type: 'jobs', brief: true, maxTokens: 300 };
  }
  
  if (actionLower.includes('look around') || actionLower.match(/^(look|l)$/)) {
    return { type: 'look', brief: false, maxTokens: 400 };
  }
  
  // Combat actions - medium length with clear results
  if (actionLower.includes('attack') || actionLower.includes('fight') || actionLower.includes('cast') || actionLower.includes('defend')) {
    return { type: 'combat', brief: false, maxTokens: 600 };
  }
  
  // Dialogue - variable length based on context
  if (actionLower.includes('say') || actionLower.includes('ask') || actionLower.includes('tell') || playerAction.includes('"')) {
    return { type: 'dialogue', brief: false, maxTokens: 500 };
  }
  
  // Investigation - medium detail
  if (actionLower.includes('search') || actionLower.includes('examine') || actionLower.includes('investigate')) {
    return { type: 'investigation', brief: false, maxTokens: 500 };
  }
  
  // Default story action
  return { type: 'story', brief: false, maxTokens: 800 };
}

/**
 * Build response style instructions based on request type
 */
function buildResponseStyleInstructions(requestType) {
  const styles = {
    inventory: `RESPONSE TYPE: INVENTORY CHECK
- List items concisely in a simple format
- No narrative fluff or scene description
- Just the facts: item names and brief descriptions
- Format: "Your inventory contains:" followed by bulleted list
- Keep under 3-4 lines total`,
    
    stats: `RESPONSE TYPE: CHARACTER STATUS
- Show current stats/health/status effects only
- No scene description or narrative
- Simple, clear format
- Include only what's asked for`,
    
    jobs: `RESPONSE TYPE: JOB/WORK LISTING
- List EXACTLY 4 jobs maximum
- Format each job as: **Job Title** \\n• Pay: X credits/hour \\n• Requirements: Y \\n• Description: Brief one-line description \\n\\n
- Use double line breaks between jobs
- Keep each job description to ONE sentence only
- NO narrative text, just job listings`,
    
    look: `RESPONSE TYPE: ENVIRONMENT DESCRIPTION
- Describe the immediate surroundings
- Include exits, notable objects, NPCs
- 2-3 paragraphs maximum
- Focus on what's visible and interactive`,
    
    combat: `RESPONSE TYPE: COMBAT ACTION
- Resolve the action clearly
- Show immediate results
- Include dice rolls if needed: [ROLL:skill:difficulty]
- Brief aftermath description
- End with current tactical situation`,
    
    dialogue: `RESPONSE TYPE: DIALOGUE/SOCIAL
- Focus on NPC responses and reactions
- Include relevant body language/tone
- Show immediate consequences of what was said
- Keep social interactions flowing`,
    
    investigation: `RESPONSE TYPE: INVESTIGATION
- Detail what is found/discovered
- Include skill check results if applicable
- Provide actionable information
- Suggest possible next steps`,
    
    story: `RESPONSE TYPE: GENERAL STORY
- Balance action and description
- Keep 2-4 paragraphs unless epic moment
- End with clear situation for player response
- Maintain setting atmosphere`
  };
  
  return styles[requestType.type] || styles.story;
}

/**
 * Generate GM response to player action with request-aware prompt engineering
 */
export async function generateGMResponse(world, session, playerAction, memory = null, options = {}) {
  const { 
    temperature = 0.8, 
    recordAction = true,
    sceneType = 'story',
    importance = 0.5,
    style = 'balanced'
  } = options;
  
  // Analyze the request type to determine appropriate response style
  const requestType = analyzeRequestType(playerAction);
  const maxTokens = options.maxTokens || requestType.maxTokens;
  
  // Build focused system prompt based on request type
  let systemPrompt;
  
  if (requestType.brief) {
    // Brief informational prompt for quick requests
    systemPrompt = `You are a Game Master for "${world.name}" (${getSettingConfig(world.setting).name}).

${buildResponseStyleInstructions(requestType)}

Current Characters: ${session.characters?.map(c => `${c.name} (${c.class}, Level ${c.level})`).join(', ') || 'None'}

Be direct and concise. No excessive narrative for simple information requests.`;
    
  } else {
    // Full narrative prompt for story actions
    const promptBuilder = new AdvancedPromptBuilder(world, { style, contextBudget: 3000 });
    systemPrompt = await promptBuilder.buildPrompt(session, memory, {
      sceneType,
      importance,
      contextBudget: 3000,
      includeMemory: memory !== null,
      responseStyle: requestType.type
    });
    
    // Add response style instructions
    systemPrompt += `\n\n${buildResponseStyleInstructions(requestType)}`;
  }

  // Prepare message history - less for brief requests
  const messageHistory = session.messageHistory || [];
  const historyBudget = requestType.brief ? 500 : 2000;
  const managedHistory = await manageMessageHistory(messageHistory, memory, historyBudget);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...managedHistory,
    { role: 'user', content: playerAction }
  ];

  // Record the player action in memory if memory manager available
  if (memory && recordAction) {
    await recordPlayerAction(memory, playerAction, session);
  }

  const response = await chat(messages, {
    temperature: requestType.brief ? 0.3 : temperature, // Lower temperature for factual requests
    maxTokens
  });

  // Record GM response and any significant events it contains
  if (memory && !requestType.brief) {
    await recordGMResponse(memory, response, session);
  }

  return response;
}

/**
 * Manage message history to fit within token budget
 * Uses memory system patterns for intelligent truncation
 */
async function manageMessageHistory(history, memory, tokenBudget) {
  if (!history || history.length === 0) return [];

  // Estimate tokens for each message
  const messagesWithTokens = history.map(msg => ({
    ...msg,
    estimatedTokens: Math.ceil((msg.content || '').length / 4)
  }));

  let totalTokens = 0;
  const managedHistory = [];

  // Always include the most recent messages
  for (let i = messagesWithTokens.length - 1; i >= 0; i--) {
    const msg = messagesWithTokens[i];
    if (totalTokens + msg.estimatedTokens <= tokenBudget) {
      managedHistory.unshift(msg);
      totalTokens += msg.estimatedTokens;
    } else {
      break;
    }
  }

  // If we had to truncate, add a summary of truncated content
  const truncatedCount = history.length - managedHistory.length;
  if (truncatedCount > 0 && memory) {
    const summaryMsg = {
      role: 'system',
      content: `[${truncatedCount} earlier messages available in memory context above]`
    };
    managedHistory.unshift(summaryMsg);
  }

  return managedHistory;
}

/**
 * Record player action in memory with context analysis
 */
async function recordPlayerAction(memory, action, session) {
  try {
    // Analyze action type and significance
    const actionAnalysis = analyzePlayerAction(action);
    
    await memory.recordEvent('player_action', {
      action,
      type: actionAnalysis.type,
      characters: session.characters?.map(c => c.name) || [],
      location: session.currentScene?.location || 'unknown',
      analysis: actionAnalysis
    }, actionAnalysis.significance);

    // Record specific event types
    if (actionAnalysis.type === 'combat') {
      await memory.recordCombat(
        actionAnalysis.participants || [],
        'initiated',
        []
      );
    } else if (actionAnalysis.type === 'dialogue') {
      await memory.recordDialogue(
        'Player',
        action,
        {}
      );
    }
  } catch (error) {
    console.warn('Failed to record player action in memory:', error);
  }
}

/**
 * Record GM response and extract significant events
 */
async function recordGMResponse(memory, response, session) {
  try {
    // Extract events from GM response
    const events = extractEventsFromResponse(response);
    
    for (const event of events) {
      switch (event.type) {
        case 'npc_dialogue':
          await memory.recordDialogue(event.speaker, event.content, event.reactions);
          break;
        case 'combat_result':
          await memory.recordCombat(event.participants, event.outcome, event.casualties);
          break;
        case 'location_change':
          await memory.recordLocationChange(event.from, event.to, event.method);
          break;
        case 'character_development':
          await memory.recordCharacterDevelopment(event.character, event.developmentType, event.details);
          break;
      }
    }

    // Record the response itself as a GM action
    await memory.recordEvent('gm_response', {
      response: response.substring(0, 500) + (response.length > 500 ? '...' : ''),
      extractedEvents: events.length,
      location: session.currentScene?.location || 'unknown'
    }, events.length > 0 ? 0.6 : 0.3);

  } catch (error) {
    console.warn('Failed to record GM response in memory:', error);
  }
}

/**
 * Analyze player action to determine type and significance
 */
function analyzePlayerAction(action) {
  const actionLower = action.toLowerCase();
  
  // Combat actions
  if (actionLower.includes('attack') || actionLower.includes('fight') || 
      actionLower.includes('shoot') || actionLower.includes('cast') ||
      actionLower.includes('defend')) {
    return {
      type: 'combat',
      significance: 0.8,
      participants: extractMentionedCharacters(action)
    };
  }
  
  // Dialogue actions
  if (actionLower.includes('say') || actionLower.includes('tell') || 
      actionLower.includes('ask') || actionLower.includes('speak') ||
      action.includes('"')) {
    return {
      type: 'dialogue',
      significance: 0.5,
      participants: extractMentionedCharacters(action)
    };
  }
  
  // Movement actions
  if (actionLower.includes('go') || actionLower.includes('move') || 
      actionLower.includes('travel') || actionLower.includes('enter') ||
      actionLower.includes('leave')) {
    return {
      type: 'movement',
      significance: 0.4
    };
  }
  
  // Investigation actions
  if (actionLower.includes('search') || actionLower.includes('examine') || 
      actionLower.includes('investigate') || actionLower.includes('look')) {
    return {
      type: 'investigation',
      significance: 0.3
    };
  }
  
  // Default action
  return {
    type: 'general',
    significance: 0.2
  };
}

/**
 * Extract mentioned characters from text
 */
function extractMentionedCharacters(text) {
  // This is a simple implementation - could be enhanced with NER
  const words = text.split(/\s+/);
  const potentialNames = words.filter(word => 
    word[0] === word[0].toUpperCase() && 
    word.length > 2 && 
    !['I', 'The', 'A', 'An'].includes(word)
  );
  return potentialNames;
}

/**
 * Extract events from GM response text
 */
function extractEventsFromResponse(response) {
  const events = [];
  
  // Look for dialogue patterns
  const dialogueMatches = response.match(/"([^"]+)"/g);
  if (dialogueMatches) {
    dialogueMatches.forEach(match => {
      const beforeQuote = response.substring(0, response.indexOf(match));
      const speakerMatch = beforeQuote.match(/(\w+)\s+(?:says?|tells?|asks?|shouts?)/i);
      if (speakerMatch) {
        events.push({
          type: 'npc_dialogue',
          speaker: speakerMatch[1],
          content: match.replace(/"/g, ''),
          reactions: {}
        });
      }
    });
  }
  
  // Look for combat results
  if (response.match(/\b(dies?|killed|defeated|wounded|injured)\b/i)) {
    events.push({
      type: 'combat_result',
      participants: extractMentionedCharacters(response),
      outcome: 'combat resolved',
      casualties: []
    });
  }
  
  // Look for location changes
  const locationMatch = response.match(/(?:arrive|enter|reach|travel to)\s+(?:the\s+)?([^.]+)/i);
  if (locationMatch) {
    events.push({
      type: 'location_change',
      to: locationMatch[1].trim(),
      method: 'travel'
    });
  }
  
  return events;
}

/**
 * Generate world content (locations, NPCs, lore)
 */
export async function generateWorldContent(world, contentType, prompt) {
  const config = getSettingConfig(world.setting);
  const flavor = config.flavor;

  const systemPrompts = {
    location: `You are a world-builder for "${world.name}" (${config.name} setting).
Generate a location that fits STRICTLY within the ${config.name} genre.
Technology: ${flavor.technology}
Materials: ${flavor.materials}
Lighting: ${flavor.lighting}

Include: name, physical description, atmosphere, notable features, potential encounters.
The location MUST be appropriate for ${config.name} - no anachronisms!
Format as JSON.`,
    
    npc: `You are a world-builder for "${world.name}" (${config.name} setting).
Generate an NPC appropriate for the ${config.name} genre.
Available classes: ${config.classes.join(', ')}
Skills they might have: ${config.skills.join(', ')}

Include: name, role, appearance, personality, motivations, secrets.
The NPC MUST fit the ${config.name} setting!
Format as JSON.`,
    
    lore: `You are a world-builder for "${world.name}" (${config.name} setting).
Generate lore appropriate for the ${config.name} genre.
Technology level: ${flavor.technology}
Setting flavor: ${config.description}

Be creative but stay within setting bounds. No anachronisms!
Format as markdown.`,
    
    quest: `You are a world-builder for "${world.name}" (${config.name} setting).
Generate a quest appropriate for the ${config.name} genre.
Available locations: ${flavor.locations.join(', ')}
Currency: ${flavor.currency}
Technology: ${flavor.technology}

Include: hook, objective, complications, rewards.
Everything MUST fit the ${config.name} setting!
Format as JSON.`
  };

  const messages = [
    { role: 'system', content: systemPrompts[contentType] || systemPrompts.lore },
    { role: 'user', content: prompt }
  ];

  return await chat(messages, { temperature: 0.9, maxTokens: 1024 });
}

/**
 * Generate character backstory suggestions
 */
export async function generateBackstory(world, characterConcept) {
  const config = getSettingConfig(world.setting);

  const messages = [
    {
      role: 'system',
      content: `You are a creative writing assistant for "${world.name}" (${config.name} setting).
      
Setting: ${config.description}
Available classes: ${config.classes.join(', ')}
Technology: ${config.flavor.technology}

Generate 3 short backstory options (2-3 sentences each) for this character.
Each backstory MUST fit the ${config.name} setting - no anachronisms!
Make them distinct and interesting.`
    },
    { role: 'user', content: characterConcept }
  ];

  return await chat(messages, { temperature: 0.9 });
}

export default {
  checkHealth,
  chat,
  buildGMPrompt,
  generateGMResponse,
  generateWorldContent,
  generateBackstory
};
