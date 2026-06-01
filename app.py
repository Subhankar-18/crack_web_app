import os
import base64
import cv2
import numpy as np
import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS

from ultralytics import YOLO
import tensorflow as tf

from openai import OpenAI

from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image
)

from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter

# =====================================================
# FLASK
# =====================================================

app = Flask(__name__)
CORS(app)

# =====================================================
# OPENAI
# =====================================================

#client = OpenAI()

# =====================================================
# FOLDERS
# =====================================================

UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
REPORT_FOLDER = "reports"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(REPORT_FOLDER, exist_ok=True)

# =====================================================
# LOAD MODELS
# =====================================================

yolo_model = YOLO("best.pt")

lstm_model = tf.keras.models.load_model(
    "crack_growth_lstm.h5",
    compile=False
)

# =====================================================
# LOAD SCALER
# =====================================================

scaler_min = np.load("scaler_min.npy")
scaler_max = np.load("scaler_max.npy")

# =====================================================
# SCALE FUNCTIONS
# =====================================================

def scale(x):
    return (x - scaler_min) / (scaler_max - scaler_min)


def inverse_scale(x):
    return x * (scaler_max - scaler_min) + scaler_min

# =====================================================
# AI REPORT GENERATOR
# =====================================================

def generate_ai_report(
        structure,
        severity,
        largest_crack,
        average_crack_width,
        prediction,
        risk_score,
        recommendation
):

    report = f"""
CRACK ANALYSIS REPORT
====================================

Structure Type:
{structure.upper()}

Overall Severity:
{severity}

Largest Crack Width:
{largest_crack:.2f} mm

Average Crack Width:
{average_crack_width:.2f} mm

Predicted Future Crack Width:
{prediction:.2f} mm

Risk Score:
{risk_score}/100

------------------------------------
STRUCTURE ANALYSIS
------------------------------------
"""

    # STRUCTURE ANALYSIS

    if structure == "bridge":

        report += """
Bridges are exposed to vibration,
vehicle load, weather changes,
and moisture conditions.

Even small cracks may expand over time.
"""

    elif structure == "building":

        report += """
Buildings mostly experience static loads.

Small cracks are generally safe unless
they continue growing over time.
"""

    elif structure == "pillar":

        report += """
Pillars are important load-bearing components.

Cracks in pillars may reduce structural
stability if crack growth continues.
"""

    elif structure == "road":

        report += """
Road cracks usually increase because of
traffic load and environmental conditions.

Early maintenance helps prevent potholes.
"""

    elif structure == "dam":

        report += """
Dam structures require strict crack monitoring
because water pressure can worsen cracks.
"""

    # RISK ANALYSIS

    report += """

------------------------------------
RISK ANALYSIS
------------------------------------
"""

    if severity == "LOW":

        report += """
The detected crack level is currently LOW risk.

Regular monitoring is recommended.
"""

    elif severity == "MODERATE":

        report += """
The crack shows MODERATE structural concern.

Repair and inspection are recommended soon.
"""

    else:

        report += """
The detected crack is HIGHLY dangerous.

Immediate structural inspection is required.
"""

    # PREDICTION

    report += f"""

------------------------------------
PREDICTION ANALYSIS
------------------------------------

The LSTM prediction model estimates future
crack growth up to approximately {prediction:.2f} mm.

Higher prediction values indicate increased
future structural risk.

------------------------------------
RECOMMENDATION
------------------------------------

{recommendation}

====================================
END OF REPORT
====================================
"""

    return report

# =====================================================
# PDF GENERATOR
# =====================================================

def create_pdf(
        report_text,
        image_path,
        chart_path,
        heatmap_path
):

    pdf_path = os.path.join(
        REPORT_FOLDER,
        "crack_report.pdf"
    )

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter
    )

    styles = getSampleStyleSheet()

    elements = []

    # TITLE

    elements.append(
        Paragraph(
            "Crack Analysis Report",
            styles['Title']
        )
    )

    elements.append(Spacer(1, 20))

    # REPORT TEXT

    elements.append(
        Paragraph(
            report_text,
            styles['BodyText']
        )
    )

    elements.append(Spacer(1, 20))

    # DETECTED IMAGE

    elements.append(
        Paragraph(
            "Detected Crack Image",
            styles['Heading2']
        )
    )

    elements.append(
        Image(
            image_path,
            width=400,
            height=250
        )
    )

    elements.append(Spacer(1, 20))

    # HEATMAP

    elements.append(
        Paragraph(
            "Crack Heatmap",
            styles['Heading2']
        )
    )

    elements.append(
        Image(
            heatmap_path,
            width=400,
            height=250
        )
    )

    elements.append(Spacer(1, 20))

    # CHART

    elements.append(
        Paragraph(
            "Crack Growth Prediction",
            styles['Heading2']
        )
    )

    elements.append(
        Image(
            chart_path,
            width=400,
            height=250
        )
    )

    doc.build(elements)

    return pdf_path

# =====================================================
# IMAGE APIs
# =====================================================

@app.route("/get-result-image")
def get_result_image():
    return send_file("outputs/result.jpg")


@app.route("/get-chart")
def get_chart():
    return send_file("outputs/chart.png")


@app.route("/get-heatmap")
def get_heatmap():
    return send_file("outputs/heatmap.jpg")

# =====================================================
# MAIN ANALYZE API
# =====================================================

@app.route("/analyze", methods=["POST"])
def analyze():

    # =================================================
    # GET FORM DATA
    # =================================================

    file = request.files["image"]

    structure = ""
    if "structure" in request.form:
        structure = request.form["structure"]

    structure = structure.lower().strip()

    print("RAW STRUCTURE =", structure)

# SMART MAPPING

    if "bridge" in structure:

        structure = "bridge"

    elif "pillar" in structure:

        structure = "pillar"

    elif "road" in structure:

        structure = "road"

    elif "dam" in structure:

        structure = "dam"

    elif "building" in structure:

        structure = "building"

    else:

        structure = "building"

    print("FINAL STRUCTURE =", structure)

    # =================================================
    # SAVE IMAGE
    # =================================================

    filepath = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    file.save(filepath)

    # =================================================
    # READ IMAGE
    # =================================================

    img = cv2.imread(filepath)

    image_height, image_width, _ = img.shape

    total_image_area = image_height * image_width

    # =================================================
    # YOLO DETECTION
    # =================================================

    results = yolo_model(
        img,
        conf=0.25
    )

    boxes = results[0].boxes.xyxy.cpu().numpy()

    annotated_img = results[0].plot()

    # =================================================
    # SAVE DETECTED IMAGE
    # =================================================

    result_path = os.path.join(
        OUTPUT_FOLDER,
        "result.jpg"
    )

    cv2.imwrite(
        result_path,
        annotated_img
    )

    # =================================================
    # NO CRACK DETECTED
    # =================================================

    if len(boxes) == 0:

        return jsonify({
            "message": "No crack detected"
        })

    # =================================================
    # CRACK ANALYSIS
    # =================================================

    crack_widths = []

    total_crack_area = 0

    low_count = 0
    moderate_count = 0
    severe_count = 0

    for box in boxes:

        x1, y1, x2, y2 = box

        crack_width = (x2 - x1) / 150

        crack_widths.append(crack_width)

        area = (x2 - x1) * (y2 - y1)

        total_crack_area += area

    # =================================================
    # STATS
    # =================================================

    total_cracks = len(crack_widths)

    largest_crack = max(crack_widths)

    average_crack_width = np.mean(crack_widths)

    damage_percentage = (
            total_crack_area / total_image_area
    ) * 100

    # =================================================
    # STRUCTURE SPECIFIC LOGIC
    # =================================================

    if structure == "bridge":

        safe_limit = 3.0
        danger_limit = 6.0

    elif structure == "building":

        safe_limit = 1.5
        danger_limit = 3.0

    elif structure == "pillar":

        safe_limit = 1.0
        danger_limit = 2.5

    elif structure == "road":

        safe_limit = 5.0
        danger_limit = 10.0

    elif structure == "dam":

        safe_limit = 0.8
        danger_limit = 2.0

    else:

        safe_limit = 2.0
        danger_limit = 4.0

    # =================================================
    # SEVERITY
    # =================================================

    for width in crack_widths:

        if width <= safe_limit:

            low_count += 1

        elif width <= danger_limit:

            moderate_count += 1

        else:

            severe_count += 1

    # =================================================
    # FINAL SEVERITY
    # =================================================

    if largest_crack <= safe_limit:

        severity = "LOW"

        risk_score = 20

    elif largest_crack <= danger_limit:

        severity = "MODERATE"

        risk_score = 60

    else:

        severity = "HIGH"

        risk_score = 95

    # =================================================
    # RECOMMENDATION
    # =================================================

    if severity == "LOW":

        recommendation = (
            f"The crack level is currently safe "
            f"for this {structure}. "
            f"Regular monitoring is recommended."
        )

    elif severity == "MODERATE":

        recommendation = (
            f"The crack may affect the structural "
            f"integrity of this {structure}. "
            f"Repair is recommended soon."
        )

    else:

        recommendation = (
            f"The crack is dangerous for this "
            f"{structure}. Immediate structural "
            f"inspection is required."
        )

    # =================================================
    # HEATMAP
    # =================================================

    gray = cv2.cvtColor(
        img,
        cv2.COLOR_BGR2GRAY
    )

    heatmap = cv2.applyColorMap(
        gray,
        cv2.COLORMAP_JET
    )

    heatmap_path = os.path.join(
        OUTPUT_FOLDER,
        "heatmap.jpg"
    )

    cv2.imwrite(
        heatmap_path,
        heatmap
    )

    # =================================================
    # LSTM PREDICTION
    # =================================================

    scaled = scale(
        np.array([[largest_crack]])
    )

    X = np.array([
        [[scaled[0][0]]] * 3
    ])

    pred = lstm_model.predict(X)

    prediction = float(
        inverse_scale(pred)[0][0]
    )

    # =================================================
    # GRAPH
    # =================================================

    x_values = [0, 1]

    y_values = [
        float(largest_crack),
        prediction
    ]

    plt.figure(figsize=(7, 4))

    plt.plot(
        x_values,
        y_values,
        marker="o",
        linewidth=3
    )

    plt.fill_between(
        x_values,
        y_values,
        alpha=0.2
    )

    plt.xticks(
        [0, 1],
        ["Current", "Predicted"]
    )

    plt.ylabel("Crack Width (mm)")

    plt.title("Crack Growth Prediction")

    chart_path = os.path.join(
        OUTPUT_FOLDER,
        "chart.png"
    )

    plt.savefig(chart_path)

    plt.close()

    # =================================================
    # OPENAI REPORT
    # =================================================

    try:

        report_text = generate_ai_report(

            structure,

            severity,

            float(largest_crack),

            float(average_crack_width),

            float(prediction),

            int(risk_score),

            recommendation
        )

    except Exception as e:

        report_text = f"""
AI Report Generation Failed

Reason:
{str(e)}

Structure:
{structure}

Severity:
{severity}

Largest Crack:
{largest_crack:.2f} mm

Prediction:
{prediction:.2f} mm

Risk Score:
{risk_score}/100

Recommendation:
{recommendation}
"""

    # =================================================
    # PDF
    # =================================================

    pdf_path = create_pdf(
        report_text,
        result_path,
        chart_path,
        heatmap_path
    )

    # =================================================
    # RESPONSE
    # =================================================

    # -----------------------------
    # Return JSON
    # -----------------------------
    return jsonify({

        # IMAGES

        "result_image":
            "http://127.0.0.1:5000/get-result-image",

        "chart":
            "http://127.0.0.1:5000/get-chart",

        "heatmap":
            "http://127.0.0.1:5000/get-heatmap",

        # STRUCTURE

        "structure": structure,

        # STATS

        "total_cracks": int(total_cracks),

        "largest_crack":
            float(largest_crack),

        "average_crack_width":
            float(average_crack_width),

        "damage_percentage":
            float(damage_percentage),

        # AI

        "severity": severity,

        "risk_score": int(risk_score),

        "recommendation": recommendation,

        # PREDICTION

        "prediction":
            float(prediction),

        # COUNTS

        "severity_counts": {

            "low": int(low_count),

            "moderate": int(moderate_count),

            "severe": int(severe_count)
        },

        # REPORT

        "report": report_text,

        # PDF

        "pdf_url":
            "http://127.0.0.1:5000/download-report"
    })

# =====================================================
# DOWNLOAD REPORT
# =====================================================

@app.route("/download-report")
def download_report():

    pdf_path = os.path.join(
        REPORT_FOLDER,
        "crack_report.pdf"
    )

    return send_file(
        pdf_path,
        as_attachment=True
    )

# =====================================================
# RUN
# =====================================================

# -----------------------------
# Run server
# -----------------------------
if __name__ == "__main__":

    app.run(debug=True)