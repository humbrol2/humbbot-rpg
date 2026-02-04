import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getWorlds } from '../api/worlds'
import { createCharacter, getSettingConfig } from '../api/characters'

function CharacterCreator() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedWorld = searchParams.get('world')

  const [worlds, setWorlds] = useState([])
  const [settingConfig, setSettingConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [character, setCharacter] = useState({
    world_id: preselectedWorld || '',
    name: '',
    class: '',
    level: 1,
    attributes: {},
    backstory: ''
  })

  const [pointsRemaining, setPointsRemaining] = useState(27)

  useEffect(() => {
    loadWorlds()
  }, [])

  useEffect(() => {
    if (character.world_id) {
      loadSettingConfig()
    }
  }, [character.world_id])

  useEffect(() => {
    if (settingConfig) {
      // Calculate points remaining based on setting's attributes
      const baseValue = 10
      const totalBase = settingConfig.attributes.length * baseValue
      const currentTotal = Object.values(character.attributes).reduce((a, b) => a + b, 0)
      setPointsRemaining(27 - (currentTotal - totalBase))
    }
  }, [character.attributes, settingConfig])

  async function loadWorlds() {
    try {
      const data = await getWorlds()
      setWorlds(data)
      if (data.length > 0 && !character.world_id) {
        setCharacter(prev => ({ ...prev, world_id: data[0].id }))
      }
    } catch (error) {
      console.error('Failed to load worlds:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadSettingConfig() {
    const world = worlds.find(w => w.id === character.world_id)
    if (!world) return

    try {
      const config = await getSettingConfig(world.setting)
      setSettingConfig(config)
      
      // Initialize attributes for this setting
      const newAttrs = {}
      config.attributes.forEach(attr => {
        newAttrs[attr] = 10
      })
      setCharacter(prev => ({ ...prev, attributes: newAttrs, class: '' }))
    } catch (error) {
      console.error('Failed to load setting config:', error)
    }
  }

  function adjustAttribute(attr, delta) {
    const current = character.attributes[attr]
    const newVal = current + delta

    // Limits: 8-15 with point buy
    if (newVal < 8 || newVal > 15) return

    // Check points
    const cost = delta > 0 ? (newVal > 13 ? 2 : 1) : (current > 13 ? -2 : -1)
    if (delta > 0 && pointsRemaining < cost) return

    setCharacter(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [attr]: newVal }
    }))
  }

  function rollAttributes() {
    if (!settingConfig) return

    // 4d6 drop lowest for each
    const roll4d6 = () => {
      const rolls = [1,2,3,4].map(() => Math.floor(Math.random() * 6) + 1)
      rolls.sort((a, b) => b - a)
      return rolls[0] + rolls[1] + rolls[2]
    }

    const newAttrs = {}
    settingConfig.attributes.forEach(attr => {
      newAttrs[attr] = roll4d6()
    })

    setCharacter(prev => ({
      ...prev,
      attributes: newAttrs
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!character.name || !character.world_id) return

    setCreating(true)
    try {
      await createCharacter(character)
      navigate(`/worlds/${character.world_id}`)
    } catch (error) {
      console.error('Failed to create character:', error)
      alert('Failed to create character')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  if (worlds.length === 0) {
    return (
      <div className="empty-state">
        <h2>No worlds available</h2>
        <p>Create a world first before making characters.</p>
        <button className="btn btn-primary" onClick={() => navigate('/worlds')}>
          Go to Worlds
        </button>
      </div>
    )
  }

  const selectedWorld = worlds.find(w => w.id === character.world_id)

  return (
    <div className="character-creator">
      <h1>👤 Create Character</h1>

      <form onSubmit={handleSubmit} className="creator-form">
        <div className="form-section">
          <h2>Basics</h2>
          
          <div className="form-group">
            <label>World</label>
            <select
              value={character.world_id}
              onChange={e => setCharacter({ ...character, world_id: e.target.value })}
              required
            >
              {worlds.map(world => (
                <option key={world.id} value={world.id}>
                  {world.name} ({world.setting})
                </option>
              ))}
            </select>
          </div>

          {settingConfig && (
            <div className="setting-info">
              <span className="setting-badge">{settingConfig.name}</span>
              <small>{settingConfig.description}</small>
            </div>
          )}

          <div className="form-group">
            <label>Character Name</label>
            <input
              type="text"
              value={character.name}
              onChange={e => setCharacter({ ...character, name: e.target.value })}
              placeholder="Enter name..."
              required
            />
          </div>

          <div className="form-group">
            <label>Class</label>
            <select
              value={character.class}
              onChange={e => setCharacter({ ...character, class: e.target.value })}
            >
              <option value="">Select class...</option>
              {settingConfig?.classes.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
            {settingConfig && (
              <small className="setting-hint">
                Classes available in {settingConfig.name} setting
              </small>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2>Attributes</h2>
          {settingConfig && (
            <p className="setting-hint">
              Attributes for {settingConfig.name}: {settingConfig.attributes.join(', ')}
            </p>
          )}
          <p className="points-display">
            Points remaining: <strong>{pointsRemaining}</strong>
            <button type="button" className="btn btn-small" onClick={rollAttributes}>
              🎲 Roll
            </button>
          </p>

          <div className="attributes-grid">
            {settingConfig?.attributes.map(attr => (
              <div key={attr} className="attribute-row">
                <span className="attr-name" title={settingConfig.attributeNames[attr]}>
                  {attr}
                </span>
                <div className="attr-controls">
                  <button type="button" onClick={() => adjustAttribute(attr, -1)}>-</button>
                  <span className="attr-value">{character.attributes[attr] || 10}</span>
                  <button type="button" onClick={() => adjustAttribute(attr, 1)}>+</button>
                </div>
                <span className="attr-modifier">
                  ({(character.attributes[attr] || 10) >= 10 ? '+' : ''}
                  {Math.floor(((character.attributes[attr] || 10) - 10) / 2)})
                </span>
                <span className="attr-fullname">
                  {settingConfig.attributeNames[attr]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h2>Backstory</h2>
          <div className="form-group">
            <textarea
              value={character.backstory}
              onChange={e => setCharacter({ ...character, backstory: e.target.value })}
              placeholder={`Write your character's backstory for the ${settingConfig?.name || ''} setting... (optional)`}
              rows={4}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? 'Creating...' : 'Create Character'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CharacterCreator
