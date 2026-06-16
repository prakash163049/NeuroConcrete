from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import pickle
import numpy as np
import warnings
import os

warnings.filterwarnings("ignore")

app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# ─── Load Model ───────────────────────────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "concrete_strength_model.pkl")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

FEATURE_NAMES = ["cement", "slag", "ash", "water", "superplastic", "coarseagg", "fineagg", "age"]

# Feature metadata for validation
FEATURE_META = {
    "cement":       {"min": 100,  "max": 540,  "unit": "kg/m³",  "label": "Cement"},
    "slag":         {"min": 0,    "max": 360,  "unit": "kg/m³",  "label": "Blast Furnace Slag"},
    "ash":          {"min": 0,    "max": 200,  "unit": "kg/m³",  "label": "Fly Ash"},
    "water":        {"min": 120,  "max": 250,  "unit": "kg/m³",  "label": "Water"},
    "superplastic": {"min": 0,    "max": 32,   "unit": "kg/m³",  "label": "Superplasticizer"},
    "coarseagg":    {"min": 800,  "max": 1145, "unit": "kg/m³",  "label": "Coarse Aggregate"},
    "fineagg":      {"min": 594,  "max": 993,  "unit": "kg/m³",  "label": "Fine Aggregate"},
    "age":          {"min": 1,    "max": 365,  "unit": "days",   "label": "Age"},
}

# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html", feature_meta=FEATURE_META)


@app.route("/api/meta")
def meta():
    return jsonify(FEATURE_META)


@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)
        
        features = []
        for fname in FEATURE_NAMES:
            val = data.get(fname)
            if val is None:
                return jsonify({"error": f"Missing field: {fname}"}), 400
            features.append(float(val))
        
        input_array = np.array([features])
        prediction = model.predict(input_array)[0]
        prediction = round(float(prediction), 2)
        
        # Classify strength
        if prediction < 20:
            grade = "Low"
            grade_class = "low"
            grade_desc = "Below standard structural grade"
        elif prediction < 40:
            grade = "Medium"
            grade_class = "medium"
            grade_desc = "Suitable for general construction"
        elif prediction < 60:
            grade = "High"
            grade_class = "high"
            grade_desc = "Suitable for high-load structures"
        else:
            grade = "Ultra-High"
            grade_class = "ultra"
            grade_desc = "Exceptional structural performance"
        
        return jsonify({
            "prediction": prediction,
            "unit": "MPa",
            "grade": grade,
            "grade_class": grade_class,
            "grade_desc": grade_desc,
            "input": dict(zip(FEATURE_NAMES, features))
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("NeuroConcrete AI Server starting...")
    print("Open http://localhost:5000 in your browser")
    app.run(debug=True, port=5000)
