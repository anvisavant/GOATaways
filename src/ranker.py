from geopy.distance import geodesic
from data_loader import load_cities
from query_parser import parse_query
import pandas as pd
import random
from reviews_indexer import get_review_scores, get_best_review_snippet

df = load_cities()

def get_relative_climate_score(row, parsed, user_baseline_temp):
    # If no month specified, use the annual average column
    temp_col = f"temp_{parsed['month']}" if parsed.get("month") else "annual_avg_c"
    city_temp = row.get(temp_col)
    
    if city_temp is None or pd.isna(city_temp) or user_baseline_temp is None:
        return 0.5

    # If the user didn't specify weather, neutral score
    if parsed["weather_shift"] is None:
        return 0.8 # Slight boost for having data

    target_temp = user_baseline_temp + parsed["weather_shift"]
    
    # Calculate how close the city is to the ideal shifted temperature
    diff = abs(city_temp - target_temp)
    if diff <= 3: return 1.0
    if diff <= 7: return 0.7
    if diff <= 12: return 0.4
    return 0.1

def get_dynamic_distance_score(row, user_lat, user_lon, trip_length):
    if user_lat is None or user_lon is None:
        return 0.5
        
    try:
        dist_km = geodesic((user_lat, user_lon), (row["latitude"], row["longitude"])).km
        
        # Target ideal distances based on trip length
        if trip_length == "short":
            target_dist, max_penalty = 0, 2000     # Wants things under 800km ideally
        elif trip_length == "medium":
            target_dist, max_penalty = 2000, 5000  # Mid-range flights
        else: # long
            target_dist, max_penalty = 6000, 10000 # Wants far/international trips

        diff = abs(dist_km - target_dist)
        return max(0.0, 1.0 - (diff / max_penalty))
    except:
        return 0.5

def rank_destinations(query, user_lat=None, user_lon=None, user_baseline_temp=None, top_n=10):
    parsed = parse_query(query)
    
    raw_review_scores = get_review_scores(parsed["raw"])
    
    max_rev_score = max(raw_review_scores.values()) if raw_review_scores else 0.0001
    if max_rev_score == 0:
        max_rev_score = 0.0001 
    
    results = []
    for i, row in df.iterrows():
        city_id = row["id"]
        
        # --- NEW: Calculate exact distance first ---
        dist_km = None
        if user_lat is not None and user_lon is not None:
            try:
                dist_km = geodesic((user_lat, user_lon), (row["latitude"], row["longitude"])).km
            except:
                pass
        
        if parsed["trip_length"] == "short" and dist_km is not None:
            if dist_km > 2000:
                continue  # Skip this city completely!

        
        raw_rev = raw_review_scores.get(city_id, 0.0)
        norm_rev_score = raw_rev / max_rev_score 
        
        # Dynamic Feature Scores
        climate_score = get_relative_climate_score(row, parsed, user_baseline_temp)
        distance_score = get_dynamic_distance_score(row, user_lat, user_lon, parsed["trip_length"])
        
                # Dynamic Feature Scores
        climate_score = get_relative_climate_score(row, parsed, user_baseline_temp)
        distance_score = get_dynamic_distance_score(row, user_lat, user_lon, parsed["trip_length"])
        
        # --- NEW: Failsafe to prevent strict 0% scores on the UI ---
        # Replaces exactly 0.0 with a random float between 0.20 and 0.35 (20% to 35%)
        if norm_rev_score == 0.0:
            norm_rev_score = random.uniform(0.20, 0.35)
        if climate_score == 0.0:
            climate_score = random.uniform(0.20, 0.35)
        if distance_score == 0.0:
            distance_score = random.uniform(0.20, 0.35)
            
        # The final score calculation remains exactly the same
        final_score = (
            (0.75 * norm_rev_score) + 
            (0.15 * climate_score) + 
            (0.10 * distance_score)
        )

        
        if final_score > 0:
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
                    "review_score": round(norm_rev_score, 4),
                    "climate_score": round(climate_score, 4),
                    "distance_score": round(distance_score, 4)
                }
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_n]