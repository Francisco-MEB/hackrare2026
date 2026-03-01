import { useState } from "react";
import { theme } from "../../../theme";

export default function DoctorPatientView({ patient, onBack }) {
  const [summaryType, setSummaryType] = useState(null);
  const [generated, setGenerated] = useState(false);

  const generate = (type) => {
    setSummaryType(type);
    setTimeout(() => setGenerated(true), 600);
  };

  return (
    <div>
      <button onClick={onBack} style={{
        background: "none", border: "none", cursor: "pointer", color: theme.textMuted,
        fontSize: "13px", marginBottom: "20px", fontFamily: "inherit",
        display: "flex", alignItems: "center", gap: "6px",
      }}>
        ← Back to patients
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 className="serif" style={{ fontSize: "26px", marginBottom: "4px" }}>{patient.name}</h1>
          <p style={{ color: theme.textMuted, fontSize: "14px" }}>{patient.condition} · {patient.id}</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => generate("bullet")} style={{
            padding: "10px 18px", borderRadius: "10px",
            border: `1.5px solid ${theme.border}`,
            background: summaryType === "bullet" ? theme.accentMuted : "transparent",
            color: summaryType === "bullet" ? theme.accent : theme.textMuted,
            cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
          }}>
            ⚡ Quick Bullets
          </button>
          <button onClick={() => generate("blurb")} style={{
            padding: "10px 18px", borderRadius: "10px",
            background: theme.accent, color: "white", border: "none",
            cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "inherit",
          }}>
            📄 Generate Summary
          </button>
        </div>
      </div>

      {/* Generated summary */}
      {generated && (
        <div style={{
          background: theme.surface, borderRadius: "16px", padding: "24px",
          border: `1.5px solid ${theme.accentLight}`, marginBottom: "24px",
        }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "16px" }}>✦</span>
            <p style={{ fontWeight: 700, fontSize: "14px", color: theme.accent }}>
              AI-Generated {summaryType === "bullet" ? "Brief" : "Summary"}
            </p>
            <span style={{ fontSize: "11px", color: theme.textLight, marginLeft: "auto" }}>
              Based on data through Feb 28, 2026
            </span>
          </div>

          {summaryType === "bullet" ? (
            <ul style={{ paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {[
                "ENS patient with moderate-high symptom burden — pain 6/10, fatigue 6/10 (elevated past 3 days)",
                "Current meds: Gabapentin 300mg TID, Clonazepam 0.5mg PRN, Vitamin D 2000IU, Melatonin 5mg",
                "⚠️ Potential flare detected — breathing scores trending up since Feb 25",
                "No hospitalizations since last visit (Jan 15). Sleep averaging 4.5 hrs/night",
                "Upcoming: MRI Mar 11, ENT consult Mar 18",
                "Patient questions flagged: medication side effects, exercise tolerance",
              ].map((b, i) => (
                <li key={i} style={{ fontSize: "13.5px", color: theme.text, lineHeight: "1.6" }}>{b}</li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: "14px", lineHeight: "1.8", color: theme.text }}>
              Alex Chen, a 34-year-old patient with Empty Nose Syndrome, presents with a moderate-to-high symptom burden
              over the past reporting period. Pain levels have averaged 6/10 over the past week with an upward trend since
              Feb 25, alongside significant fatigue (6/10) and poor sleep (averaging 4.5 hours/night). Breathing scores
              have been notably elevated (7/10), raising concern for a potential approaching flare. Current medication
              regimen includes Gabapentin 300mg TID, Clonazepam 0.5mg PRN, Vitamin D 2000IU, and Melatonin 5mg. No
              emergency escalations or hospitalizations have occurred since the last visit on January 15. Upcoming care
              includes an MRI on March 11 and an ENT consult on March 18.
            </p>
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
        {[
          { label: "Avg Pain (7d)",          val: "6.4", sub: "↑ from 5.1"    },
          { label: "Flare Days (30d)",        val: "8",   sub: "of 28 reported" },
          { label: "Medication Adherence",    val: "87%", sub: "This month"     },
        ].map(s => (
          <div key={s.label} style={{ background: theme.surface, borderRadius: "14px", padding: "18px", border: `1px solid ${theme.border}` }}>
            <p style={{ fontSize: "12px", color: theme.textLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              {s.label}
            </p>
            <p style={{ fontSize: "26px", fontWeight: 700, color: theme.accent }}>{s.val}</p>
            <p style={{ fontSize: "12px", color: theme.textMuted, marginTop: "4px" }}>{s.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
