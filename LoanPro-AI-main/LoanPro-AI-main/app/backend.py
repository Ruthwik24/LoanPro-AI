import os
import pickle
import numpy as np
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Paths to the model files
MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")
LE_PATH = os.path.join(MODEL_DIR, "le.pkl")

# Global variables for model artifacts
model = None
scaler = None
le = None

def load_artifacts():
    global model, scaler, le
    try:
        print("Loading serialized model artifacts...")
        with open(MODEL_PATH, "rb") as f:
            model = pickle.load(f)
        with open(SCALER_PATH, "rb") as f:
            scaler = pickle.load(f)
        with open(LE_PATH, "rb") as f:
            le = pickle.load(f)
        print("Successfully loaded all artifacts!")
        return True
    except Exception as e:
        print(f"Error loading artifacts: {e}")
        return False

# Load artifacts on startup if they exist
artifacts_loaded = False
if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH) and os.path.exists(LE_PATH):
    artifacts_loaded = load_artifacts()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    global model, scaler, le, artifacts_loaded
    
    # Lazy load artifacts if not loaded yet
    if not artifacts_loaded:
        if not load_artifacts():
            return jsonify({
                "status": "error",
                "message": "Model artifacts not found or failed to load. Please make sure training is complete."
            }), 500
        artifacts_loaded = True
        
    try:
        data = request.json
        if not data:
            return jsonify({"status": "error", "message": "No input data provided"}), 400
            
        # Required features checklist
        required_features = [
            'purpose', 'int.rate', 'installment', 'log.annual.inc', 
            'dti', 'fico', 'days.with.cr.line', 'revol.bal', 
            'revol.util', 'inq.last.6mths', 'delinq.2yrs', 'pub.rec'
        ]
        
        # Verify all features exist
        missing_features = [f for f in required_features if f not in data]
        if missing_features:
            return jsonify({
                "status": "error", 
                "message": f"Missing required features: {missing_features}"
            }), 400
            
        # Process and encode 'purpose' categorical value
        purpose_val = data['purpose']
        if purpose_val not in le.classes_:
            # Fallback to a default class if the input string is unknown
            purpose_val = le.classes_[0]  # usually 'all_other'
        purpose_encoded = le.transform([purpose_val])[0]
        
        # Formulate feature vector
        features = [
            purpose_encoded,
            float(data['int.rate']),
            float(data['installment']),
            float(data['log.annual.inc']),
            float(data['dti']),
            float(data['fico']),
            float(data['days.with.cr.line']),
            float(data['revol.bal']),
            float(data['revol.util']),
            float(data['inq.last.6mths']),
            float(data['delinq.2yrs']),
            float(data['pub.rec'])
        ]
        
        features_arr = np.array([features])
        
        # Scale features using Standard Scaler
        features_scaled = scaler.transform(features_arr)
        
        # Predict status (0 = Not Eligible/Does Not Meet Policy, 1 = Eligible/Meets Policy)
        prediction = int(model.predict(features_scaled)[0])
        probabilities = model.predict_proba(features_scaled)[0]
        confidence = float(probabilities[1])  # Probability of class 1 (credit.policy = 1)
        
        # Map output status description
        status_label = "Meets Credit Policy" if prediction == 1 else "Does Not Meet Credit Policy"
        
        return jsonify({
            "status": "success",
            "prediction": prediction,
            "status_label": status_label,
            "confidence": confidence,
            "probability_ineligible": float(probabilities[0]),
            "probability_eligible": float(probabilities[1])
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Prediction failed: {str(e)}"
        }), 500

if __name__ == "__main__":
    # Get port, host, and debug settings from environment variables for deployment flexibility
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    debug = os.environ.get("DEBUG", "True").lower() == "true"
    
    print(f"Starting server on http://{host}:{port} (debug={debug})...")
    app.run(host=host, port=port, debug=debug)
