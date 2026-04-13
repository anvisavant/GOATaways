import { useEffect, useMemo, useRef, useState } from 'react'
import Globe from 'react-globe.gl'
import Papa from 'papaparse'
import { Destination, SearchResponse } from './types'

interface Props {
  onBack: () => void
}

const SCORE_LABELS: Record<string, string> = {
<<<<<<< Updated upstream
  review_score: '📄 Reviews Match',
  climate_score: '🌡 Climate Match',
  distance_score: '📍 Distance Match',
=======
  review_score: '📄 Reviews',
  text_score: '🔤 Text',
  climate_score: '🌡 Climate',
  relative_temp_score: '🌡 Rel. Temp',
  relative_temp: '🌡 Rel. Temp',
  activity_score: '🎯 Activity',
  budget_score: '💰 Budget',
  distance_score: '📍 Distance',
>>>>>>> Stashed changes
}

const TRIP_LABELS: Record<string, string> = {
  short: '🗓 Weekend trip',
  medium: '✈️ Week trip',
  long: '🏖 Long trip',
}

type CoordinateMap = Record<string, { latitude: number; longitude: number }>

function SearchPage({ onBack }: Props): JSX.Element {
  const globeRef = useRef<any>(null)

  const [query, setQuery] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [results, setResults] = useState<Destination[]>([])
  const [nearestCity, setNearestCity] = useState('')
  const [baselineTemp, setBaselineTemp] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<'globe' | 'list'>('globe')
  const [selectedResult, setSelectedResult] = useState<Destination | null>(null)
  const [coordinateMap, setCoordinateMap] = useState<CoordinateMap>({})
  const [csvReady, setCsvReady] = useState(false)

  useEffect(() => {
    Papa.parse('/goataway_cleaned_dataset.csv', {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const map: CoordinateMap = {}

        for (const row of results.data as any[]) {
          const city = row.city?.trim()
          const country = row.country?.trim()
          const latitude = Number(row.latitude)
          const longitude = Number(row.longitude)

          if (
            city &&
            country &&
            Number.isFinite(latitude) &&
            Number.isFinite(longitude)
          ) {
            map[`${city}|${country}`] = { latitude, longitude }
          }
        }

        setCoordinateMap(map)
        setCsvReady(true)
      },
      error: () => {
        setError('Could not load destination coordinates from the CSV file.')
        setCsvReady(true)
      },
    })
  }, [])

  const getLocation = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5))
        setLon(pos.coords.longitude.toFixed(5))
        setLocating(false)
      },
      () => {
        setError('Could not auto-detect location. Please enter coordinates manually.')
        setLocating(false)
      }
    )
  }

  const enrichWithCoordinates = (destinations: Destination[]) => {
    return destinations.map((dest, idx) => {
      const key = `${dest.city}|${dest.country}`
      const coords = coordinateMap[key]

      return {
        ...dest,
        rank: idx + 1,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      }
    })
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setResults([])
    setNearestCity('')
    setBaselineTemp(null)
    setExpandedIdx(null)
    setSelectedResult(null)

    const params = new URLSearchParams({ q: query, top_n: '10' })
    if (lat) params.set('lat', lat)
    if (lon) params.set('lon', lon)

    try {
      const res = await fetch(`/api/search?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: SearchResponse = await res.json()

      const enrichedResults = enrichWithCoordinates(data.results)
      setResults(enrichedResults)

      if (data.user_nearest_city) setNearestCity(data.user_nearest_city)
      if (data.user_baseline_temp_c != null) setBaselineTemp(data.user_baseline_temp_c)
    } catch {
      setError('Could not reach the backend. Make sure Flask is running on port 5001.')
    } finally {
      setLoading(false)
    }
  }

  const mappableResults = useMemo(
    () =>
      results.filter(
        (d) => typeof d.latitude === 'number' && typeof d.longitude === 'number'
      ),
    [results]
  )
  

  useEffect(() => {
    if (!globeRef.current || mappableResults.length === 0) return
    const top = mappableResults[0]
    globeRef.current.pointOfView(
      { lat: top.latitude!, lng: top.longitude!, altitude: 1.8 },
      1200
    )
  }, [mappableResults])

  return (
    <div className="search-page">
      <button className="back-btn" onClick={onBack}>← back</button>

      <div className="search-logo">GOAT<span>aways</span></div>

      <form className="search-form" onSubmit={handleSearch}>
        <textarea
          className="query-input"
          placeholder='e.g. "I want to party in a warm location for spring break"'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
        />
        <div className="coords-row">
          <input
            className="coord-input"
            placeholder="Latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
          <input
            className="coord-input"
            placeholder="Longitude"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
          />
          <button
            type="button"
            className="locate-btn"
            onClick={getLocation}
            disabled={locating}
          >
            {locating ? '...' : '📍 Use My Location'}
          </button>
        </div>
        <button className="search-btn" type="submit" disabled={loading || !csvReady}>
          {loading ? 'Searching...' : !csvReady ? 'Loading map data...' : 'Find Destinations ✈️'}
        </button>

        {nearestCity && (
          <div className="baseline-note">
            📍 Your nearest city: <strong>{nearestCity}</strong>
            {baselineTemp !== null && <> · baseline {baselineTemp}°C</>}
          </div>
        )}
        {error && <div className="error-msg">{error}</div>}
      </form>

      {results.length > 0 && (
        <div className="results-shell">
          <div className="results-toolbar">
            <button
              type="button"
              className={viewMode === 'globe' ? 'view-btn active' : 'view-btn'}
              onClick={() => setViewMode('globe')}
            >
              🌍 Globe
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? 'view-btn active' : 'view-btn'}
              onClick={() => setViewMode('list')}
            >
              📋 List
            </button>
            <button
              type="button"
              className="view-btn jump-btn"
              onClick={() => {
                const el = document.getElementById('results-list')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              ↓ Scroll to results
            </button>
          </div>

          {viewMode === 'globe' && (
            <div className="globe-card">
              <div className="globe-header">
                <div>
                  <h2>Explore destinations on the globe</h2>
                  <p>Drag to rotate, scroll to zoom, hover for a preview, click for full details.</p>
                </div>
                <div className="globe-legend">
                  <span><strong>#1</strong> is centered first</span>
                  <span>Top results use larger markers</span>
                  <span>Click a marker to read more</span>
                </div>
              </div>

              <div className="globe-wrap">
                <Globe
                  ref={globeRef}
                  width={900}
                  height={520}
                  backgroundColor="rgba(0,0,0,0)"
                  showAtmosphere
                  atmosphereColor="#A7CECB"
                  atmosphereAltitude={0.18}
                  showGraticules
                  globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                  bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                  pointsData={mappableResults}
                  pointLat="latitude"
                  pointLng="longitude"
                  pointAltitude={(d: object) => {
                    const point = d as Destination
                    if (point.rank === 1) return 0.24
                    if ((point.rank ?? 99) <= 3) return 0.18
                    return 0.1
                  }}
                  pointRadius={(d: object) => {
                    const point = d as Destination
                    return Math.max(0.16, 0.42 - ((point.rank ?? 10) - 1) * 0.025)
                  }}
                  pointColor={(d: object) => {
                    const point = d as Destination
                    if (point.rank === 1) return '#F4EBBE'
                    if ((point.rank ?? 99) <= 3) return '#75704E'
                    return '#8BA6A9'
                  }}
                  pointLabel={(d: object) => {
                    const point = d as Destination
                    return `
                      <div style="padding:8px 10px;border-radius:10px;background:#fff;color:#000;box-shadow:0 6px 20px rgba(0,0,0,0.15);">
                        <div style="font-weight:800;">#${point.rank} ${point.city}</div>
                        <div>${point.country}</div>
                        <div>⭐ ${(point.score * 100).toFixed(0)}% match</div>
                      </div>
                    `
                  }}
                  onPointClick={(point) => setSelectedResult(point as Destination)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div className="results-grid" id="results-list">
          {results.map((dest, i) => {
            const isExpanded = expandedIdx === i
            const scoreEntries = dest.scores
              ? Object.entries(dest.scores).filter(([k]) => k !== 'weights_used')
              : []

            return (
              <div className="result-card" key={i}>
                <div className="card-header">
                  <span className="card-rank">#{i + 1}</span>

                  <div className="card-body">
                    <div className="card-city">{dest.city}</div>
                    <div className="card-location">{dest.region}, {dest.country}</div>

                    <div className="card-meta">
                      <span className="tag budget-tag">{dest.budget}</span>
                      <span className="tag score-tag">
                        ⭐ {(dest.score * 100).toFixed(0)}% match
                      </span>
                      {dest.trip_length_inferred && (
                        <span className="tag trip-tag">
                          {TRIP_LABELS[dest.trip_length_inferred] ?? dest.trip_length_inferred}
                        </span>
                      )}
                    </div>

                    <p className="card-desc">{dest.short_description}</p>

                    {scoreEntries.length > 0 && (
                      <div className="score-bars">
                        {scoreEntries.map(([key, val]) => (
                          <div className="score-bar-row" key={key}>
                            <span className="score-label">
                              {SCORE_LABELS[key] ?? key.replace(/_score$/, '').replace(/_/g, ' ')}
                            </span>
                            <div className="score-bar-bg">
                              <div
                                className="score-bar-fill"
                                style={{ width: `${Math.min((val as number) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="score-value">
                              {((val as number) * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {dest.matching_reviews && dest.matching_reviews.length > 0 && (
                      <div className="review-excerpts">
                        <button
                          type="button"
                          className="review-toggle"
                          onClick={() => setExpandedIdx(isExpanded ? null : i)}
                        >
                          {isExpanded ? '▲ Hide review excerpts' : '▼ Why this destination?'}
                        </button>
                        {isExpanded && (
                          <div className="review-quotes">
                            {dest.matching_reviews.map((excerpt, j) => (
                              <blockquote className="review-quote" key={j}>
                                "{excerpt}"
                              </blockquote>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="card-actions">
                      <button
                        type="button"
                        className="open-detail-btn"
                        onClick={() => setSelectedResult(dest)}
                      >
                        Read more
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedResult && (
        <div className="detail-overlay" onClick={() => setSelectedResult(null)}>
          <div className="detail-drawer" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="drawer-close"
              onClick={() => setSelectedResult(null)}
            >
              ✕
            </button>

            <div className="drawer-rank">#{selectedResult.rank}</div>
            <h2>{selectedResult.city}</h2>
            <div className="drawer-location">{selectedResult.region}, {selectedResult.country}</div>

            <div className="card-meta">
              <span className="tag budget-tag">{selectedResult.budget}</span>
              <span className="tag score-tag">
                ⭐ {(selectedResult.score * 100).toFixed(0)}% match
              </span>
              {selectedResult.trip_length_inferred && (
                <span className="tag trip-tag">
                  {TRIP_LABELS[selectedResult.trip_length_inferred] ?? selectedResult.trip_length_inferred}
                </span>
              )}
            </div>

            <p className="drawer-desc">{selectedResult.short_description}</p>

            {selectedResult.scores && (
              <div className="score-bars drawer-score-bars">
                {Object.entries(selectedResult.scores)
                  .filter(([k]) => k !== 'weights_used')
                  .map(([key, val]) => (
                    <div className="score-bar-row" key={key}>
                      <span className="score-label">
                        {SCORE_LABELS[key] ?? key.replace(/_score$/, '').replace(/_/g, ' ')}
                      </span>
                      <div className="score-bar-bg">
                        <div
                          className="score-bar-fill"
                          style={{ width: `${Math.min((val as number) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="score-value">
                        {((val as number) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {selectedResult.matching_reviews && selectedResult.matching_reviews.length > 0 && (
              <div className="review-quotes">
                {selectedResult.matching_reviews.map((excerpt, j) => (
                  <blockquote className="review-quote" key={j}>
                    "{excerpt}"
                  </blockquote>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchPage