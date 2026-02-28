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
    disease_id UUID REFERENCES diseases(id) ON DELETE CASCADE,
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

INSERT INTO treatments (disease_id, physician, treatment, worked) VALUES
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Dr. Potts', 'Tetrabenazine', TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Dr. Bae', 'Tetrabenazine', TRUE),
  ('a1b2c3d4-0000-0000-0000-000000000001', 'Dr. Miller', 'Deutetrabenazine', TRUE);

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB
);

CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops);