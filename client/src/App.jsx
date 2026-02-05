import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Worlds from './pages/Worlds'
import WorldDetail from './pages/WorldDetail'
import CharacterCreator from './pages/CharacterCreator'
import CleanGameSession from './components/CleanGameSession'
import './styles/design-system.css'
import './styles/App.css'

function App() {
  return (
    <div className="app min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/worlds" element={<Worlds />} />
        <Route path="/worlds/:id" element={<WorldDetail />} />
        <Route path="/characters/new" element={<CharacterCreator />} />
        <Route path="/session/:id" element={<CleanGameSession />} />
      </Routes>
    </div>
  )
}

export default App
