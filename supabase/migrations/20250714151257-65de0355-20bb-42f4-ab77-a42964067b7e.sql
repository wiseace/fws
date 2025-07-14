-- Create storage policies for service images
-- Allow authenticated users to view all service images (since bucket is public)
CREATE POLICY "Anyone can view service images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-images');

-- Allow authenticated users to upload service images
CREATE POLICY "Authenticated users can upload service images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own service images
CREATE POLICY "Users can update their own service images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own service images
CREATE POLICY "Users can delete their own service images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-images' 
  AND auth.role() = 'authenticated'
);