-- The Fear Archive - verified accounts migration
-- Run this once in the Supabase SQL Editor for an existing project.

begin;

alter table public.profiles
  add column if not exists is_verified boolean not null default false;

alter table public.stories
  add column if not exists author_verified boolean not null default false;

update public.stories as story
set author_verified = profile.is_verified
from public.profiles as profile
where story.author_id = profile.id;

create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  actor_role text := public.get_my_role();
begin
  if actor_role <> 'admin' then
    new.role := old.role;
    new.email := old.email;
    new.is_ghost := old.is_ghost;
    new.is_verified := old.is_verified;
  end if;

  if actor_role not in ('admin', 'moderator') then
    new.username := old.username;
    new.status := old.status;
  end if;

  if current_setting('fear_archive.allow_like_update', true) is distinct from 'true' then
    new.liked_stories := old.liked_stories;
  end if;
  return new;
end;
$function$;

create or replace function public.sync_profile_verification_to_stories()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.is_verified is distinct from old.is_verified then
    update public.stories
      set
        author_verified = new.is_verified,
        status = case
          when new.is_verified and status = 'pending' then 'approved'
          else status
        end
      where author_id = new.id;
  end if;
  return new;
end;
$function$;

drop trigger if exists sync_profile_verification_trigger on public.profiles;
create trigger sync_profile_verification_trigger
  after update of is_verified on public.profiles
  for each row execute function public.sync_profile_verification_to_stories();

create or replace function public.prepare_story_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  actor_role text := public.get_my_role();
  approval_required boolean;
  author_is_verified boolean := false;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null or (auth.uid() <> new.author_id and actor_role not in ('admin', 'moderator')) then
      raise exception 'Story author does not match the authenticated user';
    end if;
    select username, is_verified into new.author_name, author_is_verified
      from public.profiles where id = new.author_id;
    new.author_verified := coalesce(author_is_verified, false);
    if actor_role not in ('admin', 'moderator') then
      new.likes := 0;
      new.liked_by := '{}';
      if new.status <> 'draft' then
        if author_is_verified then
          new.status := 'approved';
        else
          select coalesce((data ->> 'requireApprovalForStories')::boolean, true)
            into approval_required from public.site_settings where id = 1;
          new.status := case when approval_required then 'pending' else 'approved' end;
        end if;
      end if;
    end if;
  else
    new.updated_at := now();
    if actor_role not in ('admin', 'moderator') then
      new.author_id := old.author_id;
    end if;

    select username, is_verified into new.author_name, author_is_verified
      from public.profiles where id = new.author_id;
    new.author_verified := coalesce(author_is_verified, false);

    if actor_role not in ('admin', 'moderator') then
      if old.status = 'draft' and new.status <> 'draft' then
        if author_is_verified then
          new.status := 'approved';
        else
          select coalesce((data ->> 'requireApprovalForStories')::boolean, true)
            into approval_required from public.site_settings where id = 1;
          new.status := case when approval_required then 'pending' else 'approved' end;
        end if;
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

create or replace view public.public_profiles as
select
  id, username, role, status, bio, avatar, youtube, instagram,
  hide_liked_stories, false as is_ghost, null::text as pending_name_change,
  case when hide_liked_stories then '{}'::text[] else liked_stories end as liked_stories,
  created_at, is_verified
from public.profiles
where status = 'approved' and is_ghost = false;

grant select on public.public_profiles to anon, authenticated;

commit;
