-- Match: never show admin accounts as peer candidates.

CREATE OR REPLACE FUNCTION public.list_match_candidates()
RETURNS SETOF jsonb
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
  SELECT jsonb_build_object(
    'user_id', p.user_id,
    'username', p.username,
    'nombres', p.nombres,
    'apellidos', p.apellidos,
    'universidad', p.universidad,
    'carrera', p.carrera,
    'ciclo_academico', p.ciclo_academico,
    'bio', p.bio,
    'linkedin_url', p.linkedin_url,
    'plan', COALESCE(m.plan, 'ni_free'),
    'level', COALESCE(m.level, 0),
    'interest_ids', COALESCE(
      (
        SELECT jsonb_agg(ui.interest_id ORDER BY ui.interest_id)
        FROM public.user_interests ui
        WHERE ui.user_id = p.user_id
      ),
      '[]'::jsonb
    )
  )
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
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = p.user_id
        AND ur.role = 'admin'
    )
  ORDER BY p.updated_at DESC
  LIMIT 500;
END;
$$;

COMMENT ON FUNCTION public.list_match_candidates() IS
  'Authenticated Match catalog as jsonb rows. Excludes caller and admins. Never returns email/WhatsApp.';

REVOKE ALL ON FUNCTION public.list_match_candidates() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_match_candidates() TO authenticated;

NOTIFY pgrst, 'reload schema';
