-- Run as an administrative test session. Every change is rolled back.
begin;
update public.listing_sync_settings set enabled=true,last_sent_at=null where singleton;
do $$
declare
  r jsonb := '{"source_id":"ffffffff-ffff-4fff-8fff-ffffffffffff","source_tab":"Dubai","publish":true,"area":"Test Area","building":"Test Building","property_type":"apartment","bedrooms":"2","size":"1234","price":"2000000","view":"Sea","category":"ready","status":"Available","handover":""}';
  payload jsonb; result jsonb; n integer;
begin
  perform public.apply_listing_sheet_sync(jsonb_build_array(r),now());
  update public.properties set image_url='https://example.com/photo.jpg',gallery_images='["https://example.com/gallery.jpg"]',floor_plan_url='https://example.com/plan.pdf',notes='PRIVATE',featured=true
    where id='dl-ffffffff-ffff-4fff-8fff-ffffffffffff';
  r := r || '{"price":"2100000","notes":"must not overwrite"}';
  perform public.apply_listing_sheet_sync(jsonb_build_array(r),now()+interval '1 second');
  select count(*) into n from public.properties where id='dl-ffffffff-ffff-4fff-8fff-ffffffffffff' and price='2100000' and notes='PRIVATE' and featured and floor_plan_url='https://example.com/plan.pdf' and jsonb_array_length(gallery_images)=1;
  if n<>1 then raise exception 'FAIL: media/privacy preservation'; end if;
  r := r || '{"category":"resale-off-plan","handover":"2027"}';
  perform public.apply_listing_sheet_sync(jsonb_build_array(r),now()+interval '2 seconds');
  select count(*) into n from public.resale_off_plan where id='dl-ffffffff-ffff-4fff-8fff-ffffffffffff' and price='2100000' and notes='PRIVATE' and featured and floor_plan_url='https://example.com/plan.pdf';
  if n<>1 or exists(select 1 from public.properties where id='dl-ffffffff-ffff-4fff-8fff-ffffffffffff') then raise exception 'FAIL: atomic category move'; end if;
  r := r || '{"publish":false}';
  perform public.apply_listing_sheet_sync(jsonb_build_array(r),now()+interval '3 seconds');
  if not exists(select 1 from public.resale_off_plan where id='dl-ffffffff-ffff-4fff-8fff-ffffffffffff' and status='hidden') then raise exception 'FAIL: unpublish'; end if;
  result := public.apply_listing_sheet_sync(jsonb_build_array(r),now());
  if result->>'stale' <> 'true' then raise exception 'FAIL: stale request'; end if;
  begin
    perform public.apply_listing_sheet_sync(jsonb_build_array(r,r),now()+interval '4 seconds');
    raise exception 'FAIL: duplicate accepted';
  exception when others then
    if sqlerrm <> 'Duplicate Website ID' then raise; end if;
  end;
  perform public.apply_listing_sheet_sync('[]',now()+interval '5 seconds');
  if not exists(select 1 from public.resale_off_plan where id='dl-ffffffff-ffff-4fff-8fff-ffffffffffff') then raise exception 'FAIL: absent row deleted'; end if;
  r := r || '{"publish":true,"category":"ready"}';
  perform public.apply_listing_sheet_sync(jsonb_build_array(r),now()+interval '6 seconds');
  if not exists(select 1 from public.properties where id='dl-ffffffff-ffff-4fff-8fff-ffffffffffff' and status='Available' and notes='PRIVATE' and jsonb_array_length(gallery_images)=1) then raise exception 'FAIL: restore ready with media'; end if;
end $$;
select 'PASS: price, media, privacy, category transitions, hide/show, stale request, duplicate rejection, missing-row preservation' as result;
rollback;
