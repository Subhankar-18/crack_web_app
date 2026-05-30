import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function UploadPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedHistory = JSON.parse(
      localStorage.getItem("crack_history") || "[]"
    );
    setHistory(savedHistory);
  }, []);

  const getSeverity = (width) => {
    if (width < 0.5) {
      return { label: "Minor", color: "#10b981" }; // Emerald green
    }
    if (width < 1.5) {
      return { label: "Moderate", color: "#f59e0b" }; // Amber warning
    }
    return { label: "Critical", color: "#ef4444" }; // Red danger
  };

  const processUpload = async (file) => {
    if (!file) return;
    setLoading(true);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await axios.post("http://127.0.0.1:5000/upload", formData);
      
      const newResult = {
        image: res.data.image, // Raw base64 string
        prediction: res.data.prediction,
        chart: res.data.chart, // Raw base64 string
        timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fileName: file.name
      };

      // Add to session history
      const updatedHistory = [newResult, ...history].slice(0, 5);
      setHistory(updatedHistory);
      localStorage.setItem("crack_history", JSON.stringify(updatedHistory));

      // Navigate to detailed result
      navigate("/result", {
        state: {
          image: res.data.image,
          prediction: res.data.prediction,
          chart: res.data.chart,
          filename: file.name,
          timestamp: newResult.timestamp
        }
      });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to analyze image. Please ensure the backend Flask server is running on http://127.0.0.1:5000");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      processUpload(file);
    } else {
      alert("Please upload a valid image file.");
    }
  };

  // Helper formatting for base64 display
  const formatBase64 = (str, type = "jpeg") => {
    if (!str) return "";
    if (str.startsWith("data:image")) return str;
    return `data:image/${type};base64,${str}`;
  };

  // Compute Dashboard Statistics
  const totalScans = history.length;
  const criticalScans = history.filter(
    (item) => getSeverity(item.prediction).label === "Critical"
  ).length;
  
  const averageWidth = history.length
    ? (history.reduce((sum, item) => sum + item.prediction, 0) / history.length).toFixed(2)
    : "0.00";

  return (
    <div className="container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <span>🔍</span> Structural Analytics AI
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
          Dashboard v1.2
        </div>
      </nav>

      <main>
        {/* DASHBOARD STATS */}
        <div className="stats-grid">
          <div className="glass-card">
            <h4>Total Scans</h4>
            <h2 style={{ fontSize: "2.2rem", margin: "0.5rem 0 0", color: "var(--primary)" }}>
              {totalScans}
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Active scans in current session
            </div>
          </div>

          <div className="glass-card">
            <h4>Critical Threats</h4>
            <h2 style={{ fontSize: "2.2rem", margin: "0.5rem 0 0", color: criticalScans > 0 ? "var(--danger)" : "var(--text)" }}>
              {criticalScans}
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Widths exceeding threshold (&gt; 1.5mm)
            </div>
          </div>

          <div className="glass-card">
            <h4>Average Width</h4>
            <h2 style={{ fontSize: "2.2rem", margin: "0.5rem 0 0", color: "var(--success)" }}>
              {averageWidth} <span style={{ fontSize: "1.1rem", fontWeight: 500 }}>mm</span>
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Overall structural severity average
            </div>
          </div>
        </div>

        {/* UPLOAD & ANALYSIS ZONE */}
        <section className="glass-card" style={{ marginBottom: "3rem", padding: "2.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
              AI-Powered Crack Analyzer
            </h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "550px", margin: "0 auto", fontSize: "0.95rem" }}>
              Upload high-resolution images of concrete or masonry cracks. Our dual YOLOv8 & LSTM network will instantly detect, analyze, and forecast growth.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <div className="loading-spinner"></div>
              <h3 style={{ color: "var(--primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>
                Running AI Inspection...
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Detecting crack coordinates and computing growth trends using LSTM predictive logic.
              </p>
            </div>
          ) : (
            <div
              className={`upload-area ${isDragOver ? "dragover" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              style={{
                borderColor: isDragOver ? "var(--primary)" : "",
                background: isDragOver ? "rgba(0, 210, 255, 0.05)" : ""
              }}
            >
              <div className="upload-icon-container">
                📥
              </div>
              <h3 style={{ marginBottom: "0.5rem" }}>
                Drag & drop your file here, or <span style={{ color: "var(--primary)" }}>browse</span>
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                Supports JPG, PNG, and JPEG formats (Max 10MB)
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
        </section>

        {/* HISTORY & TRENDS */}
        {history.length > 0 && !loading && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "2rem", marginBottom: "2rem" }}>
            
            {/* SESSION SCANS LIST */}
            <section className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
              <h3 style={{ marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.75rem" }}>
                Recent Session Scans
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", flex: 1, overflowY: "auto", maxHeight: "350px" }}>
                {history.map((item, index) => {
                  const severity = getSeverity(item.prediction);
                  return (
                    <div
                      key={index}
                      onClick={() => navigate("/result", {
                        state: {
                          image: item.image,
                          prediction: item.prediction,
                          chart: item.chart,
                          filename: item.fileName,
                          timestamp: item.timestamp
                        }
                      })}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                        padding: "0.75rem",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      className="history-item-hover"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(4px)";
                        e.currentTarget.style.borderColor = "rgba(0, 210, 255, 0.15)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                      }}
                    >
                      <img
                        src={formatBase64(item.image)}
                        alt="crack preview"
                        style={{
                          height: "60px",
                          width: "60px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid rgba(255,255,255,0.08)"
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {item.fileName}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                          {item.timestamp}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--primary)" }}>
                          {item.prediction.toFixed(2)} mm
                        </div>
                        <span className={`status-badge ${severity.label.toLowerCase()}`} style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", marginTop: "0.25rem" }}>
                          {severity.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* TRENDS CHART */}
            <section className="glass-card">
              <h3 style={{ marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "0.75rem" }}>
                Crack Growth Trend
              </h3>
              <div className="chart-container-card" style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...history].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(10, 15, 26, 0.9)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        color: "var(--text)",
                        fontSize: "0.8rem"
                      }}
                      labelStyle={{ color: "var(--primary)" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="prediction"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 4, stroke: "var(--bg)", strokeWidth: 1 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem", textAlign: "center" }}>
                Chronological chart showing predicted crack sizes (in mm)
              </div>
            </section>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", marginTop: "4rem", color: "var(--text-muted)", fontSize: "0.8rem", padding: "1.5rem 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <p>© 2026 Structural Analytics AI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default UploadPage;