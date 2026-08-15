-- =====================================================================
-- 3DVerse — Profile avatars (Phase 2 add-on). Run after migration_ecommerce.sql.
-- =====================================================================

-- Column to store the public avatar URL.
alter table public.profiles add column if not exists avatar_url text not null default '';

-- Public avatars storage bucket.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies: anyone can view; a user can only write files inside their
-- own folder (path = "<user_id>/..."), so nobody can overwrite another's photo.
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars" on storage.objects
  for select to anon, authenticated using (bucket_id = 'avatars');

drop policy if exists "Users upload own avatar" on storage.objects;
create policy "Users upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own avatar" on storage.objects;
create policy "Users update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own avatar" on storage.objects;
create policy "Users delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
