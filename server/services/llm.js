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
 * Game Master system prompt builder
 */
export function buildGMPrompt(world, session, options = {}) {
  const { style = 'balanced', rulesStrict = false } = options;
  const config = getSettingConfig(world.setting);

  const styleDescriptions = {
    serious: 'Narrate in a dramatic, immersive tone. Focus on atmosphere and tension.',
    balanced: 'Balance description with action. Be vivid but concise.',
    humorous: 'Include wit and humor while maintaining the story. Light-hearted but engaging.',
    grimdark: 'Emphasize danger, consequence, and moral ambiguity. The world is harsh.'
  };

  return `You are the Game Master for "${world.name}", a ${config.name} role-playing game.

${buildSettingFlavor(world.setting)}

## Your Role
${styleDescriptions[style] || styleDescriptions.balanced}

## World Description
${world.description || `A ${config.name} world awaiting adventure.`}

## Current Scene
${session.currentScene || 'The adventure begins...'}

## Active Characters
${session.characters?.map(c => {
  const attrs = Object.entries(c.attributes || {})
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');
  return `- ${c.name} (${c.class || 'Adventurer'}, Level ${c.level}) [${attrs}]`;
}).join('\n') || 'No characters yet'}

## Game Rules
${rulesStrict ? 
  '- Strictly enforce game rules and character limitations' :
  '- Favor fun and narrative over strict rules when appropriate'}
- When an action has uncertain outcome, indicate a roll: [ROLL:${config.skills[0] || 'skill'}:difficulty]
- Use the setting's skill list for rolls: ${config.skills.slice(0, 5).join(', ')}...
- Keep responses focused (2-4 paragraphs max)
- End scenes with clear situation or choice for players
- NEVER control player characters - only NPCs and environment
- ALL descriptions must fit the ${config.name} setting - no anachronisms!

## Recent Events
${session.recentHistory?.slice(-5).join('\n') || 'Session just started.'}`;
}

/**
 * Generate GM response to player action
 */
export async function generateGMResponse(world, session, playerAction, options = {}) {
  const systemPrompt = buildGMPrompt(world, session, options);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...session.messageHistory || [],
    { role: 'user', content: playerAction }
  ];

  const response = await chat(messages, {
    temperature: 0.8,
    maxTokens: 800
  });

  return response;
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
