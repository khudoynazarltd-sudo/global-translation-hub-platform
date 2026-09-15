begin;

create table if not exists public.payment_links (
  id bigint generated always as identity primary key,

  enquiry_id uuid not null
    references public.enquiries(id)
    on delete cascade,

  short_code text not null unique,

  stripe_session_id text not null unique,

  stripe_checkout_url text not null,

  status text not null default 'active'
    check (
      status in (
        'active',
        'paid',
        'expired',
        'revoked'
      )
    ),

  expires_at timestamptz not null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  unique (enquiry_id)
);


create index if not exists payment_links_short_code_idx
  on public.payment_links(short_code);


create index if not exists payment_links_status_idx
  on public.payment_links(status);


alter table public.payment_links
  enable row level security;


revoke all
  on public.payment_links
  from anon, authenticated;


grant select, insert, update, delete
  on public.payment_links
  to service_role;


grant usage, select
  on sequence public.payment_links_id_seq
  to service_role;


commit;