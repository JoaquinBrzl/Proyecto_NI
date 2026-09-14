-- Grupo NI membership plans catalog, Pro placeholder upgrade, Elite applications + RLS.
-- Extends identity-core memberships; does not change Free-on-signup trigger.

-- ---------------------------------------------------------------------------
-- Catalog: membership_plans
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_plans (
  slug TEXT PRIMARY KEY CHECK (slug IN ('ni_free', 'ni_pro', 'ni_elite')),
  name TEXT NOT NULL,
  level INT NOT NULL CHECK (level IN (0, 1, 2)),
  price_monthly_pen NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (price_monthly_pen >= 0),
  currency TEXT NOT NULL DEFAULT 'PEN',
  tagline TEXT NOT NULL DEFAULT '',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT membership_plans_slug_level_match CHECK (
    (slug = 'ni_free' AND level = 0)
    OR (slug = 'ni_pro' AND level = 1)
    OR (slug = 'ni_elite' AND level = 2)
  )
);

INSERT INTO public.membership_plans (slug, name, level, price_monthly_pen, currency, tagline, features, sort_order)
VALUES
  (
    'ni_free',
    'NI Free',
    0,
    0,
    'PEN',
    'Acceso base a la comunidad',
    '["Perfil en Grupo NI","Acceso a anuncios públicos","Recursos básicos"]'::jsonb,
    10
  ),
  (
    'ni_pro',
    'NI Pro',
    1,
    30,
    'PEN',
    'Membresía mensual Pro',
    '["Todo lo de Free","Talleres y recursos Pro","Prioridad en networking"]'::jsonb,
    20
  ),
  (
    'ni_elite',
    'NI Elite',
    2,
    50,
    'PEN',
    'Solo por postulación y aprobación',
    '["Todo lo de Pro","Acceso Elite","Mentoría y exclusivos"]'::jsonb,
    30
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  level = EXCLUDED.level,
  price_monthly_pen = EXCLUDED.price_monthly_pen,
  currency = EXCLUDED.currency,
  tagline = EXCLUDED.tagline,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  active = true;

-- Link existing memberships.plan to catalog (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_plan_fk'
  ) THEN
    ALTER TABLE public.memberships
      ADD CONSTRAINT memberships_plan_fk
      FOREIGN KEY (plan) REFERENCES public.membership_plans(slug);
  END IF;
END $$;

-- Audit source for how a membership row was created
ALTER TABLE public.memberships
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'signup'
  CHECK (source IN ('signup', 'pro_placeholder', 'elite_approval', 'admin'));

COMMENT ON COLUMN public.memberships.source IS
  'signup=Free trigger; pro_placeholder=simulated Pro (no payment gateway); elite_approval=admin grant after application; admin=manual CLI/admin';

-- ---------------------------------------------------------------------------
-- Elite applications (postulaciones)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.elite_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_elite_applications_user_id
  ON public.elite_applications (user_id);

CREATE INDEX IF NOT EXISTS idx_elite_applications_status
  ON public.elite_applications (status);

-- At most one pending application per user
CREATE UNIQUE INDEX IF NOT EXISTS elite_applications_one_pending_uidx
  ON public.elite_applications (user_id)
  WHERE status = 'pending';

CREATE TRIGGER elite_applications_updated_at
  BEFORE UPDATE ON public.elite_applications
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

CREATE OR REPLACE FUNCTION public.prevent_elite_application_user_id_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'user_id cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER elite_applications_guard_user_id
  BEFORE UPDATE ON public.elite_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_elite_application_user_id_change();

-- Users must insert only pending rows for themselves
CREATE OR REPLACE FUNCTION public.guard_elite_application_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'elite applications must start as pending';
  END IF;
  IF auth.uid() IS NOT NULL
     AND NEW.user_id IS DISTINCT FROM auth.uid()
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'cannot create elite application for another user';
  END IF;
  NEW.reviewed_at := NULL;
  NEW.reviewed_by := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER elite_applications_guard_insert
  BEFORE INSERT ON public.elite_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_elite_application_insert();

-- Block non-admin status changes on direct UPDATE (defense in depth)
CREATE OR REPLACE FUNCTION public.guard_elite_application_status_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND auth.uid() IS NOT NULL
     AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'only admins can change elite application status';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER elite_applications_guard_status
  BEFORE UPDATE ON public.elite_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_elite_application_status_update();

-- ---------------------------------------------------------------------------
-- Block client self-insert of Elite (and non-own rows) on memberships
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_membership_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Trusted paths (signup trigger / SECURITY DEFINER RPCs) run without JWT
  -- or as admin; still allow admin JWT.
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'cannot create membership for another user';
  END IF;

  IF NEW.plan = 'ni_elite' OR NEW.level = 2 THEN
    RAISE EXCEPTION 'NI Elite cannot be self-assigned; apply and wait for admin approval';
  END IF;

  IF NEW.plan = 'ni_pro' AND NEW.source IS DISTINCT FROM 'pro_placeholder' THEN
    RAISE EXCEPTION 'use activate_pro_membership() for Pro upgrades';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS memberships_guard_insert ON public.memberships;
CREATE TRIGGER memberships_guard_insert
  BEFORE INSERT ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_membership_insert();

-- ---------------------------------------------------------------------------
-- RPCs: Pro placeholder + Elite review (admin)
-- ---------------------------------------------------------------------------

-- Payment is NOT integrated. This simulates a successful Pro upgrade.
CREATE OR REPLACE FUNCTION public.activate_pro_membership()
RETURNS public.memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
  current_level int;
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

  IF current_level >= 1 THEN
    SELECT m.* INTO row_out
    FROM public.memberships m
    WHERE m.user_id = uid
      AND m.status = 'active'
      AND m.level = 1
      AND (m.ends_at IS NULL OR m.ends_at > now())
    ORDER BY m.starts_at DESC
    LIMIT 1;
    RETURN row_out;
  END IF;

  INSERT INTO public.memberships (user_id, plan, level, status, starts_at, source)
  VALUES (uid, 'ni_pro', 1, 'active', now(), 'pro_placeholder')
  RETURNING * INTO row_out;

  RETURN row_out;
END;
$$;

COMMENT ON FUNCTION public.activate_pro_membership() IS
  'PLACEHOLDER: simulates Pro payment (S/30). No Stripe/gateway. Replace with real checkout later.';

-- Admin approves or rejects a pending Elite application.
-- On approve, grants active NI Elite membership (users cannot do this themselves).
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

  IF p_decision = 'approved' THEN
    -- Expire lower active plans so Elite is clearly current
    UPDATE public.memberships
    SET status = 'canceled', ends_at = COALESCE(ends_at, now())
    WHERE user_id = app.user_id
      AND status = 'active'
      AND level < 2
      AND (ends_at IS NULL OR ends_at > now());

    INSERT INTO public.memberships (user_id, plan, level, status, starts_at, source)
    VALUES (app.user_id, 'ni_elite', 2, 'active', now(), 'elite_approval');
  END IF;

  RETURN app;
END;
$$;

COMMENT ON FUNCTION public.review_elite_application(uuid, text) IS
  'Admin-only: approve|reject pending Elite application; approve grants ni_elite membership.';

GRANT EXECUTE ON FUNCTION public.activate_pro_membership() TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_elite_application(uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS + privileges
-- ---------------------------------------------------------------------------
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elite_applications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.membership_plans FROM anon, authenticated;
REVOKE ALL ON public.elite_applications FROM anon, authenticated;

-- Plans catalog: public read
GRANT SELECT ON public.membership_plans TO anon, authenticated;

CREATE POLICY membership_plans_select_active ON public.membership_plans
  FOR SELECT TO anon, authenticated
  USING (active = true OR (SELECT public.is_admin()));

-- Memberships: keep SELECT; allow no direct client INSERT of Elite.
-- Pro goes through activate_pro_membership(); Elite via review_elite_application().
-- Admins may INSERT/UPDATE via policies for manual ops from the app.
GRANT INSERT, UPDATE ON public.memberships TO authenticated;

CREATE POLICY memberships_insert_admin ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY memberships_update_admin ON public.memberships
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Elite applications: own select/insert; admin select/update (status via RPC preferred)
GRANT SELECT, INSERT ON public.elite_applications TO authenticated;
GRANT UPDATE ON public.elite_applications TO authenticated;

CREATE POLICY elite_applications_select_own_or_admin ON public.elite_applications
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

CREATE POLICY elite_applications_insert_own ON public.elite_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'pending'
  );

CREATE POLICY elite_applications_update_admin ON public.elite_applications
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));
