import os
import base64
import numpy as np
import cv2
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import random

from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import tensorflow as tf

# -----------------------------
# Fix randomness
# -----------------------------
np.random.seed(42)
tf.random.set_seed(42)
random.seed(42)

# -----------------------------
# Flask setup
# -----------------------------
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# -----------------------------
# Load models
# -----------------------------
print("Loading YOLO model...")
yolo_model = YOLO("best.pt")

print("Loading LSTM model...")
lstm_model = tf.keras.models.load_model("crack_growth_lstm.h5", compile=False)

scaler_min = np.load("scaler_min.npy")
scaler_max = np.load("scaler_max.npy")

print("Models loaded successfully")


# -----------------------------
# Scaling functions
# -----------------------------
def scale(x):
    return (x - scaler_min) / (scaler_max - scaler_min)

def inverse_scale(x):
    return x * (scaler_max - scaler_min) + scaler_min


# -----------------------------
# Upload API
# -----------------------------
@app.route("/upload", methods=["POST"])
def upload_image():

    file = request.files["image"]

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    img = cv2.imread(filepath)

    # -----------------------------
    # YOLO Crack Detection
    # -----------------------------
    results = yolo_model(img, conf=0.25)

    boxes = results[0].boxes
    boxed_image = results[0].plot()

    output_path = os.path.join(OUTPUT_FOLDER, "result.jpg")
    cv2.imwrite(output_path, boxed_image)

    # -----------------------------
    # Extract crack width
    # -----------------------------
    if boxes is not None and len(boxes) > 0:

        widths = boxes.xywh[:, 2].cpu().numpy()

        # choose largest crack
        crack_width = float(max(widths)) / 100

    else:
        crack_width = 1.0

    print("Detected crack width:", crack_width)

    # -----------------------------
    # LSTM Prediction
    # -----------------------------
    scaled = scale(np.array([[crack_width]]))

    X = np.array([[[scaled[0][0]]] * 3])

    pred = lstm_model.predict(X)

    pred_value = float(inverse_scale(pred)[0][0])

    print("Predicted crack growth:", pred_value)

    # -----------------------------
    # Create Prediction Graph
    # -----------------------------
    cycles = [0, 1, 2, 3]
    values = [
        crack_width,
        crack_width + (pred_value - crack_width) * 0.33,
        crack_width + (pred_value - crack_width) * 0.66,
        pred_value
    ]

    plt.figure(figsize=(6,4))

    plt.plot(cycles, values, marker="o", linewidth=3, color="#3aa6ff")

    plt.fill_between(cycles, values, alpha=0.2)

    plt.xlabel("Cycles")
    plt.ylabel("Crack Width (mm)")
    plt.title("Crack Growth Prediction")

    plt.grid(alpha=0.3)

    chart_path = os.path.join(OUTPUT_FOLDER, "chart.png")

    plt.savefig(chart_path, bbox_inches="tight")
    plt.close()

    # -----------------------------
    # Convert images to base64
    # -----------------------------
    with open(output_path, "rb") as f:
        image_base64 = base64.b64encode(f.read()).decode()

    with open(chart_path, "rb") as f:
        chart_base64 = base64.b64encode(f.read()).decode()

    # -----------------------------
    # Return JSON
    # -----------------------------
    return jsonify({
        "image": image_base64,
        "prediction": pred_value,
        "chart": chart_base64
    })


# -----------------------------
# Run server
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)