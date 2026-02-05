import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import '../styles/clean-game-ui.css'

const CleanGameSession = () => {
  const { id: sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [world, setWorld] = useState(null)
  const [messages, setMessages] = useState([])
  const [currentAction, setCurrentAction] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadSession()
  }, [sessionId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadSession = async () => {
    try {
      setIsLoading(true)
      
      // Load session data
      const sessionResponse = await fetch(`/api/sessions/${sessionId}`)
      if (!sessionResponse.ok) throw new Error('Session not found')
      const sessionData = await sessionResponse.json()
      setSession(sessionData)
      
      // Load world data
      const worldResponse = await fetch(`/api/worlds/${sessionData.world_id}`)
      if (worldResponse.ok) {
        const worldData = await worldResponse.json()
        setWorld(worldData)
      }
      
      // Convert session history to clean format
      if (sessionData.history && sessionData.history.length > 0) {
        const formattedMessages = sessionData.history.map((msg, index) => ({
          id: index,
          role: msg.role === 'user' ? 'player' : 'gm',
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime()
        }))
        setMessages(formattedMessages)
      }
      
      // Set character
      if (sessionData.characters && sessionData.characters.length > 0) {
        setSelectedCharacter(sessionData.characters[0])
      }
      
    } catch (error) {
      console.error('Failed to load session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmitAction = async (e) => {
    e.preventDefault()
    if (!currentAction.trim() || isSending || !selectedCharacter) return
    
    const actionText = currentAction.trim()
    setCurrentAction('')
    setIsSending(true)
    
    // Add player message immediately
    const playerMessage = {
      id: Date.now(),
      role: 'player',
      content: actionText,
      timestamp: Date.now(),
      author: selectedCharacter.name
    }
    setMessages(prev => [...prev, playerMessage])
    
    try {
      // Send to API
      const response = await fetch(`/api/sessions/${sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionText,
          character_id: selectedCharacter.id
        })
      })
      
      if (!response.ok) throw new Error('Failed to send action')
      
      const result = await response.json()
      
      // Add GM response
      const gmMessage = {
        id: Date.now() + 1,
        role: 'gm',
        content: result.response,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, gmMessage])
      
    } catch (error) {
      console.error('Failed to send action:', error)
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 2,
        role: 'gm',
        content: `Error: ${error.message}. Please try again.`,
        timestamp: Date.now(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  const handleQuickAction = (action) => {
    setCurrentAction(action)
  }

  const getDisplayedAttributes = () => {
    if (!selectedCharacter?.attributes) return []
    
    const attrs = selectedCharacter.attributes
    
    // Get the first 4 attributes for display
    return Object.entries(attrs).slice(0, 4).map(([key, value]) => ({
      name: key,
      value: value
    }))
  }

  if (isLoading) {
    return (
      <div className="clean-game-session">
        <div className="clean-header">
          <h1>Loading...</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <p>Loading your adventure...</p>
        </div>
      </div>
    )
  }

  if (!session || !world) {
    return (
      <div className="clean-game-session">
        <div className="clean-header">
          <h1>Session Not Found</h1>
          <Link to="/worlds" className="back-link">← Back to Worlds</Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div style={{ textAlign: 'center' }}>
            <h2>This session could not be loaded.</h2>
            <Link to="/worlds" style={{ color: '#667eea' }}>Return to Worlds</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="clean-game-session">
      {/* Simple header */}
      <div className="clean-header">
        <div>
          <Link to={`/worlds/${world.id}`} className="back-link">
            ← Back to {world.name}
          </Link>
          <h1>{session.name || 'Adventure'}</h1>
        </div>
        <div style={{ fontSize: '0.875rem', color: '#718096' }}>
          {world.setting} • {world.name}
        </div>
      </div>

      {/* Main game area */}
      <div className="clean-game-main">
        {/* Messages area */}
        <div className="clean-messages">
          <div className="clean-messages-header">
            Game Master
          </div>
          
          <div className="clean-messages-body">
            {messages.length === 0 ? (
              <div className="clean-welcome">
                <h2>Welcome to {world.name}</h2>
                <p>Your adventure begins here. What would you like to do first?</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`clean-message ${message.role}`}>
                  <div className="clean-message-author">
                    {message.role === 'player' ? (message.author || 'You') : 'Game Master'}
                  </div>
                  <div className="clean-message-bubble">
                    {message.content}
                  </div>
                </div>
              ))
            )}
            
            {isSending && (
              <div className="clean-message gm">
                <div className="clean-message-author">Game Master</div>
                <div className="clean-typing">
                  <span>The Game Master is thinking</span>
                  <div className="clean-typing-dots">
                    <div className="clean-typing-dot"></div>
                    <div className="clean-typing-dot"></div>
                    <div className="clean-typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Action input */}
          <div className="clean-action-area">
            <form className="clean-action-form" onSubmit={handleSubmitAction}>
              <textarea
                className="clean-action-input"
                value={currentAction}
                onChange={(e) => setCurrentAction(e.target.value)}
                placeholder="What does Humbrol do? (Ctrl+Enter to send)"
                rows={1}
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault()
                    handleSubmitAction(e)
                  }
                }}
              />
              <button 
                type="submit" 
                className="clean-send-button"
                disabled={isSending || !currentAction.trim()}
              >
                {isSending ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </div>

        {/* Character sidebar */}
        {selectedCharacter && (
          <div className="clean-character-sidebar">
            <div className="clean-character-header">
              <div className="clean-character-avatar">
                {selectedCharacter.name[0].toUpperCase()}
              </div>
              <div>
                <h3 className="clean-character-name">{selectedCharacter.name}</h3>
                <p className="clean-character-class">
                  {selectedCharacter.class} • Level {selectedCharacter.level}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="clean-stats-grid">
              {getDisplayedAttributes().map((attr) => (
                <div key={attr.name} className="clean-stat">
                  <div className="clean-stat-value">{attr.value}</div>
                  <div className="clean-stat-name">{attr.name}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="clean-quick-actions">
              <h3>Quick Actions</h3>
              <div className="clean-quick-buttons">
                <button 
                  className="clean-quick-button"
                  onClick={() => handleQuickAction('I look around carefully.')}
                  disabled={isSending}
                >
                  👁️ Look
                </button>
                <button 
                  className="clean-quick-button"
                  onClick={() => handleQuickAction('I listen for any sounds.')}
                  disabled={isSending}
                >
                  👂 Listen
                </button>
                <button 
                  className="clean-quick-button"
                  onClick={() => handleQuickAction('I search the area.')}
                  disabled={isSending}
                >
                  🔍 Search
                </button>
                <button 
                  className="clean-quick-button"
                  onClick={() => handleQuickAction('I wait and observe.')}
                  disabled={isSending}
                >
                  ⏸️ Wait
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CleanGameSession