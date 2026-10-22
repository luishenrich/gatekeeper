-- Add channel tracking to applications
alter table public.applications add column channel text not null default 'web' check (channel in ('whatsapp', 'discord', 'web'));
alter table public.applications add column channel_user_id text;

create index on public.applications (channel);
create index on public.applications (channel_user_id);
