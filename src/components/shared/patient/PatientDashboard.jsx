import { theme } from "../../../theme";

export default function PatientDashboard() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const heatData = [2,3,6,8,7,4,2, 1,2,5,9,8,5,3, 2,1,3,5,4,2,1, 3,4,6,7,6,3,2];

  const getHeat = (v) => {
    if (v >= 8) return theme.danger;
    if (v >= 6) return theme.warning;
    if (v >= 4) return theme.accentLight;
    if (v >= 2) return "#FDE8D8";
    return theme.border;
  };

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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(12px, 1.4vw, 20px)", marginBottom: "clamp(12px, 1.4vw, 20px)" }}>
        {/* Medications */}
        <div style={{
          background: theme.surface, borderRadius: "clamp(12px, 1.3vw, 20px)",
          padding: "clamp(16px, 1.8vh, 28px) clamp(16px, 1.6vw, 26px)",
          border: `1px solid ${theme.border}`,
        }}>
          <p style={{ fontWeight: 600, fontSize: "clamp(12px, 1.1vw, 16px)", marginBottom: "clamp(10px, 1.4vh, 18px)" }}>
            Today's Medications
          </p>
          {meds.map(m => (
            <div key={m.name} style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 0.9vw, 12px)", marginBottom: "clamp(8px, 1vh, 14px)" }}>
              <div style={{
                width: "clamp(16px, 1.4vw, 22px)", height: "clamp(16px, 1.4vw, 22px)",
                borderRadius: "50%", border: "2px solid",
                borderColor: m.done ? theme.success : theme.border,
                background: m.done ? theme.success : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {m.done && <span style={{ color: "white", fontSize: "clamp(9px, 0.8vw, 12px)" }}>✓</span>}
              </div>
              <div>
                <p style={{
                  fontSize: "clamp(11px, 1vw, 14px)",
                  color: m.done ? theme.textLight : theme.text,
                  textDecoration: m.done ? "line-through" : "none",
                }}>
                  {m.name}
                </p>
                <p style={{ fontSize: "clamp(10px, 0.85vw, 13px)", color: theme.textLight }}>{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        <div style={{
          background: theme.surface, borderRadius: "clamp(12px, 1.3vw, 20px)",
          padding: "clamp(16px, 1.8vh, 28px) clamp(16px, 1.6vw, 26px)",
          border: `1px solid ${theme.border}`,
        }}>
          <p style={{ fontWeight: 600, fontSize: "clamp(12px, 1.1vw, 16px)", marginBottom: "clamp(10px, 1.4vh, 18px)" }}>
            Upcoming
          </p>
          {upcoming.map(u => (
            <div key={u.date} style={{ display: "flex", gap: "clamp(8px, 1vw, 14px)", alignItems: "center", marginBottom: "clamp(8px, 1vh, 14px)" }}>
              <div style={{
                background: theme.accentMuted, borderRadius: "8px",
                padding: "clamp(4px, 0.6vh, 8px) clamp(8px, 0.9vw, 12px)",
                fontSize: "clamp(10px, 0.85vw, 13px)", fontWeight: 700, color: theme.accent,
                minWidth: "clamp(40px, 4vw, 56px)", textAlign: "center",
              }}>
                {u.date}
              </div>
              <p style={{ fontSize: "clamp(11px, 1vw, 14px)", color: theme.text }}>{u.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div style={{
        background: theme.surface, borderRadius: "clamp(12px, 1.3vw, 20px)",
        padding: "clamp(16px, 1.8vh, 28px) clamp(16px, 1.6vw, 26px)",
        border: `1px solid ${theme.border}`,
      }}>
        <p style={{ fontWeight: 600, fontSize: "clamp(12px, 1.1vw, 16px)", marginBottom: "clamp(2px, 0.3vh, 6px)" }}>
          Symptom Intensity — February
        </p>
        <p style={{ fontSize: "clamp(10px, 0.9vw, 14px)", color: theme.textMuted, marginBottom: "clamp(12px, 1.6vh, 22px)" }}>
          Daily severity heatmap
        </p>
        <div style={{ display: "flex", gap: "clamp(4px, 0.5vw, 8px)", marginBottom: "clamp(4px, 0.5vh, 8px)" }}>
          {days.map((d, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", fontSize: "clamp(10px, 0.85vw, 13px)", color: theme.textLight, fontWeight: 600 }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "clamp(3px, 0.4vw, 6px)" }}>
          {heatData.map((v, i) => (
            <div key={i} style={{
              height: "clamp(22px, 2.4vh, 36px)", borderRadius: "5px",
              background: getHeat(v), opacity: v === 0 ? 0.3 : 1,
            }} title={`Score: ${v}`} />
          ))}
        </div>
        <div style={{ display: "flex", gap: "clamp(8px, 1vw, 14px)", marginTop: "clamp(8px, 1vh, 14px)", alignItems: "center" }}>
          <span style={{ fontSize: "clamp(10px, 0.85vw, 13px)", color: theme.textLight }}>Low</span>
          {[theme.border, "#FDE8D8", theme.accentLight, theme.warning, theme.danger].map((c, i) => (
            <div key={i} style={{ width: "clamp(10px, 0.9vw, 16px)", height: "clamp(10px, 0.9vw, 16px)", borderRadius: "3px", background: c }} />
          ))}
          <span style={{ fontSize: "clamp(10px, 0.85vw, 13px)", color: theme.textLight }}>High</span>
        </div>
      </div>
    </div>
  );
}
