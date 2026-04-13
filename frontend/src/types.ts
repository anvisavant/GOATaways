export interface ScoreBreakdown {
  review_score: number
  text_score: number
  climate_score: number
  relative_temp_score?: number
  relative_temp?: number
  activity_score: number
  budget_score: number
  distance_score: number
  weights_used?: Record<string, number>
}

export interface Destination {
  city: string
  country: string
  region: string
  budget: string
  score: number
  text_similarity: number
  short_description: string
  scores: ScoreBreakdown
  matching_reviews?: string[]
  trip_length_inferred?: string
  latitude?: number
  longitude?: number
  rank?: number
}

export interface SearchResponse {
  query: string
  user_nearest_city?: string
  user_baseline_temp_c?: number
  results: Destination[]
}