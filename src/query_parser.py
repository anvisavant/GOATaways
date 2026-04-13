MONTHS = ["january","february","march","april","may","june",
          "july","august","september","october","november","december"]

MONTH_ALIASES = {
    "jan":"january","feb":"february","mar":"march","apr":"april",
    "jun":"june","jul":"july","aug":"august","sep":"september",
    "oct":"october","nov":"november","dec":"december"
}

WEATHER_SHIFTS = {
    "freezing": -18,
    "very cold": -12,
    "cold": -8,
    "cool": -4,
    "mild": 0,
    "warm": 5,
    "hot": 10,
    "very hot": 14,
    "tropical": 12,
    "island": 12,
    "beach vacation": 12
}

TRIP_LENGTH_LONG = ["spring break", "two weeks", "2 weeks", "week long", "10 days", "month"]
TRIP_LENGTH_SHORT = ["weekend", "long weekend", "day trip", "2 days", "3 days", "48 hours"]

def parse_query(query):
    q = query.lower()
    for alias, full in MONTH_ALIASES.items():
        q = q.replace(alias, full)

    month = next((m for m in MONTHS if m in q), None)

    weather_shift = None
    for term, shift in sorted(WEATHER_SHIFTS.items(), key=lambda x: -len(x[0])):
        if term in q:
            weather_shift = shift
            break

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