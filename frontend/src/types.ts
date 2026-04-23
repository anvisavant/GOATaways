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
  svd_score?: number
}

export interface LatentDimension {
  dimension: number
  direction: string
  positive_terms: string[]
}

export interface Destination {
  city: string
  country: string
  region: string
  budget: string
  score: number
  text_similarity: number
  short_description: string
  full_description?: string       // Added
  scores: ScoreBreakdown
  matching_reviews?: string[]
  latent_dimensions?: LatentDimension[]  // Added
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