/**
 * Setting Templates
 * Defines attributes, skills, and flavor for each setting type
 */

export const SETTINGS = {
  fantasy: {
    name: 'High Fantasy',
    description: 'Swords, sorcery, dragons, and epic quests',
    attributes: ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'],
    attributeNames: {
      STR: 'Strength',
      DEX: 'Dexterity', 
      CON: 'Constitution',
      INT: 'Intelligence',
      WIS: 'Wisdom',
      CHA: 'Charisma'
    },
    classes: ['Warrior', 'Mage', 'Rogue', 'Cleric', 'Ranger', 'Bard', 'Paladin', 'Warlock'],
    skills: ['Melee', 'Ranged', 'Magic', 'Stealth', 'Perception', 'Persuasion', 'Athletics', 'Arcana', 'Nature', 'Religion'],
    flavor: {
      locations: ['tavern', 'castle', 'forest', 'dungeon', 'village', 'tower', 'cave', 'temple'],
      currency: 'gold coins',
      technology: 'medieval (swords, bows, horses, candles)',
      transport: 'horseback, cart, ship, walking',
      lighting: 'torches, candles, magical light',
      materials: 'stone, wood, iron, leather'
    }
  },

  scifi: {
    name: 'Science Fiction',
    description: 'Space exploration, future technology, and alien encounters',
    attributes: ['PHY', 'REF', 'TEC', 'INT', 'WIL', 'SOC'],
    attributeNames: {
      PHY: 'Physique',
      REF: 'Reflexes',
      TEC: 'Technical',
      INT: 'Intelligence',
      WIL: 'Willpower',
      SOC: 'Social'
    },
    classes: ['Marine', 'Pilot', 'Engineer', 'Scientist', 'Medic', 'Hacker', 'Diplomat', 'Mercenary'],
    skills: ['Firearms', 'Piloting', 'Hacking', 'Engineering', 'Medicine', 'Science', 'Stealth', 'Negotiation', 'Zero-G', 'Xenology'],
    flavor: {
      locations: ['space station', 'starship', 'colony', 'megacity', 'orbital platform', 'alien world', 'research lab'],
      currency: 'credits',
      technology: 'advanced (energy weapons, FTL travel, AI, cybernetics)',
      transport: 'spacecraft, hover vehicles, teleportation, mag-trains',
      lighting: 'holographic displays, LED panels, neon, bioluminescence',
      materials: 'plasteel, carbon fiber, energy shields, nanomaterials'
    }
  },

  horror: {
    name: 'Horror',
    description: 'Dark mysteries, supernatural terror, and survival',
    attributes: ['STR', 'AGI', 'END', 'INT', 'WIL', 'CHA'],
    attributeNames: {
      STR: 'Strength',
      AGI: 'Agility',
      END: 'Endurance',
      INT: 'Intelligence',
      WIL: 'Willpower',
      CHA: 'Charisma'
    },
    classes: ['Investigator', 'Occultist', 'Survivor', 'Medium', 'Hunter', 'Scholar', 'Priest', 'Journalist'],
    skills: ['Investigation', 'Occult', 'Stealth', 'Medicine', 'Firearms', 'Psychology', 'Athletics', 'Sanity', 'First Aid', 'Research'],
    flavor: {
      locations: ['abandoned asylum', 'haunted mansion', 'foggy cemetery', 'dark forest', 'decrepit church', 'isolated cabin'],
      currency: 'dollars',
      technology: 'period-appropriate (1920s-modern)',
      transport: 'car, train, walking, boat',
      lighting: 'flickering lights, moonlight, flashlights, candles',
      materials: 'rotting wood, rusted iron, cracked stone, decaying fabric'
    }
  },

  modern: {
    name: 'Modern',
    description: 'Contemporary setting with realistic or supernatural elements',
    attributes: ['STR', 'AGI', 'CON', 'INT', 'PER', 'CHA'],
    attributeNames: {
      STR: 'Strength',
      AGI: 'Agility',
      CON: 'Constitution',
      INT: 'Intelligence',
      PER: 'Perception',
      CHA: 'Charisma'
    },
    classes: ['Agent', 'Detective', 'Soldier', 'Hacker', 'Doctor', 'Criminal', 'Journalist', 'Executive'],
    skills: ['Firearms', 'Driving', 'Computers', 'Investigation', 'Persuasion', 'Stealth', 'Medicine', 'Athletics', 'Streetwise', 'Law'],
    flavor: {
      locations: ['city streets', 'office building', 'warehouse', 'apartment', 'nightclub', 'airport', 'hospital'],
      currency: 'dollars/euros',
      technology: 'contemporary (smartphones, cars, computers, firearms)',
      transport: 'car, plane, train, motorcycle, subway',
      lighting: 'electric lights, screens, streetlights',
      materials: 'concrete, glass, steel, plastic'
    }
  },

  steampunk: {
    name: 'Steampunk',
    description: 'Victorian era meets advanced steam-powered technology',
    attributes: ['STR', 'DEX', 'CON', 'INT', 'WIT', 'PRE'],
    attributeNames: {
      STR: 'Strength',
      DEX: 'Dexterity',
      CON: 'Constitution',
      INT: 'Intelligence',
      WIT: 'Wit',
      PRE: 'Presence'
    },
    classes: ['Inventor', 'Aristocrat', 'Airship Captain', 'Automaton', 'Detective', 'Rogue', 'Soldier', 'Scholar'],
    skills: ['Engineering', 'Etiquette', 'Piloting', 'Firearms', 'Melee', 'Science', 'Persuasion', 'Stealth', 'Medicine', 'Clockwork'],
    flavor: {
      locations: ['airship', 'clocktower', 'factory', 'manor house', 'underground lair', 'laboratory', 'Victorian street'],
      currency: 'pounds sterling',
      technology: 'steam-powered (clockwork, brass, gears, goggles, airships)',
      transport: 'airship, steam train, clockwork carriage, ornithopter',
      lighting: 'gas lamps, arc lights, glowing tubes',
      materials: 'brass, copper, leather, polished wood, iron, glass'
    }
  },

  'post-apocalyptic': {
    name: 'Post-Apocalyptic',
    description: 'Survival in a ruined world after civilization collapsed',
    attributes: ['STR', 'AGI', 'END', 'INT', 'PER', 'LCK'],
    attributeNames: {
      STR: 'Strength',
      AGI: 'Agility',
      END: 'Endurance',
      INT: 'Intelligence',
      PER: 'Perception',
      LCK: 'Luck'
    },
    classes: ['Scavenger', 'Wastelander', 'Mutant', 'Tech Salvager', 'Medic', 'Raider', 'Settler', 'Nomad'],
    skills: ['Survival', 'Scavenging', 'Firearms', 'Melee', 'Medicine', 'Repair', 'Barter', 'Stealth', 'Driving', 'Radiation'],
    flavor: {
      locations: ['ruined city', 'wasteland', 'bunker', 'settlement', 'toxic zone', 'abandoned mall', 'crater'],
      currency: 'bottle caps, barter goods, clean water',
      technology: 'scavenged pre-war tech, makeshift weapons, jury-rigged vehicles',
      transport: 'salvaged vehicles, walking, mutant mounts',
      lighting: 'fires, salvaged lights, bioluminescent fungi',
      materials: 'rust, scrap metal, salvaged plastic, irradiated debris'
    }
  },

  custom: {
    name: 'Custom',
    description: 'Build your own setting from scratch',
    attributes: ['ATTR1', 'ATTR2', 'ATTR3', 'ATTR4', 'ATTR5', 'ATTR6'],
    attributeNames: {
      ATTR1: 'Attribute 1',
      ATTR2: 'Attribute 2',
      ATTR3: 'Attribute 3',
      ATTR4: 'Attribute 4',
      ATTR5: 'Attribute 5',
      ATTR6: 'Attribute 6'
    },
    classes: ['Custom Class'],
    skills: ['Custom Skill'],
    flavor: {
      locations: ['custom location'],
      currency: 'custom currency',
      technology: 'custom technology level',
      transport: 'custom transport',
      lighting: 'custom lighting',
      materials: 'custom materials'
    }
  }
};

export function getSettingConfig(settingId) {
  return SETTINGS[settingId] || SETTINGS.custom;
}

export function getDefaultAttributes(settingId) {
  const setting = getSettingConfig(settingId);
  const attrs = {};
  setting.attributes.forEach(attr => {
    attrs[attr] = 10;
  });
  return attrs;
}

export default SETTINGS;
