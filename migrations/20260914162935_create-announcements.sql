-- Public announcements board: published list for everyone; admin full CRUD.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL
    CHECK (category IN ('eventos', 'talleres', 'oportunidades', 'comunicados', 'recursos')),
  description TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  link_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_status_published_at
  ON public.announcements (status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_category
  ON public.announcements (category);

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- ---------------------------------------------------------------------------
-- Protect created_by (immutable after insert)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_announcement_created_by_change()
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

CREATE TRIGGER announcements_guard_created_by
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_announcement_created_by_change();

-- ---------------------------------------------------------------------------
-- RLS + privileges
-- ---------------------------------------------------------------------------
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.announcements FROM anon, authenticated;

GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.announcements TO authenticated;

-- Anyone can read published; admins can read drafts too
CREATE POLICY announcements_select_published_or_admin ON public.announcements
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    OR (SELECT public.is_admin())
  );

CREATE POLICY announcements_insert_admin ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    AND created_by = (SELECT auth.uid())
  );

CREATE POLICY announcements_update_admin ON public.announcements
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY announcements_delete_admin ON public.announcements
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- ---------------------------------------------------------------------------
-- Seed (only when at least one auth.users row exists)
-- ---------------------------------------------------------------------------
INSERT INTO public.announcements (
  title,
  category,
  description,
  published_at,
  link_url,
  status,
  created_by
)
SELECT
  v.title,
  v.category,
  v.description,
  v.published_at,
  v.link_url,
  v.status,
  u.id
FROM (
  VALUES
    (
      'Meetup de networking NI',
      'eventos',
      'Encuentro presencial para conectar con emprendedores y profesionales de la comunidad Grupo NI.',
      now() - interval '6 days',
      'https://gruponi.example/eventos/meetup-networking',
      'published'
    ),
    (
      'Taller: pitch deck en 90 minutos',
      'talleres',
      'Aprende a estructurar un pitch claro: problema, solución, mercado y llamado a la acción.',
      now() - interval '5 days',
      'https://gruponi.example/talleres/pitch-deck',
      'published'
    ),
    (
      'Prácticas abiertas en startups locales',
      'oportunidades',
      'Convocatoria de prácticas y roles junior en startups aliadas. Postula con tu perfil NI actualizado.',
      now() - interval '4 days',
      'https://gruponi.example/oportunidades/practicas',
      'published'
    ),
    (
      'Actualización de membresías NI',
      'comunicados',
      'Informamos los cambios de beneficios entre NI Free, Pro y Elite. Revisa tu plan en la página de precios.',
      now() - interval '3 days',
      'pricing-three-white.html',
      'published'
    ),
    (
      'Guía rápida: cómo completar tu perfil',
      'recursos',
      'Checklist paso a paso para que tu perfil destaque en Match y en oportunidades de la comunidad.',
      now() - interval '2 days',
      'perfil.html',
      'published'
    ),
    (
      'Demo day virtual — cupos limitados',
      'eventos',
      'Presenta tu proyecto ante mentores y peers. Inscripciones abiertas hasta agotar cupos.',
      now() - interval '1 day',
      'https://gruponi.example/eventos/demo-day',
      'published'
    ),
    (
      'Workshop de finanzas personales',
      'talleres',
      'Sesión práctica sobre presupuesto, ahorro y primeros pasos de inversión para universitarios.',
      now() - interval '12 hours',
      'https://gruponi.example/talleres/finanzas',
      'published'
    ),
    (
      'Becas y fondos para emprendedores',
      'oportunidades',
      'Listado curado de becas, fondos semilla y programas de aceleración con fechas de cierre próximas.',
      now() - interval '6 hours',
      'https://gruponi.example/oportunidades/becas',
      'published'
    )
) AS v(title, category, description, published_at, link_url, status)
CROSS JOIN LATERAL (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
) u
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1);
