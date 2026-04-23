import { useState } from 'react'
import './App.css'
import SearchPage from './SearchPage'
import LandingPage from './LandingPage'

function App() {
  // false = show Landing Page, true = show Search Page
  const [isSearching, setIsSearching] = useState(false)

  return (
    <div className="app-container">
      {isSearching ? (
        <SearchPage onBack={() => setIsSearching(false)} />
      ) : (
        <LandingPage onStart={() => setIsSearching(true)} />
      )}
    </div>
  )
}

export default App