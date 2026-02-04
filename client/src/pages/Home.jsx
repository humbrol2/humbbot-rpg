import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { checkLLMHealth } from '../api/llm'

function Home() {
  const [llmStatus, setLlmStatus] = useState({ checking: true })

  useEffect(() => {
    checkLLMHealth().then(status => {
      setLlmStatus({ ...status, checking: false })
    }).catch(() => {
      setLlmStatus({ available: false, checking: false, error: 'Cannot connect to server' })
    })
  }, [])

  return (
    <div className="home">
      <section className="hero">
        <h1>🎲 HumbBot RPG</h1>
        <p className="tagline">Create any world. Build any character. Play any adventure.</p>
        <p className="subtitle">Powered by local LLMs — no cloud, no API costs, complete privacy.</p>
        
        <div className="hero-actions">
          <Link to="/worlds" className="btn btn-primary">Browse Worlds</Link>
          <Link to="/worlds/new" className="btn btn-secondary">Create World</Link>
        </div>
      </section>

      <section className="status-card">
        <h3>System Status</h3>
        <div className="status-item">
          <span>LLM Server:</span>
          {llmStatus.checking ? (
            <span className="status-checking">Checking...</span>
          ) : llmStatus.available ? (
            <span className="status-ok">✓ Connected</span>
          ) : (
            <span className="status-error">✗ {llmStatus.error || 'Not available'}</span>
          )}
        </div>
        {llmStatus.available && llmStatus.models?.length > 0 && (
          <div className="status-item">
            <span>Model:</span>
            <span>{llmStatus.models[0].id}</span>
          </div>
        )}
      </section>

      <section className="features">
        <h2>Features</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <span className="feature-icon">🌍</span>
            <h3>Any Setting</h3>
            <p>Fantasy, Sci-Fi, Horror, Modern, or create your own unique world.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">👤</span>
            <h3>D&D-Style Characters</h3>
            <p>Full character sheets with attributes, skills, classes, and inventory.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">🤖</span>
            <h3>AI Game Master</h3>
            <p>Dynamic storytelling powered by your local LLM. No API costs ever.</p>
          </div>
          <div className="feature-card">
            <span className="feature-icon">💾</span>
            <h3>Persistent Worlds</h3>
            <p>Your worlds and characters are saved locally. Play anytime.</p>
          </div>
        </div>
      </section>

      <section className="quick-start">
        <h2>Quick Start</h2>
        <ol>
          <li><strong>Create a World</strong> — Choose a setting template or build your own</li>
          <li><strong>Build a Character</strong> — Roll stats, pick skills, write a backstory</li>
          <li><strong>Start a Session</strong> — The AI Game Master takes over</li>
          <li><strong>Play!</strong> — Describe your actions, roll dice, shape the story</li>
        </ol>
      </section>
    </div>
  )
}

export default Home
