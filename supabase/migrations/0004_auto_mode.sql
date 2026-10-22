-- Per-community auto mode. When enabled, clear accept/decline replies
-- on WhatsApp or Discord are sent without a moderator click.
alter table public.communities
  add column if not exists auto_mode boolean not null default false;

alter table public.decisions
  add column if not exists auto_sent boolean not null default false;
