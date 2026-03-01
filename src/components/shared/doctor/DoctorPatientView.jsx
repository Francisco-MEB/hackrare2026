import { useState, useRef, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { theme } from "../../../theme";
import { getPatientDashboard, getPatientSummary, chat } from "../../../api";
import { markdownToProse } from "../../../utils/markdownToProse";

const CHART_OPTIONS = [
  { id: "none", label: "Select a chart..." },
  { id: "symptom_severity", label: "Symptom severity trend" },
  { id: "flare_days_by_week", label: "Flare days by week" },
  { id: "adherence", label: "Adherence by week" },
  { id: "symptom_frequency", label: "Symptom frequency by week" },
];

export default function DoctorPatientView({ patient, onBack }) {
  const [dashboard, setDashboard] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", text: `Hello Dr. Kim. I can help you explore ${patient.name}'s care—medications, symptom trends, adherence, and treatment options. Ask me anything about this patient.` },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [typingIndex, setTypingIndex] = useState({}); // { messageIndex: displayedLength }
  const [selectedChart, setSelectedChart] = useState(null);
  const [chartDropupOpen, setChartDropupOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState(null);
  const dropupRef = useRef(null);

  const patientId = patient.id;

  useEffect(() => {
    setLoading(true);
    getPatientDashboard(patientId)
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setLoading(false));
  }, [patientId]);

  useEffect(() => {
    setSummaryLoading(true);
    getPatientSummary(patientId)
      .then((data) => setSummary(data.summary || ""))
      .catch(() => setSummary(""))
      .finally(() => setSummaryLoading(false));
  }, [patientId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropupRef.current && !dropupRef.current.contains(e.target)) setChartDropupOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Typing effect for AI messages
  useEffect(() => {
    const typing = chatMessages.findIndex((m, i) => m.typing && m.fullText);
    if (typing === -1) return;
    const msg = chatMessages[typing];
    const len = typingIndex[typing] ?? 0;
    if (len >= (msg.fullText?.length ?? 0)) {
      setChatMessages(prev => prev.map((m, i) =>
        i === typing ? { ...m, text: m.fullText, fullText: undefined, typing: false } : m
      ));
      setTypingIndex(prev => { const n = { ...prev }; delete n[typing]; return n; });
      return;
    }
    const t = setTimeout(() => setTypingIndex(prev => ({ ...prev, [typing]: len + 1 })), 20);
    return () => clearTimeout(t);
  }, [chatMessages, typingIndex]);

  const selectChartForAnalysis = (chartId) => {
    setSelectedChart(chartId === "none" ? null : chartId);
    setChartDropupOpen(false);
  };

  const chatSuggestions = [
    `Summarize ${patient.name}'s medications and adherence`,
    `What symptom patterns should I watch for?`,
    `Suggest treatment adjustments based on recent data`,
  ];

  const sendChat = async (text) => {
    if (!text.trim() || chatLoading) return;
    const q = text.trim();
    setChatMessages(prev => [...prev, { role: "user", text: q }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const answer = await chat(patientId, q);
      const prose = markdownToProse(answer);
      setChatMessages(prev => [...prev, { role: "ai", text: "", fullText: prose, typing: true }]);
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: "ai",
        text: `Error: ${err.message}. Make sure the API is running.`,
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const insights = dashboard?.insights;
  const adherenceByWeek = dashboard?.adherence_by_week || [
    { week: "W1", adherence: 0 },
    { week: "W2", adherence: 0 },
    { week: "W3", adherence: 0 },
    { week: "W4", adherence: 0 },
  ];
  const symptomSeverityTrend = dashboard?.symptom_severity_trend || [];
  const symptomNames = dashboard?.symptom_names || [];
  const flareDaysByWeek = dashboard?.flare_days_by_week || [
    { week: "W1", flareDays: 0 },
    { week: "W2", flareDays: 0 },
    { week: "W3", flareDays: 0 },
    { week: "W4", flareDays: 0 },
  ];
  const symptomFrequencyByWeek = dashboard?.symptom_frequency_by_week || [
    { week: "W1", count: 0 },
    { week: "W2", count: 0 },
    { week: "W3", count: 0 },
    { week: "W4", count: 0 },
  ];

  const renderChartContent = (chartId, stretched = false) => {
    const containerStyle = stretched
      ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", width: "100%", height: "100%" }
      : {};
    if (chartId === "symptom_severity") {
      const data = symptomSeverityTrend.length ? symptomSeverityTrend : [{ date: "—", severity: 0 }];
      const title = symptomNames.length === 1
        ? `${symptomNames[0]} Severity`
        : symptomNames.length > 1
          ? `Severity (${symptomNames.join(", ")})`
          : "Symptom Severity";
      const sub = symptomNames.length <= 1
        ? "Peak severity per day (scale 1–10)"
        : "Peak severity across tracked symptoms per day (scale 1–10)";
      return (
        <div style={{ background: theme.surface, borderRadius: "12px", padding: stretched ? "20px" : "12px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", ...containerStyle }}>
          <p className="serif" style={{ fontWeight: 600, color: theme.accent, fontSize: stretched ? "20px" : "12px", margin: "0 0 4px 0", textAlign: "center" }}>{title}</p>
          <p style={{ fontSize: "13px", color: theme.textMuted, margin: "0 0 12px 0", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>{sub}</p>
          <div style={{ flex: 1, minHeight: stretched ? 0 : 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke={theme.border} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: theme.textMuted }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: theme.textMuted }} width={28} tickCount={6} tickFormatter={(v) => v} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [v, "Severity"]} labelFormatter={(label) => `Date: ${label}`} />
                <Line type="monotone" dataKey="severity" stroke={theme.accent} strokeWidth={2} dot={{ fill: theme.accent }} name="Severity" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    if (chartId === "flare_days_by_week") {
      const flareTitle = symptomNames.length === 1
        ? `${symptomNames[0]} Flare Days By Week`
        : "Flare days by week";
      const flareSub = symptomNames.length === 1
        ? "Days with severity > 4/10"
        : "Days with severity > 4/10 across tracked symptoms";
      const maxFlare = Math.max(...flareDaysByWeek.map((d) => d.flareDays), 1);
      return (
        <div style={{ background: theme.surface, borderRadius: "12px", padding: stretched ? "20px" : "12px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", ...containerStyle }}>
          <p className="serif" style={{ fontWeight: 600, color: theme.accent, fontSize: stretched ? "20px" : "12px", margin: "0 0 4px 0", textAlign: "center" }}>{flareTitle}</p>
          <p style={{ fontSize: "13px", color: theme.textMuted, margin: "0 0 12px 0", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>{flareSub}</p>
          <div style={{ flex: 1, minHeight: stretched ? 0 : 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flareDaysByWeek} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke={theme.border} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: theme.textMuted }} />
                <YAxis domain={[0, Math.max(maxFlare, 7)]} tick={{ fontSize: 11, fill: theme.textMuted }} width={28} tickCount={8} tickFormatter={(v) => v} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [v, "Flare days"]} labelFormatter={(label) => `Week: ${label}`} />
                <Bar dataKey="flareDays" fill={theme.accent} radius={[4, 4, 0, 0]} name="Flare days" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    if (chartId === "adherence") {
      return (
        <div style={{ background: theme.surface, borderRadius: "12px", padding: stretched ? "20px" : "12px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", ...containerStyle }}>
          <p className="serif" style={{ fontWeight: 600, color: theme.accent, fontSize: stretched ? "20px" : "12px", margin: "0 0 4px 0", textAlign: "center" }}>Medication Adherence By Week</p>
          <p style={{ fontSize: "13px", color: theme.textMuted, margin: "0 0 12px 0", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>% of doses taken per week</p>
          <div style={{ flex: 1, minHeight: stretched ? 0 : 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adherenceByWeek} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke={theme.border} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: theme.textMuted }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: theme.textMuted }} width={28} tickCount={6} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [`${v}%`, "Adherence"]} labelFormatter={(label) => `Week: ${label}`} />
                <Bar dataKey="adherence" fill={theme.accent} radius={[4, 4, 0, 0]} name="Adherence" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    if (chartId === "symptom_frequency") {
      const freqTitle = symptomNames.length === 1
        ? `${symptomNames[0]} Log Frequency By Week`
        : "Symptom frequency by week";
      const freqSub = symptomNames.length === 1
        ? "Symptom log entries per week"
        : "Symptom log entries per week (all tracked symptoms)";
      const maxCount = Math.max(...symptomFrequencyByWeek.map((d) => d.count), 1);
      return (
        <div style={{ background: theme.surface, borderRadius: "12px", padding: stretched ? "20px" : "12px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", ...containerStyle }}>
          <p className="serif" style={{ fontWeight: 600, color: theme.accent, fontSize: stretched ? "20px" : "12px", margin: "0 0 4px 0", textAlign: "center" }}>{freqTitle}</p>
          <p style={{ fontSize: "13px", color: theme.textMuted, margin: "0 0 12px 0", textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>{freqSub}</p>
          <div style={{ flex: 1, minHeight: stretched ? 0 : 110 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symptomFrequencyByWeek} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="2 2" stroke={theme.border} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: theme.textMuted }} />
                <YAxis domain={[0, Math.max(maxCount, 5)]} tick={{ fontSize: 11, fill: theme.textMuted }} width={28} tickCount={6} tickFormatter={(v) => v} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [v, "Log count"]} labelFormatter={(label) => `Week: ${label}`} />
                <Bar dataKey="count" fill={theme.accent} radius={[4, 4, 0, 0]} name="Log count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: "flex", gap: "30px", alignItems: "stretch", height: "calc(100vh - 50px)", overflow: "hidden" }}>
      {/* Main content — full width */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "14px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", flexShrink: 0 }}>
          <button onClick={onBack} style={{
            background: "none", border: "none", cursor: "pointer", color: theme.textMuted,
            fontSize: "13px", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "4px",
            justifySelf: "start",
          }}>
            ← Back to patients
          </button>
          <div style={{ textAlign: "center" }}>
            <h1 className="serif" style={{ fontSize: "22px", margin: 0 }}>{dashboard?.patient?.name ?? patient.name}</h1>
            <p style={{ color: theme.textMuted, fontSize: "13px", margin: "2px 0 0 0" }}>{dashboard?.patient?.condition ?? patient.condition}</p>
          </div>
          <div style={{ justifySelf: "end", display: "flex", alignItems: "center" }}>
            <button
              onClick={() => setHistoryOpen(true)}
              style={{
                background: theme.accent, color: "white", border: "none", cursor: "pointer",
                padding: "8px 16px", borderRadius: "9999px", fontWeight: 600, fontSize: "13px",
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              <ion-icon name="book-outline" style={{ fontSize: "16px" }} /> Detailed History
            </button>
          </div>
        </div>

        {/* AI-generated summary — scrollable, no cutoff */}
        <div style={{
          background: theme.surface, borderRadius: "12px", padding: "16px 20px",
          border: `1px solid ${theme.accentLight}`, flexShrink: 0,
          maxHeight: "220px", overflowY: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "14px", color: theme.accent }}>✦</span>
            <p style={{ fontWeight: 700, fontSize: "13px", color: theme.accent, margin: 0 }}>AI Summary</p>
            <span style={{ fontSize: "11px", color: theme.textLight, marginLeft: "auto" }}>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
          <p style={{ fontSize: "14px", lineHeight: "1.65", color: theme.text, margin: 0, whiteSpace: "pre-wrap" }}>
            {summaryLoading ? "Loading AI summary..." : (markdownToProse(summary) || "No summary available.")}
          </p>
        </div>

        {/* 3 key insights */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", flexShrink: 0 }}>
          {[
            { label: "Flare days (30d)", val: loading ? "—" : String(insights?.flare_days ?? 0), sub: "above baseline" },
            { label: "Medication adherence", val: loading ? "—" : `${insights?.adherence_pct ?? 0}%`, sub: "this month" },
            { label: "Take Action", val: loading ? "—" : (insights?.actionable_val ?? "Stable"), sub: insights?.actionable_sub ?? "" },
          ].map(s => (
            <div key={s.label} style={{ background: theme.surface, borderRadius: "12px", padding: "14px 16px", border: `1px solid ${theme.border}` }}>
              <p style={{ fontSize: "11px", color: theme.textLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px 0" }}>{s.label}</p>
              <p style={{ fontSize: "22px", fontWeight: 700, color: theme.accent, margin: 0 }}>{s.val}</p>
              <p style={{ fontSize: "11px", color: theme.textMuted, margin: "4px 0 0 0" }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Chart analysis area — selected chart stretches to fill */}
        <div style={{ flex: 1, minHeight: 0, background: theme.surface, borderRadius: "12px", padding: "14px 18px", border: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {selectedChart ? (
            <div style={{ flex: 1, minHeight: 0, width: "100%" }}>
              {renderChartContent(selectedChart, true)}
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: theme.textMuted, fontSize: "13px", textAlign: "center" }}>
              Select a chart from the dropdown to analyze
            </div>
          )}
        </div>
      </div>

      {/* History modal — visual calendar */}
      {historyOpen && (() => {
        const h = dashboard?.history || {};
        const symptomLogs = h.symptom_logs || [];
        const adherence = h.adherence || [];
        const appointments = h.appointments || [];
        const calendar = h.calendar || [];
        const getHeat = (v) => {
          if (!v || v === 0) return "transparent";
          if (v >= 7) return theme.danger;
          if (v >= 5) return theme.warning;
          if (v >= 3) return theme.accentLight;
          return "#FDE8D8";
        };
        const toDateKey = (s) => (s ? String(s).split("T")[0].split(" ")[0].slice(0, 10) : "");
        const byDate = {};
        symptomLogs.forEach((sl) => {
          const k = toDateKey(sl.logged_at);
          if (!byDate[k]) byDate[k] = { symptoms: [], adherence: [], appointments: [], calendar: [] };
          byDate[k].symptoms.push(sl);
        });
        adherence.forEach((a) => {
          const k = toDateKey(a.logged_date);
          if (!byDate[k]) byDate[k] = { symptoms: [], adherence: [], appointments: [], calendar: [] };
          byDate[k].adherence.push(a);
        });
        appointments.forEach((a) => {
          const k = toDateKey(a.scheduled_at);
          if (!byDate[k]) byDate[k] = { symptoms: [], adherence: [], appointments: [], calendar: [] };
          byDate[k].appointments.push(a);
        });
        calendar.forEach((ev) => {
          const k = toDateKey(ev.event_at);
          if (!byDate[k]) byDate[k] = { symptoms: [], adherence: [], appointments: [], calendar: [] };
          byDate[k].calendar.push(ev);
        });
        const { year, month } = historyMonth;
        const first = new Date(year, month, 1);
        const last = new Date(year, month + 1, 0);
        const daysInMonth = last.getDate();
        const startOffset = first.getDay();
        const days = [];
        for (let i = 0; i < startOffset; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);
        const monthName = first.toLocaleDateString("en-US", { month: "long", year: "numeric" });
        const prevMonth = () => setHistoryMonth((m) => (m.month === 0 ? { year: m.year - 1, month: 11 } : { ...m, month: m.month - 1 }));
        const nextMonth = () => setHistoryMonth((m) => (m.month === 11 ? { year: m.year + 1, month: 0 } : { ...m, month: m.month + 1 }));
        const fmtTime = (s) => s ? new Date(s.replace("Z", "")).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
        const dayData = (d) => {
          const k = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          return byDate[k] || { symptoms: [], adherence: [], appointments: [], calendar: [] };
        };
        const maxSev = (arr) => Math.max(0, ...arr.map((s) => parseInt(s.severity, 10) || 0));
        const selectedData = selectedDay ? dayData(selectedDay) : null;
        return (
          <div
            onClick={() => { setHistoryOpen(false); setSelectedDay(null); }}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000,
              display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: theme.surface, borderRadius: "16px", border: `1px solid ${theme.border}`,
                width: "min(98vw, 1000px)", height: "min(96vh, 860px)", minWidth: 420, minHeight: 560,
                overflow: "hidden", display: "flex", flexDirection: "column",
                boxShadow: "0 12px 40px rgba(0,0,0,0.15)", flexShrink: 0,
              }}
            >
              <div style={{ flexShrink: 0, padding: "14px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontWeight: 700, fontSize: "18px", color: theme.accent, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <ion-icon name="book-outline" style={{ fontSize: "22px" }} /> History
                </p>
                <button onClick={() => { setHistoryOpen(false); setSelectedDay(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, lineHeight: 1, padding: "4px", display: "flex", alignItems: "center" }}>
                  <ion-icon name="close" style={{ fontSize: "24px" }} />
                </button>
              </div>
              <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column", padding: "16px 20px", overflow: "hidden" }}>
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "100px" }}>
                  <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, padding: "4px", display: "flex", alignItems: "center" }}>
                    <ion-icon name="chevron-back-outline" style={{ fontSize: "22px" }} />
                  </button>
                  <p style={{ fontWeight: 600, fontSize: "17px", margin: 0 }}>{monthName}</p>
                  <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", color: theme.textMuted, padding: "4px", display: "flex", alignItems: "center" }}>
                    <ion-icon name="chevron-forward-outline" style={{ fontSize: "22px" }} />
                  </button>
                </div>
                <div style={{ flexShrink: 0, display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "4px", marginBottom: "6px" }}>
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} style={{ textAlign: "center", fontSize: "12px", fontWeight: 600, color: theme.textLight }}>{d}</div>
                  ))}
                </div>
                <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gridTemplateRows: "repeat(6, minmax(0, 1fr))", gap: "4px" }}>
                  {days.map((d, i) => {
                    if (d === null) return <div key={i} />;
                    const data = dayData(d);
                    const sev = maxSev(data.symptoms);
                    const hasApt = data.appointments.length > 0 || data.calendar.length > 0;
                    const hasMeds = data.adherence.length > 0;
                    const missed = data.adherence.filter((a) => !a.taken).length;
                    const isSelected = selectedDay === d;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDay(selectedDay === d ? null : d)}
                        style={{
                          width: "100%", height: "100%", minHeight: 0, minWidth: 0, border: "none", borderRadius: "8px",
                          background: getHeat(sev), cursor: "pointer", padding: "2px",
                          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                          fontFamily: "inherit", fontSize: "13px", fontWeight: 600, color: sev >= 5 ? "white" : theme.text,
                          boxShadow: isSelected ? `0 0 0 2px ${theme.accent}` : "none",
                          overflow: "hidden",
                        }}
                      >
                        <span>{d}</span>
                        <span style={{ fontSize: "10px", display: "flex", gap: "1px", marginTop: "1px", flexShrink: 0 }}>
                          {hasMeds && (missed > 0
                            ? <ion-icon name="close-circle" style={{ color: theme.danger }} title="Missed med" />
                            : <ion-icon name="checkmark-circle" style={{ color: theme.success }} title="Taken" />)}
                          {hasApt && <ion-icon name="calendar-outline" style={{ color: theme.accent }} title="Appointment" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: theme.textMuted }}>Severity</span>
                    {[
                      { c: "transparent", label: "None" },
                      { c: "#FDE8D8", label: "1–2" },
                      { c: theme.accentLight, label: "3–4" },
                      { c: theme.warning, label: "5–6" },
                      { c: theme.danger, label: "7+" },
                    ].map(({ c, label }, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                        <div style={{ width: "12px", height: "12px", borderRadius: "2px", background: c, border: c === "transparent" ? `1px solid ${theme.border}` : "none", flexShrink: 0 }} title={label} />
                        <span style={{ fontSize: "14px", color: theme.textLight }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", color: theme.textMuted }}>
                      <ion-icon name="checkmark-circle" style={{ color: theme.success, fontSize: "14px" }} /> medication taken
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", color: theme.textMuted }}>
                      <ion-icon name="close-circle" style={{ color: theme.danger, fontSize: "14px" }} /> medication missed
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "14px", color: theme.textMuted }}>
                      <ion-icon name="calendar-outline" style={{ color: theme.accent, fontSize: "14px" }} /> appointment
                    </span>
                  </div>
                </div>
              </div>
              {/* Day details — fixed strip at bottom */}
              <div style={{
                flexShrink: 0, minWidth: 0, background: theme.surfaceWarm, borderTop: `1px solid ${theme.border}`,
                padding: "10px 20px", minHeight: "48px", overflow: "hidden",
                display: "flex", flexDirection: "column", gap: "6px",
              }}>
                {selectedData && selectedDay ? (
                  <>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: theme.textMuted, margin: 0 }}>
                      {new Date(year, month, selectedDay).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {(selectedData.symptoms.length > 0 || selectedData.adherence.length > 0 || selectedData.appointments.length > 0 || selectedData.calendar.length > 0) ? (
                      <div style={{ display: "flex", flexDirection: "row", gap: "24px", minWidth: 0, flexWrap: "nowrap" }}>
                        {selectedData.symptoms.length > 0 && (
                          <div style={{ flex: "1 1 0", minWidth: 0 }}>
                            {selectedData.symptoms.map((sl, i) => {
                              const sym = sl.symptoms;
                              const name = (Array.isArray(sym) && sym[0]?.name) || sym?.name || "Symptom";
                              return (
                                <div key={i} style={{ fontSize: "14px", marginBottom: "2px", display: "flex", alignItems: "flex-start", gap: "6px", minWidth: 0 }}>
                                  <span style={{ overflowWrap: "break-word", wordBreak: "break-word" }}><span style={{ color: theme.accent, fontWeight: 600 }}>{name}</span> {sl.severity}/10{sl.notes ? ` — ${sl.notes}` : ""}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {selectedData.adherence.length > 0 && (
                          <div style={{ flex: "1 1 0", minWidth: 0 }}>
                            {selectedData.adherence.map((a, i) => (
                              <div key={i} style={{ fontSize: "14px", marginBottom: "2px", display: "flex", alignItems: "flex-start", gap: "6px", minWidth: 0 }}>{a.taken
                                  ? <ion-icon name="checkmark-circle" style={{ color: theme.success, fontSize: "14px", flexShrink: 0 }} />
                                  : <ion-icon name="close-circle" style={{ color: theme.danger, fontSize: "14px", flexShrink: 0 }} />}
                                <span style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>{a.medications?.name || "Med"}{a.notes ? ` — ${a.notes}` : ""}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {(selectedData.appointments.length > 0 || selectedData.calendar.length > 0) && (
                          <div style={{ flex: "1 1 0", minWidth: 0 }}>
                            {selectedData.appointments.map((a, i) => (
                              <div key={`apt-${i}`} style={{ fontSize: "14px", marginBottom: "2px", display: "flex", alignItems: "flex-start", gap: "6px", minWidth: 0 }}><ion-icon name="calendar-outline" style={{ color: theme.accent, fontSize: "12px", flexShrink: 0 }} />
                                <span style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>{fmtTime(a.scheduled_at)} — {a.physician || ""} {a.visit_type || ""}</span>
                              </div>
                            ))}
                            {selectedData.calendar.map((ev, i) => (
                              <div key={`cal-${i}`} style={{ fontSize: "14px", marginBottom: "2px", display: "flex", alignItems: "flex-start", gap: "6px", minWidth: 0 }}><ion-icon name="calendar-outline" style={{ color: theme.accent, fontSize: "12px", flexShrink: 0 }} />
                                <span style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>{ev.title || ""} {ev.event_type ? `(${ev.event_type})` : ""}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: "14px", color: theme.textMuted, margin: 0 }}>No entries for this day</p>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: "14px", color: theme.textMuted, margin: 0 }}>Click a day to view details</p>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Right: Patient chatbot with chart dropup */}
      <div style={{
        flex: "0 0 380px",
        background: theme.surface,
        borderRadius: "16px",
        border: `1px solid ${theme.border}`,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        minHeight: 0,
        alignSelf: "stretch",
      }}>
        <div style={{ padding: "14px 16px", borderBottom: `1px solid ${theme.border}` }}>
          <p style={{ fontWeight: 700, fontSize: "15px", color: theme.accent }}>✦ Patient Chatbot</p>
          <p style={{ fontSize: "13px", color: theme.textMuted, marginTop: "2px" }}>Specialized for {patient.name}</p>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {chatMessages.map((m, i) => {
            const displayText = m.typing
              ? (m.fullText || "").slice(0, typingIndex[i] ?? 0)
              : (m.text || "");
            return (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "90%", padding: "8px 12px",
                  borderRadius: m.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                  background: m.role === "user" ? theme.accent : theme.accentMuted,
                  color: m.role === "user" ? "white" : theme.text,
                  fontSize: "14px", lineHeight: "1.5",
                }}>
                  {displayText}
                  {m.typing && <span style={{ animation: "blink 0.8s step-end infinite", marginLeft: "1px" }}>▌</span>}
                </div>
              </div>
            );
          })}
          {chatLoading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{
                padding: "8px 12px", borderRadius: "12px 12px 12px 4px",
                background: theme.accentMuted, color: theme.textMuted, fontSize: "14px",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <span style={{ display: "flex", gap: "2px" }}>
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: theme.accent, animation: "pulse 0.6s ease-in-out infinite" }} />
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: theme.accent, animation: "pulse 0.6s ease-in-out 0.2s infinite" }} />
                  <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: theme.accent, animation: "pulse 0.6s ease-in-out 0.4s infinite" }} />
                </span>
                Thinking...
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: "10px 14px", borderTop: `1px solid ${theme.border}`, position: "relative" }} ref={dropupRef}>
          {/* Chart dropup */}
          <div style={{ marginBottom: "10px" }}>
            <button
              onClick={() => setChartDropupOpen(!chartDropupOpen)}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: "8px", border: `1.5px solid ${theme.border}`,
                background: theme.surfaceWarm, fontSize: "12px", fontFamily: "inherit", cursor: "pointer",
                color: theme.textMuted, display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ion-icon name="bar-chart-outline" style={{ fontSize: "16px", color: theme.accent }} />
                Select chart to analyze
              </span>
              <span style={{ fontSize: "10px" }}>▲</span>
            </button>
            {chartDropupOpen && (
              <div style={{
                position: "absolute", bottom: "100%", left: 14, right: 14, marginBottom: "4px",
                background: theme.surface, borderRadius: "8px", border: `1px solid ${theme.border}`,
                boxShadow: "0 -4px 12px rgba(0,0,0,0.08)", overflow: "hidden", zIndex: 10,
              }}>
                {CHART_OPTIONS.map((opt, idx, arr) => (
                  <button
                    key={opt.id}
                    onClick={() => selectChartForAnalysis(opt.id)}
                    style={{
                      width: "100%", padding: "10px 14px", border: "none", background: "transparent",
                      fontSize: "12px", fontFamily: "inherit", cursor: "pointer", textAlign: "left",
                      color: theme.text, borderBottom: idx < arr.length - 1 ? `1px solid ${theme.border}` : "none",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "6px", marginBottom: "8px", flexWrap: "wrap" }}>
            {chatSuggestions.map(s => (
              <button key={s} onClick={() => sendChat(s)} style={{
                padding: "4px 8px", borderRadius: "12px", border: `1px solid ${theme.border}`,
                background: "transparent", fontSize: "12px", cursor: "pointer",
                color: theme.textMuted, fontFamily: "inherit",
              }}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChat(chatInput);
                }
              }}
              placeholder="Ask about this patient..."
              rows={1}
              style={{
                flex: 1, padding: "8px 12px", borderRadius: "8px",
                border: `1.5px solid ${theme.border}`, fontSize: "14px",
                fontFamily: "inherit", outline: "none", background: theme.surfaceWarm,
                resize: "none", minHeight: "38px", maxHeight: "120px", overflowY: "auto", lineHeight: "1.4",
              }}
            />
            <button onClick={() => sendChat(chatInput)} style={{
              padding: "8px 14px", borderRadius: "8px", background: theme.accent,
              color: "white", border: "none", cursor: "pointer", fontWeight: 600, fontFamily: "inherit", fontSize: "12px",
            }}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
