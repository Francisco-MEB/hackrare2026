"""
dashboard.py — Compute dashboard metrics from patient data.

Used by API to serve dynamic physician dashboard: insights, adherence by week, etc.
"""

from datetime import datetime, timedelta
from collections import defaultdict

from .patient_context import fetch_patient_data


def _parse_date(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def _norm_date(s: str | None) -> str:
    """Extract YYYY-MM-DD for comparison."""
    if not s:
        return ""
    s = str(s).split("T")[0].split(" ")[0]
    return s[:10] if len(s) >= 10 else s


def _norm_taken(v) -> bool:
    """Normalize PostgreSQL boolean (t/f, true/false, 1/0)."""
    if v is True or v == 1 or str(v).lower() in ("t", "true", "1", "yes"):
        return True
    return False


def compute_insights(data: dict) -> dict:
    """
    Compute flare days (30d), medication adherence %, and actionable trend.
    """
    now = datetime.utcnow()
    cutoff_30 = (now - timedelta(days=30)).date().isoformat()

    flare_days = 0
    flare_dates = set()
    for sl in data.get("symptom_logs", []):
        logged = sl.get("logged_at")
        dt = _parse_date(logged)
        if not dt:
            continue
        day_str = dt.date().isoformat()
        if day_str < cutoff_30:
            continue
        sev = sl.get("severity")
        try:
            sev_int = int(sev) if sev is not None else 0
        except (ValueError, TypeError):
            sev_int = 0
        if sev_int > 4:
            flare_dates.add(day_str)
    flare_days = len(flare_dates)

    # Adherence: % of logs where taken=True in last 30 days
    adherence_logs = [
        a for a in data.get("adherence", [])
        if _norm_date(a.get("logged_date")) >= cutoff_30
    ]
    total = len(adherence_logs)
    taken = sum(1 for a in adherence_logs if _norm_taken(a.get("taken")))
    adherence_pct = round((taken / total * 100) if total else 0)

    # Actionable: most recent symptom with severity > 4, or "Stable"
    sl_sorted = sorted(
        data.get("symptom_logs", []),
        key=lambda x: x.get("logged_at", "") or "",
        reverse=True,
    )
    actionable_val = "Stable"
    actionable_sub = "no concerning trends"
    for sl in sl_sorted[:5]:
        try:
            sev = int(sl.get("severity") or 0)
        except (ValueError, TypeError):
            sev = 0
        if sev > 4:
            sym = sl.get("symptoms")
            if isinstance(sym, list) and sym:
                sym_name = sym[0].get("name", "Symptom")
            elif isinstance(sym, dict):
                sym_name = sym.get("name", "Symptom")
            else:
                sym_name = "Symptom"
            logged = sl.get("logged_at", "")
            dt = _parse_date(logged)
            date_str = dt.strftime("%b %d") if dt else ""
            actionable_val = f"↑ {sym_name}"
            actionable_sub = f"severity {sev}/10" + (f" since {date_str}" if date_str else "")
            break

    return {
        "flare_days": flare_days,
        "adherence_pct": adherence_pct,
        "actionable_val": actionable_val,
        "actionable_sub": actionable_sub,
    }


def compute_adherence_by_week(data: dict) -> list[dict]:
    """
    Group adherence by week (W1, W2, ...) and return % taken per week.
    """
    logs = data.get("adherence", [])
    if not logs:
        return [{"week": f"W{i}", "adherence": 0} for i in range(1, 5)]

    # Group by week (ISO week)
    week_counts: dict[str, list[bool]] = defaultdict(list)
    for a in logs:
        d = a.get("logged_date")
        if not d:
            continue
        try:
            date_part = str(d).split("T")[0].split(" ")[0][:10]
            dt = datetime.fromisoformat(date_part)
            week_key = dt.strftime("%Y-W%W")
            week_counts[week_key].append(_norm_taken(a.get("taken")))
        except (ValueError, TypeError):
            continue

    # Get last 4 weeks, ordered
    sorted_weeks = sorted(week_counts.keys(), reverse=True)[:4]
    sorted_weeks.reverse()

    result = []
    for i, wk in enumerate(sorted_weeks, start=1):
        vals = week_counts[wk]
        pct = round((sum(vals) / len(vals) * 100) if vals else 0)
        result.append({"week": f"W{i}", "adherence": pct})

    # Pad to 4 weeks if fewer
    while len(result) < 4:
        result.append({"week": f"W{len(result) + 1}", "adherence": 0})

    return result[:4]


def _symptom_names_from_logs(logs: list) -> list[str]:
    """Extract unique symptom names from symptom_logs."""
    names = set()
    for sl in logs:
        sym = sl.get("symptoms")
        if isinstance(sym, dict):
            n = sym.get("name")
        elif isinstance(sym, list) and sym:
            n = sym[0].get("name") if isinstance(sym[0], dict) else None
        else:
            n = None
        if n:
            names.add(n)
    return sorted(names)


def compute_symptom_severity_trend(data: dict) -> tuple[list[dict], list[str]]:
    """
    Severity over time for line chart — one point per day (max severity), sorted by date.
    """
    logs = data.get("symptom_logs", [])
    by_date: dict[str, list[int]] = defaultdict(list)
    for sl in logs:
        logged = sl.get("logged_at")
        dt = _parse_date(logged)
        if not dt:
            continue
        try:
            sev = int(sl.get("severity") or 0)
        except (ValueError, TypeError):
            sev = 0
        by_date[dt.date().isoformat()].append(sev)
    # One point per day: use max severity
    points = []
    for d, sevs in by_date.items():
        try:
            ts = datetime.fromisoformat(d).date()
        except (ValueError, TypeError):
            continue
        points.append({"date": d, "severity": max(sevs), "_ts": ts})
    points.sort(key=lambda x: x["_ts"])
    result = [{"date": p["_ts"].strftime("%b %d"), "severity": p["severity"]} for p in points[-14:]]
    symptom_names = _symptom_names_from_logs(logs)
    return result, symptom_names


def compute_flare_days_by_week(data: dict) -> list[dict]:
    """
    Count of days with severity > 4 per week (bar chart).
    """
    logs = data.get("symptom_logs", [])
    week_flare_dates: dict[str, set[str]] = defaultdict(set)
    for sl in logs:
        logged = sl.get("logged_at")
        dt = _parse_date(logged)
        if not dt:
            continue
        try:
            sev = int(sl.get("severity") or 0)
        except (ValueError, TypeError):
            sev = 0
        if sev <= 4:
            continue
        week_key = dt.strftime("%Y-W%W")
        week_flare_dates[week_key].add(dt.date().isoformat())
    sorted_weeks = sorted(week_flare_dates.keys(), reverse=True)[:4]
    sorted_weeks.reverse()
    result = [{"week": f"W{i}", "flareDays": len(week_flare_dates[wk])} for i, wk in enumerate(sorted_weeks, 1)]
    while len(result) < 4:
        result.append({"week": f"W{len(result) + 1}", "flareDays": 0})
    return result[:4]


def compute_symptom_frequency_by_week(data: dict) -> list[dict]:
    """
    Count of symptom log entries per week (bar chart).
    """
    logs = data.get("symptom_logs", [])
    week_counts: dict[str, int] = defaultdict(int)
    for sl in logs:
        logged = sl.get("logged_at")
        dt = _parse_date(logged)
        if not dt:
            continue
        week_key = dt.strftime("%Y-W%W")
        week_counts[week_key] += 1
    sorted_weeks = sorted(week_counts.keys(), reverse=True)[:4]
    sorted_weeks.reverse()
    result = [{"week": f"W{i}", "count": week_counts[wk]} for i, wk in enumerate(sorted_weeks, 1)]
    while len(result) < 4:
        result.append({"week": f"W{len(result) + 1}", "count": 0})
    return result[:4]


def get_dashboard_data(patient_id: str) -> dict:
    """
    Fetch patient data and compute all dashboard metrics.
    Returns dict suitable for API response.
    """
    data = fetch_patient_data(patient_id)
    patient = data.get("patient") or {}
    disease = data.get("disease") or {}
    insights = compute_insights(data)
    adherence_by_week = compute_adherence_by_week(data)
    symptom_severity_trend, symptom_names = compute_symptom_severity_trend(data)
    flare_days_by_week = compute_flare_days_by_week(data)
    symptom_frequency_by_week = compute_symptom_frequency_by_week(data)

    return {
        "patient": {
            "id": patient.get("id"),
            "name": patient.get("name", "Unknown"),
            "condition": disease.get("name", "Unknown"),
        },
        "insights": insights,
        "adherence_by_week": adherence_by_week,
        "symptom_severity_trend": symptom_severity_trend,
        "symptom_names": symptom_names,
        "flare_days_by_week": flare_days_by_week,
        "symptom_frequency_by_week": symptom_frequency_by_week,
        "raw": data,
    }
