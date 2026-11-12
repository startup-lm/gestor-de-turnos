-- Registro atómico de liquidaciones: todo o nada en una sola transacción.
CREATE OR REPLACE FUNCTION public.register_commission_payout(
  p_payout JSONB,
  p_appointment_ids BIGINT[],
  p_sale_ids BIGINT[],
  p_advance_ids BIGINT[],
  p_movement JSONB
) RETURNS public.commission_payouts
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_payout public.commission_payouts;
  v_count INTEGER;
BEGIN
  INSERT INTO public.commission_payouts (
    barber_id, period_start, period_end, cuts_count, cuts_commission_amount,
    sales_count, sales_commission_amount, advances_deducted, total_paid,
    payment_method, payment_date, reference_code, receipt_notes, paid_by
  ) VALUES (
    (p_payout->>'barber_id')::BIGINT, (p_payout->>'period_start')::DATE, (p_payout->>'period_end')::DATE,
    (p_payout->>'cuts_count')::INTEGER, (p_payout->>'cuts_commission_amount')::NUMERIC,
    (p_payout->>'sales_count')::INTEGER, (p_payout->>'sales_commission_amount')::NUMERIC,
    (p_payout->>'advances_deducted')::NUMERIC, (p_payout->>'total_paid')::NUMERIC,
    p_payout->>'payment_method', (p_payout->>'payment_date')::DATE,
    NULLIF(p_payout->>'reference_code', ''), NULLIF(p_payout->>'receipt_notes', ''), p_payout->>'paid_by'
  ) RETURNING * INTO v_payout;

  UPDATE public.appointments SET payout_id = v_payout.id
  WHERE id = ANY(COALESCE(p_appointment_ids, '{}')) AND payout_id IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> (SELECT count(DISTINCT x) FROM unnest(COALESCE(p_appointment_ids, '{}')) x) THEN
    RAISE EXCEPTION 'PAYOUT_CONFLICT' USING ERRCODE = 'P0409';
  END IF;

  UPDATE public.sales SET payout_id = v_payout.id
  WHERE id = ANY(COALESCE(p_sale_ids, '{}')) AND payout_id IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> (SELECT count(DISTINCT x) FROM unnest(COALESCE(p_sale_ids, '{}')) x) THEN
    RAISE EXCEPTION 'PAYOUT_CONFLICT' USING ERRCODE = 'P0409';
  END IF;

  UPDATE public.cash_movements SET payout_id = v_payout.id
  WHERE id = ANY(COALESCE(p_advance_ids, '{}')) AND payout_id IS NULL
    AND type = 'advance' AND voided_at IS NULL AND barber_id = v_payout.barber_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count <> (SELECT count(DISTINCT x) FROM unnest(COALESCE(p_advance_ids, '{}')) x) THEN
    RAISE EXCEPTION 'PAYOUT_CONFLICT' USING ERRCODE = 'P0409';
  END IF;

  IF p_movement IS NOT NULL THEN
    INSERT INTO public.cash_movements (
      barber_id, type, category, amount, payment_method, description,
      reference_code, payout_id, shift_id, created_by
    ) VALUES (
      v_payout.barber_id, 'commission_payout', 'comision', (p_movement->>'amount')::NUMERIC,
      p_movement->>'payment_method', p_movement->>'description',
      'REC-' || v_payout.id, v_payout.id, NULLIF(p_movement->>'shift_id', '')::BIGINT, p_movement->>'created_by'
    );
  END IF;

  RETURN v_payout;
END;
$$;

REVOKE ALL ON FUNCTION public.register_commission_payout(JSONB, BIGINT[], BIGINT[], BIGINT[], JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_commission_payout(JSONB, BIGINT[], BIGINT[], BIGINT[], JSONB) TO service_role;
