-- =====================================================================
-- 3DVerse — per-product FAQs + vector line-art images
-- Run in Supabase Dashboard -> SQL Editor -> New query -> Run.
-- =====================================================================

-- 1. Per-product FAQ list: array of { "q": "...", "a": "..." }.
alter table public.products
  add column if not exists faqs jsonb not null default '[]'::jsonb;

-- 2. Replace the old text placeholder images with category vector line-art.
--    Only touches products that still have a text placeholder — any real
--    image you upload later is preserved.
update public.products
set image_url = array['/img/' || (case category
    when 'medical-bone-models' then 'medical'
    when 'gadgets' then 'gadgets'
    when 'aquarium' then 'aquarium'
    when 'desk-accessories' then 'desk'
    when 'home-decor' then 'decor'
    when 'gifts' then 'gifts'
    else 'medical'
  end) || '.svg']
where image_url is null
   or array_length(image_url, 1) is null
   or image_url[1] like '%placehold%';
