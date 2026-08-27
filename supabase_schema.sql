-- The Fear Archive - Supabase schema
-- Run this file in a new Supabase project's SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text not null,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  bio text not null default '',
  avatar text not null default '',
  youtube text,
  instagram text,
  hide_liked_stories boolean not null default false,
  is_ghost boolean not null default false,
  is_verified boolean not null default false,
  pending_name_change text,
  liked_stories text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists is_verified boolean not null default false;

create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content text not null default '',
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  author_verified boolean not null default false,
  category text not null,
  length text not null check (length in ('short', 'medium', 'long')),
  status text not null default 'pending',
  is_adult boolean not null default false,
  source_url text,
  thumbnail_path text,
  likes integer not null default 0 check (likes >= 0),
  liked_by text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stories_title_check check (
    char_length(title) <= 200 and (status = 'draft' or char_length(title) >= 1)
  ),
  constraint stories_content_check check (
    status = 'draft' or char_length(content) >= 50
  ),
  constraint stories_source_url_check check (
    source_url is null or (char_length(source_url) <= 2048 and source_url ~* '^https?://[^[:space:]]+$')
  ),
  constraint stories_status_check check (status in ('draft', 'pending', 'approved', 'rejected'))
);

-- Keep rerunning this schema safe for projects created before draft support.
alter table public.stories add column if not exists updated_at timestamptz not null default now();
alter table public.stories add column if not exists author_verified boolean not null default false;
alter table public.stories add column if not exists is_adult boolean not null default false;
alter table public.stories add column if not exists source_url text;
alter table public.stories add column if not exists thumbnail_path text;
alter table public.stories alter column title set default '';
alter table public.stories alter column content set default '';
alter table public.stories drop constraint if exists stories_title_check;
alter table public.stories drop constraint if exists stories_content_check;
alter table public.stories drop constraint if exists stories_source_url_check;
alter table public.stories drop constraint if exists stories_status_check;
alter table public.stories add constraint stories_title_check check (
  char_length(title) <= 200 and (status = 'draft' or char_length(title) >= 1)
);
alter table public.stories add constraint stories_content_check check (
  status = 'draft' or char_length(content) >= 50
);
alter table public.stories add constraint stories_source_url_check check (
  source_url is null or (char_length(source_url) <= 2048 and source_url ~* '^https?://[^[:space:]]+$')
);
alter table public.stories add constraint stories_status_check
  check (status in ('draft', 'pending', 'approved', 'rejected'));

create index if not exists stories_status_created_idx on public.stories (status, created_at desc);
create index if not exists stories_author_idx on public.stories (author_id);
create index if not exists stories_author_status_updated_idx on public.stories (author_id, status, updated_at desc);

create table if not exists public.story_reports (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  story_title text not null,
  story_author_id uuid not null,
  story_author_name text not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reporter_name text not null,
  reason text not null check (reason in ('harmful', 'copyright', 'spam', 'adult-label', 'other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_report_per_user_and_story
  on public.story_reports (story_id, reporter_id);
create index if not exists story_reports_status_created_idx
  on public.story_reports (status, created_at desc);

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reported_username text not null,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reporter_name text not null,
  reason text not null check (reason in ('harassment', 'impersonation', 'spam', 'inappropriate-profile', 'other')),
  details text not null default '' check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_reports_not_self check (reported_user_id <> reporter_id)
);

create unique index if not exists one_report_per_user_and_profile
  on public.user_reports (reported_user_id, reporter_id);
create index if not exists user_reports_status_created_idx
  on public.user_reports (status, created_at desc);

create table if not exists public.mod_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  username text not null,
  avatar text not null default '',
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reason text not null,
  experience text not null,
  availability text not null,
  timezone text not null,
  age text not null,
  extra_info text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists one_active_mod_application_per_user
  on public.mod_applications (user_id) where status = 'pending';

create table if not exists public.changelogs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date timestamptz not null default now(),
  changes text[] not null default '{}'
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  data jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

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
create policy story_thumbnails_public_read on storage.objects for select
  using (bucket_id = 'story-thumbnails');
create policy story_thumbnails_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'story-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
create policy story_thumbnails_update_own on storage.objects for update to authenticated
  using (bucket_id = 'story-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'story-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
create policy story_thumbnails_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'story-thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.default_site_settings()
returns jsonb
language sql
immutable
set search_path = public
as $function$
  select $json${
    "siteName": "The Fear Archive",
    "siteDescription": "A community-driven platform for horror storytelling",
    "requireApprovalForStories": true,
    "requireApprovalForUsers": true,
    "allowRegistration": true,
    "allowModApplications": true,
    "maxStoryLength": 50000,
    "maintenanceMode": false,
    "showLikeCount": true,
    "featuredCategory": "Horror",
    "categories": [
      {"name":"Horror","description":"Classic tales of terror that prey on primal fears.","colorKey":"red","icon":"skull"},
      {"name":"Supernatural","description":"Ghosts, spirits, and things beyond our reality.","colorKey":"blue","icon":"ghost"},
      {"name":"Psychological","description":"The scariest place of all - the human mind.","colorKey":"amber","icon":"brain"},
      {"name":"Sci-Fi Horror","description":"Where advanced technology meets ancient terror.","colorKey":"cyan","icon":"rocket"},
      {"name":"Gothic","description":"Dark romance, crumbling estates, and ancestral curses.","colorKey":"violet","icon":"castle"},
      {"name":"Urban Legends","description":"Modern myths whispered in the dark.","colorKey":"orange","icon":"map"},
      {"name":"Cosmic Horror","description":"The incomprehensible vastness of uncaring cosmic entities.","colorKey":"emerald","icon":"aperture"},
      {"name":"Folklore","description":"Ancient tales passed down through generations.","colorKey":"rose","icon":"tree-pine"}
    ],
    "storyRules": "Welcome to The Fear Archive. Please read and accept the community rules before submitting a story.",
    "gdprText": "This website complies with Regulation (EU) 2016/679 (General Data Protection Regulation - GDPR)."
  }$json$::jsonb;
$function$;

insert into public.site_settings (id, data)
values (1, public.default_site_settings())
on conflict (id) do nothing;

insert into public.changelogs (id, title, date, changes)
values (
  '00000000-0000-0000-0000-000000000001',
  'Version 1.0 - The Beginning',
  '2024-01-01T00:00:00Z',
  array[
    'Welcome to The Fear Archive!',
    'Added user authentication and profiles.',
    'Added story publishing and reading.',
    'Implemented category filtering and search.'
  ]
)
on conflict (id) do nothing;

create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $function$
  select coalesce((select role from public.profiles where id = auth.uid()), 'anonymous');
$function$;

create or replace function public.is_username_available(requested_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $function$
  select not exists (
    select 1 from public.profiles where lower(username) = lower(trim(requested_username))
  );
$function$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  new_status text;
  requested_username text;
begin
  requested_username := trim(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  if char_length(requested_username) < 3 then
    raise exception 'Username must contain at least 3 characters';
  end if;

  select case
    when coalesce((data ->> 'requireApprovalForUsers')::boolean, true) then 'pending'
    else 'approved'
  end into new_status
  from public.site_settings where id = 1;

  insert into public.profiles (id, username, email, role, status)
  values (new.id, requested_username, new.email, 'user', coalesce(new_status, 'pending'));
  return new;
end;
$function$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

drop trigger if exists protect_profile_fields_trigger on public.profiles;
create trigger protect_profile_fields_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

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

drop trigger if exists prepare_story_write_trigger on public.stories;
create trigger prepare_story_write_trigger
  before insert or update on public.stories
  for each row execute function public.prepare_story_write();

create or replace function public.prepare_story_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  actor_role text := public.get_my_role();
  story_row public.stories%rowtype;
  reporter_row public.profiles%rowtype;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null or auth.uid() <> new.reporter_id then
      raise exception 'A user can only submit a report under their own account';
    end if;

    select * into reporter_row
      from public.profiles
      where id = auth.uid() and status = 'approved';
    if not found then
      raise exception 'Only approved users can report stories';
    end if;

    select * into story_row
      from public.stories
      where id = new.story_id and status = 'approved';
    if not found then
      raise exception 'Only published stories can be reported';
    end if;

    new.story_title := story_row.title;
    new.story_author_id := story_row.author_id;
    new.story_author_name := story_row.author_name;
    new.reporter_name := reporter_row.username;
    new.details := trim(coalesce(new.details, ''));
    new.status := 'open';
    new.reviewed_by := null;
    new.reviewed_at := null;
  else
    if actor_role not in ('admin', 'moderator') then
      raise exception 'Moderator access required';
    end if;

    new.story_id := old.story_id;
    new.story_title := old.story_title;
    new.story_author_id := old.story_author_id;
    new.story_author_name := old.story_author_name;
    new.reporter_id := old.reporter_id;
    new.reporter_name := old.reporter_name;
    new.reason := old.reason;
    new.details := old.details;
    new.updated_at := now();

    if new.status is distinct from old.status then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists prepare_story_report_trigger on public.story_reports;
create trigger prepare_story_report_trigger
  before insert or update on public.story_reports
  for each row execute function public.prepare_story_report();

create or replace function public.prepare_user_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  actor_role text := public.get_my_role();
  reported_user_row public.profiles%rowtype;
  reporter_row public.profiles%rowtype;
begin
  if tg_op = 'INSERT' then
    if auth.uid() is null or auth.uid() <> new.reporter_id then
      raise exception 'A user can only submit a report under their own account';
    end if;

    if new.reported_user_id = new.reporter_id then
      raise exception 'A user cannot report their own account';
    end if;

    select * into reporter_row
      from public.profiles
      where id = auth.uid() and status = 'approved';
    if not found then
      raise exception 'Only approved users can report accounts';
    end if;

    select * into reported_user_row
      from public.profiles
      where id = new.reported_user_id and status = 'approved' and is_ghost = false;
    if not found then
      raise exception 'Only active public accounts can be reported';
    end if;

    new.reported_username := reported_user_row.username;
    new.reporter_name := reporter_row.username;
    new.details := trim(coalesce(new.details, ''));
    new.status := 'open';
    new.reviewed_by := null;
    new.reviewed_at := null;
  else
    if actor_role not in ('admin', 'moderator') then
      raise exception 'Moderator access required';
    end if;

    new.reported_user_id := old.reported_user_id;
    new.reported_username := old.reported_username;
    new.reporter_id := old.reporter_id;
    new.reporter_name := old.reporter_name;
    new.reason := old.reason;
    new.details := old.details;
    new.updated_at := now();

    if new.status is distinct from old.status then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists prepare_user_report_trigger on public.user_reports;
create trigger prepare_user_report_trigger
  before insert or update on public.user_reports
  for each row execute function public.prepare_user_report();

create or replace function public.toggle_like(p_story_id uuid, p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $function$
declare
  was_liked boolean;
  story_row public.stories;
  user_row public.profiles;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'A user can only change their own likes';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and status = 'approved') then
    raise exception 'Only approved users can like stories';
  end if;

  select * into story_row from public.stories where id = p_story_id and status = 'approved' for update;
  if not found then raise exception 'Story not found'; end if;
  was_liked := p_user_id::text = any(coalesce(story_row.liked_by, '{}'));

  perform set_config('fear_archive.allow_like_update', 'true', true);
  if was_liked then
    update public.stories set
      liked_by = array_remove(liked_by, p_user_id::text),
      likes = greatest(0, likes - 1)
    where id = p_story_id;
    update public.profiles set liked_stories = array_remove(liked_stories, p_story_id::text)
      where id = p_user_id;
  else
    update public.stories set
      liked_by = array_append(liked_by, p_user_id::text),
      likes = likes + 1
    where id = p_story_id;
    update public.profiles set liked_stories = array_append(liked_stories, p_story_id::text)
      where id = p_user_id;
  end if;

  select * into story_row from public.stories where id = p_story_id;
  select * into user_row from public.profiles where id = p_user_id;
  return json_build_object('story', row_to_json(story_row), 'user', row_to_json(user_row));
end;
$function$;

create or replace function public.delete_user_account(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $function$
begin
  if auth.uid() is null or (auth.uid() <> target_user_id and public.get_my_role() <> 'admin') then
    raise exception 'Not authorized to delete this account';
  end if;
  delete from auth.users where id = target_user_id;
end;
$function$;

create or replace function public.reset_archive_data()
returns void
language plpgsql
security definer
set search_path = public, auth
as $function$
begin
  if public.get_my_role() <> 'admin' then raise exception 'Admin access required'; end if;
  delete from public.user_reports;
  delete from public.story_reports;
  delete from public.mod_applications;
  delete from public.stories;
  delete from public.changelogs;
  delete from auth.users where id <> auth.uid();
  update public.site_settings set data = public.default_site_settings(), updated_at = now() where id = 1;
  insert into public.changelogs (id, title, date, changes) values (
    '00000000-0000-0000-0000-000000000001', 'Version 1.0 - The Beginning',
    '2024-01-01T00:00:00Z', array['The archive was reset to its default state.']
  );
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

alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.story_reports enable row level security;
alter table public.user_reports enable row level security;
alter table public.mod_applications enable row level security;
alter table public.changelogs enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;
drop policy if exists profiles_update_staff on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_delete_own on public.profiles;
drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth.uid() = id or public.get_my_role() in ('admin', 'moderator'));
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);
create policy profiles_update_staff on public.profiles for update
  using (public.get_my_role() in ('admin', 'moderator'));

drop policy if exists stories_select on public.stories;
drop policy if exists stories_insert on public.stories;
drop policy if exists stories_update_author on public.stories;
drop policy if exists stories_update_admin on public.stories;
drop policy if exists stories_update_staff on public.stories;
drop policy if exists stories_delete_own on public.stories;
drop policy if exists stories_delete_admin on public.stories;
create policy stories_select on public.stories for select using (
  status = 'approved' or auth.uid() = author_id or public.get_my_role() in ('admin', 'moderator')
);
create policy stories_insert on public.stories for insert to authenticated
  with check (auth.uid() = author_id);
create policy stories_update_author on public.stories for update to authenticated
  using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy stories_update_staff on public.stories for update to authenticated
  using (public.get_my_role() in ('admin', 'moderator'));
create policy stories_delete_own on public.stories for delete to authenticated
  using (auth.uid() = author_id);
create policy stories_delete_admin on public.stories for delete to authenticated
  using (public.get_my_role() = 'admin');

drop policy if exists story_reports_select on public.story_reports;
drop policy if exists story_reports_insert on public.story_reports;
drop policy if exists story_reports_update_staff on public.story_reports;
create policy story_reports_select on public.story_reports for select to authenticated
  using (auth.uid() = reporter_id or public.get_my_role() in ('admin', 'moderator'));
create policy story_reports_insert on public.story_reports for insert to authenticated
  with check (auth.uid() = reporter_id and status = 'open');
create policy story_reports_update_staff on public.story_reports for update to authenticated
  using (public.get_my_role() in ('admin', 'moderator'))
  with check (public.get_my_role() in ('admin', 'moderator'));

drop policy if exists user_reports_select on public.user_reports;
drop policy if exists user_reports_insert on public.user_reports;
drop policy if exists user_reports_update_staff on public.user_reports;
create policy user_reports_select on public.user_reports for select to authenticated
  using (auth.uid() = reporter_id or public.get_my_role() in ('admin', 'moderator'));
create policy user_reports_insert on public.user_reports for insert to authenticated
  with check (auth.uid() = reporter_id and reported_user_id <> reporter_id and status = 'open');
create policy user_reports_update_staff on public.user_reports for update to authenticated
  using (public.get_my_role() in ('admin', 'moderator'))
  with check (public.get_my_role() in ('admin', 'moderator'));

drop policy if exists modapps_select_admin on public.mod_applications;
drop policy if exists modapps_select_own on public.mod_applications;
drop policy if exists modapps_insert on public.mod_applications;
drop policy if exists modapps_update on public.mod_applications;
drop policy if exists modapps_delete on public.mod_applications;
drop policy if exists modapps_select on public.mod_applications;
drop policy if exists modapps_update_admin on public.mod_applications;
drop policy if exists modapps_delete_admin on public.mod_applications;
create policy modapps_select on public.mod_applications for select to authenticated
  using (auth.uid() = user_id or public.get_my_role() in ('admin', 'moderator'));
create policy modapps_insert on public.mod_applications for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending');
create policy modapps_update_admin on public.mod_applications for update to authenticated
  using (public.get_my_role() = 'admin');
create policy modapps_delete_admin on public.mod_applications for delete to authenticated
  using (public.get_my_role() = 'admin');

drop policy if exists changelogs_select on public.changelogs;
drop policy if exists changelogs_insert on public.changelogs;
drop policy if exists changelogs_update on public.changelogs;
drop policy if exists changelogs_delete on public.changelogs;
create policy changelogs_select on public.changelogs for select using (true);
create policy changelogs_insert on public.changelogs for insert to authenticated
  with check (public.get_my_role() = 'admin');
create policy changelogs_update on public.changelogs for update to authenticated
  using (public.get_my_role() = 'admin');
create policy changelogs_delete on public.changelogs for delete to authenticated
  using (public.get_my_role() = 'admin');

drop policy if exists settings_select on public.site_settings;
drop policy if exists settings_update on public.site_settings;
drop policy if exists settings_insert on public.site_settings;
create policy settings_select on public.site_settings for select using (true);
create policy settings_update on public.site_settings for update to authenticated
  using (public.get_my_role() = 'admin');
create policy settings_insert on public.site_settings for insert to authenticated
  with check (public.get_my_role() = 'admin');

grant select on public.public_profiles to anon, authenticated;
grant select on public.site_settings, public.changelogs, public.stories to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant insert, update, delete on public.stories to authenticated;
grant select, insert, update on public.story_reports to authenticated;
grant select, insert, update on public.user_reports to authenticated;
grant select, insert, update, delete on public.mod_applications to authenticated;
grant insert, update, delete on public.changelogs to authenticated;
grant insert, update on public.site_settings to authenticated;

revoke all on function public.toggle_like(uuid, uuid) from public;
revoke all on function public.delete_user_account(uuid) from public;
revoke all on function public.reset_archive_data() from public;
grant execute on function public.toggle_like(uuid, uuid) to authenticated;
grant execute on function public.delete_user_account(uuid) to authenticated;
grant execute on function public.reset_archive_data() to authenticated;
grant execute on function public.is_username_available(text) to anon, authenticated;
grant execute on function public.get_my_role() to anon, authenticated;

alter table public.profiles replica identity full;
alter table public.stories replica identity full;
alter table public.mod_applications replica identity full;
alter table public.changelogs replica identity full;
alter table public.site_settings replica identity full;

do $function$
declare table_name text;
begin
  foreach table_name in array array['profiles', 'stories', 'mod_applications', 'changelogs', 'site_settings']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$function$;

-- Bootstrap the first administrator after creating them through Supabase Auth:
-- update public.profiles set role = 'admin', status = 'approved'
-- where email = 'you@example.com';
