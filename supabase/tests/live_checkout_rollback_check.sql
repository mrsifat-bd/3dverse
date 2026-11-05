-- =============================================================================
-- Live checkout check that leaves NOTHING behind.
-- Everything runs inside one DO block that always ends with RAISE EXCEPTION, so
-- Postgres rolls back every row it touched (orders, order_items, order events,
-- delivery payments, admin notifications, cart rows, daily order counter).
-- The results are printed in the error message "QA_RESULT {...}".
-- No email/HTTP is sent from these triggers (checked: no pg_net, no http calls).
-- Runs as the shop admin account (looked up via admin_emails), no customer data.
-- =============================================================================
do $do$
declare
  uid uuid; pid uuid; pid2 uuid; r jsonb; res jsonb := '{}'::jsonb; o record; it record; err text;
  normal jsonb;
  half jsonb := '[{"k":"mandible","s":"S","q":1},{"k":"maxilla","s":"L","q":1},{"k":"occipital","s":"S","q":1},{"k":"frontal","s":"S","q":1},{"k":"temporal","s":"L","q":1},{"k":"parietal","s":"L","q":1},{"k":"sphenoid","s":"S","q":1},{"k":"ethmoid","s":"S","q":1},{"k":"hyoid","s":"S","q":1},{"k":"atlas","s":"S","q":1},{"k":"axis","s":"S","q":1},{"k":"scapula","s":"L","q":1},{"k":"clavicle","s":"L","q":1},{"k":"humerus","s":"L","q":1},{"k":"radius","s":"L","q":1},{"k":"ulna","s":"L","q":1},{"k":"wrist","s":"L","q":1},{"k":"sacrum","s":"S","q":1},{"k":"coccyx","s":"S","q":1},{"k":"hip","s":"L","q":1},{"k":"femur","s":"L","q":1},{"k":"tibia","s":"L","q":1},{"k":"fibula","s":"L","q":1},{"k":"patella","s":"L","q":1},{"k":"foot","s":"L","q":1},{"k":"sternum","s":"S","q":1},{"k":"typical_rib","s":"L","q":1},{"k":"rib1","s":"L","q":1},{"k":"rib2","s":"L","q":1},{"k":"rib11","s":"L","q":1},{"k":"th4","s":"S","q":1},{"k":"th5","s":"S","q":1},{"k":"lumbar_any","s":"S","q":2}]';
  full_ jsonb := '[{"k":"mandible","s":"S","q":1},{"k":"maxilla","s":"L","q":1},{"k":"maxilla","s":"R","q":1},{"k":"occipital","s":"S","q":1},{"k":"frontal","s":"S","q":1},{"k":"temporal","s":"L","q":1},{"k":"temporal","s":"R","q":1},{"k":"parietal","s":"L","q":1},{"k":"parietal","s":"R","q":1},{"k":"sphenoid","s":"S","q":1},{"k":"ethmoid","s":"S","q":1},{"k":"hyoid","s":"S","q":1},{"k":"atlas","s":"S","q":1},{"k":"axis","s":"S","q":1},{"k":"scapula","s":"L","q":1},{"k":"scapula","s":"R","q":1},{"k":"clavicle","s":"L","q":1},{"k":"clavicle","s":"R","q":1},{"k":"humerus","s":"L","q":1},{"k":"humerus","s":"R","q":1},{"k":"radius","s":"L","q":1},{"k":"radius","s":"R","q":1},{"k":"ulna","s":"L","q":1},{"k":"ulna","s":"R","q":1},{"k":"wrist","s":"L","q":1},{"k":"wrist","s":"R","q":1},{"k":"sacrum","s":"S","q":1},{"k":"coccyx","s":"S","q":1},{"k":"hip","s":"L","q":1},{"k":"hip","s":"R","q":1},{"k":"femur","s":"L","q":1},{"k":"femur","s":"R","q":1},{"k":"tibia","s":"L","q":1},{"k":"tibia","s":"R","q":1},{"k":"fibula","s":"L","q":1},{"k":"fibula","s":"R","q":1},{"k":"patella","s":"L","q":1},{"k":"patella","s":"R","q":1},{"k":"foot","s":"L","q":1},{"k":"foot","s":"R","q":1},{"k":"sternum","s":"S","q":1},{"k":"typical_rib","s":"L","q":1},{"k":"typical_rib","s":"R","q":1},{"k":"rib1","s":"L","q":1},{"k":"rib1","s":"R","q":1},{"k":"rib2","s":"L","q":1},{"k":"rib2","s":"R","q":1},{"k":"rib11","s":"L","q":1},{"k":"rib11","s":"R","q":1},{"k":"th4","s":"S","q":1},{"k":"th5","s":"S","q":1},{"k":"lumbar_any","s":"S","q":2}]';
begin
  select u.id into uid from auth.users u join public.admin_emails a on lower(a.email) = lower(u.email) limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uid::text, true);
  select id into pid from public.products where price > 0 order by id limit 1;
  select id into pid2 from public.products where price > 0 order by id offset 1 limit 1;
  normal := jsonb_build_array(jsonb_build_object('product_id', pid, 'quantity', 2), jsonb_build_object('product_id', pid2, 'quantity', 1));

  -- A) normal products only
  r := public.place_order('QA rollback test', '01700000000', 'QA test address', 'QA', normal, 'QATEST0001', 'Sylhet Sadar, Sylhet');
  select subtotal, total, delivery_charge, weight_kg, cod_amount, items into o from public.orders where id = (r->>'order_id')::uuid;
  res := res || jsonb_build_object('A_normal', jsonb_build_object('subtotal', o.subtotal, 'total', o.total, 'delivery', o.delivery_charge, 'weight', o.weight_kg, 'cod', o.cod_amount,
    'lines', (select count(*) from public.order_items where order_id = (r->>'order_id')::uuid), 'items', o.items));

  -- B) builder line with tampered price/total fields (must be ignored): femur L+R + hyoid = 3380
  begin
    r := public.place_order('QA rollback test', '01700000000', 'QA test address', 'QA',
      '[{"kind":"skeleton","price":1,"total":1,"name":"FAKE","config":{"pieces":[{"k":"femur","s":"L","price":1},{"k":"femur","s":"R"},{"k":"hyoid","s":"S"}]}}]'::jsonb, 'QATEST0002', 'Sylhet Sadar, Sylhet');
    select subtotal, total, delivery_charge, weight_kg into o from public.orders where id = (r->>'order_id')::uuid;
    select product_id, product_name_snapshot, unit_price_snapshot, quantity, weight_snapshot, config_snapshot is not null as has_snap into it from public.order_items where order_id = (r->>'order_id')::uuid;
    res := res || jsonb_build_object('B_skeleton', jsonb_build_object('subtotal', o.subtotal, 'delivery', o.delivery_charge, 'weight', o.weight_kg,
      'item_product_id', it.product_id, 'item_name', it.product_name_snapshot, 'item_price', it.unit_price_snapshot, 'qty', it.quantity, 'has_snapshot', it.has_snap));
  exception when others then res := res || jsonb_build_object('B_skeleton_error', sqlerrm); end;

  -- C) Half Set and Full Set built from their bones
  begin
    r := public.place_order('QA rollback test', '01700000000', 'QA test address', 'QA', jsonb_build_array(jsonb_build_object('kind', 'skeleton', 'config', jsonb_build_object('pieces', half))), 'QATEST0003', 'Sylhet Sadar, Sylhet');
    res := res || jsonb_build_object('C_half_subtotal', (select subtotal from public.orders where id = (r->>'order_id')::uuid));
  exception when others then res := res || jsonb_build_object('C_half_error', sqlerrm); end;
  begin
    r := public.place_order('QA rollback test', '01700000000', 'QA test address', 'QA', jsonb_build_array(jsonb_build_object('kind', 'skeleton', 'config', jsonb_build_object('pieces', full_))), 'QATEST0004', 'Sylhet Sadar, Sylhet');
    res := res || jsonb_build_object('C_full_subtotal', (select subtotal from public.orders where id = (r->>'order_id')::uuid),
      'C_full_items_kind', (select items->0->>'kind' from public.orders where id = (r->>'order_id')::uuid));
  exception when others then res := res || jsonb_build_object('C_full_error', sqlerrm); end;

  -- D) normal products + builder line together
  begin
    r := public.place_order('QA rollback test', '01700000000', 'QA test address', 'QA', normal || '[{"kind":"skeleton","config":{"pieces":[{"k":"femur","s":"L"}]}}]'::jsonb, 'QATEST0005', 'Sylhet Sadar, Sylhet');
    res := res || jsonb_build_object('D_mixed_subtotal', (select subtotal from public.orders where id = (r->>'order_id')::uuid),
      'D_mixed_lines', (select count(*) from public.order_items where order_id = (r->>'order_id')::uuid));
  exception when others then res := res || jsonb_build_object('D_mixed_error', sqlerrm); end;

  -- E) two builder lines, F) unknown bone: both must be refused
  begin
    r := public.place_order('QA rollback test', '01700000000', 'QA test address', 'QA', '[{"kind":"skeleton","config":{"pieces":[{"k":"femur","s":"L"}]}},{"kind":"skeleton","config":{"pieces":[{"k":"hyoid","s":"S"}]}}]'::jsonb, 'QATEST0006', 'Sylhet Sadar, Sylhet');
    res := res || jsonb_build_object('E_two_lines', 'ACCEPTED (bad)');
  exception when others then res := res || jsonb_build_object('E_two_lines_refused', sqlerrm); end;
  begin
    r := public.place_order('QA rollback test', '01700000000', 'QA test address', 'QA', '[{"kind":"skeleton","config":{"pieces":[{"k":"unicorn","s":"S"}]}}]'::jsonb, 'QATEST0007', 'Sylhet Sadar, Sylhet');
    res := res || jsonb_build_object('F_unknown', 'ACCEPTED (bad)');
  exception when others then res := res || jsonb_build_object('F_unknown_refused', sqlerrm); end;

  raise exception 'QA_RESULT %', res;
end $do$;
