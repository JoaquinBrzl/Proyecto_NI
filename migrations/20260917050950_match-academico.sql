-- Match Académico: public LinkedIn on profiles + candidate list with plan (SECURITY DEFINER).
-- Email / WhatsApp stay private and are never returned by this RPC.

-- ---------------------------------------------------------------------------
-- profiles.linkedin_url (public contact channel for Match "Conectar")
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.profiles.linkedin_url IS
  'Public LinkedIn profile URL used by Match Académico Conectar CTA.';

-- ---------------------------------------------------------------------------
-- list_match_candidates: authenticated peers for Match (excludes caller)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_match_candidates()
RETURNS TABLE (
  user_id uuid,
  username text,
  nombres text,
  apellidos text,
  universidad text,
  carrera text,
  ciclo_academico text,
  bio text,
  linkedin_url text,
  plan text,
  level int,
  interest_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.username,
    p.nombres,
    p.apellidos,
    p.universidad,
    p.carrera,
    p.ciclo_academico,
    p.bio,
    p.linkedin_url,
    COALESCE(m.plan, 'ni_free')::text AS plan,
    COALESCE(m.level, 0)::int AS level,
    COALESCE(
      (
        SELECT array_agg(ui.interest_id ORDER BY ui.interest_id)
        FROM public.user_interests ui
        WHERE ui.user_id = p.user_id
      ),
      ARRAY[]::uuid[]
    ) AS interest_ids
  FROM public.profiles p
  LEFT JOIN LATERAL (
    SELECT mem.plan, mem.level
    FROM public.memberships mem
    WHERE mem.user_id = p.user_id
      AND mem.status = 'active'
      AND (mem.ends_at IS NULL OR mem.ends_at > now())
    ORDER BY mem.level DESC, mem.starts_at DESC
    LIMIT 1
  ) m ON true
  WHERE p.user_id IS DISTINCT FROM uid
  ORDER BY p.updated_at DESC
  LIMIT 500;
END;
$$;

COMMENT ON FUNCTION public.list_match_candidates() IS
  'Authenticated Match catalog: public profile fields + interest ids + active membership plan. Excludes caller. Never returns email/WhatsApp.';

REVOKE ALL ON FUNCTION public.list_match_candidates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_match_candidates() TO authenticated;
