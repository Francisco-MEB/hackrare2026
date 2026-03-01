/**
 * API client for the physician backend.
 * Uses /api prefix (proxied by Vite to FastAPI).
 */

const BASE = '/api';

async function fetchApi(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export async function getPatients() {
  const data = await fetchApi('/patients');
  return data.patients || [];
}

export async function getPatientDashboard(patientId) {
  return fetchApi(`/patients/${patientId}/dashboard`);
}

export async function getPatientSummary(patientId) {
  return fetchApi(`/patients/${patientId}/summary`);
}

export async function getPatientInterpretation(patientId) {
  return fetchApi(`/patients/${patientId}/interpretation`);
}

export async function chat(patientId, question) {
  const data = await fetchApi('/chat', {
    method: 'POST',
    body: JSON.stringify({ patient_id: patientId, question }),
  });
  return data.answer;
}
