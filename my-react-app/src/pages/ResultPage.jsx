import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const resolveUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) {
    try {
      const path = new URL(url).pathname;
      return `${API_BASE}${path}?t=${new Date().getTime()}`;
    } catch (e) {
      return url;
    }
  }
  return url;
};

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state;
  const [copied, setCopied] = useState(false);

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

  const getSeverityConfig = (sev) => {
    switch (sev) {
      case "LOW":
        return { class: "low", color: "#10b981", bg: "var(--success-bg)", label: "Low Severity" };
      case "MODERATE":
        return { class: "moderate", color: "#f59e0b", bg: "var(--warning-bg)", label: "Moderate Severity" };
      case "HIGH":
      default:
        return { class: "high", color: "#ef4444", bg: "var(--danger-bg)", label: "High Severity" };
    }
  };

  const severityConfig = getSeverityConfig(data.severity);

  const handleCopyReport = () => {
    navigator.clipboard.writeText(data.report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <span>🔍</span> Crackx
        </div>
        <button className="secondary" onClick={() => navigate("/")} style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem" }}>
          ← Back to Dashboard
        </button>
      </nav>

      <main>
        {/* HEADER SUMMARY */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Crackx Inspection Report
              </span>
              <span className={`status-badge ${data.severity.toLowerCase()}`} style={{ fontSize: "0.65rem", padding: "0.1rem 0.5rem" }}>
                {data.structure.toUpperCase()}
              </span>
            </div>
            <h2 style={{ fontSize: "2rem", margin: "0.35rem 0 0" }}>
              {data.fileName || "inspection_scan.jpg"}
            </h2>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Analyzed on {data.timestamp || new Date().toLocaleString()}
            </div>
          </div>
          <div className="actions-bar" style={{ display: "flex", gap: "1rem" }}>
            <a 
              href={resolveUrl(data.pdf_url)} 
              target="_blank" 
              rel="noreferrer"
              className="btn"
              style={{ textDecoration: "none" }}
            >
              📥 Download Server PDF
            </a>
          </div>
        </div>

        {/* 4-COLUMN STATS PANEL */}
        <div className="stats-grid" style={{ marginBottom: "2.5rem" }}>
          <div className="glass-card" style={{ borderLeft: `4px solid var(--primary)` }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>
              Peak Crack Width
            </span>
            <h2 style={{ fontSize: "2rem", color: "var(--primary)", margin: "0.5rem 0 0" }}>
              {data.largest_crack.toFixed(3)} <span style={{ fontSize: "1.1rem" }}>mm</span>
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Maximum identified width
            </div>
          </div>

          <div className="glass-card" style={{ borderLeft: `4px solid #9333ea` }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>
              Average Crack Width
            </span>
            <h2 style={{ fontSize: "2rem", color: "#b566ff", margin: "0.5rem 0 0" }}>
              {data.average_crack_width.toFixed(3)} <span style={{ fontSize: "1.1rem" }}>mm</span>
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Average anomalous sizing
            </div>
          </div>

          <div className="glass-card" style={{ borderLeft: `4px solid var(--warning)` }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>
              Surface Damage Ratio
            </span>
            <h2 style={{ fontSize: "2rem", color: "var(--warning)", margin: "0.5rem 0 0" }}>
              {data.damage_percentage.toFixed(3)} <span style={{ fontSize: "1.1rem" }}>%</span>
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Anomalous crack surface area
            </div>
          </div>

          <div className="glass-card" style={{ borderLeft: `4px solid ${severityConfig.color}` }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>
              Anomalies Detected
            </span>
            <h2 style={{ fontSize: "2rem", color: severityConfig.color, margin: "0.5rem 0 0" }}>
              {data.total_cracks} <span style={{ fontSize: "1.1rem" }}>Cracks</span>
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Counted YOLOv8 cracks
            </div>
          </div>
        </div>

        {/* RESULTS GRID - DUAL SCAN VISUALIZERS */}
        <div className="results-grid" style={{ marginBottom: "2.5rem" }}>
          {/* DETECTION VISUALIZER */}
          <div className="glass-card scanner-overlay" style={{ display: "flex", flexDirection: "column" }}>
            <div className="scanner-line"></div>
            <h3 style={{ marginBottom: "1rem", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>YOLOv8 Detection Overlay</span>
              <span style={{ fontSize: "0.75rem", color: "var(--primary)", background: "rgba(0, 210, 255, 0.08)", padding: "0.25rem 0.5rem", borderRadius: "6px" }}>
                Active Bounds
              </span>
            </h3>
            <div className="image-box" style={{ flex: 1, justifyContent: "center" }}>
              <img
                src={resolveUrl(data.result_image)}
                alt="YOLO Crack Bounding Box"
                style={{ width: "100%", maxHeight: "380px", objectFit: "contain" }}
              />
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem" }}>
              Annotated boxes highlight crack locations and surface anomalies.
            </div>
          </div>

          {/* STRESS DENSITY HEATMAP */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ marginBottom: "1rem", color: "#ffffff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Localized Stress Density Heatmap</span>
              <span style={{ fontSize: "0.75rem", color: "#b566ff", background: "rgba(181, 102, 255, 0.08)", padding: "0.25rem 0.5rem", borderRadius: "6px" }}>
                JET Colormap
              </span>
            </h3>
            <div className="image-box" style={{ flex: 1, justifyContent: "center" }}>
              <img
                src={resolveUrl(data.heatmap)}
                alt="Stress Heatmap colormap jet"
                style={{ width: "100%", maxHeight: "380px", objectFit: "contain" }}
              />
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem" }}>
              Thermal mapping illustrates structural surface strain density and risk concentration.
            </div>
          </div>
        </div>

        {/* DOUBLE-CARD ANALYTICAL ROW */}
        <div className="results-grid" style={{ marginBottom: "2.5rem" }}>
          {/* RISK ASSESSMENT */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h3 style={{ marginBottom: "0.5rem" }}>AI Structural Risk Assessment</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
                Inspection scoring based on {data.structure} parameters
              </p>
            </div>

            {/* Risk bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: "600" }}>
                <span>Risk Index</span>
                <span style={{ color: severityConfig.color }}>{data.risk_score} / 100 ({severityConfig.label})</span>
              </div>
              <div className="progress-bar-container">
                <div 
                  className={`progress-bar ${severityConfig.class}`} 
                  style={{ width: `${data.risk_score}%` }}
                ></div>
              </div>
            </div>

            {/* Severity Pill Counts */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "10px", padding: "1rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600", display: "block", marginBottom: "0.75rem" }}>
                YOLO Severity Anomalies Breakdown
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                <span style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: "20px", padding: "0.25rem 0.75rem", fontSize: "0.8rem", color: "var(--success)", fontWeight: "600" }}>
                  🟢 Low: {data.severity_counts.low}
                </span>
                <span style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.15)", borderRadius: "20px", padding: "0.25rem 0.75rem", fontSize: "0.8rem", color: "var(--warning)", fontWeight: "600" }}>
                  🟡 Moderate: {data.severity_counts.moderate}
                </span>
                <span style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)", borderRadius: "20px", padding: "0.25rem 0.75rem", fontSize: "0.8rem", color: "var(--danger)", fontWeight: "600" }}>
                  🔴 Severe: {data.severity_counts.severe}
                </span>
              </div>
            </div>

            {/* AI Recommendation */}
            <div style={{ borderLeft: `4px solid ${severityConfig.color}`, background: severityConfig.bg, padding: "1rem", borderRadius: "0 8px 8px 0" }}>
              <span style={{ fontSize: "0.75rem", color: severityConfig.color, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "0.25rem" }}>
                Recommendation
              </span>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text)", lineHeight: "1.5" }}>
                {data.recommendation}
              </p>
            </div>
          </div>

          {/* LSTM GROWTH CHART */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ marginBottom: "0.5rem" }}>LSTM Crack Growth Prediction</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
              Forecasted crack propagation cycles mapping peak anomaly values
            </p>
            <div className="image-box" style={{ flex: 1, justifyContent: "center" }}>
              <img
                src={resolveUrl(data.chart)}
                alt="LSTM Prediction chart"
                style={{ width: "100%", maxHeight: "300px", objectFit: "contain" }}
              />
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem", textAlign: "center" }}>
              LSTM modeling projects critical crack width expanding to {data.prediction.toFixed(2)} mm.
            </div>
          </div>
        </div>

        {/* TERMINAL TEXT REPORT CARD */}
        <section className="glass-card" style={{ marginBottom: "2rem", padding: 0, overflow: "hidden" }}>
          <div className="report-block-header">
            <span>💻 CRACK_ANALYSIS_AI_REPORT_SHELL</span>
            <button 
              className="secondary" 
              onClick={handleCopyReport}
              style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem", borderRadius: "6px", minWidth: "100px" }}
            >
              {copied ? "copied! ✓" : "Copy Report"}
            </button>
          </div>
          <div className="report-block">
            {data.report}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="no-print" style={{ textAlign: "center", marginTop: "4rem", color: "var(--text-muted)", fontSize: "0.8rem", padding: "1.5rem 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <p>© 2026 Crackx. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default ResultPage;