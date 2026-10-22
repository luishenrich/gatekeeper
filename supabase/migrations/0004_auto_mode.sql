alter table public.communities add column if not exists auto_mode boolean not null default false;
alter table public.audit_log add column if not exists auto boolean not null default false;
