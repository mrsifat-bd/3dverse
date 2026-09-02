-- =====================================================================
-- 3D Verse — Backend validation for product image uploads.
-- The admin form validates type + size on the client; this enforces the same
-- rules at the Storage layer so a bad file is rejected server-side even if the
-- client checks are bypassed. Only affects NEW uploads; existing objects are
-- untouched. Product images live in the 'product-images' bucket.
-- =====================================================================
update storage.buckets
   set file_size_limit = 8388608,                                  -- 8 MB
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'product-images';
