import pandas as pd
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_reviews():
    path_data = os.path.join(BASE_DIR, "data/final_goataways_reviews_completed.csv")
    path_root = os.path.join(BASE_DIR, "final_goataways_reviews_completed.csv")
    
    if os.path.exists(path_data):
        return pd.read_csv(path_data)
    elif os.path.exists(path_root):
        return pd.read_csv(path_root)
    else:
        print("WARNING: Reviews dataset not found! Please check the filename.")
        return pd.DataFrame(columns=["city_id", "city", "text", "snippet"])

_reviews_df = load_reviews()

# Aggregate reviews per city for destination ranking
_city_review_corpus = (
    _reviews_df.groupby("city_id")
    .agg(
        city=("city", "first"),
        full_text=("text", lambda texts: " ".join(texts.fillna("")))
    ).reset_index()
)

# sublinear_tf=True dampens the effect of keyword spamming, 
# while TF-IDF inherently boosts rare keywords.
_review_vectorizer = TfidfVectorizer(ngram_range=(1, 3), stop_words="english", sublinear_tf=True)

if not _city_review_corpus.empty:
    _review_tfidf_matrix = _review_vectorizer.fit_transform(_city_review_corpus["full_text"])

def get_review_scores(query: str) -> dict:
    if _city_review_corpus.empty:
        return {}
    query_vec = _review_vectorizer.transform([query])
    scores = cosine_similarity(query_vec, _review_tfidf_matrix).flatten()
    return {row["city_id"]: float(scores[i]) for i, row in _city_review_corpus.iterrows()}

def get_best_review_snippet(query: str, city_id: str) -> str:
    """Returns the single best sentence explaining why this city matches."""
    city_reviews = _reviews_df[_reviews_df["city_id"] == city_id].copy()
    if city_reviews.empty:
        return "A great destination based on our overall data."

    city_reviews["text"] = city_reviews["text"].fillna("")
    vect = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
    try:
        mat = vect.fit_transform(city_reviews["text"])
        q_vec = vect.transform([query])
        sims = cosine_similarity(q_vec, mat).flatten()
        best_idx = sims.argmax()
        
        if sims[best_idx] > 0:
            return city_reviews.iloc[best_idx]["snippet"]
    except Exception:
        pass
    
    return "Highly rated by travelers."