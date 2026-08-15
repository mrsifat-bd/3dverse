-- Mark products as "popular" so they sort first and power the Popular section.
alter table public.products
  add column if not exists is_popular boolean not null default false;
