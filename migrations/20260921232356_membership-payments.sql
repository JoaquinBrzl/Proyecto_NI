-- Membership payments: admin-editable Yape/Plin/CCI/amounts + discounts +
-- voucher submissions (pending → admin approve activates membership).

-- ---------------------------------------------------------------------------
-- memberships.source: allow real payment path
-- ---------------------------------------------------------------------------
ALTER TABLE public.memberships DROP CONSTRAINT IF EXISTS memberships_source_check;

ALTER TABLE public.memberships
  ADD CONSTRAINT memberships_source_check
  CHECK (source IN (
    'signup',
    'pro_placeholder',
    'elite_approval',
    'elite_payment_demo',
    'membership_payment',
    'admin'
  ));

COMMENT ON COLUMN public.memberships.source IS
  'signup=Free; pro_placeholder/elite_payment_demo=legacy demos; membership_payment=voucher approved; admin=manual';

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
     AND NEW.source NOT IN ('elite_payment_demo', 'membership_payment') THEN
    RAISE EXCEPTION 'NI Elite cannot be self-assigned; apply, get approval, then pay';
  END IF;

  IF NEW.plan = 'ni_pro'
     AND NEW.source NOT IN ('pro_placeholder', 'membership_payment') THEN
    RAISE EXCEPTION 'use membership payment flow for Pro upgrades';
  END IF;

  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Settings (single-row config for payment instructions + base prices)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_payment_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  yape_number text NOT NULL DEFAULT '',
  plin_number text NOT NULL DEFAULT '',
  bank_name text NOT NULL DEFAULT '',
  account_number text NOT NULL DEFAULT '',
  cci text NOT NULL DEFAULT '',
  account_holder text NOT NULL DEFAULT '',
  pro_price_pen numeric(10, 2) NOT NULL DEFAULT 30
    CHECK (pro_price_pen >= 0),
  elite_price_pen numeric(10, 2) NOT NULL DEFAULT 50
    CHECK (elite_price_pen >= 0),
  yape_instructions text NOT NULL DEFAULT '',
  plin_instructions text NOT NULL DEFAULT '',
  transfer_instructions text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

INSERT INTO public.membership_payment_settings (
  id,
  yape_number,
  plin_number,
  bank_name,
  account_number,
  cci,
  account_holder,
  pro_price_pen,
  elite_price_pen,
  yape_instructions,
  plin_instructions,
  transfer_instructions
)
VALUES (
  1,
  '999 000 000',
  '999 000 000',
  'BCP',
  '191-0000000-0-00',
  '00219100000000000000',
  'Grupo NI',
  30,
  50,
  'Envía el monto exacto por Yape e ingresa el número de operación.',
  'Envía el monto exacto por Plin e ingresa el número de operación.',
  'Realiza la transferencia e ingresa el número de operación o referencia.'
)
ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER membership_payment_settings_updated_at
  BEFORE UPDATE ON public.membership_payment_settings
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- ---------------------------------------------------------------------------
-- Discounts (global active promo per plan; no coupon code in v1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL CHECK (plan IN ('ni_pro', 'ni_elite', 'both')),
  label text NOT NULL,
  type text NOT NULL CHECK (type IN ('percent', 'fixed')),
  value numeric(10, 2) NOT NULL CHECK (value > 0),
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT membership_discounts_percent_range CHECK (
    type <> 'percent' OR (value > 0 AND value <= 100)
  ),
  CONSTRAINT membership_discounts_window CHECK (
    starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at
  )
);

CREATE INDEX IF NOT EXISTS idx_membership_discounts_active
  ON public.membership_discounts (active, plan);

CREATE TRIGGER membership_discounts_updated_at
  BEFORE UPDATE ON public.membership_discounts
  FOR EACH ROW
  EXECUTE FUNCTION system.update_updated_at();

-- ---------------------------------------------------------------------------
-- Payment submissions (voucher / operation number)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.membership_payment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('ni_pro', 'ni_elite')),
  method text NOT NULL CHECK (method IN ('yape', 'plin', 'transfer')),
  operation_number text NOT NULL,
  list_price_pen numeric(10, 2) NOT NULL CHECK (list_price_pen >= 0),
  discount_pen numeric(10, 2) NOT NULL DEFAULT 0 CHECK (discount_pen >= 0),
  amount_pen numeric(10, 2) NOT NULL CHECK (amount_pen >= 0),
  discount_id uuid REFERENCES public.membership_discounts(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT membership_payment_submissions_amount_ok CHECK (
    amount_pen = list_price_pen - discount_pen
  )
);

CREATE INDEX IF NOT EXISTS idx_membership_payment_submissions_user
  ON public.membership_payment_submissions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_membership_payment_submissions_status
  ON public.membership_payment_submissions (status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS membership_payment_submissions_one_pending_uidx
  ON public.membership_payment_submissions (user_id, plan)
  WHERE status = 'pending';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.membership_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_payment_submissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.membership_payment_settings FROM anon, authenticated;
REVOKE ALL ON public.membership_discounts FROM anon, authenticated;
REVOKE ALL ON public.membership_payment_submissions FROM anon, authenticated;

-- Settings: authenticated read (modal); admin write via RPC preferred but allow UPDATE
GRANT SELECT ON public.membership_payment_settings TO authenticated;
GRANT UPDATE ON public.membership_payment_settings TO authenticated;

CREATE POLICY membership_payment_settings_select ON public.membership_payment_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY membership_payment_settings_update_admin ON public.membership_payment_settings
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Discounts: authenticated read active; admin full CRUD
GRANT SELECT ON public.membership_discounts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.membership_discounts TO authenticated;

CREATE POLICY membership_discounts_select ON public.membership_discounts
  FOR SELECT TO authenticated
  USING (active = true OR (SELECT public.is_admin()));

CREATE POLICY membership_discounts_insert_admin ON public.membership_discounts
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY membership_discounts_update_admin ON public.membership_discounts
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

CREATE POLICY membership_discounts_delete_admin ON public.membership_discounts
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

-- Submissions: own select/insert; admin select/update via RPC
GRANT SELECT, INSERT ON public.membership_payment_submissions TO authenticated;
GRANT UPDATE ON public.membership_payment_submissions TO authenticated;

CREATE POLICY membership_payment_submissions_select_own_or_admin
  ON public.membership_payment_submissions
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

CREATE POLICY membership_payment_submissions_insert_own
  ON public.membership_payment_submissions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 'pending'
  );

CREATE POLICY membership_payment_submissions_update_admin
  ON public.membership_payment_submissions
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._pick_membership_discount(p_plan text)
RETURNS public.membership_discounts
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  d public.membership_discounts;
BEGIN
  SELECT * INTO d
  FROM public.membership_discounts md
  WHERE md.active = true
    AND (md.plan = p_plan OR md.plan = 'both')
    AND (md.starts_at IS NULL OR md.starts_at <= now())
    AND (md.ends_at IS NULL OR md.ends_at > now())
  ORDER BY md.updated_at DESC, md.created_at DESC
  LIMIT 1;
  RETURN d;
END;
$$;

CREATE OR REPLACE FUNCTION public._compute_membership_quote(p_plan text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  s public.membership_payment_settings;
  d public.membership_discounts;
  list_price numeric(10, 2);
  discount_amt numeric(10, 2) := 0;
  total numeric(10, 2);
  discount_json jsonb := NULL;
BEGIN
  IF p_plan NOT IN ('ni_pro', 'ni_elite') THEN
    RAISE EXCEPTION 'plan must be ni_pro or ni_elite';
  END IF;

  SELECT * INTO s FROM public.membership_payment_settings WHERE id = 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment settings not configured';
  END IF;

  list_price := CASE WHEN p_plan = 'ni_pro' THEN s.pro_price_pen ELSE s.elite_price_pen END;
  d := public._pick_membership_discount(p_plan);

  IF d.id IS NOT NULL THEN
    IF d.type = 'percent' THEN
      discount_amt := round(list_price * d.value / 100.0, 2);
    ELSE
      discount_amt := least(list_price, d.value);
    END IF;
    discount_json := jsonb_build_object(
      'id', d.id,
      'label', d.label,
      'type', d.type,
      'value', d.value
    );
  END IF;

  total := greatest(list_price - discount_amt, 0);

  RETURN jsonb_build_object(
    'plan', p_plan,
    'list_price_pen', list_price,
    'discount_pen', discount_amt,
    'amount_pen', total,
    'discount', discount_json,
    'payment', jsonb_build_object(
      'yape_number', s.yape_number,
      'plin_number', s.plin_number,
      'bank_name', s.bank_name,
      'account_number', s.account_number,
      'cci', s.cci,
      'account_holder', s.account_holder,
      'yape_instructions', s.yape_instructions,
      'plin_instructions', s.plin_instructions,
      'transfer_instructions', s.transfer_instructions
    )
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- User RPC: quote for modal
-- ---------------------------------------------------------------------------
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

GRANT EXECUTE ON FUNCTION public.get_membership_payment_quote(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- User RPC: submit voucher
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

  -- Re-validates eligibility
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

GRANT EXECUTE ON FUNCTION public.submit_membership_payment(text, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin: activate membership from approved submission
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

  -- Also cancel same-or-lower if upgrading to elite from pro
  IF target_level = 2 THEN
    UPDATE public.memberships
    SET status = 'canceled', ends_at = COALESCE(ends_at, now())
    WHERE user_id = p_user_id
      AND status = 'active'
      AND level = 1
      AND (ends_at IS NULL OR ends_at > now());
  END IF;

  INSERT INTO public.memberships (user_id, plan, level, status, starts_at, source)
  VALUES (p_user_id, p_plan, target_level, 'active', now(), 'membership_payment')
  RETURNING * INTO row_out;

  RETURN row_out;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_membership_payment(
  p_submission_id uuid,
  p_decision text,
  p_admin_note text DEFAULT NULL
)
RETURNS public.membership_payment_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  sub public.membership_payment_submissions;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'only admins can review payments';
  END IF;
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'decision must be approved or rejected';
  END IF;

  SELECT * INTO sub
  FROM public.membership_payment_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment submission not found';
  END IF;
  IF sub.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'submission is not pending';
  END IF;

  UPDATE public.membership_payment_submissions
  SET
    status = p_decision,
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    admin_note = NULLIF(trim(both FROM coalesce(p_admin_note, '')), '')
  WHERE id = p_submission_id
  RETURNING * INTO sub;

  IF p_decision = 'approved' THEN
    PERFORM public._activate_membership_from_payment(sub.user_id, sub.plan);
  END IF;

  RETURN sub;
END;
$$;

GRANT EXECUTE ON FUNCTION public.review_membership_payment(uuid, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin: upsert payment settings
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_membership_payment_settings(
  p_yape_number text,
  p_plin_number text,
  p_bank_name text,
  p_account_number text,
  p_cci text,
  p_account_holder text,
  p_pro_price_pen numeric,
  p_elite_price_pen numeric,
  p_yape_instructions text DEFAULT '',
  p_plin_instructions text DEFAULT '',
  p_transfer_instructions text DEFAULT ''
)
RETURNS public.membership_payment_settings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  row_out public.membership_payment_settings;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'only admins can update payment settings';
  END IF;
  IF p_pro_price_pen IS NULL OR p_pro_price_pen < 0 THEN
    RAISE EXCEPTION 'invalid pro price';
  END IF;
  IF p_elite_price_pen IS NULL OR p_elite_price_pen < 0 THEN
    RAISE EXCEPTION 'invalid elite price';
  END IF;

  INSERT INTO public.membership_payment_settings (
    id,
    yape_number,
    plin_number,
    bank_name,
    account_number,
    cci,
    account_holder,
    pro_price_pen,
    elite_price_pen,
    yape_instructions,
    plin_instructions,
    transfer_instructions,
    updated_by
  )
  VALUES (
    1,
    coalesce(trim(both from p_yape_number), ''),
    coalesce(trim(both from p_plin_number), ''),
    coalesce(trim(both from p_bank_name), ''),
    coalesce(trim(both from p_account_number), ''),
    coalesce(trim(both from p_cci), ''),
    coalesce(trim(both from p_account_holder), ''),
    round(p_pro_price_pen, 2),
    round(p_elite_price_pen, 2),
    coalesce(trim(both from p_yape_instructions), ''),
    coalesce(trim(both from p_plin_instructions), ''),
    coalesce(trim(both from p_transfer_instructions), ''),
    auth.uid()
  )
  ON CONFLICT (id) DO UPDATE SET
    yape_number = EXCLUDED.yape_number,
    plin_number = EXCLUDED.plin_number,
    bank_name = EXCLUDED.bank_name,
    account_number = EXCLUDED.account_number,
    cci = EXCLUDED.cci,
    account_holder = EXCLUDED.account_holder,
    pro_price_pen = EXCLUDED.pro_price_pen,
    elite_price_pen = EXCLUDED.elite_price_pen,
    yape_instructions = EXCLUDED.yape_instructions,
    plin_instructions = EXCLUDED.plin_instructions,
    transfer_instructions = EXCLUDED.transfer_instructions,
    updated_by = EXCLUDED.updated_by,
    updated_at = now()
  RETURNING * INTO row_out;

  RETURN row_out;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_membership_payment_settings(
  text, text, text, text, text, text, numeric, numeric, text, text, text
) TO authenticated;

-- ---------------------------------------------------------------------------
-- Admin: list submissions with profile/email
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_membership_payment_submissions_admin()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  plan text,
  method text,
  operation_number text,
  list_price_pen numeric,
  discount_pen numeric,
  amount_pen numeric,
  discount_id uuid,
  status text,
  admin_note text,
  created_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
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
    RAISE EXCEPTION 'only admins can list payment submissions';
  END IF;

  RETURN QUERY
  SELECT
    mps.id,
    mps.user_id,
    mps.plan,
    mps.method,
    mps.operation_number,
    mps.list_price_pen,
    mps.discount_pen,
    mps.amount_pen,
    mps.discount_id,
    mps.status,
    mps.admin_note,
    mps.created_at,
    mps.reviewed_at,
    mps.reviewed_by,
    au.email::text,
    p.nombres,
    p.apellidos
  FROM public.membership_payment_submissions mps
  LEFT JOIN auth.users au ON au.id = mps.user_id
  LEFT JOIN public.profiles p ON p.user_id = mps.user_id
  ORDER BY
    CASE mps.status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
    mps.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_membership_payment_submissions_admin() TO authenticated;

COMMENT ON FUNCTION public.get_membership_payment_quote(text) IS
  'Authenticated: quote + payment instructions for Pro/Elite modal.';
COMMENT ON FUNCTION public.submit_membership_payment(text, text, text) IS
  'Authenticated: create pending voucher submission using server-side quote.';
COMMENT ON FUNCTION public.review_membership_payment(uuid, text, text) IS
  'Admin: approve|reject pending payment; approve activates membership.';
COMMENT ON FUNCTION public.upsert_membership_payment_settings(text, text, text, text, text, text, numeric, numeric, text, text, text) IS
  'Admin: update Yape/Plin/CCI/prices shown in payment modal.';
COMMENT ON FUNCTION public.list_membership_payment_submissions_admin() IS
  'Admin: list membership payment voucher submissions.';
