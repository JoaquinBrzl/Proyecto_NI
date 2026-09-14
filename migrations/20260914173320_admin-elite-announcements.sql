-- Admin panel: announcement images + Elite review without instant membership +
-- activate_elite_membership (payment demo) + list_elite_applications_admin.

-- ---------------------------------------------------------------------------
-- Announcements: image columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_key TEXT;

COMMENT ON COLUMN public.announcements.image_url IS
  'Public URL of announcement image (jpeg/png/webp; client validates ≤2MB).';
COMMENT ON COLUMN public.announcements.image_key IS
  'Storage object key in announcement-images bucket (for delete/replace).';

-- ---------------------------------------------------------------------------
-- Storage: public-read announcement images; admin write
-- Bucket itself is created via CLI (storage create-bucket announcement-images).
-- ---------------------------------------------------------------------------
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON storage.objects TO authenticated;

DROP POLICY IF EXISTS announcement_images_public_select ON storage.objects;
CREATE POLICY announcement_images_public_select ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket = 'announcement-images');

DROP POLICY IF EXISTS announcement_images_admin_insert ON storage.objects;
CREATE POLICY announcement_images_admin_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket = 'announcement-images'
    AND (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS announcement_images_admin_update ON storage.objects;
CREATE POLICY announcement_images_admin_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket = 'announcement-images'
    AND (SELECT public.is_admin())
  )
  WITH CHECK (
    bucket = 'announcement-images'
    AND (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS announcement_images_admin_delete ON storage.objects;
CREATE POLICY announcement_images_admin_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket = 'announcement-images'
    AND (SELECT public.is_admin())
  );

-- ---------------------------------------------------------------------------
-- Memberships.source: allow elite_payment_demo
-- ---------------------------------------------------------------------------
ALTER TABLE public.memberships DROP CONSTRAINT IF EXISTS memberships_source_check;

ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_source_check
  CHECK (source IN (
    'signup',
    'pro_placeholder',
    'elite_approval',
    'elite_payment_demo',
    'admin'
  ));

COMMENT ON COLUMN public.memberships.source IS
  'signup=Free trigger; pro_placeholder=simulated Pro; elite_approval=legacy admin grant; elite_payment_demo=user activates after approval (no Stripe); admin=manual';

-- Allow authenticated users to insert Elite only via activate_elite_membership
-- (source = elite_payment_demo). SECURITY DEFINER RPC still runs with JWT set.
CREATE OR REPLACE FUNCTION public.guard_membership_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'cannot create membership for another user';
  END IF;

  IF (NEW.plan = 'ni_elite' OR NEW.level = 2)
     AND NEW.source IS DISTINCT FROM 'elite_payment_demo' THEN
    RAISE EXCEPTION 'NI Elite cannot be self-assigned; apply, get approval, then activate payment demo';
  END IF;

  IF NEW.plan = 'ni_pro' AND NEW.source IS DISTINCT FROM 'pro_placeholder' THEN
    RAISE EXCEPTION 'use activate_pro_membership() for Pro upgrades';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- review_elite_application: approve/reject status only (no membership grant)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_elite_application(
  p_application_id uuid,
  p_decision text
)
RETURNS public.elite_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  app public.elite_applications;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'only admins can review elite applications';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'decision must be approved or rejected';
  END IF;

  SELECT * INTO app
  FROM public.elite_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'elite application not found';
  END IF;

  IF app.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'application is not pending';
  END IF;

  UPDATE public.elite_applications
  SET
    status = p_decision,
    reviewed_at = now(),
    reviewed_by = auth.uid()
  WHERE id = p_application_id
  RETURNING * INTO app;

  RETURN app;
END;
$$;

COMMENT ON FUNCTION public.review_elite_application(uuid, text) IS
  'Admin-only: approve|reject pending Elite application. Approve enables payment demo; does not grant membership.';

-- ---------------------------------------------------------------------------
-- activate_elite_membership: user with approved application activates Elite
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_elite_membership()
RETURNS public.memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
  current_level int;
  approved_app uuid;
  row_out public.memberships;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT COALESCE(
    (
      SELECT m.level
      FROM public.memberships m
      WHERE m.user_id = uid
        AND m.status = 'active'
        AND (m.ends_at IS NULL OR m.ends_at > now())
      ORDER BY m.level DESC, m.starts_at DESC
      LIMIT 1
    ),
    0
  ) INTO current_level;

  IF current_level >= 2 THEN
    SELECT m.* INTO row_out
    FROM public.memberships m
    WHERE m.user_id = uid
      AND m.status = 'active'
      AND m.level = 2
      AND (m.ends_at IS NULL OR m.ends_at > now())
    ORDER BY m.starts_at DESC
    LIMIT 1;
    RETURN row_out;
  END IF;

  SELECT ea.id INTO approved_app
  FROM public.elite_applications ea
  WHERE ea.user_id = uid
    AND ea.status = 'approved'
  ORDER BY ea.reviewed_at DESC NULLS LAST, ea.created_at DESC
  LIMIT 1;

  IF approved_app IS NULL THEN
    RAISE EXCEPTION 'no approved elite application';
  END IF;

  UPDATE public.memberships
  SET status = 'canceled', ends_at = COALESCE(ends_at, now())
  WHERE user_id = uid
    AND status = 'active'
    AND level < 2
    AND (ends_at IS NULL OR ends_at > now());

  INSERT INTO public.memberships (user_id, plan, level, status, starts_at, source)
  VALUES (uid, 'ni_elite', 2, 'active', now(), 'elite_payment_demo')
  RETURNING * INTO row_out;

  RETURN row_out;
END;
$$;

COMMENT ON FUNCTION public.activate_elite_membership() IS
  'PLACEHOLDER: user with approved Elite application activates ni_elite (no Stripe).';

GRANT EXECUTE ON FUNCTION public.activate_elite_membership() TO authenticated;

-- ---------------------------------------------------------------------------
-- list_elite_applications_admin: profiles + auth.users email
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_elite_applications_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  status text,
  message text,
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
  'Admin-only: elite applications with profile names and auth email.';

GRANT EXECUTE ON FUNCTION public.list_elite_applications_admin() TO authenticated;
