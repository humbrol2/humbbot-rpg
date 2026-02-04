import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Worlds from './pages/Worlds'
import WorldDetail from './pages/WorldDetail'
import CharacterCreator from './pages/CharacterCreator'
import GameSession from './pages/GameSession'
import './styles/App.css'

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <Link to="/" className="logo">🎲 HumbBot RPG</Link>
        <div className="nav-links">
          <Link to="/worlds">Worlds</Link>
          <Link to="/characters/new">Create Character</Link>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/worlds" element={<Worlds />} />
          <Route path="/worlds/:id" element={<WorldDetail />} />
          <Route path="/characters/new" element={<CharacterCreator />} />
          <Route path="/session/:id" element={<GameSession />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>Powered by local LLMs • No cloud required • MIT License</p>
      </footer>
    </div>
  )
}

export default App
