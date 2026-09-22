-- Membership: voucher stays pending until admin approves;
-- activation lasts 30 days; admin can deactivate; expire past-due rows.

-- ---------------------------------------------------------------------------
-- submit: pending only (no auto-activate)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_membership_payment(
  p_plan text,
  p_method text,
  p_operation_number text
)
RETURNS public.membership_payment_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
  quote jsonb;
  op text;
  row_out public.membership_payment_submissions;
  discount_uuid uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_method NOT IN ('yape', 'plin', 'transfer') THEN
    RAISE EXCEPTION 'method must be yape, plin, or transfer';
  END IF;

  op := trim(both FROM coalesce(p_operation_number, ''));
  IF length(op) < 4 OR length(op) > 64 THEN
    RAISE EXCEPTION 'operation number must be 4–64 characters';
  END IF;

  quote := public.get_membership_payment_quote(p_plan);

  IF (quote->>'has_pending')::boolean IS TRUE THEN
    RAISE EXCEPTION 'already have a pending payment submission';
  END IF;

  discount_uuid := NULLIF(quote #>> '{discount,id}', '')::uuid;

  INSERT INTO public.membership_payment_submissions (
    user_id,
    plan,
    method,
    operation_number,
    list_price_pen,
    discount_pen,
    amount_pen,
    discount_id,
    status
  )
  VALUES (
    uid,
    p_plan,
    p_method,
    op,
    (quote->>'list_price_pen')::numeric,
    (quote->>'discount_pen')::numeric,
    (quote->>'amount_pen')::numeric,
    discount_uuid,
    'pending'
  )
  RETURNING * INTO row_out;

  RETURN row_out;
END;
$$;

COMMENT ON FUNCTION public.submit_membership_payment(text, text, text) IS
  'Authenticated: create pending voucher; admin must approve to activate.';

-- ---------------------------------------------------------------------------
-- Activate with 30-day window
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._activate_membership_from_payment(
  p_user_id uuid,
  p_plan text
)
RETURNS public.memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  row_out public.memberships;
  target_level int;
  period_end timestamptz := now() + interval '30 days';
BEGIN
  IF p_plan = 'ni_pro' THEN
    target_level := 1;
  ELSIF p_plan = 'ni_elite' THEN
    target_level := 2;
  ELSE
    RAISE EXCEPTION 'invalid plan';
  END IF;

  UPDATE public.memberships
  SET status = 'canceled', ends_at = COALESCE(ends_at, now())
  WHERE user_id = p_user_id
    AND status = 'active'
    AND level < target_level
    AND (ends_at IS NULL OR ends_at > now());

  IF target_level = 2 THEN
    UPDATE public.memberships
    SET status = 'canceled', ends_at = COALESCE(ends_at, now())
    WHERE user_id = p_user_id
      AND status = 'active'
      AND level = 1
      AND (ends_at IS NULL OR ends_at > now());
  END IF;

  -- Cancel any same-level active paid membership before inserting renewal
  UPDATE public.memberships
  SET status = 'canceled', ends_at = COALESCE(ends_at, now())
  WHERE user_id = p_user_id
    AND status = 'active'
    AND level = target_level
    AND (ends_at IS NULL OR ends_at > now());

  INSERT INTO public.memberships (user_id, plan, level, status, starts_at, ends_at, source)
  VALUES (p_user_id, p_plan, target_level, 'active', now(), period_end, 'membership_payment')
  RETURNING * INTO row_out;

  RETURN row_out;
END;
$$;

-- ---------------------------------------------------------------------------
-- Mark expired memberships (ends_at passed)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_past_due_memberships()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  n int;
BEGIN
  UPDATE public.memberships
  SET status = 'expired'
  WHERE status = 'active'
    AND ends_at IS NOT NULL
    AND ends_at <= now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_past_due_memberships() TO authenticated;

-- Call expiry before quote / level checks via wrapping get_membership_payment_quote
CREATE OR REPLACE FUNCTION public.get_membership_payment_quote(p_plan text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
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

-- ---------------------------------------------------------------------------
-- Admin deactivate membership
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.deactivate_membership_admin(p_membership_id uuid)
RETURNS public.memberships
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  row_out public.memberships;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'only admins can deactivate memberships';
  END IF;

  UPDATE public.memberships
  SET
    status = 'canceled',
    ends_at = LEAST(COALESCE(ends_at, now()), now())
  WHERE id = p_membership_id
    AND status = 'active'
  RETURNING * INTO row_out;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'active membership not found';
  END IF;

  RETURN row_out;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deactivate_membership_admin(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin list active paid memberships (Pro/Elite)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_active_memberships_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  plan text,
  level int,
  status text,
  starts_at timestamptz,
  ends_at timestamptz,
  source text,
  email text,
  nombres text,
  apellidos text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'only admins can list memberships';
  END IF;

  PERFORM public.expire_past_due_memberships();

  RETURN QUERY
  SELECT
    m.id,
    m.user_id,
    m.plan,
    m.level,
    m.status,
    m.starts_at,
    m.ends_at,
    m.source,
    au.email::text,
    COALESCE(p.nombres, '')::text,
    COALESCE(p.apellidos, '')::text
  FROM public.memberships m
  LEFT JOIN auth.users au ON au.id = m.user_id
  LEFT JOIN public.profiles p ON p.user_id = m.user_id
  WHERE m.level >= 1
    AND m.status = 'active'
    AND (m.ends_at IS NULL OR m.ends_at > now())
  ORDER BY m.starts_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_active_memberships_admin() TO authenticated;

COMMENT ON FUNCTION public.deactivate_membership_admin(uuid) IS
  'Admin: cancel an active Pro/Elite membership immediately.';
COMMENT ON FUNCTION public.list_active_memberships_admin() IS
  'Admin: list active paid memberships (expires past-due first).';
COMMENT ON FUNCTION public.expire_past_due_memberships() IS
  'Marks active memberships with ends_at <= now() as expired.';
