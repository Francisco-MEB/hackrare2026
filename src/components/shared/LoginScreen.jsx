import { useState } from "react";
import { theme } from "../../theme";
import NodeDiagram from "./NodeDiagram";

export default function LoginScreen({ onLogin }) {
  const [hovered, setHovered] = useState(null);

  const portals = [
    { role: "patient", label: "Patient Portal", sub: "Track symptoms, manage care", icon: "◎" },
    { role: "doctor",  label: "Doctor Portal",  sub: "Review patients, clinical tools", icon: "✦" },
  ];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: theme.bg, position: "relative", overflow: "hidden",
    }}>
      {/* Background node diagrams — inward nodes land near the portal cards */}
      <div style={{ position: "absolute", top: "-20px", left: "-20px" }}>
        <NodeDiagram />
      </div>
      <div style={{ position: "absolute", bottom: "-20px", right: "-20px", transform: "rotate(180deg)" }}>
        <NodeDiagram />
      </div>

      {/* Logo */}
      <div className="anim-logo" style={{
        display: "flex", alignItems: "center",
        gap: "clamp(10px, 1vw, 18px)",
        marginBottom: "clamp(20px, 3vh, 40px)",
        position: "relative", zIndex: 1,
      }}>
        <div style={{
          width:  "clamp(40px, 4.5vw, 64px)",
          height: "clamp(40px, 4.5vw, 64px)",
          borderRadius: "clamp(10px, 1vw, 16px)",
          background: theme.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 24px rgba(232,130,74,0.3)`,
          flexShrink: 0,
        }}>
          <span style={{ color: "white", fontSize: "clamp(16px, 2vw, 28px)" }}>✦</span>
        </div>
        <span style={{
          fontWeight: 600,
          fontSize: "clamp(28px, 3.5vw, 52px)",
          letterSpacing: "-0.5px",
          color: theme.text,
        }}>
          Indicium
        </span>
      </div>

      {/* Tagline */}
      <div className="anim-tagline" style={{
        textAlign: "center",
        marginBottom: "clamp(24px, 4vh, 52px)",
        position: "relative", zIndex: 1,
      }}>
        <p style={{
          fontSize: "clamp(13px, 1.3vw, 20px)",
          color: theme.textLight,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontWeight: 500,
          lineHeight: 1,
        }}>
          The intelligence layer for symptom management
        </p>
      </div>

      {/* Divider */}
      <div className="anim-divider" style={{
        width: "clamp(36px, 4vw, 72px)",
        height: "clamp(1.5px, 0.2vh, 3px)",
        background: theme.accentLight,
        marginBottom: "clamp(36px, 6vh, 72px)",
        borderRadius: "2px",
        position: "relative", zIndex: 1,
      }} />

      {/* Portal cards */}
      <div className="anim-cards" style={{
        display: "flex",
        gap: "clamp(16px, 2vw, 36px)",
        position: "relative", zIndex: 1,
      }}>
        {portals.map(p => (
          <div
            key={p.role}
            onClick={() => onLogin(p.role)}
            onMouseEnter={() => setHovered(p.role)}
            onMouseLeave={() => setHovered(null)}
            style={{
              width:  "clamp(200px, 18vw, 320px)",
              height: "clamp(280px, 30vh, 420px)",
              borderRadius: "clamp(14px, 1.5vw, 24px)",
              border: "1.5px solid",
              borderColor: hovered === p.role ? theme.accent : theme.border,
              background:   hovered === p.role ? theme.accentMuted : theme.surface,
              cursor: "pointer",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "clamp(12px, 1.5vh, 22px)",
              transition: "all 0.6s ease",
              boxShadow: hovered === p.role
                ? `0 8px 40px rgba(232,130,74,0.15)`
                : "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <span style={{
              fontSize: "clamp(28px, 3vw, 48px)",
              color: hovered === p.role ? theme.accent : theme.textLight,
              transition: "color 0.6s",
            }}>
              {p.icon}
            </span>
            <div style={{ textAlign: "center", padding: "0 clamp(12px, 1.5vw, 24px)" }}>
              <p style={{
                fontSize: "clamp(14px, 1.3vw, 20px)",
                fontWeight: 600,
                color: theme.text,
                marginBottom: "clamp(4px, 0.6vh, 10px)",
                letterSpacing: "-0.2px",
              }}>
                {p.label}
              </p>
              <p style={{
                fontSize: "clamp(11px, 1vw, 15px)",
                color: theme.textMuted,
                lineHeight: 1.5,
              }}>
                {p.sub}
              </p>
            </div>
            <div style={{
              fontSize: "clamp(11px, 1vw, 15px)",
              color: hovered === p.role ? theme.accent : theme.textLight,
              fontWeight: 500,
              transition: "color 0.6s",
            }}>
              Continue →
            </div>
          </div>
        ))}
      </div>

      <p className="anim-footer" style={{
        marginTop: "clamp(28px, 4vh, 56px)",
        fontSize: "clamp(11px, 1vw, 15px)",
        color: theme.textLight,
        position: "relative", zIndex: 1,
      }}>
        Need access?{" "}
        <span style={{ color: theme.accent, cursor: "pointer" }}>Contact your care team</span>
      </p>
    </div>
  );
}
