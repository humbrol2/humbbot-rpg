import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Worlds from './pages/Worlds'
import WorldDetail from './pages/WorldDetail'
import CharacterCreator from './pages/CharacterCreator'
import EnhancedGameSession from './components/EnhancedGameSession'
import './styles/design-system.css'
import './styles/App.css'

function App() {
  return (
    <div className="app min-h-screen bg-bg-primary text-text-primary">
      <nav className="border-b border-border bg-bg-card">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="font-display text-2xl font-bold text-primary-400 flex items-center gap-2">
            <span className="text-3xl">🎲</span>
            HumbBot RPG
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/worlds" className="btn btn-ghost">
              🌍 Worlds
            </Link>
            <Link to="/characters/new" className="btn btn-ghost">
              👤 Create Character
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/worlds" element={<Worlds />} />
          <Route path="/worlds/:id" element={<WorldDetail />} />
          <Route path="/characters/new" element={<CharacterCreator />} />
          <Route path="/session/:id" element={<EnhancedGameSession />} />
        </Routes>
      </main>

      <footer className="border-t border-border bg-bg-card">
        <div className="text-center py-4 text-sm text-muted">
          <p>🧠 Powered by Advanced Memory Architecture • 🏠 Local LLMs • ⚖️ MIT License</p>
        </div>
      </footer>
    </div>
  )
}

export default App
