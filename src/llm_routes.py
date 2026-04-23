"""
LLM routes for GOATaways RAG — loaded when USE_LLM = True in app.py.

Two endpoints:
  POST /api/llm/ir-query   → LLM-optimised keyword query for the IR system
  POST /api/llm/summarise  → Friendly paragraph summarising top-10 cities

Setup:
  Local dev:  add  SPARK_API_KEY=<your_dev_key>  to a .env file in project root.
  Production: the key is injected automatically as SPARK_API_KEY by the server.
"""

import os
import logging
from flask import request, jsonify
from infosci_spark_client import LLMClient

logger = logging.getLogger(__name__)


def _get_client() -> LLMClient:
    """Return an LLMClient using SPARK_API_KEY from the environment."""
    api_key = os.getenv("SPARK_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "SPARK_API_KEY is not set. Add it to your .env file for local "
            "development, or check the dashboard for the production key."
        )
    return LLMClient(api_key=api_key)


# ── API 1: IR-optimised query ────────────────────────────────────────────────

def _build_ir_query(client: LLMClient, user_query: str) -> str:
    messages = [
        {
            "role": "system",
            "content": (
                "You are a search-query optimisation assistant for a travel "
                "city recommendation engine. "
                "Given a user's natural-language travel query, output ONLY a "
                "short space-separated list of the most informative keywords "
                "for a TF-IDF + SVD Information Retrieval system.\n"
                "Rules:\n"
                "- Output ONLY keywords, no punctuation, no sentences.\n"
                "- 5–12 words maximum.\n"
                "- Preserve meaningful adjectives (warm, budget, solo, family, "
                "beach, hiking, food, etc.).\n"
                "- Drop stop words, filler, and first-person pronouns.\n"
                "- Do NOT explain yourself; output the keyword string only."
            ),
        },
        {"role": "user", "content": user_query},
    ]
    response = client.chat(messages)
    return (response.get("content") or "").strip()


# ── API 2: Top-10 cities summariser ─────────────────────────────────────────

def _build_summary(client: LLMClient, user_query: str, cities: list) -> str:
    city_lines = []
    for i, c in enumerate(cities[:10], 1):
        name = f"{c.get('city', '?')}, {c.get('country', '?')}"
        desc = c.get("short_description", "")[:120]
        budget = c.get("budget", "")
        region = c.get("region", "")
        city_lines.append(f"{i}. {name} ({region}, {budget} budget) — {desc}")
    context = "\n".join(city_lines)

    messages = [
        {
            "role": "system",
            "content": (
                "You are a friendly travel expert writing for a city "
                "recommendation app called GOATaways. "
                "You will be given a user's travel query and a ranked list of "
                "up to 10 matching cities returned by an IR system. "
                "Write a single paragraph (3–5 sentences, ~80–120 words) that "
                "explains WHY these cities are a great match for the user's "
                "request. Be warm, specific, and reference concrete details "
                "from the city descriptions. Do not just list the cities — "
                "weave them into a coherent narrative. No headings or bullets."
            ),
        },
        {
            "role": "user",
            "content": (
                f"User query: {user_query}\n\n"
                f"Top recommended cities:\n{context}"
            ),
        },
    ]
    response = client.chat(messages)
    return (response.get("content") or "").strip()


# ── Route registration ───────────────────────────────────────────────────────

def register_llm_routes(app):
    """Register both LLM endpoints. Call this from app.py when USE_LLM=True."""

    @app.route("/api/llm/ir-query", methods=["POST"])
    def llm_ir_query():
        data = request.get_json() or {}
        user_query = (data.get("query") or "").strip()
        if not user_query:
            return jsonify({"error": "query is required"}), 400
        try:
            client = _get_client()
        except EnvironmentError as e:
            return jsonify({"error": str(e)}), 500
        try:
            ir_query = _build_ir_query(client, user_query)
            logger.info(f"[llm/ir-query] '{user_query}' → '{ir_query}'")
            return jsonify({"ir_query": ir_query})
        except Exception as e:
            logger.error(f"[llm/ir-query] LLM error: {e}")
            return jsonify({"error": "LLM request failed", "detail": str(e)}), 500

    @app.route("/api/llm/summarise", methods=["POST"])
    def llm_summarise():
        data = request.get_json() or {}
        user_query = (data.get("query") or "").strip()
        cities = data.get("cities") or []
        if not user_query:
            return jsonify({"error": "query is required"}), 400
        if not cities:
            return jsonify({"error": "cities list is required"}), 400
        try:
            client = _get_client()
        except EnvironmentError as e:
            return jsonify({"error": str(e)}), 500
        try:
            summary = _build_summary(client, user_query, cities)
            logger.info(f"[llm/summarise] generated summary for '{user_query}'")
            return jsonify({"summary": summary})
        except Exception as e:
            logger.error(f"[llm/summarise] LLM error: {e}")
            return jsonify({"error": "LLM request failed", "detail": str(e)}), 500