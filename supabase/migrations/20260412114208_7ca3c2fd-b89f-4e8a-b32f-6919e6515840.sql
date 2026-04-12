CREATE POLICY "Admins can manage avatars"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'avatars' AND has_role(auth.uid(), 'league_admin'::app_role))
WITH CHECK (bucket_id = 'avatars' AND has_role(auth.uid(), 'league_admin'::app_role));
