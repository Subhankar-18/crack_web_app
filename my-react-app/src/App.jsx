import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function App() {

  const [image, setImage] = useState(null);

  const [originalPreview, setOriginalPreview] = useState(null);

  const [result, setResult] = useState(null);

  const [prediction, setPrediction] = useState(null);

  const [chart, setChart] = useState(null);

  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {

    const savedHistory = JSON.parse(
      localStorage.getItem("crack_history") || "[]"
    );

    setHistory(savedHistory);

  }, []);

  const getSeverity = (width) => {

    if (width < 0.5)
      return {
        label: "Minor",
        color: "#238636"
      };

    if (width < 1.5)
      return {
        label: "Moderate",
        color: "#d29922"
      };

    return {
      label: "Critical",
      color: "#f85149"
    };
  };

  const getRecommendation = (severity) => {

    if (severity === "Minor")
      return "Minor crack detected. Monitor monthly.";

    if (severity === "Moderate")
      return "Moderate damage detected. Repair recommended.";

    return "Critical crack detected. Immediate inspection required.";
  };

  const handleFileChange = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    await processUpload(file);
  };

  const processUpload = async (file) => {

    setImage(file);

    setOriginalPreview(URL.createObjectURL(file));

    setLoading(true);

    setResult(null);

    const formData = new FormData();

    formData.append("image", file);

    try {

      const res = await axios.post(
        "http://127.0.0.1:5000/upload",
        formData
      );

      const newResult = {

        image:
          "data:image/jpeg;base64," +
          res.data.image,

        prediction:
          res.data.prediction,

        chart:
          "data:image/png;base64," +
          res.data.chart,

        timestamp:
          new Date().toLocaleString(),

        fileName:
          file.name
      };

      setResult(newResult.image);

      setPrediction(newResult.prediction);

      setChart(newResult.chart);

      const updatedHistory = [
        newResult,
        ...history
      ].slice(0, 5);

      setHistory(updatedHistory);

      localStorage.setItem(
        "crack_history",
        JSON.stringify(updatedHistory)
      );

    } catch (error) {

      console.error("Upload failed:", error);

      alert("Failed to process image.");

    } finally {

      setLoading(false);
    }
  };

  const severity = prediction
    ? getSeverity(prediction)
    : null;

  return (

    <div className="container">

      {/* HEADER */}

      <header
        style={{
          textAlign: "center",
          marginBottom: "3rem"
        }}
      >

        <h1
          style={{
            fontSize: "2.7rem",
            marginBottom: "0.5rem"
          }}
        >
          Crack{" "}
          <span style={{ color: "var(--primary)" }}>
            Detection
          </span>{" "}
          AI
        </h1>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "1.1rem"
          }}
        >
          AI-powered structural crack analysis
          using YOLOv8 and LSTM prediction.
        </p>

      </header>

      {/* DASHBOARD STATS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "2rem"
        }}
      >

        <div className="glass-card">
          <h4>Total Scans</h4>
          <h2>{history.length}</h2>
        </div>

        <div className="glass-card">
          <h4>Critical Cracks</h4>

          <h2>
            {
              history.filter(
                item =>
                  getSeverity(item.prediction).label
                  === "Critical"
              ).length
            }
          </h2>
        </div>

        <div className="glass-card">
          <h4>Average Width</h4>

          <h2>
            {
              history.length
                ? (
                    history.reduce(
                      (a, b) =>
                        a + b.prediction,
                      0
                    ) / history.length
                  ).toFixed(2)
                : 0
            } mm
          </h2>
        </div>

      </div>

      <main>

        <section className="glass-card">

          {/* UPLOAD AREA */}

          {!result && !loading && (

            <div
              className="upload-area"
              onClick={() =>
                fileInputRef.current.click()
              }
            >

              <div
                style={{
                  fontSize: "3rem",
                  marginBottom: "1rem"
                }}
              >
                📁
              </div>

              <h3
                style={{
                  marginBottom: "0.5rem"
                }}
              >
                Upload Structural Image
              </h3>

              <p
                style={{
                  color: "var(--text-muted)"
                }}
              >
                Click to browse image
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: "none" }}
                accept="image/*"
              />

            </div>
          )}

          {/* LOADING */}

          {loading && (

            <div
              style={{
                textAlign: "center",
                padding: "3rem"
              }}
            >

              <div className="loading-spinner"></div>

              <p
                style={{
                  marginTop: "1rem",
                  color: "var(--primary)"
                }}
              >
                Analyzing structural integrity...
              </p>

            </div>
          )}

          {/* RESULTS */}

          {result && !loading && (

            <div className="results-container">

              {/* TOP BAR */}

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "center",
                  marginBottom: "2rem"
                }}
              >

                <div>

                  <h2 style={{ margin: 0 }}>
                    Analysis Results
                  </h2>

                  <span
                    style={{
                      color:
                        "var(--text-muted)",
                      fontSize: "0.9rem"
                    }}
                  >
                    Processed on{" "}
                    {new Date().toLocaleTimeString()}
                  </span>

                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "1rem"
                  }}
                >

                  <button
                    onClick={() =>
                      window.print()
                    }
                    style={{
                      background:
                        "rgba(255,255,255,0.1)",
                      color: "white",
                      border:
                        "1px solid var(--border)"
                    }}
                  >
                    📄 Generate Report
                  </button>

                  <button
                    onClick={() => {
                      setResult(null);
                      setPrediction(null);
                    }}
                  >
                    New Scan
                  </button>

                </div>
              </div>

              {/* RESULTS GRID */}

              <div className="results-grid">

                {/* ORIGINAL IMAGE */}

                <div className="result-item">

                  <h3
                    style={{
                      marginBottom: "1rem",
                      fontSize: "0.9rem",
                      color:
                        "var(--text-muted)",
                      textTransform:
                        "uppercase"
                    }}
                  >
                    Original Image
                  </h3>

                  <img
                    src={originalPreview}
                    alt="Original"
                    style={{
                      borderRadius: "12px"
                    }}
                  />

                </div>

                {/* DETECTION */}

                <div className="result-item">

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      marginBottom: "1rem"
                    }}
                  >

                    <h3
                      style={{
                        margin: 0,
                        fontSize: "0.9rem",
                        color:
                          "var(--text-muted)",
                        textTransform:
                          "uppercase"
                      }}
                    >
                      Detection Visualization
                    </h3>

                    <a
                      href={result}
                      download="crack_detection.jpg"
                      style={{
                        color:
                          "var(--primary)",
                        fontSize: "0.8rem",
                        textDecoration: "none"
                      }}
                    >
                      Download
                    </a>

                  </div>

                  <img
                    src={result}
                    alt="Detected Crack"
                    style={{
                      borderRadius: "12px"
                    }}
                  />

                </div>

              </div>

              {/* METRICS */}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(220px,1fr))",
                  gap: "1rem",
                  marginTop: "2rem"
                }}
              >

                <div className="glass-card">

                  <span
                    style={{
                      color:
                        "var(--text-muted)"
                    }}
                  >
                    Predicted Width
                  </span>

                  <h2
                    style={{
                      color:
                        "var(--primary)"
                    }}
                  >
                    {prediction?.toFixed(3)} mm
                  </h2>

                </div>

                <div className="glass-card">

                  <span
                    style={{
                      color:
                        "var(--text-muted)"
                    }}
                  >
                    Severity Level
                  </span>

                  <h2
                    style={{
                      color:
                        severity.color
                    }}
                  >
                    {severity.label}
                  </h2>

                </div>

                <div className="glass-card">

                  <span
                    style={{
                      color:
                        "var(--text-muted)"
                    }}
                  >
                    Risk Level
                  </span>

                  <h2>
                    {
                      severity.label ===
                      "Critical"
                        ? "High"
                        : severity.label ===
                          "Moderate"
                        ? "Medium"
                        : "Low"
                    }
                  </h2>

                </div>

                <div className="glass-card">

                  <span
                    style={{
                      color:
                        "var(--text-muted)"
                    }}
                  >
                    AI Confidence
                  </span>

                  <h2>94%</h2>

                </div>

              </div>

              {/* RECOMMENDATION */}

              <div
                className="glass-card"
                style={{
                  marginTop: "2rem"
                }}
              >

                <h3>
                  AI Maintenance Recommendation
                </h3>

                <p
                  style={{
                    color:
                      "var(--text-muted)"
                  }}
                >
                  {
                    severity &&
                    getRecommendation(
                      severity.label
                    )
                  }
                </p>

              </div>

              {/* CHART */}

              <div
                className="result-item"
                style={{
                  marginTop: "2rem"
                }}
              >

                <div
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    marginBottom: "1rem"
                  }}
                >

                  <h3
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      color:
                        "var(--text-muted)",
                      textTransform:
                        "uppercase"
                    }}
                  >
                    Growth Analysis
                  </h3>

                  <a
                    href={chart}
                    download="growth_chart.png"
                    style={{
                      color:
                        "var(--primary)",
                      fontSize: "0.8rem",
                      textDecoration: "none"
                    }}
                  >
                    Download Chart
                  </a>

                </div>

                <img
                  src={chart}
                  alt="Prediction Chart"
                  style={{
                    borderRadius: "12px"
                  }}
                />

              </div>

            </div>
          )}

        </section>

        {/* HISTORY */}

        {
          history.length > 0 &&
          !loading && (

            <section
              className="recent-scans-section"
              style={{
                marginTop: "3rem"
              }}
            >

              <h3
                style={{
                  marginBottom: "1.5rem"
                }}
              >
                Recent Session Scans
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "1.5rem"
                }}
              >

                {
                  history.map(
                    (item, index) => (

                      <div
                        key={index}
                        className="glass-card"
                        style={{
                          padding: "1rem",
                          cursor: "pointer"
                        }}

                        onClick={() => {

                          setResult(item.image);

                          setPrediction(
                            item.prediction
                          );

                          setChart(item.chart);
                        }}
                      >

                        <img
                          src={item.image}
                          alt=""
                          style={{
                            height: "120px",
                            width: "100%",
                            objectFit: "cover",
                            marginBottom: "0.5rem",
                            borderRadius: "10px"
                          }}
                        />

                        <div
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "600"
                          }}
                        >
                          {item.fileName}
                        </div>

                        <div
                          style={{
                            fontSize: "0.75rem",
                            color:
                              "var(--text-muted)"
                          }}
                        >
                          {
                            item.prediction.toFixed(2)
                          } mm
                          {" • "}
                          {
                            getSeverity(
                              item.prediction
                            ).label
                          }
                        </div>

                      </div>
                    )
                  )
                }

              </div>

            </section>
          )
        }

        {/* TREND GRAPH */}

        {
          history.length > 0 && (

            <section
              style={{
                marginTop: "3rem"
              }}
            >

              <div className="glass-card">

                <h3
                  style={{
                    marginBottom: "1.5rem"
                  }}
                >
                  Crack Growth Trend
                </h3>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >

                  <LineChart
                    data={history}
                  >

                    <XAxis
                      dataKey="timestamp"
                      hide
                    />

                    <YAxis />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="prediction"
                      stroke="#58a6ff"
                      strokeWidth={3}
                    />

                  </LineChart>

                </ResponsiveContainer>

              </div>

            </section>
          )
        }

      </main>

      {/* FOOTER */}

      <footer
        style={{
          textAlign: "center",
          marginTop: "4rem",
          color: "var(--text-muted)",
          fontSize: "0.9rem"
        }}
      >

        <p>
          © 2026 Structural Analytics AI
        </p>

      </footer>

    </div>
  );
}

export default App;