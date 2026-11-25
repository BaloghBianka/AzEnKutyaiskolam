create table if not exists public.kv (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.kv_history (
  id bigint generated always as identity primary key,
  key text not null,
  data jsonb not null,
  saved_at timestamptz not null default now()
);
create index if not exists kv_history_key_saved on public.kv_history (key, saved_at desc);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  t timestamptz not null default now(),
  entry jsonb not null
);

alter table public.kv enable row level security;
alter table public.kv_history enable row level security;
alter table public.audit_log enable row level security;

revoke all on public.kv, public.kv_history, public.audit_log from anon, authenticated;
grant all on public.kv, public.kv_history, public.audit_log to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;
