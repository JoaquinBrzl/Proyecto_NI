-- Return structured answers in admin elite list for consistent detail UI.

DROP FUNCTION IF EXISTS public.list_elite_applications_admin();

CREATE OR REPLACE FUNCTION public.list_elite_applications_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  status text,
  message text,
  answers jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  email text,
  nombres text,
  apellidos text,
  universidad text,
  carrera text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'only admins can list elite applications';
  END IF;

  RETURN QUERY
  SELECT
    ea.id,
    ea.user_id,
    ea.status,
    ea.message,
    COALESCE(ea.answers, '{}'::jsonb) AS answers,
    ea.created_at,
    ea.updated_at,
    ea.reviewed_at,
    ea.reviewed_by,
    u.email::text,
    COALESCE(p.nombres, '')::text,
    COALESCE(p.apellidos, '')::text,
    COALESCE(p.universidad, '')::text,
    COALESCE(p.carrera, '')::text
  FROM public.elite_applications ea
  JOIN auth.users u ON u.id = ea.user_id
  LEFT JOIN public.profiles p ON p.user_id = ea.user_id
  ORDER BY ea.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.list_elite_applications_admin() IS
  'Admin-only: elite applications with profile names, auth email, and form answers.';

GRANT EXECUTE ON FUNCTION public.list_elite_applications_admin() TO authenticated;

NOTIFY pgrst, 'reload schema';
