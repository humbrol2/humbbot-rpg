import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getWorlds, createWorld, deleteWorld } from '../api/worlds'

const SETTING_TEMPLATES = [
  { id: 'fantasy', name: 'High Fantasy', description: 'Swords, sorcery, and epic quests', emoji: '⚔️' },
  { id: 'scifi', name: 'Science Fiction', description: 'Space exploration and future tech', emoji: '🚀' },
  { id: 'horror', name: 'Horror', description: 'Dark mysteries and supernatural terror', emoji: '👻' },
  { id: 'modern', name: 'Modern', description: 'Contemporary setting with a twist', emoji: '🏙️' },
  { id: 'steampunk', name: 'Steampunk', description: 'Victorian era meets advanced technology', emoji: '⚙️' },
  { id: 'post-apocalyptic', name: 'Post-Apocalyptic', description: 'Survival in a ruined world', emoji: '☢️' },
  { id: 'custom', name: 'Custom', description: 'Build your own setting from scratch', emoji: '✨' },
]

function Worlds() {
  const [worlds, setWorlds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newWorld, setNewWorld] = useState({ name: '', setting: '', description: '' })
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadWorlds()
  }, [])

  async function loadWorlds() {
    try {
      const data = await getWorlds()
      setWorlds(data)
    } catch (error) {
      console.error('Failed to load worlds:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateWorld(e) {
    e.preventDefault()
    if (!newWorld.name || !newWorld.setting) return

    setCreating(true)
    try {
      const created = await createWorld(newWorld)
      setWorlds([created, ...worlds])
      setShowCreate(false)
      setNewWorld({ name: '', setting: '', description: '' })
      navigate(`/worlds/${created.id}`)
    } catch (error) {
      console.error('Failed to create world:', error)
      alert('Failed to create world')
    } finally {
      setCreating(false)
    }
  }

  async function handleDeleteWorld(id, name) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return

    try {
      await deleteWorld(id)
      setWorlds(worlds.filter(w => w.id !== id))
    } catch (error) {
      console.error('Failed to delete world:', error)
      alert('Failed to delete world')
    }
  }

  function selectTemplate(template) {
    setNewWorld({
      ...newWorld,
      setting: template.id,
      name: newWorld.name || `My ${template.name} World`
    })
  }

  if (loading) {
    return <div className="loading">Loading worlds...</div>
  }

  return (
    <div className="worlds-page">
      <header className="page-header">
        <h1>🌍 Worlds</h1>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Create World
        </button>
      </header>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New World</h2>
            
            <form onSubmit={handleCreateWorld}>
              <div className="form-group">
                <label>World Name</label>
                <input
                  type="text"
                  value={newWorld.name}
                  onChange={e => setNewWorld({ ...newWorld, name: e.target.value })}
                  placeholder="Enter world name..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Setting Template</label>
                <div className="template-grid">
                  {SETTING_TEMPLATES.map(template => (
                    <div
                      key={template.id}
                      className={`template-card ${newWorld.setting === template.id ? 'selected' : ''}`}
                      onClick={() => selectTemplate(template)}
                    >
                      <span className="template-emoji">{template.emoji}</span>
                      <strong>{template.name}</strong>
                      <small>{template.description}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={newWorld.description}
                  onChange={e => setNewWorld({ ...newWorld, description: e.target.value })}
                  placeholder="Describe your world..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating || !newWorld.setting}>
                  {creating ? 'Creating...' : 'Create World'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {worlds.length === 0 ? (
        <div className="empty-state">
          <h2>No worlds yet</h2>
          <p>Create your first world to start your adventure!</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Create World
          </button>
        </div>
      ) : (
        <div className="worlds-grid">
          {worlds.map(world => (
            <div key={world.id} className="world-card">
              <div className="world-card-header">
                <span className="world-setting-badge">{world.setting}</span>
                <button
                  className="btn-icon btn-danger"
                  onClick={() => handleDeleteWorld(world.id, world.name)}
                  title="Delete world"
                >
                  🗑️
                </button>
              </div>
              <h3>{world.name}</h3>
              <p>{world.description || 'No description'}</p>
              <div className="world-card-actions">
                <Link to={`/worlds/${world.id}`} className="btn btn-primary">
                  Enter World
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Worlds
