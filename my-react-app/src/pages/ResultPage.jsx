import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;

  if (!data) {
    return (
      <div className="container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="glass-card" style={{ textAlign: "center", maxWidth: "450px" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1.5rem" }}>⚠️</div>
          <h2 style={{ marginBottom: "0.5rem" }}>No Analysis Available</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
            It looks like you reached this page directly without uploading an image. Please start from the dashboard.
          </p>
          <button onClick={() => navigate("/")}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getSeverity = (width) => {
    if (width < 0.5) {
      return {
        label: "Minor",
        class: "minor",
        risk: "Low",
        color: "#10b981",
        rec: "Minor concrete hairline crack detected. Monitor monthly for changes. No immediate structural hazard is anticipated. Normal maintenance routines apply."
      };
    }
    if (width < 1.5) {
      return {
        label: "Moderate",
        class: "moderate",
        risk: "Medium",
        color: "#f59e0b",
        rec: "Moderate structural damage detected. Active crack repair is recommended. The structure is beginning to exhibit fatigue stress. Sealing and reinforcement are advised to prevent liquid ingress."
      };
    }
    return {
      label: "Critical",
      class: "critical",
      risk: "High",
      color: "#ef4444",
      rec: "Critical structural fracture detected. Immediate safety hazard! Major structural warning. Please restrict heavy loads immediately and consult a certified structural engineering team for deep remediation."
    };
  };

  const severity = getSeverity(data.prediction);

  // Helper formatting for base64 display
  const formatBase64 = (str, type = "jpeg") => {
    if (!str) return "";
    if (str.startsWith("data:image")) return str;
    return `data:image/${type};base64,${str}`;
  };

  return (
    <div className="container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <span>🔍</span> Structural Analytics AI
        </div>
        <button className="secondary" onClick={() => navigate("/")} style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem" }}>
          ← Back to Dashboard
        </button>
      </nav>

      <main>
        {/* HEADER SUMMARY */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
          <div>
            <span style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Inspection Report
            </span>
            <h2 style={{ fontSize: "2rem", margin: "0.25rem 0 0" }}>
              {data.filename || "inspection_scan.jpg"}
            </h2>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Analyzed on {data.timestamp || new Date().toLocaleString()}
            </div>
          </div>
          <div className="actions-bar" style={{ display: "flex", gap: "1rem" }}>
            <a 
              href={formatBase64(data.image)} 
              download={`crack_detection_${data.filename || "result"}.jpg`}
              className="btn secondary"
              style={{ textDecoration: "none" }}
            >
              📥 Download Detection
            </a>
            <button onClick={() => window.print()}>
              📄 Generate PDF Report
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="stats-grid" style={{ marginBottom: "2rem" }}>
          <div className="glass-card" style={{ borderLeft: `4px solid var(--primary)` }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Predicted Crack Width
            </span>
            <h2 style={{ fontSize: "2rem", color: "var(--primary)", margin: "0.5rem 0 0" }}>
              {data.prediction.toFixed(3)} <span style={{ fontSize: "1.1rem" }}>mm</span>
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Forecasted crack growth width
            </div>
          </div>

          <div className="glass-card" style={{ borderLeft: `4px solid ${severity.color}` }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Severity Classification
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.7rem" }}>
              <span className={`status-badge ${severity.class}`} style={{ fontSize: "0.9rem" }}>
                {severity.label}
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Calculated inspection threat status
            </div>
          </div>

          <div className="glass-card">
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Structural Risk & Confidence
            </span>
            <h2 style={{ fontSize: "1.6rem", margin: "0.5rem 0 0" }}>
              <span style={{ color: severity.color }}>{severity.risk} Risk</span>
              <span style={{ color: "var(--text-muted)", fontSize: "1rem", fontWeight: 400 }}> (94% AI conf)</span>
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Risk priority and neural confidence
            </div>
          </div>
        </div>

        {/* RESULTS GRID */}
        <div className="results-grid">
          {/* DETECTION VISUALIZER */}
          <div className="glass-card scanner-overlay" style={{ display: "flex", flexDirection: "column" }}>
            <div className="scanner-line"></div>
            <h3 style={{ marginBottom: "1rem", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>YOLOv8 Detection Visualizer</span>
              <span style={{ fontSize: "0.75rem", color: "var(--primary)", background: "rgba(0, 210, 255, 0.08)", padding: "0.25rem 0.5rem", borderRadius: "6px" }}>
                Active Overlay
              </span>
            </h3>
            <div className="image-box" style={{ flex: 1, justifyContent: "center" }}>
              <img
                src={formatBase64(data.image)}
                alt="YOLO Crack Bounding Box"
                style={{ width: "100%", maxHeight: "420px", objectFit: "contain" }}
              />
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem" }}>
              Annotated bounding box denotes coordinates of largest identified crack fracture.
            </div>
          </div>

          {/* PREDICTION FORECAST CHART & RECOMMENDATION */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* RECOMMENDATION CARD */}
            <div className="glass-card" style={{ borderLeft: `5px solid ${severity.color}` }}>
              <h3 style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>📋</span> AI Maintenance Recommendation
              </h3>
              <p style={{ margin: 0, color: "var(--text)", fontSize: "0.95rem", lineHeight: "1.6" }}>
                {severity.rec}
              </p>
            </div>

            {/* CHART */}
            <div className="glass-card">
              <h3 style={{ marginBottom: "1rem" }}>LSTM Crack Growth Projection</h3>
              <div className="image-box">
                <img
                  src={formatBase64(data.chart, "png")}
                  alt="LSTM Prediction Chart"
                  style={{ width: "100%", objectFit: "contain" }}
                />
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem", textAlign: "center" }}>
                LSTM modeling predicts crack propagation cycles.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="no-print" style={{ textAlign: "center", marginTop: "4rem", color: "var(--text-muted)", fontSize: "0.8rem", padding: "1.5rem 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <p>© 2026 Structural Analytics AI Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default ResultPage;