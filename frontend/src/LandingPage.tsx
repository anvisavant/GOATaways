import { useState, useEffect } from 'react'
import Globe from 'react-globe.gl'

interface Props {
  onEnter: () => void
}

type Phase = 'full' | 'abbreviating' | 'goat' | 'ready'

function LandingPage({ onEnter }: Props): JSX.Element {
  const [phase, setPhase] = useState<Phase>('full')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('abbreviating'), 2000)
    const t2 = setTimeout(() => setPhase('goat'), 3200)
    const t3 = setTimeout(() => setPhase('ready'), 3900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className="landing">
      <Globe
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundColor="rgba(0,0,0,0)"
        width={Math.min(window.innerWidth, 700)}
        height={Math.min(window.innerWidth, 700)}
      />

      <div className="title-overlay">
        {phase === 'full' && (
          <h1 className="title-full animate-in">
            Greatest Of All Travels
          </h1>
        )}

        {phase === 'abbreviating' && (
          <h1 className="title-abbreviating">
            <span className="keep">G</span><span className="fade-out">reatest </span>
            <span className="keep">O</span><span className="fade-out">f </span>
            <span className="keep">A</span><span className="fade-out">ll </span>
            <span className="keep">T</span><span className="fade-out">ravels</span>
          </h1>
        )}

        {(phase === 'goat' || phase === 'ready') && (
          <h1 className="title-goat animate-in">GOAT</h1>
        )}

        {phase === 'ready' && (
          <button className="away-btn animate-in" onClick={onEnter}>
            AWAY
          </button>
        )}
      </div>
    </div>
  )
}

export default LandingPage
