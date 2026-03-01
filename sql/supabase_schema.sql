CREATE TABLE diseases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE symptoms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disease_id UUID REFERENCES diseases(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

CREATE TABLE treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symptom_id UUID REFERENCES symptoms(id) ON DELETE CASCADE,
    physician TEXT NOT NULL,
    treatment TEXT NOT NULL,
    worked BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO diseases (id, name) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Huntington''s Disease');

INSERT INTO symptoms (disease_id, name) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Muscle Spasm'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Headache'),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Insomnia');

INSERT INTO treatments (symptom_id, physician, treatment, worked)
SELECT s.id, 'Dr. Potts', 'Tetrabenazine', TRUE
FROM symptoms s JOIN diseases d ON s.disease_id = d.id
WHERE d.name = 'Huntington''s Disease' AND s.name = 'Muscle Spasm';

INSERT INTO treatments (symptom_id, physician, treatment, worked)
SELECT s.id, 'Dr. Bae', 'Tetrabenazine', TRUE
FROM symptoms s JOIN diseases d ON s.disease_id = d.id
WHERE d.name = 'Huntington''s Disease' AND s.name = 'Muscle Spasm';

INSERT INTO treatments (symptom_id, physician, treatment, worked)
SELECT s.id, 'Dr. Meier', 'Tetrabenazine', TRUE
FROM symptoms s JOIN diseases d ON s.disease_id = d.id
WHERE d.name = 'Huntington''s Disease' AND s.name = 'Muscle Spasm';

INSERT INTO treatments (symptom_id, physician, treatment, worked)
SELECT s.id, 'Dr. Browdy', 'Deutetrabenazine', TRUE
FROM symptoms s JOIN diseases d ON s.disease_id = d.id
WHERE d.name = 'Huntington''s Disease' AND s.name = 'Muscle Spasm';

INSERT INTO treatments (symptom_id, physician, treatment, worked)
SELECT s.id, 'Dr. Browdy', 'Deutetrabenazine', TRUE
FROM symptoms s JOIN diseases d ON s.disease_id = d.id
WHERE d.name = 'Huntington''s Disease' AND s.name = 'Muscle Spasm';

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB
);

CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);