-- Add channel tracking to applications
alter table public.applications add column channel text default 'web';
alter table public.applications add column channel_ref text;

create index on public.applications (channel);
create index on public.applications (channel_ref);
