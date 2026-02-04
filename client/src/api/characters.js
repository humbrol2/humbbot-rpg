const API_BASE = '/api'

export async function getSettingConfig(settingId) {
  const response = await fetch(`${API_BASE}/characters/settings/${settingId}`)
  if (!response.ok) throw new Error('Failed to fetch setting config')
  return response.json()
}

export async function getCharacters(worldId = null) {
  const url = worldId 
    ? `${API_BASE}/characters?world_id=${worldId}`
    : `${API_BASE}/characters`
  const response = await fetch(url)
  if (!response.ok) throw new Error('Failed to fetch characters')
  return response.json()
}

export async function getCharacter(id) {
  const response = await fetch(`${API_BASE}/characters/${id}`)
  if (!response.ok) throw new Error('Failed to fetch character')
  return response.json()
}

export async function createCharacter(data) {
  const response = await fetch(`${API_BASE}/characters`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to create character')
  return response.json()
}

export async function updateCharacter(id, data) {
  const response = await fetch(`${API_BASE}/characters/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to update character')
  return response.json()
}

export async function deleteCharacter(id) {
  const response = await fetch(`${API_BASE}/characters/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Failed to delete character')
  return response.json()
}

export async function generateBackstory(id, concept) {
  const response = await fetch(`${API_BASE}/characters/${id}/backstory/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept })
  })
  if (!response.ok) throw new Error('Failed to generate backstory')
  return response.json()
}
