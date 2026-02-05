import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'

const MemoryViewer = ({ sessionId, className = '' }) => {
  const [memoryData, setMemoryData] = useState({
    events: [],
    relationships: {},
    tiers: { hot: 0, warm: 0, cool: 0, cold: 0 }
  })
  const [selectedTier, setSelectedTier] = useState('all')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (sessionId) {
      fetchMemoryData()
    }
  }, [sessionId])

  const fetchMemoryData = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/memory`)
      if (response.ok) {
        const data = await response.json()
        setMemoryData(data)
      }
    } catch (error) {
      console.error('Failed to fetch memory data:', error)
    }
  }

  const getMemoryTier = (event) => {
    const age = Date.now() - event.timestamp
    const significance = event.significance || 0.5
    
    // Apply frequency boost
    const accessBoost = Math.min(event.accessCount * 0.1, 0.5)
    const adjustedSignificance = Math.min(significance + accessBoost, 1.0)
    
    if (age < 2 * 60 * 60 * 1000 && adjustedSignificance > 0.3) return 'hot'
    if (age < 24 * 60 * 60 * 1000 && adjustedSignificance > 0.2) return 'warm'
    if (age < 7 * 24 * 60 * 60 * 1000 && adjustedSignificance > 0.15) return 'cool'
    if (age < 30 * 24 * 60 * 60 * 1000 && adjustedSignificance > 0.1) return 'cold'
    return 'archived'
  }

  const filteredEvents = selectedTier === 'all' 
    ? memoryData.events 
    : memoryData.events.filter(event => getMemoryTier(event) === selectedTier)

  const tierCounts = memoryData.events.reduce((counts, event) => {
    const tier = getMemoryTier(event)
    counts[tier] = (counts[tier] || 0) + 1
    return counts
  }, {})

  const formatEventContent = (event) => {
    switch (event.type) {
      case 'combat':
        return `⚔️ Combat: ${event.data.participants?.join(' vs ')} - ${event.data.outcome}`
      case 'dialogue':
        return `💬 ${event.data.speaker}: "${event.data.content?.substring(0, 60)}..."`
      case 'travel':
        return `🚶 Travel: ${event.data.from} → ${event.data.to}`
      case 'quest':
        return `📜 Quest "${event.data.questId}": ${event.data.action}`
      case 'character':
        return `👤 ${event.data.characterId}: ${event.data.type}`
      default:
        return `📝 ${event.type}: ${JSON.stringify(event.data).substring(0, 60)}...`
    }
  }

  const getSignificanceColor = (significance) => {
    if (significance >= 0.8) return 'text-error'
    if (significance >= 0.6) return 'text-warning'
    if (significance >= 0.4) return 'text-info'
    return 'text-muted'
  }

  if (!isExpanded) {
    return (
      <div className={`card ${className}`}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🧠</div>
              <div>
                <h3 className="font-semibold text-lg">Memory System</h3>
                <p className="text-sm text-muted">
                  {memoryData.events.length} events • {Object.keys(memoryData.relationships).length} relationships
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Memory tier indicators */}
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-memory-hot" title={`Hot: ${tierCounts.hot || 0}`}></div>
                <div className="w-2 h-2 rounded-full bg-memory-warm" title={`Warm: ${tierCounts.warm || 0}`}></div>
                <div className="w-2 h-2 rounded-full bg-memory-cool" title={`Cool: ${tierCounts.cool || 0}`}></div>
                <div className="w-2 h-2 rounded-full bg-memory-cold" title={`Cold: ${tierCounts.cold || 0}`}></div>
              </div>
              <button 
                onClick={() => setIsExpanded(true)}
                className="btn btn-sm btn-ghost"
              >
                View Details
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`card ${className}`}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🧠</div>
            <div>
              <h3 className="font-semibold text-lg">Memory System</h3>
              <p className="text-sm text-muted">
                4-tier decay architecture with relationship tracking
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsExpanded(false)}
            className="btn btn-sm btn-ghost"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Memory Tier Filters */}
      <div className="p-4 border-b border-border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTier('all')}
            className={`btn btn-sm ${selectedTier === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          >
            All ({memoryData.events.length})
          </button>
          <button
            onClick={() => setSelectedTier('hot')}
            className={`btn btn-sm ${selectedTier === 'hot' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <span className="w-2 h-2 rounded-full bg-memory-hot mr-2"></span>
            Hot ({tierCounts.hot || 0})
          </button>
          <button
            onClick={() => setSelectedTier('warm')}
            className={`btn btn-sm ${selectedTier === 'warm' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <span className="w-2 h-2 rounded-full bg-memory-warm mr-2"></span>
            Warm ({tierCounts.warm || 0})
          </button>
          <button
            onClick={() => setSelectedTier('cool')}
            className={`btn btn-sm ${selectedTier === 'cool' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <span className="w-2 h-2 rounded-full bg-memory-cool mr-2"></span>
            Cool ({tierCounts.cool || 0})
          </button>
          <button
            onClick={() => setSelectedTier('cold')}
            className={`btn btn-sm ${selectedTier === 'cold' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <span className="w-2 h-2 rounded-full bg-memory-cold mr-2"></span>
            Cold ({tierCounts.cold || 0})
          </button>
        </div>
      </div>

      {/* Relationship Summary */}
      {Object.keys(memoryData.relationships).length > 0 && (
        <div className="p-4 border-b border-border">
          <h4 className="font-medium mb-3">Character Relationships</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(memoryData.relationships).map(([character, relationship]) => {
              const trust = relationship.trust || 0
              const getTrustColor = (trust) => {
                if (trust >= 0.7) return 'badge-success'
                if (trust >= 0.3) return 'badge-warning'
                if (trust <= -0.3) return 'badge-error'
                return 'badge-info'
              }
              
              return (
                <div key={character} className={`badge ${getTrustColor(trust)}`}>
                  {character} ({trust > 0 ? '+' : ''}{trust.toFixed(1)})
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Events Timeline */}
      <div className="max-h-96 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <div className="text-4xl mb-2">📭</div>
            <p>No events in this tier</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEvents.map((event, index) => {
              const tier = getMemoryTier(event)
              const significance = event.significance || 0.5
              
              return (
                <div key={event.id || index} className="p-4 hover:bg-bg-hover transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-3 h-3 rounded-full mt-1 bg-memory-${tier}`}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium">
                          {formatEventContent(event)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span className={`${getSignificanceColor(significance)}`}>
                            {(significance * 100).toFixed(0)}%
                          </span>
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span>Tier: {tier}</span>
                        {event.accessCount > 0 && (
                          <span>Accessed: {event.accessCount}x</span>
                        )}
                        {event.data.location && (
                          <span>📍 {event.data.location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Memory Statistics */}
      <div className="p-4 border-t border-border bg-bg-secondary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold">{memoryData.events.length}</div>
            <div className="text-xs text-muted">Total Events</div>
          </div>
          <div>
            <div className="text-lg font-semibold">{Object.keys(memoryData.relationships).length}</div>
            <div className="text-xs text-muted">Relationships</div>
          </div>
          <div>
            <div className="text-lg font-semibold">
              {(memoryData.events.reduce((sum, e) => sum + (e.significance || 0), 0) / memoryData.events.length || 0).toFixed(2)}
            </div>
            <div className="text-xs text-muted">Avg Significance</div>
          </div>
          <div>
            <div className="text-lg font-semibold">
              {memoryData.events.reduce((sum, e) => sum + (e.accessCount || 0), 0)}
            </div>
            <div className="text-xs text-muted">Total Accesses</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MemoryViewer