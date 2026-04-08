CREATE POLICY "Authenticated users can upload scorecard images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'scorecard-images');

CREATE POLICY "Anyone can read scorecard images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'scorecard-images');