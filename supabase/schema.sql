create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.properties (
  id text primary key,
  title text not null,
  area text not null,
  building text not null,
  inventory_type text not null default 'Ready',
  property_type text,
  bedrooms text,
  size text,
  price text,
  view text,
  furnishing text,
  status text default 'Available',
  short_description text,
  notes text,
  image_url text,
  featured boolean not null default false,
  whatsapp_link text,
  owner text not null default 'ali',
  category text not null default 'ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.properties
  add column if not exists title text,
  add column if not exists area text,
  add column if not exists building text,
  add column if not exists inventory_type text default 'Ready',
  add column if not exists property_type text,
  add column if not exists bedrooms text,
  add column if not exists size text,
  add column if not exists price text,
  add column if not exists view text,
  add column if not exists furnishing text,
  add column if not exists status text default 'Available',
  add column if not exists short_description text,
  add column if not exists notes text,
  add column if not exists image_url text,
  add column if not exists featured boolean not null default false,
  add column if not exists whatsapp_link text,
  add column if not exists owner text not null default 'ali',
  add column if not exists category text not null default 'ready',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists properties_owner_idx on public.properties(owner);
create index if not exists properties_area_idx on public.properties(area);
create index if not exists properties_building_idx on public.properties(building);
create index if not exists properties_category_idx on public.properties(category);

drop trigger if exists trg_properties_updated_at on public.properties;
create trigger trg_properties_updated_at
before update on public.properties
for each row
execute function public.set_updated_at();

create table if not exists public.resale_off_plan (
  id text primary key,
  title text not null,
  area text not null,
  building text not null,
  inventory_type text not null default 'Resale Off-Plan',
  property_type text,
  bedrooms text,
  size text,
  price text,
  view text,
  furnishing text,
  status text default 'Available',
  short_description text,
  notes text,
  image_url text,
  featured boolean not null default false,
  whatsapp_link text,
  owner text not null default 'ali',
  category text not null default 'resale-off-plan',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resale_off_plan
  add column if not exists title text,
  add column if not exists area text,
  add column if not exists building text,
  add column if not exists inventory_type text default 'Resale Off-Plan',
  add column if not exists property_type text,
  add column if not exists bedrooms text,
  add column if not exists size text,
  add column if not exists price text,
  add column if not exists view text,
  add column if not exists furnishing text,
  add column if not exists status text default 'Available',
  add column if not exists short_description text,
  add column if not exists notes text,
  add column if not exists image_url text,
  add column if not exists featured boolean not null default false,
  add column if not exists whatsapp_link text,
  add column if not exists owner text not null default 'ali',
  add column if not exists category text not null default 'resale-off-plan',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists resale_off_plan_owner_idx on public.resale_off_plan(owner);
create index if not exists resale_off_plan_area_idx on public.resale_off_plan(area);
create index if not exists resale_off_plan_building_idx on public.resale_off_plan(building);

drop trigger if exists trg_resale_off_plan_updated_at on public.resale_off_plan;
create trigger trg_resale_off_plan_updated_at
before update on public.resale_off_plan
for each row
execute function public.set_updated_at();

create table if not exists public.off_plan_projects (
  id text primary key,
  title text not null,
  developer text,
  area text,
  sub_area text,
  starting_price text,
  payment_plan text,
  handover_date text,
  bedrooms text,
  description text,
  features jsonb not null default '[]'::jsonb,
  image text,
  whatsapp_link text,
  featured boolean not null default false,
  owner text not null default 'ali',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.off_plan_projects
  add column if not exists title text,
  add column if not exists developer text,
  add column if not exists area text,
  add column if not exists sub_area text,
  add column if not exists starting_price text,
  add column if not exists payment_plan text,
  add column if not exists handover_date text,
  add column if not exists bedrooms text,
  add column if not exists description text,
  add column if not exists features jsonb not null default '[]'::jsonb,
  add column if not exists image text,
  add column if not exists whatsapp_link text,
  add column if not exists featured boolean not null default false,
  add column if not exists owner text not null default 'ali',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists off_plan_projects_owner_idx on public.off_plan_projects(owner);
create index if not exists off_plan_projects_area_idx on public.off_plan_projects(area);

drop trigger if exists trg_off_plan_projects_updated_at on public.off_plan_projects;
create trigger trg_off_plan_projects_updated_at
before update on public.off_plan_projects
for each row
execute function public.set_updated_at();

create table if not exists public.prime_areas (
  id text primary key,
  owner text not null default 'ali',
  slug text not null,
  name text,
  area_name text,
  short_title text,
  overview_card_title text,
  aliases jsonb not null default '[]'::jsonb,
  note text,
  excerpt text,
  short_description text,
  hero_title text,
  featured_image text,
  content_body text,
  full_description text,
  lifestyle_text text,
  investment_analysis text,
  bullet_points jsonb not null default '[]'::jsonb,
  notes jsonb not null default '[]'::jsonb,
  image_url text,
  seo_title text,
  seo_description text,
  gallery_images jsonb not null default '[]'::jsonb,
  featured boolean not null default true,
  active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prime_areas
  add column if not exists owner text not null default 'ali',
  add column if not exists slug text,
  add column if not exists name text,
  add column if not exists area_name text,
  add column if not exists short_title text,
  add column if not exists overview_card_title text,
  add column if not exists aliases jsonb not null default '[]'::jsonb,
  add column if not exists note text,
  add column if not exists excerpt text,
  add column if not exists short_description text,
  add column if not exists hero_title text,
  add column if not exists featured_image text,
  add column if not exists content_body text,
  add column if not exists full_description text,
  add column if not exists lifestyle_text text,
  add column if not exists investment_analysis text,
  add column if not exists bullet_points jsonb not null default '[]'::jsonb,
  add column if not exists notes jsonb not null default '[]'::jsonb,
  add column if not exists image_url text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists gallery_images jsonb not null default '[]'::jsonb,
  add column if not exists featured boolean not null default true,
  add column if not exists active boolean not null default true,
  add column if not exists display_order integer not null default 0,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists prime_areas_owner_slug_idx on public.prime_areas (owner, slug);
create index if not exists prime_areas_owner_idx on public.prime_areas(owner);

drop trigger if exists trg_prime_areas_updated_at on public.prime_areas;
create trigger trg_prime_areas_updated_at
before update on public.prime_areas
for each row
execute function public.set_updated_at();

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

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_fa text,
  slug text not null unique,
  excerpt_en text,
  excerpt_fa text,
  content_en text,
  content_fa text,
  cover_image_url text,
  category text,
  author text,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts
  add column if not exists title_en text,
  add column if not exists title_fa text,
  add column if not exists slug text,
  add column if not exists excerpt_en text,
  add column if not exists excerpt_fa text,
  add column if not exists content_en text,
  add column if not exists content_fa text,
  add column if not exists cover_image_url text,
  add column if not exists category text,
  add column if not exists author text,
  add column if not exists status text not null default 'draft',
  add column if not exists published_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists blog_posts_slug_idx on public.blog_posts(slug);
create index if not exists blog_posts_status_idx on public.blog_posts(status);
create index if not exists blog_posts_published_at_idx on public.blog_posts(published_at desc);

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at
before update on public.blog_posts
for each row
execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists "blog_posts_public_read_published" on public.blog_posts;
create policy "blog_posts_public_read_published"
on public.blog_posts
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "blog_posts_authenticated_manage" on public.blog_posts;
create policy "blog_posts_authenticated_manage"
on public.blog_posts
for all
to authenticated
using (true)
with check (true);
