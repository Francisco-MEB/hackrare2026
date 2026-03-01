import { useState, useEffect } from "react";
import { theme } from "../../../theme";
import { getPatients } from "../../../api";

export default function DoctorDashboard({ onSelectPatient }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPatients()
      .then(setPatients)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "40vh" }}>
        <p style={{ color: theme.textMuted }}>Loading patients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="serif" style={{ fontSize: "26px", marginBottom: "6px" }}>Patient Panel</h1>
        <p style={{ color: theme.danger, fontSize: "14px" }}>Failed to load patients: {error}</p>
        <p style={{ color: theme.textMuted, fontSize: "13px", marginTop: "8px" }}>
          Ensure the API is running: <code>uvicorn api:app --reload</code>
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="serif" style={{ fontSize: "26px", marginBottom: "6px" }}>Patient Panel</h1>
      <p style={{ color: theme.textMuted, fontSize: "14px", marginBottom: "28px" }}>
        Select a patient to view their profile and generate a summary
      </p>

      {patients.length === 0 ? (
        <p style={{ color: theme.textMuted }}>No patients found.</p>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        {patients.map(p => (
          <div
            key={p.id}
            onClick={() => onSelectPatient(p)}
            style={{
              background: theme.surface, borderRadius: "16px", padding: "20px",
              border: `1.5px solid ${p.alert ? theme.accentLight : theme.border}`,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%",
                  background: theme.accentMuted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
                }}>◎</div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "15px" }}>{p.name}</p>
                  <p style={{ fontSize: "12px", color: theme.textLight }}>{p.id?.slice(0, 8) || p.id}</p>
                </div>
              </div>
              {p.alert && (
                <span style={{ fontSize: "11px", background: "#FFF0E0", color: theme.accent, padding: "4px 8px", borderRadius: "20px", fontWeight: 600 }}>
                  ⚡ Alert
                </span>
              )}
            </div>
            <p style={{ fontSize: "13px", color: theme.text, marginBottom: "8px" }}>{p.condition}</p>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: theme.textMuted }}>Last visit: {p.lastVisit}</span>
              <span style={{
                fontSize: "12px", fontWeight: 600,
                color: p.severity === "High" ? theme.danger : p.severity.includes("Moderate") ? theme.warning : theme.success,
              }}>
                {p.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
