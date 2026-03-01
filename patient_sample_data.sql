CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    disease_id UUID REFERENCES diseases(id) ON DELETE SET NULL
);

CREATE TABLE medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    symptom_id UUID REFERENCES symptoms(id) ON DELETE SET NULL,
    prescribed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE medication_adherence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
    logged_date DATE NOT NULL,
    taken BOOLEAN NOT NULL,
    notes TEXT
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    physician TEXT NOT NULL,
    visit_type TEXT,
    notes TEXT
);

CREATE TABLE symptom_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    symptom_id UUID REFERENCES symptoms(id) ON DELETE CASCADE,
    logged_at TIMESTAMPTZ NOT NULL,
    severity TEXT,
    notes TEXT,
    curated_by TEXT
);

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    event_at TIMESTAMPTZ NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT
);

-- EXAMPLE: John Harvard; Huntington's Disease

INSERT INTO patients (id, name, disease_id) VALUES
  ('b2c3d4e5-0000-0000-0000-000000000001', 'John Harvard', 'a1b2c3d4-0000-0000-0000-000000000001');

INSERT INTO medications (patient_id, name, dosage, frequency, symptom_id)
SELECT 'b2c3d4e5-0000-0000-0000-000000000001', 'Valbenazine', '40mg', 'once a day', s.id
FROM symptoms s
JOIN diseases d ON s.disease_id = d.id
WHERE d.name = 'Huntington''s Disease' AND s.name = 'Muscle Spasm';

INSERT INTO medication_adherence_logs (medication_id, logged_date, taken, notes)
SELECT m.id, d::date, taken, notes
FROM medications m
CROSS JOIN (
    VALUES
        ('2026-02-15'::date, TRUE, NULL),
        ('2026-02-16'::date, TRUE, NULL),
        ('2026-02-17'::date, FALSE, 'Forgot morning dose'),
        ('2026-02-18'::date, TRUE, NULL),
        ('2026-02-19'::date, TRUE, NULL),
        ('2026-02-20'::date, TRUE, NULL),
        ('2026-02-21'::date, FALSE, NULL),
        ('2026-02-22'::date, TRUE, NULL),
        ('2026-02-23'::date, TRUE, NULL),
        ('2026-02-24'::date, TRUE, NULL),
        ('2026-02-25'::date, TRUE, NULL),
        ('2026-02-26'::date, FALSE, 'Traveling'),
        ('2026-02-27'::date, TRUE, NULL),
        ('2026-02-28'::date, TRUE, NULL)
) AS logs(d, taken, notes)
WHERE m.patient_id = 'b2c3d4e5-0000-0000-0000-000000000001' AND m.name = 'Valbenazine';

INSERT INTO appointments (patient_id, scheduled_at, physician, visit_type, notes) VALUES
  ('b2c3d4e5-0000-0000-0000-000000000001', '2026-01-15 10:00:00', 'Dr. Brigham', 'Quarterly checkup', 'Stable, continue current regimen'),
  ('b2c3d4e5-0000-0000-0000-000000000001', '2026-02-01 14:30:00', 'Dr. Brigham', 'Follow-up', 'Discuss adherence concerns'),
  ('b2c3d4e5-0000-0000-0000-000000000001', '2026-03-05 09:00:00', 'Dr. Brigham', 'Quarterly checkup', NULL),
  ('b2c3d4e5-0000-0000-0000-000000000001', '2026-04-10 11:00:00', 'Dr. Brigham', 'Follow-up', NULL);

INSERT INTO symptom_logs (patient_id, symptom_id, logged_at, severity, notes, curated_by)
SELECT 'b2c3d4e5-0000-0000-0000-000000000001', s.id, logged_at, severity, notes, curated_by
FROM symptoms s
JOIN diseases d ON s.disease_id = d.id
CROSS JOIN (
    VALUES
        ('2026-02-10 08:00:00'::timestamptz, 'moderate', 'Woke up with cramping', 'Dr. Brigham'),
        ('2026-02-15 14:00:00'::timestamptz, 'mild', 'Brief twitching after exercise', 'Dr. Brigham'),
        ('2026-02-20 09:30:00'::timestamptz, 'moderate', 'Spasm during meeting, lasted ~5 min', 'Dr. Brigham'),
        ('2026-02-25 07:00:00'::timestamptz, 'mild', NULL, 'Dr. Brigham'),
        ('2026-02-27 18:00:00'::timestamptz, 'moderate', 'Stressful day, more frequent', 'Dr. Brigham')
) AS logs(logged_at, severity, notes, curated_by)
WHERE d.name = 'Huntington''s Disease' AND s.name = 'Muscle Spasm';

INSERT INTO calendar_events (patient_id, event_at, title, description, event_type) VALUES
  ('b2c3d4e5-0000-0000-0000-000000000001', '2026-03-05 09:00:00', 'Dr. Brigham - Quarterly', 'Huntington''s checkup', 'appointment'),
  ('b2c3d4e5-0000-0000-0000-000000000001', '2026-03-12 10:00:00', 'Physical therapy', 'Weekly PT session', 'therapy'),
  ('b2c3d4e5-0000-0000-0000-000000000001', '2026-03-19 10:00:00', 'Physical therapy', 'Weekly PT session', 'therapy'),
  ('b2c3d4e5-0000-0000-0000-000000000001', '2026-03-26 10:00:00', 'Physical therapy', 'Weekly PT session', 'therapy');
