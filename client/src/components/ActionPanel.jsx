import { useState, useRef, useEffect } from 'react'

const ActionPanel = ({ 
  value, 
  onChange, 
  onSubmit, 
  isProcessing, 
  selectedCharacter, 
  sceneType 
}) => {
  const [importance, setImportance] = useState(0.5)
  const [isExpanded, setIsExpanded] = useState(false)
  const [actionHistory, setActionHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const textareaRef = useRef(null)

  useEffect(() => {
    // Load action history from localStorage
    const stored = localStorage.getItem('rpg-action-history')
    if (stored) {
      try {
        setActionHistory(JSON.parse(stored))
      } catch (e) {
        console.warn('Failed to load action history:', e)
      }
    }
  }, [])

  const saveToHistory = (action) => {
    if (action.trim() && !actionHistory.includes(action)) {
      const newHistory = [action, ...actionHistory.slice(0, 19)] // Keep last 20
      setActionHistory(newHistory)
      localStorage.setItem('rpg-action-history', JSON.stringify(newHistory))
    }
  }

  const handleSubmit = () => {
    if (!value.trim() || isProcessing || !selectedCharacter) return
    
    saveToHistory(value)
    setHistoryIndex(-1)
    
    onSubmit(value, {
      importance,
      sceneType,
      characterId: selectedCharacter.id
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'ArrowUp' && e.ctrlKey) {
      e.preventDefault()
      if (actionHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, actionHistory.length - 1)
        setHistoryIndex(newIndex)
        onChange(actionHistory[newIndex])
      }
    } else if (e.key === 'ArrowDown' && e.ctrlKey) {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        onChange(actionHistory[newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        onChange('')
      }
    }
  }

  const getImportanceLabel = (value) => {
    if (value >= 0.8) return 'Critical'
    if (value >= 0.6) return 'Important'
    if (value >= 0.4) return 'Moderate'
    if (value >= 0.2) return 'Minor'
    return 'Trivial'
  }

  const getImportanceColor = (value) => {
    if (value >= 0.8) return 'text-error'
    if (value >= 0.6) return 'text-warning'
    if (value >= 0.4) return 'text-info'
    return 'text-muted'
  }

  const quickActions = [
    { text: "I look around carefully.", icon: "👁️", type: "exploration" },
    { text: "I listen for any sounds.", icon: "👂", type: "exploration" },
    { text: "I search for anything useful.", icon: "🔍", type: "exploration" },
    { text: "I approach cautiously.", icon: "🚶", type: "exploration" },
    { text: "I wait and observe.", icon: "⏸️", type: "story" },
    { text: "I speak up.", icon: "💬", type: "dialogue" },
    { text: "I remain silent.", icon: "🤫", type: "dialogue" },
    { text: "I prepare for combat.", icon: "⚔️", type: "combat" },
  ]

  return (
    <div className="p-4 space-y-4">
      {/* Character Check */}
      {!selectedCharacter && (
        <div className="bg-warning bg-opacity-10 border border-warning rounded-lg p-3">
          <div className="flex items-center gap-2 text-warning">
            <span>⚠️</span>
            <span className="font-medium">No character selected</span>
          </div>
          <p className="text-sm text-muted mt-1">
            Select a character from the left panel to take actions.
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Quick Actions</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-sm btn-ghost"
          >
            {isExpanded ? 'Less' : 'More'}
          </button>
        </div>
        
        <div className={`grid grid-cols-2 gap-2 transition-all ${isExpanded ? 'grid-cols-4' : ''}`}>
          {quickActions.slice(0, isExpanded ? 8 : 4).map((action, index) => (
            <button
              key={index}
              onClick={() => onChange(action.text)}
              className="btn btn-sm btn-ghost text-left justify-start"
              disabled={isProcessing || !selectedCharacter}
              title={action.text}
            >
              <span className="mr-1">{action.icon}</span>
              <span className="truncate">{action.text.split(' ').slice(0, 2).join(' ')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Input */}
      <div className="space-y-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedCharacter 
              ? `What does ${selectedCharacter.name} do? (Ctrl+Enter to submit)`
              : "Select a character to begin..."
            }
            className="input textarea w-full resize-none"
            rows={3}
            disabled={isProcessing || !selectedCharacter}
          />
          
          {/* Character count and history indicator */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {historyIndex >= 0 && (
              <span className="text-xs text-muted bg-bg-secondary px-2 py-1 rounded">
                History {historyIndex + 1}/{actionHistory.length}
              </span>
            )}
            <span className="text-xs text-muted">
              {value.length}/1000
            </span>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">Importance:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={importance}
                onChange={(e) => setImportance(parseFloat(e.target.value))}
                className="w-20"
                disabled={isProcessing}
              />
              <span className={`text-sm font-medium ${getImportanceColor(importance)}`}>
                {getImportanceLabel(importance)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {actionHistory.length > 0 && (
              <button
                onClick={() => {
                  if (historyIndex < actionHistory.length - 1) {
                    const newIndex = historyIndex + 1
                    setHistoryIndex(newIndex)
                    onChange(actionHistory[newIndex])
                  }
                }}
                className="btn btn-sm btn-ghost"
                disabled={isProcessing || historyIndex >= actionHistory.length - 1}
                title="Previous action (Ctrl+↑)"
              >
                ↑
              </button>
            )}
            
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={isProcessing || !value.trim() || !selectedCharacter}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="spinner"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>🎲</span>
                  <span>Take Action</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-xs text-muted space-y-1">
          <p>💡 <strong>Tips:</strong> Be specific about your character's actions and intentions.</p>
          <p>⌨️ <strong>Shortcuts:</strong> Ctrl+Enter to submit, Ctrl+↑/↓ for history</p>
          <p>🧠 <strong>Memory:</strong> Your actions are remembered and influence future interactions.</p>
        </div>
      </div>

      {/* Scene Type Indicator */}
      <div className="flex items-center justify-between text-xs text-muted border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <span>Scene Type:</span>
          <span className="badge badge-info">{sceneType}</span>
        </div>
        {selectedCharacter && (
          <div className="flex items-center gap-2">
            <span>Acting as:</span>
            <span className="font-medium text-primary-400">{selectedCharacter.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ActionPanel