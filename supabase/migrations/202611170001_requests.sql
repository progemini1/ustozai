-- Yo‘lchi: authenticated owners only. Run in the intended Supabase project's SQL Editor.
-- Idempotent for this migration; no table or user data is dropped.
begin;

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  number text not null check (char_length(btrim(number)) between 1 and 40),
  trip_id text not null check (trip_id in ('Y01','Y02','Y03','Y04','Y05')),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  cargo text not null check (char_length(btrim(cargo)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists requests_user_created_at_idx
  on public.requests (user_id, created_at desc);

alter table public.requests enable row level security;
revoke all on table public.requests from public, anon, authenticated;
grant select, insert, update on table public.requests to authenticated;

do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='requests' and policyname='requests_owner_select') then
    create policy requests_owner_select on public.requests
      for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='requests' and policyname='requests_owner_insert') then
    create policy requests_owner_insert on public.requests
      for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='requests' and policyname='requests_owner_update') then
    create policy requests_owner_update on public.requests
      for update to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end;
$policies$;

-- Keep receipt identity/owner/original creation time stable while allowing same-value upserts.
create or replace function public.yolchi_preserve_request_identity()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Receipt identity, owner and creation time cannot be changed'
      using errcode = '23514';
  end if;
  return new;
end;
$function$;

do $trigger$
begin
  if not exists (select 1 from pg_trigger where tgrelid='public.requests'::regclass and tgname='yolchi_preserve_request_identity' and not tgisinternal) then
    create trigger yolchi_preserve_request_identity
      before update on public.requests
      for each row execute function public.yolchi_preserve_request_identity();
  end if;
end;
$trigger$;

comment on table public.requests is 'Yo‘lchi request receipts. Owner-only access with Supabase Auth RLS; no real booking status.';
notify pgrst, 'reload schema';
commit;
