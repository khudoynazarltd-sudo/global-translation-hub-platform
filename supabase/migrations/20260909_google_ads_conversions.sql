begin;

alter table public.enquiries
  add column if not exists google_ads_consent text,
  add column if not exists google_ads_consent_recorded_at timestamptz;

create table if not exists public.google_ads_conversion_outbox (
  order_id uuid primary key references public.orders(id),
  order_reference text not null unique,
  stripe_session_id text not null unique,
  stripe_event_id text not null,
  status text not null default 'pending'
    check (status in ('pending','processing','submitted','validated','failed','unknown','skipped')),
  skip_reason text,
  event_payload jsonb,
  attempts integer not null default 0,
  request_id text,
  last_error text,
  claim_token uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'skipped' and event_payload is null) or
         (status <> 'skipped' and event_payload is not null))
);

alter table public.google_ads_conversion_outbox enable row level security;
revoke all on public.google_ads_conversion_outbox from anon, authenticated;
grant select, insert, update on public.google_ads_conversion_outbox to service_role;

create or replace function public.claim_google_ads_conversion(
  p_order_id uuid, p_claim_token uuid, p_retry boolean default false, p_live boolean default false
) returns setof public.google_ads_conversion_outbox
language sql
set search_path = ''
as $$
  update public.google_ads_conversion_outbox
  set status = 'processing', claim_token = p_claim_token,
      attempts = attempts + 1, updated_at = now(), last_error = null
  where order_id = p_order_id
    and (
      status = 'pending'
      or (p_live and status = 'validated')
      or (p_retry and status in ('failed', 'unknown'))
      or (p_retry and status = 'processing' and updated_at < now() - interval '10 minutes')
    )
  returning *;
$$;
revoke all on function public.claim_google_ads_conversion(uuid, uuid, boolean, boolean)
  from public, anon, authenticated;
grant execute on function public.claim_google_ads_conversion(uuid, uuid, boolean, boolean)
  to service_role;

commit;
