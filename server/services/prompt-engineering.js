/**
 * Advanced Prompt Engineering for RPG AI
 * 
 * Implements sophisticated prompt construction techniques:
 * - Dynamic context prioritization
 * - Character voice consistency  
 * - Setting-aware constraint enforcement
 * - Adaptive detail levels based on scene importance
 * - Memory-guided narrative continuity
 */

import { getSettingConfig } from '../../shared/settings.js';

/**
 * Adaptive prompt templates based on scene types and importance
 */
const SCENE_TEMPLATES = {
  combat: {
    priority: 'action',
    detail: 'high',
    constraints: ['quick pacing', 'tactical clarity', 'consequence emphasis'],
    temperature: 0.7
  },
  dialogue: {
    priority: 'character',
    detail: 'medium',
    constraints: ['voice consistency', 'relationship awareness', 'subtext'],
    temperature: 0.8
  },
  exploration: {
    priority: 'environment',
    detail: 'high',
    constraints: ['atmospheric detail', 'discovery potential', 'setting consistency'],
    temperature: 0.9
  },
  puzzle: {
    priority: 'logic',
    detail: 'medium',
    constraints: ['fair clues', 'logical progression', 'player agency'],
    temperature: 0.6
  },
  story: {
    priority: 'narrative',
    detail: 'high',
    constraints: ['emotional impact', 'continuity', 'foreshadowing'],
    temperature: 0.85
  }
};

/**
 * Character voice patterns for consistent NPC dialogue
 */
const VOICE_PATTERNS = {
  noble: {
    vocabulary: 'formal, elevated',
    syntax: 'complete sentences, proper grammar',
    mannerisms: 'titles, courtesy, indirect requests'
  },
  commoner: {
    vocabulary: 'simple, practical',
    syntax: 'contractions, fragments',
    mannerisms: 'direct speech, colloquialisms'
  },
  scholar: {
    vocabulary: 'precise, technical',
    syntax: 'complex sentences, qualifiers',
    mannerisms: 'references to knowledge, teaching tone'
  },
  warrior: {
    vocabulary: 'direct, action-oriented',
    syntax: 'short sentences, imperatives',
    mannerisms: 'commands, honor references, practical focus'
  },
  merchant: {
    vocabulary: 'value-focused, persuasive',
    syntax: 'questions, conditionals',
    mannerisms: 'deals, bargains, profit mentions'
  }
};

/**
 * Dynamic constraint system based on setting and situation
 */
class PromptConstraintEngine {
  constructor(setting, style = 'balanced') {
    this.setting = getSettingConfig(setting);
    this.style = style;
    this.constraints = this.buildBaseConstraints();
  }

  buildBaseConstraints() {
    const constraints = {
      setting: this.buildSettingConstraints(),
      tone: this.buildToneConstraints(),
      mechanical: this.buildMechanicalConstraints(),
      narrative: this.buildNarrativeConstraints()
    };

    return constraints;
  }

  buildSettingConstraints() {
    const flavor = this.setting.flavor;
    
    return {
      technology: `Technology level MUST be: ${flavor.technology}`,
      materials: `Only use materials: ${flavor.materials}`,
      transport: `Available transport: ${flavor.transport}`,
      locations: `Appropriate locations: ${flavor.locations.join(', ')}`,
      currency: `Use currency: ${flavor.currency}`,
      lighting: `Lighting sources: ${flavor.lighting}`,
      
      forbidden: this.buildForbiddenElements(),
      required: this.buildRequiredElements()
    };
  }

  buildForbiddenElements() {
    const forbidden = [];
    
    switch (this.setting.name) {
      case 'High Fantasy':
        forbidden.push('modern technology', 'firearms', 'vehicles', 'electricity');
        break;
      case 'Science Fiction':
        forbidden.push('magic spells', 'medieval weapons', 'horses', 'torches', 'castles');
        break;
      case 'Horror':
        forbidden.push('comedic relief', 'easy solutions', 'perfect outcomes');
        break;
      case 'Post-Apocalyptic':
        forbidden.push('pristine environments', 'abundant resources', 'functioning governments');
        break;
    }
    
    return forbidden;
  }

  buildRequiredElements() {
    const required = [];
    
    switch (this.setting.name) {
      case 'High Fantasy':
        required.push('magical atmosphere', 'heroic potential', 'mythic resonance');
        break;
      case 'Science Fiction':
        required.push('technological wonder', 'scientific plausibility', 'future possibilities');
        break;
      case 'Horror':
        required.push('unsettling atmosphere', 'mounting tension', 'lurking threats');
        break;
      case 'Steampunk':
        required.push('mechanical ingenuity', 'Victorian propriety', 'industrial aesthetic');
        break;
    }
    
    return required;
  }

  buildToneConstraints() {
    const toneMap = {
      serious: {
        mood: 'dramatic, intense, consequential',
        avoid: 'humor, levity, trivial concerns',
        emphasize: 'stakes, tension, gravity'
      },
      balanced: {
        mood: 'engaging, varied, responsive to situation',
        avoid: 'extremes, inconsistency',
        emphasize: 'appropriate tone for scene context'
      },
      humorous: {
        mood: 'witty, entertaining, light-hearted',
        avoid: 'meanness, cruelty, despair',
        emphasize: 'clever wordplay, amusing situations, character quirks'
      },
      grimdark: {
        mood: 'harsh, unforgiving, morally complex',
        avoid: 'easy victories, clear heroes, simple solutions',
        emphasize: 'difficult choices, pyrrhic victories, moral ambiguity'
      }
    };

    return toneMap[this.style] || toneMap.balanced;
  }

  buildMechanicalConstraints() {
    return {
      rules: 'Use appropriate skill checks for uncertain outcomes',
      skills: `Available skills: ${this.setting.skills.join(', ')}`,
      attributes: `Character attributes: ${this.setting.attributes.join(', ')}`,
      classes: `Available classes: ${this.setting.classes.join(', ')}`,
      agency: 'NEVER control player characters directly',
      pacing: 'End with clear choices or situations requiring player response'
    };
  }

  buildNarrativeConstraints() {
    return {
      continuity: 'Maintain consistency with established facts and character behavior',
      consequences: 'Actions have realistic and meaningful consequences',
      agency: 'Respect player agency and character decisions',
      immersion: 'Maintain consistent world logic and atmosphere',
      engagement: 'Present interesting choices and meaningful challenges'
    };
  }

  /**
   * Generate contextual constraints for a specific scene
   */
  generateSceneConstraints(sceneType, characters, memory) {
    const template = SCENE_TEMPLATES[sceneType] || SCENE_TEMPLATES.story;
    const constraints = [];

    // Add base constraints
    constraints.push(`## CRITICAL CONSTRAINTS - ${this.setting.name.toUpperCase()}`);
    constraints.push(this.constraints.setting.technology);
    constraints.push(`FORBIDDEN: ${this.constraints.setting.forbidden.join(', ')}`);
    constraints.push(`REQUIRED: ${this.constraints.setting.required.join(', ')}`);

    // Add scene-specific constraints  
    constraints.push(`\n## SCENE FOCUS: ${sceneType.toUpperCase()}`);
    constraints.push(`Priority: ${template.priority}`);
    constraints.push(`Detail Level: ${template.detail}`);
    template.constraints.forEach(constraint => {
      constraints.push(`- ${constraint}`);
    });

    // Add character-specific constraints
    if (characters && characters.length > 0) {
      constraints.push(`\n## CHARACTER CONSTRAINTS`);
      characters.forEach(char => {
        if (char.personality) {
          constraints.push(`- ${char.name}: Maintain ${char.personality} personality`);
        }
        if (char.voice) {
          const voicePattern = VOICE_PATTERNS[char.voice] || VOICE_PATTERNS.commoner;
          constraints.push(`- ${char.name} speech: ${voicePattern.vocabulary}, ${voicePattern.mannerisms}`);
        }
      });
    }

    // Add memory-based constraints
    if (memory) {
      constraints.push(`\n## CONTINUITY CONSTRAINTS`);
      constraints.push('- Acknowledge established relationships and past events');
      constraints.push('- NPCs remember previous interactions');
      constraints.push('- Consequences of past actions continue to unfold');
    }

    return constraints.join('\n');
  }
}

/**
 * Adaptive detail controller based on scene importance and context budget
 */
class DetailController {
  constructor(contextBudget = 4000) {
    this.contextBudget = contextBudget;
    this.usedTokens = 0;
  }

  /**
   * Determine appropriate detail level for a scene element
   */
  getDetailLevel(elementType, importance, remainingBudget) {
    const budgetRatio = remainingBudget / this.contextBudget;
    
    const detailLevels = {
      minimal: { tokens: 20, description: 'brief mention' },
      basic: { tokens: 50, description: 'simple description' },
      detailed: { tokens: 150, description: 'rich description' },
      elaborate: { tokens: 300, description: 'comprehensive detail' }
    };

    // High importance elements get more detail when budget allows
    if (importance > 0.8 && budgetRatio > 0.3) {
      return budgetRatio > 0.6 ? 'elaborate' : 'detailed';
    } else if (importance > 0.6 && budgetRatio > 0.2) {
      return budgetRatio > 0.4 ? 'detailed' : 'basic';
    } else if (importance > 0.3 && budgetRatio > 0.1) {
      return 'basic';
    } else {
      return 'minimal';
    }
  }

  /**
   * Generate detail instructions for GM prompt
   */
  generateDetailInstructions(scene, budget) {
    const instructions = [`\n## DETAIL MANAGEMENT (Budget: ${budget} tokens)`];
    
    if (budget < 1000) {
      instructions.push('- Use concise, focused descriptions');
      instructions.push('- Prioritize immediate action over atmosphere');
      instructions.push('- Limit NPC dialogue to essentials');
    } else if (budget < 2000) {
      instructions.push('- Balance description with action');
      instructions.push('- Include key atmospheric details');
      instructions.push('- Develop important NPCs with personality');
    } else {
      instructions.push('- Rich, immersive descriptions welcome');
      instructions.push('- Develop atmosphere and mood fully');
      instructions.push('- Give NPCs distinct voices and mannerisms');
    }

    return instructions.join('\n');
  }
}

/**
 * Context-aware prompt builder
 */
export class AdvancedPromptBuilder {
  constructor(world, options = {}) {
    this.world = world;
    this.constraintEngine = new PromptConstraintEngine(world.setting, options.style);
    this.detailController = new DetailController(options.contextBudget);
  }

  /**
   * Build a complete GM prompt with all advanced features
   */
  async buildPrompt(session, memory, options = {}) {
    const {
      sceneType = 'story',
      importance = 0.5,
      contextBudget = 4000,
      includeMemory = true
    } = options;

    const sections = [];

    // Core identity and constraints
    sections.push(this.buildIdentitySection());
    sections.push(this.constraintEngine.generateSceneConstraints(
      sceneType, 
      session.characters, 
      includeMemory ? memory : null
    ));

    // World and scene context
    sections.push(this.buildWorldSection());
    sections.push(await this.buildSceneSection(session, sceneType));

    // Character context
    sections.push(this.buildCharacterSection(session.characters));

    // Memory context (if available and requested)
    if (memory && includeMemory) {
      sections.push(await memory.buildMemoryContext(session.currentScene, session.characters));
    }

    // Detail management instructions
    const usedBudget = sections.join('\n').length / 4; // Rough token estimate
    const remainingBudget = Math.max(500, contextBudget - usedBudget);
    sections.push(this.detailController.generateDetailInstructions(session.currentScene, remainingBudget));

    // Game mechanics reminder
    sections.push(this.buildMechanicsSection());

    return sections.join('\n\n');
  }

  buildIdentitySection() {
    return `You are the Game Master for "${this.world.name}", a ${this.constraintEngine.setting.name} RPG.

Your core responsibilities:
- Bring the world to life through vivid, consistent narration
- Challenge players with interesting situations and meaningful choices  
- Maintain setting authenticity and internal logic
- Respect player agency while driving compelling narrative
- Track consequences and maintain world continuity`;
  }

  buildWorldSection() {
    return `## World Context
**Setting:** ${this.constraintEngine.setting.name}
**Description:** ${this.world.description || 'A rich world awaiting exploration'}
**Tone:** ${this.constraintEngine.style} 

**Core Atmosphere:** ${this.constraintEngine.setting.description}`;
  }

  async buildSceneSection(session, sceneType) {
    const scene = session.currentScene || {};
    const template = SCENE_TEMPLATES[sceneType] || SCENE_TEMPLATES.story;

    let section = `## Current Scene: ${scene.name || 'Untitled Scene'}
**Type:** ${sceneType} (Focus: ${template.priority})
**Location:** ${scene.location || 'Unknown location'}`;

    if (scene.description) {
      section += `\n**Description:** ${scene.description}`;
    }

    if (scene.atmosphere) {
      section += `\n**Atmosphere:** ${scene.atmosphere}`;
    }

    // Add scene-specific elements
    if (scene.npcs && scene.npcs.length > 0) {
      section += `\n**NPCs Present:** ${scene.npcs.map(npc => 
        `${npc.name} (${npc.role || 'unknown role'}, ${npc.disposition || 'neutral'})`
      ).join(', ')}`;
    }

    if (scene.threats && scene.threats.length > 0) {
      section += `\n**Active Threats:** ${scene.threats.join(', ')}`;
    }

    if (scene.opportunities && scene.opportunities.length > 0) {
      section += `\n**Available Opportunities:** ${scene.opportunities.join(', ')}`;
    }

    return section;
  }

  buildCharacterSection(characters) {
    if (!characters || characters.length === 0) {
      return '## Active Characters\nNo characters currently active.';
    }

    let section = '## Active Characters';
    
    characters.forEach(char => {
      const attrs = Object.entries(char.attributes || {})
        .map(([k, v]) => `${k}:${v}`)
        .join(', ');
      
      section += `\n**${char.name}** (${char.class || 'Adventurer'}, Level ${char.level})`;
      section += `\n  - Attributes: [${attrs}]`;
      
      if (char.personality) {
        section += `\n  - Personality: ${char.personality}`;
      }
      
      if (char.goals && char.goals.length > 0) {
        section += `\n  - Goals: ${char.goals.join(', ')}`;
      }
      
      if (char.relationships && Object.keys(char.relationships).length > 0) {
        const relationships = Object.entries(char.relationships)
          .map(([target, value]) => `${target} (${value > 0 ? '+' : ''}${value})`)
          .join(', ');
        section += `\n  - Relationships: ${relationships}`;
      }
      
      if (char.conditions && char.conditions.length > 0) {
        section += `\n  - Current Conditions: ${char.conditions.join(', ')}`;
      }
    });

    return section;
  }

  buildMechanicsSection() {
    const skills = this.constraintEngine.setting.skills.slice(0, 8).join(', ');
    
    return `## Game Mechanics
- Use skill checks for uncertain outcomes: [ROLL:skill:difficulty]
- Primary skills: ${skills}
- Responses should be 2-4 paragraphs unless epic moment requires more
- Always end with situation requiring player decision or action
- NEVER directly control player characters
- Track and mention relationship changes when relevant`;
  }
}

export default AdvancedPromptBuilder;