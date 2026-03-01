-- Change symptom_logs severity from 0-5 to 1-10
-- Run in Supabase SQL Editor if you already have symptom_logs

ALTER TABLE symptom_logs DROP CONSTRAINT IF EXISTS symptom_logs_severity_check;
ALTER TABLE symptom_logs ADD CONSTRAINT symptom_logs_severity_check CHECK (severity >= 1 AND severity <= 10);
