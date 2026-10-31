-- ============================================================================
-- MoveMate: Add max 5 images constraint per listing
-- ============================================================================

-- Function to enforce max 5 images per listing
CREATE OR REPLACE FUNCTION check_max_listing_images()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) FROM listing_images WHERE listing_id = NEW.listing_id
  ) >= 5 THEN
    RAISE EXCEPTION 'Maximum of 5 images per listing';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_listing_images
  BEFORE INSERT ON listing_images
  FOR EACH ROW
  EXECUTE FUNCTION check_max_listing_images();

-- Add update policy for storage objects (needed for image replacement)
CREATE POLICY "Users can update own files in listings bucket"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'listings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
