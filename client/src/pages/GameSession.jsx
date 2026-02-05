import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSession, sendAction } from '../api/sessions'

function GameSession() {
  const { id } = useParams()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [sending, setSending] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadSession()
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [session?.history])

  async function loadSession() {
    try {
      const data = await getSession(id)
      setSession(data)
      if (data.characters?.length > 0 && !selectedCharacter) {
        setSelectedCharacter(data.characters[0].id)
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    } finally {
      setLoading(false)
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleSendAction(e) {
    e.preventDefault()
    if (!action.trim() || sending) return

    setSending(true)
    const currentAction = action
    setAction('')

    try {
      const response = await sendAction(id, {
        character_id: selectedCharacter,
        action: currentAction
      })

      // Add to history
      setSession(prev => ({
        ...prev,
        history: [
          ...prev.history,
          { role: 'user', content: response.action, created_at: response.timestamp },
          { role: 'assistant', content: response.response, created_at: response.timestamp }
        ]
      }))
    } catch (error) {
      console.error('Failed to send action:', error)
      alert('Failed to send action. Is the LLM server running?')
      setAction(currentAction) // Restore action
    } finally {
      setSending(false)
    }
  }

  function rollDice(sides = 20) {
    const result = Math.floor(Math.random() * sides) + 1
    const diceAction = `[Rolls d${sides}: ${result}]`
    setAction(prev => prev ? `${prev} ${diceAction}` : diceAction)
  }

  if (loading) {
    return <div className="loading">Loading session...</div>
  }

  if (!session) {
    return <div className="error">Session not found</div>
  }

  return (
    <div className="game-session enhanced-game-session h-screen overflow-hidden">
      <header className="session-header">
        <Link to={`/worlds/${session.world_id}`} className="back-link">← Back to World</Link>
        <h1>{session.name}</h1>
        <div className="session-info">
          {session.characters?.length > 0 && (
            <select 
              value={selectedCharacter || ''} 
              onChange={e => setSelectedCharacter(e.target.value)}
              className="character-select"
            >
              {session.characters.map(char => (
                <option key={char.id} value={char.id}>
                  {char.name} (Lvl {char.level} {char.class})
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <div className="game-container">
        <aside className="sidebar">
          <div className="dice-panel">
            <h3>🎲 Dice</h3>
            <div className="dice-buttons">
              <button onClick={() => rollDice(4)}>d4</button>
              <button onClick={() => rollDice(6)}>d6</button>
              <button onClick={() => rollDice(8)}>d8</button>
              <button onClick={() => rollDice(10)}>d10</button>
              <button onClick={() => rollDice(12)}>d12</button>
              <button onClick={() => rollDice(20)}>d20</button>
              <button onClick={() => rollDice(100)}>d100</button>
            </div>
          </div>

          {selectedCharacter && session.characters && (
            <div className="character-panel">
              <h3>Character</h3>
              {(() => {
                const char = session.characters.find(c => c.id === selectedCharacter)
                if (!char) return null
                return (
                  <>
                    <p className="char-name">{char.name}</p>
                    <p className="char-class">{char.class} • Level {char.level}</p>
                    <div className="attributes-list">
                      {Object.entries(char.attributes || {}).map(([key, val]) => (
                        <div key={key} className="attr-row">
                          <span>{key}</span>
                          <span>{val}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </aside>

        <main className="game-main">
          <div className="messages game-chat-container message-history-scroll messages-container">
            {session.current_scene && session.history?.length === 0 && (
              <div className="message gm-message intro">
                <div className="message-header">
                  <span className="role">Game Master</span>
                </div>
                <div className="message-content">
                  <p><em>{session.current_scene}</em></p>
                  <p>What do you do?</p>
                </div>
              </div>
            )}

            {session.history?.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role === 'user' ? 'player-message' : 'gm-message'}`}>
                <div className="message-header">
                  <span className="role">{msg.role === 'user' ? 'You' : 'Game Master'}</span>
                  <span className="time">{new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="message-content">
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {sending && (
              <div className="message gm-message typing">
                <div className="message-content">
                  <span className="typing-indicator">The Game Master is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form className="action-form" onSubmit={handleSendAction}>
            <textarea
              value={action}
              onChange={e => setAction(e.target.value)}
              placeholder="What do you do? (Describe your action...)"
              rows={2}
              disabled={sending}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendAction(e)
                }
              }}
            />
            <button type="submit" className="btn btn-primary" disabled={sending || !action.trim()}>
              {sending ? 'Sending...' : 'Send Action'}
            </button>
          </form>
        </main>
      </div>
    </div>
  )
}

export default GameSession
