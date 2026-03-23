-- Create post-images storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to post-images
CREATE POLICY "Allow authenticated uploads to post-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

-- Allow public read access to post-images
CREATE POLICY "Allow public read of post-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- Allow users to delete their own uploads from post-images
CREATE POLICY "Allow users to delete own post-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-images');
