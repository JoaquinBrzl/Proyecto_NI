-- Workshops (talleres): public published list; admin full CRUD on talleres.html.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  short_description TEXT NOT NULL,
  speaker TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  modality TEXT NOT NULL
    CHECK (modality IN ('virtual', 'presencial', 'hibrido')),
  location TEXT,
  virtual_url TEXT,
  required_membership_level INT NOT NULL DEFAULT 0
    CHECK (required_membership_level IN (0, 1, 2)),
  capacity INT NOT NULL CHECK (capacity > 0),
  registration_deadline TIMESTAMPTZ NOT NULL,
  recording_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workshops_ends_after_starts CHECK (ends_at >= starts_at)
);

CREATE INDEX IF NOT EXISTS idx_workshops_status_starts_at
  ON public.workshops (status, starts_at ASC);

CREATE INDEX IF NOT EXISTS idx_workshops_modality
  ON public.workshops (modality);

CREATE INDEX IF NOT EXISTS idx_workshops_required_level
  ON public.workshops (required_membership_level);

CREATE TRIGGER workshops_updated_at
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- ---------------------------------------------------------------------------
-- Protect created_by (immutable after insert)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_workshop_created_by_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'created_by cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER workshops_guard_created_by
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_workshop_created_by_change();

-- ---------------------------------------------------------------------------
-- RLS + privileges
-- ---------------------------------------------------------------------------
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.workshops FROM anon, authenticated;

GRANT SELECT ON public.workshops TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.workshops TO authenticated;

CREATE POLICY workshops_select_published_or_admin ON public.workshops
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    OR (SELECT public.is_admin())
  );

CREATE POLICY workshops_insert_admin ON public.workshops
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    AND created_by = (SELECT auth.uid())
  );

CREATE POLICY workshops_update_admin ON public.workshops
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY workshops_delete_admin ON public.workshops
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- ---------------------------------------------------------------------------
-- Seed (only when at least one auth.users row exists)
-- ---------------------------------------------------------------------------
INSERT INTO public.workshops (
  title,
  short_description,
  speaker,
  starts_at,
  ends_at,
  modality,
  location,
  virtual_url,
  required_membership_level,
  capacity,
  registration_deadline,
  recording_url,
  status,
  created_by
)
SELECT
  v.title,
  v.short_description,
  v.speaker,
  v.starts_at,
  v.ends_at,
  v.modality,
  v.location,
  v.virtual_url,
  v.required_membership_level,
  v.capacity,
  v.registration_deadline,
  v.recording_url,
  v.status,
  u.id
FROM (
  VALUES
    (
      'Kickoff: perfil NI y networking',
      'Aprende a completar tu perfil y conectar con peers de tu carrera.',
      'Ana Torres',
      now() + interval '3 days',
      now() + interval '3 days' + interval '2 hours',
      'virtual',
      NULL,
      'https://meet.gruponi.example/kickoff',
      0,
      80,
      now() + interval '2 days',
      NULL,
      'published'
    ),
    (
      'Pitch deck en 90 minutos',
      'Estructura un pitch claro: problema, solución, mercado y CTA.',
      'Luis Mendoza',
      now() + interval '7 days',
      now() + interval '7 days' + interval '90 minutes',
      'hibrido',
      'Auditorio NI — Lima',
      'https://meet.gruponi.example/pitch',
      1,
      40,
      now() + interval '6 days',
      NULL,
      'published'
    ),
    (
      'Finanzas personales para universitarios',
      'Presupuesto, ahorro y primeros pasos de inversión sin jerga.',
      'Carla Ruiz',
      now() - interval '30 minutes',
      now() + interval '90 minutes',
      'presencial',
      'Sala 204 — Campus',
      NULL,
      0,
      30,
      now() - interval '1 day',
      NULL,
      'published'
    ),
    (
      'Introducción a Product Management',
      'Roles, discovery y métricas básicas para PM junior.',
      'Diego Salas',
      now() - interval '10 days',
      now() - interval '10 days' + interval '2 hours',
      'virtual',
      NULL,
      'https://meet.gruponi.example/pm',
      1,
      50,
      now() - interval '12 days',
      'https://gruponi.example/recordings/pm-intro',
      'published'
    ),
    (
      'Design thinking applied',
      'Workshop práctico de empatía, ideación y prototipo rápido.',
      'María Paredes',
      now() + interval '14 days',
      now() + interval '14 days' + interval '3 hours',
      'presencial',
      NULL,
      NULL,
      0,
      25,
      now() + interval '12 days',
      NULL,
      'published'
    ),
    (
      'Elite masterclass: fundraising',
      'Sesión avanzada sobre round seed y storytelling para inversores.',
      'Roberto Vega',
      now() + interval '21 days',
      now() + interval '21 days' + interval '2 hours',
      'hibrido',
      'Hub Innovation',
      'https://meet.gruponi.example/fundraising',
      2,
      20,
      now() + interval '18 days',
      NULL,
      'published'
    ),
    (
      'Git y colaboración en equipo',
      'Branches, PRs y flujo de trabajo para proyectos académicos.',
      'Sofía Quispe',
      now() - interval '2 days',
      now() - interval '2 days' + interval '2 hours',
      'virtual',
      NULL,
      'https://meet.gruponi.example/git',
      0,
      60,
      now() - interval '4 days',
      NULL,
      'published'
    ),
    (
      'Borrador: taller interno de prueba',
      'Solo visible para admins mientras esté en borrador.',
      'Equipo NI',
      now() + interval '30 days',
      now() + interval '30 days' + interval '1 hour',
      'virtual',
      NULL,
      NULL,
      0,
      10,
      now() + interval '25 days',
      NULL,
      'draft'
    )
) AS v(
  title,
  short_description,
  speaker,
  starts_at,
  ends_at,
  modality,
  location,
  virtual_url,
  required_membership_level,
  capacity,
  registration_deadline,
  recording_url,
  status
)
CROSS JOIN LATERAL (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
) u
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);
