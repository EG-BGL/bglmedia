-- Drop the overly permissive INSERT policy
DROP POLICY "Authenticated users can upload scorecard images" ON storage.objects;

-- Create scoped INSERT policy
CREATE POLICY "Users can upload own scorecard images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'scorecard-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Create DELETE policy with ownership check
CREATE POLICY "Users can delete own scorecard images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'scorecard-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);