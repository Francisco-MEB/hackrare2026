import { useState } from "react";
import { theme } from "../../theme";

export default function NavItem({ item, active, onSelect }) {
  const [hovered, setHovered] = useState(false);
  const isActive = active === item.id;
  const highlighted = isActive || hovered;

  return (
    <button
      onClick={() => onSelect(item.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: "clamp(12px, 1vw, 16px)",
        padding: "clamp(12px, 1.4vh, 18px) clamp(14px, 1.2vw, 20px)", borderRadius: "12px", border: "none",
        background: isActive ? theme.accentMuted : hovered ? "#FDF3EC" : "transparent",
        color: highlighted ? theme.accent : theme.textMuted,
        fontWeight: highlighted ? 600 : 400,
        fontSize: "clamp(15px, 1.25vw, 18px)", cursor: "pointer", textAlign: "left",
        fontFamily: "inherit", marginBottom: "4px", transition: "all 0.4s",
      }}
    >
      <span style={{ fontSize: "clamp(17px, 1.4vw, 22px)", lineHeight: 1, color: highlighted ? theme.accent : theme.textLight, transition: "color 0.4s" }}>
        {item.icon}
      </span>
      {item.label}
    </button>
  );
}
