import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getWorld } from '../api/worlds'
import { getCharacters, createCharacter } from '../api/characters'
import { getSessions, createSession } from '../api/sessions'

function WorldDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [world, setWorld] = useState(null)
  const [characters, setCharacters] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('characters')

  useEffect(() => {
    loadWorldData()
  }, [id])

  async function loadWorldData() {
    try {
      const [worldData, charsData, sessionsData] = await Promise.all([
        getWorld(id),
        getCharacters(id),
        getSessions(id)
      ])
      setWorld(worldData)
      setCharacters(charsData)
      setSessions(sessionsData)
    } catch (error) {
      console.error('Failed to load world:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleStartSession() {
    if (characters.length === 0) {
      alert('Create at least one character first!')
      return
    }

    try {
      const session = await createSession({
        world_id: id,
        name: `Adventure ${new Date().toLocaleDateString()}`,
        character_ids: characters.map(c => c.id)
      })
      navigate(`/session/${session.id}`)
    } catch (error) {
      console.error('Failed to start session:', error)
      alert('Failed to start session')
    }
  }

  async function handleQuickCharacter() {
    const name = prompt('Character name:')
    if (!name) return

    try {
      const char = await createCharacter({
        world_id: id,
        name,
        class: 'Adventurer',
        level: 1,
        attributes: { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 }
      })
      setCharacters([...characters, char])
    } catch (error) {
      console.error('Failed to create character:', error)
      alert('Failed to create character')
    }
  }

  if (loading) {
    return <div className="loading">Loading world...</div>
  }

  if (!world) {
    return <div className="error">World not found</div>
  }

  return (
    <div className="world-detail">
      <header className="world-header">
        <div>
          <Link to="/worlds" className="back-link">← Back to Worlds</Link>
          <h1>{world.name}</h1>
          <span className="world-setting-badge large">{world.setting}</span>
        </div>
        <button className="btn btn-primary btn-large" onClick={handleStartSession}>
          ▶️ Start Session
        </button>
      </header>

      {world.description && (
        <section className="world-description">
          <p>{world.description}</p>
        </section>
      )}

      <nav className="tabs">
        <button 
          className={`tab ${activeTab === 'characters' ? 'active' : ''}`}
          onClick={() => setActiveTab('characters')}
        >
          Characters ({characters.length})
        </button>
        <button 
          className={`tab ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sessions ({sessions.length})
        </button>
        <button 
          className={`tab ${activeTab === 'lore' ? 'active' : ''}`}
          onClick={() => setActiveTab('lore')}
        >
          Lore
        </button>
      </nav>

      <section className="tab-content">
        {activeTab === 'characters' && (
          <div className="characters-section">
            <div className="section-header">
              <h2>Characters</h2>
              <button className="btn btn-secondary" onClick={handleQuickCharacter}>
                + Quick Create
              </button>
            </div>

            {characters.length === 0 ? (
              <div className="empty-state small">
                <p>No characters yet. Create one to start playing!</p>
              </div>
            ) : (
              <div className="characters-grid">
                {characters.map(char => (
                  <div key={char.id} className="character-card">
                    <h3>{char.name}</h3>
                    <div className="character-info">
                      <span className="class">{char.class || 'No class'}</span>
                      <span className="level">Level {char.level}</span>
                    </div>
                    <div className="attributes-mini">
                      {Object.entries(char.attributes || {}).map(([key, val]) => (
                        <span key={key} className="attr">{key}: {val}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="sessions-section">
            <h2>Past Sessions</h2>
            {sessions.length === 0 ? (
              <div className="empty-state small">
                <p>No sessions yet. Start one to begin your adventure!</p>
              </div>
            ) : (
              <div className="sessions-list">
                {sessions.map(session => (
                  <div key={session.id} className="session-item">
                    <div>
                      <h4>{session.name}</h4>
                      <small>Last played: {new Date(session.updated_at).toLocaleString()}</small>
                    </div>
                    <Link to={`/session/${session.id}`} className="btn btn-secondary">
                      Continue
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'lore' && (
          <div className="lore-section">
            <h2>World Lore</h2>
            <div className="empty-state small">
              <p>Lore management coming soon...</p>
              <p>Use the AI to generate locations, NPCs, and quests!</p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default WorldDetail
