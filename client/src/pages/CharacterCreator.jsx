import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getWorlds } from '../api/worlds'
import { createCharacter } from '../api/characters'

const DEFAULT_ATTRIBUTES = {
  STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10
}

const CLASSES = [
  'Warrior', 'Mage', 'Rogue', 'Cleric', 'Ranger', 'Bard', 
  'Paladin', 'Warlock', 'Monk', 'Barbarian', 'Custom'
]

function CharacterCreator() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedWorld = searchParams.get('world')

  const [worlds, setWorlds] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const [character, setCharacter] = useState({
    world_id: preselectedWorld || '',
    name: '',
    class: '',
    level: 1,
    attributes: { ...DEFAULT_ATTRIBUTES },
    backstory: ''
  })

  const [pointsRemaining, setPointsRemaining] = useState(27)

  useEffect(() => {
    loadWorlds()
  }, [])

  useEffect(() => {
    // Point buy system: start with 8 in each, spend points to increase
    const basePoints = 6 * 8 // 48 base
    const currentPoints = Object.values(character.attributes).reduce((a, b) => a + b, 0)
    setPointsRemaining(27 - (currentPoints - 60)) // 60 is 6 x 10 (default)
  }, [character.attributes])

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
    // 4d6 drop lowest for each
    const roll4d6 = () => {
      const rolls = [1,2,3,4].map(() => Math.floor(Math.random() * 6) + 1)
      rolls.sort((a, b) => b - a)
      return rolls[0] + rolls[1] + rolls[2]
    }

    setCharacter(prev => ({
      ...prev,
      attributes: {
        STR: roll4d6(),
        DEX: roll4d6(),
        CON: roll4d6(),
        INT: roll4d6(),
        WIS: roll4d6(),
        CHA: roll4d6()
      }
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!character.name || !character.world_id) return

    setCreating(true)
    try {
      const created = await createCharacter(character)
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
              {CLASSES.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>Attributes</h2>
          <p className="points-display">
            Points remaining: <strong>{pointsRemaining}</strong>
            <button type="button" className="btn btn-small" onClick={rollAttributes}>
              🎲 Roll
            </button>
          </p>

          <div className="attributes-grid">
            {Object.entries(character.attributes).map(([attr, value]) => (
              <div key={attr} className="attribute-row">
                <span className="attr-name">{attr}</span>
                <div className="attr-controls">
                  <button type="button" onClick={() => adjustAttribute(attr, -1)}>-</button>
                  <span className="attr-value">{value}</span>
                  <button type="button" onClick={() => adjustAttribute(attr, 1)}>+</button>
                </div>
                <span className="attr-modifier">
                  ({value >= 10 ? '+' : ''}{Math.floor((value - 10) / 2)})
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
              placeholder="Write your character's backstory... (optional)"
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
