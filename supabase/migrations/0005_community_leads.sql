-- Magic-link leads. Email addresses stay in Supabase Auth; this table stores none.
-- If the earlier user_id-only draft of this file was applied, drop public.community_leads and rerun.
create table public.community_leads (
  user_id uuid not null references auth.users (id) on delete cascade,
  community_id uuid not null references public.communities (id) on delete cascade,
  role text not null default 'lead',
  primary key (user_id, community_id)
);

alter table public.community_leads enable row level security;

create policy "leads read own rows"
  on public.community_leads
  for select
  to authenticated
  using (user_id = auth.uid());
