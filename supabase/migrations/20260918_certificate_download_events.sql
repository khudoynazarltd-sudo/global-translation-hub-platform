begin;

create table if not exists public.certificate_download_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  access_token_id uuid references public.order_access_tokens(id) on delete set null,
  downloaded_at timestamptz not null default now()
);

create index if not exists certificate_download_events_order_id_idx
  on public.certificate_download_events(order_id);

create index if not exists certificate_download_events_downloaded_at_idx
  on public.certificate_download_events(downloaded_at);

alter table public.certificate_download_events enable row level security;

revoke all on public.certificate_download_events from anon, authenticated;
grant select, insert, update, delete on public.certificate_download_events to service_role;

commit;