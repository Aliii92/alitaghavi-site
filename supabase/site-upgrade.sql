create table if not exists public.leads (
  id text primary key,
  owner text not null default 'ali',
  advisor_name text,
  source_page text,
  property_id text,
  property_title text,
  area text,
  building text,
  property_type text,
  bedrooms text,
  price text,
  language_mode text,
  whatsapp_target_number text,
  message_preview text,
  referrer_url text,
  user_agent text,
  utm_source text default 'direct',
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  created_at timestamptz not null default now()
);

alter table public.leads
  add column if not exists owner text not null default 'ali',
  add column if not exists advisor_name text,
  add column if not exists source_page text,
  add column if not exists property_id text,
  add column if not exists property_title text,
  add column if not exists area text,
  add column if not exists building text,
  add column if not exists property_type text,
  add column if not exists bedrooms text,
  add column if not exists price text,
  add column if not exists language_mode text,
  add column if not exists whatsapp_target_number text,
  add column if not exists message_preview text,
  add column if not exists referrer_url text,
  add column if not exists user_agent text,
  add column if not exists utm_source text default 'direct',
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists created_at timestamptz not null default now();

create index if not exists leads_owner_idx on public.leads(owner);
create index if not exists leads_created_at_idx on public.leads(created_at desc);


alter table public.leads
 add column if not exists lead_type text not null default 'whatsapp_click',
 add column if not exists name text,
 add column if not exists email text,
 add column if not exists phone text,
 add column if not exists purpose text,
 add column if not exists budget text,
 add column if not exists status text not null default 'new';
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
grant select, insert, update, delete on public.leads to service_role;
alter table public.properties add column if not exists gallery_images jsonb not null default '[]'::jsonb, add column if not exists floor_plan_url text;
alter table public.resale_off_plan add column if not exists gallery_images jsonb not null default '[]'::jsonb, add column if not exists floor_plan_url text;

