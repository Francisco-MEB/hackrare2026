import { theme } from "../../../theme";

export default function PatientDashboard({ onNavigate }) {
  const meds = [
    { name: "Gabapentin 300mg", time: "8:00 AM", done: true },
    { name: "Vitamin D 2000IU", time: "8:00 AM", done: true },
    { name: "Clonazepam 0.5mg", time: "2:00 PM", done: false },
    { name: "Melatonin 5mg",    time: "9:00 PM", done: false },
  ];

  const upcoming = [
    { date: "Mar 4",  label: "Neurology follow-up" },
    { date: "Mar 11", label: "MRI Scan — Mass General" },
    { date: "Mar 18", label: "ENT Consult" },
  ];

  return (
    <div>
      <h1 className="serif" style={{ fontSize: "clamp(20px, 2.2vw, 32px)", marginBottom: "clamp(4px, 0.5vh, 8px)" }}>
        Good morning, Alex
      </h1>
      <p style={{ color: theme.textMuted, fontSize: "clamp(12px, 1.1vw, 16px)", marginBottom: "clamp(18px, 2.5vh, 36px)" }}>
        Saturday, Feb 28 · Here's your overview for today
      </p>

      {/* Symptom log CTA */}
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

      {/* Flare alert */}
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
          {meds.map(m => (
            <div key={m.name} style={{ display: "flex", alignItems: "center", gap: "clamp(12px, 1.2vw, 20px)", marginBottom: "clamp(16px, 2vh, 26px)" }}>
              <div style={{
                width: "clamp(28px, 2.4vw, 38px)", height: "clamp(28px, 2.4vw, 38px)",
                borderRadius: "50%", border: "2.5px solid",
                borderColor: m.done ? theme.success : theme.border,
                background: m.done ? theme.success : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {m.done && <span style={{ color: "white", fontSize: "clamp(13px, 1.2vw, 18px)" }}>✓</span>}
              </div>
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
          {upcoming.map(u => (
            <div key={u.date} style={{ display: "flex", gap: "clamp(12px, 1.4vw, 22px)", alignItems: "center", marginBottom: "clamp(16px, 2vh, 26px)" }}>
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
