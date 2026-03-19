import { useState } from 'react'
import LandingPage from './LandingPage'
import SearchPage from './SearchPage'
import './App.css'

type View = 'landing' | 'search'

function App(): JSX.Element {
  const [view, setView] = useState<View>('landing')

  return (
    <div className="app">
      {view === 'landing'
        ? <LandingPage onEnter={() => setView('search')} />
        : <SearchPage onBack={() => setView('landing')} />
      }
    </div>
  )
}

export default App
