MONTHS = ["january","february","march","april","may","june",
          "july","august","september","october","november","december"]

MONTH_ALIASES = {
    "jan":"january","feb":"february","mar":"march","apr":"april",
    "jun":"june","jul":"july","aug":"august","sep":"september",
    "oct":"october","nov":"november","dec":"december"
}

TRIP_LENGTH_LONG = ["spring break", "two weeks", "2 weeks", "week long", "10 days", "month"]
TRIP_LENGTH_SHORT = ["weekend", "long weekend", "day trip", "2 days", "3 days", "48 hours"]

CLIMATE_INTENTS = {
    "tropical": "tropical",
    "island": "tropical",
    "beach vacation": "tropical",
    "beach holiday": "tropical",
    "warm": "warm",
    "hot": "hot",
    "cold": "cold",
    "cool": "cool",
    "mild": "mild",
    "freezing": "freezing"
}

def parse_query(query):
    q = query.lower()
    for alias, full in MONTH_ALIASES.items():
        q = q.replace(alias, full)

    month = next((m for m in MONTHS if m in q), None)

    climate_intent = None
    for phrase, label in sorted(CLIMATE_INTENTS.items(), key=lambda x: -len(x[0])):
        if phrase in q:
            climate_intent = label
            break

    trip_length = "medium"
    if any(t in q for t in TRIP_LENGTH_SHORT):
        trip_length = "short"
    elif any(t in q for t in TRIP_LENGTH_LONG):
        trip_length = "long"

    return {
        "month": month,
        "climate_intent": climate_intent,
        "trip_length": trip_length,
        "raw": query
    }