/**
 * LLM Service - Connects to llama.cpp server
 * 
 * Provides AI Game Master capabilities:
 * - Scene narration
 * - NPC dialogue
 * - Action resolution
 * - World generation
 */

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
 * Game Master system prompt builder
 */
export function buildGMPrompt(world, session, options = {}) {
  const { style = 'balanced', rulesStrict = false } = options;

  const styleDescriptions = {
    serious: 'Narrate in a dramatic, immersive tone. Focus on atmosphere and tension.',
    balanced: 'Balance description with action. Be vivid but concise.',
    humorous: 'Include wit and humor while maintaining the story. Light-hearted but engaging.',
    grimdark: 'Emphasize danger, consequence, and moral ambiguity. The world is harsh.'
  };

  return `You are the Game Master for "${world.name}", a ${world.setting} role-playing game.

## Your Role
${styleDescriptions[style] || styleDescriptions.balanced}

## World Context
${world.description}

## Current Scene
${session.currentScene || 'The adventure begins...'}

## Active Characters
${session.characters?.map(c => `- ${c.name} (${c.class}, Level ${c.level})`).join('\n') || 'No characters yet'}

## Rules
${rulesStrict ? 
  '- Strictly enforce game rules and character limitations' :
  '- Favor fun and narrative over strict rules when appropriate'}
- When an action has uncertain outcome, indicate a roll is needed: [ROLL:skill:difficulty]
- Keep responses focused and actionable (2-4 paragraphs max)
- End scenes with a clear situation or choice for players
- Never control player characters - only describe the world and NPCs

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
  const systemPrompts = {
    location: `You are a world-builder for "${world.name}" (${world.setting}). Generate a detailed location description. Include: name, physical description, atmosphere, notable features, potential encounters or secrets. Format as JSON.`,
    
    npc: `You are a world-builder for "${world.name}" (${world.setting}). Generate an NPC. Include: name, role, appearance, personality, motivations, secrets. Format as JSON.`,
    
    lore: `You are a world-builder for "${world.name}" (${world.setting}). Generate a piece of world lore or history. Be creative and tie it to the setting's themes. Format as markdown.`,
    
    quest: `You are a world-builder for "${world.name}" (${world.setting}). Generate a quest or adventure hook. Include: hook, objective, complications, rewards. Format as JSON.`
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
  const messages = [
    {
      role: 'system',
      content: `You are a creative writing assistant helping build a character for "${world.name}" (${world.setting}). Generate 3 short backstory options (2-3 sentences each) based on the character concept. Make them distinct and interesting.`
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
