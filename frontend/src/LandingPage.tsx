import { useEffect, useRef } from 'react'
import Globe from 'react-globe.gl'

interface Props {
  onStart: () => void
}

function LandingPage({ onStart }: Props): JSX.Element {
  const globeRef = useRef<any>(null)

  useEffect(() => {
    if (!globeRef.current) return

    globeRef.current.pointOfView(
      { lat: 20, lng: -40, altitude: 2.2 },
      0
    )

    const controls = globeRef.current.controls()
    if (controls) {
      controls.autoRotate = true
      controls.autoRotateSpeed = 0.6
      controls.enablePan = false
    }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      background: 'radial-gradient(circle at top left, rgba(244, 235, 190, 0.45), transparent 32%), radial-gradient(circle at bottom right, rgba(139, 166, 169, 0.35), transparent 30%), #A7CECB',
      fontFamily: '"Segoe UI", system-ui, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '60px'
      }}>
        
        {/* Left Side: Copy & Button */}
        <div style={{
          flex: '1 1 450px',
          background: '#F4EBBE',
          border: '2px solid #8BA6A9',
          borderRadius: '28px',
          padding: '40px',
          boxShadow: '0 14px 40px rgba(117, 112, 78, 0.22)',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          
          <div style={{
            display: 'inline-block',
            marginBottom: '24px',
            padding: '6px 16px',
            borderRadius: '999px',
            border: '1px solid #75704E',
            color: '#000',
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            FIND YOUR NEXT GOAT GETAWAY
          </div>

          <h1 style={{
            fontSize: 'clamp(3.5rem, 8vw, 4.5rem)',
            lineHeight: 1.1,
            fontWeight: 900,
            color: '#75704E',
            marginBottom: '20px',
            marginTop: 0
          }}>
            GOAT<span style={{ 
              color: '#F4EBBE', 
              textShadow: '-1px -1px 0 #75704E, 1px -1px 0 #75704E, -1px 1px 0 #75704E, 1px 1px 0 #75704E'
            }}>aways</span>
          </h1>

          <p style={{
            fontSize: '1rem',
            lineHeight: 1.6,
            color: '#333',
            marginBottom: '32px',
            fontWeight: 500
          }}>
            Search destinations by vibe, climate, budget, and trip length. 
            Explore the world, then jump straight into personalized travel matches.
          </p>

          <button 
            onClick={onStart}
            style={{
              padding: '16px 32px',
              borderRadius: '999px',
              border: 'none',
              background: '#75704E',
              color: '#FFF',
              fontSize: '1.05rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 10px 24px rgba(117, 112, 78, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = '#8BA6A9';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = '#75704E';
            }}
          >
            Start Searching ✈️
          </button>
        </div>

        {/* Right Side: Globe with Curved Text */}
        <div style={{
          flex: '1 1 500px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '500px'
        }}>
          {/* Glowing ring behind the globe */}
          <div style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244, 235, 190, 0.6), transparent 70%)',
            filter: 'blur(20px)',
            pointerEvents: 'none'
          }} />

          {/* Animated Curved Text SVG */}
          {/* Animated Curved Text SVG */}
          <div style={{
            position: 'absolute',
            width: '560px', 
            height: '560px',
            pointerEvents: 'none',
            zIndex: 10,
            animation: 'spin 40s linear infinite' // Increased from 20s to 40s to make it spin half as fast
          }}>
            <svg viewBox="0 0 500 500" width="100%" height="100%">
              <defs>
                <path 
                  id="circlePath" 
                  d="M 250, 250 m -190, 0 a 190,190 0 1,1 380,0 a 190,190 0 1,1 -380,0" 
                />
              </defs>
              <text 
                fill="#75704E" 
                fontSize="33" // Increased from 20 to 38
                fontWeight="900"
                style={{ letterSpacing: '4.7px' }} // Tweaked slightly to perfectly bridge the gap between the two repeats
              >
                <textPath href="#circlePath" startOffset="0%">
                  GREATEST OF ALL TRAVELS • GREATEST OF ALL TRAVELS • 
                </textPath>
              </text>
            </svg>
            
            <style>
              {`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
          
          <Globe
            ref={globeRef}
            width={500}
            height={500}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            showAtmosphere
            atmosphereColor="#F4EBBE"
            atmosphereAltitude={0.15}
            showGraticules={false}
          />
        </div>

      </div>
    </div>
  )
}

export default LandingPage