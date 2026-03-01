import { useState } from "react";
import { theme } from "../../../theme";

export default function DoctorAI() {
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hello Dr. Kim. I can help you explore treatment evidence for your rare disease patients, review what has worked for similar cases, and surface relevant clinical patterns across your panel." },
  ]);
  const [input, setInput] = useState("");

  const suggestions = [
    "What treatments have helped ENS patients with severe pain?",
    "Compare outcomes for gabapentin vs pregabalin in neuropathic ENS",
    "What are common comorbidities with CRPS?",
  ];

  const send = (text) => {
    if (!text.trim()) return;
    const q = text.trim();
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "ai",
        text: "Based on aggregated treatment data from similar cases: For ENS patients with significant pain burden, Gabapentin 300-600mg TID has shown benefit in 3 of 5 documented cases in your panel. Saline irrigation protocols (2x daily) have shown consistent improvement in quality-of-life scores over 6-8 weeks. Cognitive behavioral therapy referrals have been associated with improved sleep and anxiety outcomes. Would you like me to surface specific patient comparisons or protocol details?",
      }]);
    }, 800);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
      <h1 className="serif" style={{ fontSize: "26px", marginBottom: "6px" }}>Clinical AI Guide</h1>
      <p style={{ color: theme.textMuted, fontSize: "14px", marginBottom: "20px" }}>
        Evidence synthesis and treatment patterns for rare neurological diseases
      </p>

      {/* Disclaimer */}
      <div style={{
        background: "#FFF4EC", border: `1px solid ${theme.accentLight}`, borderRadius: "12px",
        padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#8A4010",
      }}>
        ⚕️ This tool surfaces patterns from anonymized patient data and published literature. It does not replace clinical judgment.
      </div>

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

        {/* Input */}
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
              placeholder="Search treatment patterns, evidence, clinical insights..."
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
