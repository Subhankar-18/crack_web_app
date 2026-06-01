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

function UploadPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [structure, setStructure] = useState("building");
  const [noCrackWarning, setNoCrackWarning] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedHistory = JSON.parse(
      localStorage.getItem("crack_history_v2") || "[]"
    );
    setHistory(savedHistory);
  }, []);

  const processUpload = async (file) => {
    if (!file) return;
    setLoading(true);
    setNoCrackWarning("");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("structure", structure);

    try {
      const res = await axios.post(`${API_BASE}/analyze`, formData);
      
      // Handle No Crack Detected Case
      if (res.data.message && res.data.message === "No crack detected") {
        setNoCrackWarning(`Structure is Safe: YOLOv8 detected no structural crack anomalies for this ${structure}!`);
        setLoading(false);
        return;
      }

      const newResult = {
        result_image: res.data.result_image,
        chart: res.data.chart,
        heatmap: res.data.heatmap,
        structure: res.data.structure,
        total_cracks: res.data.total_cracks,
        largest_crack: res.data.largest_crack,
        average_crack_width: res.data.average_crack_width,
        damage_percentage: res.data.damage_percentage,
        severity: res.data.severity,
        risk_score: res.data.risk_score,
        recommendation: res.data.recommendation,
        prediction: res.data.prediction,
        severity_counts: res.data.severity_counts,
        report: res.data.report,
        pdf_url: res.data.pdf_url,
        timestamp: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fileName: file.name
      };

      // Add to session history
      const updatedHistory = [newResult, ...history].slice(0, 5);
      setHistory(updatedHistory);
      localStorage.setItem("crack_history_v2", JSON.stringify(updatedHistory));

      // Navigate to detailed result
      navigate("/result", { state: newResult });
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Failed to analyze image. Please ensure the backend Flask server is running on ${API_BASE}`);
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

  // Compute Dashboard Statistics from history v2
  const totalScans = history.length;
  const highRiskScans = history.filter(
    (item) => item.severity === "HIGH"
  ).length;
  
  const averageWidth = history.length
    ? (history.reduce((sum, item) => sum + item.largest_crack, 0) / history.length).toFixed(2)
    : "0.00";

  return (
    <div className="container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <span>🔍</span> Crackx
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
            <h4>Severe Threat Alerts</h4>
            <h2 style={{ fontSize: "2.2rem", margin: "0.5rem 0 0", color: highRiskScans > 0 ? "var(--danger)" : "var(--text)" }}>
              {highRiskScans}
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Structural inspections classified as HIGH severity
            </div>
          </div>

          <div className="glass-card">
            <h4>Avg Largest Crack</h4>
            <h2 style={{ fontSize: "2.2rem", margin: "0.5rem 0 0", color: "var(--success)" }}>
              {averageWidth} <span style={{ fontSize: "1.1rem", fontWeight: 500 }}>mm</span>
            </h2>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              Session average of peak anomalies
            </div>
          </div>
        </div>

        {/* UPLOAD & ANALYSIS ZONE */}
        <section className="glass-card" style={{ marginBottom: "3rem", padding: "2.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
              Crackx Analyzer
            </h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "550px", margin: "0 auto 1.5rem", fontSize: "0.95rem" }}>
              Inspect bridges, pillars, building structures, roads, and dams. YOLOv8 detects crack bounds, generates colormapped stress heatmaps, and forecasts growth.
            </p>
            
            {/* STRUCTURE SELECTOR */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-muted)" }}>
                SELECT STRUCTURE TYPE:
              </span>
              <select 
                className="structure-select"
                value={structure}
                onChange={(e) => setStructure(e.target.value)}
              >
                <option value="building">🏢 Building</option>
                <option value="bridge">🌉 Bridge</option>
                <option value="pillar">🏛️ Pillar / Column</option>
                <option value="road">🛣️ Road / Asphalt</option>
                <option value="dam">🌊 Hydroelectric Dam</option>
              </select>
            </div>
          </div>

          {/* NO CRACK NOTIFICATION */}
          {noCrackWarning && (
            <div className="glass-card" style={{ background: "rgba(16, 185, 129, 0.08)", borderColor: "var(--success)", margin: "0 auto 2rem", maxWidth: "600px", padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ fontSize: "1.8rem" }}>🛡️</div>
              <div style={{ textAlign: "left" }}>
                <h4 style={{ color: "var(--success)", margin: 0, fontSize: "0.95rem" }}>Inspection Result</h4>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text)" }}>{noCrackWarning}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <div className="loading-spinner"></div>
              <h3 style={{ color: "var(--primary)", marginTop: "1.5rem", marginBottom: "0.5rem" }}>
                Conducting AI Micro-Inspection...
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Detecting coordinates, generating color gradient heatmaps, and computing future growth curve.
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
                  return (
                    <div
                      key={index}
                      onClick={() => navigate("/result", { state: item })}
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
                        src={resolveUrl(item.result_image)}
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
                          {item.structure.toUpperCase()} • {item.timestamp}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--primary)" }}>
                          {item.largest_crack.toFixed(2)} mm
                        </div>
                        <span className={`status-badge ${item.severity.toLowerCase()}`} style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", marginTop: "0.25rem" }}>
                          {item.severity}
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
                Session Crack Size Trend
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
                      dataKey="largest_crack"
                      name="Max Crack Width"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      dot={{ r: 4, stroke: "var(--bg)", strokeWidth: 1 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem", textAlign: "center" }}>
                Chronological chart showing peak detected crack sizes (in mm)
              </div>
            </section>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ textAlign: "center", marginTop: "4rem", color: "var(--text-muted)", fontSize: "0.8rem", padding: "1.5rem 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <p>© 2026 Crackx. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default UploadPage;