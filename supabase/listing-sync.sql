-- Direct Dubai Listing sync. Run via a reviewed Supabase migration.
create table if not exists public.listing_sync_settings (
  singleton boolean primary key default true check (singleton),
  token_hash text not null,
  enabled boolean not null default false,
  last_sent_at timestamptz,
  last_synced_at timestamptz,
  last_count integer
);
create table if not exists public.listing_sheet_records (
  source_id uuid primary key,
  property_id text not null unique,
  source_tab text not null,
  last_synced_at timestamptz
);
alter table public.listing_sync_settings enable row level security;
alter table public.listing_sheet_records enable row level security;
revoke all on public.listing_sync_settings, public.listing_sheet_records from public, anon, authenticated;
grant select, insert, update, delete on public.listing_sync_settings, public.listing_sheet_records to service_role;

create or replace function public.apply_listing_sheet_sync(p_rows jsonb, p_sent_at timestamptz)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  r jsonb; m public.listing_sheet_records%rowtype;
  settings public.listing_sync_settings%rowtype;
  old_row jsonb; merged jsonb; target_table text; old_table text;
  status_value text; changed integer := 0; new_id text;
begin
  select * into settings from public.listing_sync_settings where singleton for update;
  if not found or not settings.enabled then raise exception 'Sync is not enabled'; end if;
  if p_sent_at is null or p_sent_at > now() + interval '5 minutes' then raise exception 'Invalid timestamp'; end if;
  if settings.last_sent_at is not null and p_sent_at <= settings.last_sent_at then
    return jsonb_build_object('ok', true, 'stale', true, 'count', 0);
  end if;
  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) > 2000 then raise exception 'Invalid rows'; end if;
  if exists(select 1 from jsonb_array_elements(p_rows) x group by x->>'source_id' having count(*) > 1) then
    raise exception 'Duplicate Website ID';
  end if;
  for r in select value from jsonb_array_elements(p_rows) loop
    if r->>'source_id' is null or jsonb_typeof(r->'publish') is distinct from 'boolean' then raise exception 'Invalid control columns'; end if;
    select * into m from public.listing_sheet_records where source_id = (r->>'source_id')::uuid;
    if not found and not (r->>'publish')::boolean then continue; end if;
    if not found then
      new_id := 'dl-' || (r->>'source_id');
      insert into public.listing_sheet_records(source_id, property_id, source_tab)
        values((r->>'source_id')::uuid, new_id, r->>'source_tab') returning * into m;
    end if;
    old_row := null; old_table := null;
    select to_jsonb(p) into old_row from public.properties p where id = m.property_id for update;
    if found then old_table := 'properties'; else
      select to_jsonb(p) into old_row from public.resale_off_plan p where id = m.property_id for update;
      if found then old_table := 'resale_off_plan'; end if;
    end if;
    if old_row is not null and old_row->>'owner' is distinct from 'ali' then raise exception 'Invalid owner'; end if;
    if not (r->>'publish')::boolean then
      if old_table is not null then
        execute format('update public.%I set status = ''hidden'', updated_at = now() where id = $1', old_table) using m.property_id;
      end if;
    else
      if coalesce(btrim(r->>'building'),'') = '' or coalesce(btrim(r->>'area'),'') = '' then raise exception 'Missing building or area'; end if;
      if r->>'category' not in ('ready','resale-off-plan') or r->>'status' not in ('Available','hidden','sold') then raise exception 'Invalid category or status'; end if;
      target_table := case when r->>'category' = 'resale-off-plan' then 'resale_off_plan' else 'properties' end;
      -- Merge only explicitly public listing fields. Never accept notes, owners,
      -- phone numbers, media, featured flags or arbitrary database keys.
      merged := coalesce(old_row, jsonb_build_object('owner','ali','featured',false,'gallery_images','[]'::jsonb,'created_at',now())) ||
        jsonb_build_object('id',m.property_id,'area',r->>'area','building',r->>'building',
          'property_type',r->>'property_type','bedrooms',r->>'bedrooms','size',r->>'size',
          'price',r->>'price','view',r->>'view','category',r->>'category',
          'inventory_type',case when r->>'category' = 'ready' then 'Ready' else 'Resale Off-Plan' end,
          'project',r->>'building','handover',r->>'handover','status',r->>'status','updated_at',now());
      if coalesce(merged->>'title','') = '' then merged := merged || jsonb_build_object('title',(r->>'building') || ' · ' || (r->>'bedrooms')); end if;
      if old_table = target_table then
        -- Narrow UPDATE keeps concurrent admin changes to photos and descriptions.
        execute format('update public.%I set area=$2->>''area'', building=$2->>''building'', property_type=$2->>''property_type'', bedrooms=$2->>''bedrooms'', size=$2->>''size'', price=$2->>''price'', view=$2->>''view'', status=$2->>''status'', updated_at=now() where id=$1',target_table)
          using m.property_id, merged;
        if target_table = 'properties' then
          update public.properties set category='ready', inventory_type='Ready' where id=m.property_id;
        else
          update public.resale_off_plan set handover=r->>'handover', project=r->>'building' where id=m.property_id;
        end if;
      else
        -- A completion/category change moves the full stored record atomically.
        execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I, $1)',target_table,target_table) using merged;
        if old_table is not null then execute format('delete from public.%I where id=$1',old_table) using m.property_id; end if;
      end if;
    end if;
    update public.listing_sheet_records set source_tab=r->>'source_tab',last_synced_at=now() where source_id=m.source_id;
    changed := changed + 1;
  end loop;
  -- Missing rows never delete properties; explicitly untick before removing a row.
  update public.listing_sync_settings set last_sent_at=p_sent_at,last_synced_at=now(),last_count=changed where singleton;
  return jsonb_build_object('ok',true,'count',changed);
end $$;
revoke all on function public.apply_listing_sheet_sync(jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.apply_listing_sheet_sync(jsonb,timestamptz) to service_role;
