import { useState, useRef, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

const MessageHistory = ({ messages, world, isProcessing }) => {
  const [filter, setFilter] = useState('all')
  const [isAutoScroll, setIsAutoScroll] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const messagesContainerRef = useRef(null)

  useEffect(() => {
    if (isAutoScroll && messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      
      if (isNearBottom) {
        messagesContainerRef.current.scrollTop = scrollHeight
      }
    }
  }, [messages, isAutoScroll])

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
      setIsAutoScroll(isNearBottom)
    }
  }

  const filteredMessages = messages.filter(message => {
    // Filter by role
    if (filter !== 'all' && message.role !== filter) return false
    
    // Filter by search term
    if (searchTerm && !message.content.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    
    return true
  })

  const getMessageIcon = (message) => {
    switch (message.role) {
      case 'player': return '👤'
      case 'gm': return '🎲'
      case 'system': return '⚙️'
      default: return '💬'
    }
  }

  const getMessageClass = (message) => {
    const baseClass = "message animate-fade-in"
    
    switch (message.role) {
      case 'player':
        return `${baseClass} bg-bg-card border-l-4 border-primary-500`
      case 'gm':
        return `${baseClass} bg-bg-hover border-l-4 border-info`
      case 'system':
        if (message.isError) {
          return `${baseClass} bg-error bg-opacity-10 border-l-4 border-error`
        }
        return `${baseClass} bg-bg-tertiary border-l-4 border-warning`
      default:
        return `${baseClass} bg-bg-secondary`
    }
  }

  const getSceneIcon = (sceneType) => {
    const icons = {
      combat: '⚔️',
      dialogue: '💬',
      exploration: '🗺️',
      puzzle: '🧩',
      story: '📖'
    }
    return icons[sceneType] || '📝'
  }

  const formatMessageContent = (content) => {
    // First, preserve line breaks by converting to HTML
    content = content.replace(/\n\n/g, '<br><br>')
    content = content.replace(/\n/g, '<br>')
    
    // Format dice rolls
    content = content.replace(/\[ROLL:(\w+):(\w+)\]/g, 
      '<span class="inline-flex items-center gap-1 px-2 py-1 bg-primary-500 bg-opacity-20 rounded text-primary-400 font-mono text-sm">🎲 $1 ($2)</span>')
    
    // Format emphasis (bold/italic)
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary-200 font-bold">$1</strong>')
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Format dialogue
    content = content.replace(/"([^"]+)"/g, '<span class="text-primary-300">"$1"</span>')
    
    // Format bullet points with better spacing
    content = content.replace(/(^|\<br\>)• (.+?)(?=\<br\>|$)/g, '$1<div class="ml-4 mb-2 flex items-start"><span class="text-accent mr-2">•</span><span>$2</span></div>')
    
    return content
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message Controls */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input select w-32"
          >
            <option value="all">All ({messages.length})</option>
            <option value="player">Player ({messages.filter(m => m.role === 'player').length})</option>
            <option value="gm">GM ({messages.filter(m => m.role === 'gm').length})</option>
            <option value="system">System ({messages.filter(m => m.role === 'system').length})</option>
          </select>
        </div>

        <div className="flex-1">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={isAutoScroll}
              onChange={(e) => setIsAutoScroll(e.target.checked)}
              className="w-4 h-4"
            />
            Auto-scroll
          </label>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 message-history-scroll messages-container space-y-4"
      >
        {/* Session Introduction */}
        {filteredMessages.length === 0 && filter === 'all' && !searchTerm && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{world.setting === 'fantasy' ? '🏰' : 
                                           world.setting === 'scifi' ? '🚀' : 
                                           world.setting === 'horror' ? '👻' : '🌍'}</div>
            <h2 className="font-display text-2xl font-bold mb-2">Welcome to {world.name}</h2>
            <p className="text-muted mb-6 max-w-md mx-auto">
              A {world.setting} adventure awaits. What would you like to do first?
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-muted">
              <span className="animate-pulse">🤖</span>
              <span>Powered by advanced memory architecture</span>
            </div>
          </div>
        )}

        {/* Filtered Messages */}
        {filteredMessages.map((message, index) => (
          <div key={message.id || index} className={getMessageClass(message)}>
            <div className="p-4">
              {/* Message Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="text-lg">{getMessageIcon(message)}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize">
                        {message.role === 'player' && message.character 
                          ? message.character 
                          : message.role === 'gm' 
                            ? 'Game Master' 
                            : message.role}
                      </span>
                      {message.sceneType && (
                        <span className="badge badge-info text-xs">
                          {getSceneIcon(message.sceneType)} {message.sceneType}
                        </span>
                      )}
                      {message.importance && (
                        <span className={`badge text-xs ${
                          message.importance >= 0.8 ? 'badge-error' :
                          message.importance >= 0.6 ? 'badge-warning' :
                          'badge-info'
                        }`}>
                          {(message.importance * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted">
                      {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                
                {/* Message Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigator.clipboard.writeText(message.content)}
                    className="btn btn-sm btn-ghost opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy message"
                  >
                    📋
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div className="prose prose-invert max-w-none">
                <div
                  className={`text-sm leading-relaxed ${
                    message.content.includes('JOB BOARD') ? 'job-board-container' : ''
                  }`}
                  dangerouslySetInnerHTML={{
                    __html: formatMessageContent(message.content)
                  }}
                />
              </div>

              {/* Message Metadata */}
              {(message.memoryEvents || message.contextUsage) && (
                <div className="mt-3 pt-3 border-t border-border border-opacity-50">
                  <div className="flex items-center gap-4 text-xs text-muted">
                    {message.memoryEvents && (
                      <span>Memory events: {message.memoryEvents}</span>
                    )}
                    {message.contextUsage && (
                      <span>Context usage: {(message.contextUsage * 100).toFixed(1)}%</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="message bg-bg-hover border-l-4 border-warning animate-fade-in">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="text-lg">🎲</div>
                <div>
                  <div className="font-semibold">Game Master</div>
                  <div className="text-xs text-muted">Thinking...</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                <div className="spinner"></div>
                <span>Processing your action with memory context...</span>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredMessages.length === 0 && (filter !== 'all' || searchTerm) && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">No messages found</h3>
            <p className="text-muted">
              {searchTerm 
                ? `No messages contain "${searchTerm}"`
                : `No ${filter} messages in this session`}
            </p>
          </div>
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {!isAutoScroll && (
        <div className="absolute bottom-4 right-4">
          <button
            onClick={() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
                setIsAutoScroll(true)
              }
            }}
            className="btn btn-sm btn-primary shadow-lg"
          >
            ↓ Scroll to bottom
          </button>
        </div>
      )}
    </div>
  )
}

export default MessageHistory