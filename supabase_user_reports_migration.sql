-- The Fear Archive - user reports migration
-- Run this once in the Supabase SQL Editor for an existing project.

begin;

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

alter table public.user_reports enable row level security;

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

grant select, insert, update on public.user_reports to authenticated;

commit;
