import { theme } from "../../theme";
import NavItem from "./NavItem";

export default function Sidebar({ items, active, onSelect, role, onLogout }) {
  return (
    <div style={{
      width: "300px", minHeight: "100vh", background: theme.surface,
      borderRight: `1px solid ${theme.border}`, display: "flex", flexDirection: "column",
      padding: "clamp(20px, 2.5vh, 36px) 0", position: "fixed", left: 0, top: 0, zIndex: 10,
    }}>
      {/* Logo + user */}
      <div style={{ padding: "0 clamp(20px, 1.8vw, 32px) clamp(24px, 2.8vh, 40px)", borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(10px, 0.9vw, 14px)" }}>
          <div style={{
            width: "clamp(34px, 2.8vw, 44px)", height: "clamp(34px, 2.8vw, 44px)", borderRadius: "10px",
            background: theme.accent, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontSize: "clamp(16px, 1.4vw, 22px)" }}>✦</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: "clamp(18px, 1.5vw, 24px)", letterSpacing: "-0.3px" }}>Indicium</span>
        </div>
        <div style={{ marginTop: "clamp(36px, 5vh, 64px)", display: "flex", alignItems: "center", gap: "clamp(12px, 1vw, 16px)" }}>
          <div style={{
            width: "clamp(42px, 3.4vw, 54px)", height: "clamp(42px, 3.4vw, 54px)", borderRadius: "50%",
            background: theme.accentMuted, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "clamp(18px, 1.5vw, 24px)",
          }}>
            {role === "patient" ? "◎" : "✦"}
          </div>
          <div>
            <p style={{ fontSize: "clamp(14px, 1.2vw, 18px)", fontWeight: 600, color: theme.text }}>
              {role === "patient" ? "Alex Chen" : "Dr. Sarah Kim"}
            </p>
            <p style={{ fontSize: "clamp(12px, 1vw, 15px)", color: theme.textLight, textTransform: "capitalize" }}>{role}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "clamp(14px, 2vh, 24px) clamp(12px, 1vw, 18px)" }}>
        {items.map(item => (
          <NavItem key={item.id} item={item} active={active} onSelect={onSelect} />
        ))}
      </nav>

      {/* Sign out */}
      <div style={{ padding: "clamp(14px, 2vh, 24px) clamp(12px, 1vw, 18px)", borderTop: `1px solid ${theme.border}` }}>
        <button onClick={onLogout} style={{
          width: "100%", display: "flex", alignItems: "center", gap: "clamp(10px, 0.9vw, 14px)",
          padding: "clamp(12px, 1.4vh, 18px) clamp(14px, 1.2vw, 20px)", borderRadius: "12px", border: "none",
          background: "transparent", color: theme.textMuted,
          fontSize: "clamp(14px, 1.2vw, 17px)", cursor: "pointer", fontFamily: "inherit",
        }}>
          <span>↩</span> Sign out
        </button>
      </div>
    </div>
  );
}
