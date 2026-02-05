import { useState } from 'react'

const CharacterPanel = ({ characters, selectedCharacter, onCharacterSelect }) => {
  const [isExpanded, setIsExpanded] = useState(true)

  const getModifier = (value) => {
    return Math.floor((value - 10) / 2)
  }

  const formatModifier = (modifier) => {
    return modifier >= 0 ? `+${modifier}` : `${modifier}`
  }

  const getHealthPercentage = (character) => {
    if (!character.health) return 100
    return (character.health.current / character.health.max) * 100
  }

  const getHealthColor = (percentage) => {
    if (percentage >= 75) return 'bg-success'
    if (percentage >= 50) return 'bg-warning'
    if (percentage >= 25) return 'bg-error'
    return 'bg-error opacity-75'
  }

  return (
    <div className="card">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            👥 Characters
            <span className="badge badge-primary">{characters.length}</span>
          </h3>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-sm btn-ghost"
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-3">
            {characters.length === 0 ? (
              <p className="text-muted text-center py-4">No characters in this session</p>
            ) : (
              characters.map((character) => (
                <div
                  key={character.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedCharacter?.id === character.id
                      ? 'border-primary-500 bg-primary-500 bg-opacity-10'
                      : 'border-border hover:border-border-light'
                  }`}
                  onClick={() => onCharacterSelect(character)}
                >
                  {/* Character Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{character.name}</h4>
                      <p className="text-sm text-muted">
                        {character.class} • Level {character.level}
                      </p>
                      {/* Credits Display */}
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-warning">💳</span>
                        <span className="text-primary font-medium">
                          {(character.credits || 1000).toLocaleString()} credits
                        </span>
                      </div>
                    </div>
                    {selectedCharacter?.id === character.id && (
                      <div className="badge badge-success">Active</div>
                    )}
                  </div>

                  {/* Health Bar */}
                  {character.health && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Health</span>
                        <span>{character.health.current}/{character.health.max}</span>
                      </div>
                      <div className="w-full bg-bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${getHealthColor(getHealthPercentage(character))}`}
                          style={{ width: `${getHealthPercentage(character)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Attributes */}
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {Object.entries(character.attributes || {}).map(([attr, value]) => (
                      <div key={attr} className="flex justify-between">
                        <span className="text-muted">{attr}</span>
                        <span className="font-medium">
                          {value} ({formatModifier(getModifier(value))})
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Status Effects */}
                  {character.conditions && character.conditions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {character.conditions.map((condition, index) => (
                        <span key={index} className="badge badge-warning text-xs">
                          {condition}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Relationships Preview */}
                  {character.relationships && Object.keys(character.relationships).length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-muted mb-1">Relationships:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(character.relationships).slice(0, 3).map(([npc, value]) => {
                          const getTrustIcon = (trust) => {
                            if (trust >= 0.7) return '😊'
                            if (trust >= 0.3) return '😐'
                            if (trust <= -0.3) return '😠'
                            return '🤔'
                          }
                          
                          return (
                            <span key={npc} className="text-xs" title={`${npc}: ${value.toFixed(1)}`}>
                              {getTrustIcon(value)} {npc.split(' ')[0]}
                            </span>
                          )
                        })}
                        {Object.keys(character.relationships).length > 3 && (
                          <span className="text-xs text-muted">
                            +{Object.keys(character.relationships).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CharacterPanel