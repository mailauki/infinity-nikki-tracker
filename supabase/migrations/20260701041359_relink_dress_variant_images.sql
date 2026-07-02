-- Relink image_url on dress variants that were re-inserted blank but whose image
-- files survive in storage. Pick the most recent object in each variant's folder.
UPDATE outfit_variants v
SET image_url = 'https://ykfuevyqpjvtxidjnhxm.supabase.co/storage/v1/object/public/images/' || (
  SELECT o.name
  FROM storage.objects o
  WHERE o.bucket_id = 'images'
    AND o.name LIKE 'outfit_variants/' || v.slug || '/%'
  ORDER BY o.created_at DESC
  LIMIT 1
)
WHERE v.outfit_category = 'dresses'
  AND v.image_url IS NULL
  AND EXISTS (
    SELECT 1 FROM storage.objects o
    WHERE o.bucket_id = 'images'
      AND o.name LIKE 'outfit_variants/' || v.slug || '/%'
  );
