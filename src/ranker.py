from geopy.distance import geodesic
from data_loader import load_cities
from query_parser import parse_query
import pandas as pd
from reviews_indexer import (
    get_review_scores,
    get_best_review_snippet,
    get_dimension_explanations
)

df = load_cities()
def get_distance_km(row, user_lat, user_lon):
    if user_lat is None or user_lon is None:
        return None
    try:
        return geodesic((user_lat, user_lon), (row["latitude"], row["longitude"])).km
    except Exception:
        return None

def get_relative_climate_score(row, parsed, user_baseline_temp):
    temp_col = f"temp_{parsed['month']}" if parsed.get("month") else "annual_avg_c"
    city_temp = row.get(temp_col)

    if city_temp is None or pd.isna(city_temp):
        return 0.4

    weather_shift = parsed.get("weather_shift")

    if weather_shift is None:
        return 0.75

    raw_q = parsed.get("raw", "").lower()
    climate_profile = str(row.get("climate_profile", "")).lower()
    beaches_score = float(row.get("beaches", 0))

    if "tropical" in raw_q or "island" in raw_q:
        score = 0.0
        if city_temp >= 24:
            score += 0.7
        elif city_temp >= 21:
            score += 0.4
        elif city_temp >= 18:
            score += 0.15

        if "warm to hot" in climate_profile or "consistently warm" in climate_profile:
            score += 0.2

        if beaches_score >= 4:
            score += 0.1

        return min(score, 1.0)

    if user_baseline_temp is None:
        target_temp = 15 + weather_shift
    else:
        target_temp = user_baseline_temp + weather_shift

    diff = abs(city_temp - target_temp)
    if diff <= 3:
        return 1.0
    if diff <= 7:
        return 0.7
    if diff <= 12:
        return 0.4
    return 0.1

def get_dynamic_distance_score(row, user_lat, user_lon, trip_length):
    if user_lat is None or user_lon is None:
        return 0.5

    try:
        dist_km = geodesic((user_lat, user_lon), (row["latitude"], row["longitude"])).km

        if trip_length == "short":
            if dist_km <= 500: return 1.0
            if dist_km <= 1200: return 0.7
            if dist_km <= 2000: return 0.35
            return 0.1

        elif trip_length == "medium":
            if dist_km <= 1000: return 0.6
            if dist_km <= 4000: return 1.0
            if dist_km <= 8000: return 0.7
            return 0.4

        else:
            if dist_km <= 1000: return 0.4
            if dist_km <= 5000: return 0.8
            return 1.0

    except Exception:
        return 0.5

def rank_destinations(query, user_lat=None, user_lon=None, user_baseline_temp=None, top_n=10):
    parsed = parse_query(query)
    review_scores = get_review_scores(parsed["raw"])

    max_hybrid = max((v["hybrid_score"] for v in review_scores.values()), default=0.0001)
    if max_hybrid == 0:
        max_hybrid = 0.0001

    results = []
    for _, row in df.iterrows():
        city_id = row["id"]
        dist_km = get_distance_km(row, user_lat, user_lon)

        if parsed["trip_length"] == "short" and dist_km is not None and dist_km > 2000:
            continue

        review_pack = review_scores.get(city_id, {"tfidf_score": 0.0, "svd_score": 0.0, "hybrid_score": 0.0})
        norm_review = review_pack["hybrid_score"] / max_hybrid
        svd_score = review_pack["svd_score"]
        tfidf_score = review_pack["tfidf_score"]

        climate_score = get_relative_climate_score(row, parsed, user_baseline_temp)
        distance_score = get_dynamic_distance_score(row, user_lat, user_lon, parsed["trip_length"])

        gated_review_score = norm_review * (0.35 + 0.65 * climate_score)

        final_score = (
            0.78 * gated_review_score +
            0.15 * climate_score +
            0.07 * distance_score
        )

        if final_score <= 0:
            continue

        latent_dims = get_dimension_explanations(parsed["raw"], city_id, top_k=3)

        results.append({
            "city": row["city"],
            "country": row["country"],
            "region": row["region"],
            "budget": row["budget_level"],
            "score": round(final_score, 4),
            "trip_length_inferred": parsed["trip_length"],
            "short_description": row["short_description"][:200] + "...",
            "matching_reviews": [get_best_review_snippet(parsed["raw"], city_id)],
            "scores": {
                "review_score": round(gated_review_score, 4),
                "svd_score": round(float(svd_score), 4),
                "text_score": round(float(tfidf_score), 4),
                "climate_score": round(climate_score, 4),
                "distance_score": round(distance_score, 4)
            },
            "latent_dimensions": latent_dims
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_n]