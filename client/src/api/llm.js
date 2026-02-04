const API_BASE = '/api'

export async function checkLLMHealth() {
  const response = await fetch(`${API_BASE}/llm/health`)
  return response.json()
}

export async function generateContent(worldId, type, prompt) {
  const response = await fetch(`${API_BASE}/llm/generate/${type}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ world_id: worldId, prompt })
  })
  if (!response.ok) throw new Error('Failed to generate content')
  return response.json()
}
