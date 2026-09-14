-- Workshop enrollments, private recordings, images, and access RPCs.

-- ---------------------------------------------------------------------------
-- Workshops: image + has_recording flag (URL lives in private table)
-- ---------------------------------------------------------------------------
ALTER TABLE public.workshops
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_key TEXT,
  ADD COLUMN IF NOT EXISTS has_recording BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.workshops.image_url IS
  'Public URL of workshop card image (jpeg/png/webp; client validates ≤2MB).';
COMMENT ON COLUMN public.workshops.image_key IS
  'Storage object key in workshop-images bucket.';
COMMENT ON COLUMN public.workshops.has_recording IS
  'True when a recording URL exists in workshop_recordings (URL never exposed via SELECT).';

-- ---------------------------------------------------------------------------
-- Private recordings (no direct SELECT for anon/authenticated)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workshop_recordings (
  workshop_id UUID PRIMARY KEY REFERENCES public.workshops(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workshop_recordings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workshop_recordings FROM anon, authenticated;

-- Migrate any existing recording_url values, then drop the public column
INSERT INTO public.workshop_recordings (workshop_id, url)
SELECT id, recording_url
FROM public.workshops
WHERE recording_url IS NOT NULL AND btrim(recording_url) <> ''
ON CONFLICT (workshop_id) DO UPDATE SET url = EXCLUDED.url, updated_at = now();

UPDATE public.workshops w
SET has_recording = EXISTS (
  SELECT 1 FROM public.workshop_recordings r WHERE r.workshop_id = w.id
);

ALTER TABLE public.workshops DROP COLUMN IF EXISTS recording_url;

CREATE OR REPLACE FUNCTION public.sync_workshop_has_recording()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.workshops SET has_recording = false WHERE id = OLD.workshop_id;
    RETURN OLD;
  END IF;
  UPDATE public.workshops SET has_recording = true WHERE id = NEW.workshop_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS workshop_recordings_sync_flag ON public.workshop_recordings;
CREATE TRIGGER workshop_recordings_sync_flag
  AFTER INSERT OR UPDATE OR DELETE ON public.workshop_recordings
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_workshop_has_recording();

-- ---------------------------------------------------------------------------
-- Enrollments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workshop_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id UUID NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workshop_enrollments_unique_user UNIQUE (workshop_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workshop_enrollments_workshop
  ON public.workshop_enrollments (workshop_id);

CREATE INDEX IF NOT EXISTS idx_workshop_enrollments_user
  ON public.workshop_enrollments (user_id);

ALTER TABLE public.workshop_enrollments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.workshop_enrollments FROM anon, authenticated;
GRANT SELECT, INSERT ON public.workshop_enrollments TO authenticated;

CREATE POLICY workshop_enrollments_select_own_or_admin ON public.workshop_enrollments
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

-- Inserts go through enroll_in_workshop() SECURITY DEFINER; no direct INSERT policy for users.
-- Admins may still need SELECT only; enrollment via RPC.

-- ---------------------------------------------------------------------------
-- Storage policies: workshop-images
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS workshop_images_public_select ON storage.objects;
CREATE POLICY workshop_images_public_select ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket = 'workshop-images');

DROP POLICY IF EXISTS workshop_images_admin_insert ON storage.objects;
CREATE POLICY workshop_images_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket = 'workshop-images'
    AND (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS workshop_images_admin_update ON storage.objects;
CREATE POLICY workshop_images_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket = 'workshop-images'
    AND (SELECT public.is_admin())
  )
  WITH CHECK (
    bucket = 'workshop-images'
    AND (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS workshop_images_admin_delete ON storage.objects;
CREATE POLICY workshop_images_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket = 'workshop-images'
    AND (SELECT public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- enroll_in_workshop
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enroll_in_workshop(p_workshop_id uuid)
RETURNS public.workshop_enrollments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
  w public.workshops;
  taken int;
  row_out public.workshop_enrollments;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO w FROM public.workshops WHERE id = p_workshop_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'workshop not found';
  END IF;

  IF w.status IS DISTINCT FROM 'published' THEN
    RAISE EXCEPTION 'workshop is not published';
  END IF;

  IF now() > w.registration_deadline THEN
    RAISE EXCEPTION 'registration closed';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.workshop_enrollments e
    WHERE e.workshop_id = p_workshop_id AND e.user_id = uid
  ) THEN
    RAISE EXCEPTION 'already enrolled';
  END IF;

  SELECT count(*)::int INTO taken
  FROM public.workshop_enrollments e
  WHERE e.workshop_id = p_workshop_id;

  IF taken >= w.capacity THEN
    RAISE EXCEPTION 'workshop is full';
  END IF;

  INSERT INTO public.workshop_enrollments (workshop_id, user_id)
  VALUES (p_workshop_id, uid)
  RETURNING * INTO row_out;

  RETURN row_out;
END;
$$;

COMMENT ON FUNCTION public.enroll_in_workshop(uuid) IS
  'Enroll current user if published, registration open, seats available, not duplicate.';

GRANT EXECUTE ON FUNCTION public.enroll_in_workshop(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- get_workshop_recording_access — never returns URL without checks
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_workshop_recording_access(p_workshop_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
  w public.workshops;
  rec_url text;
  enrolled boolean;
  lvl int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('access', 'unauthenticated', 'url', null);
  END IF;

  SELECT * INTO w FROM public.workshops WHERE id = p_workshop_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('access', 'not_found', 'url', null);
  END IF;

  IF w.ends_at > now() THEN
    RETURN jsonb_build_object('access', 'not_ended', 'url', null);
  END IF;

  SELECT r.url INTO rec_url
  FROM public.workshop_recordings r
  WHERE r.workshop_id = p_workshop_id;

  IF rec_url IS NULL OR btrim(rec_url) = '' THEN
    RETURN jsonb_build_object('access', 'locked_no_recording', 'url', null);
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.workshop_enrollments e
    WHERE e.workshop_id = p_workshop_id AND e.user_id = uid
  ) INTO enrolled;

  IF NOT enrolled THEN
    RETURN jsonb_build_object('access', 'locked_not_enrolled', 'url', null);
  END IF;

  lvl := public.membership_level();
  IF lvl < COALESCE(w.required_membership_level, 0) THEN
    RETURN jsonb_build_object('access', 'locked_membership', 'url', null);
  END IF;

  RETURN jsonb_build_object('access', 'enabled', 'url', rec_url);
END;
$$;

COMMENT ON FUNCTION public.get_workshop_recording_access(uuid) IS
  'Returns recording URL only if enrolled, membership ok, workshop ended, and URL exists.';

GRANT EXECUTE ON FUNCTION public.get_workshop_recording_access(uuid) TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- Admin: set / clear recording URL
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_workshop_recording(p_workshop_id uuid, p_url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'only admins can set workshop recordings';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.workshops WHERE id = p_workshop_id) THEN
    RAISE EXCEPTION 'workshop not found';
  END IF;

  IF p_url IS NULL OR btrim(p_url) = '' THEN
    DELETE FROM public.workshop_recordings WHERE workshop_id = p_workshop_id;
    RETURN false;
  END IF;

  INSERT INTO public.workshop_recordings (workshop_id, url)
  VALUES (p_workshop_id, btrim(p_url))
  ON CONFLICT (workshop_id) DO UPDATE
    SET url = EXCLUDED.url, updated_at = now();

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_workshop_recording(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_workshop_recording_admin(p_workshop_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  rec_url text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RAISE EXCEPTION 'only admins can read workshop recording urls';
  END IF;
  SELECT r.url INTO rec_url FROM public.workshop_recordings r WHERE r.workshop_id = p_workshop_id;
  RETURN rec_url;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_workshop_recording_admin(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Helper: enrollment counts + my enrollments for a page of workshops
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_workshop_enrollment_stats(p_ids uuid[])
RETURNS TABLE (
  workshop_id uuid,
  seats_taken int,
  i_am_enrolled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  RETURN QUERY
  SELECT
    w.id AS workshop_id,
    COALESCE((
      SELECT count(*)::int FROM public.workshop_enrollments e WHERE e.workshop_id = w.id
    ), 0) AS seats_taken,
    CASE
      WHEN uid IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM public.workshop_enrollments e
        WHERE e.workshop_id = w.id AND e.user_id = uid
      )
    END AS i_am_enrolled
  FROM public.workshops w
  WHERE w.id = ANY (p_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_workshop_enrollment_stats(uuid[]) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Admin list enrollments (like elite applications)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_workshop_enrollments_admin()
RETURNS TABLE (
  id uuid,
  workshop_id uuid,
  workshop_title text,
  user_id uuid,
  email text,
  nombres text,
  apellidos text,
  universidad text,
  carrera text,
  created_at timestamptz
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
    RAISE EXCEPTION 'only admins can list workshop enrollments';
  END IF;

  RETURN QUERY
  SELECT
    e.id,
    e.workshop_id,
    w.title::text AS workshop_title,
    e.user_id,
    u.email::text,
    COALESCE(p.nombres, '')::text,
    COALESCE(p.apellidos, '')::text,
    COALESCE(p.universidad, '')::text,
    COALESCE(p.carrera, '')::text,
    e.created_at
  FROM public.workshop_enrollments e
  JOIN public.workshops w ON w.id = e.workshop_id
  JOIN auth.users u ON u.id = e.user_id
  LEFT JOIN public.profiles p ON p.user_id = e.user_id
  ORDER BY e.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_workshop_enrollments_admin() TO authenticated;
