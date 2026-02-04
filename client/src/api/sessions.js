const API_BASE = '/api'

export async function getSessions(worldId = null) {
  const url = worldId 
    ? `${API_BASE}/sessions?world_id=${worldId}`
    : `${API_BASE}/sessions`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch sessions')
  return response.json()
}

export async function getSession(id) {
  const response = await fetch(`${API_BASE}/sessions/${id}`)
  if (!response.ok) throw new Error('Failed to fetch session')
  return response.json()
}

export async function createSession(data) {
  const response = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to create session')
  return response.json()
}

export async function sendAction(sessionId, data) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to send action')
  return response.json()
}

export async function addCharacterToSession(sessionId, characterId) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/characters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ character_id: characterId })
  })
  if (!response.ok) throw new Error('Failed to add character')
  return response.json()
}

export async function deleteSession(id) {
  const response = await fetch(`${API_BASE}/sessions/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Failed to delete session')
  return response.json()
}
