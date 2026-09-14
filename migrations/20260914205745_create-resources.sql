-- Biblioteca de Recursos: metadata + download log + private storage policies.
-- Files live in private bucket resource-files; delivery via Edge Function signed URL.

-- ---------------------------------------------------------------------------
-- Table: resources
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL
    CHECK (category IN (
      'comercio_internacional',
      'empleabilidad',
      'logistica',
      'finanzas',
      'marketing',
      'tecnologia',
      'otros'
    )),
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_ext TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT NOT NULL CHECK (size_bytes >= 0),
  required_membership_level INT NOT NULL DEFAULT 0
    CHECK (required_membership_level IN (0, 1, 2)),
  download_count INT NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resources_status_created_at
  ON public.resources (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resources_category
  ON public.resources (category);

CREATE INDEX IF NOT EXISTS idx_resources_required_level
  ON public.resources (required_membership_level);

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_resource_created_by_change()
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

CREATE TRIGGER resources_guard_created_by
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_resource_created_by_change();

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.resources FROM anon, authenticated;

GRANT SELECT ON public.resources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.resources TO authenticated;

CREATE POLICY resources_select_published_or_admin ON public.resources
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    OR (SELECT public.is_admin())
  );

CREATE POLICY resources_insert_admin ON public.resources
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.is_admin())
    AND created_by = (SELECT auth.uid())
  );

CREATE POLICY resources_update_admin ON public.resources
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY resources_delete_admin ON public.resources
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- ---------------------------------------------------------------------------
-- Table: resource_downloads (log)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_downloads_resource
  ON public.resource_downloads (resource_id);

CREATE INDEX IF NOT EXISTS idx_resource_downloads_user
  ON public.resource_downloads (user_id);

CREATE INDEX IF NOT EXISTS idx_resource_downloads_created
  ON public.resource_downloads (created_at DESC);

ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.resource_downloads FROM anon, authenticated;

GRANT SELECT ON public.resource_downloads TO authenticated;
-- Inserts go through claim_resource_download() SECURITY DEFINER.

CREATE POLICY resource_downloads_select_own_or_admin ON public.resource_downloads
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- Storage policies: private bucket resource-files (no public SELECT)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS resource_files_admin_insert ON storage.objects;
CREATE POLICY resource_files_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket = 'resource-files'
    AND (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS resource_files_admin_update ON storage.objects;
CREATE POLICY resource_files_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket = 'resource-files'
    AND (SELECT public.is_admin())
  )
  WITH CHECK (
    bucket = 'resource-files'
    AND (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS resource_files_admin_delete ON storage.objects;
CREATE POLICY resource_files_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket = 'resource-files'
    AND (SELECT public.is_admin())
  );

-- Admins need SELECT to mint signed URLs / replace files from the browser.
DROP POLICY IF EXISTS resource_files_admin_select ON storage.objects;
CREATE POLICY resource_files_admin_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket = 'resource-files'
    AND (SELECT public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- claim_resource_download: auth + membership + log + return file meta
-- (called by Edge Function; file_key never returned to the browser)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_resource_download(p_resource_id uuid)
RETURNS TABLE (
  file_key text,
  file_name text,
  mime_type text,
  download_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
  r public.resources;
  user_level int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO r
  FROM public.resources
  WHERE id = p_resource_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resource not found' USING ERRCODE = 'P0002';
  END IF;

  IF r.status IS DISTINCT FROM 'published' THEN
    RAISE EXCEPTION 'Resource not available' USING ERRCODE = '42501';
  END IF;

  user_level := COALESCE((SELECT public.membership_level()), 0);
  IF user_level < r.required_membership_level THEN
    RAISE EXCEPTION 'Membership required' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.resource_downloads (resource_id, user_id)
  VALUES (r.id, uid);

  UPDATE public.resources
  SET download_count = download_count + 1
  WHERE id = r.id
  RETURNING resources.download_count INTO r.download_count;

  RETURN QUERY
  SELECT r.file_key, r.file_name, r.mime_type, r.download_count;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_resource_download(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_resource_download(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Optional admin download list
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_resource_downloads_admin(
  p_resource_id uuid DEFAULT NULL,
  p_limit int DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  resource_id uuid,
  user_id uuid,
  created_at timestamptz,
  resource_title text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF NOT (SELECT public.is_admin()) THEN
    RAISE EXCEPTION 'Forbidden: admin only' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    d.id,
    d.resource_id,
    d.user_id,
    d.created_at,
    r.title,
    u.email
  FROM public.resource_downloads d
  JOIN public.resources r ON r.id = d.resource_id
  LEFT JOIN auth.users u ON u.id = d.user_id
  WHERE p_resource_id IS NULL OR d.resource_id = p_resource_id
  ORDER BY d.created_at DESC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 500));
END;
$$;

REVOKE ALL ON FUNCTION public.list_resource_downloads_admin(uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_resource_downloads_admin(uuid, int) TO authenticated;
