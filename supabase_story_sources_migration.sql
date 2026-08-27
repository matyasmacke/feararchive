-- The Fear Archive - optional story source links migration
-- Run this once in the Supabase SQL Editor for an existing project.

begin;

alter table public.stories
  add column if not exists source_url text;

alter table public.stories
  drop constraint if exists stories_source_url_check;

alter table public.stories
  add constraint stories_source_url_check check (
    source_url is null or (char_length(source_url) <= 2048 and source_url ~* '^https?://[^[:space:]]+$')
  );

commit;
