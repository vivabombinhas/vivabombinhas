-- Create the storage bucket for property photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('imoveis', 'imoveis', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for public read access
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'imoveis');

-- Policy for authenticated users to upload photos
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'imoveis' AND 
    auth.role() = 'authenticated'
  );

-- Policy for authenticated users to delete photos
CREATE POLICY "Authenticated users can delete photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'imoveis' AND 
    auth.role() = 'authenticated'
  );

-- Policy for authenticated users to update photos
CREATE POLICY "Authenticated users can update photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'imoveis' AND 
    auth.role() = 'authenticated'
  );
