-- Magic-link leads. Email addresses stay in Supabase Auth; this table stores none.
create table public.community_leads (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.community_leads enable row level security;

create policy "leads read own row"
  on public.community_leads
  for select
  to authenticated
  using (user_id = auth.uid());
