-- PawInsight AI - Storage bucket for pet images

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-images',
  'pet-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY pet_images_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'pet-images');

CREATE POLICY pet_images_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pet-images'
    AND (storage.extension(name) IN ('jpg', 'jpeg', 'png', 'webp', 'gif'))
  );

CREATE POLICY pet_images_delete ON storage.objects
  FOR DELETE USING (bucket_id = 'pet-images');
