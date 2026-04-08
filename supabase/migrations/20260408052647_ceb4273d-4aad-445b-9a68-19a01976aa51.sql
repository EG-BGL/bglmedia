
INSERT INTO storage.buckets (id, name, public) VALUES ('club-logos', 'club-logos', true);

CREATE POLICY "Anyone can view club logos" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'club-logos');

CREATE POLICY "Admins can manage club logos" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'club-logos' AND public.has_role(auth.uid(), 'league_admin'))
  WITH CHECK (bucket_id = 'club-logos' AND public.has_role(auth.uid(), 'league_admin'));
