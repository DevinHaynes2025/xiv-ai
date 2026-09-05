-- XIV professional identity + private avatar storage
-- Owner-only writes. Authenticated reads for own profile rows (existing profiles RLS).
-- Avatar objects live in a private bucket; the client uses signed URLs.
-- MUST be run in the hosted Supabase SQL editor after 20260904180000_ai_agent_governance.sql.
-- After apply, reload PostgREST if the schema cache is stale:
--   NOTIFY pgrst, 'reload schema';

alter table public.profiles
  add column if not exists avatar_path text,
  add column if not exists professional_title text,
  add column if not exists company text,
  add column if not exists industry text,
  add column if not exists location text,
  add column if not exists expertise text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_select_own on storage.objects;
drop policy if exists avatars_insert_own on storage.objects;
drop policy if exists avatars_update_own on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;

create policy avatars_select_own
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy avatars_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
    and (
      name like '%.jpg'
      or name like '%.jpeg'
      or name like '%.png'
      or name like '%.webp'
    )
  );

create policy avatars_update_own
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy avatars_delete_own
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

notify pgrst, 'reload schema';
