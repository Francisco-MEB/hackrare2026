import { theme } from "../../../theme";

export default function DeviceData() {
  const stats = [
    { label: "Today's Pain",  value: "6/10",    delta: "+1 vs yesterday", color: theme.warning },
    { label: "Sleep Quality", value: "Poor",    delta: "4.5 hrs logged",  color: theme.danger  },
    { label: "Mobility",      value: "Moderate",delta: "Stable",          color: theme.success },
  ];

  return (
    <div>
      <h1 className="serif" style={{ fontSize: "clamp(20px, 2.2vw, 32px)", marginBottom: "clamp(4px, 0.5vh, 8px)" }}>
        Device Data
      </h1>
      <p style={{ color: theme.textMuted, fontSize: "clamp(12px, 1.1vw, 16px)", marginBottom: "clamp(18px, 2.5vh, 36px)" }}>
        Feb 28 · Latest readings from your connected devices
      </p>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "clamp(12px, 1.4vw, 20px)", marginBottom: "clamp(16px, 2vh, 28px)" }}>
        {stats.map(stat => (
          <div key={stat.label} style={{
            background: theme.surface, borderRadius: "clamp(12px, 1.3vw, 20px)",
            padding: "clamp(16px, 1.8vh, 28px) clamp(16px, 1.6vw, 26px)",
            border: `1px solid ${theme.border}`,
          }}>
            <p style={{
              fontSize: "clamp(10px, 0.9vw, 13px)", color: theme.textLight, fontWeight: 600,
              textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "clamp(6px, 0.8vh, 10px)",
            }}>
              {stat.label}
            </p>
            <p style={{ fontSize: "clamp(18px, 1.8vw, 28px)", fontWeight: 700, color: stat.color, marginBottom: "clamp(3px, 0.4vh, 6px)" }}>
              {stat.value}
            </p>
            <p style={{ fontSize: "clamp(10px, 0.9vw, 13px)", color: theme.textMuted }}>{stat.delta}</p>
          </div>
        ))}
      </div>

      {/* Placeholder for device integrations */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "40vh", flexDirection: "column", gap: "clamp(8px, 1vh, 14px)",
        background: theme.surface, borderRadius: "clamp(12px, 1.3vw, 20px)",
        border: `1px solid ${theme.border}`,
      }}>
        <span style={{ fontSize: "clamp(24px, 2.5vw, 40px)", opacity: 0.15 }}>◈</span>
        <p style={{ color: theme.textMuted, fontSize: "clamp(12px, 1.1vw, 16px)" }}>Device integrations coming soon</p>
      </div>
    </div>
  );
}
