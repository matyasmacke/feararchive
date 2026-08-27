-- The Fear Archive - story reports migration
-- Run this once in the Supabase SQL Editor for an existing project.

begin;

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

alter table public.story_reports enable row level security;

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

grant select, insert, update on public.story_reports to authenticated;

commit;
