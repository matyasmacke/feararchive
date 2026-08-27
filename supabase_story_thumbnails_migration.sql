-- The Fear Archive - story thumbnail images migration
-- Run this once in the Supabase SQL Editor for an existing project.

begin;

alter table public.stories
  add column if not exists thumbnail_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'story-thumbnails',
  'story-thumbnails',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists story_thumbnails_public_read on storage.objects;
drop policy if exists story_thumbnails_insert_own on storage.objects;
drop policy if exists story_thumbnails_update_own on storage.objects;
drop policy if exists story_thumbnails_delete_own on storage.objects;

create policy story_thumbnails_public_read
  on storage.objects for select
  using (bucket_id = 'story-thumbnails');

create policy story_thumbnails_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'story-thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy story_thumbnails_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'story-thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'story-thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy story_thumbnails_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'story-thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
