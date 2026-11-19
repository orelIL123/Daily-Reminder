-- Seed: categories + launch catalogue. Demo pieces use slugs starting with 'demo-' so they are easy to remove.
grant execute on function public.is_admin() to anon;  -- read policies call it for visitors too; it simply returns false

insert into public.categories (slug, name_he, name_en, sort_order) values
  ('tzitzit', 'חולצות ציצית', 'Tzitzit Tees', 1),
  ('hoodies', 'קפוצ''ונים', 'Hoodies', 2),
  ('sweatshirts', 'סווטשירטים', 'Sweatshirts', 3),
  ('outerwear', 'עליוניות', 'Outerwear', 4),
  ('tees', 'טישרטים', 'T-Shirts', 5);

with p as (
  insert into public.products (slug, category_id, name_he, name_en, description_he, description_en, status, price, sort_order)
  values ('yishtabach-tzitzit-tee', (select id from public.categories where slug = 'tzitzit'), 'ישתבח — חולצת ציצית', 'Yishtabach — Tzitzit Tee', 'חולצת ציצית אוברסייז מכותנה כבדה, עם ציציות חבוקות בצדדים והדפס "ישתבח שמו לעד".', 'Oversized heavyweight cotton tee with side tassels and the "Yishtabach Shemo La''ad" print.', 'active', 249, 0)
  returning id
), imgs as (
  insert into public.product_images (product_id, view, url) select id, v.view::public.image_view, v.url from p,
  (values ('front', '/products/tee-front.webp'), ('side', '/products/tee-side.webp'), ('back', '/products/tee-back.webp')) as v(view, url)
)
insert into public.product_variants (product_id, size, color, sku, stock, sort_order)
select p.id, s.size, c.color, 'DR-YSH' || '-' || upper(c.color) || '-' || s.size, 10, s.ord * 10 + c.ord
from p,
  unnest(array['S', 'M', 'L', 'XL', 'XXL']) with ordinality as s(size, ord),
  unnest(array['White']) with ordinality as c(color, ord);

with p as (
  insert into public.products (slug, category_id, name_he, name_en, description_he, description_en, status, price, sort_order)
  values ('demo-essential-zip-jacket', (select id from public.categories where slug = 'outerwear'), 'Essential Zip Jacket', 'Essential Zip Jacket', 'Everyday layering, reimagined. A relaxed silhouette with minimal hardware.', 'Everyday layering, reimagined. A relaxed silhouette with minimal hardware.', 'active', 449, 1)
  returning id
), imgs as (
  insert into public.product_images (product_id, view, url) select id, v.view::public.image_view, v.url from p,
  (values ('front', '/products/jacket-charcoal.svg'), ('side', '/products/jacket-charcoal-side.svg')) as v(view, url)
)
insert into public.product_variants (product_id, size, color, sku, stock, sort_order)
select p.id, s.size, c.color, 'DEMO01' || '-' || upper(c.color) || '-' || s.size, 5, s.ord * 10 + c.ord
from p,
  unnest(array['S', 'M', 'L', 'XL']) with ordinality as s(size, ord),
  unnest(array['Charcoal', 'Black']) with ordinality as c(color, ord);

with p as (
  insert into public.products (slug, category_id, name_he, name_en, description_he, description_en, status, price, sort_order)
  values ('demo-nightfall-hoodie', (select id from public.categories where slug = 'hoodies'), 'Nightfall Hoodie', 'Nightfall Hoodie', 'A heavyweight cotton-blend hoodie designed to be worn on repeat.', 'A heavyweight cotton-blend hoodie designed to be worn on repeat.', 'active', 379, 2)
  returning id
), imgs as (
  insert into public.product_images (product_id, view, url) select id, v.view::public.image_view, v.url from p,
  (values ('front', '/products/hoodie-navy.svg'), ('side', '/products/hoodie-navy-side.svg')) as v(view, url)
)
insert into public.product_variants (product_id, size, color, sku, stock, sort_order)
select p.id, s.size, c.color, 'DEMO02' || '-' || upper(c.color) || '-' || s.size, 5, s.ord * 10 + c.ord
from p,
  unnest(array['S', 'M', 'L', 'XL']) with ordinality as s(size, ord),
  unnest(array['Navy', 'Cream']) with ordinality as c(color, ord);

with p as (
  insert into public.products (slug, category_id, name_he, name_en, description_he, description_en, status, price, sort_order)
  values ('demo-studio-crew', (select id from public.categories where slug = 'sweatshirts'), 'Studio Crew', 'Studio Crew', 'The understated everyday crewneck, with a contemporary drop shoulder.', 'The understated everyday crewneck, with a contemporary drop shoulder.', 'active', 329, 3)
  returning id
), imgs as (
  insert into public.product_images (product_id, view, url) select id, v.view::public.image_view, v.url from p,
  (values ('front', '/products/sweat-gray.svg'), ('side', '/products/sweat-gray-side.svg')) as v(view, url)
)
insert into public.product_variants (product_id, size, color, sku, stock, sort_order)
select p.id, s.size, c.color, 'DEMO03' || '-' || upper(c.color) || '-' || s.size, 5, s.ord * 10 + c.ord
from p,
  unnest(array['XS', 'S', 'M', 'L', 'XL']) with ordinality as s(size, ord),
  unnest(array['Stone', 'Ash']) with ordinality as c(color, ord);

with p as (
  insert into public.products (slug, category_id, name_he, name_en, description_he, description_en, status, price, sort_order)
  values ('demo-alpine-fleece', (select id from public.categories where slug = 'outerwear'), 'Alpine Fleece', 'Alpine Fleece', 'Soft brushed fleece with an easy, relaxed fit.', 'Soft brushed fleece with an easy, relaxed fit.', 'active', 499, 4)
  returning id
), imgs as (
  insert into public.product_images (product_id, view, url) select id, v.view::public.image_view, v.url from p,
  (values ('front', '/products/jacket-cream.svg'), ('side', '/products/jacket-cream-side.svg')) as v(view, url)
)
insert into public.product_variants (product_id, size, color, sku, stock, sort_order)
select p.id, s.size, c.color, 'DEMO04' || '-' || upper(c.color) || '-' || s.size, 5, s.ord * 10 + c.ord
from p,
  unnest(array['S', 'M', 'L']) with ordinality as s(size, ord),
  unnest(array['Ecru', 'Black']) with ordinality as c(color, ord);

with p as (
  insert into public.products (slug, category_id, name_he, name_en, description_he, description_en, status, price, sort_order)
  values ('demo-forest-hoodie', (select id from public.categories where slug = 'hoodies'), 'Forest Hoodie', 'Forest Hoodie', 'Our signature hoodie in deep forest green.', 'Our signature hoodie in deep forest green.', 'active', 399, 5)
  returning id
), imgs as (
  insert into public.product_images (product_id, view, url) select id, v.view::public.image_view, v.url from p,
  (values ('front', '/products/hoodie-green.svg'), ('side', '/products/hoodie-green-side.svg')) as v(view, url)
)
insert into public.product_variants (product_id, size, color, sku, stock, sort_order)
select p.id, s.size, c.color, 'DEMO05' || '-' || upper(c.color) || '-' || s.size, 5, s.ord * 10 + c.ord
from p,
  unnest(array['S', 'M', 'L', 'XL']) with ordinality as s(size, ord),
  unnest(array['Forest', 'Black']) with ordinality as c(color, ord);

with p as (
  insert into public.products (slug, category_id, name_he, name_en, description_he, description_en, status, price, sort_order)
  values ('demo-blackout-overshirt', (select id from public.categories where slug = 'outerwear'), 'Blackout Overshirt', 'Blackout Overshirt', 'A clean, elevated layer for in-between seasons.', 'A clean, elevated layer for in-between seasons.', 'active', 469, 6)
  returning id
), imgs as (
  insert into public.product_images (product_id, view, url) select id, v.view::public.image_view, v.url from p,
  (values ('front', '/products/jacket-black.svg'), ('side', '/products/jacket-black-side.svg')) as v(view, url)
)
insert into public.product_variants (product_id, size, color, sku, stock, sort_order)
select p.id, s.size, c.color, 'DEMO06' || '-' || upper(c.color) || '-' || s.size, 5, s.ord * 10 + c.ord
from p,
  unnest(array['S', 'M', 'L', 'XL']) with ordinality as s(size, ord),
  unnest(array['Black']) with ordinality as c(color, ord);

with p as (
  insert into public.products (slug, category_id, name_he, name_en, description_he, description_en, status, price, sort_order)
  values ('demo-everyday-tee', (select id from public.categories where slug = 'tees'), 'Everyday Tee', 'Everyday Tee', 'An exceptionally comfortable tee cut from soft heavyweight jersey.', 'An exceptionally comfortable tee cut from soft heavyweight jersey.', 'active', 169, 7)
  returning id
), imgs as (
  insert into public.product_images (product_id, view, url) select id, v.view::public.image_view, v.url from p,
  (values ('front', '/products/tee-white.svg'), ('side', '/products/tee-white-side.svg')) as v(view, url)
)
insert into public.product_variants (product_id, size, color, sku, stock, sort_order)
select p.id, s.size, c.color, 'DEMO07' || '-' || upper(c.color) || '-' || s.size, 5, s.ord * 10 + c.ord
from p,
  unnest(array['XS', 'S', 'M', 'L', 'XL']) with ordinality as s(size, ord),
  unnest(array['White', 'Black']) with ordinality as c(color, ord);

with p as (
  insert into public.products (slug, category_id, name_he, name_en, description_he, description_en, status, price, sort_order)
  values ('demo-stonewash-crew', (select id from public.categories where slug = 'sweatshirts'), 'Stonewash Crew', 'Stonewash Crew', 'A washed cotton pullover with a lived-in hand feel.', 'A washed cotton pullover with a lived-in hand feel.', 'active', 349, 8)
  returning id
), imgs as (
  insert into public.product_images (product_id, view, url) select id, v.view::public.image_view, v.url from p,
  (values ('front', '/products/sweat-stone.svg'), ('side', '/products/sweat-stone-side.svg')) as v(view, url)
)
insert into public.product_variants (product_id, size, color, sku, stock, sort_order)
select p.id, s.size, c.color, 'DEMO08' || '-' || upper(c.color) || '-' || s.size, 5, s.ord * 10 + c.ord
from p,
  unnest(array['S', 'M', 'L', 'XL']) with ordinality as s(size, ord),
  unnest(array['Stone', 'Slate']) with ordinality as c(color, ord);

with p as (
  insert into public.products (slug, category_id, name_he, name_en, description_he, description_en, status, price, sort_order)
  values ('demo-coastal-hoodie', (select id from public.categories where slug = 'hoodies'), 'Coastal Hoodie', 'Coastal Hoodie', 'A warm, clean everyday staple.', 'A warm, clean everyday staple.', 'active', 389, 9)
  returning id
), imgs as (
  insert into public.product_images (product_id, view, url) select id, v.view::public.image_view, v.url from p,
  (values ('front', '/products/hoodie-cream.svg'), ('side', '/products/hoodie-cream-side.svg')) as v(view, url)
)
insert into public.product_variants (product_id, size, color, sku, stock, sort_order)
select p.id, s.size, c.color, 'DEMO09' || '-' || upper(c.color) || '-' || s.size, 5, s.ord * 10 + c.ord
from p,
  unnest(array['S', 'M', 'L', 'XL']) with ordinality as s(size, ord),
  unnest(array['Cream', 'Navy']) with ordinality as c(color, ord);
