import { useState } from 'react'
import './App.css'
import SearchPage from './SearchPage'
import LandingPage from './LandingPage'
import AboutPage from './AboutPage'

type View = 'landing' | 'search' | 'about'

function App() {
  const [view, setView] = useState<View>('landing')
  const [initialPrompt, setInitialPrompt] = useState('')

  const handleTryPrompt = (prompt: string) => {
    setInitialPrompt(prompt)
    setView('search')
  }

  return (
    <div className="app-container">
      {view === 'search' && (
        <SearchPage
          onBack={() => setView('landing')}
          initialPrompt={initialPrompt}
        />
      )}
      {view === 'about' && (
        <AboutPage
          onBack={() => setView('landing')}
          onTryPrompt={handleTryPrompt}
        />
      )}
      {view === 'landing' && (
        <LandingPage
          onStart={() => { setInitialPrompt(''); setView('search') }}
          onAbout={() => setView('about')}
        />
      )}
    </div>
  )
}

export default App