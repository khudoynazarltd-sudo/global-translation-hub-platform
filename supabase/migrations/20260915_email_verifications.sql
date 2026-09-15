begin;

create table if not exists public.email_verifications (
  id uuid primary key default gen_random_uuid(),

  email text not null,

  code_hash text not null,

  attempts integer not null default 0
    check (attempts >= 0),

  expires_at timestamptz not null,

  resend_available_at timestamptz not null,

  verified_at timestamptz,

  consumed_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);


create index if not exists email_verifications_email_idx
  on public.email_verifications(email);


create index if not exists email_verifications_expires_at_idx
  on public.email_verifications(expires_at);


alter table public.email_verifications
  enable row level security;


revoke all
  on public.email_verifications
  from anon, authenticated;


grant select, insert, update, delete
  on public.email_verifications
  to service_role;


commit;
