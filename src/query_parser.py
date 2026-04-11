MONTHS = ["january","february","march","april","may","june",
          "july","august","september","october","november","december"]

WEATHER_INTENTS = {
    "freezing": -15, "very cold": -10, "cold": -5, 
    "cool": -2, "mild": 0, "warm": 5, "hot": 10, "very hot": 15
}

TRIP_LENGTH_LONG = ["spring break", "two weeks", "2 weeks", "week long", "10 days", "month", "long trip"]
TRIP_LENGTH_SHORT = ["weekend", "long weekend", "day trip", "2 days", "3 days", "48 hours", "short trip"]

def parse_query(query):
    q = query.lower()
    
    month = next((m for m in MONTHS if m in q), None)
    
    # Check if they want a temperature relative to their baseline
    weather_shift = None
    for w, shift in WEATHER_INTENTS.items():
        if w in q:
            weather_shift = shift
            break
            
    # Infer trip length
    trip_length = "medium"
    if any(t in q for t in TRIP_LENGTH_SHORT):
        trip_length = "short"
    elif any(t in q for t in TRIP_LENGTH_LONG):
        trip_length = "long"

    return {
        "month": month,
        "weather_shift": weather_shift,
        "trip_length": trip_length,
        "raw": query
    }