const API_BASE = '/api'

export async function getWorlds() {
  const response = await fetch(`${API_BASE}/worlds`)
  if (!response.ok) throw new Error('Failed to fetch worlds')
  return response.json()
}

export async function getWorld(id) {
  const response = await fetch(`${API_BASE}/worlds/${id}`)
  if (!response.ok) throw new Error('Failed to fetch world')
  return response.json()
}

export async function createWorld(data) {
  const response = await fetch(`${API_BASE}/worlds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to create world')
  return response.json()
}

export async function updateWorld(id, data) {
  const response = await fetch(`${API_BASE}/worlds/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error('Failed to update world')
  return response.json()
}

export async function deleteWorld(id) {
  const response = await fetch(`${API_BASE}/worlds/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) throw new Error('Failed to delete world')
  return response.json()
}
