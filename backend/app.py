from flask import Flask, request, jsonify
from flask_cors import CORS
from ranker import rank_destinations

app = Flask(__name__)
CORS(app)

@app.route("/api/search", methods=["GET"])
def search():
    query              = request.args.get("q", "")
    user_lat           = request.args.get("lat", type=float)
    user_lon           = request.args.get("lon", type=float)
    user_baseline_temp = request.args.get("baseline_temp", type=float)

    if not query:
        return jsonify({"error": "no query provided"}), 400

    results = rank_destinations(
        query,
        user_lat=user_lat,
        user_lon=user_lon,
        user_baseline_temp=user_baseline_temp
    )
    return jsonify({"query": query, "results": results})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True)