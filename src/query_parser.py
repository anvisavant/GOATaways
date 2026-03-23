MONTHS = ["january","february","march","april","may","june",
          "july","august","september","october","november","december"]

MONTH_ALIASES = {
    "jan":"january","feb":"february","mar":"march","apr":"april",
    "jun":"june","jul":"july","aug":"august","sep":"september",
    "oct":"october","nov":"november","dec":"december"
}

WEATHER_TERMS = ["freezing","very cold","cold","cool","mild","warm","hot","very hot"]

ACTIVITY_TERMS = ["beach","beaches","ski","skiing","hiking","nightlife","nature",
                  "culture","cultural","adventure","wellness","food","cuisine",
                  "urban","city","seclusion","remote"]

BUDGET_TERMS = {
    "budget": "Budget",
    "cheap":  "Budget",
    "affordable": "Budget",
    "mid-range": "Mid-range",
    "moderate": "Mid-range",
    "luxury": "Luxury",
    "high-end": "Luxury"
}

TRIP_LENGTH_LONG = ["spring break", "two weeks", "2 weeks", "week long", "10 days", "month"]
TRIP_LENGTH_SHORT = ["weekend", "long weekend", "day trip", "2 days", "3 days", "48 hours"]

def parse_query(query):
    q = query.lower()
    for alias, full in MONTH_ALIASES.items():
        q = q.replace(alias, full)

    month = next((m for m in MONTHS if m in q), None)
    weather = next((w for w in WEATHER_TERMS if w in q), None)
    activity = next((a for a in ACTIVITY_TERMS if a in q), None)
    budget = next((BUDGET_TERMS[b] for b in BUDGET_TERMS if b in q), None)

    # --- NEW: infer trip length ---
    trip_length = "medium"  # default
    if any(t in q for t in TRIP_LENGTH_SHORT):
        trip_length = "short"
    elif any(t in q for t in TRIP_LENGTH_LONG):
        trip_length = "long"

    return {
        "month": month,
        "weather": weather,
        "activity": activity,
        "budget": budget,
        "trip_length": trip_length,   # "short" | "medium" | "long"
        "raw": query
    }
