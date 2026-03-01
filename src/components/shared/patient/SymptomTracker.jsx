import { useState } from "react";
import { theme } from "../../../theme";

const CATEGORIES = [
  {
    id: "motor",
    label: "Motor",
    icon: "⊛",
    desc: "Movement & coordination",
    color: theme.accent,
    colorMuted: theme.accentMuted,
    symptoms: [
      { key: "tremors",       label: "Tremors" },
      { key: "weakness",      label: "Muscle Weakness" },
      { key: "balance",       label: "Balance" },
      { key: "coordination",  label: "Coordination" },
      { key: "gait",          label: "Walking / Gait" },
    ],
  },
  {
    id: "sensory",
    label: "Sensory",
    icon: "◎",
    desc: "Pain & sensation",
    color: "#E8A84A",
    colorMuted: "#FEF3DC",
    symptoms: [
      { key: "pain",          label: "Pain" },
      { key: "numbness",      label: "Numbness / Tingling" },
      { key: "light_sens",    label: "Light Sensitivity" },
      { key: "sound_sens",    label: "Sound Sensitivity" },
      { key: "temp_sens",     label: "Temperature Sensitivity" },
    ],
  },
  {
    id: "cognitive",
    label: "Cognitive",
    icon: "✦",
    desc: "Memory & thinking",
    color: "#9B7FE8",
    colorMuted: "#F0ECFD",
    symptoms: [
      { key: "brain_fog",     label: "Brain Fog" },
      { key: "memory",        label: "Memory" },
      { key: "concentration", label: "Concentration" },
      { key: "word_finding",  label: "Word Finding" },
      { key: "processing",    label: "Processing Speed" },
    ],
  },
  {
    id: "behavioral",
    label: "Behavioral",
    icon: "⊞",
    desc: "Mood & sleep",
    color: "#6BAF8E",
    colorMuted: "#E8F5EE",
    symptoms: [
      { key: "anxiety",       label: "Anxiety" },
      { key: "mood",          label: "Mood Stability" },
      { key: "sleep",         label: "Sleep Quality" },
      { key: "fatigue",       label: "Fatigue" },
      { key: "irritability",  label: "Irritability" },
    ],
  },
];

const initValues = () => {
  const v = {};
  CATEGORIES.forEach(c => c.symptoms.forEach(s => { v[s.key] = 1; }));
  return v;
};

export default function SymptomTracker() {
  const [activeId, setActiveId] = useState("motor");
  const [values, setValues] = useState(initValues());

  const active = CATEGORIES.find(c => c.id === activeId);

  const scoreColor = (val, color) => {
    if (val >= 8) return theme.danger;
    if (val >= 5) return theme.warning;
    return color;
  };

  return (
    <div>
      <h1 className="serif" style={{ fontSize: "clamp(20px, 2.2vw, 32px)", marginBottom: "clamp(4px, 0.5vh, 8px)" }}>
        Symptom Check-In
      </h1>
      <p style={{ color: theme.textMuted, fontSize: "clamp(12px, 1.1vw, 16px)", marginBottom: "clamp(20px, 3vh, 40px)" }}>
        Mar 1 · Select a category and rate today's symptoms
      </p>

      {/* Category selector */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "clamp(12px, 1.4vw, 22px)", marginBottom: "clamp(20px, 3vh, 40px)" }}>
        {CATEGORIES.map(c => {
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              style={{
                background: isActive ? c.colorMuted : theme.surface,
                border: `${isActive ? "2px" : "1px"} solid ${isActive ? c.color : theme.border}`,
                borderRadius: "clamp(14px, 1.5vw, 24px)",
                padding: "clamp(26px, 3.2vh, 46px) clamp(20px, 2vw, 32px)",
                cursor: "pointer", textAlign: "left",
                display: "flex", flexDirection: "column", gap: "clamp(12px, 1.4vh, 20px)",
                transition: "all 0.3s ease",
                boxShadow: isActive ? `0 6px 28px ${c.color}28` : "none",
                minHeight: "clamp(180px, 22vh, 260px)",
              }}
            >
              <span style={{
                fontSize: "clamp(34px, 3.4vw, 52px)",
                color: isActive ? c.color : theme.textLight,
                transition: "color 0.3s",
                lineHeight: 1,
              }}>
                {c.icon}
              </span>
              <div>
                <p style={{
                  fontWeight: 700,
                  fontSize: "clamp(16px, 1.5vw, 24px)",
                  color: isActive ? c.color : theme.text,
                  marginBottom: "clamp(4px, 0.5vh, 8px)",
                  transition: "color 0.3s",
                }}>
                  {c.label}
                </p>
                <p style={{
                  fontSize: "clamp(12px, 1.1vw, 16px)",
                  color: theme.textMuted,
                  lineHeight: 1.4,
                }}>
                  {c.desc}
                </p>
              </div>
              <div style={{
                fontSize: "clamp(12px, 1.1vw, 16px)",
                color: isActive ? c.color : theme.textLight,
                fontWeight: 500,
                transition: "color 0.3s",
              }}>
                {c.symptoms.length} symptoms
              </div>
            </button>
          );
        })}
      </div>

      {/* Symptom sliders for active category */}
      <div style={{
        background: theme.surface, borderRadius: "clamp(12px, 1.3vw, 20px)",
        border: `1px solid ${theme.border}`,
        padding: "clamp(18px, 2.2vh, 32px) clamp(18px, 1.8vw, 30px)",
        marginBottom: "clamp(14px, 1.8vh, 24px)",
      }}>
        {/* Panel header */}
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 0.8vw, 12px)", marginBottom: "clamp(16px, 2.2vh, 30px)" }}>
          <span style={{ fontSize: "clamp(18px, 1.6vw, 24px)", color: active.color }}>{active.icon}</span>
          <div>
            <p style={{ fontWeight: 700, fontSize: "clamp(13px, 1.2vw, 18px)", color: active.color }}>
              {active.label} Symptoms
            </p>
            <p style={{ fontSize: "clamp(10px, 0.9vw, 13px)", color: theme.textMuted }}>
              Rate severity from 1 (none) to 10 (severe)
            </p>
          </div>
        </div>

        {/* Sliders grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(14px, 1.6vw, 24px)" }}>
          {active.symptoms.map((s, i) => {
            const val = values[s.key];
            const col = scoreColor(val, active.color);
            const isOddLast = active.symptoms.length % 2 !== 0 && i === active.symptoms.length - 1;
            return (
              <div
                key={s.key}
                style={{
                  background: theme.bg, borderRadius: "clamp(12px, 1.2vw, 20px)",
                  padding: "clamp(22px, 2.8vh, 38px) clamp(22px, 2.2vw, 34px)",
                  border: `1px solid ${theme.border}`,
                  gridColumn: isOddLast ? "1 / -1" : undefined,
                  minHeight: "clamp(150px, 18vh, 220px)",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "clamp(14px, 1.8vh, 24px)" }}>
                  <p style={{ fontWeight: 600, fontSize: "clamp(14px, 1.3vw, 20px)", color: theme.text }}>{s.label}</p>
                  <span style={{
                    fontSize: "clamp(24px, 2.4vw, 36px)", fontWeight: 700, color: col,
                    minWidth: "2ch", textAlign: "right",
                  }}>
                    {val}
                  </span>
                </div>
                <input
                  type="range" min="1" max="10" value={val}
                  onChange={e => setValues(prev => ({ ...prev, [s.key]: +e.target.value }))}
                  style={{ width: "100%", accentColor: active.color, cursor: "pointer", height: "6px" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "clamp(6px, 0.8vh, 12px)" }}>
                  <span style={{ fontSize: "clamp(11px, 1vw, 15px)", color: theme.textLight }}>None</span>
                  <span style={{ fontSize: "clamp(11px, 1vw, 15px)", color: theme.textLight }}>Severe</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "clamp(14px, 1.8vh, 24px)" }}>
        <button style={{
          padding: "clamp(12px, 1.4vh, 18px) clamp(24px, 2.4vw, 36px)",
          borderRadius: "clamp(10px, 1vw, 14px)",
          background: active.color, color: "white", border: "none",
          fontWeight: 600, fontSize: "clamp(13px, 1.1vw, 16px)",
          cursor: "pointer", fontFamily: "inherit",
          boxShadow: `0 4px 16px ${active.color}44`,
          transition: "background 0.3s",
        }}>
          Log {active.label} Symptoms
        </button>
      </div>

      {/* Flare prediction */}
      <div style={{
        background: "#FFF9F6", borderRadius: "clamp(12px, 1.3vw, 20px)",
        padding: "clamp(14px, 1.6vh, 22px) clamp(16px, 1.6vw, 26px)",
        border: `1.5px solid ${theme.accentLight}`,
      }}>
        <p style={{ fontWeight: 600, fontSize: "clamp(11px, 1vw, 15px)", color: theme.accent, marginBottom: "clamp(6px, 0.8vh, 10px)" }}>
          ⚡ Flare Prediction
        </p>
        <p style={{ fontSize: "clamp(11px, 1vw, 15px)", color: theme.text, lineHeight: "1.6" }}>
          Based on your last 7 days of data, there's a <strong>moderate likelihood of increased severity</strong> this weekend.
          Motor and sensory scores have trended upward since Wednesday. Consider resting proactively and hydrating well.
        </p>
      </div>
    </div>
  );
}
