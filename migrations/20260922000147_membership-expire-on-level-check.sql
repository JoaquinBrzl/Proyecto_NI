-- Expire past-due on membership_level(); fix quote volatility; backfill ends_at.

CREATE OR REPLACE FUNCTION public.membership_level()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  lvl int;
BEGIN
  PERFORM public.expire_past_due_memberships();

  SELECT COALESCE(
    (
      SELECT m.level
      FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.status = 'active'
        AND (m.ends_at IS NULL OR m.ends_at > now())
      ORDER BY m.level DESC, m.starts_at DESC
      LIMIT 1
    ),
    0
  ) INTO lvl;

  RETURN lvl;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_membership_payment_quote(p_plan text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
  current_level int;
  approved_app uuid;
  pending_id uuid;
  quote jsonb;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  PERFORM public.expire_past_due_memberships();

  IF p_plan NOT IN ('ni_pro', 'ni_elite') THEN
    RAISE EXCEPTION 'plan must be ni_pro or ni_elite';
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

  IF p_plan = 'ni_pro' AND current_level >= 1 THEN
    RAISE EXCEPTION 'already on Pro or higher';
  END IF;

  IF p_plan = 'ni_elite' THEN
    IF current_level >= 2 THEN
      RAISE EXCEPTION 'already on Elite';
    END IF;
    SELECT ea.id INTO approved_app
    FROM public.elite_applications ea
    WHERE ea.user_id = uid
      AND ea.status = 'approved'
    ORDER BY ea.reviewed_at DESC NULLS LAST, ea.created_at DESC
    LIMIT 1;
    IF approved_app IS NULL THEN
      RAISE EXCEPTION 'elite application not approved';
    END IF;
  END IF;

  SELECT mps.id INTO pending_id
  FROM public.membership_payment_submissions mps
  WHERE mps.user_id = uid
    AND mps.plan = p_plan
    AND mps.status = 'pending'
  LIMIT 1;

  quote := public._compute_membership_quote(p_plan);
  RETURN quote || jsonb_build_object(
    'pending_submission_id', pending_id,
    'has_pending', pending_id IS NOT NULL
  );
END;
$$;

-- Paid memberships without end date: give them 30 days from start (or from now if older)
UPDATE public.memberships
SET ends_at = LEAST(starts_at + interval '30 days', now() + interval '30 days')
WHERE source = 'membership_payment'
  AND status = 'active'
  AND ends_at IS NULL
  AND level >= 1;
