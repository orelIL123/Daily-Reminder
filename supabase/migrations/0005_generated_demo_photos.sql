-- Replace the illustrated demo garments with generated product photos (front / side / back).

update public.product_images set url = '/products/gen/essential-zip-jacket-front.webp' where view = 'front' and url = '/products/jacket-charcoal.svg';
update public.product_images set url = '/products/gen/essential-zip-jacket-side.webp' where view = 'side' and url = '/products/jacket-charcoal-side.svg';
insert into public.product_images (product_id, view, url)
  select product_id, 'back', '/products/gen/essential-zip-jacket-back.webp' from public.product_images where url = '/products/gen/essential-zip-jacket-front.webp'
  on conflict (product_id, view) where view <> 'detail' do update set url = excluded.url;
update public.product_images set url = '/products/gen/nightfall-hoodie-front.webp' where view = 'front' and url = '/products/hoodie-navy.svg';
update public.product_images set url = '/products/gen/nightfall-hoodie-side.webp' where view = 'side' and url = '/products/hoodie-navy-side.svg';
insert into public.product_images (product_id, view, url)
  select product_id, 'back', '/products/gen/nightfall-hoodie-back.webp' from public.product_images where url = '/products/gen/nightfall-hoodie-front.webp'
  on conflict (product_id, view) where view <> 'detail' do update set url = excluded.url;
update public.product_images set url = '/products/gen/studio-crew-front.webp' where view = 'front' and url = '/products/sweat-gray.svg';
update public.product_images set url = '/products/gen/studio-crew-side.webp' where view = 'side' and url = '/products/sweat-gray-side.svg';
insert into public.product_images (product_id, view, url)
  select product_id, 'back', '/products/gen/studio-crew-back.webp' from public.product_images where url = '/products/gen/studio-crew-front.webp'
  on conflict (product_id, view) where view <> 'detail' do update set url = excluded.url;
update public.product_images set url = '/products/gen/alpine-fleece-front.webp' where view = 'front' and url = '/products/jacket-cream.svg';
update public.product_images set url = '/products/gen/alpine-fleece-side.webp' where view = 'side' and url = '/products/jacket-cream-side.svg';
insert into public.product_images (product_id, view, url)
  select product_id, 'back', '/products/gen/alpine-fleece-back.webp' from public.product_images where url = '/products/gen/alpine-fleece-front.webp'
  on conflict (product_id, view) where view <> 'detail' do update set url = excluded.url;
update public.product_images set url = '/products/gen/forest-hoodie-front.webp' where view = 'front' and url = '/products/hoodie-green.svg';
update public.product_images set url = '/products/gen/forest-hoodie-side.webp' where view = 'side' and url = '/products/hoodie-green-side.svg';
insert into public.product_images (product_id, view, url)
  select product_id, 'back', '/products/gen/forest-hoodie-back.webp' from public.product_images where url = '/products/gen/forest-hoodie-front.webp'
  on conflict (product_id, view) where view <> 'detail' do update set url = excluded.url;
update public.product_images set url = '/products/gen/blackout-overshirt-front.webp' where view = 'front' and url = '/products/jacket-black.svg';
update public.product_images set url = '/products/gen/blackout-overshirt-side.webp' where view = 'side' and url = '/products/jacket-black-side.svg';
insert into public.product_images (product_id, view, url)
  select product_id, 'back', '/products/gen/blackout-overshirt-back.webp' from public.product_images where url = '/products/gen/blackout-overshirt-front.webp'
  on conflict (product_id, view) where view <> 'detail' do update set url = excluded.url;
update public.product_images set url = '/products/gen/everyday-tee-front.webp' where view = 'front' and url = '/products/tee-white.svg';
update public.product_images set url = '/products/gen/everyday-tee-side.webp' where view = 'side' and url = '/products/tee-white-side.svg';
insert into public.product_images (product_id, view, url)
  select product_id, 'back', '/products/gen/everyday-tee-back.webp' from public.product_images where url = '/products/gen/everyday-tee-front.webp'
  on conflict (product_id, view) where view <> 'detail' do update set url = excluded.url;
update public.product_images set url = '/products/gen/stonewash-crew-front.webp' where view = 'front' and url = '/products/sweat-stone.svg';
update public.product_images set url = '/products/gen/stonewash-crew-side.webp' where view = 'side' and url = '/products/sweat-stone-side.svg';
insert into public.product_images (product_id, view, url)
  select product_id, 'back', '/products/gen/stonewash-crew-back.webp' from public.product_images where url = '/products/gen/stonewash-crew-front.webp'
  on conflict (product_id, view) where view <> 'detail' do update set url = excluded.url;
update public.product_images set url = '/products/gen/coastal-hoodie-front.webp' where view = 'front' and url = '/products/hoodie-cream.svg';
update public.product_images set url = '/products/gen/coastal-hoodie-side.webp' where view = 'side' and url = '/products/hoodie-cream-side.svg';
insert into public.product_images (product_id, view, url)
  select product_id, 'back', '/products/gen/coastal-hoodie-back.webp' from public.product_images where url = '/products/gen/coastal-hoodie-front.webp'
  on conflict (product_id, view) where view <> 'detail' do update set url = excluded.url;
