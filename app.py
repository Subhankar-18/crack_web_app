import os
import base64
import numpy as np
import cv2
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from flask_cors import CORS


from flask import Flask, request, jsonify
from ultralytics import YOLO
import tensorflow as tf

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Load models
yolo_model = YOLO("best.pt")
lstm_model = tf.keras.models.load_model("crack_growth_lstm.h5", compile=False)

scaler_min = np.load("scaler_min.npy")
scaler_max = np.load("scaler_max.npy")

def scale(x):
    return (x - scaler_min) / (scaler_max - scaler_min)

def inverse_scale(x):
    return x * (scaler_max - scaler_min) + scaler_min


@app.route("/upload", methods=["POST"])
def upload_image():
    file = request.files["image"]

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    img = cv2.imread(filepath)

    # YOLO detection
    results = yolo_model(img, conf=0.01)
    boxed = results[0].plot()

    output_path = os.path.join(OUTPUT_FOLDER, "result.jpg")
    cv2.imwrite(output_path, boxed)

    # Fake crack width example (replace with real measurement later)
    crack_width = np.random.uniform(1.0, 2.0)

    scaled = scale(np.array([[crack_width]]))
    X = np.array([[[scaled[0][0]]]*3])

    pred = lstm_model.predict(X)
    pred_value = float(inverse_scale(pred)[0][0])

    # Plot prediction chart
    plt.figure()
    plt.plot([crack_width, pred_value], marker="o")
    plt.title("Crack Growth Prediction")
    chart_path = os.path.join(OUTPUT_FOLDER, "chart.png")
    plt.savefig(chart_path)
    plt.close()

    # Convert images to base64
    with open(output_path, "rb") as f:
        img_base64 = base64.b64encode(f.read()).decode()

    with open(chart_path, "rb") as f:
        chart_base64 = base64.b64encode(f.read()).decode()

    return jsonify({
        "image": img_base64,
        "prediction": pred_value,
        "chart": chart_base64
    })


if __name__ == "__main__":
    app.run(debug=True)
