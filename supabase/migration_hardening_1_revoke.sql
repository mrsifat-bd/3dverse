-- =============================================================================
-- Hardening part 1 (Oct 2026): close public access to internal functions.
-- Read-only audit of the live project (pg_proc / has_function_privilege)
-- showed these SECURITY DEFINER functions were executable by logged-out
-- visitors. None of them is called by the website code from the browser.
-- Safe to run more than once. No data, prices or order rules change.
-- =============================================================================

-- Close public access to internal functions -----------------------------------
-- create_customer_order: legacy, unused by the site. It trusted prices sent by
-- the caller and needed no login or payment. Kept (not dropped) so this can be
-- reverted with a single GRANT; nobody outside the database can call it now.
revoke all on function public.create_customer_order(text, text, text, text, jsonb) from public, anon, authenticated;

-- build_invoice_for_order: only ever called inside the database (order
-- confirmed trigger, admin_generate_invoice which checks is_admin()).
revoke all on function public.build_invoice_for_order(uuid) from public, anon, authenticated;

-- Numbering: logged-out visitors have no reason to call these. Authenticated
-- keeps EXECUTE because the orders.order_number column default calls
-- gen_order_number() when an admin creates an order from the admin panel.
revoke all on function public.gen_order_number() from public, anon;
revoke all on function public.gen_invoice_number() from public, anon;
revoke all on function public.next_daily_seq(text) from public, anon;
grant execute on function public.gen_order_number() to authenticated;
grant execute on function public.gen_invoice_number() to authenticated;
grant execute on function public.next_daily_seq(text) to authenticated;

-- ROLLBACK (restores the previous grants exactly):
--   grant execute on function public.create_customer_order(text, text, text, text, jsonb) to anon, authenticated;
--   grant execute on function public.build_invoice_for_order(uuid) to authenticated;
--   grant execute on function public.gen_order_number(), public.gen_invoice_number(), public.next_daily_seq(text) to anon;
