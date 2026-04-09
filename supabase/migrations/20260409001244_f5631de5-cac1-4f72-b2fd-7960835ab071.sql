
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow service role / triggers to insert
CREATE POLICY "Triggers can insert notifications"
  ON public.notifications FOR INSERT
  TO postgres
  WITH CHECK (true);

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = false;

-- Trigger function to notify coaches on result submission
CREATE OR REPLACE FUNCTION public.notify_coaches_on_result()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coach_record RECORD;
  fix RECORD;
BEGIN
  -- Only fire for submitted results
  IF NEW.status <> 'submitted' AND NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  -- For updates, only fire if status just changed
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get fixture details
  SELECT f.*, s.competition_id, s.id as sid
  INTO fix
  FROM fixtures f
  JOIN seasons s ON s.id = f.season_id
  WHERE f.id = NEW.fixture_id;

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Find all coaches in the same season and notify them
  FOR coach_record IN
    SELECT DISTINCT ct.user_id
    FROM coaches_to_teams ct
    JOIN teams t ON t.id = ct.team_id
    WHERE ct.season_id = fix.sid
  LOOP
    INSERT INTO notifications (user_id, title, message, link)
    VALUES (
      coach_record.user_id,
      'New Result Entered',
      'New Result entered, head to the Match Centre to check the scores',
      '/match/' || NEW.fixture_id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_coaches_on_result
  AFTER INSERT OR UPDATE ON public.results
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_coaches_on_result();
