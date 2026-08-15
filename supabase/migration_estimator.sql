-- =====================================================================
-- 3D Verse — Cost Estimator admin defaults (admin-only, not public).
-- A singleton table holding the editable default pricing values used by
-- the admin Cost Estimator. Kept out of site_settings on purpose because
-- site_settings is publicly readable and these are internal cost figures.
-- Idempotent — safe to re-run.
-- =====================================================================
create table if not exists public.admin_settings (
  id int primary key default 1,
  estimator jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint admin_settings_singleton check (id = 1)
);

alter table public.admin_settings enable row level security;

drop policy if exists "Admins read admin_settings" on public.admin_settings;
create policy "Admins read admin_settings" on public.admin_settings
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins write admin_settings" on public.admin_settings;
create policy "Admins write admin_settings" on public.admin_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Seed the original defaults from the estimator spec (only if not present).
insert into public.admin_settings (id, estimator) values (
  1,
  jsonb_build_object(
    'filamentCostPerKg', 1700,
    'labourPercent', 15,
    'profitMargin', 60,
    'electricityRate', 16,
    'printerWattage', 500,
    'machineRatePerHour', 20,
    'freeHours', 1.5
  )
) on conflict (id) do nothing;
