-- The Fear Archive - 18+ story labels migration
-- Run this once in the Supabase SQL Editor for an existing project.

begin;

alter table public.stories
  add column if not exists is_adult boolean not null default false;

commit;
