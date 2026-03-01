import { useState, useEffect } from "react";
import { theme } from "../../../theme";
import { getPatientDashboard, postMedicationAdherence } from "../../../api";

const toDisplayTime = (freq) => {
  if (!freq) return "—";
  const f = (freq || "").toLowerCase();
  if (f.includes("morning") || f.includes("am") || f.includes("once")) return "Morning";
  if (f.includes("evening") || f.includes("pm") || f.includes("night")) return "Evening";
  if (f.includes("twice")) return "AM / PM";
  return freq;
};

export default function PatientDashboard({ patient, onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [togglingMed, setTogglingMed] = useState(null);

  const refetch = () => {
    if (patient?.id) getPatientDashboard(patient.id).then(setDashboard);
  };

  useEffect(() => {
    if (!patient?.id) return setLoading(false);
    setLoading(true);
    getPatientDashboard(patient.id)
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, [patient?.id]);

  const firstName = (patient?.name || dashboard?.patient?.name || "there").split(" ")[0];
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const symptomLogs = dashboard?.history?.symptom_logs || [];
  const hasLoggedToday = symptomLogs.some((sl) => {
    const d = (sl.logged_at || "").slice(0, 10);
    return d === todayKey;
  });

  const trend = dashboard?.symptom_severity_trend || [];
  const last3 = trend.slice(-3);
  const showFlare = last3.length >= 3 && last3.every((p) => (p.severity || 0) >= 5);

  const medications = dashboard?.history?.medications || [];
  const adherence = dashboard?.history?.adherence || [];
  const takenById = {};
  adherence.filter((a) => (a.logged_date || "").slice(0, 10) === todayKey).forEach((a) => {
    const mid = a.medication_id;
    const medName = a.medications?.name;
    if (mid) takenById[mid] = !!a.taken;
    if (medName && !mid) takenById[medName] = !!a.taken;
  });
  const meds = medications.map((m) => ({
    id: m.id,
    name: `${m.name} ${m.dosage || ""}`.trim(),
    time: toDisplayTime(m.frequency),
    done: takenById[m.id] ?? takenById[m.name] ?? false,
  }));

  const appointments = dashboard?.history?.appointments || [];
  const calendar = dashboard?.history?.calendar || [];
  const upcoming = [
    ...appointments.map((a) => {
      const d = (a.scheduled_at || "").slice(0, 10);
      const dt = d ? new Date(d) : null;
      return {
        date: dt ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—",
        label: [a.physician, a.visit_type].filter(Boolean).join(" — ") || "Appointment",
        _ts: dt ? dt.getTime() : 0,
      };
    }),
    ...calendar.map((ev) => {
      const d = (ev.event_at || "").slice(0, 10);
      const dt = d ? new Date(d) : null;
      return {
        date: dt ? dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—",
        label: ev.title || ev.event_type || "Event",
        _ts: dt ? dt.getTime() : 0,
      };
    }),
  ]
    .filter((u) => u.date !== "—" && u._ts >= now.getTime())
    .sort((a, b) => a._ts - b._ts)
    .slice(0, 5);

  if (loading && !dashboard) {
    return (
      <div style={{ padding: "40px 0", color: theme.textMuted }}>
        Loading your dashboard…
      </div>
    );
  }

  return (
    <div>
      <h1 className="serif" style={{ fontSize: "clamp(20px, 2.2vw, 32px)", marginBottom: "clamp(4px, 0.5vh, 8px)" }}>
        Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"}, {firstName}
      </h1>
      <p style={{ color: theme.textMuted, fontSize: "clamp(12px, 1.1vw, 16px)", marginBottom: "clamp(18px, 2.5vh, 36px)" }}>
        {dateStr} · Here's your overview for today
      </p>

      {/* Symptom log CTA — only show if not logged today */}
      {!hasLoggedToday && (
      <div
        onClick={() => onNavigate("symptoms")}
        style={{
          background: theme.accent, borderRadius: "clamp(10px, 1vw, 16px)",
          padding: "clamp(16px, 2vh, 24px) clamp(18px, 2vw, 28px)",
          marginBottom: "clamp(16px, 2vh, 28px)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", boxShadow: `0 6px 28px rgba(232,130,74,0.35)`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 1.2vw, 18px)" }}>
          <span style={{ fontSize: "clamp(22px, 2.2vw, 32px)", filter: "grayscale(1)" }}>📋</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: "clamp(14px, 1.4vw, 20px)", color: "white", marginBottom: "2px" }}>
              Haven't logged your symptoms today?
            </p>
            <p style={{ fontSize: "clamp(11px, 1vw, 15px)", color: "rgba(255,255,255,0.8)" }}>
              Daily logging is the most important thing you can do — your care team depends on it.
            </p>
          </div>
        </div>
        <div style={{
          background: "white", color: theme.accent,
          fontWeight: 700, fontSize: "clamp(12px, 1.1vw, 16px)",
          padding: "clamp(8px, 1vh, 12px) clamp(16px, 1.6vw, 22px)",
          borderRadius: "clamp(8px, 0.8vw, 12px)", flexShrink: 0, whiteSpace: "nowrap",
        }}>
          Log Now →
        </div>
      </div>
      )}

      {/* Flare alert — only show if elevated for 3+ consecutive days */}
      {showFlare && (
      <div style={{
        background: "#FFF4EC", border: `1px solid ${theme.accentLight}`,
        borderRadius: "clamp(10px, 1vw, 16px)",
        padding: "clamp(12px, 1.4vh, 18px) clamp(14px, 1.5vw, 22px)",
        marginBottom: "clamp(16px, 2vh, 28px)", display: "flex", alignItems: "center",
        gap: "clamp(10px, 1vw, 16px)",
      }}>
        <span style={{ fontSize: "clamp(16px, 1.5vw, 22px)" }}>⚠️</span>
        <div>
          <p style={{ fontWeight: 600, fontSize: "clamp(12px, 1.1vw, 16px)", color: "#C06020" }}>
            Potential flare detected
          </p>
          <p style={{ fontSize: "clamp(11px, 1vw, 15px)", color: theme.textMuted }}>
            Your symptom scores have been elevated for 3 consecutive days. Consider logging today and messaging your care team.
          </p>
        </div>
      </div>
      )}

      {/* Top row: Medications + Upcoming */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(16px, 1.8vw, 28px)", marginBottom: "clamp(16px, 1.8vw, 28px)" }}>
        {/* Medications */}
        <div style={{
          background: theme.surface, borderRadius: "clamp(16px, 1.8vw, 28px)",
          padding: "clamp(28px, 3.8vh, 52px) clamp(28px, 2.8vw, 44px)",
          border: `1px solid ${theme.border}`,
        }}>
          <p style={{ fontWeight: 600, fontSize: "clamp(16px, 1.6vw, 24px)", marginBottom: "clamp(18px, 2.4vh, 32px)" }}>
            Today's Medications
          </p>
          {meds.map((m) => (
            <div key={m.id || m.name} style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 1.2vw, 20px)", marginBottom: "clamp(16px, 2vh, 26px)" }}>
              <button
                type="button"
                onClick={async () => {
                  if (!patient?.id || togglingMed === m.id) return;
                  setTogglingMed(m.id);
                  try {
                    await postMedicationAdherence(patient.id, m.id, !m.done);
                    refetch();
                  } catch (e) {
                    console.error("Failed to update adherence:", e);
                  } finally {
                    setTogglingMed(null);
                  }
                }}
                disabled={togglingMed === m.id}
                style={{
                  width: "clamp(28px, 2.4vw, 38px)", height: "clamp(28px, 2.4vw, 38px)",
                  borderRadius: "50%", border: "2.5px solid",
                  borderColor: m.done ? theme.success : theme.border,
                  background: m.done ? theme.success : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  cursor: patient?.id && togglingMed !== m.id ? "pointer" : "default",
                  padding: 0, fontFamily: "inherit",
                  transition: "border-color 0.2s, background 0.2s",
                  opacity: togglingMed === m.id ? 0.6 : 1,
                }}
              >
                {m.done && <span style={{ color: "white", fontSize: "clamp(13px, 1.2vw, 18px)" }}>✓</span>}
              </button>
              <div>
                <p style={{
                  fontSize: "clamp(15px, 1.4vw, 22px)",
                  color: m.done ? theme.textLight : theme.text,
                  textDecoration: m.done ? "line-through" : "none",
                }}>
                  {m.name}
                </p>
                <p style={{ fontSize: "clamp(12px, 1.1vw, 17px)", color: theme.textLight }}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        <div style={{
          background: theme.surface, borderRadius: "clamp(16px, 1.8vw, 28px)",
          padding: "clamp(28px, 3.8vh, 52px) clamp(28px, 2.8vw, 44px)",
          border: `1px solid ${theme.border}`,
        }}>
          <p style={{ fontWeight: 600, fontSize: "clamp(16px, 1.6vw, 24px)", marginBottom: "clamp(18px, 2.4vh, 32px)" }}>
            Upcoming
          </p>
          {upcoming.map((u) => (
            <div key={`${u.date}-${u.label}`} style={{ display: "flex", gap: "clamp(12px, 1.4vw, 22px)", alignItems: "center", marginBottom: "clamp(16px, 2vh, 26px)" }}>
              <div style={{
                background: theme.accentMuted, borderRadius: "12px",
                padding: "clamp(8px, 1vh, 14px) clamp(14px, 1.4vw, 22px)",
                fontSize: "clamp(14px, 1.3vw, 20px)", fontWeight: 700, color: theme.accent,
                minWidth: "clamp(62px, 6vw, 86px)", textAlign: "center", flexShrink: 0,
              }}>
                {u.date}
              </div>
              <p style={{ fontSize: "clamp(15px, 1.4vw, 22px)", color: theme.text }}>{u.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
