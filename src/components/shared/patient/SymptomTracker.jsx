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
  const [comment, setComment] = useState("");

  const active = CATEGORIES.find(c => c.id === activeId);

  const scoreColor = (val, color) => {
    if (val >= 8) return theme.danger;
    if (val >= 5) return theme.warning;
    return color;
  };

  const gridRows = Math.ceil(active.symptoms.length / 2);

  return (
    // Root: locks to viewport height minus <main> top+bottom padding
    <div style={{
      height: "calc(100vh - clamp(48px, 7vh, 104px))",
      display: "flex", flexDirection: "column",
      gap: "clamp(10px, 1.4vh, 18px)",
      overflow: "hidden",
    }}>

      {/* Header */}
      <div style={{ flexShrink: 0 }}>
        <h1 className="serif" style={{ fontSize: "clamp(20px, 2.2vw, 30px)", marginBottom: "clamp(2px, 0.3vh, 6px)" }}>
          Symptom Check-In
        </h1>
        <p style={{ color: theme.textMuted, fontSize: "clamp(11px, 1vw, 15px)" }}>
          Mar 1 · Select a category and rate today's symptoms
        </p>
      </div>

      {/* Category selector — fixed height row */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        gap: "clamp(10px, 1.2vw, 18px)",
        flexShrink: 0,
        height: "clamp(160px, 22vh, 270px)",
      }}>
        {CATEGORIES.map(c => {
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              style={{
                height: "100%",
                background: isActive ? c.colorMuted : theme.surface,
                border: `${isActive ? "2px" : "1px"} solid ${isActive ? c.color : theme.border}`,
                borderRadius: "clamp(12px, 1.3vw, 20px)",
                padding: "clamp(14px, 1.8vh, 24px) clamp(14px, 1.4vw, 22px)",
                cursor: "pointer", textAlign: "left",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                transition: "all 0.3s ease",
                boxShadow: isActive ? `0 4px 20px ${c.color}28` : "none",
              }}
            >
              <span style={{
                fontSize: "clamp(22px, 2.4vw, 38px)",
                color: isActive ? c.color : theme.textLight,
                transition: "color 0.3s", lineHeight: 1,
              }}>
                {c.icon}
              </span>
              <div>
                <p style={{
                  fontWeight: 700, fontSize: "clamp(13px, 1.3vw, 20px)",
                  color: isActive ? c.color : theme.text,
                  marginBottom: "clamp(2px, 0.3vh, 5px)",
                  transition: "color 0.3s",
                }}>
                  {c.label}
                </p>
                <p style={{ fontSize: "clamp(10px, 0.9vw, 14px)", color: theme.textMuted, lineHeight: 1.3 }}>
                  {c.desc}
                </p>
              </div>
              <div style={{
                fontSize: "clamp(10px, 0.9vw, 13px)",
                color: isActive ? c.color : theme.textLight,
                fontWeight: 500, transition: "color 0.3s",
              }}>
                {c.symptoms.length} symptoms
              </div>
            </button>
          );
        })}
      </div>

      {/* Symptom panel — stretches to fill remaining height */}
      <div style={{
        flex: 1, minHeight: 0,
        background: theme.surface, borderRadius: "clamp(12px, 1.3vw, 20px)",
        border: `1px solid ${theme.border}`,
        padding: "clamp(14px, 1.8vh, 24px) clamp(16px, 1.6vw, 26px)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Panel header */}
        <div style={{
          flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "clamp(10px, 1.4vh, 18px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 0.8vw, 12px)" }}>
            <span style={{ fontSize: "clamp(16px, 1.5vw, 22px)", color: active.color }}>{active.icon}</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: "clamp(13px, 1.2vw, 17px)", color: active.color }}>
                {active.label} Symptoms
              </p>
              <p style={{ fontSize: "clamp(10px, 0.85vw, 13px)", color: theme.textMuted }}>
                Rate severity from 1 (none) to 10 (severe)
              </p>
            </div>
          </div>
        </div>

        {/* Sliders grid — fills all remaining panel space */}
        <div style={{
          flex: 1, minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          gap: "clamp(10px, 1.2vw, 16px)",
        }}>
          {active.symptoms.map((s, i) => {
            const val = values[s.key];
            const col = scoreColor(val, active.color);
            const isOddLast = active.symptoms.length % 2 !== 0 && i === active.symptoms.length - 1;
            return (
              <div
                key={s.key}
                style={{
                  background: theme.bg, borderRadius: "clamp(10px, 1vw, 16px)",
                  padding: "clamp(12px, 1.5vh, 20px) clamp(14px, 1.4vw, 22px)",
                  border: `1px solid ${theme.border}`,
                  gridColumn: isOddLast ? "1 / -1" : undefined,
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <p style={{ fontWeight: 600, fontSize: "clamp(12px, 1.1vw, 17px)", color: theme.text }}>
                    {s.label}
                  </p>
                  <span style={{
                    fontSize: "clamp(20px, 2vw, 30px)", fontWeight: 700, color: col,
                    minWidth: "2ch", textAlign: "right",
                  }}>
                    {val}
                  </span>
                </div>
                <input
                  type="range" min="1" max="10" value={val}
                  onChange={e => setValues(prev => ({ ...prev, [s.key]: +e.target.value }))}
                  style={{ width: "100%", accentColor: active.color, cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "clamp(10px, 0.85vw, 13px)", color: theme.textLight }}>None</span>
                  <span style={{ fontSize: "clamp(10px, 0.85vw, 13px)", color: theme.textLight }}>Severe</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom bar: comments + log button */}
        <div style={{
          flexShrink: 0,
          display: "flex", alignItems: "center", gap: "clamp(10px, 1vw, 16px)",
          marginTop: "clamp(10px, 1.2vh, 16px)",
        }}>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={`Any additional notes for today's ${active.label.toLowerCase()} symptoms…`}
            rows={2}
            style={{
              flex: 1,
              padding: "clamp(8px, 1vh, 12px) clamp(12px, 1.2vw, 18px)",
              borderRadius: "clamp(8px, 0.8vw, 12px)",
              border: `1.5px solid ${theme.border}`,
              fontSize: "clamp(11px, 1vw, 14px)",
              fontFamily: "inherit", color: theme.text,
              background: theme.bg, resize: "none", outline: "none",
              lineHeight: 1.5,
            }}
          />
          <button style={{
            padding: "clamp(10px, 1.2vh, 16px) clamp(16px, 1.6vw, 24px)",
            borderRadius: "clamp(8px, 0.8vw, 12px)",
            background: active.color, color: "white", border: "none",
            fontWeight: 600, fontSize: "clamp(12px, 1vw, 15px)",
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: `0 3px 12px ${active.color}44`,
            transition: "background 0.3s", flexShrink: 0,
            alignSelf: "stretch",
          }}>
            Log {active.label}
          </button>
        </div>
      </div>
    </div>
  );
}
