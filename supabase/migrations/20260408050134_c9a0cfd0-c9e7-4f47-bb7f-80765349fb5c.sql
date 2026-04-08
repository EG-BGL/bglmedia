
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published news" ON public.news
  FOR SELECT TO public USING (is_published = true);

CREATE POLICY "Admins can view all news" ON public.news
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'league_admin'));

CREATE POLICY "Admins manage news" ON public.news
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'league_admin'))
  WITH CHECK (has_role(auth.uid(), 'league_admin'));

CREATE TRIGGER update_news_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
