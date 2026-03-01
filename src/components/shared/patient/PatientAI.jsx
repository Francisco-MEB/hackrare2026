import { useState } from "react";
import { theme } from "../../../theme";

export default function PatientAI() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi Alex! I'm here to help you navigate your health history and understand your rare disease. Ask me anything — from medication questions to appointment history." },
  ]);
  const [input, setInput] = useState("");

  const suggestions = [
    "When was my last neurology visit?",
    "What's my current gabapentin dose?",
    "Explain ENS to me simply",
  ];

  const send = (text) => {
    if (!text.trim()) return;
    const q = text.trim();
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "ai",
        text: "Based on your medical history, here's what I found: Your last neurology appointment was on January 15, 2026 with Dr. Sarah Kim. Your gabapentin dosage is currently 300mg three times daily, as updated on that visit. Is there anything specific you'd like to know about this?",
      }]);
    }, 800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
      <h1 className="serif" style={{ fontSize: "26px", marginBottom: "6px" }}>AI Assistant</h1>
      <p style={{ color: theme.textMuted, fontSize: "14px", marginBottom: "20px" }}>
        Ask about your health history, medications, or your condition
      </p>

      <div style={{ background: theme.surface, borderRadius: "16px", border: `1px solid ${theme.border}`, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "75%", padding: "12px 16px",
                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role === "user" ? theme.accent : theme.accentMuted,
                color: m.role === "user" ? "white" : theme.text,
                fontSize: "14px", lineHeight: "1.6",
              }}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input area */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${theme.border}` }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                padding: "6px 12px", borderRadius: "20px", border: `1px solid ${theme.border}`,
                background: "transparent", fontSize: "12px", cursor: "pointer",
                color: theme.textMuted, fontFamily: "inherit",
              }}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send(input)}
              placeholder="Ask anything about your health..."
              style={{
                flex: 1, padding: "12px 16px", borderRadius: "12px",
                border: `1.5px solid ${theme.border}`, fontSize: "14px",
                fontFamily: "inherit", outline: "none", background: theme.surfaceWarm,
              }}
            />
            <button onClick={() => send(input)} style={{
              padding: "12px 20px", borderRadius: "12px", background: theme.accent,
              color: "white", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit",
            }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
