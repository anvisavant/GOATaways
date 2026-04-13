import os
import re
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer, ENGLISH_STOP_WORDS
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

TRAVEL_STOP_WORDS = [
    "vacation", "trip", "holiday", "getaway", "destination", "place", "location", "spot",
    "want", "need", "looking", "find", "seeking", "visit", "travel", "traveling", "travelling",
    "good", "great", "nice", "perfect", "ideal", "beautiful", "amazing", "awesome",
    "days", "day", "week", "weeks", "weekend", "month", "months"
]
CUSTOM_STOP_WORDS = list(ENGLISH_STOP_WORDS.union(TRAVEL_STOP_WORDS))

def load_reviews():
    candidates = [
        os.path.join(BASE_DIR, "data", "final_goataways_reviews_completed.csv"),
        os.path.join(BASE_DIR, "data", "goataways_reviews_1.csv"),
        os.path.join(BASE_DIR, "data", "goataway_reviews_1.csv"),
    ]

    for path in candidates:
        abs_path = os.path.abspath(path)
        if os.path.exists(abs_path):
            print(f"Loading reviews from: {abs_path}")
            return pd.read_csv(abs_path)

    raise FileNotFoundError(
        "Could not find reviews CSV. Checked:\n" +
        "\n".join(os.path.abspath(p) for p in candidates)
    )

_reviews_df = load_reviews()

_city_review_corpus = (
    _reviews_df.groupby("city_id")
    .agg(
        city=("city", "first"),
        country=("country", "first"),
        full_text=("text", lambda s: " ".join(s.fillna("").astype(str)))
    )
    .reset_index()
)

_review_vectorizer = TfidfVectorizer(
    ngram_range=(1, 2),
    stop_words=CUSTOM_STOP_WORDS,
    max_features=50000,
    sublinear_tf=True,
    min_df=2
)

_review_tfidf_matrix = _review_vectorizer.fit_transform(_city_review_corpus["full_text"])

N_COMPONENTS = min(50, max(2, _review_tfidf_matrix.shape[1] - 1), max(2, _review_tfidf_matrix.shape[0] - 1))
_review_svd = TruncatedSVD(n_components=N_COMPONENTS, random_state=42)
_review_svd_matrix = _review_svd.fit_transform(_review_tfidf_matrix)

_feature_names = np.array(_review_vectorizer.get_feature_names_out())

def _clean_query(query: str) -> str:
    return re.sub(r"\s+", " ", (query or "").strip().lower())

def get_review_scores(query: str) -> dict:
    q = _clean_query(query)
    q_vec = _review_vectorizer.transform([q])
    tfidf_scores = cosine_similarity(q_vec, _review_tfidf_matrix).flatten()

    q_svd = _review_svd.transform(q_vec)
    svd_scores = cosine_similarity(q_svd, _review_svd_matrix).flatten()

    out = {}
    for i, row in _city_review_corpus.iterrows():
        out[row["city_id"]] = {
            "tfidf_score": float(tfidf_scores[i]),
            "svd_score": float(svd_scores[i]),
            "hybrid_score": float(0.25 * tfidf_scores[i] + 0.75 * svd_scores[i])
        }
    return out

def get_query_latent_profile(query: str, top_k: int = 5):
    q = _clean_query(query)
    q_vec = _review_vectorizer.transform([q])
    q_svd = _review_svd.transform(q_vec)[0]

    pos_idx = np.argsort(q_svd)[::-1][:top_k]
    neg_idx = np.argsort(q_svd)[:top_k]

    return {
        "positive": [{"dimension": int(i), "weight": float(q_svd[i])} for i in pos_idx if q_svd[i] > 0],
        "negative": [{"dimension": int(i), "weight": float(q_svd[i])} for i in neg_idx if q_svd[i] < 0]
    }

def get_city_latent_profile(city_id: str, top_k: int = 5):
    row = _city_review_corpus[_city_review_corpus["city_id"] == city_id]
    if row.empty:
        return {"positive": [], "negative": []}

    idx = row.index[0]
    city_vec = _review_svd_matrix[idx]

    pos_idx = np.argsort(city_vec)[::-1][:top_k]
    neg_idx = np.argsort(city_vec)[:top_k]

    return {
        "positive": [{"dimension": int(i), "weight": float(city_vec[i])} for i in pos_idx if city_vec[i] > 0],
        "negative": [{"dimension": int(i), "weight": float(city_vec[i])} for i in neg_idx if city_vec[i] < 0]
    }

def get_shared_latent_dimensions(query: str, city_id: str, top_k: int = 3):
    q = _clean_query(query)
    q_vec = _review_vectorizer.transform([q])
    q_svd = _review_svd.transform(q_vec)[0]

    row = _city_review_corpus[_city_review_corpus["city_id"] == city_id]
    if row.empty:
        return []

    idx = row.index[0]
    c_svd = _review_svd_matrix[idx]

    contrib = q_svd * c_svd
    order = np.argsort(np.abs(contrib))[::-1][:top_k]

    shared = []
    for i in order:
        if contrib[i] == 0:
            continue
        shared.append({
            "dimension": int(i),
            "query_weight": float(q_svd[i]),
            "city_weight": float(c_svd[i]),
            "contribution": float(contrib[i]),
            "direction": "positive" if contrib[i] > 0 else "negative"
        })
    return shared

def describe_latent_dimension(dim_idx: int, top_terms: int = 8):
    comp = _review_svd.components_[dim_idx]
    pos_idx = np.argsort(comp)[::-1][:top_terms]
    neg_idx = np.argsort(comp)[:top_terms]

    return {
        "dimension": int(dim_idx),
        "positive_terms": _feature_names[pos_idx].tolist(),
        "negative_terms": _feature_names[neg_idx].tolist()
    }

def get_dimension_explanations(query: str, city_id: str, top_k: int = 3):
    shared = get_shared_latent_dimensions(query, city_id, top_k=top_k)
    explained = []
    for item in shared:
        desc = describe_latent_dimension(item["dimension"])
        explained.append({
            **item,
            "positive_terms": desc["positive_terms"],
            "negative_terms": desc["negative_terms"]
        })
    return explained

def get_best_review_snippet(query: str, city_id: str) -> str:
    city_reviews = _reviews_df[_reviews_df["city_id"] == city_id].copy()
    if city_reviews.empty:
        return "No matching review snippet found."

    city_reviews["text"] = city_reviews["text"].fillna("").astype(str)

    sentences = []
    for _, row in city_reviews.iterrows():
        raw_text = row["text"]
        raw_snippet = str(row.get("snippet", "")).strip()
        split_sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', raw_text) if len(s.strip()) > 20]
        if raw_snippet:
            split_sentences.append(raw_snippet)
        for s in split_sentences:
            sentences.append(s)

    if not sentences:
        return "No matching review snippet found."

    sent_vec = _review_vectorizer.transform(sentences)
    q_vec = _review_vectorizer.transform([_clean_query(query)])

    sent_svd = _review_svd.transform(sent_vec)
    q_svd = _review_svd.transform(q_vec)

    tfidf_scores = cosine_similarity(q_vec, sent_vec).flatten()
    svd_scores = cosine_similarity(q_svd, sent_svd).flatten()
    hybrid = 0.2 * tfidf_scores + 0.8 * svd_scores

    best_idx = int(np.argmax(hybrid))
    return sentences[best_idx][:220]