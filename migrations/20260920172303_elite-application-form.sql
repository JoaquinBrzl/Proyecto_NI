-- Elite application form payload (structured answers for postulación).

ALTER TABLE public.elite_applications
  ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.elite_applications.answers IS
  'Structured form answers from postular-elite.html (motivation, goals, topics, etc.).';

COMMENT ON COLUMN public.elite_applications.message IS
  'Human-readable summary of the application (also derived from answers).';

NOTIFY pgrst, 'reload schema';
