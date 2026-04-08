
-- Create storage bucket for scorecard images
INSERT INTO storage.buckets (id, name, public) VALUES ('scorecard-images', 'scorecard-images', true);

-- Allow public read
CREATE POLICY "Public can view scorecard images"
ON storage.objects FOR SELECT
USING (bucket_id = 'scorecard-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload scorecard images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'scorecard-images' AND auth.role() = 'authenticated');

-- Allow users to update their own uploads
CREATE POLICY "Users can update own scorecard images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'scorecard-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Replace the auto-confirm trigger function to auto-approve all submissions
CREATE OR REPLACE FUNCTION public.auto_confirm_matching_results()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  fix RECORD;
BEGIN
  -- Only process submitted results
  IF NEW.status <> 'submitted' THEN
    RETURN NEW;
  END IF;

  -- Get the fixture
  SELECT * INTO fix FROM public.fixtures WHERE id = NEW.fixture_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Auto-approve immediately
  NEW.status := 'approved';
  NEW.approved_at := now();

  -- Update fixture status to completed
  UPDATE public.fixtures SET status = 'completed' WHERE id = NEW.fixture_id;

  -- Update ladder entries
  PERFORM public.update_ladder_from_result(
    NEW.fixture_id, NEW.home_goals, NEW.home_behinds, NEW.away_goals, NEW.away_behinds
  );

  RETURN NEW;
END;
$function$;

-- Make sure the trigger exists
DROP TRIGGER IF EXISTS auto_confirm_results ON public.results;
CREATE TRIGGER auto_confirm_results
  BEFORE INSERT OR UPDATE ON public.results
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_matching_results();
