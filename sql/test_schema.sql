-- Test queries for hackrare2026 schema
-- Run these in Supabase SQL Editor to validate schema and sample data

-- 1. Patients (dropdown source)
SELECT p.id, p.name, d.name AS disease
FROM patients p
LEFT JOIN diseases d ON p.disease_id = d.id;

-- 2. John Harvard - Full patient node (meds, appointments, symptom logs, calendar)
SELECT
  p.name AS patient,
  d.name AS disease,
  m.name AS medication,
  m.dosage,
  m.frequency,
  s.name AS medication_for_symptom
FROM patients p
LEFT JOIN diseases d ON p.disease_id = d.id
LEFT JOIN medications m ON m.patient_id = p.id
LEFT JOIN symptoms s ON m.symptom_id = s.id
WHERE p.name = 'John Harvard';

SELECT mal.logged_date, mal.taken, mal.notes, m.name AS medication
FROM medication_adherence_logs mal
JOIN medications m ON mal.medication_id = m.id
WHERE m.patient_id = 'b2c3d4e5-0000-0000-0000-000000000001'
ORDER BY mal.logged_date DESC
LIMIT 14;

SELECT scheduled_at, physician, visit_type, notes
FROM appointments
WHERE patient_id = 'b2c3d4e5-0000-0000-0000-000000000001'
ORDER BY scheduled_at;

SELECT sl.logged_at, s.name AS symptom, sl.severity, sl.notes, sl.curated_by
FROM symptom_logs sl
JOIN symptoms s ON sl.symptom_id = s.id
WHERE sl.patient_id = 'b2c3d4e5-0000-0000-0000-000000000001'
ORDER BY sl.logged_at DESC;

SELECT event_at, title, description, event_type
FROM calendar_events
WHERE patient_id = 'b2c3d4e5-0000-0000-0000-000000000001'
ORDER BY event_at;

SELECT s.name AS symptom, t.physician, t.treatment, t.worked
FROM treatments t
JOIN symptoms s ON t.symptom_id = s.id
JOIN diseases d ON s.disease_id = d.id
WHERE d.name = 'Huntington''s Disease' AND s.name = 'Muscle Spasm' AND t.worked = TRUE;
