-- Gatekeeper initial schema. Blocklist stores HMAC-SHA256 values only (computed server-side).
create extension if not exists pgcrypto;

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  rules_md text,
  created_at timestamptz not null default now()
);

create table public.moderators (
  user_id uuid not null references auth.users(id) on delete cascade,
  community_id uuid not null references public.communities(id) on delete cascade,
  primary key (user_id, community_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  name text, handle text, phone text, email text, github text, text text,
  created_at timestamptz not null default now()
);

create table public.decisions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  decision text not null check (decision in ('accept','ask','decline')),
  score int check (score between 0 and 100),
  reason text,
  signals jsonb not null default '{}'::jsonb,
  decided_by text,
  final boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.blocklist_entries (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  phone_hmac text, handle_norm_hmac text, email_hmac text,
  evidence text,
  reporter text,
  status text not null default 'pending' check (status in ('pending','confirmed','appealed','cleared')),
  created_at timestamptz not null default now()
);
create index on public.blocklist_entries (phone_hmac);
create index on public.blocklist_entries (handle_norm_hmac);
create index on public.blocklist_entries (email_hmac);

create table public.appeals (
  id uuid primary key default gen_random_uuid(),
  blocklist_entry_id uuid not null references public.blocklist_entries(id) on delete cascade,
  contact text, message text,
  status text not null default 'open' check (status in ('open','upheld','rejected')),
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id bigserial primary key,
  community_id uuid references public.communities(id),
  actor text, action text not null, details jsonb,
  created_at timestamptz not null default now()
);

-- RLS: on everywhere. Server (service role) bypasses RLS for scoring, HMAC writes and blocklist checks.
alter table public.communities enable row level security;
alter table public.moderators enable row level security;
alter table public.applications enable row level security;
alter table public.decisions enable row level security;
alter table public.blocklist_entries enable row level security;
alter table public.appeals enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_moderator(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.moderators m where m.user_id = auth.uid() and m.community_id = c);
$$;

create policy "communities readable" on public.communities for select to anon, authenticated using (true);
create policy "own moderator rows" on public.moderators for select to authenticated using (user_id = auth.uid());
create policy "mods read own applications" on public.applications for select to authenticated using (public.is_moderator(community_id));
create policy "mods read own decisions" on public.decisions for select to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id and public.is_moderator(a.community_id)));
-- Blocklist: a community sees only its OWN entries (incl. evidence). Other communities never read rows;
-- cross-community matching happens server-side and returns match-only results (no evidence).
create policy "mods read own blocklist entries" on public.blocklist_entries for select to authenticated using (public.is_moderator(community_id));
create policy "mods read own audit log" on public.audit_log for select to authenticated using (public.is_moderator(community_id));
-- No insert/update/delete policies: all writes go through server routes with the service role.

insert into public.communities (slug, name) values
  ('london-agent-builders', 'London Agent Builders'),
  ('south-london-hack-nights', 'South London Hack Nights');
