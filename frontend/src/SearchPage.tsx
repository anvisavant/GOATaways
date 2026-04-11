import { useState } from 'react'
import { Destination, SearchResponse } from './types'

interface Props { onBack: () => void }

const SCORE_LABELS: Record<string, string> = {
  review_score: '📄 Reviews Match',
  climate_score: '🌡 Climate Match',
  distance_score: '📍 Distance Match',
}

const TRIP_LABELS: Record<string, string> = {
  short:  '🗓 Weekend trip',
  medium: '✈️ Week trip',
  long:   '🏖 Long trip',
}

function SearchPage({ onBack }: Props): JSX.Element {
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults([])
    setNearestCity('')
    setBaselineTemp(null)
    setExpandedIdx(null)

    const params = new URLSearchParams({ q: query, top_n: '10' })
    if (lat) params.set('lat', lat)
    if (lon) params.set('lon', lon)

    try {
      const res = await fetch(`/api/search?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: SearchResponse = await res.json()
      setResults(data.results)
      if (data.user_nearest_city) setNearestCity(data.user_nearest_city)
      if (data.user_baseline_temp_c != null) setBaselineTemp(data.user_baseline_temp_c)
    } catch {
      setError('Could not reach the backend. Make sure Flask is running on port 5001.')
    } finally {
      setLoading(false)
    }
  }

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
        <button className="search-btn" type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Find Destinations ✈️'}
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
        <div className="results-grid">
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

                    {/* Tags */}
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

                    {/* Description */}
                    <p className="card-desc">{dest.short_description}</p>

                    {/* Score bars */}
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

                    {/* Review excerpts */}
                    {dest.matching_reviews && dest.matching_reviews.length > 0 && (
                      <div className="review-excerpts">
                        <button
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
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SearchPage
