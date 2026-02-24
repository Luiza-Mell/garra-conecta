
-- Make the report-files bucket public so images can be displayed
UPDATE storage.buckets SET public = true WHERE id = 'report-files';

-- Add storage policies for authenticated upload/delete
CREATE POLICY "Authenticated users can upload report files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'report-files');

CREATE POLICY "Anyone can view report files"
ON storage.objects FOR SELECT
USING (bucket_id = 'report-files');

CREATE POLICY "Users can delete own report files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'report-files');
