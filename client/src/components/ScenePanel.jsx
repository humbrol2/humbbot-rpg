import { useState } from 'react'

const ScenePanel = ({ scene, onSceneUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})

  const handleEdit = () => {
    setEditData({
      name: scene?.name || '',
      location: scene?.location || '',
      description: scene?.description || '',
      atmosphere: scene?.atmosphere || ''
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    onSceneUpdate(editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditData({})
  }

  const getWeatherIcon = (weather) => {
    const icons = {
      clear: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      stormy: '⛈️',
      foggy: '🌫️',
      snowy: '❄️',
    }
    return icons[weather] || '🌤️'
  }

  const getTimeIcon = (timeOfDay) => {
    const icons = {
      dawn: '🌅',
      morning: '🌄',
      noon: '☀️',
      afternoon: '🌤️',
      evening: '🌆',
      dusk: '🌇',
      night: '🌙',
      midnight: '🌚',
    }
    return icons[timeOfDay] || '⏰'
  }

  if (!scene) {
    return (
      <div className="card">
        <div className="p-4 text-center text-muted">
          <div className="text-4xl mb-2">🌫️</div>
          <p>Scene data not available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            🎭 Current Scene
          </h3>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="btn btn-sm btn-ghost"
                title="Edit scene"
              >
                ✏️
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="btn btn-sm btn-ghost"
            >
              {isExpanded ? '−' : '+'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="space-y-4">
            {isEditing ? (
              // Edit Mode
              <div className="space-y-3">
                <div className="form-group">
                  <label className="form-label">Scene Name</label>
                  <input
                    type="text"
                    className="input"
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Village Tavern"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="input"
                    value={editData.location}
                    onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., The Prancing Pony"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="input textarea"
                    value={editData.description}
                    onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the scene..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Atmosphere</label>
                  <input
                    type="text"
                    className="input"
                    value={editData.atmosphere}
                    onChange={(e) => setEditData(prev => ({ ...prev, atmosphere: e.target.value }))}
                    placeholder="e.g., cozy and welcoming"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleCancel}
                    className="btn btn-sm btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn btn-sm btn-primary"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              // Display Mode
              <div className="space-y-4">
                {/* Scene Header */}
                <div>
                  <h4 className="font-semibold text-primary-400 mb-1">
                    {scene.name || 'Unnamed Scene'}
                  </h4>
                  {scene.location && (
                    <p className="text-sm text-muted">📍 {scene.location}</p>
                  )}
                </div>

                {/* Scene Description */}
                {scene.description && (
                  <div>
                    <h5 className="text-sm font-medium text-muted mb-1">Description</h5>
                    <p className="text-sm leading-relaxed">{scene.description}</p>
                  </div>
                )}

                {/* Atmosphere */}
                {scene.atmosphere && (
                  <div>
                    <h5 className="text-sm font-medium text-muted mb-1">Atmosphere</h5>
                    <p className="text-sm italic">{scene.atmosphere}</p>
                  </div>
                )}

                {/* Environmental Conditions */}
                {(scene.timeOfDay || scene.weather) && (
                  <div>
                    <h5 className="text-sm font-medium text-muted mb-2">Conditions</h5>
                    <div className="flex flex-wrap gap-2">
                      {scene.timeOfDay && (
                        <div className="badge badge-info">
                          {getTimeIcon(scene.timeOfDay)} {scene.timeOfDay}
                        </div>
                      )}
                      {scene.weather && (
                        <div className="badge badge-info">
                          {getWeatherIcon(scene.weather)} {scene.weather}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* NPCs Present */}
                {scene.npcs && scene.npcs.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-muted mb-2">NPCs Present</h5>
                    <div className="space-y-2">
                      {scene.npcs.map((npc, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="font-medium">{npc.name}</span>
                          <div className="flex items-center gap-2">
                            {npc.role && (
                              <span className="text-muted">{npc.role}</span>
                            )}
                            <span className={`badge ${
                              npc.disposition === 'friendly' ? 'badge-success' :
                              npc.disposition === 'hostile' ? 'badge-error' :
                              npc.disposition === 'suspicious' ? 'badge-warning' :
                              'badge-info'
                            }`}>
                              {npc.disposition || 'neutral'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Threats & Opportunities */}
                <div className="grid grid-cols-1 gap-3">
                  {scene.threats && scene.threats.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-muted mb-1">⚠️ Threats</h5>
                      <div className="flex flex-wrap gap-1">
                        {scene.threats.map((threat, index) => (
                          <span key={index} className="badge badge-error text-xs">
                            {threat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {scene.opportunities && scene.opportunities.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-muted mb-1">✨ Opportunities</h5>
                      <div className="flex flex-wrap gap-1">
                        {scene.opportunities.map((opportunity, index) => (
                          <span key={index} className="badge badge-success text-xs">
                            {opportunity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Scene Statistics */}
                {scene.visitCount && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex justify-between text-xs text-muted">
                      <span>Visits: {scene.visitCount}</span>
                      {scene.lastVisited && (
                        <span>Last: {new Date(scene.lastVisited).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ScenePanel