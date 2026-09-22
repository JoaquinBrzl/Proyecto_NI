-- Auto-activate membership when user submits voucher (no admin review UI).

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
    status,
    reviewed_at,
    admin_note
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
    'approved',
    now(),
    'auto-activated on voucher submit'
  )
  RETURNING * INTO row_out;

  PERFORM public._activate_membership_from_payment(uid, p_plan);

  RETURN row_out;
END;
$$;

COMMENT ON FUNCTION public.submit_membership_payment(text, text, text) IS
  'Authenticated: voucher submit auto-approves and activates membership (no admin review).';
