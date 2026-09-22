-- Keep membership_plans catalog prices in sync when admin updates payment settings.

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

  UPDATE public.membership_plans
  SET price_monthly_pen = row_out.pro_price_pen
  WHERE slug = 'ni_pro';

  UPDATE public.membership_plans
  SET price_monthly_pen = row_out.elite_price_pen
  WHERE slug = 'ni_elite';

  RETURN row_out;
END;
$$;
