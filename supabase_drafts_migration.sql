-- The Fear Archive - draft stories migration
-- Run this once in the Supabase SQL Editor for an existing project.

begin;

alter table public.stories
  add column if not exists updated_at timestamptz not null default now();

alter table public.stories alter column title set default '';
alter table public.stories alter column content set default '';

alter table public.stories drop constraint if exists stories_title_check;
alter table public.stories drop constraint if exists stories_content_check;
alter table public.stories drop constraint if exists stories_status_check;

alter table public.stories add constraint stories_title_check check (
  char_length(title) <= 200 and (status = 'draft' or char_length(title) >= 1)
);
alter table public.stories add constraint stories_content_check check (
  status = 'draft' or char_length(content) >= 50
);
alter table public.stories add constraint stories_status_check
  check (status in ('draft', 'pending', 'approved', 'rejected'));

create index if not exists stories_author_status_updated_idx
  on public.stories (author_id, status, updated_at desc);

create or replace function public.prepare_story_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  actor_role text := public.get_my_role();
  approval_required boolean;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null or (auth.uid() <> new.author_id and actor_role not in ('admin', 'moderator')) then
      raise exception 'Story author does not match the authenticated user';
    end if;

    select username into new.author_name from public.profiles where id = new.author_id;

    if actor_role not in ('admin', 'moderator') then
      new.likes := 0;
      new.liked_by := '{}';
      if new.status <> 'draft' then
        select coalesce((data ->> 'requireApprovalForStories')::boolean, true)
          into approval_required from public.site_settings where id = 1;
        new.status := case when approval_required then 'pending' else 'approved' end;
      end if;
    end if;
  else
    new.updated_at := now();

    if actor_role not in ('admin', 'moderator') then
      new.author_id := old.author_id;
      new.author_name := old.author_name;

      if old.status = 'draft' and new.status <> 'draft' then
        select coalesce((data ->> 'requireApprovalForStories')::boolean, true)
          into approval_required from public.site_settings where id = 1;
        new.status := case when approval_required then 'pending' else 'approved' end;
      elsif old.status <> 'draft' then
        new.status := old.status;
      else
        new.status := 'draft';
      end if;

      if current_setting('fear_archive.allow_like_update', true) is distinct from 'true' then
        new.likes := old.likes;
        new.liked_by := old.liked_by;
      end if;
    end if;
  end if;

  return new;
end;
$function$;

-- Existing RLS already limits non-public stories to their author and staff:
-- status = 'approved' OR auth.uid() = author_id OR role IN ('admin', 'moderator').
drop policy if exists stories_select on public.stories;
create policy stories_select on public.stories for select using (
  status = 'approved'
  or auth.uid() = author_id
  or public.get_my_role() in ('admin', 'moderator')
);

commit;
