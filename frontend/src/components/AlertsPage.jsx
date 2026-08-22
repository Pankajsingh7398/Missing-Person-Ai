import React, { useState } from "react";

// Mock alert database
const INITIAL_ALERTS = [
  {
    id: "AL-1092",
    caseId: "1",
    personName: "Sarah Connor",
    severity: "critical",
    message: "High confidence AI match detected near Metro Station entrance.",
    similarity: 0.965,
    timestamp: "Just now",
    camera: "Camera 04 - East Exit",
    resolved: false,
    notes: ""
  },
  {
    id: "AL-1089",
    caseId: "2",
    personName: "John Doe",
    severity: "warning",
    message: "Potential match detected at convenience store checkout.",
    similarity: 0.812,
    timestamp: "12 minutes ago",
    camera: "Camera 09 - Cashier 2",
    resolved: false,
    notes: ""
  },
  {
    id: "AL-1085",
    caseId: "1",
    personName: "Sarah Connor",
    severity: "critical",
    message: "AI face recognition match triggered at central plaza.",
    similarity: 0.942,
    timestamp: "1 hour ago",
    camera: "Camera 12 - Fountain North",
    resolved: false,
    notes: ""
  },
  {
    id: "AL-1077",
    caseId: "3",
    personName: "David Miller",
    severity: "info",
    message: "CCTV analysis flagged potential clothing match (blue jacket, grey cap).",
    similarity: 0.724,
    timestamp: "3 hours ago",
    camera: "Camera 02 - West Wing Escalator",
    resolved: true,
    resolvedAt: "2 hours ago",
    notes: "Investigated by local patrol. False alarm (different jacket brand)."
  },
  {
    id: "AL-1074",
    caseId: "1",
    personName: "Sarah Connor",
    severity: "warning",
    message: "Partial face scan matching profile database near bus depot.",
    similarity: 0.798,
    timestamp: "5 hours ago",
    camera: "Camera 07 - Bus Bay C",
    resolved: false,
    notes: ""
  }
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'active' | 'resolved'
  const [severityFilter, setSeverityFilter] = useState("all"); // 'all' | 'critical' | 'warning' | 'info'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Handler to mark an alert as resolved
  const resolveAlert = (id) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === id
          ? {
              ...alert,
              resolved: true,
              resolvedAt: "Just now",
              notes: resolutionNotes || "Resolved by Operator"
            }
          : alert
      )
    );
    // Update selected alert view
    setSelectedAlert(prev =>
      prev && prev.id === id
        ? {
            ...prev,
            resolved: true,
            resolvedAt: "Just now",
            notes: resolutionNotes || "Resolved by Operator"
          }
        : prev
    );
    setResolutionNotes("");
  };

  // Handler to trigger a simulated new alert
  const triggerSimulatedAlert = () => {
    const randomNames = ["Sarah Connor", "John Doe", "David Miller", "Emma Watson"];
    const randomCameras = ["Camera 01 - Main Lobby", "Camera 15 - Back Alley", "Camera 08 - Parking Lot B", "Camera 11 - South Highway"];
    const severities = ["critical", "warning", "info"];
    
    const name = randomNames[Math.floor(Math.random() * randomNames.length)];
    const camera = randomCameras[Math.floor(Math.random() * randomCameras.length)];
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const similarity = 0.7 + Math.random() * 0.28;
    const caseId = String(Math.floor(Math.random() * 3) + 1);

    const newAlert = {
      id: `AL-${Math.floor(1000 + Math.random() * 9000)}`,
      caseId,
      personName: name,
      severity,
      message: `Simulated real-time AI recognition update for ${name}.`,
      similarity,
      timestamp: "Just now",
      camera,
      resolved: false,
      notes: ""
    };

    setAlerts(prev => [newAlert, ...prev]);
  };

  // Filtering logic
  const filteredAlerts = alerts.filter(alert => {
    // Status tab filter
    if (activeTab === "active" && alert.resolved) return false;
    if (activeTab === "resolved" && !alert.resolved) return false;

    // Severity filter
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;

    // Search query matching
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      return (
        alert.id.toLowerCase().includes(query) ||
        alert.personName.toLowerCase().includes(query) ||
        alert.camera.toLowerCase().includes(query) ||
        alert.message.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <div className="content">
      {/* HEADER SECTION */}
      <section className="control-card" style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div className="card-label">ALERT MONITORING</div>
          <h2 style={{ fontFamily: "Lora, serif", fontSize: "24px" }}>System <em>Intrusion & Matching</em> Alerts</h2>
          <p style={{ color: "var(--text-sage)", fontSize: "14px", marginTop: "4px" }}>
            Real-time notifications generated by the AI facial recognition and surveillance matching engines.
          </p>
        </div>
        <div>
          <button 
            type="button" 
            className="primary-button"
            onClick={triggerSimulatedAlert}
            style={{ padding: "10px 20px" }}
          >
            ⚡ Trigger Mock Alert
          </button>
        </div>
      </section>

      {/* FILTER CONTROLS GRID */}
      <section className="stats-grid" style={{ display: "flex", gap: "12px", flexWrap: "wrap", background: "var(--panel)", padding: "16px 24px", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", alignItems: "center" }}>
        {/* Status Tabs */}
        <div style={{ display: "flex", background: "rgba(11, 30, 20, 0.6)", borderRadius: "var(--radius-pill)", padding: "4px", border: "1px solid var(--border)" }}>
          {["all", "active", "resolved"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 18px",
                borderRadius: "var(--radius-pill)",
                fontSize: "12px",
                fontWeight: "600",
                textTransform: "capitalize",
                background: activeTab === tab ? "var(--accent-lime)" : "transparent",
                color: activeTab === tab ? "var(--text-dark)" : "var(--text-sage)",
                transition: "all 0.2s ease"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Severity filter dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-sage)" }}>Severity:</label>
          <select 
            value={severityFilter} 
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ padding: "6px 14px", fontSize: "12px" }}
          >
            <option value="all">All Levels</option>
            <option value="critical">🔴 Critical Match</option>
            <option value="warning">🟡 Warning Match</option>
            <option value="info">🟢 Informational</option>
          </select>
        </div>

        {/* Search Input */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <input
            type="text"
            placeholder="Search alerts by camera, target, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "6px 18px", fontSize: "12px" }}
          />
        </div>
      </section>

      {/* DUAL WORKSPACE LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: selectedAlert ? "1fr 1fr" : "1fr", gap: "24px", transition: "all 0.3s ease" }} className="responsive-split-grid">
        {/* LIST COLUMN */}
        <div className="analysis-section" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div className="section-header" style={{ marginBottom: "10px" }}>
            <h3 style={{ fontFamily: "Lora, serif", fontSize: "18px", color: "var(--accent-lime)" }}>
              Alert Feed ({filteredAlerts.length})
            </h3>
            <span style={{ fontSize: "11px", color: "var(--text-sage)", fontWeight: "600" }}>
              Active Engine status: <span style={{ color: "var(--green)" }}>● RUNNING</span>
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "600px", overflowY: "auto", paddingRight: "4px" }}>
            {filteredAlerts.length === 0 ? (
              <div className="empty" style={{ padding: "40px 20px" }}>
                <span style={{ fontSize: "32px" }}>🔔</span>
                <strong style={{ display: "block", marginTop: "10px" }}>No alerts match filters</strong>
                <span style={{ fontSize: "12px", color: "var(--text-sage)" }}>Adjust filters or trigger a mock alert above.</span>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isSelected = selectedAlert && selectedAlert.id === alert.id;
                let severityColor = "var(--green)";
                let severityBg = "var(--green-soft)";
                if (alert.severity === "critical") {
                  severityColor = "var(--red)";
                  severityBg = "var(--red-soft)";
                } else if (alert.severity === "warning") {
                  severityColor = "var(--yellow)";
                  severityBg = "var(--yellow-soft)";
                }

                return (
                  <div
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                      padding: "16px 20px",
                      borderRadius: "var(--radius-md)",
                      background: isSelected ? "var(--panel-hover)" : "rgba(23, 61, 42, 0.4)",
                      border: `1px solid ${isSelected ? "var(--accent-lime)" : "var(--border)"}`,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      position: "relative"
                    }}
                  >
                    {/* Header line of alert row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "9px",
                          fontWeight: "800",
                          textTransform: "uppercase",
                          color: severityColor,
                          background: severityBg
                        }}>
                          {alert.severity}
                        </span>
                        <strong style={{ fontSize: "14px" }}>{alert.id}</strong>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{alert.timestamp}</span>
                    </div>

                    {/* Sighting Description */}
                    <div>
                      <p style={{ fontSize: "13px", color: "var(--text-white)", fontWeight: "500", margin: 0 }}>
                        {alert.message}
                      </p>
                      <small style={{ display: "block", marginTop: "4px", color: "var(--text-sage)", fontSize: "11px" }}>
                        📍 {alert.camera} • Confidence: {(alert.similarity * 100).toFixed(1)}%
                      </small>
                    </div>

                    {/* Status footer inside row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-light)", paddingTop: "8px", marginTop: "4px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-sage)" }}>
                        Target: <strong style={{ color: "var(--text-white)" }}>{alert.personName}</strong> (Case #{alert.caseId})
                      </span>
                      {alert.resolved ? (
                        <span style={{ color: "var(--green)", fontSize: "11px", fontWeight: "700" }}>✓ Resolved</span>
                      ) : (
                        <span style={{ color: "var(--yellow)", fontSize: "11px", fontWeight: "700" }}>● Unresolved</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* DETAILS COLUMN */}
        {selectedAlert && (
          <div className="result-section" style={{ display: "flex", flexDirection: "column", gap: "20px", position: "sticky", top: "100px" }}>
            <div className="section-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
              <div>
                <span className="card-label">ALERT INSPECTION</span>
                <h3 style={{ fontFamily: "Lora, serif", fontSize: "20px", margin: 0 }}>
                  Details for <em style={{ fontStyle: "normal", color: "var(--accent-lime)" }}>{selectedAlert.id}</em>
                </h3>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setSelectedAlert(null)}
                style={{ width: "28px", height: "28px", fontSize: "12px" }}
              >
                ✕
              </button>
            </div>

            {/* AI Similarity Gauge */}
            <div style={{ background: "rgba(11, 30, 20, 0.7)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "12px" }}>
                <span style={{ color: "var(--text-sage)" }}>Match Confidence Score</span>
                <strong style={{ color: "var(--accent-lime)" }}>{(selectedAlert.similarity * 100).toFixed(1)}%</strong>
              </div>
              <div style={{ width: "100%", height: "8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                <div style={{
                  width: `${selectedAlert.similarity * 100}%`,
                  height: "100%",
                  background: selectedAlert.severity === "critical" ? "var(--red)" : (selectedAlert.severity === "warning" ? "var(--yellow)" : "var(--green)"),
                  boxShadow: `0 0 8px ${selectedAlert.severity === "critical" ? "var(--red)" : "var(--green)"}`
                }} />
              </div>
            </div>

            {/* Simulated Sighting Image Box */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ position: "relative", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden", background: "#08170f" }}>
                <div style={{ padding: "6px", fontSize: "10px", background: "rgba(0,0,0,0.6)", position: "absolute", top: 0, left: 0, zIndex: 2 }}>DATABASE PROFILE</div>
                <div style={{ height: "140px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>👤</div>
              </div>
              <div style={{ position: "relative", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden", background: "#08170f" }}>
                <div style={{ padding: "6px", fontSize: "10px", background: "rgba(0,0,0,0.6)", position: "absolute", top: 0, left: 0, zIndex: 2 }}>CCTV SCAN MATCH</div>
                <div style={{ height: "140px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", color: "var(--accent-lime)" }}>📷</div>
              </div>
            </div>

            {/* Alert metadata detail list */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ display: "block", fontSize: "10px", color: "var(--text-sage)", fontWeight: "700" }}>MISSING PERSON TARGET</span>
                <strong>{selectedAlert.personName}</strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "10px", color: "var(--text-sage)", fontWeight: "700" }}>CASE FILE LINK</span>
                <span style={{ color: "var(--accent-lime)" }}>Case #{selectedAlert.caseId}</span>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "10px", color: "var(--text-sage)", fontWeight: "700" }}>SIGHTING LOCATION</span>
                <strong>{selectedAlert.camera}</strong>
              </div>
              <div>
                <span style={{ display: "block", fontSize: "10px", color: "var(--text-sage)", fontWeight: "700" }}>OCCURRENCE TIME</span>
                <strong>{selectedAlert.timestamp}</strong>
              </div>
            </div>

            {/* Resolution Block */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "10px" }}>
              {selectedAlert.resolved ? (
                <div style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid var(--green)", padding: "16px", borderRadius: "var(--radius-md)", fontSize: "13px" }}>
                  <span style={{ color: "var(--green)", fontWeight: "800", display: "block", marginBottom: "4px" }}>✓ Case Sighting Resolved</span>
                  <p style={{ color: "var(--text-sage)", margin: 0 }}><strong>Action notes:</strong> {selectedAlert.notes}</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-sage)" }}>RESOLVE ACTION LOGS</span>
                  <textarea
                    placeholder="Enter investigative feedback or notes (e.g., patrol dispatched, false match details)..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    style={{ width: "100%", height: "70px", background: "rgba(11,30,20,0.8)", border: "1px solid var(--border)", color: "#fff", fontSize: "12px", resize: "none", padding: "8px 12px" }}
                  />
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => resolveAlert(selectedAlert.id)}
                      style={{ flex: 1, padding: "8px" }}
                    >
                      Resolve Sighting
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => resolveAlert(selectedAlert.id)}
                      style={{ padding: "8px 12px" }}
                    >
                      False Alarm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
