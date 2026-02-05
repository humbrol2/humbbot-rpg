import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import MemoryViewer from './MemoryViewer'
import CharacterPanel from './CharacterPanel'
import ScenePanel from './ScenePanel'
import ActionPanel from './ActionPanel'
import MessageHistory from './MessageHistory'

const EnhancedGameSession = () => {
  const { id: sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [world, setWorld] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentAction, setCurrentAction] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState(null)
  const [sceneType, setSceneType] = useState('story')
  const [contextUsage, setContextUsage] = useState(0)
  const [memoryEvents, setMemoryEvents] = useState(0)
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
      
      // Load world data (use world_id from API response)
      const worldResponse = await fetch(`/api/worlds/${sessionData.world_id}`)
      if (worldResponse.ok) {
        const worldData = await worldResponse.json()
        setWorld(worldData)
      }
      
      // Use existing history from session data (basic sessions include history)
      if (sessionData.history && sessionData.history.length > 0) {
        // Convert to the format expected by the component
        const formattedMessages = sessionData.history.map((msg, index) => ({
          id: index,
          role: msg.role === 'user' ? 'player' : 'gm',
          content: msg.content,
          timestamp: new Date(msg.created_at).getTime()
        }))
        setMessages(formattedMessages)
      }
      
      // Set default character
      if (sessionData.characters?.length > 0) {
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

  const handleAction = async (action, options = {}) => {
    if (!action.trim() || isProcessing || !selectedCharacter) return
    
    try {
      setIsProcessing(true)
      
      // Add player message immediately
      const playerMessage = {
        id: Date.now(),
        role: 'player',
        content: action,
        timestamp: Date.now(),
        character: selectedCharacter.name
      }
      setMessages(prev => [...prev, playerMessage])
      setCurrentAction('')
      
      // Send action to server (using basic sessions API for now)
      const response = await fetch(`/api/sessions/${sessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          character_id: selectedCharacter?.id,
          ...options
        })
      })
      
      if (!response.ok) throw new Error('Failed to process action')
      
      const result = await response.json()
      
      // Add GM response (basic sessions API format)
      const gmMessage = {
        id: Date.now() + 1,
        role: 'gm',
        content: result.response,
        timestamp: new Date(result.timestamp).getTime()
      }
      setMessages(prev => [...prev, gmMessage])
      
      // For basic sessions, we don't have enhanced features yet
      // But we can simulate some values for the UI
      setMemoryEvents(prev => prev + 1)
      setContextUsage(0.3) // Placeholder value
      
    } catch (error) {
      console.error('Failed to process action:', error)
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 2,
        role: 'system',
        content: `Error: ${error.message}`,
        timestamp: Date.now(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleQuickAction = (actionType) => {
    const quickActions = {
      look: "I look around carefully, taking in my surroundings.",
      listen: "I listen intently for any sounds.",
      search: "I search the area for anything useful or interesting.",
      wait: "I wait quietly and observe what happens.",
      rest: "I take a moment to rest and recover.",
    }
    
    if (quickActions[actionType]) {
      handleAction(quickActions[actionType], { sceneType: 'exploration' })
    }
  }

  const getContextColor = (usage) => {
    if (usage >= 0.9) return 'text-error'
    if (usage >= 0.7) return 'text-warning'
    if (usage >= 0.5) return 'text-info'
    return 'text-success'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-muted">Loading game session...</p>
        </div>
      </div>
    )
  }

  if (!session || !world) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
        <p className="text-muted mb-6">This game session could not be loaded.</p>
        <Link to="/worlds" className="btn btn-primary">
          Return to Worlds
        </Link>
      </div>
    )
  }

  return (
    <div className="enhanced-game-session h-screen flex flex-col bg-bg-primary overflow-hidden">
      {/* Session Header */}
      <div className="border-b border-border bg-bg-card">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link to={`/worlds/${world.id}`} className="btn btn-sm btn-ghost">
              ← Back to {world.name}
            </Link>
            <div>
              <h1 className="font-display text-xl font-bold">{session.name || 'Game Session'}</h1>
              <p className="text-sm text-muted">
                {world.name} • {world.setting} • {session.characters?.length || 0} characters
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Context Usage Indicator */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Context:</span>
              <span className={getContextColor(contextUsage)}>
                {(contextUsage * 100).toFixed(1)}%
              </span>
            </div>
            
            {/* Memory Events Count */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted">Events:</span>
              <span className="text-primary">{memoryEvents}</span>
            </div>
            
            {/* Scene Type Selector */}
            <select
              value={sceneType}
              onChange={(e) => setSceneType(e.target.value)}
              className="input select w-32"
            >
              <option value="story">Story</option>
              <option value="dialogue">Dialogue</option>
              <option value="combat">Combat</option>
              <option value="exploration">Exploration</option>
              <option value="puzzle">Puzzle</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Game Interface */}
      <div className="flex flex-1 min-h-0">
        {/* Left Sidebar - Character & Scene Info */}
        <div className="w-80 flex-shrink-0 border-r border-border bg-bg-secondary overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Character Panel */}
            <CharacterPanel
              characters={session.characters || []}
              selectedCharacter={selectedCharacter}
              onCharacterSelect={setSelectedCharacter}
            />
            
            {/* Scene Panel */}
            <ScenePanel
              scene={session.currentScene}
              onSceneUpdate={(updates) => setSession(prev => ({
                ...prev,
                currentScene: { ...prev.currentScene, ...updates }
              }))}
            />
            
            {/* Quick Actions */}
            <div className="card">
              <div className="p-4">
                <h3 className="font-semibold mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleQuickAction('look')}
                    className="btn btn-sm btn-ghost text-left"
                    disabled={isProcessing}
                  >
                    👁️ Look Around
                  </button>
                  <button
                    onClick={() => handleQuickAction('listen')}
                    className="btn btn-sm btn-ghost text-left"
                    disabled={isProcessing}
                  >
                    👂 Listen
                  </button>
                  <button
                    onClick={() => handleQuickAction('search')}
                    className="btn btn-sm btn-ghost text-left"
                    disabled={isProcessing}
                  >
                    🔍 Search
                  </button>
                  <button
                    onClick={() => handleQuickAction('wait')}
                    className="btn btn-sm btn-ghost text-left"
                    disabled={isProcessing}
                  >
                    ⏸️ Wait
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center - Message History */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 p-4" style={{height: 'calc(100vh - 300px)', overflow: 'hidden'}}>
            <MessageHistory
              messages={messages}
              world={world}
              isProcessing={isProcessing}
              className="h-full overflow-y-auto messages-container"
            />
            <div ref={messagesEndRef} />
          </div>
          
          {/* Action Input */}
          <div className="border-t border-border bg-bg-card">
            <ActionPanel
              value={currentAction}
              onChange={setCurrentAction}
              onSubmit={(action, options) => handleAction(action, options)}
              isProcessing={isProcessing}
              selectedCharacter={selectedCharacter}
              sceneType={sceneType}
            />
          </div>
        </div>

        {/* Right Sidebar - Memory System */}
        <div className="w-96 flex-shrink-0 border-l border-border bg-bg-secondary overflow-y-auto">
          <div className="p-4">
            <MemoryViewer sessionId={sessionId} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedGameSession