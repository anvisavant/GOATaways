# reviews_indexer.py 
# Builds a TF-IDF index over all review text per city, and then run 
# cosine similarity against the user query, 
# and surface the best matching snippet as the "why" explanation for our output
import pandas as pd
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_reviews(path=os.path.join(BASE_DIR, "data/goataway_reviews_1.csv")):
    df = pd.read_csv(path)
    return df

# --- Build per-city aggregated corpus ---
_reviews_df = load_reviews()

# Group all review texts per city_id into one document per city
_city_review_corpus = (
    _reviews_df.groupby("city_id")
    .agg(
        city=("city", "first"),
        full_text=("text", lambda texts: " ".join(texts.fillna("")))
    )
    .reset_index()
)

_review_vectorizer = TfidfVectorizer(ngram_range=(1, 2), stop_words="english", max_features=50000)
_review_tfidf_matrix = _review_vectorizer.fit_transform(_city_review_corpus["full_text"])

# city_id -> index in the matrix
_city_id_to_idx = {row["city_id"]: i for i, row in _city_review_corpus.iterrows()}


def get_review_scores(query: str) -> dict:
    """
    Returns a dict of {city_id: review_score} for all cities.
    Score is cosine similarity between query and the city's aggregated review corpus.
    """
    query_vec = _review_vectorizer.transform([query])
    scores = cosine_similarity(query_vec, _review_tfidf_matrix).flatten()
    return {row["city_id"]: float(scores[i]) for i, row in _city_review_corpus.iterrows()}


def get_top_review_snippets(query: str, city_id: str, n: int = 2) -> list[str]:
    """
    For a specific city, return the top-n review snippets most similar to the query.
    These are used as the 'why this city was matched' explanation.
    """
    city_reviews = _reviews_df[_reviews_df["city_id"] == city_id].copy()
    if city_reviews.empty:
        return []

    city_reviews["text"] = city_reviews["text"].fillna("")
    vect = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
    try:
        mat = vect.fit_transform(city_reviews["text"])
        q_vec = vect.transform([query])
        sims = cosine_similarity(q_vec, mat).flatten()
        top_idxs = sims.argsort()[::-1][:n]
        return [city_reviews.iloc[i]["snippet"] for i in top_idxs if sims[i] > 0]
    except Exception:
        return []
